import { isObject, isObjectLike } from '@lux/helpers/is';
import { State } from '@lux/types';
import { Component } from '@lux/vdom/component';


export interface Context {
  components: Array<Component>
}

export interface BuildContext extends Context {
  state: State,
  scoped?: State,
}

export interface CompileContext extends Context {
}

export function createContext(state: State, components: Array<Component>, scoped?: State): BuildContext {
  return _context(state, components, scoped);
}

export function withContext(context: BuildContext, add: State, merge=true): BuildContext {
  if (merge && isObject(context.scoped)) {
    add = { ...(context.scoped), ...add };
  }
  return _context(context.state, context.components, add);
}

export function createCompileContext(): CompileContext {
  return <any>{};
}

export function lookup(name: string|number|any|symbol, context: BuildContext) {
  const { state, scoped } = context;
  if (isObjectLike(scoped) && (name in scoped)) {
    return scoped[name];
  } else if (isObjectLike(state) && (name in state)) {
    return state[name];
  }
  return undefined;
}

function _context(
  state: State,
  components: Array<Component>,
  scoped?: State
): BuildContext {
  return { state, components, scoped };
}
