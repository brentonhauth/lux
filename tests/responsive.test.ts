
// import { parseExpression } from "./compiler/ast/expression";
// import { AnyFunction } from "./core/types";
// import { ref } from "./core/responsive/ref";
// import { computed } from "./core/responsive/computed";
// import { effect } from "./core/responsive/effect";
// import { isUndef } from "./helpers/is";

// const count = ref(0);

// effect(() => {
//   console.log('Count is', count.value);
// });

// const double = computed(() => {
//   // console.log('[Setting double]');
//   return count.value * 2;
// });

// effect(() => {
//   console.log('Doubled count:', double.value);
// });

// const isEven = computed(() => (count.value & 1) === 0);

// const parity = computed(() => isEven.value ? 'even' : 'odd');

// effect(() => {
//   console.log('The count is an', parity.value, 'number!');
// });