import { isFunction, isUndef } from '@lux/helpers/is';
import { Func0, Func1 } from '../types';
import { Observer } from './observer';
import { SubFlags, Subscriber, activateSub, unsubscribe } from './registry';
import { error } from '../logging';
import { Ref } from './ref';

/**
 * Subscriber that is attached to an object. If the object is deleted,
 * then the watcher automatically cleans itself up.
 *
 * Maybe change, Idk. I wanted to do something with it that wasn't there.
 */
class ObjWatcher<T extends WeakKey> implements Subscriber {

  public observing: Set<Observer>;
  public flags: SubFlags;

  constructor(
    private _ref: WeakRef<T>,
    // obj: T,
    private _fn: Func1<T, void>
  ) {
    this.flags = SubFlags.DIRTY;
    this.observing = new Set<Observer>();
    // this._ref = new WeakRef<T>(obj);
  }

  public run(): void {
    let obj = this._ref.deref();
    if (isUndef(obj)) {
      this._cleanup();
      return;
    }

    if (this.flags & SubFlags.DIRTY) {
      this._fn(obj);
      this.flags &= ~SubFlags.DIRTY;
    }
  }

  private _cleanup() {
    for (let observer of this.observing) {
      unsubscribe(this, observer);
    }
  }

};

class Watcher<T, R = void> implements Subscriber<R> {

  public observing: Set<Observer>;
  public flags: SubFlags;

  private _result: R;

  constructor(
    private _src: Func0<T>|Ref<T>,
    private _fn: Func1<T, R>,
  ) {
    this.observing = new Set<Observer>();
    this.flags = SubFlags.DIRTY;
  }

  public run(): R {
    if (this.flags & SubFlags.DIRTY) {
      let value = isFunction(this._src) ? this._src() : this._src.value;
      this._result = this._fn(value);
      this.flags &= ~SubFlags.DIRTY;
    }
    return this._result;
  }
}


export function watch<T = any, R = void>(src: Func0<T>|Ref<T>, fn: Func1<T, R>): Subscriber<R> {
  const _watcher = new Watcher<T, R>(src, fn);
  if (!activateSub(_watcher)) {
    error('Issue with watcher', fn.toString());
  }
  return _watcher;
}
