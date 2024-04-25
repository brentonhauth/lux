import { ASTElement } from './compiler/ast/astelement';
import { toVNode } from './compiler/ast/toVnode';
import { compileFromDOM } from './compiler/compiler';
import { BuildContext, createContext } from './core/context';
import { proxyWrap } from './core/dataset';
import { warn } from './core/logging';
import { h } from './h';
import { dom } from './helpers/dom';
import { applyAll, noop } from './helpers/functions';
import { isArray, isDef, isNumber, isObject, isString, isUndef } from './helpers/is';
import { Key, RenderFn, DataFn, State } from './types';
import { $component, Component, ComponentOptions } from './vdom/component';
import { difference } from './vdom/patch2';
import { $render } from './vdom/render';
import { VNode } from './vdom/vnode';

interface BuildOptions {
  render?: RenderFn;
  data: DataFn;
}

class LuxApp {
  private _options: BuildOptions;
  private _$root: Element;
  private _ast: ASTElement;
  private _v: VNode;
  private _data: DataFn;
  private _render: RenderFn;
  private _components: Record<string, Component>;
  private _context: BuildContext;
  private _isUpdating: boolean = false;
  private _schedule0: State;
  private _schedule1: State;

  constructor(options: BuildOptions) {
    this._options = options;
    this._$root = null;
    this._v = null;
    this._data = this._options.data?.bind(this) || noop;
    this._render = /** @todo options.render */<any>noop;
    this._components = {};
  }

  public $component(component: Component): this;
  public $component(tag: string, options: ComponentOptions): this;
  public $component(arg0: any, arg1?: any): this {
    if (isDef(this._ast)) {
      throw new Error('Cannot add component after compilation.');
    }
    let comp: Component;
    if (isString(arg0) && isObject(arg1)) {
      comp = $component(arg0, arg1);
    } else if (isObject(arg0) && isNumber(arg0.id) && isUndef(arg1)) {
      comp = arg0;
    } else {
      throw new Error('Invalid paramaters for adding component');
    }
    if (comp.tag in this._components) {
      warn('Component with tag already registered');
    } else {
      this._components[comp.tag] = comp;
    }
    return this;
  }

  /**
   * @todo check if element is valid element
   */
  public $compile(el: Element|string): this {
    if (isDef(this._ast)) {
      throw new Error('Aleardy compiled.');
    }
    if (isString(el)) { el = dom.select(el); }
    this._$root = el;

    const onUpdate = (object: State, name: string, old: any, value: any) => {
      this._scheduleForUpdate(name, value);
      const iter = this._iterScheduled.bind(this);
      requestAnimationFrame(() => {
        iter();
        this._isUpdating = false;
      });
    };

    const _state = this._data?.call(this) || {};
    const comps = Object.values(this._components);
    this._context = createContext(_state, comps);
    this._ast = <ASTElement>compileFromDOM(this._$root, this._context);
    const state = proxyWrap(_state, onUpdate.bind(this));
    this._render = this._astToVNode;
    this._build();
    return this;
  }

  private _scheduleForUpdate(key: any, value: any) {
    if (this._isUpdating) {
      this._schedule1[key] = value;
    } else {
      this._schedule0[key] = value;
    }
  }

  private _iterScheduled() {
    if (!this._isUpdating) {
      this._isUpdating = true;
      this._update(this._schedule0);
      this._schedule0 = this._schedule1;
      this._schedule1 = Object.create(null);
    }
    this._isUpdating = false;
  }

  private _update(s: State) {
    applyAll(this._context.state, s);
    this._build();
  }

  private _build() {
    const v = this._render(h);
    if (isUndef(v)) {
      let c = dom.createComment();
      this._$root?.replaceWith(c);
      this._$root = <any>c;
    } else if (isUndef(this._v)) {
      let e = $render(v);
      this._$root.replaceWith(e);
      this._$root = e;
    } else {
      // Potential bug: replacing root may not be assigned to `_$root`
      difference(this._$root, this._v, v);
    }
    this._v = v;
  }

  public getState(): State;
  public getState(query: string): Key;
  public getState(query: Array<Key>): Array<Key>;
  public getState(query?: any) {
    if (isUndef(query)) {
      return this._context.state;
    } else if (isArray(query)) {
      return query.map(q => this._context.state[q]);
    } else {
      return this._context.state[query];
    }
  }

  private _astToVNode(): VNode {
    return toVNode(this._ast, this._context);
  }
}

function $createApp(options: BuildOptions): LuxApp {
  return new LuxApp(options);
}

export const Lux: {
  (options: BuildOptions): LuxApp;
  $createApp: (options: BuildOptions) => LuxApp;
  Component: (tag: string, options: ComponentOptions) => Component;
} = function(options: BuildOptions): LuxApp {
  if (this instanceof Lux) {
    warn('No need to call `new` keyword on Lux');
  }
  return $createApp(options);
};

Lux.$createApp = $createApp;
Lux.Component = $component;

(<any>globalThis).Lux = Lux;
