import { BuildContext } from '@lux/core/context';
import { isDef, isUndef } from '@lux/helpers/is';
import { evalStatement, Statement } from '@lux/compiler/parser';
import { ASTElement } from './astelement';

export interface IfCondition {
  raw?: string;
  exp?: Statement;
  else?: ASTElement;
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
      ast = ast.if.else;
    }
  }
  return ast;
}
