import { isBlankString, isDef, isUndef } from "../helpers/is";
import { lower, trimAll } from "../helpers/strings";
import { Reference, ref } from "../helpers/ref";
import { VNodeAttrs, VNodeEvents, VNodeStyle } from "../vdom/vnode";
import { ASTElement, ASTExpression, ASTFlags, ASTNode, ASTText, ASTType } from "./ast/astelement";
import { parseLoop } from "./ast/loop";
import { warn } from "../core/logging";
import { parseStatement } from "./parser";
import { applyAll } from "../helpers/functions";

const functionalAttrs = ['loop', 'if', 'elif', 'else'];
const specialAttrs = ['style', 'class', 'key'];

const stringExpRE = /^\s*\{\{\s*(.+)*\s*\}\}\s*$/;
const bindingRE = /^:/g;
const eventRE = /^@/g;


export function compileFromDOM(el: Element|Node): ASTNode {
  return _compileFromDOM(el, true)
}

function _compileFromDOM(el: Element|Node, isRoot=false): ASTNode {
  let ast: ASTNode;
  if (el.nodeType === Node.TEXT_NODE) {
    if (isBlankString(el.textContent)) {
      return null;
    } else if (stringExpRE.test(el.textContent)) {
      return new ASTExpression(el, el.textContent);
    } else {
      return new ASTText(el, el.textContent);
    }
  } else if (el.nodeType === Node.ELEMENT_NODE) {
    const elm = <Element>el;
    const children: Array<ASTNode> = [];
    let flags = ref(0);
    let inIf = false;
    let prev: ASTElement = null;

    const { attrs, style, events } = compileAttrs(elm, flags);
    for (let i = 0; i < elm.childNodes.length; ++i) {
      const compiled = compileFromDOM(elm.childNodes[i]);
      if (isUndef(compiled)) {
        continue;
      } else if (compiled.type !== ASTType.ELEMENT) {
        children.push(compiled);
        inIf = false;
        continue;
      }

      const child = <ASTElement>compiled;
      const childAttrs = child.attrs;

      if (isDef(childAttrs.if)) {
        inIf = true;
        addIfStatement(prev = child, 'if');
        children.push(child);
      } else if (inIf && isDef(childAttrs.elif)) {
        prev.if.next = child;
        addIfStatement(prev = child, 'elif');
        child.flags |= ASTFlags.ELIF;
      } else if (inIf && isDef(childAttrs.else)) {
        prev.if.next = child;
        child.flags |= ASTFlags.ELSE;
        sanitizeFunctoinalAttrs(child, 'else');
        inIf = false;
        prev = null;
      } else {
        inIf = false;
        if (isDef(childAttrs.loop)) {
          parseLoop(child);
          sanitizeFunctoinalAttrs(child, 'loop');
        }
        children.push(child);
      }

    }

    ast = new ASTElement(elm, elm.tagName, attrs, children);
    ast.flags |= flags.value;
    (<any>ast).style = style;
  }
  return ast;
}

function addIfStatement(ast: ASTElement, attr: string) {
  const raw = String(ast.attrs[attr]).trim();
  const exp = parseStatement(raw);
  ast.if = { raw, exp, next: null };
  ast.flags |= ASTFlags.IF;
  sanitizeFunctoinalAttrs(ast, attr);
}

function compileAttrs(el: Element, flags: Reference<number>) {
  const attrNames = el.getAttributeNames();
  const attrs: Record<string, {bind:string}|string> = {};
  const events: VNodeEvents = {};
  let _style: { value: string, bound: boolean };

  for (let name of attrNames) {
    if (bindingRE.test(name)) {
      let attr = normalizeBinding(el, name);
      if (functionalAttrs.includes(lower(attr.name))) {
        warn(`Cannot bind "${attr.name}"`);
        continue;
      }
      
      flags.value |= ASTFlags.BIND;

      if (attr.name === 'style') {
        _style = { value: attr.value, bound: true };
        continue;
      }

      attrs[attr.name] = { bind: attr.value };
      // TODO: Add bindings to list
    } else if (eventRE.test(name)) {
      normalizeEvent(el, name);
    } else {
      let value = el.getAttribute(name);
      if (name === 'style') {
        _style = { value, bound: false };
      }
      attrs[name] = value;
    }
  }

  const style = _style ? normalizeStyle(el, _style.value, _style.bound) : null;
  return { attrs, style, events };
}

function normalizeBinding(el: Element, attr: string) {
  const value = trimAll(el.getAttribute(attr));
  const name = attr.slice(1).toLowerCase();
  el.setAttribute(name, value);
  el.removeAttribute(attr);
  return { name, value };
}

function normalizeEvent(el: Element, event: string) {
  warn('Events not yet implemented');
}

function normalizeStyle(el: Element, style: string, isBound: boolean) {
  const vnodeStyle: VNodeStyle = {};
  const all = style.split(/;\s*/).map(s => s.split(/:\s*/));
  all.forEach(x => {
    if (x.length === 2) {
      vnodeStyle[x[0].trim()] = x[1];
    }
  });
  // TODO: filter bound styles
  return vnodeStyle;
}

function sanitizeFunctoinalAttrs(el: ASTElement, keep: string) {
  for (let u of functionalAttrs) {
    if (u !== keep && u in el.attrs) {
      warn(`Cannot have "${u}" attribute with "${keep}".`);
      delete el.attrs[u];
    } else if (isDef(el.attrs[`:${u}`])) {
      warn(`"${u}" is not meant to be bound!`);
      delete el.attrs[u];
    }
  }
}
