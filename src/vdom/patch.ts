import { isArray, isDef, isUndef } from '@lux/helpers/is';
import { UniqueVNodeTag, VNode, VNodeFlags } from './vnode';
import { bindAttribute, render } from './render';
import { RuntimeFlags } from './component';
import { error } from '@lux/core/logging';
import { MaybeArray, Renderable, Simple } from '@lux/core/types';
import { EMPTY_ARR, EMPTY_OBJ, arrayWrap } from '@lux/helpers/common';
import { getAnchor, insertAfter, insertBefore } from '@lux/helpers/dom';
import { isComputed } from '@lux/core/responsive/computed';

const LIST_BF_LIMIT = 5;

interface Anchor {
  element: Element|Node;
  isSibling: boolean;
};

const makeAnchor = (element: Element|Node, isSibling: boolean): Anchor => ({
  element,
  isSibling,
});


export function patch(a: VNode, b: VNode, container?: Element): void {
  if (a === b) {
    return; // no changes.
  } else if (a.type !== b.type) {
    return replace(a, b, container);
  }
  console.log(a.type, '->', b.type, '');

  switch (a.type) {
    case UniqueVNodeTag.TEXT:
    case UniqueVNodeTag.COMMENT:
      if (a.text !== b.text) {
        a.$el.textContent = b.text;
      }
      b.$el = a.$el;
      break;
    case UniqueVNodeTag.COMPONENT:
      patchComponent(a, b, container);
      break;
    case UniqueVNodeTag.BLOCK:
      patchBlock(a, b, container);
      break;
    default:
      patchElement(a, b, container);
      break;
  }
}

export function patchUnkeyedList(aList: Array<VNode>, bList: Array<VNode>, container: Element): void {
  console.log('BLIST (patchUnkeyedList)', bList);
  if (isUndef(bList)) {
    throw new Error('UEUEUUEUUEU');
  }
  const min = Math.min(aList.length, bList.length);
  for (let i = 0; i < min; ++i) {
    patch(aList[i], bList[i], container);
  }
  if (aList.length > bList.length) {
    for (let i = aList.length - 1; i >= bList.length; --i) {
      unmount(aList[i], false);
    }
  } else if (aList.length < bList.length) {
    for (let i = aList.length; i < bList.length; ++i) {
      let el = render(bList[i], container);
      insertAfter(container, bList[i - 1]?.$el, el);
    }
  }
}

// Exported so that blocks can inject into this
export function patchKeyedList(aList: Array<VNode>, bList: Array<VNode>, container: Element): void {
  console.log(aList, bList);
  const alen = aList.length, blen = bList.length;
  // if (alen === 0) {
  //   for ()
  // } else if (alen === 1) {
  //   // Adding all elements in b.
  //   patchOneToMany();
  //   return;
  // } else if (blen === 0) {
  //   for (let a of aList) {
  //     unmount(a, false);
  //   }
  // } else if (blen === 1) { // b[0] could be a comment.
  //   let bkey = bList[0].key;
  //   for ()
  //   // Removing all the elements from b
  //   // patchManyToOne();
  //   return;
  // }


  const min = Math.min(alen, blen);

  let start = 0;

  let a = aList[start];
  let b = bList[start];

  // sync forwards.
  // ([a, b, c], d, e, f)
  // ([a, b, c], X, Y, Z)
  while (a.key === b.key && start < min) {
    patch(a, b, container); // quick patch just in case
    a = aList[++start]; // queue up next nodes to be checked.
    b = bList[start];
  }

  if (start === alen) {
    // Need to add the other items from list b
    // (a, b, c)
    // (a, b, c, [d, e, f])  -- add tail
    for (let i = start; i < blen; ++i) {
      let el = render(bList[i], container);
      insertAfter(container, bList[i - 1]?.$el, el);
    }
    return;
  }

  if (start === blen) {
    // (a, b, c, [d, e, f])
    // (a, b, c)   -- remove tail
    for (let i = (alen - 1); i >= start; --i) {
      unmount(aList[i], false);
    }
    return;
  }

  // sync backwards.
  // (a, b, c, [d, e, f])
  // (X, Y, Z, [d, e, f])
  let ea = alen - 1;
  let eb = blen - 1;
  a = aList[ea];
  b = bList[eb];

  while (a.key === b.key) {
    patch(a, b, container);
    a = aList[--ea];
    b = bList[--eb];
    if (start > ea || start > eb) {
      break;
    }
  }

  if (start > ea && start <= eb) {
    // (a, b, c, d, e)
    // (a, b, c, [X, Z], d, e)   -- insert (X, Z)
    for (let i = start; i <= eb; ++i) {
      let el = render(bList[i], container);
      insertAfter(container, bList[i - 1]?.$el, el);
    }
  } else if (start > eb && start <= ea) {
    // (a, b, c, [X, Z], d, e)
    // (a, b, c, d, e)   -- remove (X, Z)
    for (let i = start; i <= ea; ++i) {
      unmount(aList[i], false);
    }
  } else {
    // Unknown patch in middle.
    // (a, b, c, d, [Z], e, f)
    // (a, b, c, d, [X, Y], e, f)
    let end = Math.max(ea, eb);
    if ((end - start) <= LIST_BF_LIMIT) {
      // Just do brute force if the maximum size of the
      // patch is less than the pre defined limit.
      patchUnknownListBF(container, aList, bList, start, ea, eb);
    } else {
      patchUnknownList(container, aList, bList, start, ea, eb);
    }
  }
}

