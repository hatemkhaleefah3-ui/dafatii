(() => {
  'use strict';

  const PROFILE_KEY = 'dafatii:studentProfile:v2';
  const ONBOARDING_KEY = 'dafatii:onboarding:v1';
  const INITIAL_PIN_KEY = 'dafatii:studentInitialPin:v1';
  const allowedAvatarTypes = new Set(['image/jpeg','image/png','image/webp']);
  let signupStep = 1;
  let signupDraft = {};
  let scheduled = false;

  const copy = {
    en: {
      step:'Step', previous:'Previous', next:'Next', create:'Create account', fullName:'Full name', birthDate:'Birth date', country:'Country', city:'City', town:'Town',
      level:'Academic level', stage:'Stage', field:'Field', schoolName:'School name', institutionName:'Institution name', universityName:'University name', collegeName:'College name',
      gender:'Gender', male:'Male', female:'Female', notSay:'Prefer not to say', email:'Email', phone:'Phone number (optional)', phoneHint:'Use a country code for phone sign-in, for example +964…',
      password:'Password', repeatPassword:'Repeat password', passwordHint:'Use at least 12 characters. A longer passphrase or a mix of letters, numbers, and symbols is recommended.',
      weak:'Weak', medium:'Medium', strong:'Strong', mismatch:'Passwords do not match.', weakPassword:'Choose a medium or strong password before continuing.',
      identifier:'Email, phone number or student ID', credential:'Password or 4-digit PIN', signIn:'Sign in', signing:'Signing in…', creating:'Creating account…',
      loginHint:'Phone sign-in should include the country code. A 12-digit number without + is treated as a student ID.',
      primary:'Primary School', middle:'Middle School', preparatory:'Preparatory School', institute:'Institute', college:'College', primaryStudies:'Primary studies (undergraduate)', postgraduate:'Postgraduate studies',
      first:'First stage', second:'Second stage', third:'Third stage', fourth:'Fourth stage', fifth:'Fifth stage', sixth:'Sixth stage',
      scientific:'Scientific', literary:'Literary', medical:'Medical', technical:'Technical', mechanical:'Mechanical', electrical:'Electrical', chemical:'Chemical', petroleum:'Petroleum', engineering:'Engineering', sciences:'Sciences', education:'Education',
      profile:'Student profile', identity:'Academic identity', contact:'Contact', studentCard:'Student card', cardHint:'Tap the card to flip it.', accessId:'Student access ID', pin:'PIN', reveal:'Reveal ID', hide:'Hide ID', secret:'Secret credential',
      oneTime:'Save your sign-in credentials', oneTimeText:'Your PIN is shown only for this signup session. Store it somewhere private before hiding it.', saved:'I saved them',
      changePhoto:'Change profile picture', uploading:'Uploading photo…', photoError:'Could not update the profile picture.', noId:'Student ID is available for accounts created with the new signup flow.',
      born:'Birth date', location:'Location', academicField:'Academic field', organization:'School / institution', phoneLabel:'Phone', emailLabel:'Email', iraq:'Iraq', selectCity:'Select city', townHint:'Choose a suggested town or type any town name.', townToggle:'Show town suggestions'
    },
    ar: {
      step:'الخطوة', previous:'السابق', next:'التالي', create:'إنشاء الحساب', fullName:'الاسم الكامل', birthDate:'تاريخ الميلاد', country:'الدولة', city:'المدينة', town:'البلدة / المنطقة',
      level:'المستوى الدراسي', stage:'المرحلة', field:'الفرع', schoolName:'اسم المدرسة', institutionName:'اسم المعهد / المؤسسة', universityName:'اسم الجامعة', collegeName:'اسم الكلية',
      gender:'الجنس', male:'ذكر', female:'أنثى', notSay:'أفضل عدم الإجابة', email:'البريد الإلكتروني', phone:'رقم الهاتف (اختياري)', phoneHint:'استخدم رمز الدولة لتسجيل الدخول بالهاتف، مثال +964…',
      password:'كلمة المرور', repeatPassword:'أعد كتابة كلمة المرور', passwordHint:'استخدم 12 محرفاً على الأقل. يفضّل عبارة مرور أطول أو مزيجاً من الحروف والأرقام والرموز.',
      weak:'ضعيفة', medium:'متوسطة', strong:'قوية', mismatch:'كلمتا المرور غير متطابقتين.', weakPassword:'اختر كلمة مرور متوسطة أو قوية قبل المتابعة.',
      identifier:'البريد أو الهاتف أو رقم الطالب', credential:'كلمة المرور أو PIN من 4 أرقام', signIn:'تسجيل الدخول', signing:'جارٍ تسجيل الدخول…', creating:'جارٍ إنشاء الحساب…',
      loginHint:'لتسجيل الدخول بالهاتف استخدم رمز الدولة. الرقم المكوّن من 12 رقماً بدون + يُعامل كرقم طالب.',
      primary:'المدرسة الابتدائية', middle:'المدرسة المتوسطة', preparatory:'المدرسة الإعدادية', institute:'المعهد', college:'الكلية', primaryStudies:'الدراسات الأولية', postgraduate:'الدراسات العليا',
      first:'المرحلة الأولى', second:'المرحلة الثانية', third:'المرحلة الثالثة', fourth:'المرحلة الرابعة', fifth:'المرحلة الخامسة', sixth:'المرحلة السادسة',
      scientific:'علمي', literary:'أدبي', medical:'طبي', technical:'تقني', mechanical:'ميكانيكي', electrical:'كهربائي', chemical:'كيميائي', petroleum:'نفطي', engineering:'هندسي', sciences:'علوم', education:'تربية',
      profile:'الملف الشخصي للطالب', identity:'الهوية الأكاديمية', contact:'التواصل', studentCard:'بطاقة الطالب', cardHint:'اضغط على البطاقة لقلبها.', accessId:'رقم دخول الطالب', pin:'PIN', reveal:'إظهار الرقم', hide:'إخفاء الرقم', secret:'بيانات سرية',
      oneTime:'احفظ بيانات تسجيل الدخول', oneTimeText:'يظهر رمز PIN في جلسة إنشاء الحساب هذه فقط. احفظه في مكان خاص قبل إخفائه.', saved:'تم الحفظ',
      changePhoto:'تغيير الصورة الشخصية', uploading:'جارٍ رفع الصورة…', photoError:'تعذر تحديث الصورة الشخصية.', noId:'رقم الطالب متاح للحسابات المنشأة بنظام التسجيل الجديد.',
      born:'تاريخ الميلاد', location:'الموقع', academicField:'الفرع الدراسي', organization:'المدرسة / المؤسسة', phoneLabel:'الهاتف', emailLabel:'البريد الإلكتروني', iraq:'العراق', selectCity:'اختر المدينة', townHint:'اختر بلدة مقترحة أو اكتب اسم أي بلدة.', townToggle:'عرض اقتراحات البلدات'
    }
  };

  const IRAQ_LOCATIONS = Object.freeze([
    { value:'Baghdad', ar:'بغداد', towns:['Baghdad','Karrada','Kadhimiya','Adhamiya','Mansour','Sadr City','Dora','Abu Ghraib','Taji','Mahmudiya','Madain'] },
    { value:'Basra', ar:'البصرة', towns:['Basra','Abu Al-Khasib','Al-Zubair','Shatt Al-Arab','Qurna','Al-Madina','Al-Faw'] },
    { value:'Nineveh', ar:'نينوى', towns:['Mosul','Tal Afar','Hamdaniya','Qaraqosh','Sinjar','Bartella','Bashiqa'] },
    { value:'Erbil', ar:'أربيل', towns:['Erbil','Ankawa','Shaqlawa','Soran','Koya','Mergasor','Choman'] },
    { value:'Najaf', ar:'النجف', towns:['Najaf','Kufa','Manathira','Mishkhab','Haydariya','Abbasiya'] },
    { value:'Karbala', ar:'كربلاء', towns:['Karbala','Hindiyah','Ain al-Tamr','Al-Hur','Husayniyah'] },
    { value:'Kirkuk', ar:'كركوك', towns:['Kirkuk','Hawija','Daquq','Dibis','Altun Kupri','Taza'] },
    { value:'Sulaymaniyah', ar:'السليمانية', towns:['Sulaymaniyah','Chamchamal','Ranya','Kalar','Penjwin','Dukan','Darbandikhan'] },
    { value:'Duhok', ar:'دهوك', towns:['Duhok','Zakho','Amedi','Akre','Semel','Bardarash'] },
    { value:'Anbar', ar:'الأنبار', towns:['Ramadi','Fallujah','Hit','Haditha','Rutba','Al-Qaim','Khalidiyah','Habbaniyah'] },
    { value:'Babil', ar:'بابل', towns:['Hillah','Musayyib','Mahawil','Hashimiyah','Al-Qasim','Iskandariya'] },
    { value:'Diyala', ar:'ديالى', towns:['Baqubah','Khanaqin','Muqdadiyah','Khalis','Balad Ruz','Mandali'] },
    { value:'Dhi Qar', ar:'ذي قار', towns:['Nasiriyah','Shatra','Suq al-Shuyukh','Rifai','Qalat Sukkar','Chibayish'] },
    { value:'Maysan', ar:'ميسان', towns:['Amarah','Ali al-Sharqi','Ali al-Gharbi','Majar al-Kabir','Qalat Saleh','Kumait'] },
    { value:'Muthanna', ar:'المثنى', towns:['Samawah','Rumaitha','Khidr','Salman','Warka'] },
    { value:'Al-Qadisiyah', ar:'القادسية', towns:['Diwaniyah','Afak','Shamiya','Hamza','Ghammas','Shinafiya'] },
    { value:'Salah al-Din', ar:'صلاح الدين', towns:['Tikrit','Samarra','Balad','Baiji','Dujail','Shirqat','Dhuluiya'] },
    { value:'Wasit', ar:'واسط', towns:['Kut','Al-Hay','Suwaira','Numaniyah','Badra','Aziziya','Zurbatiyah'] }
  ]);
  const iraqLocation = city => IRAQ_LOCATIONS.find(item => item.value === city) || null;
  const cityLabel = item => language() === 'ar' ? item.ar : item.value;

  const levels = Object.freeze({
    primary_school: { label:'primary', stages:['sixth'], fields:null, org:'school' },
    middle_school: { label:'middle', stages:['third'], fields:null, org:'school' },
    preparatory_school: { label:'preparatory', stages:['sixth'], fields:['scientific','literary'], org:'school' },
    institute: { label:'institute', stages:['first','second'], fields:['medical','technical','mechanical','electrical','chemical','petroleum'], org:'institution' },
    college: { label:'college', stages:['first','second','third','fourth','fifth','sixth'], fields:['medical','engineering','sciences','education'], org:'college' },
    primary_studies: { label:'primaryStudies', stages:['primary_studies'], fields:null, org:'institution' },
    postgraduate_studies: { label:'postgraduate', stages:['postgraduate_studies'], fields:null, org:'institution' }
  });

  const language = () => document.documentElement.lang === 'ar' ? 'ar' : 'en';
  const t = key => copy[language()][key] || copy.en[key] || key;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const route = () => location.hash.replace(/^#\/?/, '') || 'landing';
  const readProfile = () => window.DafatiiData?.readJSON?.(PROFILE_KEY, null) || (() => { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); } catch { return null; } })();
  const writeProfile = value => window.DafatiiData?.writeJSON?.(PROFILE_KEY, value) ?? localStorage.setItem(PROFILE_KEY, JSON.stringify(value));
  const removeProfile = () => window.DafatiiData?.remove?.(PROFILE_KEY) ?? localStorage.removeItem(PROFILE_KEY);

  function randomDigits(length, firstNonZero = false) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    let value = '';
    for (let index = 0; index < length; index += 1) value += String(index === 0 && firstNonZero ? (bytes[index] % 9) + 1 : bytes[index] % 10);
    return value;
  }
  const passwordRating = password => {
    const value = String(password || '');
    const classes = [/[a-z]/,/[A-Z]/,/\d/,/[^A-Za-z0-9\s]/].reduce((sum, pattern) => sum + Number(pattern.test(value)), 0);
    const medium = value.length >= 12 && (classes >= 3 || (value.length >= 16 && classes >= 2) || value.length >= 20);
    if (!medium) return { level:'weak', label:t('weak') };
    const strong = (value.length >= 16 && classes >= 3) || (value.length >= 14 && classes === 4) || value.length >= 24;
    return { level:strong ? 'strong' : 'medium', label:t(strong ? 'strong' : 'medium') };
  };

  function field(name, label, input) { return `<div class="field student-flow-field"><label>${esc(label)}</label>${input.replace('<input ', `<input name="${name}" `).replace('<select ', `<select name="${name}" `)}</div>`; }
  const option = (value, label, selected = false) => `<option value="${esc(value)}"${selected ? ' selected' : ''}>${esc(label)}</option>`;
  const valueOf = (name, fallback = '') => signupDraft[name] ?? fallback;
  function townOptions(city, query = '') {
    const location = iraqLocation(city);
    const needle = String(query || '').trim().toLowerCase();
    const towns = location ? location.towns : [];
    const filtered = needle ? towns.filter(name => name.toLowerCase().includes(needle)) : towns;
    return filtered.map(name => `<button type="button" role="option" data-town-value="${esc(name)}">${esc(name)}</button>`).join('');
  }
  function locationStep() {
    const selectedCity = valueOf('city');
    const cityOptions = IRAQ_LOCATIONS.map(item => option(item.value, cityLabel(item), item.value === selectedCity)).join('');
    return `${progress()}<div class="student-flow-step">
      ${field('country', t('country'), `<select autocomplete="country-name" required>${option('Iraq', t('iraq'), true)}</select>`)}
      ${field('city', t('city'), `<select autocomplete="address-level1" required>${option('', t('selectCity'), !selectedCity)}${cityOptions}</select>`)}
      <div class="field student-flow-field"><label>${esc(t('town'))}</label>
        <div class="student-flow-combobox" data-town-combobox>
          <input name="town" autocomplete="address-level2" maxlength="120" value="${esc(valueOf('town'))}" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="student-town-options" required>
          <button type="button" class="student-flow-combobox-toggle" data-town-toggle aria-label="${esc(t('townToggle'))}" aria-expanded="false">⌄</button>
          <div class="student-flow-combobox-menu" id="student-town-options" data-town-menu role="listbox" hidden>${townOptions(selectedCity, valueOf('town'))}</div>
        </div>
        <p class="student-flow-hint">${esc(t('townHint'))}</p>
      </div>
    </div>`;
  }

  function progress() {
    return `<div class="student-flow-progress" aria-label="${esc(t('step'))} ${signupStep} / 5"><div>${[1,2,3,4,5].map(step => `<span class="${step === signupStep ? 'active' : step < signupStep ? 'done' : ''}"></span>`).join('')}</div><strong>${esc(t('step'))} ${signupStep} / 5</strong></div>`;
  }

  function dependentAcademic(levelKey) {
    const rule = levels[levelKey] || levels.primary_school;
    const stageValue = rule.stages.includes(valueOf('academicStage')) ? valueOf('academicStage') : rule.stages[0];
    let html = field('academicStage', t('stage'), `<select required>${rule.stages.map(key => option(key, key === 'primary_studies' ? t('primaryStudies') : key === 'postgraduate_studies' ? t('postgraduate') : t(key), key === stageValue)).join('')}</select>`);
    if (rule.fields) {
      const selectedField = rule.fields.includes(valueOf('academicField')) ? valueOf('academicField') : rule.fields[0];
      html += field('academicField', t('field'), `<select required>${rule.fields.map(key => option(key, t(key), key === selectedField)).join('')}</select>`);
    }
    if (rule.org === 'college') {
      html += field('universityName', t('universityName'), `<input autocomplete="organization" maxlength="160" value="${esc(valueOf('universityName'))}" required>`);
      html += field('collegeName', t('collegeName'), `<input maxlength="160" value="${esc(valueOf('collegeName'))}" required>`);
    } else {
      const label = rule.org === 'school' ? t('schoolName') : t('institutionName');
      html += field('institutionName', label, `<input autocomplete="organization" maxlength="160" value="${esc(valueOf('institutionName'))}" required>`);
    }
    return html;
  }

  function signupBody() {
    if (signupStep === 1) return `${progress()}<div class="student-flow-step">${field('displayName', t('fullName'), `<input autocomplete="name" maxlength="100" value="${esc(valueOf('displayName'))}" required>`)}${field('birthDate', t('birthDate'), `<input type="date" autocomplete="bday" value="${esc(valueOf('birthDate'))}" required>`)}</div>`;
    if (signupStep === 2) return locationStep();
    if (signupStep === 3) {
      const levelValue = levels[valueOf('academicLevel')] ? valueOf('academicLevel') : 'primary_school';
      return `${progress()}<div class="student-flow-step">${field('academicLevel', t('level'), `<select required>${Object.entries(levels).map(([key,rule]) => option(key, t(rule.label), key === levelValue)).join('')}</select>`)}<div class="academic-dependent">${dependentAcademic(levelValue)}</div></div>`;
    }
    if (signupStep === 4) return `${progress()}<div class="student-flow-step">${field('gender', t('gender'), `<select required>${option('male',t('male'),valueOf('gender','male')==='male')}${option('female',t('female'),valueOf('gender')==='female')}${option('prefer_not_to_say',t('notSay'),valueOf('gender')==='prefer_not_to_say')}</select>`)}${field('email', t('email'), `<input type="email" autocomplete="email" maxlength="254" value="${esc(valueOf('email'))}" required>`)}${field('phone', t('phone'), `<input type="tel" autocomplete="tel" maxlength="32" value="${esc(valueOf('phone'))}" placeholder="+964…">`)}<p class="student-flow-hint">${esc(t('phoneHint'))}</p></div>`;
    return `${progress()}<div class="student-flow-step">${field('password', t('password'), `<input type="password" autocomplete="new-password" minlength="12" maxlength="256" required>`)}${field('passwordConfirm', t('repeatPassword'), `<input type="password" autocomplete="new-password" minlength="12" maxlength="256" required>`)}<div class="password-strength" data-password-strength="weak"><span></span><span></span><span></span><strong>${esc(t('weak'))}</strong></div><p class="student-flow-hint">${esc(t('passwordHint'))}</p></div>`;
  }

  function actions() {
    return `<div class="student-flow-actions">${signupStep > 1 ? `<button type="button" class="btn btn-ghost" data-student-previous>← ${esc(t('previous'))}</button>` : '<span></span>'}<button class="btn btn-primary auth-submit" type="submit">${esc(signupStep === 5 ? t('create') : t('next'))} ${signupStep === 5 ? '' : '→'}</button></div>`;
  }

  function capture(form) {
    const values = new FormData(form);
    for (const [key,value] of values.entries()) {
      if (key === 'password' || key === 'passwordConfirm') continue;
      signupDraft[key] = String(value);
    }
    if (signupStep === 3) {
      const level = signupDraft.academicLevel;
      const rule = levels[level];
      if (!rule?.fields) signupDraft.academicField = '';
      if (rule?.org === 'college') signupDraft.institutionName = '';
      else { signupDraft.universityName = ''; signupDraft.collegeName = ''; }
    }
  }

  function bindLocationStep(form) {
    const country = form.elements.country;
    const city = form.elements.city;
    const town = form.elements.town;
    const combo = form.querySelector('[data-town-combobox]');
    const menu = form.querySelector('[data-town-menu]');
    const toggle = form.querySelector('[data-town-toggle]');
    if (country) country.value = 'Iraq';
    if (!city || !town || !combo || !menu || !toggle) return;
    const closeMenu = () => {
      menu.hidden = true;
      town.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-expanded','false');
    };
    const renderTownMenu = (open = true) => {
      menu.innerHTML = townOptions(city.value, town.value);
      const hasOptions = Boolean(menu.children.length);
      menu.hidden = !open || !hasOptions;
      const expanded = open && hasOptions;
      town.setAttribute('aria-expanded', String(expanded));
      toggle.setAttribute('aria-expanded', String(expanded));
    };
    city.addEventListener('change', () => {
      signupDraft.city = city.value;
      signupDraft.town = '';
      town.value = '';
      renderTownMenu(false);
    });
    town.addEventListener('input', () => renderTownMenu(true));
    town.addEventListener('focus', () => renderTownMenu(true));
    toggle.addEventListener('mousedown', event => event.preventDefault());
    toggle.addEventListener('click', () => {
      if (!city.value) { city.focus(); return; }
      if (menu.hidden) renderTownMenu(true);
      else closeMenu();
    });
    menu.addEventListener('mousedown', event => event.preventDefault());
    menu.addEventListener('click', event => {
      const item = event.target.closest('[data-town-value]');
      if (!item) return;
      town.value = item.dataset.townValue || '';
      signupDraft.town = town.value;
      closeMenu();
      town.focus();
    });
    town.addEventListener('blur', () => setTimeout(closeMenu, 120));
  }

  function renderSignup(form) {
    form.dataset.studentFlowBound = 'signup';
    form.innerHTML = `${signupBody()}${actions()}`;
    if (signupStep === 2) bindLocationStep(form);
    const level = form.elements.academicLevel;
    if (level) level.onchange = () => {
      signupDraft.academicLevel = level.value;
      signupDraft.academicStage = '';
      signupDraft.academicField = '';
      signupDraft.institutionName = '';
      signupDraft.universityName = '';
      signupDraft.collegeName = '';
      form.querySelector('.academic-dependent').innerHTML = dependentAcademic(level.value);
    };
    form.querySelector('[data-student-previous]')?.addEventListener('click', () => { capture(form); signupStep = Math.max(1, signupStep - 1); renderSignup(form); });
    const password = form.elements.password;
    if (password) password.oninput = () => {
      const rating = passwordRating(password.value);
      const meter = form.querySelector('.password-strength');
      meter.dataset.passwordStrength = rating.level;
      meter.querySelector('strong').textContent = rating.label;
    };
    form.onsubmit = async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const status = document.getElementById('auth-status');
      if (signupStep < 5) {
        capture(form);
        signupStep += 1;
        renderSignup(form);
        form.querySelector('input,select')?.focus();
        return;
      }
      const passwordValue = form.elements.password.value;
      const confirmation = form.elements.passwordConfirm.value;
      if (passwordValue !== confirmation) { status.textContent = t('mismatch'); form.elements.passwordConfirm.setCustomValidity(t('mismatch')); form.elements.passwordConfirm.reportValidity(); form.elements.passwordConfirm.setCustomValidity(''); return; }
      if (passwordRating(passwordValue).level === 'weak') { status.textContent = t('weakPassword'); return; }
      const studentId = randomDigits(12, true);
      const pin = randomDigits(4, true);
      const profile = { ...signupDraft, studentId, accountType:'student', createdAt:Date.now() };
      const submit = form.querySelector('[type=submit]');
      submit.disabled = true; form.dataset.submitting = 'true'; status.textContent = t('creating');
      writeProfile(profile);
      window.DafatiiData?.writeJSON?.(ONBOARDING_KEY,{version:1,required:true,primaryComplete:false,recommendationComplete:false,completed:false,createdAt:Date.now()});
      try {
        await window.DafatiiAuth.signup({ ...profile, password:passwordValue, pin });
        sessionStorage.setItem(INITIAL_PIN_KEY, pin);
        signupDraft = {}; signupStep = 1;
        location.hash = 'onboarding';
      } catch (error) {
        removeProfile();
        window.DafatiiData?.remove?.(ONBOARDING_KEY);
        submit.disabled = false; delete form.dataset.submitting;
        status.textContent = `${error.message || 'Account creation failed.'}${error.code ? ` (${error.code})` : ''}`;
      }
    };
  }

  function renderSignin(form) {
    form.dataset.studentFlowBound = 'signin';
    form.innerHTML = `${field('identifier', t('identifier'), `<input autocomplete="username" maxlength="254" required>`)}${field('credential', t('credential'), `<input type="password" autocomplete="current-password" maxlength="256" required>`)}<p class="student-flow-hint">${esc(t('loginHint'))}</p><button class="btn btn-primary auth-submit" type="submit">${esc(t('signIn'))} →</button>`;
    form.onsubmit = async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const submit = form.querySelector('[type=submit]'), status = document.getElementById('auth-status');
      submit.disabled = true; form.dataset.submitting = 'true'; status.textContent = t('signing');
      try {
        await window.DafatiiAuth.login({ identifier:form.elements.identifier.value, credential:form.elements.credential.value });
        location.hash = 'profile';
      } catch (error) {
        submit.disabled = false; delete form.dataset.submitting;
        status.textContent = `${error.message || 'Authentication failed.'}${error.code ? ` (${error.code})` : ''}`;
      }
    };
  }

  function enhanceJoin() {
    const form = document.getElementById('auth-form');
    if (!form || form.dataset.submitting) return;
    const signup = document.querySelector('.auth-tab[data-auth="signup"]')?.classList.contains('active');
    const mode = signup ? 'signup' : 'signin';
    if (form.dataset.studentFlowBound === mode) return;
    if (mode === 'signup') renderSignup(form); else renderSignin(form);
  }

  const levelLabel = profile => profile?.academicLevel && levels[profile.academicLevel] ? t(levels[profile.academicLevel].label) : '';
  const stageLabel = value => value === 'primary_studies' ? t('primaryStudies') : value === 'postgraduate_studies' ? t('postgraduate') : t(value || '');
  const organizationLabel = profile => profile?.academicLevel === 'college' ? [profile.universityName,profile.collegeName].filter(Boolean).join(' · ') : (profile?.institutionName || '');
  const maskStudentId = value => /^\d{12}$/.test(String(value || '')) ? `${String(value).slice(0,4)} •••• ${String(value).slice(-4)}` : '•••• •••• ••••';
  const avatarMarkup = (profile, user) => profile?.avatarFileId
    ? `<img src="/api/v1/files/${encodeURIComponent(profile.avatarFileId)}/content" alt="${esc(user.displayName || t('profile'))}">`
    : `<span>${esc((user.displayName || 'D').trim().slice(0,1).toUpperCase())}</span>`;

  function profileMarkup(profile, user) {
    const initialPin = sessionStorage.getItem(INITIAL_PIN_KEY) || '';
    const organization = organizationLabel(profile);
    const fieldText = profile?.academicField ? t(profile.academicField) : '';
    const studentId = profile?.studentId || '';
    return `<section class="student-profile-v2" data-student-profile-v2>
      <header class="student-profile-heading"><div><div class="eyebrow">${esc(t('profile'))}</div><h1>${esc(user.displayName || t('profile'))}</h1><p>${esc([levelLabel(profile),organization].filter(Boolean).join(' · '))}</p></div><label class="student-photo-action"><input type="file" accept="image/jpeg,image/png,image/webp" data-student-photo><span>${esc(t('changePhoto'))}</span></label></header>
      ${initialPin && studentId ? `<aside class="student-credential-once"><div><strong>${esc(t('oneTime'))}</strong><p>${esc(t('oneTimeText'))}</p></div><dl><div><dt>${esc(t('accessId'))}</dt><dd>${esc(studentId)}</dd></div><div><dt>${esc(t('pin'))}</dt><dd>${esc(initialPin)}</dd></div></dl><button class="btn btn-primary" type="button" data-credential-saved>${esc(t('saved'))}</button></aside>` : ''}
      <div class="student-profile-grid">
        <section class="student-card-panel"><div class="student-card-title"><strong>${esc(t('studentCard'))}</strong><span>${esc(t('cardHint'))}</span></div>
          <button class="student-id-card" type="button" data-student-card aria-label="${esc(t('cardHint'))}">
            <span class="student-card-inner">
              <span class="student-card-face student-card-front"><span class="student-card-brand">dafatii</span><span class="student-card-avatar">${avatarMarkup(profile,user)}</span><span class="student-card-name">${esc(user.displayName || '')}</span><span class="student-card-school">${esc(organization || '—')}</span><span class="student-card-meta">${esc([stageLabel(profile?.academicStage),fieldText].filter(Boolean).join(' · '))}</span><span class="student-card-chip">STUDENT</span></span>
              <span class="student-card-face student-card-back"><span class="student-card-brand">dafatii access</span><span class="student-secret-block"><small>${esc(t('accessId'))}</small><strong data-student-id-value data-full-id="${esc(studentId)}">${esc(maskStudentId(studentId))}</strong></span><span class="student-secret-block"><small>${esc(t('pin'))}</small><strong>${esc(initialPin || '••••')}</strong></span><span class="student-card-security">${esc(t('secret'))}</span></span>
            </span>
          </button>
          ${studentId ? `<button class="student-reveal-id" type="button" data-reveal-student-id>${esc(t('reveal'))}</button>` : `<p class="student-profile-muted">${esc(t('noId'))}</p>`}
        </section>
        <section class="student-profile-details"><article><span>${esc(t('identity'))}</span><dl><div><dt>${esc(t('level'))}</dt><dd>${esc(levelLabel(profile) || '—')}</dd></div><div><dt>${esc(t('stage'))}</dt><dd>${esc(stageLabel(profile?.academicStage) || '—')}</dd></div>${fieldText ? `<div><dt>${esc(t('academicField'))}</dt><dd>${esc(fieldText)}</dd></div>` : ''}<div><dt>${esc(t('organization'))}</dt><dd>${esc(organization || '—')}</dd></div>${profile?.birthDate ? `<div><dt>${esc(t('born'))}</dt><dd>${esc(profile.birthDate)}</dd></div>` : ''}${[profile?.town,profile?.city,profile?.country].filter(Boolean).length ? `<div><dt>${esc(t('location'))}</dt><dd>${esc([profile?.town,profile?.city,profile?.country].filter(Boolean).join(' · '))}</dd></div>` : ''}</dl></article><article><span>${esc(t('contact'))}</span><dl><div><dt>${esc(t('emailLabel'))}</dt><dd>${esc(user.email || profile?.email || '—')}</dd></div><div><dt>${esc(t('phoneLabel'))}</dt><dd>${esc(profile?.phone || '—')}</dd></div></dl></article></section>
      </div>
      <p class="student-photo-status" role="status" data-student-photo-status></p>
    </section>`;
  }

  function bindProfile(container, profile, user) {
    const card = container.querySelector('[data-student-card]');
    card?.addEventListener('click', () => card.classList.toggle('flipped'));
    container.querySelector('[data-credential-saved]')?.addEventListener('click', () => { sessionStorage.removeItem(INITIAL_PIN_KEY); renderProfile(true); });
    const reveal = container.querySelector('[data-reveal-student-id]');
    reveal?.addEventListener('click', event => {
      event.stopPropagation();
      const value = container.querySelector('[data-student-id-value]');
      const revealed = reveal.dataset.revealed === 'true';
      value.textContent = revealed ? maskStudentId(value.dataset.fullId) : value.dataset.fullId;
      reveal.dataset.revealed = String(!revealed);
      reveal.textContent = t(revealed ? 'reveal' : 'hide');
    });
    const photo = container.querySelector('[data-student-photo]');
    photo?.addEventListener('change', async () => {
      const file = photo.files?.[0]; if (!file) return;
      const status = container.querySelector('[data-student-photo-status]');
      if (!allowedAvatarTypes.has(file.type) || file.size > 5 * 1024 * 1024) { status.textContent = t('photoError'); photo.value = ''; return; }
      status.textContent = t('uploading'); photo.disabled = true;
      try {
        const previous = profile?.avatarFileId || null;
        const uploaded = await window.DafatiiFiles.upload(file);
        const next = { ...(profile || {}), avatarFileId:uploaded.id };
        writeProfile(next);
        if (previous && previous !== uploaded.id) void window.DafatiiFiles.delete(previous).catch(() => {});
        renderProfile(true);
      } catch { status.textContent = t('photoError'); photo.disabled = false; }
    });
  }

  function renderProfile(force = false) {
    if (route().split('/')[0] !== 'profile') return;
    const main = document.querySelector('.workspace-main');
    if (!main || (!force && main.querySelector('[data-student-profile-v2]'))) return;
    const user = window.DafatiiAuth?.user || {};
    const profile = readProfile() || {};
    main.innerHTML = profileMarkup(profile, user);
    bindProfile(main, profile, user);
  }

  function enhance() {
    scheduled = false;
    if (route() === 'join') enhanceJoin();
    else if (route().split('/')[0] === 'profile') renderProfile();
  }
  function schedule() { if (!scheduled) { scheduled = true; queueMicrotask(enhance); } }

  new MutationObserver(schedule).observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener('hashchange', schedule);
  window.addEventListener('dafatii:datahydrated', () => { if (route().split('/')[0] === 'profile') renderProfile(true); });
  window.addEventListener('dafatii:auth:changed', schedule);
  schedule();
})();
