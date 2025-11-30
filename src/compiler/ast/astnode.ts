import { uuid } from "@lux/helpers/common";
import { isUndef } from "@lux/helpers/is";
import { type AnyFunction, } from "@lux/core/types";
import { type Component } from "@lux/vdom/component";
import { type ASTAttributes } from "./attributes";
import { type Expression } from "./expression";
import { type LoopCondition } from "./loop";


export const enum ASTFlags {
  NONE = 0,
  IF = 0x1,
  ELSE = 0x2,
  ELIF = 0x3, // IF|ELSE
  LOOP = 0x4,
  STATIC = 0x8,


  DYNAMIC_EVENTS = 0x00,
  DYNAMIC_STYLES = 0x00,
  DYNAMIC_CLASSES = 0x00,
  DYNAMIC_ATTRS = 0x00,
  STATIC_CHILDREN = 0x00,
}

export const enum ASTType {
  NONE = 0,
  HTML,
  COMPONENT,
  EXPRESSION,
  ATTR,
  TEXT,
  CONDITION,
  LOOP,
}

export const enum ASTAttrType {
  NONE = 0,
  STATIC = 1,
  DYNAMIC = 2,
  EVENT = 3,
}


export abstract class ASTNode {

  #id: number;
  public type: ASTType;
  public flags: ASTFlags;
  public $el?: Element|Node;
  public gen: AnyFunction; // Subject to change.

  constructor(el: Element|Node, type: ASTType) {
    this.#id = uuid();
    this.flags = 0;
    this.$el = el;
    this.type = type;
  }

  get id() {
    return this.#id;
  }

  depth() {
    return 1;
  }
}

export abstract class ASTElement extends ASTNode {

  public tag: string;
  public children: Array<ASTNode>;
  public attrs?: ASTAttributes;

  constructor(el: Element|Node, type: ASTType) {
    super(el, type);
    this.tag = (<Element>el).tagName.toLowerCase();
    this.children = null;
  }
}

export class ASTHtml extends ASTElement {
  constructor(el: Element|Node) {
    super(el, ASTType.HTML);
    this.children = [];
  }
}

export class ASTComponent extends ASTElement {

  public component: Component;

  constructor(el: Element|Node, component: Component) {
    super(el, ASTType.COMPONENT);
    this.component = component;
  }
}

export class ASTAttr extends ASTNode {

  public name: string;
  public attrType: ASTAttrType;
  public value: Expression

  constructor(el: Attr, name: string, attrType: ASTAttrType, value: Expression) {
    super(el, ASTType.ATTR);
    this.name = name;
    this.attrType = attrType;
    this.value = value;
  }
}

export class ASTLoop extends ASTNode {

  public condition: LoopCondition;
  public body: ASTNode;
  public key?: Expression;

  constructor(el: Element, condition: LoopCondition, body: ASTNode, key?: Expression) {
    super(el, ASTType.LOOP);
    this.condition = condition;
    this.body = body;
    this.key = key;
  }
}

export class ASTCondition extends ASTNode {

  public condition: Expression;
  public then: ASTNode;
  public next?: ASTNode; // else block

  constructor(el: Element, condition: Expression, then: ASTNode, next?: ASTNode) {
    super(el, ASTType.CONDITION);
    this.condition = condition;
    this.then = then;
    this.next = next;
  }

  depth(): number {
    if (isUndef(this.next)) {
      return 1;
    } else if (this.next instanceof ASTCondition) {
      return 1 + this.next.depth();
    } else {
      return 2;
    }
  }
}

export class ASTText extends ASTNode {

  public text: string;

  constructor(el: Element|Node) {
    super(el, ASTType.TEXT);
    this.text = el.textContent;
  }
}

export class ASTExpression extends ASTNode {

  public exp: Expression;

  constructor(el: Element|Node, exp: Expression) {
    super(el, ASTType.EXPRESSION);
    this.exp = exp;
  }
}
