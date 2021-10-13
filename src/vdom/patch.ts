module Lux {
  const removePatch: PatchFunction = $el => void $el.remove();

  export enum PatchFlags {
    ADDED = 1,
    REMOVED = 2,
    REPLACED = 4,
    UPDATED = 8,
  };

  export function diff(oldNode: VNode|string, newNode: VNode|string): PatchFunction {
    if (is.undef(newNode)) {
      return is.undef(oldNode) ? identity : removePatch;
    } else if (is.undef(oldNode)) {
      return $el => {
        let e = $render(newNode);
        if (is.def($el)) {
          $el.replaceWith(e);
        }
        return e;
      };
    }
  
    if (is.string(oldNode) || is.string(newNode)) {
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
      if (is.undef($el)) {
        console.log('$EL', oldNode, newNode);
      }
      // stylePatch((<any>$el)?.style||{});
      attrsPatch($el);
      childrenPatch($el);
      return $el;
    };
  };
  
  function childrenDiff(oldChildren: VNodeChildren, newChildren: VNodeChildren): PatchFunction {
    let old = arrayWrap(oldChildren);
    let _new = arrayWrap(newChildren);
  
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
        console.log('PARENT::', $parent);
        if (is.undef($parent)) {
          console.log('UNDEF PARENT::', old[i], _new[i]);
        }

        if (is.undef(old[i])) {
          // TEMP FIX FOR ISSUE ABOVE
          let n = $parent.childNodes[$parent.childNodes.length - 1];
          patch(<any>n);
        } else {// if (is.def($parent)) {
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
    if (is.undef(oldAttrs) && is.undef(newAttrs)) {
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

    return $el => {
      remove.forEach(raw ?
        r => delete $el[r] :
        r => $el?.removeAttribute(r));
      forIn(apply, (k, v) => {
        if (is.objectLike(v)) {
          forIn(v, (ik, iv) => $el[k][ik] = iv);
        } else if (raw) {
          $el[k] = v;
        } else {
          $el?.setAttribute(<string>k, v);
        }
      });
      return $el;
    };
  }
}
