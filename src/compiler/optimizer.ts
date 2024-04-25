import { isASTComponent, isASTExpression, isASTText, isDef } from '@lux/helpers/is';
import { ASTElement, ASTFlags, ASTNode } from './ast/astelement';
import { StatementType } from './parser';

export function optimize(ast: ASTNode) {
}

export function isStatic(ast: ASTNode): boolean {
  if (isASTExpression(ast)) {
    return ast.exp.type === StatementType.STRAIGHT_CAST;
  } else if (isASTText(ast)) {
    return true;
  } else if (isASTComponent(ast)) {
    return false;
  } else {
    if (ast.flags & (ASTFlags.ELIF | ASTFlags.LOOP)) {
      return false;
    }
    let bindings = (ast as ASTElement).bindings;
    return isDef(bindings) && Object.keys(bindings).length === 0;
  }
}

export function markIfStatic(ast: ASTNode): boolean {
  if (isStatic(ast)) {
    ast.flags |= ASTFlags.STATIC;
  }
  return (ast.flags & ASTFlags.STATIC) !== 0;
}
