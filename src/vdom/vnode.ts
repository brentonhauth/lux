module lux {

  export enum VNodeCloneFlags {
    DEEP = 1,
    ELEMENT = 2,
    Default = DEEP|0,
  };

  export class VNode {
    public $el?: Element;
    public tag: string;
    public attrs: Record<string, any>;
    public children?: VNodeChildren;
    public isStatic: boolean;
    public operations?: VNodeOperations;

    constructor(tag: string, attrs: Record<string, any>, children?: VNodeChildren) {
      this.tag = tag;
      this.attrs = attrs;
      this.children = children;
      this.isStatic = false;
    }

    public clone(flags=VNodeCloneFlags.Default): VNode {
      let children: VNodeChildren;
      if ((flags & VNodeCloneFlags.DEEP) && this.children) {
        if (is.array(this.children)) {
          children = [];
          this.children.forEach(c => {
            if (is.string(c)) {
              (<any>children).push(c);
            } else if (is.vnode(c)) {
              (<any>children).push(c.isStatic ? c : c.clone(flags));
            }
          });
        } else {
          children = (is.vnode(this.children) && !this.children.isStatic)
            ? this.children.clone(flags)
            : this.children;
        }
      }
      let cloned = new VNode(this.tag, this.attrs, children);
      cloned.isStatic = this.isStatic;
      return cloned;
    }

    // public static from(el: Element): VNode { return null; }
  }
}
