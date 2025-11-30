import { Func1, MaybeArray } from '@lux/core/types';
import { ASTComponent, ASTCondition, ASTExpression, ASTHtml, ASTLoop, ASTNode, ASTText, ASTType } from './astnode';
import { BuildContext } from '@lux/core/context';
import { VNode } from '@lux/vdom/vnode';


type GenFn = Func1<BuildContext, MaybeArray<VNode>>;

export abstract class Gen {
  constructor(
    public ast: ASTNode,
    public fn: GenFn,
  ) {}

  get type(): ASTType {
    return this.ast.type;
  }

  // public abstract render(): void;
}


class LoopGen extends Gen {
  constructor(ast: ASTLoop, fn: GenFn) {
    super(ast, fn);
  }
}

class ConditionGen extends Gen {
  constructor(ast: ASTCondition, fn: GenFn) {
    super(ast, fn);
  }
}

class HtmlGen extends Gen {
  constructor(ast: ASTHtml, fn: GenFn) {
    super(ast, fn);
  }
}

class HtmlStaticGen extends Gen {
  constructor(ast: ASTHtml, fn: GenFn) {
    super(ast, fn);
  }
}

class ComponentGen extends Gen {
  constructor(ast: ASTComponent, fn: GenFn) {
    super(ast, fn);
  }
}

class TextGen extends Gen {
  constructor(ast: ASTText, fn: GenFn) {
    super(ast, fn);
  }
}

class ExpressionGen extends Gen {
  constructor(ast: ASTExpression, fn: GenFn) {
    super(ast, fn);
  }
}



export const generator2 =(node: ASTNode): Gen => (
  node.gen || (node.gen = <any>makeGen(node))
);


function makeGen(node: ASTNode): Gen {
  switch (node?.type) {
    case ASTType.HTML:
      return makeHtmlGen(<ASTHtml>node);
    case ASTType.EXPRESSION:
      return makeExpressionGen(<ASTExpression>node);
    case ASTType.COMPONENT:
      return makeComponentGen(<ASTComponent>node);
    case ASTType.TEXT:
      return makeTextGen(<ASTText>node);
    case ASTType.CONDITION:
      return makeConditionGen(<ASTCondition>node);
    case ASTType.LOOP:
      return makeLoopGen(<ASTLoop>node);
    case ASTType.NONE:
    default:
      throw new Error('Issue with node in generator.');
  }
}


function makeHtmlGen(node: ASTHtml): HtmlGen {
  return null;
}

function makeComponentGen(node: ASTComponent): ComponentGen {
  return null;
}


function makeExpressionGen(node: ASTExpression): HtmlGen {
  return null;
}


function makeTextGen(node: ASTText): TextGen {
  return null;
}

function makeLoopGen(node: ASTLoop): LoopGen {
  return null;
}

function makeConditionGen(node: ASTCondition): ConditionGen {
  return null;
}
