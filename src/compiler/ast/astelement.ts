import { BuildContext, withContext } from "../../core/context";
import { warn } from "../../core/logging";
import { arrayUnwrap, arrayWrap, flattenArray, normalizedArray, removeFromArray } from "../../helpers/array";
import { isBlankString, isDef, isPrimitive, isUndef, isUndefOrEmpty } from "../../helpers/is";
import { stripDoubleCurls, trimAll } from "../../helpers/strings";
import { getState } from "../../lux";
import { ArrayOrSingle, Primitive, State } from "../../types";
import { Component } from "../../vdom/component";
import { vnode, VNode, VNodeAttrs, VNodeStyle } from "../../vdom/vnode";
import { parseStatement, Statement } from "../parser";
import { processExpression } from "./expression";
import { IfCondition, processIf } from "./if";
import { LoopCondition, processLoop } from "./loop";

let AST_ID = 0;

export const enum ASTType {
  ELEMENT = 1,
  EXPRESSION = 2,
  TEXT = 3,
}

export const enum ASTFlags {
  IF = 1,
  ELSE = 2,
  ELIF = IF|ELSE,
  BIND = 4,
  LOOP = 8,
  STATIC = 16,
  COMPONENT_MASK = 32,
  ROOT = 64,
  ABSOLUTE_ROOT = ROOT|128
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

  prevSibling(): ASTNode|null {
    return this.getSibling(-1);
  }

  nextSibling(): ASTNode|null {
    return this.getSibling(+1);
  }
  
  public getSibling(offset: number) {
    if (isUndef(this.parent)) return null;
    const index = this.parent.children.findIndex(n => n.id === this.id);
    return this.parent.children[index + offset];
  }

  public abstract toVNode(context: BuildContext): ArrayOrSingle<VNode>;
  public markIfStatic() {
    if (this.type === ASTType.TEXT) {
      this.flags |= ASTFlags.STATIC;
    }
  }
}

export class ASTElement extends ASTNode {
  public tag: string;
  public attrs: Record<string,{bind:string}|Primitive>;
  public style: VNodeStyle;
  public children: Array<ASTNode>;
  public if?: IfCondition;
  public loop?: LoopCondition;
  public watching?: Array<string>;
  public bindings?: Record<string, string>;

  constructor(el: Element, tag: string, attrs: Record<string,{bind:string}|Primitive>, children: ArrayOrSingle<ASTNode>) {
    super(el, ASTType.ELEMENT);
    this.tag = tag;
    this.style = <any>attrs.style;
    if (isDef(this.style)) delete attrs.style;
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

  normalizedAttrs(context: BuildContext) {
    let { state, additional } = context;
    state = state || getState();
    additional = additional || {};
    const attrs: VNodeAttrs = {};
    for (let name in this.attrs) {
      let attr = this.attrs[name];
      if (isPrimitive(attr)) {
        attrs[name] = attr;
      } else {
        attrs[name] = attr.bind in additional
          ? additional[attr.bind]
          : state[attr.bind];
      }
    }
    return attrs;
  }

  toVNode(context: BuildContext): ArrayOrSingle<VNode> {
    let v: VNode, ast: ASTElement = this;
    if ((ast.flags & ASTFlags.IF) && !(ast.flags & ASTFlags.ELSE)) {
      ast = processIf(ast, context);
      if (isUndef(ast)) {
        v = null//vnode.comment('[IF]');
        // v.$el = <Element>this.$el;
        return v;
      }
    } else if (ast.flags & ASTFlags.LOOP) {
      let looped = processLoop(ast, context);
      if (looped.length === 0) {
        v = null//vnode.comment('[LOOP]');
        // v.$el = <Element>this.$el;
        return v;
      } else {
        // TODO: implement loop in new sys
        return looped;
      }
    }

    if (ast instanceof ASTComponent) {
      ast = ast.root;
    }

    const children = normalizedArray(ast.children).map(c => c.toVNode(context));


    v = vnode(ast.tag, {
      attrs: ast.normalizedAttrs(context),
      style: ast.style,
    }, <any>flattenArray(children));
    // v.$el = <Element>this.$el;
    return v;
  }
}

export class ASTComponent extends ASTElement {

  public component: Component;
  public props: Array<string>;
  public currentProps: Record<string, any>;
  public root: ASTElement;

  constructor(el: Element, component: Component, root: ASTElement, attrs: Record<string,{bind:string}|Primitive>) {
    super(el, component.tag, attrs, []);
    this.flags |= ASTFlags.COMPONENT_MASK;
    this.component = component;
    this.currentProps = {};
    this.props = component.props;
    this.root = root;
    component.ast = this.root;
  }

  setProps(p: Record<string, any>): ASTComponent {
    this.currentProps = p;
    return this;
  }

  // public toVNode(context: BuildContext): VNode {
  //   const ctx = withContext(context, this.currentProps);
  //   return arrayUnwrap(this.root.toVNode(ctx));
  // }
}

export class ASTExpression extends ASTNode {
  public exp?: Statement;
  public raw: string;

  constructor(el: Node, exp: string) {
    super(el, ASTType.EXPRESSION);
    const inner = stripDoubleCurls(exp);
    if (isUndefOrEmpty(inner) || inner === exp) {
      this.exp = null;
      this.raw = exp.trim();
      warn(`Invalid expression "${exp}"`);
    } else {
      this.exp = parseStatement(inner);
      this.raw = inner.trim();
    }
  }

  toVNode(context: BuildContext): VNode {
    let v: VNode;
    if (isDef(this.exp)) {
      v = processExpression(this, context);
    } else {
      v = vnode.text('');
    }
    // v.$el = <Element>this.$el;
    return v;
  }
}

export class ASTText extends ASTNode {
  public text: string|number|boolean;

  constructor(el: Node, text: string) {
    super(el, ASTType.TEXT);
    this.text = text;
  }

  toVNode(): VNode {
    const v = vnode.text(this.text);
    // v.$el = <Element>this.$el;
    return v;
  }
}
