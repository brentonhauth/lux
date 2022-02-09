import { BuildContext, withContext } from "../../core/context";
import { arrayUnwrap, flattenArray } from "../../helpers/array";
import { isASTComponent, isDef, isUndef, isUndefOrEmpty } from "../../helpers/is";
import { ArrayOrSingle } from "../../types";
import { VNode, vnode, VNodeAttrs } from "../../vdom/vnode";
import { evalStatement } from "../parser";
import { ASTComponent, ASTElement, ASTExpression, ASTFlags, ASTNode, ASTText, ASTType } from "./astelement";
import { processExpression } from "./expression";
import { processIf } from "./if";
import { processLoop } from "./loop";



/**
 * processes if's and loop's, only returns 1 element.
 * @param ast
 * @param context
 * @returns
 */
export function toVNode(ast: ASTNode, context: BuildContext): VNode {
  return arrayUnwrap(_toVNode(ast, context));
}

/**
 * literally takes ast properties and puts them in a vnode.
 * @param ast
 * @param context
 * @returns
 */
export function toVNodeDry(ast: ASTElement, context: BuildContext): VNode {
  let rnd: ASTElement, ctx: BuildContext;

  if (isASTComponent(ast)) {
    let props: any = {};
    let compAttrs = evalAttrs(ast, context);
    for (let p of ast.props) {
      props[p] = compAttrs[p];
    }
    ctx = withContext(context, props);
    rnd = ast.root;
  } else {
    ctx = context;
    rnd = ast;
  }

  const children = rnd.children.map(c => _toVNode(c, ctx));
  return vnode(rnd.tag, {
    attrs: evalAttrs(rnd, ctx),
    style: <any>rnd.style,
  }, flattenArray(children));
}

function _toVNode(ast: ASTNode, context: BuildContext): ArrayOrSingle<VNode> {
  switch (ast.type) {
    case ASTType.TEXT:
      return textToVNode(<ASTText>ast);
    case ASTType.EXPRESSION:
      return expToVNode(<ASTExpression>ast, context);
    case ASTType.ELEMENT:
      return elmToVNode(<ASTElement>ast, context);
    default:
      return null;
  }
}


function textToVNode(ast: ASTText) {
  return vnode.text(String(ast.text));
}

function expToVNode(ast: ASTExpression, context: BuildContext) {
  if (isDef(ast.exp)) {
    return processExpression(ast, context);
  } else {
    return vnode.text('');
  }
}

function elmToVNode(ast: ASTElement, context: BuildContext): ArrayOrSingle<VNode> {
  if ((ast.flags & ASTFlags.IF) && !(ast.flags & ASTFlags.ELSE)) {
    ast = processIf(ast, context);
    if (isUndef(ast)) {
      return null;
    }
  } else if (ast.flags & ASTFlags.LOOP) {
    let looped = processLoop(ast, context);
    return isUndefOrEmpty(looped) ? null : looped;
  }

  return toVNodeDry(ast, context);
}

function evalAttrs(ast: ASTElement, context: BuildContext): VNodeAttrs {
  const attrs = { ...(ast.staticAttrs) };
  let { state, additional } = context;
  for (let name in ast.dynamicAttrs) {
    attrs[name] = evalStatement(ast.dynamicAttrs[name], state, additional);
  }
  return <VNodeAttrs>attrs;
}
