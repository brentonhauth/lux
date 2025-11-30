import { type ASTElement } from '@lux/compiler/ast/astnode';
import { error } from '@lux/core/logging';
import { createState } from '@lux/core/responsive/state';
import { AnyFunction, Func1 } from '@lux/core/types';
import { uuid } from '@lux/helpers/common';
import { isDef, isForbiddenTag, isHtmlTag } from '@lux/helpers/is';
import { VNode } from './vnode';
import { templateToAST } from '@lux/compiler/ast/component';
import { type BuildContext, buildContext } from '@lux/core/context';
import { generator } from '@lux/compiler/ast/generator';
import { Subscriber } from '@lux/core/responsive/registry';

export const enum ComponentFlags {
  NONE = 0,
  COMPILED = 0x1,
}

export const enum RuntimeFlags {
  NONE = 0,
  ACTIVE = 0x1,
  MOUNTED = 0x2,
}

export interface ComponentOptions {
  template?: string|Element,
  props?: Array<string>,
  state?: AnyFunction,
  $mount?: () => void,
  methods?: { [key: string]: AnyFunction }
}

export interface ComponentInstance {
  id: number;
  state: any;
  props: Record<string, any>;
  context: BuildContext;
  component: Component;
  methods: { [key: string]: AnyFunction }
  flags: RuntimeFlags;
  active?: Set<Subscriber>; // Do we need this?
}


export function createInstance(component: Component): ComponentInstance {

  // make state
  let state = createState(component.state());
  let props: Record<string, any> = {};


  // set props
  if (component?.props?.length > 0) {
    component.props.forEach(p => { props[p] = undefined; });
  }

  console.log('Current methods:', component.methods);

  const instance: ComponentInstance = {
    id: uuid(),
    state,
    props,
    active: new Set<Subscriber>(),
    methods: component.methods || {},
    context: null,
    flags: RuntimeFlags.NONE,
    component,
  };
  instance.context = buildContext(instance);

  return instance;
}

export class Component {

  #id: number;
  public tag: string;
  public template: string|Element;
  public props: Array<string>;
  public methods: { [key: string]: AnyFunction };
  public state: AnyFunction;

  protected _flags: ComponentFlags;
  protected _ast: ASTElement;
  protected _components: Map<string, Component>;
  protected _tovnode: Func1<any, VNode>;

  constructor(options: ComponentOptions) {
    this.#id = uuid();
    this._ast = null;
    this._flags = ComponentFlags.NONE;
    this.template = options.template;
    this.props = isDef(options.props) ? [...options.props] : []; // copy
    this.state = options.state;
    this.methods = options.methods;
    this._components = new Map<string, Component>();
  }

  get id() {
    return this.#id;
  }

  public component(tag: string, options: ComponentOptions): this;
  public component(tag: string, Comp: Component): this {
    tag = tag.trim().toLowerCase();
    if (!/^\w+$/i.test(tag) || isHtmlTag(tag) || isForbiddenTag(tag)) {
      error('Invalid component tag', tag);
      return this;
    }

    if (this._components.has(tag)) {
      error(`Already using a component with name "${tag}"`);
      return this;
    }

    if (!(Comp instanceof Component)) {
      Comp = $component(Comp);
    } else if (this.id === Comp.id || isDef(Comp.componentById(this.id))) {
      error('Circular dependancy with component', tag);
      return this;
    }

    this._components.set(tag, Comp);
    return this;
  }

  public compile() {
    if (!(this._flags & ComponentFlags.COMPILED)) {
      this._ast = templateToAST(<string>this.template, this);
      this._tovnode = generator(this._ast) as Func1<any, VNode>;
      this._flags |= ComponentFlags.COMPILED;
    }
  }

  public gen(args: any): VNode {
    const gen = generator(this._ast);
    return gen(args) as VNode;
  }

  public getComponent(name: string): Component {
    return this._components.get(name.toLowerCase());
  }

  private componentById(id: number): Component {
    for (let [, comp] of this._components) {
      if (comp.id === id) {
        return comp;
      }
      let sub = comp.componentById(id);
      if (isDef(sub)) {
        return sub;
      }
    }
    return null;
  }
}

export function $component(options: ComponentOptions): Component {
  return new Component(options);
}
