const fs=require('node:fs');const assert=require('node:assert/strict');
const files=['app.js','quiet-shell.js','dafaa-ui.js','icon-system.js'];
for(const file of files){const text=fs.readFileSync(file,'utf8');assert.ok(!text.includes('change-dafaa'),file+' retains old personal route');}
const app=fs.readFileSync('app.js','utf8');assert.ok(app.includes('Dafati'), 'app must expose Dafati');
const ui=fs.readFileSync('dafaa-ui.js','utf8');assert.ok(ui.includes("LABELS.dafati='Dafati'"));assert.ok(ui.includes('Create a Dafaa'));assert.ok(ui.includes('Discover Dafat'));
const structure=fs.readFileSync('study-structure.js','utf8');assert.ok(structure.includes("dafat:{singular:'Dafaa',plural:'Dafat',arSingular:'الدفعة',arPlural:'الدفعات'}"));
const index=fs.readFileSync('index.html','utf8');assert.ok(index.includes('dafaa-context.js?v=20260917-dafaa2'));assert.ok(index.includes('app.js?v=20260917-dafaa1'));
console.log('dafaa terminology polish tests passed');
