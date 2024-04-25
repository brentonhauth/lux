import { isASTElement, isBlankString, isDef, isHtmlTag, isString, isUndef } from '@lux/helpers/is';
import { stringWrap, trimAll } from '@lux/helpers/strings';
import { Reference, ref } from '@lux/helpers/ref';
import { VNodeStyle } from '@lux/vdom/vnode';
import { ASTComponent, ASTElement, ASTExpression, ASTFlags, ASTNode, ASTText } from './ast/astelement';
import { parseLoop } from './ast/loop';
import { warn } from '@lux/core/logging';
import { parseStatement } from './parser';
import { safeGet } from '@lux/helpers/functions';
import { CompileContext } from '@lux/core/context';
import { dom } from '@lux/helpers/dom';

const functionalAttrs = ['loop', 'if', 'elif', 'else'];
const specialAttrs = ['style', 'class', 'key'];

const stringExpRE = /^\s*\{\{\s*(.+)*\s*\}\}\s*$/;
const bindingRE = /^:/g;
const eventRE = /^@/g;
let domParser: DOMParser;

export function compileFromDOM(el: Element|Node, context: CompileContext): ASTNode {
  return compileFromNode(el, context, true);
}

function compileFromNode(el: Element|Node, context: CompileContext, isRoot=false): ASTNode {
  if (el.nodeType === Node.TEXT_NODE) {
    return compileFromTextNode(el, context, isRoot);
  } else if (el.nodeType === Node.ELEMENT_NODE) {
    return compileFromElementNode(el, context, isRoot);
  }
  return null;
}

function compileFromTextNode(el: Element|Node, context: CompileContext, isRoot=false): ASTExpression|ASTText {
  if (isBlankString(el.textContent)) {
    return null;
  } else if (stringExpRE.test(el.textContent)) {
    return new ASTExpression(el, el.textContent);
  } else {
    return new ASTText(el, el.textContent);
  }
}

function compileFromElementNode(el: Element|Node, context: CompileContext, isRoot=false): ASTElement {
  const elm = <Element>el;
  const children: Array<ASTNode> = [];
  const flags: Reference<ASTFlags> = ref(0);
  const { staticAttrs, dynamicAttrs, classes, style, events } = compileAttrs(elm, flags);

  if (!isHtmlTag(elm.tagName)) {
    const elmTagName = elm.tagName.toLowerCase();
    let index = context.components.findIndex(
      c => c.tag.toLowerCase() === elmTagName);
    if (index !== -1) {
      let comp = context.components[index];
      let root: ASTElement|null;
      if (isDef(comp.ast)) {
        root = comp.ast;
      } else {
        root = <any>compileComponentTemplate(comp.template, context);
        if (isUndef(root)) {
          return null;
        }
      }
      return new ASTComponent(elm, comp, root, staticAttrs, dynamicAttrs);
    }
  }

  let prev: ASTElement|null;
  for (let i = 0; i < elm.childNodes.length; ++i) {
    const childElm = <Element>elm.childNodes[i];
    const child = compileFromNode(childElm, context, false);
    if (isUndef(child)) {
      continue;
    } else if (!isASTElement(child)) {
      children.push(child);
      prev = null;
      continue;
    }
    const childAttrs = child.staticAttrs;
    if (isDef(childAttrs.if)) {
      addIfStatement(prev = child, 'if');
      child.flags |= ASTFlags.IF;
      children.push(child);
    } else if (isDef(prev) && isDef(childAttrs.elif)) {
      prev.if.else = child;
      addIfStatement(prev = child, 'elif');
      child.flags |= ASTFlags.ELIF;
    } else if (isDef(prev) && isDef(childAttrs.else)) {
      prev.if.else = child;
      child.flags |= ASTFlags.ELSE;
      sanitizeFunctoinalAttrs(child, 'else');
      prev = null;
    } else {
      if (isDef(childAttrs.loop)) {
        addLoopStatement(child);
      } else {
        sanitizeFunctoinalAttrs(child);
      }
      children.push(child);
      prev = null;
    }
  }
  const ast = new ASTElement(
    elm, elm.tagName, staticAttrs,
    dynamicAttrs, style, classes, children);
  ast.flags |= flags.value;
  return ast;
}

function addIfStatement(ast: ASTElement, attr: string) {
  const raw = stringWrap(ast.staticAttrs[attr]).trim();
  const exp = parseStatement(raw);
  ast.if = { raw, exp, else: null };
  sanitizeFunctoinalAttrs(ast, attr);
}

