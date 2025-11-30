import { type AnyFunction } from '@lux/core/types';

const whitespacesRE = /^\s*$/;

// Does NOT include forbidden tags.
const htmlTags: Readonly<Set<string>> = new Set([
  'a', 'abbr', 'acronym', 'address', 'applet', 'area', 'article', 'aside', 'audio',
  'b', 'base', 'basefont', 'bb', 'bdo', 'big', 'blockquote', 'br', 'button', 'canvas',
  'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'command', 'datagrid', 'datalist',
  'dd', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'em', 'embed',
  'eventsource', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'frame',
  'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'i', 'main',
  'iframe', 'img', 'input', 'ins', 'isindex', 'kbd', 'keygen', 'label', 'legend', 'li', 'link',
  'map', 'mark', 'menu', 'meter', 'nav', 'noframes', 'object', 'ol', 'optgroup', 'option',
  'output', 'p', 'param', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's',
  'samp', 'section', 'select', 'small', 'source', 'span', 'strike', 'strong',
  'sub', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title',
  'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr',
]);

const forbiddenTags: Readonly<Set<string>> = new Set([
  'script', 'template', 'noscript', 'html', 'style', 'body', 'head', 'meta',
]);

const keywords: Readonly<Set<string>> = new Set([
  'function', 'return', 'var', 'let', 'const', 'if', 'else', 'while', 'for', 'in', 'do',
  'switch', 'class', 'case', 'break', 'default', 'continue', 'true', 'false', 'null', 'undefined',
  'new', 'this', 'try', 'catch', 'finally', 'throw', 'with', 'typeof', 'instanceof', 'delete',
  'arguments', 'import', 'export', 'as', 'async', 'await', 'debugger',
]);

export const isKeyword = (word: string) => keywords.has(word);
export const isHtmlTag = (tag: string) => htmlTags.has(tag.toLowerCase());
export const isForbiddenTag = (tag: string) => forbiddenTags.has(tag.toLowerCase());
export const isBlankString = (s: string) => whitespacesRE.test(s);
export const isUndefOrEmpty = (a: any[]|string) => isUndef(a) || a.length === 0;

export const isDef = (a: any) => a != null;
export const isUndef = (a: any): a is undefined|null => a == null;

export const isArray = Array.isArray;
export const isNumber = (a: any): a is number => typeof a === 'number';
export const isBoolean = (a: any): a is boolean => typeof a === 'boolean';
export const isFunction = (a: any): a is AnyFunction => typeof a === 'function';
export const isString = (a: any): a is string => typeof a === 'string';
export const isObject = (a: any): a is object => a && typeof a === 'object';
export const isReal = (a: any): a is (string|boolean|number) => (
  typeof a === 'string' ||
  typeof a === 'number' ||
  typeof a === 'boolean'
);
