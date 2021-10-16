
import { isBlankString, isDef, isUndef } from "../helpers/is";
import { trimAll } from "../helpers/strings";
import { VNodeAttrs } from "../vdom/vnode";
import { ASTElement, ASTExpression, ASTFlags, ASTNode, ASTText, ASTType } from "./ast/astelement";
import { parseLoop } from "./ast/loop";

const ignoreAttrs = ['class', 'style', 'loop', 'if', 'elif', 'else'];
const functionalAttrs = ['loop', 'if', 'elif', 'else'];

const stringExpRE = /\s*\{\{\s*[_a-z$]+[\w$]*\s*\}\}\s*/i;
const bindingRE = /^:/g;

export function compileFromDOM(el: Element|Node): ASTNode {
  return _compileFromDOM(el)
}

function _compileFromDOM(el: Element|Node): ASTNode {
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
    const elm = <Element>el, attrNames = elm.getAttributeNames();
    const attrs: VNodeAttrs = {}, children: Array<ASTNode> = [];
    let flags = 0; // default
    let inIf = false;
    let prev: ASTElement = null;

    for (let name of attrNames) {
      attrs[name] = elm.getAttribute(name);
      if (bindingRE.test(name)) {
        flags |= ASTFlags.BIND;
        // TODO: Add bindings to list
      }
    }
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
        child.flags |= ASTFlags.IF;
        child.if = {
          exp: trimAll(childAttrs.if),
          next: null,
        };
        sanitizeFunctoinalAttrs(prev = child, 'if');
        children.push(child);
      } else if (inIf && isDef(childAttrs.elif)) {
        child.flags |= ASTFlags.ELIF;
        prev.if.next = child;
        child.if = {
          exp: trimAll(childAttrs.elif),
          next: null,
        };
        sanitizeFunctoinalAttrs(prev = child, 'elif');
      } else if (inIf && isDef(childAttrs.else)) {
        prev.if.next = child;
        child.flags |= ASTFlags.ELSE;
        sanitizeFunctoinalAttrs(child, 'else');
        inIf = false;
        prev = null;
      } else {
        inIf = false;
        if (isDef(childAttrs['loop'])) {
          parseLoop(child);
          sanitizeFunctoinalAttrs(child, 'loop');
        }
        children.push(child);
      }

    }
    ast = new ASTElement(elm, elm.tagName, attrs, children);
    ast.flags |= flags;
  }
  return ast;
}

function sanitizeFunctoinalAttrs(el: ASTElement, keep: string) {
  for (let u of functionalAttrs) {
    if (u !== keep && u in el.attrs) {
      console.warn(`Cannot have "${u}" attribute with "${keep}".`);
      delete el.attrs[u];
    } else if (isDef(el.attrs[`:${u}`])) {
      console.warn(`"${u}" is not meant to be bound!`);
      delete el.attrs[u];
    }
  }
}
