import { isDef, isUndef } from "../../helpers/is";
import { getState } from "../../lux";
import { State } from "../../types";
import { VNode, vnode } from "../../vdom/vnode";
import { evalStatement } from "../parser";
import { ASTExpression } from "./astelement";

export function processExpression(ast: ASTExpression, state?: State, additional?: State): VNode {
  if (isUndef(state)) { state = getState(); }
  const outcome = evalStatement(ast.exp, state, additional);
  return vnode.text(isDef(outcome) ? String(outcome) : '');
}