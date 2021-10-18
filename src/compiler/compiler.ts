import { isBlankString, isDef, isUndef } from "../helpers/is";
import { lower, trimAll } from "../helpers/strings";
import { Reference, ref } from "../helpers/ref";
import { VNodeEvents } from "../vdom/vnode";
import { ASTElement, ASTExpression, ASTFlags, ASTNode, ASTText, ASTType } from "./ast/astelement";
import { parseLoop } from "./ast/loop";
import { warn } from "../core/logging";
import { parseStatement } from "./parser";

const functionalAttrs = ['loop', 'if', 'elif', 'else'];

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

    const { attrs, events } = compileAttrs(elm, flags);
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

  for (let name of attrNames) {
    if (bindingRE.test(name)) {
      let attr = normalizeBinding(el, name);
      if (functionalAttrs.includes(lower(attr.name))) {
        warn(`Cannot bind "${attr.name}"`);
      }
      attrs[attr.name] = { bind: attr.value };
      flags.value |= ASTFlags.BIND;
      // TODO: Add bindings to list
    } else if (eventRE.test(name)) {
      normalizeEvent(el, name);
    } else {
      attrs[name] = el.getAttribute(name);
    }
  }

  return { attrs, events };
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
