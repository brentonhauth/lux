module Lux {
  export abstract class Block {
    public abstract evaluate(state: State): ArrayOrSingle<VNode|string>;
  }

  export function clense(vnode: VNode, state: State): VNode {
    let children = arrayWrap(vnode.children);
    let clean = [];
    children.forEach(c => {
      if (is.block(c)) {
        let outcome = c.evaluate(state);
        if (is.array(outcome)) {
          clean.push(...outcome);
        } else {
          clean.push(outcome);
        }
      } else {
        if (is.vnode(c)) {
          clean.push(clense(c, state));
        } else {
          clean.push(c);
        }
      }
    });
    vnode.children = clean;
    return vnode;
  }
}
