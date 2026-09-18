const fs=require('node:fs');
const assert=require('node:assert/strict');

const ui=fs.readFileSync('student-social.js','utf8');
const css=fs.readFileSync('student-social.css','utf8');
const advanced=fs.readFileSync('advanced-chat.js','utf8');
const advancedCss=fs.readFileSync('advanced-chat.css','utf8');
const referenceCss=fs.readFileSync('chat-reference-redesign.css','utf8');
const shell=fs.readFileSync('quiet-shell.js','utf8');
const quiet=fs.readFileSync('quiet-design.css','utf8');
const index=fs.readFileSync('index.html','utf8');

assert.ok(ui.includes("const CHAT_SUBNAV = ['Private chats','Groups','Blogs & announcements','Anonymous'];"),'chat destinations must remain stable');
assert.ok(ui.includes("'Private chats':[['all','All'],['unread','Unread'],['anonymous','Anonymous'],['archived','Archived']]"),'Messages filters must match the supplied reference');
assert.ok(ui.includes("'Groups':[['joined','Joined'],['discover','Discover'],['pinned','Pinned'],['archived','Archived']]"),'Groups tabs must match the supplied reference');
assert.ok(ui.includes("'Blogs & announcements':[['latest','Latest'],['announcement','Announcements'],['article','Articles'],['event','Events']]"),'Blogs tabs must match the supplied reference');
assert.ok(ui.includes("'Anonymous':[['trending','Trending'],['new','New'],['course','Course-based'],['private','Private']]"),'Anonymous tabs must match the supplied reference');

assert.ok(ui.includes("return 'Messages';")&&ui.includes("return 'Anonymous Chats';")&&ui.includes("return 'Blogs';"),'reference page titles must be rendered');
assert.ok(ui.includes('class="chat-app-wordmark"')&&ui.includes('Learn together. Go further.'),'Chat list pages must use the Dafatii reference wordmark');
assert.ok(ui.includes('id="chat-app-quick-new"')&&ui.includes('class="chat-app-profile"'),'reference top actions must include create and profile');
assert.ok(ui.includes('class="chat-app-privacy-banner"'),'Anonymous list must include a privacy/conduct banner');
assert.ok(ui.includes('function chatFeedView()')&&ui.includes('chat-feed-search')&&ui.includes('chat-feed-card-body'),'Blogs must use the reference feed/search/card structure');
assert.ok(ui.includes("document.getElementById('chat-app-quick-new')?.addEventListener('click',openCommunityPostSheet)"),'Blogs create action must stay functional');
assert.ok(ui.includes("CHAT_POST_KEY = 'dafatii:chatCommunityPosts:v1'"),'community posts must persist');

assert.ok(advanced.includes("const scoped=kind==='private'?state.conversations"),'Messages must aggregate direct, group, and anonymous conversations');
assert.ok(advanced.includes("ui.filter==='anonymous'&&c.kind!=='unknown'"),'Messages Anonymous filter must be functional');
assert.ok(advanced.includes("ui.filter==='pinned'&&!m.pinned"),'Groups Pinned filter must be functional');
assert.ok(advanced.includes("class='chatpro-topic-chips'"),'Groups must expose reference category chips');
assert.ok(advanced.includes("data-chat-kind='${esc(c.kind)}'"),'mixed Messages cards must retain their real chat kind for routing');
assert.ok(advanced.includes('function threadContext(c)'),'thread-specific reference contexts must exist');
assert.ok(advanced.includes("if(c.kind==='group')return")&&advanced.includes('chatpro-course-card'),'group threads must include Chat/Files/Members context and course card');
assert.ok(advanced.includes("if(c.kind==='unknown')return")&&advanced.includes('chatpro-anon-safety'),'anonymous threads must include pinned safety guidance');
assert.ok(advanced.includes('chatpro-msg-avatar'),'incoming thread messages must render sender avatars');
assert.ok(advanced.includes('Reply anonymously…'),'anonymous composer copy must match the supplied reference');
assert.ok(advanced.includes("document.getElementById('chat-app-quick-new')?.addEventListener"),'top create action must create chats/groups/anonymous rooms');
assert.ok(advanced.includes('const rowKind=row.dataset.chatKind||kind'),'mixed Messages routing must preserve group and anonymous routes');

for(const marker of [
  '.reference-brandbar','.chat-app-page-heading','.chat-app-privacy-banner','.chatpro-topic-chips',
  '.chatpro-conversation.kind-group','.chat-feed-search','.chat-feed-card-body',
  '.chatpro-group-context','.chatpro-course-card','.chatpro-anon-safety','.chatpro-msg-avatar'
]) assert.ok(referenceCss.includes(marker),marker+' reference style missing');

assert.ok(referenceCss.includes('Reference-driven Chat redesign v5'),'reference redesign stylesheet marker missing');
assert.ok(index.includes('chat-reference-redesign.css?v=20260919-1'),'reference redesign stylesheet must be loaded');
assert.ok(index.includes('student-social.js?v=20260919-3')&&index.includes('advanced-chat.js?v=20260919-3'),'Chat JavaScript must be cache-busted');
assert.ok(shell.includes("shell.classList.toggle('chat-app-host',current==='chat')"),'shared shell must activate dedicated Chat host mode');
assert.ok(quiet.includes('.quiet-workspace.chat-app-host>.quiet-toolbar')&&quiet.includes('.quiet-workspace.chat-app-host>.bottom-nav')&&quiet.includes('display:none!important'),'ordinary workspace chrome must remain hidden inside Chat');
assert.ok(advancedCss.includes('.chat-app-stage .chatpro-shell.list-only')&&advancedCss.includes('.chat-app-stage .chatpro-shell.thread-only'),'advanced engine shell integration must remain intact');
assert.ok(css.includes('.chat-app-bottom'),'canonical Chat navigation remains available');

console.log('chat app reference redesign tests passed');
