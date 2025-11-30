import { AnyFunction, Func1, IdentityFactory, MaybeArray } from '@lux/core/types';
import { isArray, isDef, isFunction, isKeyword, isUndef } from './is';

let _uuid = 0;


export const EMPTY_OBJ = Object.freeze({});
export const EMPTY_ARR = Object.freeze([]);


/**
 * @returns A new universal unique identifier
 */
export function uuid(): number {
  return _uuid++;
}

/**
 * Used to store the return value of pure functions.
 * @param fn The function to track responses from.
 * @returns A copy of the function that first checks responses
 */
export function cached<T>(fn: Func1<string, T>): Func1<string, T> {
  const cache: Map<string, T> = new Map<string, T>();
  return (p: string): T => {
    if (cache.has(p)) { // Some functions may return null, still cache result.
      return cache.get(p);
    } else {
      let val = fn(p);
      cache.set(p, val);
      return val;
    }
  };
}

/**
 * Ensures the return value is as an array.
 */
export const arrayWrap = <T>(a: MaybeArray<T>): Array<T> => (
  isArray(a) ? a : (isUndef(a) ? [] : [a])
);

/**
 * Find what variables were used in a function
 * @param fn
 * @returns a list of the variables used in the function
 */
export function getUsedVariables(fn: AnyFunction): Array<string> {
  const fnstr = fn.toString();
  const matches = fnstr.match(/\b[a-z_$]\w*\b/ig);
  return Array.from(new Set(matches.filter(word => !isKeyword(word))));
}

export const functionBind = <T = any>(_this: any, obj: T): T  => (
  isFunction(obj) ? obj.bind(_this) : obj
);

export const functionWrap = cached((exp: string): AnyFunction => {
  try {
    return <any>new Function('$$$args', `with ($$$args) { return ${exp}; }`);
  } catch (_e) {
    return null;
  }
});


export function compareDeep(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }

  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }

  let aKeys = Object.keys(a);
  let bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  let i = aKeys.length;
  while (i--) {
    let key = aKeys[i];
    if (!compareDeep(a[key], b[key])) {
      return false;
    }
  }

  return true;
}

export const numberFactory: IdentityFactory<number> = <any>cached(<any>((n: number) => (() => n)));
export const stringFactory: IdentityFactory<string> = cached((s: string) => (() => s));
export const aliasFactory: IdentityFactory<any> = cached((key: string) => (data => data?.[key]));

export const TRUE = () => true;
export const FALSE = () => false;
export const NULL = (): null => null;
export const UNDEFINED = (): undefined => void 0;
