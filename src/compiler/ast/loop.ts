import { isUndef, isUndefOrEmpty } from '@lux/helpers/is';
import { cached } from '@lux/helpers/common';
import { error } from '@lux/core/logging';
import { type Expression, parseExpression } from './expression';

const loopSplitRE = /\s+(?:of|in)\s+/;
const varNameRE = /^[_a-z$]+[\w$]*$/i;

export interface LoopCondition {
  raw: string;
  alias: string;
  items: Expression;
  iterator?: string;
}


const parseLoopBase = cached((exp: string): LoopCondition => {
  const params = exp.split(loopSplitRE);

  if (params.length !== 2) {
    error('Invalid format for loop expression:', params);
    return null;
  }

  const [alias, _items] = params;
  if (!varNameRE.test(alias)) {
    error('Loop parse error: issue with alias name', alias);
    return null;
  }

  const items = parseExpression(_items);
  if (isUndef(items)) {
    error('Loop parse error: issue with parsing iterable', exp);
    return null;
  }

  return { raw: exp, alias, items };
});

export const parseLoop = (exp: string): LoopCondition => {
  exp = exp?.trim();
  return isUndefOrEmpty(exp) ? null : parseLoopBase(exp);
};
