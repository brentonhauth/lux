import { isCommentVNode, isTextVNode } from "../helpers/is";
import { ignoreCaseEquals } from "../helpers/strings";
import { $render } from "./render";
import { VNode } from "./vnode";

function replace(vOld: VNode, vNew: VNode) {
  let e = $render(vNew);
  vOld.$el.replaceWith(e);
}

function patch(vOld: VNode, vNew: VNode) {
  if (isCommentVNode(vOld)) {
    if (isCommentVNode(vNew)) {
      vNew.$el = vOld.$el;
    } else {
      replace(vOld, vNew);
    }
  } else if (isTextVNode(vOld)) {
    if (isTextVNode(vNew)) {
      if (vOld.text !== vNew.text) {
        vOld.$el.textContent = vNew.text;
      }
      vNew.$el = vOld.$el;
    } else {
      replace(vOld, vNew);
    }
  } else {
    if (!ignoreCaseEquals(vOld.tag, vNew.tag)) {
      replace(vOld, vNew);
    } else {
      patchChildren(vOld.$el, vOld.children, vNew.children);
      vNew.$el = vOld.$el;
    }
  }
}


function patchChildren(parentElm: Element, vOld: VNode[], vNew: VNode[]) {
  const min = Math.min(vOld.length, vNew.length);
  for (let i = 0; i < min; ++i) {
    patch(vOld[i], vNew[i]);
  }

  if (vOld.length > vNew.length) {
    if (vNew.length === 0) {
      while (parentElm.childNodes.length) {
        parentElm.removeChild(parentElm.lastChild);
      }
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

export function difference(vOld: VNode, vNew: VNode) {
  patch(vOld, vNew);
}
