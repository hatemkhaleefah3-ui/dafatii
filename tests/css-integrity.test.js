const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('quiet-design.css', 'utf8');

assert.doesNotMatch(css, /\\n/, 'CSS must not contain escaped newline text');
assert.doesNotMatch(
  css,
  /^\s*html\[data-device=(?:mobile|tablet)\]\s*$/m,
  'device selectors must always have a declaration block or selector continuation'
);
assert.doesNotMatch(css, /Unified interaction system v8/, 'retired override layers must stay removed');
assert.match(css, /\/\* Shared icon and gesture primitives\. \*\//, 'shared primitives must remain in the canonical stylesheet');

function assertBalancedBraces(source) {
  let depth = 0;
  let quote = '';
  let inComment = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (inComment) {
      if (char === '*' && next === '/') {
        inComment = false;
        index += 1;
      }
      continue;
    }
    if (!quote && char === '/' && next === '*') {
      inComment = true;
      index += 1;
      continue;
    }
    if (quote) {
      if (char === '\\') {
        index += 1;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      assert.ok(depth >= 0, 'CSS contains an unmatched closing brace');
    }
  }
  assert.equal(inComment, false, 'CSS contains an unterminated comment');
  assert.equal(quote, '', 'CSS contains an unterminated string');
  assert.equal(depth, 0, 'CSS contains unmatched braces');
}

assertBalancedBraces(css);
console.log('CSS integrity tests passed');
