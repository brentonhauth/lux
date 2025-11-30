import { Func0 } from '@lux/core/types';
import { Observer } from './observer';
import { error } from '../logging';
import { activateSub, getActive, SubFlags, Subscriber } from './registry';
import { Ref } from './ref';
import { isDef } from '@lux/helpers/is';


export interface Computed<T = any> extends Subscriber<T> {
  get value(): T;
}

class ComputedBase<T = any> implements Computed<T>, Ref<T> {

  public observing: Set<Observer>;
  public flags: SubFlags;

  private _observer: Observer;
  private _value: T;

  constructor(
    private readonly _fn: Func0<T>,
  ) {
    this._observer = new Observer();
    this.observing = new Set<Observer>();
    this.flags = SubFlags.DIRTY;
  }

  public run(): T {
    if (this.flags & SubFlags.DIRTY) {
      const newValue = this._fn();
      if (this._value !== newValue) {
        this._value = newValue;
        this._observer.notify();
      }
      this.flags &= ~SubFlags.DIRTY;
      return this.value;
    }
  }

  set value(_: T) {
    error('Cannot set a computed value.');
  }

  get value(): T {
    if (this !== getActive()) { // prevent infinite subscription loop.
      this._observer.track();
    }
    return this._value;
  }
}

export const isComputed = (a: any): a is Computed<unknown> => a instanceof ComputedBase;

export function computed<T>(fn: Func0<T>): Computed<T> {
  if (isComputed(fn)) {
    return fn as Computed<T>;
  }

  const _computed = new ComputedBase<T>(fn);
  if (!activateSub(_computed)) {
    error('Issue with computed', fn.toString());
  }
  return _computed;
};
