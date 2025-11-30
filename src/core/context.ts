import { isDef } from '@lux/helpers/is';
import { ComponentInstance } from '@lux/vdom/component';
import { error, warn } from './logging';
import { functionBind } from '@lux/helpers/common';
import { Ref, isRef } from './responsive/ref';
import { AnyFunction, Func1 } from './types';

const EVENT_KEY = '$event';
// const STORE_KEY = '$store'; // soon...

export interface Context<T = any> {
  get data(): T;
  canWrite: boolean;
  event: Event;
}


export class BuildContext<T = any> implements Context<T> {

  public canWrite: boolean;
  public event: Event;

  private _data: T;
  private _boundMethods: { [k: string]: AnyFunction };

  constructor(
    private _instance: ComponentInstance,
  ) {
    this.event = null;
    this.canWrite = true;
    this._boundMethods = isDef(this._instance.methods) && {};
    this._data = <any>new Proxy(this._instance, {
      get: this._get.bind(this),
      set: this._set.bind(this),
      has: this._has.bind(this),
    });
  }

  get data(): T {
    return this._data;
  }

  set data(_: T) {
    error('Cannot set data on context.');
  }

  private _get({ state, props, methods }: ComponentInstance, key: string) {
    if (<any>key === Symbol.unscopables) {
      return null; // Can now be used in "with" statement.
    }

    if (key === EVENT_KEY) {
      return this.event;
    }

    if (isDef(props) && (key in props)) {
      return Reflect.get(props, key);
    }

    if (isDef(state) && (key in state)) {
      return Reflect.get(state, key);
    }

    if (isDef(methods) && (key in methods)) {
      return this._boundMethods[key] || (
        this._boundMethods[key] = functionBind(this._data, Reflect.get(methods, key))
      );
    }

    warn(`Could not find "${key}" in current context.`);
    return undefined;
  }

  private _set({ state }: ComponentInstance, key: string, newValue: any) {
    if (isDef(state) && (key in state)) {
      if (this.canWrite) {
        return Reflect.set(state, key, newValue);
      } else {
        warn(`Cannot edit the value of "${key}" at this time.`);
        return false;
      }
    }

    warn(`Cannot edit "${key}" as it is read only.`);
    return false;
  }

  private _has(target: ComponentInstance, key: string) {
    return (
      Reflect.has(target.state, key) ||
      Reflect.has(target.props, key) ||
      Reflect.has(target.methods, key) ||
      (isDef(this.event) && key === EVENT_KEY)
    );
  }
}

export class IteratorContext<T = any> implements Context<T> {

  private _data: T;

  constructor(
    private _alias: string,
    public item: Ref<any>|any,
    private _context: Context,
  ) {
    this._data = <any>new Proxy(this._context, {
      get: this._get.bind(this),
      set: this._set.bind(this),
      has: this._has.bind(this),
    });
  }

  get canWrite(): boolean {
    return this._context.canWrite;
  }
  set canWrite(value: boolean) {
    this._context.canWrite = value;
  }

  get event(): Event {
    return this._context.event;
  }
  set event(e: Event) {
    this._context.event = e;
  }

  get data(): T {
    return this._data;
  }
  set data(_: T) {
    error('Cannot set data on context.');
  }

  private _get(context: Context, key: string) {
    if (<any>key === Symbol.unscopables) {
      return null;
    }

    return (key === this._alias)
      ? (isRef(this.item) ? this.item.value : this.item)
      : Reflect.get(context.data, key);
  }

  private _set(context: Context, key: string, newValue: any) {
    if (key === this._alias) {
      warn(`Cannot set iterator "${this._alias}"`);
      return false;
    }
    return Reflect.set(context.data, key, newValue);
  }

  private _has(context: BuildContext, key: string) {
    return key === this._alias || Reflect.has(context.data, key);
  }
}


export function iteratorContext<T = any>(alias: string, item: Ref<any>|any, context: Context<T>) {
  return new IteratorContext<T>(alias, item, context);
}


export function buildContext<T = any>(instance: ComponentInstance) {
  return new BuildContext<T>(instance);
}

export function blockWriteCall<T = any, R = any>(ctx: Context<T>, fn: Func1<T, R>): R {
  const couldWrite = ctx.canWrite;
  try {
    ctx.canWrite = false;
    return fn(ctx.data);
  } catch (e) {
    error(e);
  } finally {
    ctx.canWrite = couldWrite;
  }
}
