import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const client=readFileSync(new URL('../social-live.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../social-live.css',import.meta.url),'utf8');
const backend=readFileSync(new URL('../functions/_lib/social.mjs',import.meta.url),'utf8');
const api=readFileSync(new URL('../functions/api/v1/[[path]].js',import.meta.url),'utf8');
const migration=readFileSync(new URL('../migrations/0008_social_chat.sql',import.meta.url),'utf8');
const course=readFileSync(new URL('../course-context.js',import.meta.url),'utf8');

assert.match(index,/social-live\.css\?v=20260919-1/);
assert.match(index,/social-live\.js\?v=20260919-1/);
assert.ok(index.indexOf('social-live.js?v=20260919-1')>index.indexOf('subject-redesign.js?v=20260919-3'),'live social controller must be the final workspace wrapper');
assert.doesNotMatch(index,/advanced-chat\.css[^\n]*\\n/,'asset markup must not contain a literal escaped newline');

for(const table of ['social_conversations','social_members','social_messages','social_reactions','social_poll_votes','social_posts','social_post_saves']){
  assert.match(migration,new RegExp('CREATE TABLE IF NOT EXISTS '+table));
  assert.ok(backend.includes('CREATE TABLE IF NOT EXISTS '+table),table+' must self-heal in deployed environments where migrations have not run yet');
}
assert.match(api,/dispatchSocialRoute/,'main API must dispatch authenticated social routes');
assert.match(backend,/social\/people/);
assert.match(backend,/social\/conversations/);
assert.match(backend,/social\/posts/);
assert.match(backend,/anonymousAlias/,'anonymous message responses must use aliases rather than expose account identity');
assert.match(backend,/ANONYMOUS_MEMBERS_HIDDEN/,'anonymous member identities must not be enumerable');
assert.match(backend,/Join this conversation before viewing members\./,'public group membership must not expose member identities to non-members');
assert.match(backend,/SOCIAL_RATE_LIMITED/,'social writes require abuse bounds');
assert.match(backend,/Only text messages and polls are currently supported/,'unsupported attachment types must not pretend to be shareable');
assert.match(backend,/social_poll_votes/,'polls must persist one real vote per user');

assert.ok(client.includes("api('/social/conversations'"),'conversation list/create must use backend API');
assert.ok(client.includes("api('/social/people?q='"),'private chat creation must search real Dafatii accounts');
assert.ok(client.includes("'/join',{method:'POST'"),'discoverable groups must have a real join action');
assert.ok(client.includes("'/messages',{method:'POST'"),'message composer must send to backend');
assert.ok(client.includes("'/reactions',{method:'POST'"),'message reactions must persist');
assert.ok(client.includes("'/poll',{method:'POST'"),'poll votes must persist');
assert.ok(client.includes("api('/social/posts'"),'community posts must use backend');
assert.ok(client.includes("'/save',{method:'POST'"),'post save button must persist');
assert.ok(client.includes("'/members'"),'group Members tab must load real member data');
assert.ok(client.includes("method:'PATCH'"),'pin/mute/archive conversation controls must persist');
assert.ok(client.includes("c.kind==='anonymous'&&c.visibility==='public'"),'public anonymous discovery cards must open a real readable thread');
assert.ok(client.includes("id=\"live-thread-join\""),'public room preview must expose a real join action');
assert.ok(client.includes("document.activeElement?.id==='live-message-input'"),'background refresh must not erase an in-progress message draft');
assert.ok(client.includes("document.activeElement?.id==='live-chat-search'"),'background refresh must not interrupt an active search field');
assert.ok(client.includes("!cache.error"),'failed API loads must not enter automatic retry loops');
assert.ok(client.includes("input?.dataset.sending==='1'"),'message sending must suppress accidental duplicate submits');
assert.ok(!client.includes('Start Meeting'),'nonfunctional meeting controls must not be displayed');
assert.ok(!client.includes('Voice call'),'nonfunctional call controls must not be displayed');
assert.ok(!course.includes("'dafatii:chatState:v1'"),'new courses must not seed or synchronize mock chat records');
assert.ok(!course.includes('course-message-'),'new courses must not include fake conversations');

for(const marker of ['.live-chat-brand','.live-chat-tabs','.live-chat-card','.live-post-card','.live-thread-shell','.live-composer'])
  assert.ok(css.includes(marker),marker+' theme style missing');
assert.ok(css.includes('var(--accent)')&&css.includes('var(--surface)')&&css.includes('var(--bg)')&&css.includes('var(--text)'),'social UI must use shared website theme variables');

console.log('live social backend/client tests passed');
