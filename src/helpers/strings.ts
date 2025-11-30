import { cached } from './common';
import { isUndefOrEmpty } from './is';

const twoPlusSpacesRE = /\s{2,}/;

export const EMPTY_STRING = '';
export const WHITE_SPACE = '\x20';

export const enum CharCode {
  QUOTE = 0x22, // "
  APOS = 0x27, // '
  SPACE = 0x20, // space

  // LEFT_PAREN = 0x28, // (
  // RIGHT_PAREN = 0x29, // )
  // TICK = 0x60, // `
  // BACKSLASH = 0x5c, // \
  // LOWER_X = 0x78,
  // LOWER_U = 0x75,
};



export const trimAll = cached((s: string) => {
  return isUndefOrEmpty(s)
    ? EMPTY_STRING
    : s.trim().replace(twoPlusSpacesRE, WHITE_SPACE);
});

export const stripQuotes = cached((s: string) => {
  if (s.length < 2) {
    return s;
  }
  const c0 = s.charCodeAt(0);
  const cn = s.charCodeAt(s.length - 1);

  if (
    (c0 === CharCode.QUOTE && cn === CharCode.QUOTE) ||
    (c0 === CharCode.APOS && cn === CharCode.APOS)
  ) {
    return s.slice(1, s.length - 1);
  } else {
    return s;
  }
});

export const stripCurleys = cached((exp: string) => {
  if (exp.startsWith('{{') && exp.endsWith('}}')) {
    return exp.substring(2, exp.length - 2).trim();
  }
  return EMPTY_STRING;
});


export const ignoreCaseEquals = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
