
import * as ast from "../compiler/ast/astelement";
import { AnyFunction, Simple, UndefType } from "../types";
import { CommentVNode, TextVNode, UniqueVNodeTags, VNode } from "../vdom/vnode";

const whitespacesRE = /^\s*$/;
const validVarRE = /^[_a-z$]+[\w$]*$/i;

const htmlTags = [
  'a', 'abbr', 'acronym', 'address', 'applet', 'area', 'article', 'aside', 'audio',
  'b', 'base', 'basefont', 'bb', 'bdo', 'big', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption',
  'center', 'cite', 'code', 'col', 'colgroup', 'command', 'datagrid', 'datalist', 'dd', 'del', 'details', 'dfn',
  'dialog', 'dir', 'div', 'dl', 'dt', 'em', 'embed', 'eventsource', 'fieldset', 'figcaption', 'figure', 'font',
  'footer', 'form', 'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr',
  'html', 'i', 'iframe', 'img', 'input', 'ins', 'isindex', 'kbd', 'keygen', 'label', 'legend', 'li', 'link',
  'map', 'mark', 'menu', 'meta', 'meter', 'nav', 'noframes', 'noscript', 'object', 'ol', 'optgroup', 'option',
  'output', 'p', 'param', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select',
  'small', 'source', 'span', 'strike', 'strong', 'style', 'sub', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot',
  'th', 'thead', 'time', 'title', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr'
];

export function isHtmlTag(tag: string) {
  return htmlTags.includes(tag.toLowerCase());
}

export const isArray = Array.isArray;

export function isEmpty(a: any[]|string) {
  return isDef(a) && a.length === 0;
}

export function isUndefOrEmpty(a: any[]|string) {
  return isUndef(a) || a.length === 0;
}

export function isBlankString(s: string) {
  return whitespacesRE.test(s);
}

export function isValidVariable(a: string) {
  return validVarRE.test(a);
}

export function isString(a: any): a is string {
  return typeof a === 'string';
}

export function isNumber(a: any): a is number {
  return typeof a === 'number';
}

export function isBoolean(a: any): a is boolean {
  return typeof a === 'boolean';
}

export function isSimple(a: any): a is Simple {
  return (
    typeof a === 'string' ||
    typeof a === 'number' ||
    typeof a === 'boolean'
  );
}

export function isObjectLike(a: any) {
  return a != null && typeof a === 'object';
}

export function isObject(a: any) {
  return isObjectLike(a) && !isArray(a);
}

export function isUndef(a: any): a is UndefType {
  return a == null;
}

export function isDef(a: any) {
  return a != null;
}

export function isFunc(a: any): a is AnyFunction {
  return typeof a === 'function'; 
}

export function isRegExp(a: any): a is RegExp {
  return a instanceof RegExp;
}

export function isElement(a: any): a is Element {
  return a instanceof Element;
}

export function isVNode(a: any): a is VNode {
  return isDef(a) && a.__isVnode;
}

export function isTextVNode(a: any): a is TextVNode {
  return isVNode(a) && a.tag === UniqueVNodeTags.TEXT;
}

export function isCommentVNode(a: any): a is CommentVNode {
  return isVNode(a) && a.tag === UniqueVNodeTags.COMMENT;
}

export function isASTText(a: ast.ASTNode): a is ast.ASTText {
  return a.type === ast.ASTType.TEXT;
}

export function isASTExpression(a: ast.ASTNode): a is ast.ASTExpression {
  return a.type === ast.ASTType.EXPRESSION;
}

export function isASTElement(a: ast.ASTNode): a is ast.ASTElement {
  return a.type === ast.ASTType.ELEMENT;
}

export function isASTComponent(a: ast.ASTNode): a is ast.ASTComponent {
  return (a.flags & ast.ASTFlags.COMPONENT_MASK) !== 0;
}
