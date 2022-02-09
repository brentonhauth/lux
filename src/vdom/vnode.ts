
import { isArray, isDef, isString, isUndef, isVNode } from '@lux/helpers/is';
import { arrayWrap, normalizedArray } from '@lux/helpers/array';
import { stringWrap } from '@lux/helpers/strings';
import { ArrayOrSingle, Simple } from '@lux/types';

export const enum UniqueVNodeTags {
  COMMENT = '#comment',
  TEXT = '#text',
}

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
  key?: string;
  attrs?: VNodeAttrs;
  class?: VNodeClass;
  style?: VNodeStyle;
  on?: VNodeEvents;
}


export interface VNode {
  __isVnode: true; // temporary
  tag: string;
  key?: string;
  $el?: Element;
  flags?: VNodeFlags;
  data?: VNodeData;
  children?: Array<VNode>;
}

export interface TextVNode extends VNode {
  text: string;
}

export interface CommentVNode extends VNode {
  comment: string;
}

function normalizeChildren(children: VNodeChildren): VNodeChildren {
  children = normalizedArray(children);
  const len = children.length;
  for (let i = 0; i < len; ++i) {
    if (isString(children[i])) {
      children[i] = vnode.text(<string>children[i]);
    } else if (isUndef(children[i])) {
      children[i] = vnode.comment();
      continue;
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

  const key = <string>(data?.key || (<VNodeData>data)?.attrs?.id);

  return _vnode(tag, 0, null, key, null, data, <VNode[]>children);
}

vnode.text = function(text: Simple): TextVNode {
  return <TextVNode>_vnode(UniqueVNodeTags.TEXT, VNodeFlags.TEXT, stringWrap(text));
};

vnode.comment = function(_comment?: string): CommentVNode {
  return <CommentVNode>_vnode(UniqueVNodeTags.COMMENT, VNodeFlags.COMMENT, _comment);
};

export function cloneVNode(node: VNode, flags?: VNodeCloneFlags): VNode {
  if (isUndef(node)) {
    return null;
  } else if (node.tag === UniqueVNodeTags.TEXT) {
    return vnode.text((<TextVNode>node).text);
  } else if (node.tag === UniqueVNodeTags.COMMENT) {
    return vnode.comment();
  }

  const children = arrayWrap(node.children).map(c => cloneVNode(<VNode>c));
  return _vnode(node.tag, node.flags, null, node.key, null, node.data, children);
}

function _vnode(
  tag: string,
  flags?: VNodeFlags,
  text?: string,
  key?: string,
  $el?: Element,
  data?: VNodeData,
  children?: VNode[]
): VNode {
  return <any>{ tag, flags, text, key, data, children, $el, __isVnode: true };
}
