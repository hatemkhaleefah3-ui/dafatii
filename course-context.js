(() => {
  'use strict';

  const CATALOG_KEY = 'dafatii:courses:v1';
  const COURSE_KEYS = new Set([
    'dafatii:subjects','dafatii:lectures','dafatii:weeklySchedule','dafatii:scheduleNotes',
    'dafatii:examSchedule','dafatii:examNotes','dafatii:scheduleDays','dafatii:schedulePeriods',
    'dafatii:examDays','dafatii:examPeriods','dafatii:studentSuite:v1','dafatii:studyRoomState:v1',
    'dafatii:studyRoomWorkspace:v1','dafatii:chatState:v1','dafatii:chatProState:v1',
    'dafatii:materialFiles:v1'
  ]);
  const ICONS = ['⌘','🧬','◫','⚙','🎓','◇'];

  const TEMPLATES = {
    'Computer Science': {
      icon:'⌘', color:'#2563eb', subjects:[['programming','Programming','⌘'],['data-structures','Data Structures','🧠'],['databases','Databases','▦']],
      lectures:{programming:['Variables, types and control flow','Functions and modular design'], 'data-structures':['Arrays, linked lists and stacks','Trees and graph traversal'], databases:['Relational models and SQL','Indexes and transactions']},
      notes:[['Programming patterns','Separate input, transformation and output. Keep functions small enough to test independently.','programming'],['Database revision','Review normalization, joins, indexes and transaction isolation before the next workshop.','databases']],
      resources:[['MDN JavaScript Guide','A practical reference for JavaScript syntax, objects, functions and modules.','programming','https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide'],['PostgreSQL tutorial','Official tutorial covering relational concepts and SQL fundamentals.','databases','https://www.postgresql.org/docs/current/tutorial.html']],
      assignments:[['Build a task API','Create, validate and document CRUD endpoints for a small task service.','programming',10],['Graph traversal worksheet','Compare breadth-first and depth-first traversal on three graphs.','data-structures',6]],
      rooms:[['Code Review Studio','Programming','Bring one function, explain its tradeoffs, and review one classmate’s solution.'],['Algorithms Problem Lab','Data Structures','Work through traversal and complexity problems in focused blocks.']],
      chats:[['CS Project Team','Let’s agree on the API contract before we split the implementation.'],['Database Study Group','I added a normalization checklist for tonight’s review.']]
    },
    Medicine: {
      icon:'🧬', color:'#0891b2', subjects:[['anatomy','Anatomy','🧬'],['physiology','Physiology','♡'],['pharmacology','Pharmacology','⚕']],
      lectures:{anatomy:['Thorax: landmarks and relations','Upper limb neurovascular anatomy'], physiology:['Cardiac cycle and pressure loops','Respiratory gas exchange'], pharmacology:['Pharmacokinetics fundamentals','Autonomic drug classes']},
      notes:[['Thorax recall map','Trace structures from superficial to deep, then connect each landmark to one clinical example.','anatomy'],['Cardiac cycle checkpoints','Match valve state, pressure change and heart sound during every phase.','physiology']],
      resources:[['NCBI Bookshelf','Searchable biomedical textbooks and reference material.','physiology','https://www.ncbi.nlm.nih.gov/books/'],['OpenStax Anatomy & Physiology','Open anatomy and physiology textbook with chapter review questions.','anatomy','https://openstax.org/details/books/anatomy-and-physiology-2e']],
      assignments:[['Thorax labeling set','Complete the diagram set and write one clinical note per region.','anatomy',5],['Drug class comparison','Compare indications, mechanisms and adverse effects for four autonomic drug classes.','pharmacology',12]],
      rooms:[['Anatomy Recall Lab','Anatomy','Timed image identification and clinical correlation rounds.'],['Physiology Case Circle','Physiology','Reason through one patient case from mechanism to measured values.']],
      chats:[['Clinical Skills Group','Can everyone bring one cardiovascular examination question?'],['Pharmacology Review','I shared the adverse-effect comparison table.']]
    },
    Business: {
      icon:'◫', color:'#7c3aed', subjects:[['accounting','Accounting','▤'],['economics','Economics','↗'],['marketing','Marketing','◎']],
      lectures:{accounting:['Financial statements and the accounting cycle','Accruals, adjustments and closing'], economics:['Supply, demand and market equilibrium','Elasticity and consumer choice'], marketing:['Segmentation and positioning','Customer research and campaign metrics']},
      notes:[['Financial statement links','Net income flows into retained earnings; closing balances then connect to the balance sheet.','accounting'],['Market research brief','Define the decision first, then choose evidence and a representative sample.','marketing']],
      resources:[['OpenStax Principles of Economics','Open textbook covering microeconomics and macroeconomics.','economics','https://openstax.org/details/books/principles-economics-3e'],['SEC beginner resources','Primary-source introductions to company filings and financial statements.','accounting','https://www.investor.gov/introduction-investing/investing-basics']],
      assignments:[['Analyze an annual report','Explain the relationship between the income statement, balance sheet and cash flows.','accounting',8],['Campaign measurement plan','Choose a target segment, objective, channel mix and success metrics.','marketing',14]],
      rooms:[['Accounting Practice Desk','Accounting','Work through journal entries and reconcile the statements together.'],['Market Strategy Workshop','Marketing','Critique positioning statements and campaign assumptions.']],
      chats:[['Case Study Team','I drafted the recommendation slide and listed our assumptions.'],['Economics Seminar','Should we use elasticity or substitution effects in question three?']]
    },
    Engineering: {
      icon:'⚙', color:'#ea580c', subjects:[['calculus','Calculus','∫'],['physics','Physics','⚛'],['mechanics','Mechanics','⚙']],
      lectures:{calculus:['Limits, derivatives and applications','Integration techniques'], physics:['Vectors, motion and forces','Energy and momentum'], mechanics:['Statics and free-body diagrams','Stress, strain and material response']},
      notes:[['Free-body diagram checklist','Isolate the body, show every external force, choose axes, then write equilibrium equations.','mechanics']],
      resources:[['MIT OpenCourseWare: Calculus','Lectures and problem sets for single-variable calculus.','calculus','https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/']],
      assignments:[['Statics problem set','Solve support reactions and internal forces for the assigned frames.','mechanics',9]],
      rooms:[['Engineering Problem Bench','Mechanics','Draw, solve and compare engineering problem approaches.']],
      chats:[['Design Project Team','I updated the load assumptions in our shared notes.']]
    },
    'High School': {
      icon:'🎓', color:'#16a34a', subjects:[['mathematics','Mathematics','∑'],['physics','Physics','⚛'],['chemistry','Chemistry','🧪'],['english','English','Aa']],
      lectures:{mathematics:['Functions and graphs','Trigonometry review'], physics:['Motion and forces','Electricity fundamentals'], chemistry:['Atomic structure and bonding','Chemical equations'], english:['Evidence-based paragraphs','Reading for theme and tone']},
      notes:[['Exam revision plan','Use short retrieval sessions, correct mistakes, and revisit weak topics after two days.','mathematics']],
      resources:[['Khan Academy','Lessons and practice across mathematics and science.','mathematics','https://www.khanacademy.org/']],
      assignments:[['Mixed mathematics review','Complete the mixed problem set and mark questions that need another attempt.','mathematics',7]],
      rooms:[['Exam Revision Hall','Mathematics','Quiet revision blocks with a short question check-in after each round.']],
      chats:[['Class Revision Group','Which topics should we include in Thursday’s review?']]
    }
  };

  const clone = value => JSON.parse(JSON.stringify(value));
  const slug = value => String(value||'course').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,36)||'course';
  const uid = name => `${slug(name)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
  const rawRead = (key,fallback) => window.DafatiiData.readJSON(key,fallback);
  const rawWrite = (key,value) => window.DafatiiData.writeJSON(key,value);
  const scopedKey = (key,courseId) => `dafatii:course:${courseId}:${String(key).replace(/^dafatii:/,'')}`;
  const dueDate = days => {const date=new Date(Date.now()+days*86400000);return date.toISOString().slice(0,10);};

  function validCatalog(value){return value&&Array.isArray(value.courses)&&value.courses.length&&value.courses.some(course=>course.id===value.activeId);}
  function catalog(){const value=rawRead(CATALOG_KEY,null);return validCatalog(value)?value:initialize();}
  function saveCatalog(value){rawWrite(CATALOG_KEY,value);return value;}
  function hasLegacyData(){return [...COURSE_KEYS].some(key=>rawRead(key,null)!==null);}

  function initialize(){
    const existing=rawRead(CATALOG_KEY,null);
    if(validCatalog(existing))return existing;
    if(hasLegacyData()){
      const legacySuite=rawRead('dafatii:studentSuite:v1',{});
      const name=String(legacySuite?.profile?.course||'General studies').trim()||'General studies';
      const course={id:uid(name),name,icon:'◇',color:'#2563eb',institution:String(legacySuite?.profile?.school||''),term:String(legacySuite?.profile?.semester||''),createdAt:Date.now()};
      COURSE_KEYS.forEach(key=>{const value=rawRead(key,null);if(value!==null)rawWrite(scopedKey(key,course.id),value);});
      return saveCatalog({version:1,activeId:course.id,courses:[course]});
    }
    const names=['Computer Science','Medicine','Business'];
    const courses=names.map((name,index)=>({id:`starter-${slug(name)}`,name,template:name,icon:TEMPLATES[name].icon,color:TEMPLATES[name].color,institution:'Dafatii Academy',term:'Foundation term',createdAt:Date.now()+index}));
    const value=saveCatalog({version:1,activeId:courses[0].id,courses});
    courses.forEach(course=>seedCourse(course.id,course.name));
    return value;
  }

  function courseSeed(templateName){
    const template=TEMPLATES[templateName]||TEMPLATES['Computer Science'];
    const createdAt=Date.now();
    const subjects=template.subjects.map(([id,name,icon])=>({id,name,icon}));
    const lectures={};
    subjects.forEach(subject=>{lectures[subject.id]=(template.lectures[subject.id]||[]).map((name,index)=>({id:`${subject.id}-lecture-${index+1}`,name,icon:index?'📖':'▶',link:'',notes:'',createdAt:createdAt-index*60000,updatedAt:createdAt-index*60000,subjectId:subject.id}));});
    const notes=template.notes.map(([title,body,subjectId],index)=>({id:`seed-note-${index+1}`,title,body,subjectId,tags:'course guide',pinned:index===0,createdAt:createdAt-index*3600000,updatedAt:createdAt-index*3600000}));
    const resources=template.resources.map(([title,description,subjectId,url],index)=>({id:`seed-resource-${index+1}`,title,description,subjectId,url,favorite:index===0,createdAt:createdAt-index*7200000,updatedAt:createdAt-index*7200000}));
    const assignments=template.assignments.map(([title,notesText,subjectId,days],index)=>({id:`seed-assignment-${index+1}`,title,notes:notesText,subjectId,dueDate:dueDate(days),priority:index?'medium':'high',status:index?'todo':'doing',createdAt,updatedAt:createdAt,completedAt:null}));
    const deadlines=[{id:'seed-deadline-1',title:`${templateName} study plan review`,date:dueDate(16),subjectId:'',detail:'Review progress and adjust the next two weeks of study.',done:false,createdAt}];
    const schedule=subjects.slice(0,3).map((subject,index)=>({id:`seed-schedule-${index+1}`,subject:template.lectures[subject.id]?.[0]||subject.name,subjectId:subject.id,day:['Sunday','Tuesday','Thursday'][index],time:['10:30 AM','12:15 PM','2:00 PM'][index],location:['Room 204','Learning Lab','Online'][index]}));
    const exams=[{id:'seed-exam-1',subject:subjects[0].name,subjectId:subjects[0].id,lectureIds:(lectures[subjects[0].id]||[]).map(item=>item.id),day:dueDate(28),time:'10:30 AM',location:'Main hall',notes:'Review all listed lectures.',degree:null}];
    const focusLog=[{id:'seed-focus-1',minutes:50,label:`${subjects[0].name} review`,subjectId:subjects[0].id,at:createdAt-86400000}];
    const suite={profile:{name:'Student',username:'student',school:'Dafatii Academy',course:templateName,semester:'Foundation term',bio:'',targetHours:8,studyLanguage:'English',interfaceLanguage:'English'},preferences:{motion:'full',density:'comfortable',weekStarts:'Sunday',defaultFocus:50,notifications:true},notes,resources,assignments,deadlines,focusLog,applications:[],scholarships:[],volunteer:[],support:[],activity:[]};
    const conversations=template.chats.map(([name,message],index)=>({id:`course-chat-${index+1}`,kind:index?'group':'private',name,avatar:name[0],status:index?'Course group · active':'online',messages:[{id:`course-message-${index+1}`,mine:false,type:'text',text:message,at:createdAt-(index+1)*900000,reactions:{}}]}));
    return {subjects,lectures,suite,schedule,exams,chat:{conversations,selected:{private:conversations[0]?.id||'',group:conversations[1]?.id||'',unknown:''},reported:[],blocked:[]}};
  }

  function seedCourse(courseId,templateName){
    const seed=courseSeed(templateName);
    rawWrite(scopedKey('dafatii:subjects',courseId),seed.subjects);
    rawWrite(scopedKey('dafatii:lectures',courseId),seed.lectures);
    rawWrite(scopedKey('dafatii:studentSuite:v1',courseId),seed.suite);
    rawWrite(scopedKey('dafatii:weeklySchedule',courseId),seed.schedule);
    rawWrite(scopedKey('dafatii:examSchedule',courseId),seed.exams);
    rawWrite(scopedKey('dafatii:chatState:v1',courseId),seed.chat);
  }

  function active(){const value=catalog();return value.courses.find(course=>course.id===value.activeId)||value.courses[0];}
  function list(){return clone(catalog().courses);}
  function readJSON(key,fallback){return COURSE_KEYS.has(key)?rawRead(scopedKey(key,active().id),fallback):rawRead(key,fallback);}
  function writeJSON(key,value){return COURSE_KEYS.has(key)?rawWrite(scopedKey(key,active().id),value):rawWrite(key,value);}
  function remove(key){return window.DafatiiData.remove(COURSE_KEYS.has(key)?scopedKey(key,active().id):key);}

  function switchCourse(id){
    const value=catalog();if(!value.courses.some(course=>course.id===id)||value.activeId===id)return false;
    value.activeId=id;saveCatalog(value);window.dispatchEvent(new CustomEvent('dafatii:coursechanged',{detail:{course:active()}}));return true;
  }
  function createCourse({name,templateName,institution='',term=''}){
    const clean=String(name||templateName||'New course').trim().slice(0,80);if(!clean)throw new Error('Course name is required.');
    const template=TEMPLATES[templateName]?templateName:'Computer Science';
    const value=catalog();const course={id:uid(clean),name:clean,template,icon:TEMPLATES[template].icon||ICONS[5],color:TEMPLATES[template].color||'#2563eb',institution:String(institution||'').trim().slice(0,100),term:String(term||'').trim().slice(0,80),createdAt:Date.now()};
    value.courses.push(course);value.activeId=course.id;saveCatalog(value);seedCourse(course.id,template);
    const suite=readJSON('dafatii:studentSuite:v1',{});suite.profile={...(suite.profile||{}),course:clean,school:course.institution,semester:course.term};writeJSON('dafatii:studentSuite:v1',suite);
    window.dispatchEvent(new CustomEvent('dafatii:coursechanged',{detail:{course}}));return clone(course);
  }
  function updateCourse(id,changes){
    const value=catalog(),course=value.courses.find(item=>item.id===id);if(!course)return null;
    if(changes.name)course.name=String(changes.name).trim().slice(0,80)||course.name;
    course.institution=String(changes.institution??course.institution??'').trim().slice(0,100);course.term=String(changes.term??course.term??'').trim().slice(0,80);saveCatalog(value);
    if(id===value.activeId){const suite=readJSON('dafatii:studentSuite:v1',{});suite.profile={...(suite.profile||{}),course:course.name,school:course.institution,semester:course.term};writeJSON('dafatii:studentSuite:v1',suite);window.dispatchEvent(new CustomEvent('dafatii:coursechanged',{detail:{course}}));}
    return clone(course);
  }
  function roomSeeds(){const course=active(),template=TEMPLATES[course.template||course.name]||TEMPLATES['Computer Science'];return template.rooms.map(([name,subject,description],index)=>({id:`course-room-${index+1}`,name,subject,visibility:index?'private':'public',pin:index?'2468':'',description,vibe:index?'Collaborative':'Deep focus',members:48+index*17,online:8+index*3,capacity:30,streak:12+index,accent:course.icon,tags:[course.name,'Course room',index?'PIN':'Open']}));}

  initialize();
  window.DafatiiCourses={catalogKey:CATALOG_KEY,templates:()=>Object.keys(TEMPLATES),active,list,readJSON,writeJSON,remove,switchCourse,createCourse,updateCourse,roomSeeds,scopedKey:key=>scopedKey(key,active().id),isCourseKey:key=>COURSE_KEYS.has(key)};
})();
