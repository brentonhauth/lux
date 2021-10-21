import { isFunc, isHtmlTag, isString } from '../helpers/is';
import { RenderFn } from '../types';

export interface ComponentOptions {
  render?: RenderFn,
  template?: string|Element
}

export interface Component {
  tag: string,
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
    render: options.render,
    template: options.template,
    options,
  };
}
