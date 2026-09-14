const assert=require('node:assert/strict');
const icons=require('../icon-system.js');

for(const name of ['dashboard','subjects','calendar','study-rooms','chat','profile','settings','edit','trash','add']){
  const markup=icons.icon(name);
  assert.match(markup,/^<svg class="ui-icon"/);
  assert.match(markup,/<path d="[^"]+"\/>/);
  assert.ok(!/[⌂◇□◎◌⚙○✎×＋]/u.test(markup),`${name} must not use a text glyph`);
}
assert.equal(icons.icon('missing'),icons.icon('info'));
console.log('icon-system tests passed');
