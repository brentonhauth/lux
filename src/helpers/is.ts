
import { AnyFunction, Primitive, UndefType } from "../types";
import { CommentVNode, TextVNode, VNode } from "../vdom/vnode";

export const isArray = Array.isArray;

export function isString(a: any): a is string {
  return typeof a === 'string';
}

export function isNumber(a: any): a is number {
  return typeof a === 'number';
}

export function isPrimitive(a: any): a is Primitive {
  return (
    typeof a === 'string' ||
    typeof a === 'number' ||
    typeof a === 'boolean' ||
    typeof a === 'symbol'
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
