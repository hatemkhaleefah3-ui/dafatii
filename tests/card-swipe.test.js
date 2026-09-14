const assert=require('node:assert/strict');
const swipe=require('../card-swipe.js');

assert.equal(swipe.destination(20,0),0,'short drags close');
assert.equal(swipe.destination(60,0),92,'right drag reveals edit');
assert.equal(swipe.destination(-60,0),-92,'left drag reveals delete');
assert.equal(swipe.destination(60,80),0,'vertical scrolling never opens actions');
console.log('card-swipe tests passed');
