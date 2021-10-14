import { is } from "../../helpers/is";
import { getState } from "../../lux";
import { IfStatement } from "../../types";
import { ASTElement } from "./astelement";

export interface IfCondition {
  exp?: string;
  fn?: IfStatement;
  next?: ASTElement;
}

export function processIf(ast: ASTElement) {
  if (is.undef(ast.if)) {
    return null;
  }

  const state = getState();
  while (is.def(ast?.if)) {
    if (state[ast.if.exp]) { // temporary
      console.log('CORRECT IF STATEMENT', ast.if.exp);
      return ast;
    } else {
      ast = ast.if.next;
    }
  }
  return ast;
}
