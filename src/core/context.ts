import { isObject } from "../helpers/is";
import { State } from "../types";
import { Component } from "../vdom/component";


export interface Context {
  components: Array<Component>
}

export interface BuildContext extends Context {
  state: State,
  additional?: State,
}

export interface CompileContext extends Context {
}

export function createContext(state: State, components: Array<Component>, additional?: State): BuildContext {
  return _context(state, components, additional);
}

export function withContext(context: BuildContext, add: State, merge=true): BuildContext {
  if (merge && isObject(context.additional)) {
    add = { ...(context.additional), ...add };
  }
  return _context(context.state, context.components, add);
}

export function createCompileContext(): CompileContext {
  return <any>{};
}

function _context(
  state: State,
  components: Array<Component>,
  additional?: State
): BuildContext {
  return { state, components, additional };
}
