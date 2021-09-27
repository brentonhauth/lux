module lux {
  export const removePatch: PatchFunction = $el => void $el.remove();

  export function diff(oldNode: VNode|string, newNode: VNode|string): PatchFunction {
    if (is.undef(newNode)) {
      if (is.undef(oldNode)) {
        return identity;
      } else {
        return removePatch;
      }
    } else if (is.undef(oldNode)) {
      // console.log('Line 73 vdom.ts');
      return $el => {
        let e = $render(newNode);
        if (is.def($el)) {
          $el.replaceWith(e);
        }
        return e;
      };
    }
  
    if (is.string(oldNode) || is.string(newNode)) {
      // console.log(`Compare Nodes: (oldNode !== newNode): ${oldNode !== newNode}`, oldNode, newNode);
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
  
    let attrsPatch = attrsDiff(oldNode.attrs, newNode.attrs);
    let childrenPatch = childrenDiff(oldNode.children, newNode.children);
  
    return $el => {
      // if (is.undef($el)) console.log(`OWO ${oldNode?.tag || oldNode}`);
      attrsPatch($el);
      childrenPatch($el);
      return $el;
    };
  };
  
  function childrenDiff(oldChildren: VNodeChildren, newChildren: VNodeChildren): PatchFunction {
    let old = arrayWrap(oldChildren);
    let _new = arrayWrap(newChildren);
  
    const childrenPatches: PatchFunction[] = [];
  
    for (let i = 0; i < old.length; i++) {
      let patch = diff(oldChildren[i], newChildren[i]); 
      // POTENTIAL ISSUE DISCOVERED:
      // -- nodes are being patched out ($el.remove()) and therefore "i"
      // is pointing to an empty element 
      childrenPatches.push($parent => {
        if (is.undef(newChildren[i])) {
          // TEMP FIX FOR ISSUE ABOVE
          let n = $parent.childNodes[$parent.childNodes.length - 1];
          patch(<any>n);
        } else {
          patch(<any>$parent.childNodes[i]);
        }
        return $parent;
      });
    }
    const moreChildren: PatchFunction[] = [];
    for (let i = old.length; i < _new.length; i++) {
      moreChildren.push($parent => {
        // console.log('inner patch add newChildren[i]', i, newChildren[i]);
        $parent.appendChild($render(newChildren[i]));
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
      return $parent;
    };
  }
  
  function attrsDiff(oldAttrs: Record<string, any>, newAttrs: Record<string, any>): PatchFunction {
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
      remove.forEach(r => $el.removeAttribute(r));
      forIn(apply, (k, v) => {
        if (is.objectLike(v)) {
          forIn(v, (ik, iv) => $el[k][ik] = iv);
        } else {
          $el.setAttribute(<string>k, v);
        }
      });
      return $el;
    };
  }
}
