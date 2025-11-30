import { isBlankString, isDef, isForbiddenTag, isHtmlTag, isUndef } from '@lux/helpers/is';
import { parseExpression } from './ast/expression';
import { parseLoop } from './ast/loop';
import { error, warn } from '@lux/core/logging';
import { stripCurleys } from '@lux/helpers/strings';
import { compileAttributes } from './ast/attributes';
import { type Component } from '@lux/vdom/component';
import {
  type ASTNode,
  ASTComponent,
  ASTCondition,
  ASTElement,
  ASTExpression,
  ASTHtml,
  ASTLoop,
  ASTText
} from './ast/astnode';


const stringExpRE = /^\s*\{\{\s*(.+)*\s*\}\}\s*$/;

const IF_ATTR = '#if';
const LOOP_ATTR = '#loop';
const ELSE_ATTR = '#else';
const ELIF_ATTR = '#elif'; // maybe don't need

/**
 * Grammar for compilation.
 * ```
 * <root> ::= <elem>
 * <elem> ::= {attributes} (<html> | <comp>)
 * <comp> ::= {Component}
 * <html> ::= {openTag} <children> {closeTag}
 * <children> ::= <child>* | eps
 * <child> ::= <text> | <if>
 * <text> ::= <exp> | <raw>
 * <exp> ::= {Expression}
 * <raw> ::= {rawText}
 * <if> ::= {ifCondition} <loop> <else> | <loop>
 * <else> ::= {elseCondition} <if> | eps
 * <loop> ::= {loopCondition} <elem> | <elem>
 * ```
 */


/**
 * ```
 * <root> ::= <elem>
 * ```
 * @param el
 * @param context
 * @returns
 */
export function compile(el: Element, context: Component): ASTNode {
  // Compile the root node
  if (el?.nodeType !== Node.ELEMENT_NODE) {
    error('Must be an element node at the root!');
    return null;
  }

  for (let attr of [LOOP_ATTR, IF_ATTR, ELSE_ATTR]) {
    if (el.hasAttribute(attr)) {
      error(`Cannot have structural attributes (${attr}) on root element. Ignoring.`);
      el.removeAttribute(attr);
    }
  }

  return _element(el, context);
}

/**
 * ```
 * <elem> ::= <html> | <comp>
 * ```
 * @param el
 * @param context
 */
function _element(el: Element, context: Component): ASTNode {
  if (isForbiddenTag(el.tagName)) {
    error('Invalid tag name', el.tagName);
    return null;
  }

  if (el.hasAttribute(ELSE_ATTR)) {
    warn(`Detected #else on <${el.tagName}> without an #if on the previous node. Ignoring.`);
    el.removeAttribute(ELSE_ATTR);
  }

  const node: ASTElement = isHtmlTag(el.tagName)
    ? _html(el, context)
    : _component(el, context);

  if (isDef(node)) {
    compileAttributes(el, node);
  }

  return node;
}

/**
 * ```
 * <html> ::= {openTag} <children> {closeTag}
 * ```
 * @param el
 * @param context
 */
function _html(el: Element, context: Component): ASTHtml {
  const h = new ASTHtml(el);
  h.children.push(..._children(<any>el.childNodes, context));
  return h;
}

/**
 * ```
 * <children> ::= <child>* | eps
 * ```
 * @param nodes
 * @returns
 */
function _children(nodes: Array<Element>, context: Component): Array<ASTNode> {
  let i = 0;
  const children: ASTNode[] = [];

  // Fix to oversight of spaces between elements. Will remove 'pre' text though.
  const workingNodes = Array.from(nodes).filter(n => (
    n.nodeType === Node.ELEMENT_NODE ||
    (n.nodeType === Node.TEXT_NODE && !isBlankString(n.textContent))
  ));

  // get each child for the current html tag.
  while (i < workingNodes.length) {
    let child = _child(workingNodes, context, i);
    // ignore children that don't yield an actual result.
    if (isDef(child)) {
      children.push(child);
      i += child.depth();
    } else {
      ++i;
    }
  }
  return children;
}

