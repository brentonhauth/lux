import { dom } from '@lux/helpers/dom';
import { isCommentVNode, isTextVNode } from '@lux/helpers/is';
import { ignoreCaseEquals } from '@lux/helpers/strings';
import { $render } from './render';
import { VNode, VNodeAttrs } from './vnode';

function replace(elm: Element, _vOld: VNode, vNew: VNode) {
  const e = $render(vNew);
  elm.replaceWith(e);
}

function patch(elm: Element, vOld: VNode, vNew: VNode) {
  if (isCommentVNode(vOld)) {
    if (isCommentVNode(vNew)) {
      vNew.$el = elm;
    } else {
      replace(elm, vOld, vNew);
    }
  } else if (isTextVNode(vOld)) {
    if (isTextVNode(vNew)) {
      if (vOld.text !== vNew.text) {
        elm.textContent = vNew.text;
      }
      vNew.$el = elm;
    } else {
      replace(elm, vOld, vNew);
    }
  } else {
    if (!ignoreCaseEquals(vOld.tag, vNew.tag)) {
      replace(elm, vOld, vNew);
    } else {
      // TODO: Insert structure check here.
      patchChildren(elm, vOld.children, vNew.children);
      patchAttrs(elm, vOld.data?.attrs, vNew.data?.attrs);
      vNew.$el = elm;
    }
  }
}


function patchAttrs(elm: Element, oldAttrs: VNodeAttrs, newAttrs: VNodeAttrs) {
  oldAttrs = oldAttrs || {};
  newAttrs = newAttrs || {};

  for (let a in oldAttrs) {
    if (!(a in newAttrs)) {
      dom.delAttr(elm, a);
    } else if (oldAttrs[a] !== newAttrs[a]) {
      dom.setAttr(elm, a, newAttrs[a]);
    }
  }

  for (let n in newAttrs) {
    if (!(n in oldAttrs)) {
      dom.setAttr(elm, n, newAttrs[n]);
    }
  }
}


function patchChildren(parentElm: Element, vOld: VNode[], vNew: VNode[]) {
  const min = Math.min(vOld.length, vNew.length);
  for (let i = 0; i < min; ++i) {
    patch(<Element>parentElm.childNodes[i], vOld[i], vNew[i]);
  }

  if (vOld.length > vNew.length) {
    if (vNew.length === 0) {
      dom.removeAllChildren(parentElm);
    } else {
      for (let i = vOld.length - 1; i >= vNew.length; --i) {
        parentElm.removeChild(parentElm.lastChild);
      }
    }
  } else if (vOld.length < vNew.length) {
    for (let i = vOld.length; i < vNew.length; ++i) {
      let e = $render(vNew[i]);
      parentElm.appendChild(e);
    }
  }
}

export function difference(elm: Element, vOld: VNode, vNew: VNode) {
  patch(elm, vOld, vNew);
}
