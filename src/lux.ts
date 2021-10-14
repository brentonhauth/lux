module Lux {

  type RenderFn = (h:(sel:string, data?:any, children?:any)=>VNode) => VNode;
  type DataFn = () => Record<Key, any>;

  interface BuildOptions {
    render: RenderFn;
    data: DataFn;
  }

  let _instance: LuxApp = null;

  class LuxApp {
    private _options: BuildOptions;
    private _root: Element;
    private _v: VNode;
    private _ast: ASTElement;
    private _render: RenderFn;
    private _data: DataFn;
    private _state: Record<string, any>;

    constructor(options: BuildOptions) {
      this._options = options;
      this._render = options.render?.bind(this);
      this._data = options.data?.bind(this) || noop;
      this._options.render = <any>noop;
      this._state = {};
      this._root = null;
      this._v = null;
    }

    getState() {
      return this._state;
    }

    $mount(el: string|Element): LuxApp {
      if (is.string(el)) {
        el = document.querySelector(el);
      }
      this._v = this._render(h);
      this._root = $mount(this._v, el);
      return this;
    }

    $update(state: Record<string, any>): LuxApp {
      applyAll(this._state, state);
      const v = this._render(h);
      console.table([this._v, v], ['tag', '$el', 'data', 'children']);
      if (is.undef(v)) {
        let c = dom.createComment();
        this._root?.replaceWith(c);
        this._root = <any>c;
      } else if (is.undef(this._v)) {
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
      if (is.string(el)) {
        el = dom.select(el);
      }
      this._root = el;
      // this._v = vnode(el.tagName, );
      this._ast = <ASTElement>compileFromDOM(el);
      this._render = () => <VNode>this._ast.toVNode();
      this.$update(this._data());
      return this;
    }
  }

  export function $createApp(options: BuildOptions) {
    return _instance = new LuxApp(options);
  }

  export function getState() {
    return _instance.getState();
  }

  export function getInstance() {
    return _instance;
  }
}
