import { ASTElement } from './compiler/ast/astelement';
import { toVNode } from './compiler/ast/toVnode';
import { compileFromDOM } from './compiler/compiler';
import { evalStatement, parseStatement } from './compiler/parser';
import { BuildContext, createContext } from './core/context';
import { Dataset, proxyWrap } from './core/dataset';
import { warn } from './core/logging';
import { h } from './h';
import { dom } from './helpers/dom';
import { noop } from './helpers/functions';
import { isArray, isDef, isString, isUndef } from './helpers/is';
import { Key, RenderFn, DataFn, State } from './types';
import { $component, Component, ComponentOptions } from './vdom/component';
import { difference } from './vdom/patch2';
import { $render } from './vdom/render';
import { VNode } from './vdom/vnode';

interface BuildOptions {
  render: RenderFn;
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

  constructor(options: BuildOptions) {
    this._options = options;
    this._$root = null;
    this._v = null;
    this._data = this._options.data?.bind(this) || noop;
    this._render = /** @todo options.render */<any>noop;
    this._components = {};
  }

  public $component(tag: string, options: ComponentOptions): this {
    if (isDef(this._ast)) {
      throw new Error('Cannot add component after compilation.');
    }
    tag = tag.toLowerCase();
    const comp = $component(tag, options);
    if (tag in this._components) {
      warn('Component with tag already registered');
    } else if (isUndef(comp)) {
      warn('Invalid component');
    } else {
      this._components[tag] = comp;
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
    if (isString(el)) { el = dom.select('el'); }
    this._$root = el;
    const state = /**@todo proxyWrap*/ this._data?.call(this) || {};
    const comps = Object.values(this._components);
    this._context = createContext(state, comps);
    this._ast = <ASTElement>compileFromDOM(this._$root, this._context);
    this._render = this._astToVNode;
    this._build();
    return this;
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
      difference(this._v, v);
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


export function $createApp(options: BuildOptions): LuxApp {
  return new LuxApp(options);
}


const Lux = {
  $createApp,
  Dataset,
  proxyWrap,

  // Just here for testing
  parseStatement,
  evalStatement,
};

(<any>globalThis).Lux = Lux;
