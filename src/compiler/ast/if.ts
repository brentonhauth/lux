import { isDef, isUndef } from "../../helpers/is";
import { getState } from "../../lux";
import { State } from "../../types";
import { evalStatement, Statement } from "../parser";
import { ASTElement } from "./astelement";

export interface IfCondition {
  raw?: string;
  exp?: Statement;
  next?: ASTElement;
}

export function processIf(ast: ASTElement, state?: State, additional?: State) {
  if (isUndef(ast.if)) {
    return null;
  }

  state = state || getState();

  while (isDef(ast?.if)) {
    if (evalStatement(ast.if.exp, state, additional)) {
      return ast;
    } else {
      ast = ast.if.next;
    }
  }
  return ast;
}
