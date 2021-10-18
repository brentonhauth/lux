
import { normalizedArray, flattenArray } from "../../helpers/array";
import { lookup } from "../../helpers/functions";
import { isDef, isString, isUndef } from "../../helpers/is";
import { trimAll } from "../../helpers/strings";
import { getState } from "../../lux";
import { State } from "../../types";
import { VNode, vnode } from "../../vdom/vnode";
import { ASTElement, ASTFlags } from "./astelement";

const loopSplitRE = /\s+(?:of|in)\s+/;

export interface LoopCondition {
  exp: string;
  alias: string;
  items: string;
  key?: string;
  iterator?: string;
}

export function processLoop(ast: ASTElement, state?: State, additional:State={}): Array<VNode> {
  if (isUndef(ast.loop)) {
    console.warn('Is not loop');
    return [];
  }

  const { alias, items } = ast.loop;
  state = state || getState();

  if (!(items in state)) {
    return [];
  }

  let list: Array<any> = lookup(items, state, additional);

  if (isString(list)) {
    list = list.split('');
  }
  if (list.length === 0) {
    return [];
  }

  const output = [];
  for (let i in list) {
    let more = { ...additional };
    more[alias] = list[i];
    // if (isDef(v)) {
    //   output.push(vnode.clone(v));
    // } else {
    //   first = false;
    //   v = vnode(ast.tag, {
    //     attrs: ast.normalizedAttrs(state, additional),
    //     style: ast.style,
    //   }, <any>flattenArray(children));
    //   output.push(v);
    // }
    let children = normalizedArray(ast.children).map(c => c.toVNode(state, more));
    let v = vnode(ast.tag, {
      attrs: ast.normalizedAttrs(state, more),
      style: ast.style,
    }, <any>children);
    output.push(v);
  }
  return output;
}


export function parseLoop(ast: ASTElement) {

  const exp = trimAll(ast.attrs.loop);
  const [alias, items] = exp.split(loopSplitRE);


  if (!isString(alias) || !isString(items)) {
    throw new Error('Could not parse loop');
  }

  const loop: LoopCondition = {
    exp,
    alias,
    items,
  };

  ast.loop = loop;
  ast.flags |= ASTFlags.LOOP;
}