function patchOneToMany(a: VNode, bList: Array<VNode>, container: Renderable) {
  let anchor: Renderable;

  if (isDef(a)) {
    anchor = unmount(a);
  }
}

function patchManyToOne(aList: Array<VNode>, b: VNode, container: Renderable) {}

function patchUnknownList(
  parent: Element,
  aList: Array<VNode>,
  bList: Array<VNode>,
  start: number,
  ea: number,
  eb: number
): void {
  const indexLookup = new Map<Simple, number>(bList.map((b, i) => [b.key, i]));
  const patchTotal = eb - start + 1;
  let patched = 0;
  let maxed = 0;
  let hasMoved = false;

  const positions = new Int32Array(patchTotal);

  for (let i = start; i <= ea; ++i) {
    let a = aList[i];
    if (patched < patchTotal) {
      let j = indexLookup.get(a.key);
      if (isDef(j)) {
        positions[j - start] = i + 1;
        if (j >= maxed) {
          maxed = j;
        } else {
          hasMoved = true;
        }
        // Quick patch of b.
        patch(a, bList[j], parent);
        ++patched;
        continue; // currently with "b"
      }
    }
    // "a" is not in bList.
    unmount(a, false);
  }

  if (hasMoved) {
    const seq = longestSequence(positions);
    let j = seq.length - 1;
    for (let i = patchTotal - 1; i >= 0; --i) {
      let next = start - 1;
      let b = bList[next];
      let anchor = bList[next + 1]?.$el;
      if (positions[i] === 0) {
        let el = render(b, parent) as Renderable;
        insertBefore(parent, el, anchor);
      } else if (j < 0 || i !== seq[j]) {
        insertBefore(parent, b.$el, anchor);
      } else {
        --j;
      }
    }
  }
}


function patchUnknownListBF(
  parent: Element,
  aList: Array<VNode>,
  bList: Array<VNode>,
  start: number,
  ea: number,
  eb: number
): void {
  const copied = aList.slice(start, ea + 1);
  for (let i = start; i <= eb; ++i) {
    let b = bList[i];
    let j = copied.findIndex(v => v.key === b.key);
    if (j >= 0) {
      patch(copied[j], b, parent); // Hopefully b has a ref to copied[j].$el in patch
      insertAfter(parent, bList[i - 1]?.$el, b.$el);
      copied.splice(j, 1);
    } else {
      let el = render(b, parent);
      insertAfter(parent, bList[i - 1]?.$el, el);
    }
  }
  // Remove ununsed nodes in new tree.
  for (let a of copied) {
    unmount(a, false);
  }
}


