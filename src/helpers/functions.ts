module lux {
  export function forIn(object: any, fn: (k: Key, v: any) => void) {
    for (let i in object) {
      fn(i, object[i]);
    }
  }

  export function applyAll(to: any, props: Record<string|number|symbol, any>) {
    for (let k in props) {
      let v = props[k];
      if (is.objectLike(v)) {
        if (is.undef(to[k])) to[k] = {};
        applyAll(to[k], v);
      } else {
        to[k] = v;
      }
    }
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

  export function applyAllAttrs(node: Element|VNode, attrs?: Record<string, any>) {
    let el: Element;
    if (is.vnode(node)) {
      attrs = node.attrs;
      el = node.$el;
    } else {
      el = node;
    }
    if (is.undef(el)) return;
    forIn((attrs || {}), (k, v) => {
      if (is.object(v)) {
        applyAll(el[k], v);
      } else {
        dom.setAttr(el, String(k), v);
      }
    });
  }

  export function minimizeArray<T>(array: T[]): ArrayOrSingle<T>|null {
    return array.length <= 1 ? (array[0] || null) : array;
  }
}
