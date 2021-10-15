import { arrayWrap, flattenArray, normalizedArray, removeFromArray } from "../../helpers/array";
import { isDef, isUndef } from "../../helpers/is";
import { ArrayOrSingle } from "../../types";
import { vnode, VNode, VNodeAttrs, VNodeStyle } from "../../vdom/vnode";
import { IfCondition, processIf } from "./if";
import { LoopCondition, processLoop } from "./loop";

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
    if (isUndef(this.parent)) return null;
    const index = this.parent.children.findIndex(n => n.id === this.id);
    return this.parent.children[index + offset];
  }

  public abstract toVNode(): ArrayOrSingle<VNode>;
  public markIfStatic() {
    if (this.type === ASTType.TEXT) {
      this.flags |= ASTFlags.STATIC;
    }
  }
}

export class ASTElement extends ASTNode {
  public tag: string;
  public attrs: VNodeAttrs;
  public style: VNodeStyle;
  public children: Array<ASTNode>;
  public if?: IfCondition;
  public loop?: LoopCondition;
  public watching?: Array<string>;

  constructor(el: Element, tag: string, attrs: VNodeAttrs, children: ArrayOrSingle<ASTNode>) {
    super(el, ASTType.ELEMENT);
    this.tag = tag;
    this.style = <any>(isDef(attrs) && attrs['style']);
    if (isDef(this.style)) delete attrs['style'];
    this.attrs = attrs;
    this.children = arrayWrap(children);
    this.children.forEach(c => c.parent = this);
  }

  addChild(child: ASTElement) {
    this.children.push(child);
    if (isDef(child.parent)) {
      removeFromArray(
        child.parent.children,
        child, (p, c) => p.id === c.id);
    }
    child.parent = this;
  }

  markIfStatic() {
    let flags = this.flags & ~ASTFlags.STATIC;
    if (flags === 0) {
      this.flags |= ASTFlags.STATIC;
    }
  }

  toVNode(): ArrayOrSingle<VNode> {
    let ast: ASTElement = this;
    if ((ast.flags & ASTFlags.IF) && !(ast.flags & ASTFlags.ELSE)) {
      ast = processIf(ast);
      if (isUndef(ast)) {
        return vnode.comment('[IF]');
      }
    } else if (ast.flags & ASTFlags.LOOP) {
      let looped = processLoop(ast);
      return looped.length === 0 ? vnode.comment('[LOOP]') : looped;
    }

    const children = normalizedArray(ast.children).map(c => c.toVNode());

    return vnode(ast.tag, {
      attrs: ast.attrs,
      style: ast.style,
    }, <any>flattenArray(children));
  }
}

export class ASTText extends ASTNode {
  public text: string|number|boolean;

  constructor(el: Node, text: string) {
    super(el, ASTType.TEXT);
    this.text = text;
  }

  toVNode(): VNode {
    return vnode.text(this.text);
  }
}
