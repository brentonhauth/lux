import { isDef, isUndef } from "../../helpers/is";
import { getState } from "../../lux";
import { IfStatement, State } from "../../types";
import { ASTElement } from "./astelement";

export interface IfCondition {
  exp?: string;
  fn?: IfStatement;
  next?: ASTElement;
}

export function processIf(ast: ASTElement, state?: State) {
  if (isUndef(ast.if)) {
    return null;
  }

  state = state || getState();

  while (isDef(ast?.if)) {
    if (isDef(state) && state[ast.if.exp]) { // temporary
      return ast;
    } else {
      ast = ast.if.next;
    }
  }
  return ast;
}
