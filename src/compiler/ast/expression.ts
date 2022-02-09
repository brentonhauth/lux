import { BuildContext } from '@lux/core/context';
import { isDef } from '@lux/helpers/is';
import { VNode, vnode } from '@lux/vdom/vnode';
import { evalStatement } from '@lux/compiler/parser';
import { ASTExpression } from './astelement';

export function processExpression(ast: ASTExpression, context: BuildContext): VNode {
  let { state, additional } = context;
  const outcome = evalStatement(ast.exp, state, additional);
  return vnode.text(isDef(outcome) ? String(outcome) : '');
}