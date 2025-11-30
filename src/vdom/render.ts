import { isArray, isDef, isUndef, isUndefOrEmpty } from '@lux/helpers/is';
import { UniqueVNodeTag, VNode, VNodeFlags } from './vnode';
import { EMPTY_STRING } from '@lux/helpers/strings';
import { type Computed, isComputed } from '@lux/core/responsive/computed';
import { RuntimeFlags, createInstance } from './component';
import { watch } from '@lux/core/responsive/watcher';
import { createState } from '@lux/core/responsive/state';
import { error, warn } from '@lux/core/logging';
import { effect } from '@lux/core/responsive/effect';
import { MaybeArray, Renderable } from '@lux/core/types';
import { patch, patchKeyedList } from './patch';
import { arrayWrap } from '@lux/helpers/common';
import {
  createAttribute,
  createComment,
  createElement,
  createFragment,
  createTextNode
} from '@lux/helpers/dom';
import { Subscriber } from '@lux/core/responsive/registry';
import { ConditionBlock } from './block';



export function render(node: VNode, container: Renderable): Renderable|Node {
  // TODO: Maybe change "MOUNTED"? Just need a marker to tell lower levels it's in use.
  node.flags |= VNodeFlags.MOUNTED;
  const el = <Element>renderBase(node, container);
  return (node.$el = el);
}


function renderBase(node: VNode, container: Element): Renderable|Node {
  if (isUndef(node)) {
    return <any>createComment(EMPTY_STRING);
  }

  switch (node.type) {
    case UniqueVNodeTag.COMPONENT:
      return renderComponent(node, container);
    case UniqueVNodeTag.BLOCK:
      return renderBlock(node, container);
    case UniqueVNodeTag.TEXT:
      return createTextNode(node.text || EMPTY_STRING);
    case UniqueVNodeTag.COMMENT:
      return createComment(node.text);
    default:
      return renderElement(node, container);
  }
}

function renderElement(node: VNode, _container: Renderable): Renderable {
  let el;
  try {
    el = <Renderable>createElement(node.type);
  } catch (e) {
    error(e);
    return null;
  }
  handleAttributes(node, el);
  handleChildren(node, el, el); // element is new container for it's children
  return el;
}

export function bindAttribute(el: Element, name: string, computed: Computed) {
  let attribute = createAttribute(name);
  el.setAttributeNode(attribute);
  const sub = watch(computed, value => {
    // TODO: change logic for this right now.
    attribute.value = value;
  });
  if (isUndef((el as any).__subs)) {
    (el as any).__subs = {};
  }
  (el as any).__subs[name] = sub;
}


function handleAttributes(node: VNode, el: Element) {
  if (isUndef(node.attrs)) {
    return;
  }

  const {
    dynamics,
    statics,
    classes,
    styles,
    events
  } = node.attrs;

  for (let name in statics) {
    el.setAttribute(name, String(statics[name]));
  }

  for (let name in dynamics) {
    bindAttribute(el, name, dynamics[name]);
  }

  if (isDef(events)) {
    for (let name in events) {
      // TODO: Remove event listeners
      el.addEventListener(name, events[name]);
    }
  }

  if (isDef(classes)) {
    if (isComputed(classes)) {
      bindAttribute(el, 'class', classes);
    } else {
      // TODO: Implement alternatives for classes.
    }
  }

  if (isDef(styles)) {
    if (isComputed(styles)) {
      bindAttribute(el, 'style', styles);
    } else {
      // TODO: Implement alternatives for styles.
    }
  }

}

function handleChildren(node: VNode, parent: Renderable, container: Renderable) {
  if (isUndefOrEmpty(node.children)) {
    return;
  }

  for (let child of node.children) {
    let el = render(child, container);
    if (isArray(el)) {
      el.forEach(e => parent.appendChild(e));
    } else {
      parent.appendChild(el);
    }
  }
}

function renderBlock(node: VNode, container: Element): Renderable {
  const { block } = node;
  const frag: DocumentFragment = createFragment();
  let vnodes: MaybeArray<VNode> = null;
  node.children = null; // Clear Children first (for safety).
  let sub: Subscriber<MaybeArray<VNode>>;

  sub = (block instanceof ConditionBlock)
  ? effect<VNode>(() => {
    let newNode: VNode;
    if (node.flags & VNodeFlags.MOUNTED) {
      newNode = block.gen() as VNode;
      if (isDef(node.children)) {
        patch(node.children[0], newNode, container);
        node.children = [newNode];
      }
    }
    return newNode;
  })
  : effect<Array<VNode>>(() => {
    let newNodes: Array<VNode>;
    if (node.flags & VNodeFlags.MOUNTED) {
      newNodes = arrayWrap(block.gen());
      if (isDef(node.children)) {
        patchKeyedList(node.children, newNodes, container);
        node.children = newNodes;
      }
    }
    return newNodes;
  });

  vnodes = sub.run(); // get value
  node.children = arrayWrap(vnodes);
  handleChildren(node, <any>frag, container);
  return <any>frag;
}


function renderComponent(node: VNode, container: Renderable): Renderable {
  const Comp = node.component;
  const instance = createInstance(Comp);
  instance.flags |= RuntimeFlags.ACTIVE; // Activate the component.

  const {
    dynamics,
    statics,
    // classes,
    // styles,
    // events
  } = node.attrs;


  const propNames = new Set(Comp.props);

  for (let key in statics) {
    if (propNames.has(key)) {
      // Only assign props that are previously assigned.
      instance.props[key] = statics[key];
    } else {
      warn(`Property "${key}" was not previously defined on the component. Ignoring.`);
    }
  }

  if (Object.keys(dynamics).length > 0) {
    // Props are readonly with context.data, I can still write to them internally.
    instance.props = createState(instance.props);
    for (let key in dynamics) {
      if (propNames.has(key)) {
        watch(dynamics[key], value => {
          if (instance.flags & RuntimeFlags.ACTIVE) {
            // Only update if active. Will auto teardown if not used.
            instance.props[key] = value;
          }
        });
      } else {
        warn(`Property "${key}" was not previously defined on the component. Ignoring.`);
      }
    }
  }

  node.instance = instance;

  // Save VDOM of child to Component child.
  const vdom = Comp.gen(instance.context);
  node.children = [vdom];
  instance.flags |= RuntimeFlags.MOUNTED; // TODO: Maybe mount in different spot.

  // TODO: *Same reason in render(...)
  node.flags |= VNodeFlags.MOUNTED;
  return renderElement(vdom, container);
}
