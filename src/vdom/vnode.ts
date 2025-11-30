import { Func1, MaybeArray, Renderable, Simple } from '@lux/core/types';
import { uuid } from '@lux/helpers/common';
import { type Component, type ComponentInstance } from './component';
import { type Computed } from '@lux/core/responsive/computed';
import { Context } from '@lux/core/context';
import {type Block } from './block';

export type VNodeStaticAttrs = Record<string, string | number | boolean>;
export type VNodeClass = MaybeArray<string>|Record<string, boolean>;
export type VNodeStyle = Record<string, string|number>;
export type VNodeEvents = Record<string, Event>;

export const enum VNodeFlags {
  NONE = 0,
  STATIC = 0x1,
  COMPONENT = 0x2,
  BLOCK = 0x4,
  TEXT = 0x8,
  COMMENT = 0x10,
  MOUNTED = 0x20,
  KEYED_CHILDREN = 0x40,
};

export const enum UniqueVNodeTag {
  TEXT = '#text',
  COMPONENT = '#component',
  COMMENT = '#comment',
  BLOCK = '#block',
};

/**
 * TODO:
 *  - change vnode attributes. Maybe have set of "Dry" attributes.
 *  - Recreating Computed values each time is costly.
 */
export interface VNodeAttrs {
  dynamics: Record<string, Computed<any>>,
  statics: Record<string, Simple>,
  events?: Record<string, Func1<Event, any>>,
  classes?: Record<string, Computed<any>>|Computed<any>,
  styles?: Record<string, Computed<any>>|Computed<any>,
  key?: string,
};

export interface VNode {
  id: number;
  type: string;
  key?: Simple;
  component?: Component;
  block?: Block;
  instance?: ComponentInstance;
  context?: Context;
  text?: string;
  $el?: Renderable;
  attrs?: VNodeAttrs;
  children?: Array<VNode>;
  flags?: VNodeFlags;
};

export const vnodeComment = (text?: string) => (
  _vnode(UniqueVNodeTag.COMMENT, null, text, null, VNodeFlags.COMMENT)
);

export const vnodeBlock = (block: Block) => (
  _vnode(UniqueVNodeTag.BLOCK, null, null, null, VNodeFlags.BLOCK, null, null, block)
);

export const vnodeText = (text: string, $el?: Element): VNode => (
  _vnode(UniqueVNodeTag.TEXT, null, text, null, VNodeFlags.TEXT)
);

export const vnodeComponent = (
  comp: Component,
  attrs?: VNodeAttrs,
  instance?: ComponentInstance,
  $el?: Element,
): VNode => (
  _vnode(UniqueVNodeTag.COMPONENT, attrs, null, null, VNodeFlags.COMPONENT, comp, instance, null, $el)
);

export const vnode = (
  type: string,
  attrs?: VNodeAttrs,
  children?: Array<VNode>,
  flags: VNodeFlags = VNodeFlags.NONE,
  $el?: Element,
): VNode => ( // type may need to be converted to lower case.
  _vnode(type, attrs, null, children, flags, null, null, null, $el)
);


/**
 * Internal VNode factory.
 * One access point  =>  Same (repeatible) shape  =>  Better performance
 */
const _vnode = (
  type: string,
  attrs?: VNodeAttrs,
  text?: string,
  children?: Array<VNode>,
  flags?: VNodeFlags,
  component?: Component,
  instance?: ComponentInstance,
  block?: Block,
  $el?: Renderable,
): VNode => {

  if (<any>flags instanceof Element) {
    console.trace();
    console.log('HERERERERE');
  }

  return ({
  id: uuid(),
  type,
  $el,
  attrs,
  key: attrs?.key,
  text,
  block,
  children,
  flags,
  component,
  instance,
})
};
