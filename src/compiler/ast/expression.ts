import { isDef } from "../../helpers/is";
import { getState } from "../../lux";
import { VNode, vnode } from "../../vdom/vnode";
import { ASTExpression } from "./astelement";

export function processExpression(ast: ASTExpression): VNode {
  let state = getState(ast.alias);
  return vnode.text(isDef(state) ? String(state) : '');
}