
import { BuildContext, withContext } from "../../core/context";
import { normalizedArray, flattenArray } from "../../helpers/array";
import { lookup } from "../../helpers/functions";
import { isDef, isString, isUndef } from "../../helpers/is";
import { trimAll } from "../../helpers/strings";
import { getState } from "../../lux";
import { State } from "../../types";
import { VNode, vnode } from "../../vdom/vnode";
import { ASTComponent, ASTElement, ASTFlags } from "./astelement";

const loopSplitRE = /\s+(?:of|in)\s+/;

export interface LoopCondition {
  exp: string;
  alias: string;
  items: string;
  key?: string;
  iterator?: string;
}

export function processLoop(ast: ASTElement, context: BuildContext): Array<VNode> {
  if (isUndef(ast.loop)) {
    console.warn('Is not loop');
    return [];
  }

  const { alias, items } = ast.loop;
  const { state, additional } = context;
  const rend: ASTElement = ast instanceof ASTComponent ? ast.root : ast;  

  let list: Array<any> = lookup(items, state, additional);

  if (isString(list)) {
    list = list.split('');
  }
  if (isUndef(list) || list.length === 0) {
    return [];
  }

  const output = [];
  for (let i in list) {
    let ctx = withContext(context, { [alias]: list[i] });
    let children = normalizedArray(rend.children).map(c => c.toVNode(ctx));
    let v = vnode(rend.tag, {
      attrs: rend.normalizedAttrs(ctx),
      style: rend.style,
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
