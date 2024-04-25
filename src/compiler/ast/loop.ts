
import { BuildContext, withContext } from '@lux/core/context';
import { warn } from '@lux/core/logging';
import { cached } from '@lux/helpers/functions';
import { isString, isUndef, isUndefOrEmpty } from '@lux/helpers/is';
import { trimAll } from '@lux/helpers/strings';
import { lookup } from '@lux/core/context';
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

function _loop(exp: string, alias: string, items: string, key?: string, iterator?: string) {
  return { exp, alias, items, key, iterator };
}

export function processLoop(ast: ASTElement, context: BuildContext): Array<VNode> {
  if (isUndef(ast.loop)) {
    warn('Is not loop');
    return [];
  }

  const { alias, items } = ast.loop;

  let list: Array<any>|string = lookup(items, context);

  if (isUndefOrEmpty(list)) {
    return null;
  }

  if (isString(list)) {
    list = list.split('');
  }

  const output = new Array<VNode>(list.length);
  const ctx = withContext(context, { [alias]: <any>null });
  for (let i in list) {
    ctx.scoped[alias] = list[i];
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

  return _loop(exp, alias, items);
});
