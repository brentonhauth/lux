import { isFunc, isString } from "../helpers/is";
import { RenderFn } from "../types";

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
  return {
    tag,
    render: options.render,
    template: options.template,
    options,
  };
}
