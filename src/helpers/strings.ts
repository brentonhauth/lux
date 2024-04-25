import { cached, safeGet } from './functions';
import { isString, isUndefOrEmpty } from './is';

const twoPlusSpacesRE = /\s{2,}/;
const removeDoubleCurlsRE = /^\{\{\s*(?<exp>.*)\s*\}\}$/;
const unicodeRE = /^u[\d]{4}$/;
const hexRE = /^x[a-fA-F\d]{2}$/;
const capitalizeRE = /(^|\s|-)[a-z]/g;


export const enum Char {
  EMPTY_STRING = '',
  WHITE_SPACE = '\x20',
};

export const enum CharCode {
  LEFT_PAREN = 0x28, // (
  RIGHT_PAREN = 0x29, // )
  QUOTE = 0x22, // "
  APOS = 0x27, // '
  TICK = 0x60, // `
  BACKSLASH = 0x5c, // \
  LOWER_X = 0x78,
  LOWER_U = 0x75,
};


export function stringWrap(a: any): string {
  return isString(a) ? a : String(a);
}

export function trimAll(s: string|any) {
  return isString(s)
    ? s.trim().replace(twoPlusSpacesRE, Char.WHITE_SPACE)
    : Char.EMPTY_STRING;
}

export function safeLower(s: string|any) {
  return isString(s) ? s.toLowerCase() : s;
}

function stripParens(s: string, deep=true): string {
  s = s.trim();
  if (s.length < 2) {
    return s;
  }
  const c0 = s.charCodeAt(0);
  const cn = s.charCodeAt(s.length - 1);
  if (c0 === CharCode.LEFT_PAREN && cn === CharCode.RIGHT_PAREN) {
    s = s.slice(1, s.length - 1);
    return deep ? stripParens(s) : s;
  } else {
    return s;
  }
}

export const stripParensDeep = cached((s: string) => {
  return stripParens(s, true);
});

export const stripParensShallow = cached((s: string) => {
  return stripParens(s, false);
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

export const capitalize = cached((s: string) => {
  return s.replace(capitalizeRE, c => c.toUpperCase());
});

export function ignoreCaseEquals(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase();
}

export function safeIgnoreCaseEquals(a: string, b: string) {
  return safeLower(a) === safeLower(b);
}

export const stripDoubleCurls = cached((s: string) => {
  const t = s.trim();
  if (t.length < 4) {
    // Invalid
    return s;
  }
  const result = removeDoubleCurlsRE.exec(t);
  return safeGet<string>(result, 'groups.exp', Char.EMPTY_STRING);
});

export const toEscapedChar = cached((char: string) => {
  if (isUndefOrEmpty(char)) {
    return char;
  } else if (char.length === 1) {
    switch (char) {
      case "'": return '\'';
      case '"': return '\"';
      case '\\': return '\\'; 
      case 'n': return '\n';
      case 't': return '\t';
      case 'b': return '\b';
      case 'r': return '\r';
      case 'v': return '\v';
      case 'f': return '\f';
      default: return char;
    }
  }

  if (unicodeRE.test(char) || hexRE.test(char)) {
    return String.fromCharCode(parseInt(char.slice(1), 16));
  } else {
    return char;
  }
});
