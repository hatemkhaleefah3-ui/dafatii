(() => {
  'use strict';

  const translated = new WeakSet();
  const pending = new Set();
  const cache = new Map();
  let timer = 0;
  let running = false;

  const phrases = new Map(Object.entries({
    'Dashboard':'لوحة التحكم','Overview':'نظرة عامة','Recent materials':'المواد الحديثة','Progress':'التقدم','Good afternoon':'مساء الخير','Good morning':'صباح الخير','Good evening':'مساء الخير','Student':'طالب','Your academic command center: what needs attention, what changed, and where to go next.':'مركزك الأكاديمي: ما يحتاج إلى اهتمام، وما الذي تغيّر، وإلى أين تتجه بعد ذلك.','Note':'ملاحظة','Assignment':'واجب','Log focus':'تسجيل وقت التركيز','Representer panel':'لوحة الممثل','Representer Panel':'لوحة الممثل','open assignments':'واجبات مفتوحة','focus this week':'تركيز هذا الأسبوع','weekly target':'الهدف الأسبوعي','degree average':'معدل الدرجات','unread chats':'محادثات غير مقروءة','No active room':'لا توجد غرفة نشطة','Next up':'التالي','See deadlines':'عرض المواعيد النهائية',
    'Schedule':'الجدول','Weekly schedule':'الجدول الأسبوعي','Lectures repeat every week.':'تتكرر المحاضرات كل أسبوع.','Calendar · Schedule':'التقويم · الجدول','Exams':'الامتحانات','Exam schedule':'جدول الامتحانات','Calendar · Exams':'التقويم · الامتحانات','Use the same timetable tools as your weekly schedule.':'استخدم أدوات الجدول نفسها الخاصة بجدولك الأسبوعي.','Time':'الوقت','Add':'إضافة','Edit':'تعديل','Delete':'حذف','Notes':'ملاحظات','Saved automatically':'يتم الحفظ تلقائيًا','Add notes…':'أضف ملاحظات…','Manual entry':'إدخال يدوي','Add weekly lecture':'إضافة محاضرة أسبوعية','Add exam':'إضافة امتحان','Add to weekly schedule':'إضافة إلى الجدول الأسبوعي','Add to exam schedule':'إضافة إلى جدول الامتحانات','Exam subject':'مادة الامتحان','Subject / lecture':'المادة / المحاضرة','Day / column':'اليوم / العمود','Time / row':'الوقت / الصف','Location / room':'الموقع / القاعة','Optional':'اختياري','Add from Excel file':'إضافة من ملف Excel','Import Day, Time, Subject and optional Location.':'استورد اليوم والوقت والمادة والموقع الاختياري.','Add manually':'إضافة يدويًا','Open the manual entry page.':'فتح صفحة الإدخال اليدوي.','Edit weekly schedule':'تعديل الجدول الأسبوعي','Schedule management':'إدارة الجدول','Add to schedule':'إضافة إلى الجدول','Replace current schedule':'استبدال الجدول الحالي','Remove current schedule':'إزالة الجدول الحالي','Add lectures manually or import a file.':'أضف المحاضرات يدويًا أو استورد ملفًا.','Upload an Excel or CSV file and replace all current entries.':'ارفع ملف Excel أو CSV لاستبدال جميع الإدخالات الحالية.','Delete all weekly schedule entries and notes.':'احذف جميع إدخالات الجدول الأسبوعي وملاحظاته.','Close':'إغلاق',
    'Sunday':'الأحد','Monday':'الاثنين','Tuesday':'الثلاثاء','Wednesday':'الأربعاء','Thursday':'الخميس','Friday':'الجمعة','Saturday':'السبت',
    'Course operations':'إدارة الدورة','Manage enrollment, access and delegated advantages for this course.':'إدارة التسجيل والوصول والصلاحيات المفوضة لهذه الدورة.','Refresh':'تحديث','Course access':'الوصول إلى الدورة','Name':'الاسم','Pricing':'التسعير','Free':'مجاني','Paid':'مدفوع','Price in minor units':'السعر بالوحدات الصغرى','Visibility':'الظهور','Public':'عام','Private by code':'خاص برمز','Join policy':'سياسة الانضمام','Direct join':'انضمام مباشر','Needs acceptance':'يتطلب الموافقة','New access code':'رمز وصول جديد','Leave blank to keep current':'اتركه فارغًا للاحتفاظ بالحالي','Save course access':'حفظ إعدادات الوصول','Enrollment code':'رمز التسجيل','Add a registered member':'إضافة عضو مسجل','Representer':'ممثل','Members and applications':'الأعضاء والطلبات','Loading members…':'جارٍ تحميل الأعضاء…','Recent audit trail':'سجل النشاط الأخير','No recent actions.':'لا توجد إجراءات حديثة.','Accept':'قبول','Reject':'رفض','Verify payment':'تأكيد الدفع','Make representer':'تعيين كممثل','Advantages':'الصلاحيات','Remove':'إزالة','Representer advantages':'صلاحيات الممثل','Save advantages':'حفظ الصلاحيات','Access denied':'تم رفض الوصول','Representer access is required for the active course.':'يلزم وصول الممثل للدورة النشطة.','Administrator access is required.':'يلزم وصول المسؤول.','Admin panel':'لوحة الإدارة','Admin Panel':'لوحة الإدارة','Platform operations':'إدارة المنصة','Full control over accounts, courses, enrollment and representers.':'تحكم كامل بالحسابات والدورات والتسجيل والممثلين.','Users':'المستخدمون','Active courses':'الدورات النشطة','Enrollments':'التسجيلات','Pending':'قيد الانتظار','All courses':'جميع الدورات','Create course':'إنشاء دورة','Open':'فتح','Archive':'أرشفة','Accounts':'الحسابات','Standard':'عادي','Admin':'مسؤول','Active':'نشط','Disabled':'معطل','Deleted':'محذوف','Save':'حفظ',
    'Library':'المكتبة','Messages':'الرسائل','Study rooms':'غرف الدراسة','Courses':'الدورات','Profile':'الملف الشخصي','Settings':'الإعدادات','Administration':'الإدارة','Course management':'إدارة الدورة','Apply for work':'التقديم للعمل','Scholarships':'المنح الدراسية','Volunteer':'التطوع','Support Dafatii':'دعم دفاتري','Workspace':'مساحة العمل','Account & preferences':'الحساب والتفضيلات','Appearance':'المظهر','Language':'اللغة','Light mode':'الوضع الفاتح','Dark mode':'الوضع الداكن','English':'الإنجليزية','Arabic':'العربية','Sign out':'تسجيل الخروج','Your account':'حسابك','Active course':'الدورة النشطة','Recent courses':'أحدث الدورات','See all courses':'عرض جميع الدورات','See full profile':'عرض الملف الشخصي كاملاً','Email':'البريد الإلكتروني','Study stage':'المرحلة الدراسية','Go back':'رجوع',
    'School':'المدرسة','University':'الجامعة','Independent':'مستقل','Subject':'المادة','Materials':'المواد','Assignments':'الواجبات','Degrees':'الدرجات','Focus':'التركيز','Today':'اليوم','This week':'هذا الأسبوع','Search':'بحث','Cancel':'إلغاء','Continue':'متابعة','Back':'رجوع','Done':'تم','Apply':'تطبيق','Confirm':'تأكيد','Edit profile':'تعديل الملف الشخصي','Change course':'تغيير الدورة','Loading…':'جارٍ التحميل…','No results':'لا توجد نتائج','No items yet.':'لا توجد عناصر بعد.','Required':'مطلوب'
  }));

  const words = Object.freeze({
    dashboard:'لوحة التحكم',overview:'نظرة عامة',recent:'الأخيرة',materials:'المواد',material:'مادة',progress:'التقدم',student:'طالب',students:'الطلاب',course:'الدورة',courses:'الدورات',schedule:'الجدول',calendar:'التقويم',exam:'امتحان',exams:'الامتحانات',weekly:'أسبوعي',lecture:'محاضرة',lectures:'محاضرات',subject:'المادة',subjects:'المواد',assignment:'واجب',assignments:'واجبات',note:'ملاحظة',notes:'ملاحظات',focus:'التركيز',degree:'الدرجة',degrees:'الدرجات',average:'المعدل',unread:'غير مقروءة',chats:'المحادثات',room:'القاعة',rooms:'الغرف',active:'نشط',open:'مفتوح',add:'إضافة',edit:'تعديل',delete:'حذف',remove:'إزالة',replace:'استبدال',current:'الحالي',save:'حفظ',saved:'محفوظ',automatically:'تلقائيًا',time:'الوقت',day:'اليوم',column:'العمود',row:'الصف',location:'الموقع',optional:'اختياري',manual:'يدوي',entry:'إدخال',file:'ملف',import:'استيراد',upload:'رفع',manage:'إدارة',management:'إدارة',member:'عضو',members:'الأعضاء',applications:'الطلبات',application:'طلب',access:'الوصول',pricing:'التسعير',price:'السعر',visibility:'الظهور',public:'عام',private:'خاص',code:'رمز',join:'الانضمام',policy:'السياسة',direct:'مباشر',accept:'قبول',reject:'رفض',refresh:'تحديث',admin:'مسؤول',administrator:'مسؤول',representer:'ممثل',representers:'الممثلون',account:'الحساب',accounts:'الحسابات',user:'مستخدم',users:'المستخدمون',settings:'الإعدادات',profile:'الملف الشخصي',library:'المكتبة',messages:'الرسائل',search:'بحث',cancel:'إلغاء',continue:'متابعة',back:'رجوع',close:'إغلاق',next:'التالي',previous:'السابق',new:'جديد',create:'إنشاء',loading:'جارٍ التحميل',required:'مطلوب',name:'الاسم',email:'البريد الإلكتروني',status:'الحالة',role:'الدور',permissions:'الصلاحيات',permission:'صلاحية',language:'اللغة',appearance:'المظهر',english:'الإنجليزية',arabic:'العربية',light:'فاتح',dark:'داكن',today:'اليوم',week:'الأسبوع',month:'الشهر',year:'السنة',school:'المدرسة',university:'الجامعة',independent:'مستقل'
  });

  const hardExcluded = 'script,style,code,pre,[contenteditable],.chat-message,.message-bubble,.advanced-message,.file-viewer,.subject-card-copy,.lecture-card,.course-card h2,.suite-note-card textarea,.suite-resource-card [data-user-content],.suite-material-card [data-user-content],[data-no-translate]';
  const eligible = text => /[A-Za-z]{2}/.test(text) && !/@|https?:\/\//i.test(text) && text.length <= 2000;
  const normalize = value => String(value || '').trim().replace(/\s+/g,' ');
  const decode = value => { const area=document.createElement('textarea'); area.innerHTML=value; return area.value; };

  function language(){
    return typeof interfaceLanguage === 'function' ? interfaceLanguage() : (document.documentElement.lang === 'ar' ? 'ar' : 'en');
  }

  function isUserData(node){
    const parent = node.parentElement;
    if(!parent) return true;
    if(parent.closest(hardExcluded)) return true;
    const row = parent.closest('.member-row,.admin-row');
    if(row && !parent.closest('button,label,option')) return true;
    if(parent.closest('.quiet-profile-summary strong,.quiet-course-list strong')) return true;
    return false;
  }

  function localTranslate(source){
    const text = normalize(source);
    if(!text) return text;
    if(phrases.has(text)) return phrases.get(text);
    const replaced = text.replace(/[A-Za-z]+(?:'[A-Za-z]+)?/g, token => words[token.toLowerCase()] || token);
    return replaced !== text ? replaced : '';
  }

  function translateAttributes(root){
    root.querySelectorAll?.('[placeholder],[aria-label],[title]').forEach(element => {
      ['placeholder','aria-label','title'].forEach(attribute => {
        const source = element.getAttribute(attribute);
        if(!source || !eligible(source)) return;
        const local = localTranslate(source);
        if(local) element.setAttribute(attribute, local);
      });
    });
  }

  function collect(){
    if(language() !== 'ar') return;
    const root = document.querySelector('.quiet-workspace,.pre-course-shell,.landing-page,.join-page') || document.body;
    if(!root) return;
    translateAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const node = walker.currentNode;
      const source = normalize(node.nodeValue);
      if(translated.has(node) || !eligible(source) || isUserData(node)) continue;
      if(cache.has(source)){
        node.nodeValue = node.nodeValue.replace(source, cache.get(source));
        translated.add(node);
        continue;
      }
      const local = localTranslate(source);
      if(local){
        cache.set(source, local);
        node.nodeValue = node.nodeValue.replace(source, local);
        translated.add(node);
      } else {
        pending.add(node);
      }
    }
    schedule();
  }

  function schedule(){
    clearTimeout(timer);
    timer = setTimeout(flush, 70);
  }

  async function flush(){
    if(running || language() !== 'ar' || !pending.size) return;
    running = true;
    const nodes = [...pending].filter(node => node.isConnected && !translated.has(node) && !isUserData(node)).slice(0, 50);
    nodes.forEach(node => pending.delete(node));
    const sources = nodes.map(node => normalize(node.nodeValue));
    try{
      const result = await window.DafatiiApi.request('/translate', {method:'POST', body:{texts:sources, source:'en', target:'ar'}});
      (result.translations || []).forEach((value,index) => {
        const target = decode(value);
        if(!target) return;
        cache.set(sources[index], target);
        if(nodes[index]?.isConnected){
          nodes[index].nodeValue = nodes[index].nodeValue.replace(sources[index], target);
          translated.add(nodes[index]);
        }
      });
    } catch(error){
      if(!['TRANSLATION_NOT_CONFIGURED','AUTHENTICATION_REQUIRED'].includes(error.code)) console.warn('Interface translation unavailable.', error.code || error.message);
      nodes.forEach(node => translated.add(node));
    } finally {
      running = false;
      if(pending.size) schedule();
    }
  }

  const observer = new MutationObserver(() => collect());
  window.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, {childList:true, subtree:true});
    collect();
  });
  window.addEventListener('hashchange', () => requestAnimationFrame(collect));
  window.DafatiiTranslate = Object.freeze({refresh:collect});
})();