function longestSequence(list: Int32Array|Array<number>) {
  const p = new Int32Array(list.length);
  const result = new Int32Array(list.length);
  let lo: number, hi: number;
  let rlen = 0;
  const len = list.length;

  for (let i = 0; i < len; ++i) {
    let arrI = list[i];
    if (arrI === 0) {
      continue;
    }

    let j = result[rlen];
    if (list[j] < arrI) {
      p[i] = j;
      result[++rlen] = i;
      continue;
    }

    lo = 0;
    hi = rlen;

    while (lo < hi) {
      let mid = (lo + hi) >> 1;
      if (list[result[mid]] < arrI) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    if (arrI < list[result[lo]]) {
      if (lo > 0) {
        p[i] = result[lo - 1];
      }
      result[lo] = i;
    }
  }

  lo = rlen + 1;
  const s = new Int32Array(lo);
  hi = result[lo - 1];

  while (lo-- > 0) {
    s[lo] = hi;
    hi = p[hi];
    result[lo] = 0;
  }

  return s;
}


function patchComponent(a: VNode, b: VNode, container: Element): void {
  if (a.component !== b.component || a.instance !== b.instance) {
    replace(a, b, container);
  }
  // Not sure if more to do for component patching. Only time will tell.
}

function patchBlock(a: VNode, b: VNode, container: Element): void {
  if (a.block !== b.block) {
    replace(a, b, container);
    return;
  }
  // Not sure if more to do for block patching. Only time will tell.
}

function patchElement(a: VNode, b: VNode, _container: Element): void {
  patchAttributes(a, b, (b.$el = a.$el));
  if ((a.flags & b.flags) & VNodeFlags.KEYED_CHILDREN) {
    patchKeyedList(a.children, b.children, a.$el);
  } else {
    patchUnkeyedList(a.children, b.children, a.$el);
  }
}

function patchAttributes(a: VNode, b: VNode, el: Element): void {
  const aStatics: any = a.attrs?.statics || EMPTY_OBJ;
  const bStatics: any = b.attrs?.statics || EMPTY_OBJ;

  const aDynamics: any = a.attrs?.dynamics || EMPTY_OBJ;
  const bDynamics: any = b.attrs?.dynamics || EMPTY_OBJ;

  const aEvents: any = a.attrs?.events || EMPTY_OBJ;
  const bEvents: any = b.attrs?.events || EMPTY_OBJ;

  const newAttrs = (
    bStatics !== EMPTY_OBJ ||
    bDynamics !== EMPTY_OBJ
  ) ? { ...bStatics, ...bDynamics } : EMPTY_OBJ;

  for (let name in aStatics) {
    if (name in bStatics) {
      // static -> static (value change)
      if (aStatics[name] !== bStatics[name]) {
        el.setAttribute(name, bStatics[name]);
      }
      delete newAttrs[name];
    } else if (name in bDynamics) {
      // static -> dynamic
      delete (el as any)?.__subs?.[name]; // TODO: Have a "kill()" function
      delete newAttrs[name];
      bindAttribute(el, name, bDynamics[name]);
    } else {
      // static -> NIL
      el.removeAttribute(name);
    }
  }

  for (let name in aDynamics) {
    if (name in bStatics) {
      // dynamic -> static
      delete (el as any)?.__subs?.[name];
      delete newAttrs[name];
      el.setAttribute(name, bStatics[name]);
    } else if (name in bDynamics) {
      // dynamic -> dynamic (Update computed)
      if (aDynamics[name] !== bDynamics[name]) {
        delete (el as any)?.__subs?.[name];
        bindAttribute(el, name, bDynamics[name]);
      }
      delete newAttrs[name];
    } else {
      delete (el as any)?.__subs?.[name];
    }
  }

  // TODO: Update styles and classes...

  for (let name in newAttrs) {
    // All that are left should be the new attributes
    let attr = newAttrs[name];
    if (isComputed(attr)) {
      bindAttribute(el, name, attr);
    } else {
      el.setAttribute(name, attr);
    }
  }

  // TODO: Have better way of purging and re-adding all events
  for (let name in aEvents) {
    el.removeEventListener(name, aEvents[name]);
  }

  for (let name in bEvents) {
    el.addEventListener(name, bEvents[name]);
  }
}

function unmount(a: VNode, keepAnchor: false): void;
function unmount(a: VNode, keepAnchor?: true): Renderable;
function unmount(a: VNode, keepAnchor: boolean = true): Renderable|void {
  // Tell VNode it's unmounted first.
  a.flags &= ~VNodeFlags.MOUNTED;

  const { instance, children } = a;
  let anchor: Renderable;

  // Setup anchor to replace new node with.
  if (keepAnchor) {
    anchor = getAnchor(a);
    if (isDef(anchor)) {
      // Tell self not to throw out when unmounting everything else
      anchor.__keep = true;
    }
  }

  // Tear down instance
  if (isDef(instance) && (instance.flags & RuntimeFlags.MOUNTED)) {
    // Tear down
    // TODO: Have quick access list of instances to tear
    instance.flags &= ~(RuntimeFlags.MOUNTED | RuntimeFlags.ACTIVE);
  }

  // Tear down children
  if (isDef(children)) {
    for (let child of children) {
      unmount(child, false);
    }
  }

  if (!(a.$el.__keep)) {
    a.$el.remove?.();
  }

  if (keepAnchor) {
    return anchor;
  }
}

function replace(a: VNode, b: VNode, container: Renderable): void {
  const anchor = unmount(a);
  let el = render(b, container);
  if (anchor?.isConnected) {
    anchor.replaceWith(el);
  } else {
    error('Anchor is not mounted.');
  }
}

