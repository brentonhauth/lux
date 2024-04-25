import { AnyFunction, Key, State } from '@lux/types';
import { VNode, VNodeAttrs } from '@lux/vdom/vnode';
import { arrayWrap } from './array';
import { dom } from './dom';
import { isArray, isDef, isFunc, isObject, isObjectLike, isUndef, isVNode } from './is';

const pureNumRE = /^([1-9]\d*|0)$/;

let UUID = 0;

export const uuid = (): number => UUID++;

export function cached<T>(fn: (p: string)=>T): (p:string)=>T {
  const cache: Record<string, T> = Object.create(null);
  return function(p: string) {
    return p in cache ? cache[p] : (cache[p] = fn(p));
  };
}

export function once<T extends AnyFunction>(fn: T): T {
  let call = true;
  return <T>(function() {
    if (call) {
      call = false;
      return fn.apply(this, arguments);
    }
  });
}

const splitPath = cached((path: string) => {
  const absPath = path.trim().split('.');
  return absPath.map(s => pureNumRE.test(s) ? Number(s) : s);
});

/**
 * Based on lodash's "_.get" function
 * Licensed under the MIT License
 * https://github.com/lodash/lodash/blob/HEAD/LICENSE
 */
export function safeGet<T>(obj: any, path: string, default0?: T): T {
  const absPath = splitPath(path);
  for (let p of absPath) {
    if (isDef(obj)) {
      obj = obj[p];
    } else {
      return default0;
    }
  }
  return obj;
}

export function forIn(object: any, fn: (k: Key, v: any) => void) {
  for (let i in object) {
    fn(i, object[i]);
  }
}

export function applyAll(to: any, props: Record<string|number|symbol, any>) {
  for (let k in props) {
    let v = props[k];
    if (isObject(v)) {
      if (isUndef(to[k])) to[k] = {};
      applyAll(to[k], v);
    } else {
      to[k] = v;
    }
  }
}

export function callFn<T>(obj: any, name: string, params?: any[], default0?: T): T {
  if (isDef(obj)) {
    return isFunc(obj[name])
      ? obj[name].call(obj, arrayWrap(params))
      : default0;
  }
  return default0;
}

export function noop() {}

export function identity<T>(a: T): T { return a; }

export function applyAllAttrs(node: Element|VNode, attrs?: VNodeAttrs) {
  let el: Element;
  if (isVNode(node)) {
    attrs = node.data?.attrs;
    el = node.$el;
  } else {
    el = node;
  }
  if (isUndef(el)) return;
  forIn((attrs || {}), (k, v) => {
    if (isObject(v)) {
      applyAll((<any>el)[k], v);
    } else {
      dom.setAttr(el, String(k), v);
    }
  });
}

export function compareDeep(a: any, b: any) {
  if (a === b) {
    return true;
  } else if (isArray(a)) {
    if (isArray(b) && a.length === b.length) {
      for (let i = 0; i < a.length; ++i) {
        if (!compareDeep(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }
  } else if (isObjectLike(a)) { // optimized: same if isObject is called
    if (!isObject(b)) return false;
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length === bKeys.length) {
      for (let key of aKeys) {
        if (!bKeys.includes(key)) {
          return false;
        } else if (!compareDeep(a[key], b[key])) {
          return false;
        }
      }
      return true;
    }
  }
  return false;
}
