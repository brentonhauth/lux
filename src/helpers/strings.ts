import { isString } from "./is";

const twoPlusSpacesRE = /\s{2,}/;

const EMPTY_STRING = '';
const WHITE_SPACE = '\x20';

export function trimAll(s: string|any) {
  return isString(s)
    ? s.trim().replace(twoPlusSpacesRE, WHITE_SPACE)
    : EMPTY_STRING;
}

export function lower(s: string|any) {
  return isString(s) ? s.toLowerCase() : s;
}
