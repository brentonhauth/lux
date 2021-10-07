module Lux {

  type RenderFn = (h:(sel:string, data?:any, children?:any)=>VNode) => VNode;

  interface BuildOptions {
    render: RenderFn;
  }

  let _instance: LuxApp = null;

  class LuxApp {
    private _options: BuildOptions;
    private _root: Element;
    private _v: VNode;
    private _render: RenderFn;
    private _state: Record<string, any>;

    constructor(options: BuildOptions) {
      this._options = options;
      this._render = options.render.bind(this);
      this._options.render = <any>noop;
      this._state = {};
      this._root = null;
      this._v = null;
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
      this._state = state;
      const v = this._render(h);
      if (is.undef(v)) {
        let c = dom.createComment();
        this._root?.replaceWith(c);
        this._root = <any>c;
      } else {
        const patchFn = diff(this._v, v);
        this._root = patchFn(this._root);
      }
      this._v = v;
      return this;
    }
  }

  export function $createApp(options: BuildOptions) {
    return _instance = new LuxApp(options);
  }
}
