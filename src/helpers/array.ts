import { ArrayOrSingle } from '@lux/types';
import { isArray, isDef, isUndef } from './is';


const DEFAULT_COMPARE = (a:any, b:any) => a === b;

export function flattenArray<T>(a: Array<ArrayOrSingle<T>>): T[] {
  if (a.length === 0) return [];
  const flat: T[] = [];
  for (let e of a) {
    if (isArray(e)) {
      flat.push(...(<T[]>flattenArray(<any>e)));
    } else {
      flat.push(e);
    }
  }
  return flat;
}

/**
 * Ensures an object is an array
 * @template T
 * @param {ArrayOrSingle<T>} a
 * @returns {Array<T>}
 */
export function arrayWrap<T>(a: ArrayOrSingle<T>): T[] {
  if (isArray(a)) {
    return a;
  } else if (isUndef(a)) {
    return [];
  } else {
    return [a];
  }
}

/**
 * Like calling flattenArray(arrayWrap(a))
 */
export function normalizedArray<T>(a: ArrayOrSingle<ArrayOrSingle<T>>): T[] {
  if (isUndef(a)) {
    return [];
  } else if (isArray(a)) {
    return flattenArray(a);
  } else {
    return [a];
  }
}

export function arrayUnwrap<T>(a: ArrayOrSingle<T>, index=0): T|null {
  if (isArray(a)) {
    return isDef(a[index]) ? a[index] : null;
  } else {
    return isDef(a) ? a : null;
  }
}

export function minimizeArray<T>(array: T[]): ArrayOrSingle<T>|null {
  return array.length <= 1 ? (array[0] || null) : array;
}

export function removeFromArray<T>(array: T[], field: ArrayOrSingle<T>, compare?: (a:T,b:T)=>boolean): T[] {
  field = normalizedArray(field);
  compare = compare || DEFAULT_COMPARE;
  for (let f of field) {
    let i = array.findIndex(v => compare(v, f));
    array.splice(i, 1);
  }
  return array;
}

export function overlappedItems<T>(a1: T[], a2: T[], compare?: (a:T,b:T)=>boolean): T[] {
  const overlap: T[] = [];
  compare = compare || DEFAULT_COMPARE;
  for (let x of a1) {
    let i = a2.findIndex(y => compare(x, y));
    if (i !== -1) {
      overlap.push(a2[i]);
    }
  }
  return overlap;
}