function addLoopStatement(ast: ASTElement) {
  const raw = stringWrap(ast.staticAttrs.loop);
  const loop = parseLoop(raw);
  ast.loop = loop;
  ast.flags |= ASTFlags.LOOP;
  sanitizeFunctoinalAttrs(ast, 'loop');
}

function compileComponentTemplate(template: string|Element, context: CompileContext) {
  if (isUndef(template)) { return null; }
  let elm: Element, children: any, childrenCheck = false;
  if (isString(template)) {
    const sel = template.charAt(0) === '#' ? dom.select(template) : null;
    if (isUndef(sel)) {
      if (isUndef(domParser)) { domParser = new DOMParser(); }
      const parsed = domParser.parseFromString(template, 'text/html');
      children = safeGet(parsed, 'children.0.children.1.chilren');
      childrenCheck = true;
    } else {
      elm = sel;
    }
  } else {
    elm = template;
  }
  if (isDef(elm) && dom.tagIs(elm, 'template')) {
    children = safeGet(elm, 'content.children');
    childrenCheck = true;
  }
  if (childrenCheck) {
    if (children?.length !== 1) {
      warn('Component should (only) have 1 root node');
      return null;
    }
    elm = children[0];
  }
  const ast = compileFromDOM(elm, context);
  if (!isASTElement(ast)) {
    warn('Component must be made of elements');
    return null;
  }
  return ast;
}

function compileAttrs(el: Element, flags: Reference<ASTFlags>) {
  const attrNames = el.getAttributeNames();
  const attrValue: Reference<string> = ref();
  const staticAttrs: Record<string, string> = {};
  const dynamicAttrs: Record<string, any> = {};
  const events: Record<string, string> = {};
  const style: VNodeStyle = {};
  const classes: any[] = [];

  for (let name of attrNames) {
    let isBound = false, isEvent = false;
    let trueName: string;
    if (isBound = bindingRE.test(name)) {
      trueName = normalizeBinding(el, name, attrValue);
    } else if (isEvent = eventRE.test(name)) {
      trueName = normalizeEvent(el, name, attrValue);
    } else {
      attrValue.value = dom.getAttr(el, trueName = name);
    }

    if (functionalAttrs.includes(trueName)) {
      if (isBound || isEvent) {
        warn(`Attribute "${trueName}" cannot have prfix "@" or ":"`);
      }
      staticAttrs[trueName] = attrValue.value;
      continue;
    } else if (isEvent) {
      events[trueName] = attrValue.value;
      continue;
    }

    switch (trueName) {
      case 'style':
        normalizeStyle(style, attrValue.value, isBound);
        if (isBound) {
          flags.value |= ASTFlags.DYNAMIC_STYLE;
        }
        break;
      case 'class':
        normalizeClass(classes, attrValue.value, isBound);
        if (isBound) {
          flags.value |= ASTFlags.DYNAMIC_CLASSES;
        }
        break;
      default:
        if (isBound) {
          dynamicAttrs[trueName] = attrValue.value;
          flags.value |= ASTFlags.BIND;
        } else {
          staticAttrs[trueName] = attrValue.value;
        }
        break;
    }
  }

  for (let a in dynamicAttrs) {
    dynamicAttrs[a] = parseStatement(dynamicAttrs[a]);
  }

  return {
    dynamicAttrs,
    staticAttrs,
    events,
    classes,
    style,
  };
}

function normalizeBinding(el: Element, attr: string, bindingValue?: Reference<string>) {
  const value = trimAll(el.getAttribute(attr));
  const name = attr.slice(1).toLowerCase();
  dom.setAttr(el, attr, value);
  dom.delAttr(el, attr);
  bindingValue?.set(value);
  return name;
}

function normalizeEvent(el: Element, event: string, eventValue: Reference<string>): string {
  warn('Events not yet implemented');
  return '';
}

function normalizeStyle(vnodeStyle: VNodeStyle, style: string, isBound: boolean) {
  const all = style.split(/;\s*/).map(s => s.split(/:\s*/));
  all.forEach(x => {
    if (x.length === 2) {
      vnodeStyle[x[0].trim()] = x[1];
    }
  });
}

function normalizeClass(classes: string[], class0: string, isBound: boolean) {
  // Temporary //
  classes.concat(class0.split('\x20'));
}

function sanitizeFunctoinalAttrs(ast: ASTElement, keep?: string) {
  const el = <Element>ast.$el;
  for (let u of functionalAttrs) {
    if (dom.hasAttr(el, u)) {
      if (keep && u !== keep) {
        warn(`Cannot have "${u}" attribute with "${keep}".`);
      }
      delete ast.staticAttrs[u];
      dom.delAttr(el, u);
    }
  }
}
