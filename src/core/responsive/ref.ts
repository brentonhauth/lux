import { Observer } from './observer';

export interface Ref<T> {
  set value(a: T);
  get value(): T;
};

class RefBase<T> implements Ref<T> {

  private _observer: Observer;

  constructor(
    private _value: T,
  ) {
    this._observer = new Observer();
  }

  public get value(): T {
    this._observer.track();
    return this._value;
  }

  public set value(newValue: T) {
    if (this._value !== newValue) {
      this._value = newValue;
      this._observer.notify();
    }
  }
}

export const isRef = (a: any): a is Ref<unknown> => a instanceof RefBase;

export function ref<T>(value?: Ref<T>|T): Ref<T> {
  if (isRef(value)) {
    return value as Ref<T>;
  }
  return new RefBase<T>(value);
}
