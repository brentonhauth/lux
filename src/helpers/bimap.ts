import { Func0 } from '@lux/core/types';
import { isDef, isUndef } from './is';


export class BiMap<K1 extends WeakKey = any, K2 = any, V = any> {

  private _map: WeakMap<K1, Map<K2, V>>;

  constructor() {
    this._map = new WeakMap<K1, Map<K2, V>>();
  }

  public getDefault(key1: K1, key2: K2, fn: Func0<V>) {
    let inner = this._map.get(key1);
    if (isUndef(inner)) {
      inner = new Map<K2, V>();
      this._map.set(key1, inner);
    }

    if (inner.has(key2)) {
      return inner.get(key2);
    }

    let value = fn();
    inner.set(key2, value);
    return value;

  }

  public get(key1: K1, key2: K2): V {
    const inner = this._map.get(key1);
    return isDef(inner) ? inner.get(key2) : undefined;
  }

  public set(key1: K1, key2: K2, value: V) {
    let inner = this._map.get(key1);
    if (isUndef(inner)) {
      inner = new Map<K2, V>();
      this._map.set(key1, inner);
    }
    inner.set(key2, value);
  }

  public delete(key1: K1, key2: K2): boolean {
    const inner = this._map.get(key1);
    return isDef(inner) ? inner.delete(key2) : true;
  }
}
