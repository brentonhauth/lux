import { arrayUnwrap } from "../helpers/array";
import { lookup } from "../helpers/functions";
import { isBoolean, isString, isUndef, isValidVariable } from "../helpers/is";
import { ref, Reference } from "../helpers/ref";
import { stripParens, stripQuotes } from "../helpers/strings";
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

const containsQuoteRE = /("|'|`)/g;
const splitCompOpsRE = /(?:>|<|!=|==)=?/;

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
  const { type } = statement;

  if (type & StatementType.SINGLE) {
    let value = <Primitive|UndefType>statement.val;
    return type === StatementType.STRAIGHT_LOOKUP
      ? lookup(value, state, additional) : value;
  } else if (type & StatementType.COMPLEX) {
    let fn = (<ExpFn>statement.val).bind({...state, ...additional});
    return fn(state, additional);
  }

  let [left, op, right] = <OperationArray>statement.val;

  if (type & StatementType.LEFT_LOOKUP) {
    left = lookup(left, state, additional);
  }

  if (type & StatementType.RIGHT_LOOKUP) {
    right = lookup(right, state, additional);
  }

  return comparisonOps[op](left, right);
}

function checkIfCastable(a: any, r: Reference<BasicType>, allowEmptyString=true): boolean {
  if (!isNaN(a)) {
    r.set(Number(a));
    return true;
  } else if (isBoolean(a) || a === 'true' || a === 'false') {
    r.set(Boolean(a));
    return true;
  } else if (isUndef(a)) {
    r.set(a);
    return true;
  } else if (a === 'null') {
    r.set(null);
    return true;
  } else if (a === 'undefined') {
    r.set(undefined);
    return true;
  } else if (isString(a)) {
    if (a === '') {
      r.set(a);
      return allowEmptyString;
    }
    // TODO: check strings
    a = stripParens(a);
    const q = stripQuotes(a);

    if (a !== q) { // checks if it was wrapped in quotes
      r.set(q);
      return true;
    } else {
      return false;
    }
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
  const op = <ComparisonOp>arrayUnwrap(splitCompOpsRE.exec(exp));
  console.log(`OP: ${op}  exec: ${splitCompOpsRE.exec(exp)}`);
  if (isUndef(op) || !(op in comparisonOps)) {
    throw StatementType.COMPLEX;
  }

  const vals = exp.split(splitCompOpsRE);
  if (vals.length !== 2) {
    throw StatementType.COMPLEX;
  }

  const left = ref<BasicType>();
  const leftIsCast = simpleCastWrap(vals[0], left);
  const right = ref<BasicType>();
  const rightIsCast = simpleCastWrap(vals[1], right);
  
  if (leftIsCast && rightIsCast) {
    const comp = comparisonOps[<ComparisonOp>op];
    return {
      type: StatementType.STRAIGHT_CAST,
      val: comp(left.value, right.value),
    };
  } else {
    let type = leftIsCast ? StatementType.LEFT_CAST : StatementType.LEFT_LOOKUP;
    type |= rightIsCast ? StatementType.RIGHT_CAST : StatementType.RIGHT_LOOKUP;

    const val: OperationArray = [left.value, op, right.value];
    return { type, val };
  }
}


export function parseStatement(exp: string): Statement {
  exp = exp.trim();
  const r = ref<BasicType>();
  if (checkIfCastable(exp, r)) {
    return {
      type: StatementType.STRAIGHT_CAST,
      val: r.value
    };
  } else if (containsQuoteRE.test(exp)) {
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
