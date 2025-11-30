import { notify, remove, track } from './registry';
import { compareDeep } from '@lux/helpers/common';
import { error } from '@lux/core/logging';
import { isRef } from './ref';
import { isComputed } from './computed';
import { isArray, isObject } from '@lux/helpers/is';


const readonlySetOrDelete = (_: any, prop: any) => {
  error(`Target is readonly. Cannot set or delete property: "${prop}".`);
  return false;
};


const regularSet = (target: any, prop: any, newValue: any, receiver: any) => {
  const prev = Reflect.get(target, prop, receiver);
  if (isRef(prev)) {
    // TODO: Check if Ref was passed as new value. Don't know what to do for it.
    prev.value = newValue; // did change logic happens lower
    return true;
  } else if (isComputed(prev)) {
    error('Cannot set value of computed property.');
    return false;
  }

  let didset = Reflect.set(target, prop, newValue, receiver);
  if (!compareDeep(prev, newValue)) {
    notify(target, prop);
  }
  return didset;
};

const regularGet = (target: any, prop: any, receiver: any) => {
  const ret = Reflect.get(target, prop, receiver);
  if (isRef(ret) || isComputed(ret)) {
    return ret.value;
  }
  track(target, prop);
  return ret;
};

const regularHas = (target: any, prop: any) => Reflect.has(target, prop);

const regularDelete = (target: any, prop: any) => {
  const prev = Reflect.get(target, prop);
  Reflect.deleteProperty(target, prop);
  if (isRef(prev)) {
    prev.value = undefined;
    return true;
  } else if (!isComputed(prev)) {
    return remove(target, prop);
  }
  return true;
};

export function createState<T extends object = any>(obj: T, isReadonly=false): T {
  if (!isObject(obj) || isArray(obj)) {
    error('Object must be made from a plane JavaScript object. e.g. "{}"');
    return null;
  }

  return new Proxy(obj, {
    set: isReadonly ? readonlySetOrDelete : regularSet,
    deleteProperty: isReadonly ? readonlySetOrDelete : regularDelete,
    get: regularGet,
    has: regularHas,
  });
}


/**
 * @deprecated not using anymore.
 */
export function mixinState<S extends object, P extends object>(state: S, more: P): S & P {
  const merge = { state, more };

  // Don't use receiver here
  const proxy: S & P = <any>new Proxy(merge, {
    get(target, prop) {
      if (prop in target.more) {
        return Reflect.get(target.more, prop);
      }
      return Reflect.get(target.state, prop);
    },
    set(target, prop, newValue) {
      if (prop in target.more) {
        return Reflect.set(target.more, prop, newValue);
      }
      return Reflect.set(target.state, prop, newValue);
    },
  });
  return proxy;
}
