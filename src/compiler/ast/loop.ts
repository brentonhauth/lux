
import { normalizedArray, flattenArray } from "../../helpers/array";
import { isString, isUndef } from "../../helpers/is";
import { getState } from "../../lux";
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

export function processLoop(ast: ASTElement): Array<VNode> {
  if (isUndef(ast.loop)) {
    console.warn('Is not loop');
    return [];
  }

  const { alias, items } = ast.loop;
  const state = getState();

  if (!(items in state)) {
    return [];
  }

  let list: Array<any> = state[items];

  if (isString(list)) {
    list = list.split('');
  }
  if (list.length === 0) {
    return [];
  }

  const children = normalizedArray(ast.children).map(c => c.toVNode());
  const v = vnode(ast.tag, {
    attrs: ast.attrs,
    style: ast.style,
  }, <any>flattenArray(children));

  const output = [];
  let first = true;
  for (let i in list) {
    if (first) {
      first = false;
      output.push(v);
    } else {
      output.push(vnode.clone(v));
    }
  }
  return output;
}


export function parseLoop(ast: ASTElement) {

  const exp = String(ast.attrs['loop']).trim();

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
