
import { arrayWrap, normalizedArray } from "../helpers/array";
import { isArray, isCommentVNode, isDef, isString, isTextVNode, isUndef, isVNode } from "../helpers/is";
import { ArrayOrSingle } from "../types";

export const enum VNodeCloneFlags {
  DEEP = 1,
  ELEMENT = 2,
  DEFAULT = DEEP|0,
};

export const enum VNodeFlags {
  STATIC = 1,
  TEXT = 2,
  COMMENT = 4,
  DEFAULT = STATIC|0,
}

export type VNodeAttrs = Record<string, string | number | boolean>;
export type VNodeClass = ArrayOrSingle<string>|Record<string, boolean>;
export type VNodeStyle = Record<string, string|number>;
export type VNodeEvents = Record<string, Event>;
export type VNodeChildren = ArrayOrSingle<VNode|string>;

export interface VNodeData {
  attrs?: VNodeAttrs;
  class?: VNodeClass;
  style?: VNodeStyle;
  on?: VNodeEvents;
}


export interface VNode {
  __isVnode: true; // temporary
  tag: string;
  $el?: Element;
  flags?: VNodeFlags;
  data?: VNodeData;
  children?: VNodeChildren;
}

export interface TextVNode extends VNode {
  text: string;
}

export interface CommentVNode extends VNode {
  comment: string;
}

function normalizeChildren(children: VNodeChildren): VNodeChildren {
  children = normalizedArray(children);
  for (let i = 0; i < children.length; ++i) {
    if (isString(children[i])) {
      children[i] = vnode.text(<string>children[i]);
    } else if (isUndef(children[i])) {
      children[i] = vnode.comment();
    } else if (!isVNode(children[i])) {
      throw new Error(`Not a VNode! (${children[i]})`);
    }
  }
  return children;
}

export function vnode(tag: string, data?: VNodeData|VNodeChildren, children?: VNodeChildren): VNode {
  if (isArray(data) || isString(data)) {
    children = data;
    data = {};
  }

  if (isDef(children)) {
    children = normalizeChildren(children);
  }

  return {
    tag,
    data: <VNodeData>data,
    children,
    flags: 0,
    $el: null,
    __isVnode: true,
  };
}

vnode.text = function(text: string|number|boolean): TextVNode {
  return {
    tag: '#text',
    text: String(text),
    flags: VNodeFlags.TEXT,
    children: null,
    data: null,
    $el: null,
    __isVnode: true,
  };
};

vnode.comment = function(comment?: string): CommentVNode {
  return {
    tag: '#comment',
    comment: comment || '',
    flags: VNodeFlags.COMMENT,
    children: null,
    data: null,
    $el: null,
    __isVnode: true,
  };
};

vnode.clone = function(node: VNode, flags?: VNodeCloneFlags): VNode {
  if (isTextVNode(node)) {
    return vnode.text(node.text);
  } else if (isCommentVNode(node)) {
    return vnode.comment(node.comment);
  }

  const cloned: VNode = {
    tag: node.tag,
    data: Object.create(node.data),
    flags: node.flags,
    children: arrayWrap(node.children).map(c => vnode.clone(<VNode>c)),
    $el: null,
    __isVnode: true,
  };

  return cloned;
};
