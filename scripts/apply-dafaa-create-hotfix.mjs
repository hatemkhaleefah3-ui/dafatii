import fs from 'node:fs';

const patch=(path,fn)=>{const src=fs.readFileSync(path,'utf8');const next=fn(src);if(next===src)throw new Error(`No change for ${path}`);fs.writeFileSync(path,next);};
const replaceBlock=(src,startMarker,endMarker,replacement)=>{const start=src.indexOf(startMarker);const end=src.indexOf(endMarker,start);if(start<0||end<0)throw new Error(`Block not found: ${startMarker}`);return src.slice(0,start)+replacement+src.slice(end+endMarker.length);};

patch('functions/_lib/dafaa-routes.mjs',src=>replaceBlock(
  src,
  '  await context.env.DB.batch([insertDafaa, insertOwner]);',
  '  return ok({ dafaa: dafaaDto(row) }, 201);',
`  await context.env.DB.batch([insertDafaa, insertOwner]);
  try {
    await audit(context.env.DB, currentActor.id, 'dafaa.created', { dafaaId, targetUserId: owner.id, metadata: { pricing: value.pricing, visibility: value.visibility, joinPolicy: value.joinPolicy } });
  } catch (error) {
    logEvent('warn', 'dafaa.audit_failed', { userId: currentActor.id, dafaaId, name: error?.name || 'Error' });
  }
  const created = {
    id: dafaaId, enrollmentCode: code, name: value.name, description: value.description,
    institution: value.institution, stage: value.stage, status: 'active', pricing: value.pricing,
    priceMinor: value.priceMinor, currency: value.currency, visibility: value.visibility,
    joinPolicy: value.joinPolicy, hasAccessCode: Boolean(codeHash), ownerUserId: owner.id,
    memberCount: 1, applicationCount: 0,
    membership: { userId: owner.id, role: 'owner', status: 'active', permissions: Object.fromEntries(PERMISSIONS.map(permission => [permission.replace(/^can_/, ''), true])), applicationNote: '', joinedAt: now, updatedAt: now },
    createdAt: now, updatedAt: now
  };
  logEvent('info', 'dafaa.created', { userId: currentActor.id, dafaaId });
  return ok({ dafaa: created }, 201);`));

patch('dafaa-context.js',src=>replaceBlock(
  src,
  '  async function createDafaa(input){',
  '  }',
`  async function createDafaa(input){
    const template=TEMPLATES[input.templateName]?input.templateName:'Computer Science';
    const result=await window.DafatiiApi.request('/dafat',{method:'POST',body:input});
    runtime.activeId=result.dafaa.id;
    localStorage.setItem('__dafatii:active-dafaa',runtime.activeId);
    runtime.dafat=[result.dafaa,...runtime.dafat.filter(item=>item.id!==result.dafaa.id)];
    let initializationError=null;
    try{
      await refresh();
      for(const [key,value] of Object.entries(seedValues(template)))await putInitial(result.dafaa.id,key,value);
      await hydrate(result.dafaa.id);
    }catch(error){
      initializationError=error;
      try{await refresh();}catch{}
    }
    window.dispatchEvent(new CustomEvent('dafatii:dafaachanged',{detail:{dafaa:active(),initializationError}}));
    if(initializationError)window.dispatchEvent(new CustomEvent('dafatii:dafaainitwarning',{detail:{dafaaId:result.dafaa.id,error:initializationError}}));
    return result.dafaa;
  }`));

patch('index.html',src=>src.replace('dafaa-context.js?v=20260917-dafaa1','dafaa-context.js?v=20260917-dafaa2'));
patch('tests/dafaa-rbac.test.mjs',src=>src.replace("console.log('dafaa RBAC tests passed');","assert.ok(routes.includes('dafaa.audit_failed'), 'dafaa creation audit must not turn a committed creation into a 500');\nassert.ok(routes.includes('return ok({ dafaa: created }, 201)'), 'dafaa creation must return committed owner data directly');\nconsole.log('dafaa RBAC tests passed');"));
patch('tests/dafaa-context.test.js',src=>src.replace("console.log('dafaa context tests passed');","assert.ok(source.includes('dafatii:dafaainitwarning'), 'post-create template initialization failures must be non-fatal');\nassert.ok(source.includes('return result.dafaa'), 'successful dafaa creation must return even when initialization warns');\n  console.log('dafaa context tests passed');"));
patch('tests/dafaa-terminology.test.js',src=>src.replace('dafaa-context.js?v=20260917-dafaa1','dafaa-context.js?v=20260917-dafaa2'));
