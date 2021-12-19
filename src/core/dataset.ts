import { isUndef } from "../helpers/is";
import { State } from "../types";


type StateChangeListener = (name: string, old: any, value: any) => void;

export class Dataset {
  public state: State;
  private _listeners: Record<string, Array<StateChangeListener>>;

  constructor(state: State) {
    this.state = new Proxy(state, {
      set: this._onSet.bind(this),
      get: this._onGet.bind(this),
    });
    this._listeners = {};
  }

  public on(name: string, listener: StateChangeListener) {
    if (isUndef(this._listeners[name])) {
      this._listeners[name] = [];
    }
    this._listeners[name].push(listener);
  }

  private _onSet(target: State, p: string, value: any) {
    const old = target[p];
    target[p] = value;
    this._listeners[p]?.forEach(cb => cb(p, old, value))
    return true;
  }

  private _onGet(target: State, p: string) {
    return target[p];
  }
}