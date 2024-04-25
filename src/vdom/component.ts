import { ASTElement } from '@lux/compiler/ast/astelement';
import { warn } from '@lux/core/logging';
import { arrayWrap } from '@lux/helpers/array';
import { uuid } from '@lux/helpers/functions';
import { isFunc, isHtmlTag, isObject } from '@lux/helpers/is';
import { AnyFunction, DataFn, RenderFn } from '@lux/types';


export interface ComponentOptions {
  render?: RenderFn,
  data?: DataFn,
  $mounted?: VoidFunction,
  methods?: Record<string, AnyFunction>,
  template?: string|Element,
  props?: Array<string>,
}

export interface Component {
  readonly id: number,
  tag: string,
  ast: ASTElement,
  props: Array<string>,
  options: ComponentOptions,
  methods?: Record<string, AnyFunction>,
  $mounted?: VoidFunction,
  data?: DataFn,
  render?: RenderFn,
  template?: string|Element,
}

export interface ComponentInstance {
  comp: Component,
  _data: any,
  $mounted?: VoidFunction,
}

export function createComponentInstance(comp: Component): ComponentInstance {
  const _data = comp.data?.call(null) || {};
  if (isObject(comp.methods)) {
    for (let i in comp.methods) {
      if (i in _data) {
        throw new Error(`Conflict: method "${i}" found in data, use different names`);
      }
      let fn = comp.methods[i];
      if (!isFunc(fn)) {
        throw new Error(`Method "${i}" must be a function`);
      }

      fn = fn.bind(_data);
      Object.defineProperty(_data, i, {
        get() { return fn; },
        set(_v: any) { warn(`Cannot set method "${i}"!`); }
      });
    }
  }

  // TODO: Add props to _data

  let $mounted;

  if ('$mounted' in comp) {
    if (!isFunc(comp.$mounted)) {
      throw new Error('$mounted must be a function');
    }

    $mounted = comp.$mounted.bind(_data);
  }

  return {
    comp,
    _data,
    $mounted
  };
}

export function $component(tag: string, options: ComponentOptions): Component {
  tag = tag.toLowerCase();
  if (!/^\w+$/.test(tag) || isHtmlTag(tag)) {
    throw new Error('Invalid component tag');
  }

  const _id = uuid();

  return {
    get id() { return _id; },
    tag,
    ast: null,
    props: arrayWrap(options.props),
    data: options.data,
    render: options.render,
    $mounted: options.$mounted,
    methods: options.methods || {},
    template: options.template,
    options,
  };
}
