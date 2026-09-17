import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const abs=p=>path.join(root,p);
const read=p=>fs.readFileSync(abs(p),'utf8');
const write=(p,v)=>fs.writeFileSync(abs(p),v);

function walk(dir='.'){
  const out=[];
  for(const entry of fs.readdirSync(abs(dir),{withFileTypes:true})){
    const rel=path.posix.join(dir==='.'?'':dir,entry.name);
    if(entry.name==='.git'||entry.name==='node_modules'||rel.startsWith('migrations/000'))continue;
    if(entry.isDirectory())out.push(...walk(rel));else out.push(rel);
  }
  return out;
}

// Personal Dafaa navigation is canonically "Dafati" everywhere.
for(const file of walk().filter(file=>/\.(?:js|mjs|css|html|md|json)$/.test(file))){
  const value=read(file);
  const next=value.replaceAll('change-dafaa','dafati');
  if(next!==value)write(file,next);
}

function replacements(file,pairs){
  let value=read(file);
  for(const [from,to] of pairs)value=value.replaceAll(from,to);
  write(file,value);
}

replacements('dafaa-ui.js',[
  ["LABELS['dafati']='Dafat';","LABELS.dafati='Dafati';"],
  ['every dafaa workspace','every Dafaa workspace'],
  ['Active dafaa','Active Dafaa'],
  ['No active dafaa yet','No active Dafaa yet'],
  ['Join a dafaa','Join a Dafaa'],
  ['create one from a representer account','create a Dafaa from a representer account'],
  ['active dafaa.','active Dafaa.'],
  ['Discover dafat','Discover Dafat'],
  ['public dafat','public Dafat'],
  ['Open dafaa','Open Dafaa'],
  ['Creating secure dafaa workspace…','Creating secure Dafaa workspace…'],
  ["sheet('Create a dafaa'","sheet('Create a Dafaa'"],
  ["sheet('Join a dafaa'","sheet('Join a Dafaa'"]
]);

replacements('app.js',[
  ["dafat:'Dafat'","dafati:'Dafati'"],
  ["dafat:'الدفعات'","dafati:'دفعتي'"],
  ["copy.dafat","copy.dafati"],
  ["waiting:'Your account is ready. Create a dafaa or enroll in one to open the full study workspace.'","waiting:'Your account is ready. Create a Dafaa or enroll in one to open the full study workspace.'"],
  ["available:'Available dafat'","available:'Available Dafat'"],
  ["openDafat:'Open dafat'","openDafat:'Open Dafati'"],
  ["proofOne:'One workspace for every dafaa'","proofOne:'One workspace for every Dafaa'"],
  ["dafaa administration together","Dafaa administration together"],
  ["'dafati': 'Change Dafaa'","dafati: 'Dafati'"],
  ["settingAction('dafati','Change Dafaa')","settingAction('dafati','Dafati')"],
  ["sideAction('dafati','Change Dafaa')","sideAction('dafati','Dafati')"]
]);

replacements('quiet-shell.js',[
  ["'dafati':'Dafat'","dafati:'Dafati'"],
  ["'dafati':'الدفعات'","dafati:'دفعتي'"],
  ["activeDafaa:'Active dafaa'","activeDafaa:'Active Dafaa'"],
  ["recentDafat:'Recent dafat'","recentDafat:'Recent Dafat'"],
  ["seeAllDafat:'See all dafat'","seeAllDafat:'See all Dafat'"],
  ["'dafati':'dafati'","dafati:'dafati'"]
]);

replacements('study-structure.js',[
  ["arSingular:'الكورس',arPlural:'الكورسات'","arSingular:'الدفعة',arPlural:'الدفعات'"]
]);

// Bump every changed browser asset that participates in the domain rename so
// mobile browsers cannot retain pre-Dafaa globals/routes from cache.
let index=read('index.html');
const assets=[
 'academic.js','advanced-chat.js','app.js','calendar-entry-tools.js','calendar.js','dafaa-context.js','dafaa-ui.js','file-client.js','icon-system.js','leader-schedule.js','lecture-media.js','material-files.js','quiet-shell.js','role-panels.js','school-teacher-flow.js','student-social.js','student-suite-grade-fix.js','student-suite.js','study-room-workspace.js','study-structure.js','translation-client-v5.js','viewer-workspace.js',
 'dafaa-ui.css','pre-dafaa.css','quiet-design.css','readonly.css','role-panels.css','school-teacher-flow.css','student-suite.css'
];
for(const asset of assets){
  const escaped=asset.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  index=index.replace(new RegExp(`${escaped}(?:\\?v=[^"']+)?`,'g'),`${asset}?v=20260917-dafaa1`);
}
write('index.html',index);

// These are deliberate cache-boundary assertions, so move them with the assets.
replacements('tests/static-boundary.test.js',[
  ["quiet-design\\.css\\?v=24","quiet-design\\.css\\?v=20260917-dafaa1"],
  ["icon-system\\.js\\?v=3","icon-system\\.js\\?v=20260917-dafaa1"],
  ["quiet-shell\\.js\\?v=11","quiet-shell\\.js\\?v=20260917-dafaa1"],
  ["app\\.js\\?v=20260915-3","app\\.js\\?v=20260917-dafaa1"],
  ["calendar\\.js\\?v=20260915-4","calendar\\.js\\?v=20260917-dafaa1"],
  ["role-panels\\.js\\?v=20260915-2","role-panels\\.js\\?v=20260917-dafaa1"],
  ["role-panels\\.css\\?v=20260915-2","role-panels\\.css\\?v=20260917-dafaa1"]
]);

const test=`const fs=require('node:fs');const assert=require('node:assert/strict');\nconst files=['app.js','quiet-shell.js','dafaa-ui.js','icon-system.js'];\nfor(const file of files){const text=fs.readFileSync(file,'utf8');assert.ok(!text.includes('change-dafaa'),file+' retains old personal route');}\nconst app=fs.readFileSync('app.js','utf8');assert.ok(app.includes('Dafati'), 'app must expose Dafati');\nconst ui=fs.readFileSync('dafaa-ui.js','utf8');assert.ok(ui.includes("LABELS.dafati='Dafati'"));assert.ok(ui.includes('Create a Dafaa'));assert.ok(ui.includes('Discover Dafat'));\nconst structure=fs.readFileSync('study-structure.js','utf8');assert.ok(structure.includes("dafat:{singular:'Dafaa',plural:'Dafat',arSingular:'الدفعة',arPlural:'الدفعات'}"));\nconst index=fs.readFileSync('index.html','utf8');assert.ok(index.includes('dafaa-context.js?v=20260917-dafaa1'));assert.ok(index.includes('app.js?v=20260917-dafaa1'));\nconsole.log('dafaa terminology polish tests passed');\n`;
write('tests/dafaa-terminology.test.js',test);

const pkg=JSON.parse(read('package.json'));
if(!pkg.scripts.test.includes('tests/dafaa-terminology.test.js'))pkg.scripts.test+=' && node tests/dafaa-terminology.test.js';
write('package.json',JSON.stringify(pkg,null,2)+'\n');

// Self-clean one-shot automation.
for(const file of ['scripts/polish-dafaa-domain.mjs','.github/workflows/dafaa-polish.yml']){try{fs.rmSync(abs(file),{force:true});}catch{}}
try{fs.rmdirSync(abs('scripts'));}catch{}
