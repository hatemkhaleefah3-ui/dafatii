const fs=require('node:fs');
const assert=require('node:assert/strict');
const js=fs.readFileSync('course-modes.js','utf8');
const css=fs.readFileSync('course-modes.css','utf8');
const index=fs.readFileSync('index.html','utf8');

for(const route of ['language-home','language-letters','language-voice','language-grammar','language-video','language-examine']) assert.ok(js.includes("'"+route+"'"),'missing blank language route '+route);
for(const language of ['English','Arabic','Spanish','French','German','Turkish','Persian','Kurdish','Italian','Portuguese','Russian','Chinese','Japanese','Korean','Hindi','Urdu']) assert.ok(js.includes("['"+language+"'"),'missing language '+language);

assert.match(js,/function blankLanguagePage\(page\)/,'blank language page renderer missing');
assert.match(js,/return '<section class="language-blank-page"/,'language pages must render an empty shell');
assert.doesNotMatch(js,/LANGUAGE_PAGE_ITEM_TYPES|pageItemTypes|pageItemType|itemTypeLabel/,'language item type registry must be removed');
assert.doesNotMatch(js,/word_to_native|image_to_word|sentence_to_native|match_pairs|word_builder|fill_blank|trace_letter_word|spelling_write|sentence_builder|category_sort|paragraph_translate_write/,'vocabulary item types must be removed');
assert.doesNotMatch(js,/listen_voice_to_text|listen_voice_to_image|listen_voice_to_native_voice|listen_dictation|listen_missing_word|speak_voice_to_voice|speak_text_to_voice|speak_image_to_voice|speak_answer_question|speak_dialogue_roleplay/,'voice item types must be removed');
assert.doesNotMatch(js,/grammar-law|grammar-note|grammar-example|grammar-training|exam-single-choice|exam-multiple-choice|exam-true-false|exam-fill-blank|exam-short-answer/,'grammar and exam item types must be removed');
assert.doesNotMatch(js,/LANGUAGE_CONTENT_KEY|dafatii:language-content:v1|defaultLanguageContent|normalizeLanguageContent|readLanguageContent|writeLanguageContent/,'language content persistence must be removed from the frontend');
assert.doesNotMatch(js,/renderVocabularyItem|renderVoiceItem|renderExamItem|languageGrammarPage|languageVideoPage|intermediatePage|setupInkPaperExercises|setupStudioExercises/,'legacy language learning renderers must be removed');
assert.doesNotMatch(js,/languageExcel|Excel bulk import|languageVoiceTargets|Voice ZIP import|language-hearing-audio/,'language import system must be removed');
assert.doesNotMatch(js,/MediaRecorder|SpeechRecognition|SpeechSynthesisUtterance|requestLanguageMicrophone/,'language speech and recording system must be removed');
assert.doesNotMatch(js,/language-start-zero|language-level-test|openLanguageEnrollment|installLanguageEnrollInterceptor/,'legacy language onboarding system must be removed');

assert.doesNotMatch(css,/CANONICAL LANGUAGE COURSE DESIGN|LANGUAGE LEARNING SYSTEM — Precision UI|Ink & Paper|Midnight Studio|Home — Observatory|Grammar — Blueprint Atelier|Cinema & Editorial|Arena Focus/,'language-specific visual themes must be removed');
for(const selector of ['.word-flip-card','.studio-listen-button','.grammar-law-card','.exam-card','.story-book-shell','.language-home-hero']) assert.ok(!css.includes(selector),'legacy language design selector must be removed '+selector);
assert.match(css,/Language courses deliberately inherit the standard Dafatii workspace theme/,'standard-theme marker missing');
assert.match(css,/\.language-blank-page\{min-height:1px\}/,'blank page shell style missing');

assert.ok(index.includes('course-modes.css?v=20260921-24'),'CSS cache version missing');
assert.ok(index.includes('course-modes.js?v=20260921-23'),'JS cache version missing');
assert.match(js,/personal-focus-room/,'personal course behavior changed');
console.log('blank language course shell tests passed');
