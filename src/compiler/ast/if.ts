import { BuildContext } from "../../core/context";
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

export function processIf(ast: ASTElement, context: BuildContext) {
  if (isUndef(ast.if)) {
    return null;
  }

  const { state, additional } = context;

  while (isDef(ast?.if)) {
    if (evalStatement(ast.if.exp, state, additional)) {
      return ast;
    } else {
      ast = ast.if.next;
    }
  }
  return ast;
}
