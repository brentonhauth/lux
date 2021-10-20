// <reference path="./vdom/patch.ts" />

import { ASTElement } from './compiler/ast/astelement';
import { compileFromDOM } from './compiler/compiler';
import { evalStatement, parseStatement } from './compiler/parser';
import { h } from './h';
import { dom } from './helpers/dom';
import { applyAll, noop } from './helpers/functions';
import { isArray, isDef, isString, isUndef } from './helpers/is';
import { ArrayOrSingle, Key, RenderFn, State } from './types';
import { diff } from './vdom/patch';
import { $mount, $render } from './vdom/render';
import { VNode } from './vdom/vnode';

type DataFn = () => Record<Key, any>;

interface BuildOptions {
  render: RenderFn;
  data: DataFn;
}

let _instance: LuxApp = null;

class LuxApp {
  static _instance: LuxApp;
  private _options: BuildOptions;
  private _root: Element;
  private _v: VNode;
  private _ast: ASTElement;
  private _render: RenderFn;
  private _data: DataFn;
  private _state: Record<string, any>;

  constructor(options: BuildOptions) {
    LuxApp._instance = this;
    this._options = options;
    this._render = options.render?.bind(this);
    this._data = options.data?.bind(this) || noop;
    this._options.render = <any>noop;
    this._state = options.data?.() || {};
    this._root = null;
    this._v = null;
  }

  getState(query?: ArrayOrSingle<string>) {
    if (isUndef(query)) {
      return this._state;
    } else if (isArray(query)) {
      return query.map(q => this._state[q]);
    } else {
      return this._state[query];
    }
  }

  $mount(el: string|Element): LuxApp {
    if (isString(el)) {
      el = document.querySelector(el);
    }
    this._v = this._render(h);
    this._root = $mount(this._v, el);
    return this;
  }

  $update(state: Record<string, any>): LuxApp {
    applyAll(this._state, state);
    const v = this._render(h);
    // console.table([this._v, v], ['tag', '$el', 'data', 'children']);
    if (isUndef(v)) {
      let c = dom.createComment();
      this._root?.replaceWith(c);
      this._root = <any>c;
    } else if (isUndef(this._v)) {
      let e = $render(v);
      this._root.replaceWith(e);
      this._root = e;
    } else {
      const patchFn = diff(this._v, v);
      this._root = patchFn(this._root);
    }
    // console.log(this._v, v);
    this._v = v;
    return this;
  }

  $compile(el: Element|string): LuxApp {
    if (isString(el)) {
      el = dom.select(el);
    }
    this._root = el;
    // this._v = vnode(el.tagName, );
    this._ast = <ASTElement>compileFromDOM(el);
    this._render = () => <VNode>this._ast.toVNode(getState());
    this.$update(this._state);
    return this;
  }
}

export function $createApp(options: BuildOptions) {
  return new LuxApp(options);
}

export function getState(): State;
export function getState(query: string): Key;
export function getState(query: Array<Key>): Array<Key>;
export function getState(query?: any) {
  return isDef(LuxApp._instance) ? LuxApp._instance.getState(query) : null;
}

export function getInstance() {
  return LuxApp._instance;
}

// loopIt();

const Lux = {
  $createApp,
  getState,
  getInstance,

  // Just here for testing
  parseStatement,
  evalStatement,
};

(<any>globalThis).Lux = Lux;
