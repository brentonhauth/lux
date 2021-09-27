/// <references path="./src/*" />
(function() {
"use strict";

/**
 * @type {import('./src/h').h}
 */
const h = window.lux.h;
/**
 * @type {import('./src/vdom').VDOM}
 */
const $vdom = window.lux.$vdom;

let paused = false;
let pauseBtn = document.getElementById('PauseBtn');
pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.innerText = paused ? 'Unpause' : 'Pause';
});



// let root = h('div', {}, [
//   h('input', {})
// ]);

// = lux.mount(root, document.getElementById('App'));

$vdom.createApp(state => {
  let count = (state?.count || 0);
  // return (
  //   (count & 1) === 0
  //     ? h('input', { value: 3, id: 'In' })
  //     : h('button', {  }, 'BUTTON')
  // );
  // if (count % 3 === 0) {
  //   return h('input', { value: 3, id: 'In' });
  // }
  // if (count % 3 === 1) {
  //   return h('button', {  }, 'BUTTON');
  // }
  // if (count % 3 === 2) {
  //   return undefined;
  // }
  let x = 0;
  let random = Math.round(Math.random() * 20);

  let cs = [];

  for (let i = 0; i < random; i++) {
    cs.push(h('span', {
      id: `span-x-${i}`
    }, String(i)));
  }

  // console.log('RANDOM', random);
  // return h('div', {
  //   'data-testx': count,
  // }, [
  //   h('div', {
  //     'data-test': count,
  //     id: 'div1',
  //     style: {
  //       'background-color': '#f00',
  //       'width': '100px',
  //       'height': '100px',
  //     }
  //   }, [
  //     String(count),
  //     h('input', { value: count }),
  //     h('span', { id: Math.random() }, cs)
  //   ]),
  // ]);

  return h('div', {
    'data-test': count,
    style: {
      'background-color': `rgb(56, 255, ${Math.max(Math.min(count * 10, 255), 0)})`,
      'width': '100px',
      'height': '100px',
    }
  }, [
    String(count),
    ...cs
  ]);
});

/** @type {Element} */
let rootEl = $vdom.mount('#App');

let count = 0;
setInterval(() => {
  if (!paused) {
    try {
      $vdom.updateState({ count: ++count });
    } catch (err) {
      console.error(err);
    }
  }
}, 2500);


})();
