import { error } from './core/logging';
import { computed } from './core/responsive/computed';
import { effect } from './core/responsive/effect';
import { ref } from './core/responsive/ref';
import { createState } from './core/responsive/state';
import { isUndef } from './helpers/is';
import { EMPTY_STRING } from './helpers/strings';
import { render } from './vdom/render';
import { VNode } from './vdom/vnode';
import { Renderable } from './core/types';
import {
  Component,
  $component,
  ComponentOptions,
  createInstance,
  ComponentInstance
} from './vdom/component';

class LuxApp extends Component {

  private _$container: Element;
  private _$root: Element;
  private _vdom: VNode;
  private _instance: ComponentInstance;

  constructor(options: ComponentOptions) {
    super(options);
    this._$container = null;
  }

  public mount(container: string): void {
    const element = document.querySelector(container);
    if (isUndef(element)) {
      error(`Cannot find element that matches selection: "${container}"`);
      return;
    }

    this._$container = element;

    this.compile(); // Compile if it hasn't been compiled yet
    this._build();
    // ...
  }

  private _build(): void {
    this._instance = createInstance(this);
    // TODO: Mixin props & state to have root props.
    this._vdom = this._tovnode(this._instance.context);
    this._$container.innerHTML = EMPTY_STRING;

    // Render and attach.
    this._$root = render(this._vdom, this._$container) as Renderable;
    this._$container.appendChild(this._$root);
  }
}

function $createApp(options: ComponentOptions): LuxApp {
  return new LuxApp(options);
}

// Export Lux object.
const Lux = {
  $createApp,
  $component,
  createState,
  computed,
  effect,
  ref,
};

(<any>globalThis).Lux = Lux;
export default Lux;
