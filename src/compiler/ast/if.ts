import { isDef, isUndef } from "../../helpers/is";
import { getState } from "../../lux";
import { IfStatement } from "../../types";
import { ASTElement } from "./astelement";

export interface IfCondition {
  exp?: string;
  fn?: IfStatement;
  next?: ASTElement;
}

export function processIf(ast: ASTElement) {
  if (isUndef(ast.if)) {
    return null;
  }

  const state = getState();
  while (isDef(ast?.if)) {
    if (state[ast.if.exp]) { // temporary
      return ast;
    } else {
      ast = ast.if.next;
    }
  }
  return ast;
}
