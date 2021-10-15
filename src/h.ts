import { vnode, VNode } from './vdom/vnode';
import { ArrayOrSingle } from './types';
import { isArray, isElement, isString } from './helpers/is';

export function h(tag: Element|string, attrs?: any, children?: ArrayOrSingle<string|VNode>) {
  if (isElement(tag)) {
    console.warn('From element is not yet supported');
    return null;
  }
  if (isString(attrs) || isArray(attrs)) {
    children = attrs;
    attrs = {};
  }

  return vnode(tag, attrs, children);
}
