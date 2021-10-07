/// <references path="./src/*" />
(function() {
"use strict";

/** @type {import('./src/h').h} */
const h = window.Lux.h;
/** @type {import('./src/h').$if} */
const $if = window.Lux.$if;
/** @type {import('./src')} */
const Lux = window.Lux;

let paused = false;
let pauseBtn = document.getElementById('PauseBtn');
pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.innerText = paused ? 'Unpause' : 'Pause';
});


const instance = Lux.$createApp({
  render(h) {
    let random = Math.round(Math.random() * 20)
    let cs = [];
    for (let i = 0; i < random; i++) {
      cs.push(h('span', {
        attrs: {
          id: `span-x-${i}`
        }
      }, String(i)));
    }
    let count = (this._state?.count || 0);
    return h('div', {
      attrs: {
        'data-test': count,
      },
      style: {
        'background-color': `rgb(56, 255, ${Math.max(Math.min(count * 10, 255), 0)})`,
        'width': '100px',
        'height': '100px',
      }
    }, [
      String(count),
      ...cs
    ]);
  }
}).$mount('#App');


let count = 0;
setInterval(() => {
  if (!paused) {
    try {
      instance.$update({ count: ++count });
    } catch (err) {
      console.error(err);
    }
  }
}, 2500);


})();
