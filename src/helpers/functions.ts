import { ArrayOrSingle, Key } from "../types";
import { VNode, VNodeAttrs } from "../vdom/vnode";
import { dom } from "./dom";
import is from "./is";

export function forIn(object: any, fn: (k: Key, v: any) => void) {
  for (let i in object) {
    fn(i, object[i]);
  }
}

export function applyAll(to: any, props: Record<string|number|symbol, any>) {
  for (let k in props) {
    let v = props[k];
    if (is.object(v)) {
      if (is.undef(to[k])) to[k] = {};
      applyAll(to[k], v);
    } else {
      to[k] = v;
    }
  }
}

export function callFn<T>(obj: any, name: string, params?: any[], default0?: T): T {
  if (is.def(obj)) {
    return is.fn(obj[name])
      ? obj[name].call(obj, arrayWrap(params))
      : default0;
  }
  return default0;
}

export function noop() {}

export function identity<T>(a: T): T { return a; }

export function flattenArray<T>(a: Array<ArrayOrSingle<T>>): T[] {
  const flat: T[] = [];
  for (let e of a) {
    if (is.array(e)) {
      flat.push(...(<T[]>flattenArray(<any>e)));
    } else {
      flat.push(e);
    }
  }
  return flat;
}

export function arrayWrap<T>(a: ArrayOrSingle<T>): T[] {
  if (is.array(a)) {
    return a;
  } else if (is.undef(a)) {
    return [];
  } else {
    return [a];
  }
}

export function arrayUnwrap<T>(a: ArrayOrSingle<T>, index=0): T|null {
  if (is.array(a)) {
    return is.def(a[index]) ? a[index] : null;
  } else {
    return is.def(a) ? a : null;
  }
}

// export function compare(object: Record<Key, any>, object: Record<Key, any>) {}

export function applyAllAttrs(node: Element|VNode, attrs?: VNodeAttrs) {
  let el: Element;
  if (is.vnode(node)) {
    attrs = node.data?.attrs;
    el = node.$el;
  } else {
    el = node;
  }
  if (is.undef(el)) return;
  forIn((attrs || {}), (k, v) => {
    if (is.object(v)) {
      applyAll((<any>el)[k], v);
    } else {
      dom.setAttr(el, String(k), v);
    }
  });
}

export function removeFromArray<T>(array: T[], field: ArrayOrSingle<T>, compare?: (a:T,b:T)=>boolean): T[] {
  field = <T[]>flattenArray(arrayWrap(field));
  compare = compare || ((a, b) => a === b);
  for (let f of field) {
    let i = array.findIndex(v => compare(v, f));
    array.splice(i, 1);
  }
  return array;
}

export function overlappedItems<T>(a1: T[], a2: T[], compare?: (a:T,b:T)=>boolean): T[] {
  const overlap: T[] = [];
  compare = compare || ((a, b) => a === b);
  for (let x of a1) {
    let i = a2.findIndex(y => compare(x, y));
    if (i !== -1) {
      overlap.push(a2[i]);
    }
  }
  return overlap;
}

export function minimizeArray<T>(array: T[]): ArrayOrSingle<T>|null {
  return array.length <= 1 ? (array[0] || null) : array;
}
