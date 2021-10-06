module lux {

  export enum VNodeCloneFlags {
    DEEP = 1,
    ELEMENT = 2,
    DEFAULT = DEEP|0,
  };

  export enum VNodeFlags {
    TEXT = 1,
    STATIC = 2,
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

  function normalizeChildren(children: VNodeChildren): VNodeChildren {
    children = flattenArray(arrayWrap(children));
    for (let i = 0; i < children.length; ++i) {
      if (is.string(children[i])) {
        children[i] = vnode.text(<string>children[i]);
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
      $el: null,
      flags: 0,
      __isVnode: true,
    };
  }

  vnode.text = function(text: string): TextVNode {
    return {
      tag: '#text',
      text: String(text),
      flags: VNodeFlags.TEXT,
      $el: null,
      __isVnode: true,
    };
  };

  // export class VNode0 {
  //   public $el?: Element;
  //   public tag: string;
  //   public attrs: Record<string, any>;
  //   public children?: VNodeChildren;
  //   private flags: VNodeFlags;
  //   public operations?: VNodeOperations;

  //   constructor(tag: string, attrs: Record<string, any>, children?: VNodeChildren) {
  //     this.tag = tag;
  //     this.attrs = attrs;
  //     this.children = children;
  //     this.flags = VNodeFlags.STATIC;
  //   }

  //   public hasFlag(flag: VNodeFlags) {
  //     return (this.flags & flag) === flag;
  //   }

  //   public clone(flags=VNodeCloneFlags.DEFAULT): VNode {
  //     let children: VNodeChildren;
  //     if ((flags & VNodeCloneFlags.DEEP) && this.children) {
  //       if (is.array(this.children)) {
  //         children = [];
  //         this.children.forEach(c => {
  //           if (is.string(c)) {
  //             (<any>children).push(c);
  //           } else if (is.vnode(c)) {
  //             (<any>children).push(this.hasFlag(VNodeFlags.STATIC) ? c : c.clone(flags));
  //           }
  //         });
  //       } else {
  //         children = (is.vnode(this.children) && !this.hasFlag(VNodeFlags.STATIC))
  //           ? this.children.clone(flags)
  //           : this.children;
  //       }
  //     }
  //     let cloned = new VNode(this.tag, this.attrs, children);
  //     cloned.flags = this.flags;
  //     return cloned;
  //   }

  // }
}
