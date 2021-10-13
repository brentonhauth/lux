module Lux {

  export enum VNodeCloneFlags {
    DEEP = 1,
    ELEMENT = 2,
    DEFAULT = DEEP|0,
  };

  export enum VNodeFlags {
    STATIC = 1,
    TEXT = 2,
    COMMENT = 4,
    DEFAULT = STATIC|0,
  }

  export type VNodeAttrs = Record<string, string | number | boolean>;
  export type VNodeProps = Record<string, any>;
  export type VNodeClass = ArrayOrSingle<string>|Record<string, boolean>;
  export type VNodeStyle = Record<string, string|number>;
  export type VNodeEvents = Record<string, Event>;
  export type VNodeChildren = ArrayOrSingle<VNode|string>;

  export interface VNodeData {
    props?: VNodeProps;
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
    children = flattenArray(arrayWrap(children));
    for (let i = 0; i < children.length; ++i) {
      if (is.string(children[i])) {
        children[i] = vnode.text(<string>children[i]);
      } else if (is.undef(children[i])) {
        vnode.comment(<string>children[i]);
      }
    }
    return children;
  }

  export function vnode(tag: string, data?: VNodeData|VNodeChildren, children?: VNodeChildren): VNode {
    if (is.array(data) || is.string(data)) {
      children = data;
      data = {};
    }

    if (is.def(children)) {
      children = flattenArray(arrayWrap(children));
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
      $el: null,
      __isVnode: true,
    };
  };

  vnode.comment = function(comment?: string): CommentVNode {
    return {
      tag: '#comment',
      comment: comment || '',
      flags: VNodeFlags.COMMENT,
      $el: null,
      __isVnode: true,
    };
  };

}
