import { MaybeArray, Simple } from './core/types';
import { EMPTY_ARR, EMPTY_OBJ, arrayWrap } from './helpers/common';
import { isArray, isDef, isReal, isUndef } from './helpers/is';
import { Component } from './vdom/component';
import { type VNode, vnode, vnodeComment, vnodeComponent, vnodeText, VNodeFlags } from './vdom/vnode';



function normalizeChildren(children: MaybeArray<VNode|Simple>): [Array<VNode>, boolean] {
  children = arrayWrap(children);
  const len = children.length;
  let keyed = true;
  for (let i = 0; i < len; ++i) {
    if (isReal(children[i])) {
      children[i] = vnodeText(String(children[i]));
    } else if (isUndef(children[i])) {
      children[i] = vnodeComment();
    } else if (isDef((<VNode>children[i]).key)) {
      continue; // prevents keyed from being set to "false"
    }
    keyed = false;
  }
  return [children as Array<VNode>, keyed];
}


function h(type: string|Component): VNode;
function h(type: string|Component, attrs: object): VNode;
function h(type: string, children: MaybeArray<VNode>): VNode;
function h(type: string, attrs: object, children: MaybeArray<VNode>): VNode;
function h(type: string|Component, attrs?: any|MaybeArray<VNode>, children?: MaybeArray<VNode>): VNode {
  if (isArray(attrs) || isReal(attrs)) {
    children = <any>attrs;
    attrs = null;
  }

  attrs = isDef(attrs)
    ? /* Normalize Attrs */ attrs
    : EMPTY_OBJ;

  if (type instanceof Component) {
    return vnodeComponent(type, attrs);
  }

  let keyed = false;
  if (isDef(children)) {
    [children, keyed] = normalizeChildren(children);
  } else {
    children = EMPTY_ARR as Array<VNode>;
  }

  return vnode(type, attrs, <any>children, (
    VNodeFlags.KEYED_CHILDREN * <any>keyed
  ));
}

h.text = vnodeText;
h.comment = vnodeComment;

export default h;
