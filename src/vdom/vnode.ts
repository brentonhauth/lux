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

  export class VNode {
    public $el?: Element;
    public tag: string;
    public attrs: Record<string, any>;
    public children?: VNodeChildren;
    private flags: VNodeFlags;
    public operations?: VNodeOperations;

    constructor(tag: string, attrs: Record<string, any>, children?: VNodeChildren) {
      this.tag = tag;
      this.attrs = attrs;
      this.children = children;
      this.flags = VNodeFlags.STATIC;
    }

    public hasFlag(flag: VNodeFlags) {
      return (this.flags & flag) === flag;
    }

    public clone(flags=VNodeCloneFlags.DEFAULT): VNode {
      let children: VNodeChildren;
      if ((flags & VNodeCloneFlags.DEEP) && this.children) {
        if (is.array(this.children)) {
          children = [];
          this.children.forEach(c => {
            if (is.string(c)) {
              (<any>children).push(c);
            } else if (is.vnode(c)) {
              (<any>children).push(this.hasFlag(VNodeFlags.STATIC) ? c : c.clone(flags));
            }
          });
        } else {
          children = (is.vnode(this.children) && !this.hasFlag(VNodeFlags.STATIC))
            ? this.children.clone(flags)
            : this.children;
        }
      }
      let cloned = new VNode(this.tag, this.attrs, children);
      cloned.flags = this.flags;
      return cloned;
    }

  }
}
