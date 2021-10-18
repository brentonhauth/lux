import { isDef } from "../../helpers/is";
import { getState } from "../../lux";
import { State } from "../../types";
import { VNode, vnode } from "../../vdom/vnode";
import { ASTExpression } from "./astelement";

export function processExpression(ast: ASTExpression, state?: State): VNode {
  let val = state ? state[ast.alias] : getState(ast.alias);
  return vnode.text(isDef(val) ? String(val) : '');
}