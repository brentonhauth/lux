import { isUndef } from '@lux/helpers/is';
import { State } from '@lux/types';


type StateChangeListener<T> = (object: T, name: string, old: any, value: any) => void;

export class Dataset {
  public state: State;
  private _listeners: Record<string, Array<StateChangeListener<any>>>;

  constructor(state: State) {
    this.state = new Proxy(state, {
      set: this._onSet.bind(this),
      get: this._onGet.bind(this),
    });
    this._listeners = {};
  }

  public on(name: string, listener: StateChangeListener<any>) {
    if (isUndef(this._listeners[name])) {
      this._listeners[name] = [];
    }
    this._listeners[name].push(listener);
  }

  private _onSet(target: State, p: string, value: any) {
    const old = target[p];
    target[p] = value;
    this._listeners[p]?.forEach(cb => cb(target, p, old, value))
    return true;
  }

  private _onGet(target: State, p: string) {
    return target[p];
  }
}

export function proxyWrap<T extends object>(data: T, onUpdate: StateChangeListener<T>): T {
  return new Proxy(data, {
    set(target: T, p: string, value: any): boolean {
      const old = (<any>target)[p];
      onUpdate(target, p, old, (<any>target)[p] = value);
      return true;
    },
    get(target: T, p: string|symbol) {
      console.log('GETTING:', target, p);
      return (<any>target)[p];
    },
    deleteProperty(target: T, p: string|symbol): boolean {
      return true;
    }
  });
}