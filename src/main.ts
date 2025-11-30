import Lux from "./lux";

import { isUndef } from "./helpers/is";
import { parseExpression } from "./compiler/ast/expression";
import { createState } from "./core/responsive/state";
import { computed } from "./core/responsive/computed";
import { effect } from "./core/responsive/effect";
import { createInstance } from "./vdom/component";
import { ref } from "./core/responsive/ref";
import { watch } from "./core/responsive/watcher";
import { aliasFactory } from "./helpers/common";
// import { aliasFactory } from "./helpers/functions";


const TestComponent = Lux.$component({
  state: () => ({
    // a: 0,
    // b: 0,
    // c: 0,
  }),

  methods: {},

  $mount() {
    this.dat = 3;
  },



  props: ['subtext'],

  template: '#test_component'
});

const app = Lux.$createApp({
  state: () => ({
    mystring: 'String test',
    a: false,
    b: false,
    c: 1,
    list: ['0a', '1b', '2c'],
  }),
  methods: {
    hello(e: any) {
      this.c++;
      if (this.c > 2) {
        this.c = 0;
      }
      console.log('uwu', this.c, e);
      setTimeout(() => {
        // e.dispatchEvent(new Event('click'));
      }, 2000);
    }
  },
  template: '#app',
}).component('TestComponent', TestComponent);

app.mount('#placeApp');

// const instance = createInstance(component);


// app.component('Component', component);


// const cond_pa = computed(() => {
//   const res = exp.fn(instance.state);
//   console.log('computing... (value now', res, ')');
//   return res;
// });

// const pairings = ['p >= a', 'q + b', 'r * c', 'a + b'];

// for (let pair of pairings) {
//   let i = 0, j = 0;
//   let exp0 = parseExpression(pair);
//   let c = computed(() => {
//     const res = exp0.fn(instance.state);
//     if (i++ > 1000) {
//       throw new Error('Finna crash out.');
//     }
//     console.log('computing: ', pair, ' (value now', res, ')');
//     return res;
//   });

//   effect(() => {
//     if (j++ > 1000) {
//       throw new Error('Finna fuckin\' crash out.');
//     }
//     console.log(`Update to (${pair}):`, c.value);
//   });
// }

// console.log(JSON.stringify(state));

// effect(() => {
//   console.log('Does (p > a)', cond_pa.value);
// });

// effect(() => {});

// (globalThis as any).state = instance.state;


// (function() {
// 'use strict';
// const el = document.getElementById('test');
// const width = ref(100);
// function makeAttr(el: any) {
//   let styleAttr = document.createAttribute('style');
//   styleAttr.value = '';
//   el.setAttributeNode(styleAttr);
//   return styleAttr;
// }
// watch(makeAttr(el), () => {
//   console.log('SETTING!!!!', width.value);
//   el.setAttribute('style',`width:${width.value}px;height:50px;background-color:purple;`);
// });
// (<any>globalThis).w = width;
// })();



// const state = createState({ a: 1, b: 1, c: 2, d: 3 });
// const exp = parseExpression('a === b || c !== d');

// const result = computed(() => exp.fn(state));
// effect(() => {
//   console.log('(a === b || c !== d)', result.value);
// });

// (globalThis as any).state = state;

