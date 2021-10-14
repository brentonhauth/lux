import { vnode, VNode } from './vdom/vnode';
import { ArrayOrSingle } from './types';
import { is } from './helpers/is';

// module Lux {
  export function h(tag: Element|string, attrs?: any, children?: ArrayOrSingle<string|VNode>) {
    if (is.element(tag)) {
      console.warn('From element is not yet supported');
      return null;
    }
    if (is.string(attrs) || is.array(attrs)) {
      children = attrs;
      attrs = {};
    }

    return vnode(tag, attrs, children);
  }
//}