/**
 * ```
 * <child> ::= <text> | <if>
 * ```
 * @param nodes
 * @param context
 * @param index
 * @returns
 */
function _child(nodes: Array<Element>, context: Component, index: number): ASTNode {
  if (nodes[index].nodeType === Node.TEXT_NODE) {
    return _text(nodes[index]);
  } else if (nodes[index].nodeType === Node.ELEMENT_NODE) {
    return _if(nodes, context, index);
  } else {
    // Either a comment or something else. We don't care.
    return null;
  }
}

/**
 * ```
 * <text> ::= <exp> | <raw>
 * <exp> ::= {Expression}
 * <raw> ::= {rawText}
 * ```
 * @param el
 * @param context
 * @returns
 */
function _text(el: Element): ASTNode {
  if (isBlankString(el.textContent)) {
    // TODO: somehow check for 'pre' tags, and such
    return null;
  }

  if (stringExpRE.test(el.textContent)) {
    // TODO: Change logic so that You can have multiple {{...}} inside text.
    const exp = parseExpression(stripCurleys(el.textContent.trim()));
    return isDef(exp) ? new ASTExpression(el, exp) : new ASTText(el);
  } else {
    return new ASTText(el);
  }
}

/**
 * ```
 * <if> ::= {ifCondition} <loop> <else> | <loop>
 * ```
 * @param nodes
 * @param context
 * @param index
 * @returns
 */
function _if(nodes: Array<Element>, context: Component, index: number): ASTNode {
  if (isUndef(nodes[index])) {
    return null;
  }

  let node = _loop(nodes, context, index);

  if (isDef(node) && nodes[index].hasAttribute(IF_ATTR)) {
    const cond = parseExpression(nodes[index].getAttribute(IF_ATTR));
    if (isDef(cond)) {
      node = new ASTCondition(nodes[index], cond, node, _else(nodes, context, index + 1));
      nodes[index].removeAttribute(IF_ATTR);
    }
  }

  return node;
}

/**
 * ```
 * <loop> ::= {loopCondition} <elem> | <elem>
 * ```
 * @param nodes
 * @param context
 * @param index
 * @returns
 */
function _loop(nodes: Array<Element>, context: Component, index: number): ASTNode {
  let node = _element(nodes[index], context);

  if (isDef(node) && nodes[index].hasAttribute(LOOP_ATTR)) {
    const cond = parseLoop(nodes[index].getAttribute(LOOP_ATTR));
    if (isDef(cond)) {
      const { key } = (node as ASTElement).attrs?.dynamics;
      node = new ASTLoop(nodes[index], cond, node, key);
      nodes[index].removeAttribute(LOOP_ATTR);
    }
  }

  return node;
}

/**
 * ```
 * <else> ::= {elseCondition} <if> | eps
 * ```
 * @param nodes
 * @param context
 * @param index
 * @returns
 */
function _else(nodes: Array<Element>, context: Component, index: number): ASTNode {
  const n = nodes[index];
  if (isUndef(n) || n.nodeType !== Node.ELEMENT_NODE || !(n.hasAttribute(ELSE_ATTR))) {
    // if there is not a next node or it is not an 'else' statement then return nothing
    return null;
  }

  n.removeAttribute(ELSE_ATTR); // Remove ELSE before going lower to avoid error check
  return _if(nodes, context, index);
}

/**
 * ```
 * <comp> ::= {Component}
 * ```
 * @param el
 * @param context
 * @returns
 */
function _component(el: Element, context: Component): ASTComponent {
  const Comp = context.getComponent(el.tagName);

  if (isUndef(Comp)) {
    error('No component with tag:', el.tagName);
    return null;
  }

  // Need lazy loading, only compile Component when I need it.
  return new ASTComponent(el, Comp);
}
