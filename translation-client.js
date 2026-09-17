(() => {
  'use strict';

  const done = new WeakSet();
  const pendingNodes = new Set();
  const pendingAttrs = new Map();
  const cache = new Map();
  let timer = 0;
  let running = false;

  const dictionary = new Map(Object.entries({
    'Dashboard':'لوحة التحكم','Overview':'نظرة عامة','Recent materials':'المواد الحديثة','Progress':'التقدم',
    'Library':'المكتبة','All subjects':'جميع المواد','My subjects':'موادي','Subjects':'المواد','Subject':'المادة','Notes':'ملاحظات','Resources':'المصادر','Assignments':'الواجبات','Open subject':'فتح المادة','Materials':'المواد',
    'Schedule':'الجدول','Weekly schedule':'الجدول الأسبوعي','Calendar':'التقويم','Exams':'الامتحانات','Deadlines':'المواعيد النهائية','Exam schedule':'جدول الامتحانات','Time':'الوقت','Edit':'تعديل','Add':'إضافة','Delete':'حذف','Remove':'إزالة','Save':'حفظ','Cancel':'إلغاء','Done':'تم','Close':'إغلاق','Back':'رجوع','Go back':'رجوع',
    'Good morning':'صباح الخير','Good afternoon':'مساء الخير','Good evening':'مساء الخير','Student':'طالب','Your academic command center: what needs attention, what changed, and where to go next.':'مركزك الأكاديمي: ما يحتاج إلى اهتمام، وما الذي تغيّر، وإلى أين تتجه بعد ذلك.','Note':'ملاحظة','Assignment':'واجب','Log focus':'تسجيل وقت التركيز',
    'open assignments':'واجبات مفتوحة','focus this week':'التركيز هذا الأسبوع','degree average':'معدل الدرجات','unread chats':'محادثات غير مقروءة','No active room':'لا توجد غرفة نشطة','Nothing urgent':'لا شيء عاجل','Next up':'التالي','Priority queue':'قائمة الأولويات','See deadlines':'عرض المواعيد النهائية','Recently touched':'المواد المستخدمة مؤخرًا','View all':'عرض الكل','This week':'هذا الأسبوع','Weekly focus goal':'هدف التركيز الأسبوعي','Study flow':'مسار الدراسة','Jump back in':'العودة للدراسة','Study rooms':'غرف الدراسة','Chat':'المحادثة','Continue room':'متابعة الغرفة','Find accountability':'اعثر على شريك للالتزام','Talk to classmates':'تحدث مع زملائك',
    'No recent materials':'لا توجد مواد حديثة','Create a note, resource, or lecture to populate this feed.':'أنشئ ملاحظة أو مصدرًا أو محاضرة لعرضها هنا.','No recent actions.':'لا توجد إجراءات حديثة.','No items yet.':'لا توجد عناصر بعد.','No results':'لا توجد نتائج',
    'Recent materials':'المواد الحديثة','All materials':'جميع المواد','Recent':'الأحدث','Search':'بحث','Filter':'تصفية','Today':'اليوم','Tomorrow':'غدًا','Upcoming':'القادمة','Completed':'المكتملة','Overdue':'متأخرة','General':'عام','General / none':'عام / بدون',
    'Lectures repeat every week.':'تتكرر المحاضرات كل أسبوع.','Use the same timetable tools as your weekly schedule.':'استخدم أدوات الجدول نفسها الخاصة بجدولك الأسبوعي.','Saved automatically':'يتم الحفظ تلقائيًا','Add notes…':'أضف ملاحظات…','Manual entry':'إدخال يدوي','Add weekly lecture':'إضافة محاضرة أسبوعية','Add exam':'إضافة امتحان','Add to weekly schedule':'إضافة إلى الجدول الأسبوعي','Add to exam schedule':'إضافة إلى جدول الامتحانات','Exam subject':'مادة الامتحان','Subject / lecture':'المادة / المحاضرة','Day / column':'اليوم / العمود','Time / row':'الوقت / الصف','Location / room':'الموقع / القاعة','Optional':'اختياري','Add from Excel file':'إضافة من ملف Excel','Import Day, Time, Subject and optional Location.':'استورد اليوم والوقت والمادة والموقع الاختياري.','Add manually':'إضافة يدويًا','Open the manual entry page.':'فتح صفحة الإدخال اليدوي.','Edit weekly schedule':'تعديل الجدول الأسبوعي','Schedule management':'إدارة الجدول','Add to schedule':'إضافة إلى الجدول','Replace current schedule':'استبدال الجدول الحالي','Remove current schedule':'إزالة الجدول الحالي','Add lectures manually or import a file.':'أضف المحاضرات يدويًا أو استورد ملفًا.','Upload an Excel or CSV file and replace all current entries.':'ارفع ملف Excel أو CSV لاستبدال جميع الإدخالات الحالية.','Delete all weekly schedule entries and notes.':'احذف جميع إدخالات الجدول الأسبوعي وملاحظاته.',
    'Sunday':'الأحد','Monday':'الاثنين','Tuesday':'الثلاثاء','Wednesday':'الأربعاء','Thursday':'الخميس','Friday':'الجمعة','Saturday':'السبت',
    'Programming':'البرمجة','Data Structures':'هياكل البيانات','Algorithms':'الخوارزميات','Databases':'قواعد البيانات','Mathematics':'الرياضيات','Anatomy':'التشريح','Physiology':'علم وظائف الأعضاء','Biochemistry':'الكيمياء الحيوية','Pharmacology':'علم الأدوية','Pathology':'علم الأمراض','Calculus':'التفاضل والتكامل','Physics':'الفيزياء','Mechanics':'الميكانيكا','Circuits':'الدوائر','Design':'التصميم','Accounting':'المحاسبة','Economics':'الاقتصاد','Marketing':'التسويق','Finance':'المالية','Management':'الإدارة','Chemistry':'الكيمياء','Biology':'الأحياء','English':'الإنجليزية',
    'Representer panel':'لوحة الممثل','Representer Panel':'لوحة الممثل','Dafaa management':'إدارة الدفعة','Dafaa operations':'إدارة الدفعة','Manage enrollment, access and delegated advantages for this dafaa.':'إدارة التسجيل والوصول والصلاحيات المفوضة لهذه الدفعة.','Refresh':'تحديث','Dafaa access':'الوصول إلى الدفعة','Name':'الاسم','Pricing':'التسعير','Free':'مجاني','Paid':'مدفوع','Price in minor units':'السعر بالوحدات الصغرى','Visibility':'الظهور','Public':'عام','Private by code':'خاص برمز','Join policy':'سياسة الانضمام','Direct join':'انضمام مباشر','Needs acceptance':'يتطلب الموافقة','New access code':'رمز وصول جديد','Leave blank to keep current':'اتركه فارغًا للاحتفاظ بالحالي','Save dafaa access':'حفظ إعدادات الوصول','Enrollment code':'رمز التسجيل','Add a registered member':'إضافة عضو مسجل','Representer':'ممثل','Members and applications':'الأعضاء والطلبات','Loading members…':'جارٍ تحميل الأعضاء…','Recent audit trail':'سجل النشاط الأخير','Accept':'قبول','Reject':'رفض','Verify payment':'تأكيد الدفع','Make representer':'تعيين كممثل','Advantages':'الصلاحيات','Representer advantages':'صلاحيات الممثل','Save advantages':'حفظ الصلاحيات',
    'Admin panel':'لوحة الإدارة','Admin Panel':'لوحة الإدارة','Administration':'الإدارة','Platform operations':'إدارة المنصة','Full control over accounts, dafat, enrollment and representers.':'تحكم كامل بالحسابات والدفعات والتسجيل والممثلين.','Users':'المستخدمون','Active dafat':'الدفعات النشطة','Enrollments':'التسجيلات','Pending':'قيد الانتظار','All dafat':'جميع الدفعات','Create a Dafaa':'إنشاء دفعة','Open':'فتح','Archive':'أرشفة','Accounts':'الحسابات','Standard':'عادي','Admin':'مسؤول','Active':'نشط','Disabled':'معطل','Deleted':'محذوف','Access denied':'تم رفض الوصول',
    'Messages':'الرسائل','Dafat':'الدفعات','Profile':'الملف الشخصي','Settings':'الإعدادات','Apply for work':'التقديم للعمل','Scholarships':'المنح الدراسية','Volunteer':'التطوع','Support Dafatii':'دعم دفاتري','Workspace':'مساحة العمل','Account & preferences':'الحساب والتفضيلات','Appearance':'المظهر','Language':'اللغة','Light mode':'الوضع الفاتح','Dark mode':'الوضع الداكن','Arabic':'العربية','Sign out':'تسجيل الخروج','Your account':'حسابك','Active dafaa':'الدفعة النشطة','Recent dafat':'أحدث الدفعات','See all dafat':'عرض جميع الدفعات','See full profile':'عرض الملف الشخصي كاملاً','Email':'البريد الإلكتروني','Study stage':'المرحلة الدراسية','School':'المدرسة','University':'الجامعة','Independent':'مستقل','Focus':'التركيز','Degrees':'الدرجات','Apply':'تقديم','Confirm':'تأكيد','Continue':'متابعة','Edit profile':'تعديل الملف الشخصي','Change dafaa':'تغيير الدفعة','Loading…':'جارٍ التحميل…','Required':'مطلوب',
    'Home':'الرئيسية','About':'حول','Features':'المزايا','Contact':'تواصل معنا','Start studying':'ابدأ الدراسة','Explore features':'استكشف المزايا','Your study life in one place':'حياتك الدراسية في مكان واحد','Study less. Learn more.':'ادرس بذكاء أكثر. تعلّم أكثر.','One space for every dafaa':'مساحة واحدة لكل دفعة','Built for focus, not clutter':'مصمم للتركيز بلا فوضى'
  }));

  const userContentSelector = [
    'script','style','code','pre','[contenteditable]','.file-viewer',
    '.chat-message','.message-bubble','.advanced-message',
    '.subject-card-copy','.lecture-card','.suite-note-card','.suite-resource-card','.suite-material-card',
    '.member-who','.admin-row>div','.quiet-profile-summary strong','.quiet-dafaa-list strong',
    '.dafaa-card h2','.dafaa-card p','[data-user-content]','[data-no-translate]'
  ].join(',');

  const attrNames = ['placeholder','aria-label','title'];
  const normalize = value => String(value ?? '').trim().replace(/\s+/g,' ');
  const eligible = value => /[A-Za-z]{2}/.test(value) && !/@|https?:\/\//i.test(value) && value.length <= 2000;
  const language = () => typeof interfaceLanguage === 'function' ? interfaceLanguage() : (document.documentElement.lang === 'ar' ? 'ar' : 'en');
  const decode = value => { const area=document.createElement('textarea'); area.innerHTML=String(value ?? ''); return area.value; };

  function local(source){ return dictionary.get(normalize(source)) || ''; }
  function isUserContent(element){ return Boolean(element?.closest?.(userContentSelector)); }

  function replaceNode(node, source, target){
    if(!node.isConnected) return;
    node.nodeValue = node.nodeValue.replace(source,target);
    done.add(node);
  }

  function collectAttributes(root){
    root.querySelectorAll?.('[placeholder],[aria-label],[title]').forEach(element => {
      attrNames.forEach(name => {
        const source=normalize(element.getAttribute(name));
        if(!source||!eligible(source))return;
        const translated=local(source)||cache.get(source);
        if(translated){element.setAttribute(name,translated);return;}
        if(isUserContent(element))return;
        pendingAttrs.set(`${name}:${source}:${pendingAttrs.size}`,{element,name,source});
      });
    });
  }

  function collect(){
    if(language()!=='ar')return;
    const root=document.querySelector('.quiet-workspace,.pre-dafaa-shell,.landing-page,.join-page')||document.body;
    if(!root)return;
    document.documentElement.lang='ar';
    document.documentElement.dir='rtl';
    collectAttributes(root);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const node=walker.currentNode;
      if(done.has(node))continue;
      const source=normalize(node.nodeValue),parent=node.parentElement;
      if(!parent||!source||!eligible(source)){done.add(node);continue;}
      const translated=local(source)||cache.get(source);
      if(translated){replaceNode(node,source,translated);continue;}
      if(isUserContent(parent)){done.add(node);continue;}
      pendingNodes.add(node);
    }
    schedule();
  }

  function schedule(){
    if(!pendingNodes.size&&!pendingAttrs.size)return;
    clearTimeout(timer);
    timer=setTimeout(flush,60);
  }

  async function flush(){
    if(running||language()!=='ar')return;
    const nodes=[...pendingNodes].filter(node=>node.isConnected&&!done.has(node)).slice(0,60);
    nodes.forEach(node=>pendingNodes.delete(node));
    const attrs=[...pendingAttrs.values()].filter(item=>item.element.isConnected).slice(0,30);
    const attrKeys=[...pendingAttrs.keys()].slice(0,30);
    attrKeys.forEach(key=>pendingAttrs.delete(key));
    const items=[...nodes.map(node=>({kind:'node',node,source:normalize(node.nodeValue)})),...attrs.map(item=>({kind:'attr',...item}))];
    if(!items.length)return;
    const unique=[...new Set(items.map(item=>item.source))];
    const unresolved=unique.filter(source=>!cache.has(source));
    running=true;
    try{
      if(unresolved.length){
        const result=await window.DafatiiApi.request('/translate',{method:'POST',body:{texts:unresolved,source:'en',target:'ar'}});
        const values=Array.isArray(result?.translations)?result.translations:[];
        unresolved.forEach((source,index)=>{if(values[index])cache.set(source,decode(values[index]));});
      }
      items.forEach(item=>{
        const target=cache.get(item.source)||local(item.source);
        if(!target)return;
        if(item.kind==='node')replaceNode(item.node,item.source,target);
        else if(item.element.isConnected)item.element.setAttribute(item.name,target);
      });
    }catch(error){
      if(!['TRANSLATION_NOT_CONFIGURED','AUTHENTICATION_REQUIRED'].includes(error?.code))console.warn('Interface translation unavailable.',error?.code||error?.message);
      // Do not mark unknown UI as translated: a later refresh may succeed after auth/config becomes available.
    }finally{
      running=false;
      if(pendingNodes.size||pendingAttrs.size)schedule();
    }
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(collect));
  window.addEventListener('DOMContentLoaded',()=>{
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:attrNames});
    collect();
  });
  window.addEventListener('hashchange',()=>requestAnimationFrame(collect));
  window.addEventListener('focus',()=>requestAnimationFrame(collect));
  window.DafatiiTranslate=Object.freeze({refresh:collect,dictionary});
})();
