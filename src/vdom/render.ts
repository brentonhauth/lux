import { isCommentVNode, isDef, isElement, isString, isTextVNode, isUndef, isVNode } from '@lux/helpers/is';
import { applyAll, applyAllAttrs, forIn } from '@lux/helpers/functions';
import { arrayWrap } from '@lux/helpers/array';
import { dom } from '@lux/helpers/dom';
import { Renderable } from '@lux/types';
import { VNode } from './vnode';

export function $render(node: Renderable): Element {
  return _render2(node);
}

function _render(node: Renderable): Element {
  if (isUndef(node)) {
    return <any>dom.createComment('NULL');
  } else if (isString(node)) {
    return <any>dom.createText(node);
  }

  if (!node.tag) {
    node.$el = <any>dom.createComment('');
    return node.$el;
  }

  node.$el = dom.createElement(node.tag);
  applyAllAttrs(node);
  if (node.data?.style) {
    applyAll((<any>node.$el).style, node.data.style);
  }

  if (isDef(node.children)) {
    let children = arrayWrap(node.children);
    children.forEach(c => {
      if (isUndef(c)) {
        node.$el.appendChild(dom.createComment());
      } else if (isString(c)) {
        node.$el.appendChild(dom.createText(c));
      } else if (isVNode(c)) {
        c.$el = $render(c);
        node.$el.appendChild(c.$el);
      }
    });
  }

  return node.$el;
}

function _render2(node: Renderable): Element {
  if (isUndef(node)) {
    return <any>dom.createComment('NULL');
  } else if (isString(node)) {
    return <any>dom.createText(node);
  }

  if (isCommentVNode(node)) {
    return node.$el = <any>dom.createComment(node.comment);
  } else if (isTextVNode(node)) {
    return node.$el = <any>dom.createText(node.text);
  }

  node.$el = dom.createElement(node.tag);
  applyAllAttrs(node);
  if (node.data?.style) {
    forIn(node.data.style, (k, v) => {
      (<any>node.$el).style[(<any>k)] = v;
    });
  }

  if (isDef(node.children)) {
    let children = arrayWrap(node.children);
    children.forEach(c => {
      if (isString(c)) {
        node.$el.appendChild(dom.createText(c));
      } else if (isVNode(c)) {
        c.$el = $render(c);
        node.$el.appendChild(c.$el);
      }
    });
  }

  return node.$el;
}

export function $mount(node: Element|VNode, target: Element): Element {
  if (isElement(node)) {
    target.appendChild(node);
    return node;
  } else if (isUndef(node.$el)) {
    node.$el = $render(node);
  }
  target.appendChild(node.$el);
  return node.$el;
}
