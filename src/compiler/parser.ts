import { arrayUnwrap } from "../helpers/array";
import { lookup } from "../helpers/functions";
import { isBoolean, isNumber, isPrimitive, isString, isUndef, isValidVariable } from "../helpers/is";
import { ref, Reference } from "../helpers/ref";
import { CharCode, stripParens, stripQuotes, toEscapedChar } from "../helpers/strings";
import { Primitive, State, UndefType } from "../types";

export const enum StatementType {
  // When there's no function (either a lookup or cast)
  SINGLE = 1,

  // When it involves a cast (straight value)
  LEFT_CAST = 2,
  RIGHT_CAST = 4,
  CAST = LEFT_CAST|RIGHT_CAST,
  STRAIGHT_CAST = SINGLE|CAST,

  // When it involves a lookup
  LEFT_LOOKUP = 8,
  RIGHT_LOOKUP = 16,
  LOOKUP = LEFT_LOOKUP|RIGHT_LOOKUP,
  STRAIGHT_LOOKUP = SINGLE|LOOKUP,

  // When it gets turned into a function
  COMPLEX = 32,
}

const containsTickRE = /(`)/g;
const splitCompOpsRE = /\s*((?:>|<|!=|==)=?)\s*/;

type ExpFn = (state?: State, additional?: State) => any;

export const enum ComparisonOp {
  EQ = '==',
  SE = '===',
  NE = '!=',
  SN = '!==',
  LT = '<',
  LE = '<=',
  GT = '>',
  GE = '>='
}

const comparisonOps: Record<ComparisonOp,(l:any,r:any)=>boolean> = Object.freeze({
  [ComparisonOp.EQ]: (l: any, r: any) => l == r,
  [ComparisonOp.SE]: (l: any, r: any) => l === r,
  [ComparisonOp.NE]: (l: any, r: any) => l != r,
  [ComparisonOp.SN]: (l: any, r: any) => l !== r,
  [ComparisonOp.GT]: (l: any, r: any) => l > r,
  [ComparisonOp.GE]: (l: any, r: any) => l >= r,
  [ComparisonOp.LT]: (l: any, r: any) => l < r,
  [ComparisonOp.LE]: (l: any, r: any) => l <= r,
});

type BasicType = Primitive|UndefType
type OperationArray = [BasicType, ComparisonOp, BasicType];

export interface Statement {
  type: StatementType;
  val: ExpFn|BasicType|OperationArray,
}

export function evalStatement(statement: Statement, state: State, additional?: State) {
  const { type, val } = statement;

  if (type & StatementType.SINGLE) {
    return type === StatementType.STRAIGHT_LOOKUP
      ? lookup(val, state, additional) : val;
  } else if (type & StatementType.COMPLEX) {
    return (<ExpFn>val).call({ ...state, ...(additional||{}) }, state, additional);
  }

  let [left, op, right] = <OperationArray>val;

  if (type & StatementType.LEFT_LOOKUP) {
    left = lookup(left, state, additional);
  }

  if (type & StatementType.RIGHT_LOOKUP) {
    right = lookup(right, state, additional);
  }

  return comparisonOps[op](left, right);
}

function checkIfCastable(a: any, r: Reference<BasicType>, allowEmptyString=true): boolean {
  if (isString(a)) {
    a = stripParens(a);
    if (!isNaN(a)) { // is number
      return r.set(Number(a));
    }
    switch (a) {
      case 'true':
        return r.set(true);
      case 'false':
        return r.set(false);
      case 'null':
        return r.set(null);
      case 'undefined':
        return r.set(undefined);
      case '':
        r.set(a);
        return allowEmptyString;
      default:
        break;
    }
    // TODO: check strings
    const q = stripQuotes(a);

    if (a !== q) { // checks if it was wrapped in quotes
      return r.set(q);
    } else {
      return false;
    }
  } else if (isNumber(a) || isBoolean(a) || isUndef(a)) {
    r.set(a);
    return true;
  } else {
    return false;
  }
}

function createComplex(exp: string): Statement {
  return {
    type: StatementType.COMPLEX,
    val: <ExpFn>new Function(`with(this){return ${exp}}`),
  };
}

export function pruneString(exp: string, r: Reference<string>, startIndex=0): boolean {
  const first = exp.charCodeAt(startIndex);
  
  if (first !== CharCode.QUOTE && first !== CharCode.APOS) {
    return false;
  }

  const from = exp.slice(startIndex);
  let code: number, end = -1;

  if (/\\/.test(from)) {
    r.set('');
    let escaped = false;
    for (let i = startIndex + 1; i < exp.length; ++i) {
      code = exp.charCodeAt(i);
      if (escaped) {
        let esc;
        if (code === CharCode.LOWER_X) {
          esc = exp.slice(i, i + 2);
        } else if (code === CharCode.LOWER_U) {
          esc = exp.slice(i, i + 4);
        } else {
          esc = exp.charAt(i);
        }
        try {
          esc = toEscapedChar(esc);
        } catch (e) {}
        r.value += esc;
        escaped = false;
      } else if (code === CharCode.BACKSLASH) {
        escaped = true;
        continue;
      } else if (code === first) {
        end = i;
        break;
      } else {
        r.value += exp.charAt(i);
      }
    }
  } else {
    for (let i = startIndex + 1; i < exp.length; ++i) {
      code = exp.charCodeAt(i);
      if (code === first) {
        end = i;
        r.set(exp.slice(startIndex + 1, end));
        break;
      }
    }
  }

  return end !== -1;
}


function tryForSimple(exp: string): Statement {
  function simpleCastWrap(val: string, cast: Reference<BasicType|Statement>) {
    if (checkIfCastable(val=stripParens(val), <Reference<BasicType>>cast, false)) {
      return true;
    } else if (isValidVariable(val)) {
      cast.set(val);
      return false;
    }
    throw StatementType.COMPLEX;
  }

  const vals = exp.split(splitCompOpsRE);
  if (vals.length !== 3) {
    throw StatementType.COMPLEX;
  }

  const [lval, op, rval] = vals;
  if (isUndef(op) || !(op in comparisonOps)) {
    throw StatementType.COMPLEX;
  }

  const left = ref<BasicType>();
  const leftIsCast = simpleCastWrap(lval, left);
  const right = ref<BasicType>();
  const rightIsCast = simpleCastWrap(rval, right);
  
  if (leftIsCast && rightIsCast) {
    const comp = comparisonOps[<ComparisonOp>op];
    return {
      type: StatementType.STRAIGHT_CAST,
      val: comp(left.value, right.value),
    };
  } else {
    let type = leftIsCast ? StatementType.LEFT_CAST : StatementType.LEFT_LOOKUP;
    type |= rightIsCast ? StatementType.RIGHT_CAST : StatementType.RIGHT_LOOKUP;

    const val: OperationArray = [left.value, <ComparisonOp>op, right.value];
    return { type, val };
  }
}

/**
 * Bug: Passing '"r" == "r"' will yield an incorrect statement.
 * Be careful with passing strings
 * @param exp
 */
export function parseStatement(exp: string): Statement {
  exp = exp.trim();
  const r = ref<BasicType>();
  if (checkIfCastable(exp, r)) {
    return {
      type: StatementType.STRAIGHT_CAST,
      val: r.value
    };
  } else if (containsTickRE.test(exp)) {
    return createComplex(exp);
  }

  exp = stripParens(exp);

  if (isValidVariable(exp)) {
    return {
      type: StatementType.STRAIGHT_LOOKUP,
      val: exp
    };
  } else {
    try {
      return tryForSimple(exp);
    } catch (e) {
      if (e === StatementType.COMPLEX) {
        return createComplex(exp);
      } else {
        throw e;
      }
    }
  }

}
