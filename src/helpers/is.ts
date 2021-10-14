// module Lux {

import { Primitive, UndefType } from "../types";
import { CommentVNode, TextVNode, VNode } from "../vdom/vnode";

  export const is = {
    array: Array.isArray,
    string: (a: any): a is string => typeof a === 'string',
    number: (a: any): a is number => typeof a === 'number',
    primitive: (a: any): a is Primitive => (
      typeof a === 'string' ||
      typeof a === 'number' ||
      typeof a === 'boolean' ||
      typeof a === 'symbol'
    ),
    objectLike: (a: any) => a != null && typeof a === 'object',
    object: (a: any) => is.objectLike(a) && !is.array(a),
    undef: (a: any): a is UndefType => a == null,
    def: (a: any) => a != null,
    fn: (a: any) => typeof a === 'function',
    regexp: (a: any): a is RegExp => a instanceof RegExp,
    textNode: (a: Node) => a.nodeType === Node.TEXT_NODE,
    element: (a: any): a is Element => a instanceof Element,
    vnode: (a: any): a is VNode => is.def(a) && a.__isVnode,
    commentVnode: (a: any): a is CommentVNode => is.vnode(a) && a.tag === '#comment',
    textVnode: (a: any): a is TextVNode => is.vnode(a) && a.tag === '#text',
  };
//}
