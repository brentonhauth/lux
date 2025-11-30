import { Func0 } from '@lux/core/types';
import { activateSub, SubFlags, Subscriber } from './registry';
import { error } from '@lux/core/logging';
import { Observer } from './observer';

class Effect<T = any> implements Subscriber<T> {

  public observing: Set<Observer>;
  public flags: SubFlags;

  private _value: T;

  constructor(
    private readonly _fn: Func0<T>,
  ) {
    this.flags = SubFlags.DIRTY;
    this.observing = new Set<Observer>();
  }

  public run(): T {
    if (this.flags & SubFlags.DIRTY) {
      this._value = this._fn();
      this.flags &= ~SubFlags.DIRTY;
    }
    return this._value;
  }
}

export const effect = <T>(fn: Func0<T>): Subscriber<T> => {
  const _effect = new Effect(fn);
  if (!activateSub(_effect)) {
    error('Issue with effect', fn.toString());
  }
  return _effect;
}