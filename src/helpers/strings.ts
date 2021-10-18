import { isString } from "./is";

const twoPlusSpacesRE = /\s{2,}/;

const EMPTY_STRING = '';
const WHITE_SPACE = '\x20';
const LEFT_PAREN_CODE = 0x28; // (
const RIGHT_PAREN_CODE = 0x29; // )
const QUOTE_CODE = 0x22; // '
const APOS_CODE = 0x27; // "

export function trimAll(s: string|any) {
  return isString(s)
    ? s.trim().replace(twoPlusSpacesRE, WHITE_SPACE)
    : EMPTY_STRING;
}

export function lower(s: string|any) {
  return isString(s) ? s.toLowerCase() : s;
}

export function stripParens(s: string, deep=true): string {
  s = s.trim();
  if (s.length < 2) {
    return s;
  }
  const c0 = s.charCodeAt(0);
  const cn = s.charCodeAt(s.length - 1);
  if (c0 === LEFT_PAREN_CODE && cn === RIGHT_PAREN_CODE) {
    s = s.slice(1, s.length - 1);
    return deep ? stripParens(s) : s;
  } else {
    return s;
  }
}

export function stripQuotes(s: string) {
  if (s.length < 2) {
    return s;
  }
  const c0 = s.charCodeAt(0);
  const cn = s.charCodeAt(s.length - 1);

  if (
    (c0 === QUOTE_CODE && cn === QUOTE_CODE) ||
    (c0 === APOS_CODE && cn === APOS_CODE)
  ) {
    return s.slice(1, s.length - 1);
  } else {
    return s;
  }
}
