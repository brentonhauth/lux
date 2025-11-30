import { UniqueVNodeTag, VNode } from '@lux/vdom/vnode';
import { isDef, isFunction, isUndef } from './is';
import { Renderable } from '@lux/core/types';


const getDocumentFn = <S extends keyof Document>(s: S): Document[S] => {
  const fn = document[s];
  return isFunction(fn) ? fn.bind(document) : fn;
};

export const createElement = getDocumentFn('createElement');
export const createTextNode = getDocumentFn('createTextNode');
export const createComment = getDocumentFn('createComment');
export const createAttribute = getDocumentFn('createAttribute');
export const createFragment = getDocumentFn('createDocumentFragment');


export const insertAfter = (parent: Element, ref: Element|null, node: Renderable|Element|Node): void => {
  if (isDef(ref)) {
    ref.insertAdjacentElement('afterend', node as Element);
  } else {
    parent.appendChild(node); // Append the child if no reference.
  }
};

export const insertBefore = (parent: Element, node: Element|Node, next: Element|null): void => {
  if (isDef(next)) {
    parent.insertBefore(node, next);
  } else {
    parent.appendChild(node);
  }
};


export const getParent = (node: VNode|Element|Node): Element => {
  if (isUndef((<Element>node)?.nodeType)) {
    node = (<VNode>node).$el;
  }
  return (<Element>node).parentElement;
};

export const getNextRenderable = (vnode: VNode, index?: number): Renderable => {
  if (isDef(index)) {
    let next = vnode.children[index + 1];
    return next?.$el || getNextRenderable(vnode.children[index]);
  }
  return vnode?.$el?.nextSibling as Renderable;
};

export const getPrevRenderable = (vnode: VNode, index?: number): Renderable => {
  if (isDef(index)) {
    let prev = vnode.children[index - 1];
    return prev?.$el || getPrevRenderable(vnode.children[index]);
  }
  return vnode?.$el?.previousSibling as Renderable;
};


export const getAnchor = (vnode: VNode): Renderable => {
  if (isUndef(vnode)) {
    return null;
  } else if ( // Blocks or Components technically don't have real nodes.
    vnode.type === UniqueVNodeTag.BLOCK ||
    vnode.type === UniqueVNodeTag.COMPONENT
  ) {
    return getAnchor(vnode.children?.[0]); // get anchor of first child
  } else {
    return vnode.$el;
  }
};
