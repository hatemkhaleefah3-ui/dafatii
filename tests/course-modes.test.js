const fs=require('node:fs');
const assert=require('node:assert/strict');
const js=fs.readFileSync('course-modes.js','utf8');
const css=fs.readFileSync('course-modes.css','utf8');
const index=fs.readFileSync('index.html','utf8');

for(const route of ['language-home','language-letters','language-voice','language-grammar','language-video','language-examine']) assert.ok(js.includes("'"+route+"'"),'missing language route '+route);
for(const language of ['English','Arabic','Spanish','French','German','Turkish','Persian','Kurdish','Italian','Portuguese','Russian','Chinese','Japanese','Korean','Hindi','Urdu']) assert.ok(js.includes("['"+language+"'"),'missing language '+language);

assert.match(js,/LANGUAGE_CONTENT_KEY = 'dafatii:language-content:v2'/,'language item storage key missing');
assert.match(js,/LANGUAGE_PAGE_ITEM_TYPES/,'page-specific item catalog missing');
for(const type of ['letter','word-translation','image-word','sentence-pair','spelling-write','handwriting','pronunciation','text-to-voice','image-to-voice','voice-to-text','voice-to-image','voice-pair','grammar-topic','grammar-rule','grammar-example','grammar-training','youtube-video','story','reading','single-choice','multiple-choice','true-false','fill-blank','ordering','short-answer']) assert.ok(js.includes("'"+type+"'"),'missing language item type '+type);
assert.match(js,/openLanguageItemEditor/,'item add/edit UI missing');
assert.match(js,/data-language-edit/,'item edit control missing');
assert.match(js,/data-language-delete/,'item deletion control missing');
assert.match(js,/data-language-share/,'shared item action missing');
assert.match(js,/speechSynthesis/,'pronunciation interaction missing');
assert.match(js,/youtube-nocookie.com/,'safe YouTube item renderer missing');
assert.match(js,/function languageItemsPage/,'language page renderer missing');
assert.match(js,/.language-items-page/,'premium language item layout missing');
assert.match(css,/.language-item-card/,'language item card design missing');
assert.match(css,/.theme-vocabulary/,'page theme tokens missing');
assert.match(css,/.language-item-editor/,'item editor styling missing');
assert.ok(index.includes('course-modes.css?v=20260922-25'),'CSS cache version missing');
assert.ok(index.includes('course-modes.js?v=20260922-24'),'JS cache version missing');
assert.match(js,/personal-focus-room/,'personal course behavior changed');
console.log('language content item type tests passed');
