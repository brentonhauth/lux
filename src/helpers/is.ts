
import { AnyFunction, Primitive, UndefType } from "../types";
import { CommentVNode, TextVNode, VNode } from "../vdom/vnode";

const whitespacesRE = /^\s*$/;
const validVarRE = /^[_a-z$]+[\w$]*$/i;


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

export function isPrimitive(a: any): a is Primitive {
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
  return isVNode(a) && a.tag === '#text';
}

export function isCommentVNode(a: any): a is CommentVNode {
  return isVNode(a) && a.tag === '#comment';
}
