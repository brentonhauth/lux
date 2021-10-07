module Lux {
  let AST_ID = 0;

  export enum ASTType {
    ELEMENT = 1,
    EXPRESSION = 2,
    TEXT = 3,
  }

  export enum ASTFlags {
    IF = 1,
    ELSE = 2,
    ELIF = IF|ELSE,
    BIND = 4,
    LOOP = 8,
    STATIC = 16,
  }

  export abstract class ASTNode {
    #id: number;
    public $el: Node|Element;
    public type: ASTType;
    public parent: ASTElement;
    public flags: ASTFlags;


    constructor(el: Node|Element, type: ASTType) {
      this.#id = ++AST_ID;
      this.$el = el;
      this.type = type;
      this.parent = null;
      this.flags = 0;
    }

    public get id() { return this.#id; }

    prevSibling(): ASTNode {
      return this.getSibling(-1);
    }

    nextSibling(): ASTNode {
      return this.getSibling(+1);
    }
    
    public getSibling(offset: number) {
      if (is.undef(this.parent)) return null;
      const index = this.parent.children.findIndex(n => n.id === this.id);
      return this.parent.children[index + offset];
    }

    public abstract toVNode(): VNode|string;
  }

  export class ASTElement extends ASTNode {
    public tag: string;
    public attrs: VNodeAttrs;
    public children: Array<ASTNode>;
    public if?: IfCondition;

    constructor(el: Element, tag: string, attrs: VNodeAttrs, children: ArrayOrSingle<ASTNode>) {
      super(el, ASTType.ELEMENT);
      this.tag = tag;
      this.attrs = attrs;
      this.children = arrayWrap(children);
      this.children.forEach(c => c.parent = this);
    }

    addChild(child: ASTElement) {
      this.children.push(child);
      if (is.def(child.parent)) {
        removeFromArray(
          child.parent.children,
          child, (p, c) => p.id === c.id);
      }
      child.parent = this;
    }

    toVNode(): VNode {
      console.log('toVNode', this);
      let ast: ASTElement = this;
      if ((this.flags & ASTFlags.IF) && !(this.flags & ASTFlags.ELSE)) {
        ast = processIf(ast);
      }

      const { style } = ast.attrs;
      delete ast.attrs['style'];
      return vnode(ast.tag, {
        attrs: ast.attrs,
        style: <any>style,
      }, ast.children.map(c => c.toVNode()));
    }
  }

  export class ASTText extends ASTNode {
    public text: string|number|boolean;

    constructor(el: Node, text: string) {
      super(el, ASTType.TEXT);
      this.text = text;
    }

    toVNode(): string {
      return <string>this.text;
    }
  }
}
