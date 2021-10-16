import { Key, Reference } from "../types";
import { VNode, VNodeAttrs } from "../vdom/vnode";
import { arrayWrap } from "./array";
import { dom } from "./dom";
import { isDef, isFunc, isObject, isUndef, isVNode } from "./is";

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

export function ref<T>(value?:T): Reference<T> {
  // TODO: Link references
  return {
    value,
    __isRef: true,
    get() {
      return this.value;
    },
    set(value:T) {
      this.value = value;
    },
  };
}

export function noop() {}

export function identity<T>(a: T): T { return a; }

// export function compare(object: Record<Key, any>, object: Record<Key, any>) {}

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
