(() => {
  'use strict';

  const done = new WeakSet();
  const pendingNodes = new Set();
  const pendingAttrs = new Map();
  const cache = new Map();
  let timer = 0;
  let running = false;

  const ar = new Map(Object.entries({
    'Dashboard':'لوحة التحكم','Overview':'نظرة عامة','Recent materials':'المواد الحديثة','Progress':'التقدم',
    'Library':'المكتبة','All subjects':'جميع المواد','My subjects':'موادي','Subjects':'المواد','Subject':'المادة','Notes':'ملاحظات','Resources':'المصادر','Assignments':'الواجبات','Open subject':'فتح المادة','Materials':'المواد',
    'Schedule':'الجدول','Weekly schedule':'الجدول الأسبوعي','Calendar':'التقويم','Exams':'الامتحانات','Deadlines':'المواعيد النهائية','Exam schedule':'جدول الامتحانات','Time':'الوقت','Edit':'تعديل','Add':'إضافة','Delete':'حذف','Remove':'إزالة','Save':'حفظ','Cancel':'إلغاء','Done':'تم','Close':'إغلاق','Back':'رجوع','Go back':'رجوع',
    'Good morning':'صباح الخير','Good afternoon':'مساء الخير','Good evening':'مساء الخير','Student':'طالب','Your academic command center: what needs attention, what changed, and where to go next.':'مركزك الأكاديمي: ما يحتاج إلى اهتمام، وما الذي تغيّر، وإلى أين تتجه بعد ذلك.','Note':'ملاحظة','Assignment':'واجب','Log focus':'تسجيل وقت التركيز',
    'open assignments':'واجبات مفتوحة','focus this week':'التركيز هذا الأسبوع','degree average':'معدل الدرجات','unread chats':'محادثات غير مقروءة','No active room':'لا توجد غرفة نشطة','Nothing urgent':'لا شيء عاجل','Next up':'التالي','Priority queue':'قائمة الأولويات','See deadlines':'عرض المواعيد النهائية','Recently touched':'المستخدمة مؤخرًا','View all':'عرض الكل','This week':'هذا الأسبوع','Weekly focus goal':'هدف التركيز الأسبوعي','Study flow':'مسار الدراسة','Jump back in':'العودة للدراسة','Study rooms':'غرف الدراسة','Chat':'المحادثة','Continue room':'متابعة الغرفة','Find accountability':'اعثر على شريك للالتزام','Talk to classmates':'تحدث مع زملائك',
    'No recent materials':'لا توجد مواد حديثة','Create a note, resource, or lecture to populate this feed.':'أنشئ ملاحظة أو مصدرًا أو محاضرة لعرضها هنا.','No recent actions.':'لا توجد إجراءات حديثة.','No items yet.':'لا توجد عناصر بعد.','No results':'لا توجد نتائج','No date':'لا يوجد تاريخ',
    'All materials':'جميع المواد','Recent':'الأحدث','Search':'بحث','Filter':'تصفية','Today':'اليوم','Tomorrow':'غدًا','Upcoming':'القادمة','Completed':'المكتملة','Overdue':'متأخرة','General':'عام','General / none':'عام / بدون',
    'Lectures repeat every week.':'تتكرر المحاضرات كل أسبوع.','Use the same timetable tools as your weekly schedule.':'استخدم أدوات الجدول نفسها الخاصة بجدولك الأسبوعي.','Saved automatically':'يتم الحفظ تلقائيًا','Add notes…':'أضف ملاحظات…','Manual entry':'إدخال يدوي','Add weekly lecture':'إضافة محاضرة أسبوعية','Add exam':'إضافة امتحان','Add to weekly schedule':'إضافة إلى الجدول الأسبوعي','Add to exam schedule':'إضافة إلى جدول الامتحانات','Exam subject':'مادة الامتحان','Subject / lecture':'المادة / المحاضرة','Day / column':'اليوم / العمود','Time / row':'الوقت / الصف','Location / room':'الموقع / القاعة','Optional':'اختياري','Add from Excel file':'إضافة من ملف Excel','Import Day, Time, Subject and optional Location.':'استورد اليوم والوقت والمادة والموقع الاختياري.','Add manually':'إضافة يدويًا','Open the manual entry page.':'فتح صفحة الإدخال اليدوي.','Edit weekly schedule':'تعديل الجدول الأسبوعي','Schedule management':'إدارة الجدول','Add to schedule':'إضافة إلى الجدول','Replace current schedule':'استبدال الجدول الحالي','Remove current schedule':'إزالة الجدول الحالي','Add lectures manually or import a file.':'أضف المحاضرات يدويًا أو استورد ملفًا.','Upload an Excel or CSV file and replace all current entries.':'ارفع ملف Excel أو CSV لاستبدال جميع الإدخالات الحالية.','Delete all weekly schedule entries and notes.':'احذف جميع إدخالات الجدول الأسبوعي وملاحظاته.',
    'Sunday':'الأحد','Monday':'الاثنين','Tuesday':'الثلاثاء','Wednesday':'الأربعاء','Thursday':'الخميس','Friday':'الجمعة','Saturday':'السبت',
    'Lecture':'المحاضرة','Edit lecture':'تعديل المحاضرة','Add lecture':'إضافة محاضرة','Lecture name':'اسم المحاضرة','Lecture link':'رابط المحاضرة','Lecture notes…':'ملاحظات المحاضرة…','Icon':'الأيقونة','Save changes':'حفظ التغييرات','Lectures included in the exam':'المحاضرات المشمولة في الامتحان','No lectures in this subject yet.':'لا توجد محاضرات في هذه المادة بعد.','Add a subject first':'أضف مادة أولًا','Create a subject before adding a lecture to the weekly schedule.':'أنشئ مادة قبل إضافة محاضرة إلى الجدول الأسبوعي.','Create a subject before adding an exam.':'أنشئ مادة قبل إضافة امتحان.','Back to Schedule':'العودة إلى الجدول','Back to Exams':'العودة إلى الامتحانات','Degrees':'الدرجات','Degree':'الدرجة','Analysis':'التحليل','Fill in the degree for each exam.':'أدخل الدرجة لكل امتحان.','No exams yet':'لا توجد امتحانات بعد','Exams created in Calendar will automatically appear here.':'ستظهر الامتحانات التي تُنشأ في التقويم هنا تلقائيًا.','Automatically calculated from this subject.':'يُحسب تلقائيًا من هذه المادة.','Lectures':'المحاضرات','Total lectures':'إجمالي المحاضرات','Total exams':'إجمالي الامتحانات','Degrees filled':'الدرجات المدخلة','Completed exam degrees':'درجات الامتحانات المكتملة','Average of entered degrees':'متوسط الدرجات المدخلة','Enter degree':'أدخل الدرجة',
    'Representer panel':'لوحة الممثل','Representer Panel':'لوحة الممثل','Dafaa management':'إدارة الدفعة','Dafaa operations':'إدارة الدفعة','Manage enrollment, access and delegated advantages for this dafaa.':'إدارة التسجيل والوصول والصلاحيات المفوضة لهذه الدفعة.','Refresh':'تحديث','Dafaa access':'الوصول إلى الدفعة','Name':'الاسم','Pricing':'التسعير','Free':'مجاني','Paid':'مدفوع','Price in minor units':'السعر بالوحدات الصغرى','Visibility':'الظهور','Public':'عام','Private by code':'خاص برمز','Join policy':'سياسة الانضمام','Direct join':'انضمام مباشر','Needs acceptance':'يتطلب الموافقة','New access code':'رمز وصول جديد','Leave blank to keep current':'اتركه فارغًا للاحتفاظ بالحالي','Save dafaa access':'حفظ إعدادات الوصول','Enrollment code':'رمز التسجيل','Add a registered member':'إضافة عضو مسجل','Representer':'ممثل','Members and applications':'الأعضاء والطلبات','Loading members…':'جارٍ تحميل الأعضاء…','Recent audit trail':'سجل النشاط الأخير','Accept':'قبول','Reject':'رفض','Verify payment':'تأكيد الدفع','Make representer':'تعيين كممثل','Advantages':'الصلاحيات','Representer advantages':'صلاحيات الممثل','Save advantages':'حفظ الصلاحيات',
    'Admin panel':'لوحة الإدارة','Admin Panel':'لوحة الإدارة','Administration':'الإدارة','Platform operations':'إدارة المنصة','Full control over accounts, dafat, enrollment and representers.':'تحكم كامل بالحسابات والدفعات والتسجيل والممثلين.','Users':'المستخدمون','Active dafat':'الدفعات النشطة','Enrollments':'التسجيلات','Pending':'قيد الانتظار','All dafat':'جميع الدفعات','Create a Dafaa':'إنشاء دفعة','Open':'فتح','Archive':'أرشفة','Accounts':'الحسابات','Standard':'عادي','Admin':'مسؤول','Active':'نشط','Disabled':'معطل','Deleted':'محذوف','Access denied':'تم رفض الوصول',
    'Messages':'الرسائل','Dafat':'الدفعات','Profile':'الملف الشخصي','Settings':'الإعدادات','Apply for work':'التقديم للعمل','Scholarships':'المنح الدراسية','Volunteer':'التطوع','Support Dafatii':'دعم دفاتري','Workspace':'مساحة العمل','Account & preferences':'الحساب والتفضيلات','Appearance':'المظهر','Language':'اللغة','Light mode':'الوضع الفاتح','Dark mode':'الوضع الداكن','English':'الإنجليزية','Arabic':'العربية','Sign out':'تسجيل الخروج','Your account':'حسابك','Active dafaa':'الدفعة النشطة','Recent dafat':'أحدث الدفعات','See all dafat':'عرض جميع الدفعات','See full profile':'عرض الملف الشخصي كاملاً','Email':'البريد الإلكتروني','Study stage':'المرحلة الدراسية','School':'المدرسة','University':'الجامعة','Independent':'مستقل','Focus':'التركيز','Apply':'تقديم','Confirm':'تأكيد','Continue':'متابعة','Edit profile':'تعديل الملف الشخصي','Change dafaa':'تغيير الدفعة','Loading…':'جارٍ التحميل…','Required':'مطلوب',
    'Home':'الرئيسية','About':'حول','Features':'المزايا','Contact':'تواصل معنا','Start studying':'ابدأ الدراسة','Explore features':'استكشف المزايا','Your study life in one place':'حياتك الدراسية في مكان واحد','Study less. Learn more.':'ادرس بذكاء أكثر. تعلّم أكثر.','One space for every dafaa':'مساحة واحدة لكل دفعة','Built for focus, not clutter':'مصمم للتركيز بلا فوضى'
  }));

  const userContent = [
    'script','style','code','pre','[contenteditable]','[data-user-content]','[data-no-translate]',
    '.chat-message','.message-bubble','.advanced-message','.file-viewer',
    '.quiet-profile-summary strong','.quiet-dafaa-list strong',
    '.member-who strong','.member-who span','.admin-row>div strong','.admin-row>div span',
    '.subject-card-copy h2','.subject-card-copy strong','.academic-toggle',
    '.lecture-card h2','.lecture-card strong','.lecture-card .lecture-name',
    '.suite-note-card h2','.suite-note-card .suite-card-body','.suite-note-card textarea',
    '.suite-resource-card h2','.suite-resource-card .suite-card-body',
    '.suite-material-card h2','.suite-material-card .suite-card-body',
    '.dafaa-card h2','.dafaa-card p','.cal-cell.filled strong','.cal-cell.filled span',
    'select[name="subject"] option:not([value=""])'
  ].join(',');

  const attrs=['placeholder','aria-label','title'];
  const normalize=v=>String(v??'').trim().replace(/\s+/g,' ');
  const eligible=v=>/[A-Za-z]{2}/.test(v)&&!/@|https?:\/\//i.test(v)&&v.length<=2000;
  const language=()=>typeof interfaceLanguage==='function'?interfaceLanguage():(document.documentElement.lang==='ar'?'ar':'en');
  const decode=v=>{const t=document.createElement('textarea');t.innerHTML=String(v??'');return t.value;};
  const protectedElement=el=>Boolean(el?.closest?.(userContent));

  function dynamic(source){
    let m;
    if((m=source.match(/^(\d+) due within 7 days$/)))return `${m[1]} مستحق خلال 7 أيام`;
    if((m=source.match(/^(\d+)h weekly target$/)))return `الهدف الأسبوعي ${m[1]} س`;
    if((m=source.match(/^(\d+) graded exams$/)))return `${m[1]} امتحانات مُقيّمة`;
    if((m=source.match(/^(\d+) weekly entries$/)))return `${m[1]} عناصر أسبوعية`;
    if((m=source.match(/^(\d+) saved links\/files$/)))return `${m[1]} روابط/ملفات محفوظة`;
    if((m=source.match(/^(\d+) sessions$/)))return `${m[1]} جلسات`;
    if((m=source.match(/^(\d+)% assignments done$/)))return `${m[1]}٪ من الواجبات مكتملة`;
    if((m=source.match(/^(\d+) subjects$/)))return `${m[1]} مواد`;
    if((m=source.match(/^(\d+) unread messages$/)))return `${m[1]} رسائل غير مقروءة`;
    if((m=source.match(/^in (\d+) days$/)))return `خلال ${m[1]} أيام`;
    if((m=source.match(/^(\d+)d overdue$/)))return `متأخر ${m[1]} يوم`;
    return '';
  }
  const local=s=>ar.get(normalize(s))||dynamic(normalize(s))||'';

  function replaceNode(node,source,target){if(!node.isConnected)return;node.nodeValue=node.nodeValue.replace(source,target);done.add(node);}

  function collectAttributes(root){
    root.querySelectorAll?.('[placeholder],[aria-label],[title]').forEach(el=>{
      attrs.forEach(name=>{
        const source=normalize(el.getAttribute(name));
        if(!source||!eligible(source)||protectedElement(el))return;
        const target=local(source)||cache.get(source);
        if(target){el.setAttribute(name,target);return;}
        pendingAttrs.set(el.dataset.translationKey||(el.dataset.translationKey=Math.random().toString(36).slice(2))+':'+name,{el,name,source});
      });
    });
  }

  function collect(){
    if(language()!=='ar')return;
    document.documentElement.lang='ar';document.documentElement.dir='rtl';
    const root=document.querySelector('.quiet-workspace,.pre-dafaa-shell,.landing-page,.join-page')||document.body;
    if(!root)return;
    collectAttributes(root);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const node=walker.currentNode;
      if(done.has(node))continue;
      const parent=node.parentElement,source=normalize(node.nodeValue);
      if(!parent||!source||!eligible(source)){done.add(node);continue;}
      if(protectedElement(parent)){done.add(node);continue;}
      const target=local(source)||cache.get(source);
      if(target){replaceNode(node,source,target);continue;}
      pendingNodes.add(node);
    }
    schedule();
  }

  function schedule(){if(!pendingNodes.size&&!pendingAttrs.size)return;clearTimeout(timer);timer=setTimeout(flush,70);}

  async function flush(){
    if(running||language()!=='ar')return;
    const nodes=[...pendingNodes].filter(n=>n.isConnected&&!done.has(n)).slice(0,50);nodes.forEach(n=>pendingNodes.delete(n));
    const keys=[...pendingAttrs.keys()].slice(0,25),attrItems=keys.map(k=>pendingAttrs.get(k)).filter(x=>x?.el?.isConnected);keys.forEach(k=>pendingAttrs.delete(k));
    const items=[...nodes.map(node=>({kind:'node',node,source:normalize(node.nodeValue)})),...attrItems.map(x=>({kind:'attr',...x}))];
    if(!items.length)return;
    const unique=[...new Set(items.map(x=>x.source))],unresolved=unique.filter(s=>!cache.has(s)&&!local(s));
    running=true;
    try{
      if(unresolved.length&&window.DafatiiApi?.request){
        const result=await window.DafatiiApi.request('/translate',{method:'POST',body:{texts:unresolved,source:'en',target:'ar'}});
        const values=Array.isArray(result?.translations)?result.translations:[];
        unresolved.forEach((s,i)=>{if(values[i])cache.set(s,decode(values[i]));});
      }
      items.forEach(item=>{
        const target=local(item.source)||cache.get(item.source);if(!target)return;
        if(item.kind==='node')replaceNode(item.node,item.source,target);else if(item.el.isConnected&&!protectedElement(item.el))item.el.setAttribute(item.name,target);
      });
    }catch(error){
      if(!['TRANSLATION_NOT_CONFIGURED','AUTHENTICATION_REQUIRED'].includes(error?.code))console.warn('Interface translation unavailable.',error?.code||error?.message);
    }finally{running=false;if(pendingNodes.size||pendingAttrs.size)schedule();}
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(collect));
  window.addEventListener('DOMContentLoaded',()=>{observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:attrs});collect();});
  window.addEventListener('hashchange',()=>requestAnimationFrame(collect));
  window.addEventListener('focus',()=>requestAnimationFrame(collect));
  window.DafatiiTranslate=Object.freeze({refresh:collect,dictionary:ar});
})();
