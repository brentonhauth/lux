
import { arrayWrap, flattenArray } from "../../helpers/functions";
import { is } from "../../helpers/is";
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
  if (is.undef(ast.loop)) {
    console.warn('Is not loop');
    return [];
  }

  const { alias, items } = ast.loop;
  const state = getState();

  if (!(items in state)) {
    return [];
  }

  let list: Array<any> = state[items];

  if (is.string(list)) {
    list = list.split('');
  }
  if (list.length === 0) {
    return [];
  }

  const style = ast.attrs['style'];
  delete ast.attrs['style'];

  const v = vnode(ast.tag, {
    attrs: ast.attrs,
    style: <any>style,
  }, <any>flattenArray(flattenArray(arrayWrap(ast.children)).map(c => c.toVNode())));

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


  if (!is.string(alias) || !is.string(items)) {
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
