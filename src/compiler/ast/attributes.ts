import { error, warn } from "@lux/core/logging";
import { isDef, isUndef } from "@lux/helpers/is";
import { type Expression, parseExpression } from "./expression";
import { type ASTElement, ASTFlags } from "./astnode";
import { type Simple } from "@lux/core/types";


const validAttrNameRE = /^[a-z]\w*([\-_]\w+)*$/i;

export interface ASTAttributes {
  dynamics: Record<string, Expression>,
  events: Record<string, Expression>,
  statics: Record<string, Simple>,
  classes?: Record<string, Expression>|Expression,
  styles?: Record<string, Expression>|Expression,
};

function _style(el: Element, style: string): Expression {
  const exp = parseExpression(style.trim());
  el.removeAttribute(':style');
  if (isUndef(exp)) {
    error('Could not parse style:', style);
    return null;
  }
  // TODO: Parse different kinds of styles
  return exp;
}

function _class(el: Element, class0: string): Expression {
  const exp = parseExpression(class0.trim());
  el.removeAttribute(':class');
  if (isUndef(exp)) {
    error('Could not parse class:', class0);
    return null;
  }
  // TODO: Parse different kinds of class values
  return exp;
}

function _dynamic(el: Element, name: string, value: string) {
  if (!validAttrNameRE.test(name)) {
    warn(`Invalid attribute name :${name} on element <${el.tagName}>`);
    return null;
  }

  const bind = parseExpression(value);
  if (isUndef(bind)) {
    warn(`Unable to parse attribute ":${name}" with value: ${value}`);
    return null;
  }
  return bind;
}

function _event(el: Element, name: string, value: string) {
  // TODO: check name for ".preventDefault" or other settings, once implemented.
  if (!validAttrNameRE.test(name)) {
    warn(`Invalid event name @${name} on element <${el.tagName}>`);
    return null;
  }

  const event = parseExpression(value);
  if (isUndef(event)) {
    warn(`Unable to parse event "@${name}" with value: ${value}`);
    return null;
  }
  return event;
}

export const compileAttributes = (el: Element, node: ASTElement): void => {
  const names = el.getAttributeNames().filter(a => !a.startsWith('#'));
  if (names.length === 0) {
    return;
  }

  const existing: Set<string> = new Set([]);

  const dynamics: Record<string, Expression> = {};
  const events: Record<string, Expression> = {};
  const statics: Record<string, Simple> = {};
  let classes: Record<string, Expression>|Expression = null;
  let styles: Record<string, Expression>|Expression = null;

  let flags: ASTFlags = 0;


  let i: number;
  if ((i = names.indexOf(':style')) >= 0) {
    styles = _style(el, el.getAttribute(':style'));
    existing.add('style');
    names.splice(i, 1); // remove ":style"
    flags |= ASTFlags.DYNAMIC_STYLES;
  }

  if ((i = names.indexOf(':class')) >= 0) {
    classes = _class(el, el.getAttribute(':class'));
    existing.add('class');
    names.splice(i, 1);
    flags |= ASTFlags.DYNAMIC_CLASSES;
  }

  for (let name of names) {
    let isBinding = name.startsWith(':');
    let isEvent = name.startsWith('@');

    let n = (isBinding || isEvent) ? name.slice(1) : name;

    let value = el.getAttribute(name);
    el.removeAttribute(value);

    if (existing.has(n)) {
      warn(`Duplicate attribute for ${n} on element <${el.tagName}>`);
      continue;
    }

    if (isBinding) {
      let bind = _dynamic(el, n, value);
      if (isDef(bind)) {
        existing.add(n);
        // Check if binding is static
        if (bind.uses.length > 0) {
          dynamics[n] = bind;
          flags |= ASTFlags.DYNAMIC_ATTRS;
        } else {
          statics[n] = bind.fn(null);
        }
      }
      continue;
    }

    if (isEvent) {
      let event = _event(el, n, value);
      if (isDef(event)) {
        events[n] = event;
        existing.add(n);
        flags |= ASTFlags.DYNAMIC_EVENTS;
      }
      continue;
    }

    // statics:
    statics[n] = value;
    existing.add(n);
  }



  const attrs = { dynamics, events, statics, classes, styles };
  node.attrs = attrs;
  node.flags |= flags;
};


