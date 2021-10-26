import { applyAll } from "../helpers/functions";
import { isDef, isObject } from "../helpers/is";
import { State } from "../types";
import { Component } from "../vdom/component";

export interface BuildContext {
  state: State,
  components: Array<Component>
  additional?: State,
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

function _context(
  state: State,
  components: Array<Component>,
  additional?: State
): BuildContext {
  return { state, components, additional };
}
