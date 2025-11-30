const exps = [
  'a',
  '5.6',
  'a + b',
  'a + b / c',
  'a != 8',
  '(a * b) - c || d',
  'a != 8 || 5.6 === 3 && 4 + 2 < 0xFAFA',
  'true + 1',
  '!1',
  'mystring == "HELLO"',
  'mystring == null',
  'mystring == undefined',
];


// for (let t of test) {
//   let exp = parseExpression(t);
//   let i = 1;
//   let obj = <any>{};
//   exp.uses.forEach(f => { obj[f] = i++ });
//   console.log(obj);
//   console.log(t, exp, 'CALLED:', exp.fn(obj));
// }


// let obj: any = {};

// const test = proxyWrap(obj, ({ prop, value }) => {
//   console.log(`set ${String(prop)} = ${value}`, obj);
// });
// (<any>globalThis).test = test;
