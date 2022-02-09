import { BuildContext } from "../../core/context";
import { isDef, isUndef } from "../../helpers/is";
import { getState } from "../../lux";
import { VNode, vnode } from "../../vdom/vnode";
import { evalStatement } from "../parser";
import { ASTExpression } from "./astelement";

export function processExpression(ast: ASTExpression, context: BuildContext): VNode {
  let { state, additional } = context;
  if (isUndef(state)) { state = getState(); }
  const outcome = evalStatement(ast.exp, state, additional);
  return vnode.text(isDef(outcome) ? String(outcome) : '');
}