const assert = require('node:assert/strict');
const fs = require('node:fs');

const script = fs.readFileSync('file-reader-interactions.js', 'utf8');
const css = fs.readFileSync('file-reader-interactions.css', 'utf8');
const workspace = fs.readFileSync('viewer-workspace.js', 'utf8');
const design = fs.readFileSync('lecture-reader-design.css', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

assert.match(script, /reader-loading/, 'file readers must enter a dedicated loading state');
assert.match(script, /reader-ready/, 'file readers must expose a ready state before content is revealed');
assert.match(script, /data-viewer-loading-screen/, 'file readers must mount a full loading screen');
assert.match(script, /originalPdf\.open[\s\S]*await originalOpen[\s\S]*reveal\(root\)/, 'PDF content must remain gated until its initial render completes');
assert.match(script, /status\.hidden[\s\S]*reveal\(root\)/, 'Office content must remain gated until the renderer reports ready');
assert.match(script, /event\.touches\.length !== 2/, 'pinch zoom must require exactly two touch points');
assert.match(script, /event\.preventDefault\(\)/, 'custom pinch zoom must suppress browser page zoom while active');
assert.match(script, /controls\.zoomIn|controls\.zoomOut/, 'pinch gestures must use the viewer zoom API');
assert.match(script, /Math\.hypot/, 'pinch zoom must calculate two-finger distance');
assert.match(script, /reader-chrome-hidden/, 'reader chrome must auto-hide while document content is scrolling');
assert.match(script, /addEventListener\('scroll',onScroll/, 'reader auto-hide must be driven by the document stage scroll event');
assert.match(workspace, /data-viewer-dock="switch"/, 'file reader must expose the switch lecture action');
assert.match(workspace, /data-viewer-dock="navigate"/, 'file reader must expose lecture navigation');
assert.match(workspace, /data-viewer-dock="status"/, 'file reader must expose lecture status');
assert.match(workspace, /data-viewer-dock="examine"/, 'file reader must expose examine tools');
assert.match(workspace, /data-reader-settings/, 'file reader must expose the reference-style reader settings sheet');
assert.match(workspace, /data-reader-axis/, 'reader settings must support page direction where the renderer exposes it');
assert.match(design, /\.file-workspace \.reader-settings-button/, 'the reference reader must have a mirrored top settings control');
assert.match(design, /\.file-workspace \.viewer-reader-dock/, 'the reference reader must use the four-action floating dock');
assert.match(design, /\.viewer-status-list/, 'lecture status must use a dedicated sheet layout');
assert.match(design, /\.viewer-examine-list/, 'examine tools must use a dedicated sheet layout');
assert.match(css, /\.viewer-loading-screen\{/, 'the loading screen must cover the reader');
assert.match(css, /reader-loading[\s\S]*visibility:hidden/, 'document stages must remain hidden while loading');
assert.match(css, /touch-action:pan-x pan-y/, 'single-finger document scrolling must remain enabled while custom pinch zoom is active');
assert.match(index, /file-reader-interactions\.css\?v=20260917-1/, 'the loading and pinch styles must be loaded');
assert.match(index, /file-reader-interactions\.js\?v=20260919-1/, 'the loading, pinch, and chrome controller must be loaded');
assert.match(index, /viewer-workspace\.js\?v=20260919-1/, 'the redesigned reader controls must be loaded');
assert.match(index, /lecture-reader-design\.css\?v=20260919-1/, 'the redesigned file-reader presentation must be loaded');

console.log('file reader loading and pinch checks passed');
