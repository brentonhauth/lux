import { forIn, identity } from "../helpers/functions";
import { arrayWrap } from "../helpers/array";
import { isCommentVNode, isDef, isObjectLike, isString, isTextVNode, isUndef } from "../helpers/is";
import { ArrayOrSingle, PatchFunction } from "../types";
import { $render } from "./render";
import { VNode, VNodeChildren } from "./vnode";

const removePatch: PatchFunction = $el => void $el.remove();
// <></>

export function diff(oldNode: VNode|string, newNode: VNode|string): PatchFunction {
  return _diff2(<VNode>oldNode, <VNode>newNode);
}

function _diff1(oldNode: VNode|string, newNode: VNode|string): PatchFunction {
  if (isUndef(newNode)) {
    return isUndef(oldNode) ? identity : removePatch;
  } else if (isUndef(oldNode)) {
    return $el => {
      let e = $render(newNode);
      if (isDef($el)) {
        $el.replaceWith(e);
      } else {
        console.log('null->node render');
      }
      return e;
    };
  }

  if (isString(oldNode) || isString(newNode)) {
    if (oldNode !== newNode) {
      return $el => {
        let e = $render(newNode);
        $el.replaceWith(e);
        return e;
      };
    }
    return identity;
  } else if (oldNode.tag !== newNode.tag) {
    return $el => {
      let e = $render(newNode);
      $el.replaceWith(e);
      return e;
    };
  }

  // let stylePatch = attrsDiff(oldNode.data?.style, newNode.data?.style, true);
  let attrsPatch = attrsDiff(oldNode.data?.attrs, newNode.data?.attrs);
  let childrenPatch = childrenDiff(oldNode.children, newNode.children);

  return $el => {
    if (isUndef($el)) {
      console.log('$EL', oldNode, newNode);
    }
    // stylePatch((<any>$el)?.style||{});
    attrsPatch($el);
    childrenPatch($el);
    newNode.$el = $el;
    return $el;
  };
};


function _diff2(oldNode: VNode, newNode: VNode): PatchFunction {
  if (isUndef(newNode) && isDef(oldNode)) {
    return removePatch;
  } else if (isCommentVNode(newNode)) {
    return isCommentVNode(oldNode) ? identity : ($el => {
      let c = $render(newNode);
      $el.replaceWith(c);
      return c;
    });
  } else if (isCommentVNode(oldNode)) {
    return $el => {
      let e = $render(newNode);
      if (isDef($el)) {
        $el.replaceWith(e);
      } else {
        console.log('null->node render');
      }
      return e;
    };
  }

  const oldIsText = isTextVNode(oldNode);
  const newIsText = isTextVNode(newNode);

  if (oldIsText || newIsText) {
    return ((oldIsText && newIsText) && (<any>oldNode).text === (<any>newNode).text)
      ? identity
      : ($el => {
        let t = $render(newNode);
        $el.replaceWith(t);
        return $el;
      });
  } else if (oldNode.tag.toLowerCase() !== newNode.tag.toLowerCase()) {
    return $el => {
      let e = $render(newNode);
      $el.replaceWith(e);
      return e;
    };
  }

  // let stylePatch = attrsDiff(oldNode.data?.style, newNode.data?.style, true);
  let attrsPatch = attrsDiff(oldNode.data?.attrs, newNode.data?.attrs);
  let childrenPatch = childrenDiff(oldNode.children, newNode.children);

  return $el => {
    if (isUndef($el)) {
      console.log('$EL', oldNode, newNode);
    }
    // stylePatch((<any>$el)?.style||{});
    attrsPatch($el);
    childrenPatch($el);
    newNode.$el = $el;
    return $el;
  };
}

function batchDiff(oldList: ArrayOrSingle<VNode>, newList: ArrayOrSingle<VNode>): PatchFunction {
  const old = arrayWrap(oldList);
  const _new = arrayWrap(newList);

  let d = old.length - _new.length;
  let min = Math.min(old.length, _new.length);

  const patches: PatchFunction[] = [];

  for (let i = 0; i < min; ++i) {
    // patches.push($parent => {
    // });
  }

  return null;
}

function childrenDiff(oldChildren: VNodeChildren, newChildren: VNodeChildren): PatchFunction {
  let old = arrayWrap(oldChildren);
  let _new = arrayWrap(newChildren);

  // console.table([old, _new]);

  const childrenPatches: PatchFunction[] = [];
  const removes: Array<{i:number}> = [];

  for (let i = 0; i < old.length; i++) {
    let patch = diff(old[i], _new[i]);
    // if (patch === removePatch) {
    //   removes.push({ i });
    //   continue;
    // }
    // POTENTIAL ISSUE DISCOVERED:
    // -- nodes are being patched out ($el.remove()) and therefore "i"
    // is pointing to an empty element 
    childrenPatches.push($parent => {
      if (isUndef($parent)) {
        console.log('UNDEF PARENT::', old[i], _new[i]);
      }

      if (isUndef(old[i])) {
        // TEMP FIX FOR ISSUE ABOVE
        let n = $parent.childNodes[$parent.childNodes.length - 1];
        patch(<any>n);
      } else {// if (isDef($parent)) {
        patch((<any>old[i])?.$el || <any>$parent.childNodes[i]);
      }

      return $parent;
    });
  }
  const moreChildren: PatchFunction[] = [];
  for (let i = old.length; i < _new.length; i++) {
    moreChildren.push($parent => {
      $parent.appendChild($render(_new[i]));
      return $parent;
    });
  }

  return $parent => {
    for (let patch of childrenPatches) {
      patch($parent);
    }
    for (let more of moreChildren) {
      more($parent);
    }
    // for (let r of removes) {
    //   removePatch(<any>$parent.childNodes[r.i]);
    // }
    return $parent;
  };
}

function attrsDiff(oldAttrs: Record<string, any>, newAttrs: Record<string, any>, raw=false): PatchFunction {
  if (isUndef(oldAttrs) && isUndef(newAttrs)) {
    return identity;
  }
  let apply: Record<string, any> = {};
  let remove: string[] = [];
  oldAttrs = oldAttrs || {};
  newAttrs = newAttrs || {};

  forIn(oldAttrs, (k: string, v) => {
    if (!(k in newAttrs)) {
      remove.push(k);
    } else if (v !== newAttrs[k]) {
      apply[k] = newAttrs[k];
    }
  });

  forIn(newAttrs, (k, v) => {
    if (!(k in apply)) {
      apply[k] = v;
    }
  });

  return ($el: any) => {
    remove.forEach(raw ?
      r => delete $el[(<any>r)] :
      r => $el?.removeAttribute(r));
    forIn(apply, (k, v) => {
      if (isObjectLike(v)) {
        forIn(v, (ik, iv) => $el[(<any>k)][ik] = iv);
      } else if (raw) {
        $el[(<any>k)] = v;
      } else {
        $el?.setAttribute(<string>k, v);
      }
    });
    return $el;
  };
}
