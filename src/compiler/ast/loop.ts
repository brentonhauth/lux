
import { BuildContext, withContext } from '@lux/core/context';
import { warn } from '@lux/core/logging';
import { cached, lookup } from '@lux/helpers/functions';
import { isString, isUndef, isUndefOrEmpty } from '@lux/helpers/is';
import { trimAll } from '@lux/helpers/strings';
import { VNode } from '@lux/vdom/vnode';
import { ASTElement } from './astelement';
import { toVNodeDry } from './toVnode';

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
    warn('Is not loop');
    return [];
  }

  const { alias, items } = ast.loop;
  const { state, additional } = context; 

  let list: Array<any> = lookup(items, state, additional);

  if (isString(list)) {
    list = list.split('');
  }
  if (isUndefOrEmpty(list)) {
    return [];
  }

  const output = new Array<VNode>(list.length);
  const iter = { [alias]: <any>null };
  for (let i in list) {
    iter[alias] = list[i];
    let ctx = withContext(context, iter);
    output.push(toVNodeDry(ast, ctx));
  }
  return output;
}


export const parseLoop = cached((exp: string): LoopCondition => {
  exp = trimAll(exp);
  const [alias, items] = exp.split(loopSplitRE);

  if (!isString(alias) || !isString(items)) {
    throw new Error('Could not parse loop');
  }

  return { exp, alias, items };
});
