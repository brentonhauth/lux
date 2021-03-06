import { ASTElement } from '@lux/compiler/ast/astelement';
import { isHtmlTag } from '@lux/helpers/is';
import { RenderFn } from '@lux/types';

export interface ComponentOptions {
  render?: RenderFn,
  template?: string|Element,
  props?: Array<string>,
}

export interface Component {
  tag: string,
  ast: ASTElement,
  props: Array<string>,
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
    props: options.props || [],
    render: options.render,
    template: options.template,
    options,
  };
}
