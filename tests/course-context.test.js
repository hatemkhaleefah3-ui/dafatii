const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const source = fs.readFileSync('course-context.js', 'utf8');
const values = new Map(), events = [], requests = [];
const localStorage = { getItem:key=>values.has(key)?values.get(key):null, setItem:(key,value)=>values.set(key,String(value)), removeItem:key=>values.delete(key) };
const course = { id:'11111111-1111-4111-8111-111111111111', enrollmentCode:'COURSE1', name:'Computer Science', institution:'Academy', stage:'university', pricing:'free', visibility:'public', joinPolicy:'direct', membership:{ role:'owner', status:'active', permissions:{} } };
const window = {
  localStorage, DafatiiAuth:{ user:{ id:'22222222-2222-4222-8222-222222222222', accountType:'representer', platformRole:'student' } },
  DafatiiData:{ readJSON:(_key,fallback)=>fallback, writeJSON:(_key,value)=>value, remove(){} },
  DafatiiApi:{ async request(path,options={}) { requests.push([path,options]); if(path.startsWith('/courses?'))return {actor:window.DafatiiAuth.user,courses:[course]};if(path.endsWith('/content')&&(!options.method||options.method==='GET'))return {records:[{key:'dafatii:subjects',value:[{id:'programming',name:'Programming'}],revision:1,deleted:false}]};if(path.endsWith('/content'))return {revision:2};throw new Error(`Unexpected ${path}`); } },
  dispatchEvent:event=>events.push(event)
};
const context=vm.createContext({window,localStorage,CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail;}},Date,Math,JSON,Set,String,Map,Promise,crypto:webcrypto});
vm.runInContext(source,context);

(async()=>{
  const api=window.DafatiiCourses;
  assert.equal(api.active().id,'');
  await api.refresh();
  assert.equal(api.active().name,'Computer Science');
  assert.equal(api.readJSON('dafatii:subjects',[])[0].name,'Programming');
  api.writeJSON('dafatii:subjects',[{id:'databases',name:'Databases'}]);
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(requests.some(([path,options])=>path.endsWith('/content')&&options.method==='PUT'),true);
  assert.equal(events.some(event=>event.type==='dafatii:coursesloaded'),true);
  console.log('course context tests passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
