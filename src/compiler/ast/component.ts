import { compile } from '../compiler';
import { type Component } from '@lux/vdom/component';
import { type ASTElement } from './astnode';
import { isDef } from '@lux/helpers/is';
import { error } from '@lux/core/logging';

let _domParser: DOMParser;
const getDomParser = () => _domParser || (_domParser = new DOMParser());

export function templateToAST(template: string, context: Component): ASTElement {
  let children: HTMLCollection;

  let elm = document.querySelector(template);

  if (isDef(elm)) {
    // If the element is a template, take it's (first) child.
    if (elm.tagName.toLowerCase() === 'template') {
      children = (elm as HTMLTemplateElement)?.content?.children;
    } else {
      return <ASTElement>compile(elm, context);
    }
  } else {
    // Assume it has to be parsed.
    let parsed = getDomParser().parseFromString(template, 'text/html');
    // Take children of dom parser.
    children = parsed?.children?.[0]?.children?.[1]?.children; // chain to <body> tag.
  }

  if (isDef(children)) {
    // Ensure that only
    if (children.length !== 1) {
      error('templates should (only) contain 1 root element:', template);
      return null;
    }
    return <ASTElement>compile(children[0], context);
  }

  return null;
}
