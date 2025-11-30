import { error, info, warn } from '@lux/core/logging';
import { AnyFunction } from '@lux/core/types';
import { isArray, isDef, isUndef, isUndefOrEmpty } from '@lux/helpers/is';
import { CharCode, stripQuotes } from '@lux/helpers/strings';
import {
  FALSE, NULL, TRUE, UNDEFINED,
  aliasFactory, cached, functionWrap, getUsedVariables,
  numberFactory, stringFactory
} from '@lux/helpers/common';


const TOKEN_PATTERNS = [
  { type: Token.PAREN, re: /^[()]/ },
  { type: Token.STRING, re: /^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/ },
  { type: Token.LOGICAL, re: /^(&&|\|\|)/ },
  { type: Token.EQUAL, re: /^(?:!=|==)=?/ },
  { type: Token.COMP, re: /^[<>]=?/ },
  { type: Token.OP, re: /^[!+*\-\/]/ },
  { type: Token.BOOL, re: /^(true|false)/ },
  { type: Token.NIL, re: /^(undefined|null)/ },
  { type: Token.VAR, re: /^[_a-z$]+[\w$]*/i },
  { type: Token.NUM,
    re: /^(0[xX][a-fA-F0-9]+|0[bB][01]+|(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?|NaN|Infinity)/ },
];


export interface Expression {
  raw: string,
  uses: Array<string>,
  fn: AnyFunction,
}

const enum Token {
  NONE = 0,
  ERROR = 1,
  PAREN,     // ()
  VAR,       // {validVarRE}
  NUM,       // {validNumRE}
  EQUAL,     // ==, ===, !=, or !==
  COMP,      // <, <=, >, or >=
  LOGICAL,   // && or ||
  OP,        // +, -, * or /
  BOOL,      // true or false
  STRING,    // "any" or 'any'
  NIL,
};


/**
 * Grammar for parsing Expressions.
 * ```
 * <exp> ::= <or>
 * <or> ::= <or> "||" <and> | <and>
 * <and> ::= <and> && <equal> | <equal>
 * <equal> ::= <equal> (==|===|!=|!==) <comp> | <comp>
 * <comp> ::= <comp> (<|<=|>|>=) <addition> | <addition>
 * <addition> ::= <addition> (+|-) <mult> | <mult>
 * <mult> ::= <mult> (*|/) <unary> | <unary>
 * <unary> ::= (!|-|+)<simple> | <simple>
 * <simple> ::= "(" <or> ")" | <value>
 * <value> ::= <bool> | <nil> | <num> | <var> | <string>
 * <bool> ::= true | false
 * <nil> ::= undefined | null
 * <num> ::= {number}
 * <var> ::= {variable}
 * <string> ::= {string}
 * ```
 */


const createExpression = (raw: string, uses: Array<string>, fn: AnyFunction): Expression => {
  return { raw, uses, fn };
};

/**
 * ```
 * <or> ::= <or> "||" <and> | <and>
 * ```
 * @param tokens
 */
function _or(tokens: Array<[Token, string]>): AnyFunction {
  let fn = _and(tokens);
  while (tokens[0]?.[1] === '||') {
    tokens.shift();
    let right = _and(tokens);
    let left = fn; // prevents rewriting it
    fn = (data) => left(data) || right(data);
  }
  return fn;
}

/**
 * ```
 * <and> ::= <and> && <equal> | <equal>
 * ```
 * @param tokens
 */
function _and(tokens: Array<[Token, string]>): AnyFunction {
  let fn = _equal(tokens);
  while (tokens[0]?.[1] === '&&') {
    tokens.shift();
    let right = _equal(tokens);
    let left = fn; // prevents rewriting it
    fn = (data) => left(data) && right(data);
  }
  return fn;
}

/**
 * ```
 * <equal> ::= <equal> (==|===|!=|!==) <comp> | <comp>
 * ```
 * @param tokens
 */
function _equal(tokens: Array<[Token, string]>): AnyFunction {
  let fn = _comp(tokens);
  let { re } = TOKEN_PATTERNS.find(({ type }) => type === Token.EQUAL);
  while (isDef(tokens[0]?.[1]) && re.test(tokens[0][1])) {
    let [, op] = tokens.shift();
    let right = _comp(tokens);
    let left = fn; // prevents rewriting it
    switch (op) {
      case '===':
        fn = (data) => left(data) === right(data);
        break;
      case '==':
        fn = (data) => left(data) == right(data);
        break;
      case '!==':
        fn = (data) => left(data) !== right(data);
        break;
      case '!=':
        fn = (data) => left(data) != right(data);
        break;
    }
  }
  return fn;
}

/**
 * ```
 * <comp> ::= <comp> (<|<=|>|>=) <addition> | <addition>
 * ```
 * @param tokens
 */
function _comp(tokens: Array<[Token, string]>): AnyFunction {
  let fn = _addition(tokens);
  let { re } = TOKEN_PATTERNS.find(({ type }) => type === Token.COMP);
  while (isDef(tokens[0]?.[1]) && re.test(tokens[0][1])) {
    let [, op] = tokens.shift();
    let right = _addition(tokens);
    let left = fn; // prevents rewriting it
    switch (op) {
      case '<':
        fn = (data) => left(data) < right(data);
        break;
      case '<=':
        fn = (data) => left(data) <= right(data);
        break;
      case '>':
        fn = (data) => left(data) > right(data);
        break;
      case '>=':
        fn = (data) => left(data) >= right(data);
        break;
    }
  }
  return fn;
}

/**
 * ```
 * <addition> ::= <addition> (+|-) <mult> | <mult>
 * ```
 * @param tokens
 */
function _addition(tokens: Array<[Token, string]>): AnyFunction {
  let fn = _mult(tokens);
  while (tokens[0]?.[1] === '+' || tokens[0]?.[1] === '-') {
    let [, op] = tokens.shift();
    let right = _mult(tokens);
    let left = fn; // prevents rewriting it
    if (op === '+') {
      fn = (data) => left(data) + right(data);
    } else { // op === '-'
      fn = (data) => left(data) - right(data);
    }
  }
  return fn;
}

/**
 * ```
 * <mult> ::= <mult> (*|/) <unary> | <unary>
 * ```
 * @param tokens
 */
function _mult(tokens: Array<[Token, string]>): AnyFunction {
  let fn = _unary(tokens);
  while (tokens[0]?.[1] === '*' || tokens[0]?.[1] === '/') {
    let [, op] = tokens.shift();
    let right = _unary(tokens);
    let left = fn; // prevents rewriting it
    if (op === '*') {
      fn = (data) => left(data) * right(data);
    } else { // op === '/'
      fn = (data) => left(data) / right(data);
    }
  }
  return fn;
}

/**
 * ```
 * <unary> ::= (!|-|+)<simple> | <simple>
 * ```
 * @param tokens
 */
function _unary(tokens: Array<[Token, string]>): AnyFunction {
  if (tokens[0]?.[1] === '!') {
    tokens.shift();
    let fn = _simple(tokens);
    return data => !fn(data);
  }

  if (tokens[0]?.[1] === '-' || tokens[0]?.[1] === '+') {
    let [, op] = tokens.shift();
    if (tokens[0][0] === Token.NUM) {
      // optimizes if there's a signed number
      tokens[0][1] = op + tokens[0][1]; // "5" => "-5" or "+5"
      return _simple(tokens);
    }

    let fn = _simple(tokens);
    if (op === '-') {
      return data => -fn(data);
    } else { // op === '+'
      return data => +fn(data);
    }
  }

  return _simple(tokens);
}

/**
 * ```
 * <simple> ::= "(" <or> ")" | <value>
 * ```
 * @param tokens
 */
function _simple(tokens: Array<[Token, string]>): AnyFunction {
  if (tokens[0]?.[1] === '(') {
    tokens.shift();
    let exp = _or(tokens);
    let [, token2] = tokens.shift();
    if (token2 !== ')') {
      throw new Error('Invalid expression.');
    }
    return exp;
  } else {
    return _value(tokens);
  }
}

/**
 * ```
 * <value> ::= <bool> | <nil> | <num> | <var> | <string>
 * <bool> ::= true | false
 * <nil> ::= undefined | null
 * <num> ::= {number}
 * <var> ::= {variable}
 * <string> ::= {string}
 * ```
 * @param tokens
 */
function _value(tokens: Array<[Token, string]>): AnyFunction {
  let [type, token] = tokens.shift();
  if (type === Token.BOOL) {
    return token === 'true' ? TRUE : FALSE;
  } else if (type === Token.NIL) {
    return token === 'null' ? NULL : UNDEFINED;
  } else if (type === Token.NUM) {
    return numberFactory(Number(token));
  } else if (type === Token.VAR) {
    return aliasFactory(token);
  } else if (type === Token.STRING) {
    return stringFactory(stripQuotes(token));
  } else {
    throw new Error('Invalid expression.');
  }
}

/**
 * ```
 * <exp> ::= <or>
 * ```
 * @param raw
 * @param tokens
 */
function beginParse(raw: string, tokens: Array<[Token, string]>): Expression {
  const uses = tokens.filter(t => t[0] === Token.VAR).map(t => t[1]);
  const fn = _or(tokens);
  if (tokens.length === 0) {
    return createExpression(raw, uses, fn);
  }
  // Prevent (for now) thing like method()
  throw new Error('Invalid expression.');
}

function tokenize(exp: string): Array<[Token, string]>|Token {
  let tokens: Array<[Token, string]> = [];
  let i = 0;

  while (i < exp.length) {
    if (exp.charCodeAt(i) === CharCode.SPACE) {
      i++;
      continue;
    }

    let matched = false;
    const part = exp.slice(i);
    for (const { type, re } of TOKEN_PATTERNS) {
      let match = re.exec(part);
      if (match) {
        i += match[0].length;
        if (type === Token.NUM && isDef(exp[i]) && /[a-z0-9$_]/i.test(exp[i])) {
          // Edge case to catch "5varname", "0b00002" or "0xaaaaaZ"
          return Token.ERROR;
        }
        tokens.push([type, match[0]]);
        matched = true;
        break;
      }
    }

    if (!matched) {
      return Token.ERROR;
    }
  }

  return tokens;
}

const parseExpressionBase = cached((exp: string): Expression => {
  const data = tokenize(exp);

  try {
    if (isArray(data)) {
      return beginParse(exp, data);
    }
  } catch (e) {
    info('Tried parsing expression. Resorting to function wrap.', e);
  }

  const fn = functionWrap(exp);
  if (isUndef(fn)) {
    error('Unable to parse expression', exp);
    return null;
  }

  const uses = getUsedVariables(fn);
  return createExpression(exp, uses, fn);
});

export const parseExpression = (exp: string): Expression => {
  exp = exp?.trim();
  return isUndefOrEmpty(exp) ? null : parseExpressionBase(exp);
};
