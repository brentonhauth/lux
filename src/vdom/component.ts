import { ASTComponent, ASTElement } from '../compiler/ast/astelement';
import { isFunc, isHtmlTag, isString } from '../helpers/is';
import { RenderFn } from '../types';

export interface ComponentOptions {
  render?: RenderFn,
  template?: string|Element
}

export interface Component {
  tag: string,
  ast: ASTElement,
  options: ComponentOptions,
  render?: RenderFn,
  template?: string|Element,
}

export function $component(tag: string, options: ComponentOptions): Component {
  if (!/^\w+$/i.test(tag)) {
    return null;
  } else if (isHtmlTag(tag)) {
    return null;
  }

  return {
    tag,
    ast: null,
    render: options.render,
    template: options.template,
    options,
  };
}
