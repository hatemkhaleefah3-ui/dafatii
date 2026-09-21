(() => {
  'use strict';

  const META_VERSION = 8;
  const COURSE_TYPES = ['dafaa','personal','teaching','language'];
  const LANGUAGE_ROUTES = ['language-home','language-letter-learn','language-letter-exam','language-letters','language-voice','language-grammar','language-video','language-examine'];
  const LETTER_GATE_ROUTES = ['language-home','language-letter-learn','language-letter-exam'];
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const LETTER_WORDS = {A:'apple',B:'book',C:'cat',D:'door',E:'egg',F:'fish',G:'green',H:'home',I:'ice',J:'juice',K:'key',L:'lamp',M:'moon',N:'name',O:'orange',P:'pen',Q:'queen',R:'room',S:'sun',T:'table',U:'umbrella',V:'voice',W:'water',X:'x-ray',Y:'yellow',Z:'zebra'};
  const LETTER_SPEECH = {A:'ay',B:'bee',C:'see',D:'dee',E:'ee',F:'ef',G:'jee',H:'aitch',I:'eye',J:'jay',K:'kay',L:'el',M:'em',N:'en',O:'oh',P:'pee',Q:'cue',R:'ar',S:'ess',T:'tee',U:'you',V:'vee',W:'double you',X:'ex',Y:'why',Z:'zee'};
  const LETTER_WORD_AR = {apple:'تفاحة',book:'كتاب',cat:'قطة',door:'باب',egg:'بيضة',fish:'سمكة',green:'أخضر',home:'منزل',ice:'ثلج',juice:'عصير',key:'مفتاح',lamp:'مصباح',moon:'قمر',name:'اسم',orange:'برتقالة',pen:'قلم',queen:'ملكة',room:'غرفة',sun:'شمس',table:'طاولة',umbrella:'مظلة',voice:'صوت',water:'ماء','x-ray':'أشعة سينية',yellow:'أصفر',zebra:'حمار وحشي'};
  const ENGLISH_ARABIC_LETTER_BRIDGE = [
    {letter:'A',arabic:'',sound:'/æ/, /eɪ/',special:true,note:'English vowel sounds do not map to one Arabic letter.'},
    {letter:'B',arabic:'ب',sound:'/b/'},
    {letter:'C',arabic:'',sound:'/k/ or /s/',special:true,note:'C changes sound by word; learn it as a special English letter.'},
    {letter:'D',arabic:'د',sound:'/d/'},
    {letter:'E',arabic:'',sound:'/e/, /iː/',special:true,note:'English vowel sounds do not map to one Arabic letter.'},
    {letter:'F',arabic:'ف',sound:'/f/'},
    {letter:'G',arabic:'',sound:'/g/ or /dʒ/',special:true,note:'G has no single standard-Arabic equivalent and can change sound.'},
    {letter:'H',arabic:'ه',sound:'/h/'},
    {letter:'I',arabic:'',sound:'/ɪ/, /aɪ/',special:true,note:'English vowel sounds do not map to one Arabic letter.'},
    {letter:'J',arabic:'ج',sound:'/dʒ/'},
    {letter:'K',arabic:'ك',sound:'/k/'},
    {letter:'L',arabic:'ل',sound:'/l/'},
    {letter:'M',arabic:'م',sound:'/m/'},
    {letter:'N',arabic:'ن',sound:'/n/'},
    {letter:'O',arabic:'',sound:'/ɒ/, /oʊ/',special:true,note:'English vowel sounds do not map to one Arabic letter.'},
    {letter:'P',arabic:'',sound:'/p/',special:true,note:'Standard Arabic has no native /p/ letter; distinguish it from ب /b/.'},
    {letter:'Q',arabic:'',sound:'/kw/',special:true,note:'English Q is normally learned with /kw/ and has no one-letter Arabic match.'},
    {letter:'R',arabic:'ر',sound:'/r/',approximate:true,note:'The English R sound is not identical to Arabic ر, but it is the closest bridge.'},
    {letter:'S',arabic:'س',sound:'/s/'},
    {letter:'T',arabic:'ت',sound:'/t/'},
    {letter:'U',arabic:'',sound:'/ʌ/, /juː/',special:true,note:'English vowel sounds do not map to one Arabic letter.'},
    {letter:'V',arabic:'',sound:'/v/',special:true,note:'Standard Arabic has no native /v/ letter; distinguish it from ف /f/.'},
    {letter:'W',arabic:'و',sound:'/w/'},
    {letter:'X',arabic:'',sound:'/ks/',special:true,note:'X usually represents a sound pair rather than one Arabic-letter sound.'},
    {letter:'Y',arabic:'ي',sound:'/j/',approximate:true,note:'This bridge applies when Y is the consonant /j/ as in yes.'},
    {letter:'Z',arabic:'ز',sound:'/z/'}
  ];
  const LETTER_LEARNING_ORDER = ['D','B','F','H','J','K','L','M','N','S','T','W','Z','R','Y','A','E','I','O','U','P','V','C','G','Q','X'];
  const LETTER_EXAM_ORDER = ['D','B','F','J','K','M','S','T','V','P','H','N','R','W','Y','Z','A','E','I','O','U','C','G','Q','X','L'];
  const ARABIC_VOCABULARY = {
    hello:'مرحباً',name:'اسم',friend:'صديق',family:'عائلة',morning:'صباح',evening:'مساء',school:'مدرسة',teacher:'معلّم',student:'طالب',book:'كتاب',house:'بيت',room:'غرفة',water:'ماء',bread:'خبز',market:'سوق',street:'شارع',bus:'حافلة',today:'اليوم',tomorrow:'غداً',happy:'سعيد',tired:'متعب',small:'صغير',large:'كبير',near:'قريب',far:'بعيد',help:'مساعدة',learn:'يتعلّم',write:'يكتب',listen:'يستمع',speak:'يتحدث',
    receipt:'إيصال',reservation:'حجز',journey:'رحلة',platform:'رصيف',schedule:'جدول',appointment:'موعد',borrow:'يستعير',return:'يعيد',recommend:'يوصي',prefer:'يفضّل',enough:'كافٍ',several:'عدّة',usually:'عادةً',recently:'مؤخراً',already:'بالفعل',yet:'بعد',healthy:'صحي',exercise:'تمرين',service:'خدمة',repair:'إصلاح',message:'رسالة',website:'موقع إلكتروني',plan:'خطة',decide:'يقرر',compare:'يقارن',expensive:'غالي',comfortable:'مريح',available:'متاح',probably:'على الأرجح',experience:'تجربة',
    evidence:'دليل',opinion:'رأي',advantage:'ميزة',disadvantage:'عيب',solution:'حل',responsibility:'مسؤولية',community:'مجتمع',environment:'بيئة',resource:'مورد',budget:'ميزانية',deadline:'موعد نهائي',feedback:'ملاحظات',improve:'يحسّن',manage:'يدير',avoid:'يتجنب',achieve:'يحقق',although:'على الرغم من',however:'مع ذلك',therefore:'لذلك',likely:'مرجّح',issue:'مسألة',benefit:'فائدة',challenge:'تحدٍ',decision:'قرار',behavior:'سلوك',culture:'ثقافة',policy:'سياسة',relationship:'علاقة',career:'مسار مهني',confidence:'ثقة',
    evaluate:'يقيّم',assumption:'افتراض',implication:'دلالة',constraint:'قيد',framework:'إطار',sustainable:'مستدام',controversial:'مثير للجدل',perspective:'منظور',justify:'يبرر',interpret:'يفسّر',reliable:'موثوق',significant:'مهم',approximate:'تقريبي',nevertheless:'مع ذلك',consequently:'وبالتالي',whereas:'بينما',criterion:'معيار',strategy:'استراتيجية',implementation:'تنفيذ',stakeholder:'صاحب مصلحة',privacy:'خصوصية',regulation:'تنظيم',innovation:'ابتكار',bias:'تحيز',methodology:'منهجية',outcome:'نتيجة',priority:'أولوية',complexity:'تعقيد',efficient:'فعّال',credible:'موثوق',
    nuance:'فارق دقيق',premise:'مقدمة منطقية',inference:'استدلال',counterargument:'حجة مضادة',corroborate:'يؤيد بالأدلة',qualify:'يقيّد الادعاء',ambiguous:'ملتبس',coherent:'مترابط',salient:'بارز',robust:'متين',tentative:'مبدئي',discourse:'خطاب',rhetoric:'بلاغة',paradigm:'نموذج فكري','trade-off':'مفاضلة',mechanism:'آلية',causality:'سببية',marginal:'هامشي',institutional:'مؤسسي',normative:'معياري',empirical:'تجريبي',substantiate:'يدعم بالدليل',synthesize:'يركّب',reconcile:'يوفّق',articulate:'يصوغ بوضوح',concede:'يقرّ',contingent:'مشروط',plausible:'معقول',distinction:'تمييز',precision:'دقة'
  };
  const ARABIC_GRAMMAR = {
    'Be: am / is / are':['فعل الكينونة: am / is / are','استخدم فعل الكينونة للتعريف بالأشخاص أو الأشياء ووصفها وتحديد مكانها.'],
    'Subject pronouns':['ضمائر الفاعل','استخدم I وyou وhe وshe وit وwe وthey قبل الفعل المصرف.'],
    'Articles: a / an / the':['أدوات التعريف والتنكير','استخدم a أو an مع اسم مفرد غير محدد، وthe مع اسم محدد معروف.'],
    'Present simple':['المضارع البسيط','استخدم أصل الفعل للعادات، وأضف s أو es مع he وshe وit.'],
    'Have / has':['Have / has للملكية','استخدم have وhas للتعبير عن الملكية والعائلة والصفات.'],
    'There is / there are':['There is / there are','استخدم there is مع المفرد وthere are مع الجمع.'],
    'Can / cannot':['Can / cannot','استخدم can مع أصل الفعل للتعبير عن القدرة أو الإذن أو الإمكان.'],
    'This / that / these / those':['أسماء الإشارة','طابق اسم الإشارة مع القرب أو البعد ومع المفرد أو الجمع.'],
    'Basic prepositions':['حروف الجر الأساسية','استخدم in وon وat وunder وnext to وbetween للمكان أو الزمن.'],
    'Question words':['أدوات الاستفهام','استخدم who وwhat وwhere وwhen وwhy وhow لطلب معلومة محددة.'],
    'Past simple':['الماضي البسيط','استخدم صيغة الماضي لحدث مكتمل في زمن منتهٍ.'],
    'Present continuous':['المضارع المستمر','استخدم be مع الفعل المنتهي بـ ing لحدث يقع الآن أو لحالة مؤقتة.'],
    'Going to':['Going to للمستقبل','استخدم be going to للخطط والتوقعات المبنية على دليل.'],
    'Comparatives':['صيغة المقارنة','استخدم er أو more للمقارنة بين شيئين.'],
    'Superlatives':['صيغة التفضيل','استخدم est أو most لتمييز أعلى درجة داخل مجموعة.'],
    'Countable and uncountable nouns':['الأسماء المعدودة وغير المعدودة','استخدم many وfew مع المعدود، وmuch وlittle مع غير المعدود.'],
    'Present perfect basics':['أساسيات المضارع التام','استخدم have أو has مع التصريف الثالث لتجربة حياتية أو نتيجة حديثة.'],
    'Should / must / have to':['النصيحة والالتزام','استخدم should وmust وhave to للنصيحة والالتزام والقواعد.'],
    'First conditional':['الشرط الأول','استخدم if مع المضارع ثم will مع أصل الفعل لشرط مستقبلي واقعي.'],
    'Adverbs of frequency':['ظروف التكرار','ضع usually وoften وsometimes وnever في موضعها الصحيح حول الفعل الرئيسي.'],
    'Present perfect vs past simple':['المضارع التام مقابل الماضي البسيط','استخدم المضارع التام لارتباط مستمر بالحاضر، والماضي البسيط لزمن ماضٍ منتهٍ.'],
    'Past continuous':['الماضي المستمر','استخدم was أو were مع ing للخلفية الزمنية أو الحدث الذي قاطعه حدث آخر.'],
    'Relative clauses':['الجمل الموصولة','استخدم who وwhich وthat وwhere وwhose للتعريف أو إضافة معلومات.'],
    'Second conditional':['الشرط الثاني','استخدم if مع الماضي وwould مع أصل الفعل لافتراض غير واقعي في الحاضر أو المستقبل.'],
    'Passive voice basics':['أساسيات المبني للمجهول','استخدم be مع التصريف الثالث عندما يكون الفعل أو النتيجة أهم من الفاعل.'],
    'Gerunds and infinitives':['المصدر بصيغة ing والمصدر مع to','تعلّم النمط الذي يطلبه كل فعل مثل enjoy doing وdecide to do.'],
    'Reported speech basics':['أساسيات الكلام المنقول','غيّر الزمن والإشارات المناسبة عند نقل كلام شخص آخر.'],
    'Modal deduction':['الاستنتاج بالأفعال الناقصة','استخدم must وmight وmay وcannot للتعبير عن درجات اليقين.'],
    'Linking clauses':['ربط الجمل','استخدم although وhowever وbecause وso وwhile وtherefore لإظهار العلاقة المنطقية.'],
    'Future forms':['صيغ المستقبل','اختر will أو going to أو المضارع المستمر بحسب التوقع أو الخطة أو الترتيب.'],
    'Third and mixed conditionals':['الشرط الثالث والمختلط','استخدم الشرط الثالث لنتيجة ماضية غير واقعية والمختلط لربط زمنين مختلفين.'],
    'Advanced passive structures':['تراكيب المبني للمجهول المتقدمة','استخدم المبني للمجهول في التقرير ومع الأفعال الناقصة للتحكم في مركز المعلومة.'],
    'Participle clauses':['جمل اسم الفاعل والمفعول','اختصر الجمل باستخدام اسم الفاعل أو المفعول عندما يكون الفاعل واضحاً.'],
    'Cleft sentences':['الجمل الانشقاقية','استخدم تراكيب it-cleft وwh-cleft لتركيز معلومة بعينها.'],
    'Modal perfects':['الأفعال الناقصة التامة','استخدم must أو might أو could أو should مع have والتصريف الثالث للاستنتاج والتقييم الماضي.'],
    'Inversion after negative adverbials':['القلب بعد الظروف السلبية','اقلب ترتيب الفعل المساعد والفاعل بعد العبارات السلبية المقيدة للتوكيد الرسمي.'],
    'Complex noun phrases':['العبارات الاسمية المعقدة','ادمج المعلومات بالمعدلات قبل الاسم وبعده وبالجمل المضمنة مع الحفاظ على الوضوح.'],
    'Discourse markers':['روابط الخطاب','استخدم nevertheless وmoreover وwhereas وconsequently لتنظيم الحجة.'],
    'Future in the past':['المستقبل من منظور الماضي','استخدم would وwas going to وwas about to لحدث مستقبلي منظوراً إليه من نقطة ماضية.'],
    'Subjunctive and formal recommendation':['صيغة الطلب والتوصية الرسمية','استخدم أصل الفعل بعد التوصيات والمطالب الرسمية.'],
    'Information structure and fronting':['بنية المعلومات والتقديم','أعد ترتيب الجملة للتحكم في الموضوع والتركيز والتدرج البلاغي دون فقدان الوضوح النحوي.'],
    'Hedging and epistemic stance':['التحوط والموقف المعرفي','اضبط قوة الادعاء بألفاظ مثل seem وappear وmay وبقيود تتناسب مع قوة الدليل.'],
    'Nominalization and academic density':['الاسمية والكثافة الأكاديمية','حوّل العمليات إلى أسماء بانتقائية لبناء ترابط رسمي دون إخفاء الفاعل أو المعنى.'],
    'Advanced complementation':['التكملة المتقدمة','اضبط أفعال التقرير مع that والمصدر وing والمتممات بحروف الجر.'],
    'Concessive and adversative architecture':['بناء التنازل والتعارض','ابنِ مقابلة دقيقة باستخدام albeit وnotwithstanding وmuch as وwhile وfor all.'],
    'Ellipsis and substitution':['الحذف والاستبدال','تجنب التكرار بالحذف المنضبط وبدائل مثل so وdo so وone وones.'],
    'Advanced relative and supplementary clauses':['الجمل الموصولة والإضافية المتقدمة','استخدم الموصولات التي تحيل إلى جملة كاملة وحرف الجر مع which أو whom والجمل المختزلة بدقة.'],
    'Register and modality':['السجل اللغوي والكيفية','اختر درجة الاحتمال والتهذيب والإلزام بما يناسب السلطة والمخاطر والعلاقة.'],
    'Rhetorical conditionals':['الشرط البلاغي','استخدم القلب وprovided that وassuming that وbut for لصياغة شروط متقدمة بإيجاز.'],
    'Punctuation as syntax':['الترقيم بوصفه بناءً نحوياً','استخدم النقطتين والفاصلة المنقوطة والشرطة والأقواس لإظهار البنية المنطقية.']
  };
  const LEVEL_LEARNING_SYSTEMS = [
    {
      number:1,id:'A1',name:'Word Builder',design:'guided-cards',difficulty:'foundation',
      vocabulary:'Simple high-frequency words with spelling, meaning and controlled writing.',
      listening:'Simple words and short spoken models with repeat-and-recognize practice.',
      grammar:'Simple rules used in one clear model at a time.',
      video:'Admin-supplied YouTube clips with guided main-idea and word recognition.',
      exam:'Word pronunciation, spelling/writing, translation and simple-rule checks.',
      method:'See → hear → retrieve → write → say',examStyle:'direct',target:'Build a dependable A1 foundation.'
    },
    {
      number:2,id:'A2',name:'Sentence Builder',design:'sentence-rails',difficulty:'elementary',
      vocabulary:'Simple sentences built from known vocabulary and everyday functions.',
      listening:'Simple sentences with dictation, reconstruction and short spoken responses.',
      grammar:'Simple grammar patterns applied inside complete sentences.',
      video:'Admin-supplied YouTube clips with sentence-level understanding checks.',
      exam:'Simple-sentence pronunciation, writing, translation, grammar and rule checks.',
      method:'Model → rebuild → vary → speak → write',examStyle:'controlled',target:'Produce accurate everyday A2 sentences.'
    },
    {
      number:3,id:'B1',name:'Connected English',design:'connection-board',difficulty:'intermediate',
      vocabulary:'Moderate words and connected sentences across practical topics.',
      listening:'Moderate speech with detail retrieval, paraphrase and connected responses.',
      grammar:'Moderate grammar and rules used across linked clauses and short paragraphs.',
      video:'Admin-supplied YouTube clips with main idea, detail, inference and language noticing.',
      exam:'Moderate word/sentence pronunciation, writing, translation and grammar/rule checks.',
      method:'Connect → explain → paraphrase → retrieve → transfer',examStyle:'mixed',target:'Operate independently at B1 across common situations.'
    },
    {
      number:4,id:'B2',name:'Precision & Pressure',design:'precision-grid',difficulty:'upper-intermediate',
      vocabulary:'Advanced words and sentences with precision, register and collocation control.',
      listening:'Advanced speech with inference, distractors, paraphrase and fast retrieval.',
      grammar:'Moderate-to-advanced rules tested through near-misses and competing forms.',
      video:'Admin-supplied YouTube clips with inference, argument structure and evidence tracking.',
      exam:'Advanced pronunciation, writing and translation plus tricky grammar/rule discrimination.',
      method:'Distinguish → justify → correct → reformulate → perform',examStyle:'tricky',target:'Build robust B2 performance under ambiguity and time pressure.'
    },
    {
      number:5,id:'C1',name:'C1 / IELTS Readiness',design:'c1-studio',difficulty:'advanced',
      vocabulary:'Advanced words, collocations, academic phrasing and nuanced sentence control.',
      listening:'Advanced connected speech with inference, stance, implication and synthesis.',
      grammar:'Advanced grammar, discourse, register and rhetorical control.',
      video:'Admin-supplied YouTube clips used for synthesis, inference, argument and evidence analysis.',
      exam:'Advanced pronunciation/writing plus high-discrimination grammar, rule, inference and reformulation tasks.',
      method:'Synthesize → qualify → defend → reformulate → self-correct',examStyle:'high-discrimination',
      target:'C1 / IELTS-readiness target across listening, speaking, reading-oriented understanding and writing. This is preparation, not a guaranteed IELTS result.'
    }
  ];

  const TOTAL_LANGUAGE_BOXES = 5*5*25;
  const LANGUAGE_FUNCTIONS = ['introducing','identifying','describing','asking for information','answering precisely','comparing','sequencing','locating','expressing time','expressing quantity','stating preferences','expressing ability','expressing obligation','giving reasons','explaining results','expressing conditions','contrasting ideas','describing experience','making plans','giving instructions','stating opinions','supporting with evidence','correcting meaning','summarizing','reflecting'];
  const CEFR = [
    {
      id:'A1', title:'Foundation', ar:'الأساسيات', description:'Build a reliable base for everyday English: sounds, survival vocabulary, simple clauses and controlled writing.',
      topics:['introductions','family','numbers and time','home','food and drinks','daily routines','school','places in town','weather','clothes','health basics','transport'],
      grammar:[
        ['Be: am / is / are','Use be to identify, describe and locate people or things.','I am ready. She is at home.','Are they students?'],
        ['Subject pronouns','Use I, you, he, she, it, we, they before a finite verb.','She studies English.','They live nearby.'],
        ['Articles: a / an / the','Use a/an for one nonspecific countable noun and the for a specific known noun.','I need a pen. The pen is blue.','She ate an apple.'],
        ['Present simple','Use the base verb for habits; add -s/-es with he, she, it.','I study every evening.','He studies after dinner.'],
        ['Have / has','Use have/has for possession, family and features.','We have two lessons.','She has a new book.'],
        ['There is / there are','Use there is with singular and there are with plural nouns.','There is a library here.','There are three windows.'],
        ['Can / cannot','Use can + base verb for ability, permission and simple possibility.','I can read this.','Can you help me?'],
        ['This / that / these / those','Match the demonstrative with distance and number.','This book is mine.','Those shoes are new.'],
        ['Basic prepositions','Use in, on, at, under, next to and between to show place or time.','The keys are on the desk.','Class starts at nine.'],
        ['Question words','Use who, what, where, when, why and how to ask for specific information.','Where do you live?','How are you?']
      ],
      sounds:['alphabet names and shapes','short vowels /æ e ɪ ɒ ʌ/','long vowels and final e','common consonant pairs sh/ch/th','word stress in two-syllable words'],
      words:['hello','name','friend','family','morning','evening','school','teacher','student','book','house','room','water','bread','market','street','bus','today','tomorrow','happy','tired','small','large','near','far','help','learn','write','listen','speak']
    },
    {
      id:'A2', title:'Everyday Independence', ar:'الاستقلال اليومي', description:'Handle routine situations, describe past and future events, and write connected everyday messages.',
      topics:['shopping','travel plans','appointments','work and study','hobbies','restaurants','technology','neighborhoods','holidays','fitness','services','personal goals'],
      grammar:[
        ['Past simple','Use the past form for completed events at a finished time.','We visited the museum yesterday.','Did you call the office?'],
        ['Present continuous','Use be + -ing for actions happening now or temporary situations.','I am waiting for the bus.','They are studying this week.'],
        ['Going to','Use be going to for plans and evidence-based predictions.','I am going to practice tonight.','It is going to rain.'],
        ['Comparatives','Use -er or more to compare two things.','This route is faster.','The second task is more difficult.'],
        ['Superlatives','Use the -est or most form for the extreme member of a group.','It is the cheapest option.','She is the most experienced person here.'],
        ['Countable and uncountable nouns','Use many/few with countable nouns and much/little with uncountable nouns.','We have a few questions.','There is little time.'],
        ['Present perfect basics','Use have/has + past participle for life experience and recent results.','I have finished the task.','Have you ever flown abroad?'],
        ['Should / must / have to','Use modals and have to to express advice, obligation and rules.','You should rest.','We have to arrive early.'],
        ['First conditional','Use if + present, will + base verb for realistic future conditions.','If it rains, we will take a taxi.','I will call if I am late.'],
        ['Adverbs of frequency','Place usually, often, sometimes and never around the main verb correctly.','I usually walk to work.','She is often busy.']
      ],
      sounds:['past -ed endings','plural and third-person -s endings','sentence stress','weak forms of function words','linking consonants to vowels'],
      words:['receipt','reservation','journey','platform','schedule','appointment','borrow','return','recommend','prefer','enough','several','usually','recently','already','yet','healthy','exercise','service','repair','message','website','plan','decide','compare','expensive','comfortable','available','probably','experience']
    },
    {
      id:'B1', title:'Connected Communication', ar:'التواصل المترابط', description:'Explain experiences, opinions and reasons with connected speech, paragraph control and broader grammar.',
      topics:['education choices','workplace communication','media','environment','relationships','culture','problem solving','travel experiences','health decisions','money','public services','personal development'],
      grammar:[
        ['Present perfect vs past simple','Use present perfect for unfinished relevance and past simple for a finished past time.','I have worked here for two years.','I started in 2024.'],
        ['Past continuous','Use was/were + -ing for background actions and interrupted events.','I was studying when you called.','They were driving at midnight.'],
        ['Relative clauses','Use who, which, that, where and whose to identify or add information.','The teacher who helped me was patient.','This is the place where we met.'],
        ['Second conditional','Use if + past, would + base verb for hypothetical present/future situations.','If I had more time, I would read more.','What would you do if you moved abroad?'],
        ['Passive voice basics','Use be + past participle when the action or result matters more than the agent.','The form is sent by email.','The road was closed yesterday.'],
        ['Gerunds and infinitives','Learn verb patterns such as enjoy doing, decide to do and want to do.','I enjoy learning languages.','We decided to leave early.'],
        ['Reported speech basics','Shift tense and reference when reporting what someone said.','She said that she was tired.','He told me to wait.'],
        ['Modal deduction','Use must, might, may and cannot to express degrees of certainty.','They must be busy.','It might arrive today.'],
        ['Linking clauses','Use although, however, because, so, while and therefore to show logical relationships.','Although it was late, we continued.','The train was delayed, so we called.'],
        ['Future forms','Choose will, going to and present continuous according to prediction, plan and arrangement.','I will probably stay home.','I am meeting Sam at six.']
      ],
      sounds:['contrastive sentence stress','thought groups and pausing','connected speech reductions','intonation for certainty and politeness','consonant clusters'],
      words:['evidence','opinion','advantage','disadvantage','solution','responsibility','community','environment','resource','budget','deadline','feedback','improve','manage','avoid','achieve','although','however','therefore','likely','issue','benefit','challenge','decision','behavior','culture','policy','relationship','career','confidence']
    },
    {
      id:'B2', title:'Fluent Independence', ar:'الاستقلال بطلاقة', description:'Discuss abstract issues, evaluate evidence, adapt register and produce coherent detailed spoken and written English.',
      topics:['higher education','professional projects','science and society','digital privacy','globalization','leadership','ethics','innovation','public policy','research','art and criticism','career strategy'],
      grammar:[
        ['Third and mixed conditionals','Use third conditionals for unreal past results and mixed forms for cross-time consequences.','If I had prepared, I would have passed.','If I had accepted the job, I would live there now.'],
        ['Advanced passive structures','Use passive reporting and modal passives to manage information focus.','The results are expected to improve.','The proposal should have been reviewed.'],
        ['Participle clauses','Reduce clauses with present or past participles when the subject is clear.','Having finished the report, we left.','Designed for students, the app is easy to use.'],
        ['Cleft sentences','Use it-clefts and wh-clefts to focus information.','It was the timing that caused the problem.','What we need is a clearer plan.'],
        ['Modal perfects','Use must/might/could/should + have + participle for past deduction and evaluation.','She must have missed the message.','We should have checked earlier.'],
        ['Inversion after negative adverbials','Invert auxiliary and subject after restrictive negative expressions for formal emphasis.','Rarely have I seen such a result.','Not only did it fail, but it also caused delays.'],
        ['Complex noun phrases','Pack information with premodifiers, postmodifiers and embedded clauses while preserving clarity.','The recently published university funding report raised concerns.','The strategy proposed by the committee needs revision.'],
        ['Discourse markers','Use nevertheless, moreover, whereas, consequently and in contrast to organize arguments.','The evidence is limited; nevertheless, the trend is useful.','Costs fell, whereas demand increased.'],
        ['Future in the past','Use would, was going to and was about to for future events viewed from a past point.','I knew the meeting would be difficult.','We were about to leave when it rang.'],
        ['Subjunctive and formal recommendation','Use base forms after formal recommendations and demands.','They recommended that he attend.','It is essential that the data be checked.']
      ],
      sounds:['intonation across long clauses','prominence and information focus','assimilation and elision','register-sensitive rhythm','stress shifts in word families'],
      words:['evaluate','assumption','implication','constraint','framework','sustainable','controversial','perspective','justify','interpret','reliable','significant','approximate','nevertheless','consequently','whereas','criterion','strategy','implementation','stakeholder','privacy','regulation','innovation','bias','methodology','outcome','priority','complexity','efficient','credible']
    },
    {
      id:'C1', title:'Advanced Precision', ar:'الدقة المتقدمة', description:'Operate with C1-level precision: nuanced argument, rhetorical control, idiomatic flexibility and sophisticated academic/professional language.',
      topics:['argumentation','academic research','systems thinking','economic trade-offs','law and institutions','technology governance','literary analysis','negotiation','risk communication','organizational design','public discourse','advanced writing'],
      grammar:[
        ['Information structure and fronting','Reorder clauses to control theme, focus and rhetorical progression without losing grammatical clarity.','What the analysis overlooks is implementation risk.','Only after the review did the weakness become obvious.'],
        ['Hedging and epistemic stance','Calibrate claims with seem, appear, arguably, may, tends to and evidence-sensitive qualifiers.','The findings appear to support a cautious interpretation.','This may partly reflect sampling bias.'],
        ['Nominalization and academic density','Convert processes into nouns selectively to build formal cohesion while avoiding opaque prose.','The committee evaluated the policy. / The committee’s evaluation of the policy...','Excessive nominalization can obscure agency.'],
        ['Advanced complementation','Control reporting verbs with that-clauses, infinitives, gerunds and prepositional complements.','The authors acknowledge having underestimated the cost.','They contend that the model remains valid.'],
        ['Concessive and adversative architecture','Build nuanced contrast with albeit, notwithstanding, much as, while and for all.','Much as I agree with the aim, the mechanism is weak.','The approach is useful, albeit expensive.'],
        ['Ellipsis and substitution','Avoid repetition through controlled omission and substitutes such as so, do so and one/ones.','Some expected growth; others did not.','The team promised to revise the plan and did so.'],
        ['Advanced relative and supplementary clauses','Use sentential relatives, preposition + which/whom and reduced relatives precisely.','The deadline was extended, which relieved the team.','The framework within which we work is changing.'],
        ['Register and modality','Choose modal distance, politeness and obligation forms to match authority, risk and interpersonal stance.','You may wish to reconsider the assumption.','The procedure is to be followed exactly.'],
        ['Rhetorical conditionals','Use inversion, provided that, assuming that and but for to compress sophisticated conditions.','Had the evidence been stronger, the conclusion would differ.','But for the delay, the project would be complete.'],
        ['Punctuation as syntax','Use colons, semicolons, dashes and parenthetical punctuation to expose logical structure rather than decorate prose.','The result was clear: the model needed revision.','Two constraints remained—time and data quality.']
      ],
      sounds:['rhetorical prominence and deaccenting','intonation for stance and implication','advanced connected-speech parsing','stress in Latinate academic vocabulary','presentation pacing and chunking'],
      words:['nuance','premise','inference','counterargument','corroborate','qualify','ambiguous','coherent','salient','robust','tentative','discourse','rhetoric','paradigm','trade-off','mechanism','causality','marginal','institutional','normative','empirical','substantiate','synthesize','reconcile','articulate','concede','contingent','plausible','distinction','precision']
    }
  ];

  const COPY = {
    en:{
      home:'Home',letters:'Vocabulary & writing',pronunciation:'Vocabulary & writing',video:'YouTube understanding',voice:'Listening & talking',grammar:'Grammar & rules',review:'Revision',examine:'Examining',
      complete:'Mark section complete',completed:'Completed',locked:'Locked',listen:'Play voice',check:'Check answer',
      speak:'Speak this sentence',start:'Start recognition',notes:'My notes',save:'Save notes',level:'Level',step:'Step',box:'Box',
      pass:'Pass mark: 80%',takeExam:'Take exam',submitExam:'Submit exam',welcome:'Welcome',resume:'Resume learning',
      changeLevel:'Change level',progress:'Course progress',current:'Current',available:'Available',passed:'Passed',
      lettersIntro:'Letter, pronunciation, spelling and writing practice',voiceIntro:'Dictation and reverse speaking practice',
      grammarIntro:'Grammar, naming, spelling and typing rules',reviewIntro:'Retrieval, learning tricks and durable notes',
      examIntro:'Examining follows your exact position: box exam, step exam, level exam, then the final whole-language exam. No stage can bypass the driven pathway.'
    },
    ar:{
      home:'الرئيسية',letters:'المفردات والكتابة',pronunciation:'المفردات والكتابة',video:'فهم يوتيوب',voice:'الاستماع والتحدث',grammar:'القواعد والأحكام',review:'المراجعة',examine:'الاختبارات',
      complete:'إكمال هذا الجزء',completed:'مكتمل',locked:'مغلق',listen:'تشغيل الصوت',check:'تحقق من الإجابة',
      speak:'انطق هذه الجملة',start:'ابدأ التعرّف على الصوت',notes:'ملاحظاتي',save:'حفظ الملاحظات',level:'المستوى',step:'الخطوة',box:'الصندوق',
      pass:'درجة النجاح: 80٪',takeExam:'ابدأ الاختبار',submitExam:'إرسال الاختبار',welcome:'مرحباً',resume:'متابعة التعلّم',
      changeLevel:'تغيير المستوى',progress:'تقدم الدورة',current:'الحالي',available:'متاح',passed:'مجتاز',
      lettersIntro:'تدريب الحروف والنطق والإملاء والكتابة',voiceIntro:'إملاء صوتي وتدريب عكسي على النطق',
      grammarIntro:'القواعد والتسمية والإملاء والكتابة',reviewIntro:'استرجاع ومهارات تعلّم وملاحظات ثابتة',
      examIntro:'يتبع الاختبار موقعك بدقة: صندوق ثم خطوة ثم مستوى ثم اختبار اللغة النهائي، ولا يمكن تجاوز المسار المتدرج.'
    }
  };

  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const lang = () => (typeof interfaceLanguage === 'function' ? interfaceLanguage() : document.documentElement.lang) === 'ar' ? 'ar' : 'en';
  const t = key => COPY[lang()][key] || COPY.en[key] || key;
  const keyBox = (level,step,box) => level + ':' + step + ':' + box;
  const keyStep = (level,step) => level + ':' + step;
  const arrayUnique = values => [...new Set(values)];

  function readSuite(){
    const value=window.DafatiiCourses.readJSON('dafatii:studentSuite:v1',{});
    return value && typeof value==='object' && !Array.isArray(value) ? value : {};
  }
  function writeSuite(value){ window.DafatiiCourses.writeJSON('dafatii:studentSuite:v1',value); return value; }
  function courseMeta(){ return readSuite().courseMeta || {}; }
  function courseType(){ return String(courseMeta().courseType || 'dafaa'); }
  function isLanguage(){ return courseType()==='language'; }
  function isAdminActor(){
    const actor=window.DafatiiCourses?.actor||window.DafatiiAuth?.user;
    return actor?.platformRole==='admin';
  }

  function defaultLanguageLearning(){
    return {
      version:META_VERSION,targetLanguage:'English',baseLanguage:'',selectedLevel:0,selectedStep:1,selectedBox:1,
      passedBoxes:[],passedSteps:[],passedLevels:[],languagePassed:false,
      modules:{},letterProgress:{},activeLetterByStep:{},letterGateProgress:[],activeGateLetter:'D',letterGatePassed:false,videoResponses:{},videoRatings:{},pronunciationRatings:{},watchedVideos:{},notes:{},examHistory:[],
      onboardingComplete:false,placementPending:false,placementResult:null,entryLevel:0,challengeLevel:null
    };
  }
  const progressKey=()=> 'dafatii:language-progress:'+String(window.DafatiiCourses.active().id||'none')+':v3';
  const legacyProgressKey=()=> 'dafatii:language-progress:'+String(window.DafatiiCourses.active().id||'none')+':v2';
  function migrateLegacyLanguage(value){
    value.version=5;
    value.passedSteps=[];
    value.passedLevels=[];
    for(let li=0;li<CEFR.length;li++){
      const count=li===0?26:25;
      for(let step=1;step<=5;step++){
        let complete=true;
        for(let box=1;box<=count;box++) if(!value.passedBoxes.includes(keyBox(CEFR[li].id,step,box))){complete=false;break;}
        if(complete)value.passedSteps.push(keyStep(CEFR[li].id,step));
      }
      if([1,2,3,4,5].every(step=>value.passedSteps.includes(keyStep(CEFR[li].id,step))))value.passedLevels.push(CEFR[li].id);
    }
    value.languagePassed=value.passedLevels.includes('C1');
    value.videoResponses={};value.watchedVideos={};
    value.baseLanguage='';value.onboardingComplete=true;value.placementPending=false;value.placementResult=null;value.entryLevel=0;value.challengeLevel=null;
    return value;
  }
  function migrateEnglishLetterGateV6(value,previousVersion){
    if(previousVersion>=6)return value;
    const oldModules=value.modules&&typeof value.modules==='object'?value.modules:{};
    const oldNotes=value.notes&&typeof value.notes==='object'?value.notes:{};
    const shiftBoxMap=input=>{
      const out={};
      Object.entries(input||{}).forEach(([key,item])=>{
        const match=/^A1:(\d+):(\d+)$/.exec(key);
        if(!match){out[key]=item;return;}
        const box=Number(match[2]);
        if(box<=1)return;
        out['A1:'+match[1]+':'+(box-1)]=item;
      });
      return out;
    };
    value.modules=shiftBoxMap(oldModules);
    value.notes=shiftBoxMap(oldNotes);
    value.passedBoxes=arrayUnique((Array.isArray(value.passedBoxes)?value.passedBoxes:[]).flatMap(key=>{
      const match=/^A1:(\d+):(\d+)$/.exec(key);
      if(!match)return [key];
      const box=Number(match[2]);
      return box>1?['A1:'+match[1]+':'+(box-1)]:[];
    }));
    const legacyLetterProgress=value.letterProgress&&typeof value.letterProgress==='object'?value.letterProgress:{};
    const learned=arrayUnique(Object.values(legacyLetterProgress).flatMap(list=>Array.isArray(list)?list:[]).filter(letter=>LETTERS.includes(letter)));
    const legacyPassed=[1,2,3,4,5].some(step=>{
      const practiced=legacyLetterProgress[keyStep('A1',step)]||[];
      return LETTERS.every(letter=>practiced.includes(letter))&&Boolean(oldModules[keyBox('A1',step,1)]?.exam);
    });
    value.letterGateProgress=arrayUnique([...(Array.isArray(value.letterGateProgress)?value.letterGateProgress:[]),...learned]);
    value.letterGatePassed=Boolean(value.letterGatePassed||legacyPassed);
    value.activeGateLetter=LETTERS.includes(value.activeGateLetter)?value.activeGateLetter:(LETTERS.find(letter=>!value.letterGateProgress.includes(letter))||'D');
    if(Number(value.selectedLevel)===0)value.selectedBox=Math.max(1,(Number(value.selectedBox)||1)-1);
    return value;
  }

  function migrateDrivenCourseV7(value,previousVersion){
    if(previousVersion>=7)return value;
    const modules=value.modules&&typeof value.modules==='object'?value.modules:{};
    Object.entries(modules).forEach(([id,module])=>{
      if(!module||typeof module!=='object')return;
      if(module.pronunciation||module.review)module.vocabulary=true;
      if(/^A1:/.test(id)&&module.exam&&module.pronunciation)module.video=true;
      if(!/^A1:/.test(id)&&module.review)module.vocabulary=true;
    });
    value.modules=modules;
    value.entryLevel=0;
    value.challengeLevel=null;
    return value;
  }

  function languageState(){
    let stored=window.DafatiiData.readJSON(progressKey(),null);
    if(!stored){
      const legacy=window.DafatiiData.readJSON(legacyProgressKey(),null);
      if(legacy&&typeof legacy==='object'&&!Array.isArray(legacy)){
        stored=migrateLegacyLanguage(legacy);
        window.DafatiiData.writeJSON(progressKey(),stored);
      }
    }
    const value=stored&&typeof stored==='object'&&!Array.isArray(stored)?stored:defaultLanguageLearning();
    const previousVersion=Number(value.version)||0;
    migrateEnglishLetterGateV6(value,previousVersion);
    migrateDrivenCourseV7(value,previousVersion);
    value.version=META_VERSION;
    value.passedBoxes=Array.isArray(value.passedBoxes)?value.passedBoxes:[];
    value.passedSteps=Array.isArray(value.passedSteps)?value.passedSteps:[];
    value.passedLevels=Array.isArray(value.passedLevels)?value.passedLevels:[];
    value.languagePassed=Boolean(value.languagePassed);
    value.modules=value.modules&&typeof value.modules==='object'?value.modules:{};
    value.letterProgress=value.letterProgress&&typeof value.letterProgress==='object'?value.letterProgress:{};
    value.activeLetterByStep=value.activeLetterByStep&&typeof value.activeLetterByStep==='object'?value.activeLetterByStep:{};
    value.letterGateProgress=Array.isArray(value.letterGateProgress)?arrayUnique(value.letterGateProgress.filter(letter=>LETTERS.includes(letter))):[];
    value.activeGateLetter=LETTERS.includes(value.activeGateLetter)?value.activeGateLetter:(LETTERS.find(letter=>!value.letterGateProgress.includes(letter))||'D');
    value.letterGatePassed=Boolean(value.letterGatePassed);
    value.videoResponses=value.videoResponses&&typeof value.videoResponses==='object'?value.videoResponses:{};
    value.videoRatings=value.videoRatings&&typeof value.videoRatings==='object'?value.videoRatings:{};
    value.pronunciationRatings=value.pronunciationRatings&&typeof value.pronunciationRatings==='object'?value.pronunciationRatings:{};
    value.watchedVideos=value.watchedVideos&&typeof value.watchedVideos==='object'?value.watchedVideos:{};
    value.notes=value.notes&&typeof value.notes==='object'?value.notes:{};
    value.examHistory=Array.isArray(value.examHistory)?value.examHistory:[];
    value.targetLanguage=String(courseMeta().targetLanguage||value.targetLanguage||'English');
    value.baseLanguage=allowedBaseLanguages(value.targetLanguage).includes(value.baseLanguage)?value.baseLanguage:'';
    value.onboardingComplete=Boolean(value.onboardingComplete);
    value.placementPending=Boolean(value.placementPending);
    value.entryLevel=Math.min(4,Math.max(0,Number(value.entryLevel)||0));
    value.challengeLevel=null;
    if(previousVersion<8)window.DafatiiData.writeJSON(progressKey(),value);
    return value;
  }
  function updateLanguage(mutator){
    const state=languageState();
    mutator(state);
    window.DafatiiData.writeJSON(progressKey(),state);
    return state;
  }

  function languageIdentity(language){
    const value=String(language||'').trim().toLowerCase();
    if(['english','الإنجليزية','انجليزي','إنجليزي'].includes(value))return 'English';
    if(['arabic','العربية','عربي'].includes(value))return 'Arabic';
    return value;
  }
  function allowedBaseLanguages(target){
    const targetId=languageIdentity(target);
    return ['Arabic','English'].filter(language=>languageIdentity(language)!==targetId);
  }
  function courseTargetLanguage(state){return String(courseMeta().targetLanguage||state?.targetLanguage||'English').trim()||'English';}
  function learningLanguage(state,li){
    const target=courseTargetLanguage(state),allowed=allowedBaseLanguages(target),base=allowed.includes(state?.baseLanguage)?state.baseLanguage:(allowed[0]||'English');
    return {base,target,instruction:li>=4?target:base,immersion:li>=4};
  }
  function usesArabicBridge(state,li){return li<4&&learningLanguage(state,li).base==='Arabic';}
  function vocabularyMeaning(word,base){return base==='Arabic'?(ARABIC_VOCABULARY[String(word).toLowerCase()]||'—'):String(word);}
  function vocabularyPairs(state,pos,words){
    const mode=learningLanguage(state,pos.li);
    return words.map(word=>({target:String(word),meaning:mode.immersion?'':vocabularyMeaning(word,mode.base)}));
  }
  function grammarBridge(state,pos,data){
    const mode=learningLanguage(state,pos.li),arabic=usesArabicBridge(state,pos.li),translated=ARABIC_GRAMMAR[data.grammarTitle];
    return {title:arabic?(translated?.[0]||data.grammarTitle)+' · '+data.grammarTitle:data.grammarTitle,rule:arabic?(translated?.[1]||data.grammarRule):data.grammarRule,direction:arabic?'rtl':'ltr',base:mode.base,target:mode.target};
  }
  function speechLocale(language){
    return ({Arabic:'ar-SA',English:'en-US',Japanese:'ja-JP',French:'fr-FR',German:'de-DE',Spanish:'es-ES',Italian:'it-IT',Korean:'ko-KR',Chinese:'zh-CN'})[language]||'en-US';
  }
  function processLabels(state,li){
    const mode=learningLanguage(state,li);
    if(mode.instruction==='Arabic')return {back:'السابق',next:'التالي',finish:'إنهاء',item:'نشاط',of:'من',immersion:'انغماس كامل'};
    if(mode.instruction==='English')return {back:'Back',next:'Continue',finish:'Finish',item:'Activity',of:'of',immersion:'Full immersion'};
    return {back:'←',next:'→',finish:'✓',item:'',of:'/',immersion:mode.target};
  }
  function bridgeInstruction(state,pos,type,page){
    const mode=learningLanguage(state,pos.li);
    if(mode.immersion||page==='pronunciation'||page==='video')return mode.target+' only · listen, understand and respond directly in '+mode.target+'.';
    const arabic={
      sound:'استمع إلى النموذج باللغة الهدف، ثم كرره قبل النظر إلى النص.',words:'اربط كل كلمة في اللغة الهدف بمعناها العربي، ثم استرجع الكلمة من المعنى.',writing:'افهم المطلوب بالعربية، ثم اكتب إجابتك باللغة الهدف.',video:'شاهد وافهم وأجب باللغة الهدف مباشرة.',response:'أجب باللغة الهدف فقط.',dictation:'استمع باللغة الهدف واكتب ما تسمعه بدقة.',speaking:'حوّل المعنى العربي إلى جملة صحيحة باللغة الهدف وانطقها بوضوح.',rule:'افهم القاعدة بالعربية، ثم طبّقها في جملة باللغة الهدف.',steps:'استرجع المعنى بالعربية ثم أعد إنتاجه باللغة الهدف.',notes:'سجّل المعنى أو التصحيح بالعربية، واحتفظ بالأمثلة باللغة الهدف.',info:'افهم الفكرة بالعربية، ثم أعد إنتاجها باللغة الهدف.'
    };
    const english={
      sound:'Listen in the target language, then repeat before reading the model.',words:'Connect each target-language word to its English meaning, then retrieve it from meaning.',writing:'Understand the task in English, then write in the target language.',video:'Watch, understand and answer directly in the target language.',response:'Answer only in the target language.',dictation:'Listen in the target language and write exactly what you hear.',speaking:'Convert the English meaning into a clear target-language response.',rule:'Understand the rule through English, then apply it in the target language.',steps:'Retrieve the meaning in English, then reproduce it in the target language.',notes:'Keep meanings or corrections in English and examples in the target language.',info:'Understand the idea through English, then reproduce it in the target language.'
    };
    return (mode.base==='Arabic'?arabic:english)[type]||(mode.base==='Arabic'?arabic.info:english.info);
  }

  function wrapCourseCreation(){
    if(!window.DafatiiCourses || window.DafatiiCourses.__courseModesWrapped) return;
    const api=window.DafatiiCourses;
    const originalCreate=api.createCourse.bind(api);
    const originalRoomSeeds=api.roomSeeds.bind(api);
    api.createCourse=async input => {
      const type=COURSE_TYPES.includes(input.courseType)?input.courseType:'dafaa';
      if(type==='language'&&!isAdminActor())throw new Error('Administrator access is required for Language Course creation.');
      const course=await originalCreate(input);
      const suite=readSuite();
      suite.courseMeta={
        version:META_VERSION,courseType:type,targetLanguage:type==='language'?(input.targetLanguage||'English'):'',
        studyType:type==='language'?'courses':(input.studyType||'courses')
      };
      if(type==='language'){
        const initialProgress=defaultLanguageLearning();
        initialProgress.targetLanguage=input.targetLanguage||'English';
        window.DafatiiData.writeJSON('dafatii:language-progress:'+String(course.id)+':v3',initialProgress);
        window.DafatiiCourses.writeJSON('dafatii:subjects',[]);
        window.DafatiiCourses.writeJSON('dafatii:lectures',{});
        window.DafatiiCourses.writeJSON('dafatii:chatState:v1',{conversations:[],selected:{private:'',group:'',unknown:''},reported:[],blocked:[]});
      }
      if(type==='personal'){
        window.DafatiiCourses.writeJSON('dafatii:chatState:v1',{conversations:[],selected:{private:'',group:'',unknown:''},reported:[],blocked:[]});
      }
      writeSuite(suite);
      return course;
    };
    api.roomSeeds=() => courseType()==='personal' ? [{
      id:'personal-focus-room',name:'My Focus Room',subject:'Personal course',visibility:'private',pin:'',
      description:'A private single-room study studio for deep work, notes, materials and focused sessions.',
      vibe:'Deep focus',members:1,online:1,capacity:1,streak:0,accent:'✦',tags:['Private','Personal','Focus']
    }] : originalRoomSeeds();
    api.__courseModesWrapped=true;
  }

  function sheet(title,body){
    const root=document.getElementById('overlay-root');
    if(!root) return () => {};
    root.innerHTML='<div class="entity-sheet-overlay suite-overlay course-mode-overlay" id="course-mode-overlay"><section class="entity-sheet suite-sheet course-sheet course-mode-sheet" role="dialog" aria-modal="true"><div class="entity-sheet-handle" aria-hidden="true"></div><div class="entity-sheet-head"><div><small>Course setup</small><h2>'+esc(title)+'</h2></div><button class="icon-btn" id="course-mode-close" type="button" aria-label="Close">×</button></div>'+body+'</section></div>';
    const close=()=>{root.innerHTML='';};
    document.getElementById('course-mode-close').onclick=close;
    document.getElementById('course-mode-overlay').onclick=e=>{if(e.target.id==='course-mode-overlay')close();};
    return close;
  }

  function openTypeChooser(){
    const cards=[
      ['dafaa','◇','Create Dafaa','Full Dafatii course with subjects, calendar, study rooms and chat.','إنشاء دفعة','دورة دفاتري كاملة بالمواد والتقويم وغرف الدراسة والمحادثة.'],
      ['personal','◎','Create Personal course','Private solo course. No Chat app; Study Rooms becomes one focused personal room.','إنشاء دورة شخصية','دورة فردية بلا تطبيق المحادثة ومع غرفة دراسة شخصية واحدة.'],
      ['teaching','▣','Create Teaching course','The existing course workspace prepared for teaching and course management.','إنشاء دورة تدريس','مساحة الدورة الحالية مع أدوات التدريس والإدارة.'],
      ['language','Aa','Create Language course','A dedicated language-learning system with gated CEFR progression and six specialized pages.','إنشاء دورة لغة','نظام مستقل لتعلم اللغة مع تقدم CEFR وست صفحات متخصصة.']
    ].filter(card=>card[0]!=='language'||isAdminActor());
    sheet(lang()==='ar'?'إنشاء دورة':'Create a course','<div class="course-type-grid">'+cards.map(card=>{
      const title=lang()==='ar'?card[4]:card[2],desc=lang()==='ar'?card[5]:card[3];
      return '<button class="course-type-card '+card[0]+'" type="button" data-course-type="'+card[0]+'"><span>'+card[1]+'</span><div><strong>'+esc(title)+'</strong><p>'+esc(desc)+'</p></div><b>›</b></button>';
    }).join('')+'</div>');
    document.querySelectorAll('[data-course-type]').forEach(button=>button.onclick=()=>openCourseForm(button.dataset.courseType));
  }

  function studyTypeOptions(){
    return [['courses','Courses'],['chapters','Chapters'],['systems','Systems'],['blocks','Blocks']].map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join('');
  }

  function openCourseForm(type){
    const templates=window.DafatiiCourses.templates();
    const actor=window.DafatiiCourses.actor||window.DafatiiAuth.user;
    const isAdmin=actor && actor.platformRole==='admin';
    if(type==='language'&&!isAdmin)return;
    const isLang=type==='language',isPersonal=type==='personal';
    const defaultName=isLang?'English Learning':isPersonal?'My Personal Course':'';
    const personalSecret=isPersonal
      ? (crypto.randomUUID?crypto.randomUUID().replace(/-/g,'').slice(0,20):(Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)).slice(0,20))
      : '';
    const templateField=isLang?'<input type="hidden" name="templateName" value="Computer Science">':'<div class="field"><label>Content template</label><select name="templateName">'+templates.map(name=>'<option>'+esc(name)+'</option>').join('')+'</select></div>';
    const studyField=isLang?'<input type="hidden" name="studyType" value="courses"><div class="field"><label>Target language</label><select name="targetLanguage"><option value="English" selected>English · الإنجليزية</option></select><p class="auth-note">Letters prerequisite · 5 driven levels · 5 steps per level · 25 boxes per step · 625 learning boxes · 6 main course pages.</p></div>':'<div class="field"><label>Study structure</label><select name="studyType">'+studyTypeOptions()+'</select></div>';
    const visibility=isPersonal
      ? '<input type="hidden" name="visibility" value="private"><div class="field"><label>Visibility</label><div class="course-private-lock">Personal · only this account uses the workspace</div></div>'
      : isAdmin
        ? '<div class="field"><label>Visibility</label><select name="visibility"><option value="public">Public</option><option value="private">Private by code</option></select></div>'
        : '<input type="hidden" name="visibility" value="private"><div class="field"><label>Visibility</label><div class="course-private-lock">Private · your academic profile remains protected</div></div>';
    const pricing=isPersonal
      ? '<input type="hidden" name="pricing" value="free"><input type="hidden" name="priceMinor" value="0">'
      : '<div class="field"><label>Pricing</label><select name="pricing"><option value="free">Free</option><option value="paid">Paid</option></select></div><div class="field"><label>Price (minor units)</label><input name="priceMinor" type="number" min="0" value="0"></div>';
    const joinPolicy=isPersonal
      ? '<input type="hidden" name="joinPolicy" value="approval">'
      : '<div class="field"><label>Join policy</label><select name="joinPolicy"><option value="approval">Needs acceptance</option><option value="direct">Direct join</option></select></div>';
    const access=isPersonal
      ? '<input type="hidden" name="accessCode" value="'+esc(personalSecret)+'"><div class="course-private-lock">Solo mode: Chat is disabled and Study Rooms is replaced by one private Focus Room.</div>'
      : '<div class="field"><label>Private access code</label><input name="accessCode" type="password" minlength="6" maxlength="64" '+(isAdmin?'':'required')+'></div>';
    const adminMetadata=isAdmin?'<div class="field"><label>Learning field</label><input name="learningField" maxlength="80" value="'+(isLang?'Languages':'')+'"></div><div class="field"><label>Difficulty</label><select name="difficultyLevel"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option></select></div>':'';
    const title={dafaa:'Create Dafaa',personal:'Create Personal course',teaching:'Create Teaching course',language:'Create Language course'}[type]||'Create course';
    const close=sheet(title,'<form id="course-mode-form"><input type="hidden" name="courseType" value="'+esc(type)+'"><div class="field"><label>Course name</label><input name="name" maxlength="120" value="'+esc(defaultName)+'" required></div>'+templateField+studyField+'<div class="suite-form-grid"><div class="field"><label>Institution</label><input name="institution" maxlength="160"></div>'+(isAdmin?'<div class="field"><label>Stage</label><select name="stage"><option value="university" selected>Higher education</option><option value="independent">Independent</option></select></div>':'<input type="hidden" name="stage" value="university">')+pricing+visibility+joinPolicy+adminMetadata+'</div>'+access+'<button class="btn btn-primary auth-submit" type="submit">Create course</button><p class="auth-note" id="course-mode-status"></p></form>');
    const form=document.getElementById('course-mode-form');
    form.onsubmit=async event=>{
      event.preventDefault();
      const data=Object.fromEntries(new FormData(form));
      data.priceMinor=Number(data.priceMinor||0);
      const status=document.getElementById('course-mode-status'),submit=form.querySelector('button[type=submit]');
      submit.disabled=true;status.textContent=isLang?'Building the English curriculum…':'Creating secure course workspace…';
      try{
        await window.DafatiiCourses.createCourse(data);
        close();
        setHash(type==='language'?'language-home':'dashboard/overview');
      }catch(error){status.textContent=error.message;submit.disabled=false;}
    };
  }

  function installCreateInterceptor(){
    document.addEventListener('click',event=>{
      const button=event.target.closest && event.target.closest('#course-add');
      if(!button)return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openTypeChooser();
    },true);
  }

  function boxCount(){ return 25; }
  function firstLearningBox(){ return 1; }
  function isLetterBox(){ return false; }
  function letterProgressKey(li,step){ return keyStep(CEFR[li].id,step); }
  function isBoxPassed(state,li,step,box){ return state.passedBoxes.includes(keyBox(CEFR[li].id,step,box)); }
  function isStepPassed(state,li,step){ return state.passedSteps.includes(keyStep(CEFR[li].id,step)); }
  function isLevelPassed(state,li){ return state.passedLevels.includes(CEFR[li].id); }
  function levelUnlocked(state,li){
    if(li===0)return true;
    for(let level=0;level<li;level++) if(!isLevelPassed(state,level))return false;
    return true;
  }
  function stepUnlocked(state,li,step){ return levelUnlocked(state,li) && (step===1 || isStepPassed(state,li,step-1)); }
  function boxUnlocked(state,li,step,box){ return stepUnlocked(state,li,step) && (box===1 || isBoxPassed(state,li,step,box-1)); }

  function clampSelection(state){
    const entry=0;
    let li=Math.min(4,Math.max(0,Number(state.selectedLevel)||entry));
    if(!levelUnlocked(state,li))li=entry;
    let step=Math.min(5,Math.max(1,Number(state.selectedStep)||1));
    while(step>1&&!stepUnlocked(state,li,step))step--;
    let box=Math.min(boxCount(li),Math.max(1,Number(state.selectedBox)||1));
    while(box>1&&!boxUnlocked(state,li,step,box))box--;
    state.selectedLevel=li;state.selectedStep=step;state.selectedBox=box;
    return {li,step,box};
  }

  function pickWrapped(array,start,count){
    const out=[];
    for(let i=0;i<count;i++) out.push(array[(start+i)%array.length]);
    return out;
  }
  function boxData(li,step,box){
    const level=CEFR[li],profile=LEVEL_LEARNING_SYSTEMS[li],normalIndex=Math.max(0,box-firstLearningBox(li)),seed=(step-1)*25+normalIndex;
    const topic=level.topics[seed%level.topics.length];
    const grammar=level.grammar[seed%level.grammar.length];
    const languageFunction=LANGUAGE_FUNCTIONS[normalIndex%LANGUAGE_FUNCTIONS.length];
    const phase=['recognition','controlled production','connected use','independent use','transfer'][step-1];
    const words=pickWrapped(level.words,(seed*3+step)%level.words.length,7);
    const sound=level.sounds[seed%level.sounds.length];
    const frames=[
      ['I practice '+topic+' with '+words[0]+' and '+words[1]+'.','Please say: '+words[2]+' is important for my '+topic+'.'],
      ['Yesterday I used '+words[0]+' while working on '+topic+', and today I am improving '+words[1]+'.','Explain why '+words[2]+' is useful when discussing '+topic+'.'],
      ['Although '+topic+' can be challenging, '+words[0]+' helps me make a better '+words[1]+'.','Give a connected explanation of '+topic+' using '+words[2]+' and '+words[3]+'.'],
      ['A credible discussion of '+topic+' should evaluate '+words[0]+' as well as its '+words[1]+'.','Summarize a balanced position on '+topic+' and justify one '+words[2]+'.'],
      ['A nuanced account of '+topic+' should distinguish the central '+words[0]+' from a merely '+words[1]+' consideration.','Articulate a defensible position on '+topic+', qualify its main '+words[2]+', and acknowledge one counterargument.']
    ][li];
    return {
      level:level.id,levelNumber:profile.number,learningSystem:profile.name,design:profile.design,difficulty:profile.difficulty,examStyle:profile.examStyle,targetOutcome:profile.target,step,box,topic,languageFunction,phase,title:'Box '+box+' · '+topic+' · '+languageFunction,
      goal:'Complete this '+phase+' lesson for '+languageFunction+': vocabulary & writing, listening & talking, grammar & rules, admin YouTube understanding, then the dedicated exam.',
      pronunciationFocus:sound+' · '+languageFunction,pronunciationWords:words.slice(0,6),
      writingPrompt:'For '+phase+', practice '+languageFunction+': write two clear sentences about '+topic+' using '+words[0]+' and '+words[1]+'. Apply '+grammar[0]+'.',
      voicePrompt:frames[0]+' The communication focus is '+languageFunction+'.',reversePrompt:frames[1]+' Use it for '+languageFunction+'.',grammarTitle:grammar[0],grammarRule:grammar[1],grammarExample1:grammar[2],grammarExample2:grammar[3],
      naming:'Naming rule: prefer a clear concrete noun first, then add only the modifiers needed to identify it in context.',
      typing:li<2?'Writing rule: start sentences with a capital letter, separate words with one space, and close complete statements with punctuation.':'Writing rule: use punctuation and paragraph boundaries to expose syntax, information structure and logical relations rather than merely marking pauses.',
      words, trick:['Say it, cover it, retrieve it, then check it.','Alternate recognition with production instead of rereading.','Compress the idea into one sentence, then expand it from memory.','Contrast a correct example with a near-miss and explain the difference.','Rephrase the idea twice: once plainly and once in formal C1 register.'][li],
      recall:'Without looking back, explain '+grammar[0]+' and use '+words[0]+', '+words[1]+' and '+words[2]+' to perform '+languageFunction+' during '+phase+'.'
    };
  }

  function videoLessonData(li,step,box){
    const data=boxData(li,step,box);
    const query=[String(courseMeta().targetLanguage||'English'),CEFR[li].id,data.topic,data.grammarTitle,'listening lesson'].join(' ');
    return {
      id:keyBox(CEFR[li].id,step,box),
      title:data.title,
      youtubeUrl:'',
      responseLanguage:String(courseMeta().targetLanguage||'English')
    };
  }

  const LANGUAGE_CONTENT_PAGE_ROUTES = {
    letters:'language-letters',voice:'language-voice',grammar:'language-grammar',video:'language-video',examine:'language-examine'
  };
  const languageContentStoreKey=()=> 'dafatii:language-authoring:v1';
  let languageAuthoringTarget=null;
  function languageContentStore(){
    const raw=window.DafatiiCourses.readJSON(languageContentStoreKey(),{})||{};
    return {
      pages:raw.pages&&typeof raw.pages==='object'?raw.pages:{},
      exams:raw.exams&&typeof raw.exams==='object'?raw.exams:{}
    };
  }
  function writeLanguageContentStore(store){
    if(!isAdminActor())throw new Error('Administrator access is required for Language Course authoring.');
    window.DafatiiCourses.writeJSON(languageContentStoreKey(),store);
    return store;
  }
  function contentPageKey(li,step,box,page){return CEFR[li].id+':'+step+':'+box+':'+page;}
  function examStoreKey(ctx){return ctx.scope+':'+CEFR[ctx.li].id+':'+ctx.step+':'+ctx.box;}
  function contentItemId(prefix){return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);}
  function adminLanguageAuthoring(){return isAdminActor()&&Boolean(languageAuthoringTarget);}
  function normalizeAuthoringTarget(selection={}){
    const li=Math.min(4,Math.max(0,Number(selection.li)||0));
    const step=Math.min(5,Math.max(1,Number(selection.step)||1));
    const box=Math.min(boxCount(li),Math.max(1,Number(selection.box)||1));
    return {li,step,box};
  }
  function setLanguageAuthoringTarget(selection={}){
    if(!isAdminActor())return false;
    languageAuthoringTarget=normalizeAuthoringTarget({...languageAuthoringTarget,...selection});
    window.dispatchEvent(new CustomEvent('dafatii:languageauthoringtarget',{detail:{...languageAuthoringTarget}}));
    return true;
  }
  function activeLanguagePosition(state){return adminLanguageAuthoring()?{...languageAuthoringTarget}:clampSelection(state);}
  function languagePageName(page,li){
    if(page==='letters')return 'Vocabulary & writing';
    return {voice:'Listening & talking',grammar:'Grammar & rules',video:'YouTube understanding',review:'Revision',examine:'Examining'}[page]||page;
  }
  function defaultLanguageContentItems(li,step,box,page){
    const data=isLetterBox(li,box)?null:boxData(li,step,box);
    const state=languageState(),pos={li,step,box},mode=learningLanguage(state,li),arabic=usesArabicBridge(state,li);
    const rule=data?grammarBridge(state,pos,data):null;
    const pairs=data?vocabularyPairs(state,pos,data.words):[];
    if(page==='letters'&&li===0&&isLetterBox(li,box)){
      return [
        {id:'letter-purpose',type:'info',eyebrow:'Letters box',title:'Learn each English letter separately',body:'Hear the letter name, study uppercase and lowercase forms, then trace both accurately before moving forward.'},
        {id:'letter-method',type:'info',eyebrow:'Learning method',title:'Listen · Look · Draw · Check',body:'Hear the isolated letter name, inspect both forms, draw uppercase and lowercase separately, and repeat any weak form before continuing.'},
        {id:'letter-phonics',type:'info',eyebrow:'Phonics',title:'Connect names, shapes and sounds',body:'Letter names identify symbols; example words help connect each symbol to a common English sound. Complete A–Z in every A1 step.'}
      ];
    }
    if(!data&&page!=='examine')return [];
    if(page==='letters'){
      const profile=LEVEL_LEARNING_SYSTEMS[li];
      const writingBody=[
        'Write each target word accurately, connect it to its meaning, then use two of the words in very short sentences.',
        'Build clear simple sentences using the target words. Change one detail in each sentence while keeping the meaning clear.',
        'Write connected moderate sentences about '+data.topic+' using precise vocabulary and at least one linking expression.',
        'Write advanced sentences about '+data.topic+' that distinguish meaning, register and collocation.',
        'Write a concise C1-style response about '+data.topic+' using precise collocation, controlled stance and deliberate reformulation.'
      ][li];
      return [
        {id:'vocabulary-set',type:'words',eyebrow:profile.name+' · vocabulary',title:profile.vocabulary,body:'Study meaning and spelling, retrieve each target word from its meaning, and use it in writing.',words:data.words,wordPairs:pairs},
        {id:'vocabulary-writing',type:'writing',eyebrow:'Vocabulary → writing',title:['Simple words','Simple sentences','Moderate words & sentences','Advanced words & sentences','Advanced C1 language'][li],body:writingBody,placeholder:['Write the words and two short sentences…','Write 3–4 simple sentences…','Write a connected short paragraph…','Write precise advanced sentences…','Write a concise C1 response…'][li]}
      ];
    }
    if(page==='video'){
      const video=videoLessonData(li,step,box);
      return [
        {id:'video-lesson',type:'video',eyebrow:'Admin YouTube lesson',title:video.title,youtubeUrl:video.youtubeUrl,responseLanguage:video.responseLanguage},
        {id:'video-response',type:'response',eyebrow:'YouTube understanding',title:'Write what you understood',body:['Tell what the video is mainly about and one correct thing you understood.','Explain the main idea and the simple sentences or details you understood.','Explain the main idea, important details and any relationship you understood.','Explain the argument, key details, contrasts or inference you understood.','Synthesize the speaker’s position, evidence, implication and important relationships you understood.'][li],placeholder:'Write only what you understood from this video…'}
      ];
    }
    if(page==='voice'){
      const pronunciationTarget=data.words[0];
      return [
        {id:'pronunciation',type:'pronunciation',eyebrow:'Microphone pronunciation',title:'Pronounce: '+pronunciationTarget,targetText:pronunciationTarget,body:'Open the microphone and pronounce the requested word clearly. Gemini judges the actual recording; bad must be repeated, while moderate, good and very good are accepted.'},
        {id:'dictation',type:'dictation',eyebrow:'Listening → text',title:'Listen, then write exactly what you hear',audioText:data.voicePrompt,placeholder:'Type the complete sentence you hear.'},
        {id:'speaking',type:'speaking',eyebrow:arabic?'التحدث بالإنجليزية':'Speaking',title:arabic?'عبّر عن المعنى بصوتك':'Speak the requested sentence',body:arabic?'قل بالإنجليزية: '+data.reversePrompt:data.reversePrompt,targetText:data.reversePrompt,placeholder:'Recognition transcript or type your spoken sentence here.'}
      ];
    }
    if(page==='grammar'){
      return [
        {id:'grammar-rule',type:'rule',eyebrow:arabic?'شرح القاعدة بالعربية':'Grammar & rules',title:rule.title,body:rule.rule,example1:data.grammarExample1,example2:data.grammarExample2,direction:rule.direction},
        {id:'grammar-practice',type:'grammar-practice',eyebrow:arabic?'تطبيق القاعدة':'Rule practice',title:arabic?'طبّق القاعدة فقط':'Apply this rule',body:arabic?'اكتب مثالين يطبّقان '+rule.title+' بدقة. الهدف هنا هو القاعدة، وليس تعلم مفردات جديدة.':'Write two examples that accurately apply '+data.grammarTitle+'. Focus only on the rule and form.',placeholder:arabic?'اكتب مثالين يطبّقان القاعدة…':'Write two rule examples…'}
      ];
    }
    if(page==='review'){
      return [
        {id:'review-vocab',type:'words',eyebrow:arabic?'مفردات نشطة':'Active vocabulary',title:arabic?'انظر إلى المعنى العربي واسترجع الإنجليزية':'Retrieve before you reveal',body:arabic?'غطِّ الكلمة الإنجليزية، استرجعها من المعنى العربي، ثم انطقها واستخدمها في جملة.':'Try to define or use each word before listening or looking back.',words:data.words,wordPairs:pairs},
        {id:'review-trick',type:'steps',eyebrow:arabic?'طريقة التعلّم':'Learning method',title:arabic?'دورة استرجاع من أربع مراحل':'Four-pass retrieval cycle',body:arabic?'استرجع القاعدة والمفردات من العربية إلى الإنجليزية دون فتح الدرس.':data.recall,steps:arabic?['حاول من الذاكرة بالعربية إلى الإنجليزية.','تحقق من النموذج بعد المحاولة فقط.','صحّح أصغر خطأ محدد.','كرر الإنتاج بعد فترة قصيرة.']:['Attempt from memory.','Check only after the attempt.','Correct the smallest specific error.','Repeat after a short delay.']},
        {id:'review-memory',type:'info',eyebrow:arabic?'ترسيخ القاعدة':'Memory trick',title:arabic?'لخّص · قارن · أعد البناء':'Compress · contrast · reconstruct',body:arabic?'لخّص '+rule.title+' بالعربية في سطر، قارن مثالاً إنجليزياً صحيحاً بآخر قريب خاطئ، ثم أعد بناء القاعدة من الذاكرة.':'Compress '+data.grammarTitle+' into one sentence, contrast a correct example with a near-miss, then reconstruct the rule from memory.'},
        {id:'review-recall',type:'info',eyebrow:arabic?'استرجاع حر':'Free recall',title:arabic?'أنتج دون النظر':'Explain without looking',body:arabic?'اشرح القاعدة بالعربية، ثم أنشئ جملة إنجليزية تستخدم '+pairs.slice(0,3).map(pair=>pair.target).join(' و ')+'.':data.recall},
        {id:'review-notes',type:'notes',eyebrow:arabic?'ملاحظات':'Notes',title:arabic?'احتفظ فقط بما يساعد الاسترجاع':'Keep only what will help future recall',body:arabic?'احفظ المعنى العربي أو التصحيح بالعربية، واترك الأمثلة دائماً باللغة الإنجليزية.':'Save difficult examples, corrections or mnemonics.',placeholder:arabic?'المعنى، الخطأ، التصحيح، مثال إنجليزي…':'Examples, mistakes and mnemonics…'}
      ];
    }
    if(page==='examine')return [];

    return [];
  }

  const LANGUAGE_PAGE_ITEM_TYPES = Object.freeze({
    letters:['words','writing'],
    voice:['pronunciation','dictation','speaking'],
    grammar:['rule','grammar-practice'],
    video:['video','response'],
    review:['words','steps','notes','info'],
    examine:[]
  });
  function pagePureItems(page,items){
    const allowed=LANGUAGE_PAGE_ITEM_TYPES[page]||[];
    return (Array.isArray(items)?items:[]).filter(item=>allowed.includes(item?.type));
  }
  function languagePageItems(li,step,box,page){
    const store=languageContentStore(),key=contentPageKey(li,step,box,page);
    const items=Object.prototype.hasOwnProperty.call(store.pages,key)
      ? (Array.isArray(store.pages[key])?store.pages[key]:[])
      : defaultLanguageContentItems(li,step,box,page);
    return pagePureItems(page,items);
  }
  function mutateLanguagePageItems(selection,mutator){
    const store=languageContentStore(),key=contentPageKey(selection.li,selection.step,selection.box,selection.page);
    const items=Object.prototype.hasOwnProperty.call(store.pages,key)
      ? (Array.isArray(store.pages[key])?[...store.pages[key]]:[])
      : defaultLanguageContentItems(selection.li,selection.step,selection.box,selection.page).map(item=>({...item}));
    store.pages[key]=pagePureItems(selection.page,mutator(items)||items);
    writeLanguageContentStore(store);
    return store.pages[key];
  }
  function languageItemSchemas(page,li){
    const schemas={
      letters:[
        {type:'words',label:'Vocabulary set',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'body',label:'Vocabulary instructions',kind:'textarea'},{name:'words',label:'Words (one per line)',kind:'lines'}]},
        {type:'writing',label:'Writing task',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'body',label:'Writing prompt',kind:'textarea'},{name:'placeholder',label:'Placeholder',kind:'text'}]}
      ],
      voice:[
        {type:'pronunciation',label:'Microphone pronunciation',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Prompt title',kind:'text'},{name:'body',label:'Instructions',kind:'textarea'},{name:'targetText',label:'Requested word or letter',kind:'text'}]},
        {type:'dictation',label:'Listening / dictation',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'audioText',label:'Audio text',kind:'textarea'},{name:'placeholder',label:'Input placeholder',kind:'text'}]},
        {type:'speaking',label:'Speaking task',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'body',label:'Speaking prompt',kind:'textarea'},{name:'targetText',label:'Expected spoken text',kind:'textarea'},{name:'placeholder',label:'Transcript placeholder',kind:'text'}]}
      ],
      grammar:[
        {type:'rule',label:'Grammar rule',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Rule title',kind:'text'},{name:'body',label:'Rule explanation',kind:'textarea'},{name:'example1',label:'Example 1',kind:'text'},{name:'example2',label:'Example 2',kind:'text'}]},
        {type:'grammar-practice',label:'Rule practice',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'body',label:'Rule practice prompt',kind:'textarea'},{name:'placeholder',label:'Placeholder',kind:'text'}]}
      ],
      video:[
        {type:'video',label:'Admin YouTube video',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'youtubeUrl',label:'YouTube URL',kind:'text'}]},
        {type:'response',label:'Understanding response',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'body',label:'Understanding prompt',kind:'textarea'},{name:'placeholder',label:'Placeholder',kind:'text'}]}
      ],
      review:[
        {type:'words',label:'Vocabulary set',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'words',label:'Words (one per line)',kind:'lines'}]},
        {type:'steps',label:'Learning method',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'body',label:'Recall prompt',kind:'textarea'},{name:'steps',label:'Steps (one per line)',kind:'lines'}]},
        {type:'notes',label:'Notes box',fields:[{name:'eyebrow',label:'Label',kind:'text'},{name:'title',label:'Title',kind:'text'},{name:'body',label:'Instructions',kind:'textarea'},{name:'placeholder',label:'Placeholder',kind:'text'}]}
      ],
      examine:[]
    };
    return schemas[page]||[];
  }
  function createLanguageItem(selection,type){
    const schemas=languageItemSchemas(selection.page,selection.li),schema=schemas.find(item=>item.type===type)||schemas[0];
    if(!schema)throw new Error('This page is managed by its dedicated assessment controls, not lesson content items.');
    const item={id:contentItemId(type),type:schema.type};
    schema.fields.forEach(field=>{item[field.name]=field.kind==='lines'?[]:(field.kind==='select'?(field.options?.[0]||''):'');});
    return item;
  }
  function saveLanguageItem(selection,item){
    const normalized={...item,id:item.id||contentItemId(item.type||'item')};
    return mutateLanguagePageItems(selection,items=>{
      const index=items.findIndex(candidate=>candidate.id===normalized.id);
      if(index>=0)items[index]=normalized;else items.push(normalized);
      return items;
    });
  }
  function deleteLanguageItem(selection,id){return mutateLanguagePageItems(selection,items=>items.filter(item=>item.id!==id));}
  function emptyLanguagePage(selection){return mutateLanguagePageItems(selection,()=>[]);}
  function resetLanguagePage(selection){
    const store=languageContentStore(),key=contentPageKey(selection.li,selection.step,selection.box,selection.page);
    delete store.pages[key];writeLanguageContentStore(store);
    return languagePageItems(selection.li,selection.step,selection.box,selection.page);
  }
  function naturalExamContext(li,step,box){
    const last=boxCount(li);
    if(box<last)return {scope:'box',li,step,box};
    if(step<5)return {scope:'step',li,step,box:last};
    if(li<4)return {scope:'level',li,step:5,box:last};
    return {scope:'language',li:4,step:5,box:last};
  }
  function defaultExamQuestions(ctx){return defaultAssessmentQuestions(ctx);}
  function defaultExamQuestionItems(ctx){
    const suffix=ctx.scope+'-'+CEFR[ctx.li].id+'-'+ctx.step+'-'+ctx.box;
    return defaultExamQuestions(ctx).map((q,index)=>({...q,id:q.id||('q-'+index+'-'+suffix)}));
  }
  function examQuestionsFor(ctx){
    const store=languageContentStore(),key=examStoreKey(ctx);
    return Object.prototype.hasOwnProperty.call(store.exams,key)
      ? (Array.isArray(store.exams[key])?store.exams[key]:[])
      : defaultExamQuestionItems(ctx);
  }
  function mutateExamQuestions(selection,mutator){
    const ctx=naturalExamContext(selection.li,selection.step,selection.box),store=languageContentStore(),key=examStoreKey(ctx);
    const questions=Object.prototype.hasOwnProperty.call(store.exams,key)
      ? (Array.isArray(store.exams[key])?[...store.exams[key]]:[])
      : defaultExamQuestionItems(ctx).map(q=>({...q}));
    store.exams[key]=mutator(questions)||questions;writeLanguageContentStore(store);return store.exams[key];
  }
  function saveExamQuestion(selection,question){
    const q={...question,id:question.id||contentItemId('question'),options:Array.isArray(question.options)?question.options:[]};
    return mutateExamQuestions(selection,items=>{const index=items.findIndex(item=>item.id===q.id);if(index>=0)items[index]=q;else items.push(q);return items;});
  }
  function deleteExamQuestion(selection,id){return mutateExamQuestions(selection,items=>items.filter(item=>(item.id||'')!==id));}
  function emptyExamQuestions(selection){return mutateExamQuestions(selection,()=>[]);}
  function beginLanguageAuthoring(selection){
    if(!isAdminActor())return false;
    setLanguageAuthoringTarget(selection);
    const route=LANGUAGE_CONTENT_PAGE_ROUTES[selection.page]||'language-letters';
    if((location.hash||'').replace(/^#\/?/,'').split('/')[0]===route)render();else setHash(route);
    return true;
  }
  function endLanguageAuthoring(){languageAuthoringTarget=null;render();}

  function boxStudyComplete(state,li,step,box){
    const id=keyBox(CEFR[li].id,step,box),module=state.modules[id]||{};
    if(isLetterBox(li,box)){
      const practiced=state.letterProgress[letterProgressKey(li,step)]||[];
      return LETTERS.every(letter=>practiced.includes(letter));
    }
    const required=['vocabulary','voice','grammar','video'];
    return required.every(name=>module[name]===true);
  }
  function boxExamPassed(state,li,step,box){
    return Boolean((state.modules[keyBox(CEFR[li].id,step,box)]||{}).exam);
  }
  function syncBoxCompletion(state,li,step,box){
    const id=keyBox(CEFR[li].id,step,box);
    const complete=boxStudyComplete(state,li,step,box)&&boxExamPassed(state,li,step,box);
    if(complete&&!state.passedBoxes.includes(id))state.passedBoxes.push(id);
    if(!complete)state.passedBoxes=state.passedBoxes.filter(item=>item!==id);
    state.passedBoxes=arrayUnique(state.passedBoxes);
    return complete;
  }
  function markModule(module){
    updateLanguage(state=>{
      const pos=clampSelection(state);
      if(isLetterBox(pos.li,pos.box))return;
      const id=keyBox(CEFR[pos.li].id,pos.step,pos.box);
      state.modules[id]=state.modules[id]||{};
      state.modules[id][module]=true;
      syncBoxCompletion(state,pos.li,pos.step,pos.box);
    });
    render();
  }
  const LEARNING_LANE_PREREQUISITES = {
    'language-letters':[],
    'language-voice':['vocabulary'],
    'language-grammar':['vocabulary','voice'],
    'language-video':['vocabulary','voice','grammar']
  };
  function learningLaneUnlocked(state,pos,page){
    if(adminLanguageAuthoring())return true;
    const required=LEARNING_LANE_PREREQUISITES[page];
    if(!required)return true;
    const module=state.modules[keyBox(CEFR[pos.li].id,pos.step,pos.box)]||{};
    return required.every(name=>module[name]===true);
  }

  function nextBoxRoute(state,pos){
    if(isLetterBox(pos.li,pos.box))return 'language-letters';
    const module=state.modules[keyBox(CEFR[pos.li].id,pos.step,pos.box)]||{};
    if(!module.vocabulary)return 'language-letters';
    if(!module.voice)return 'language-voice';
    if(!module.grammar)return 'language-grammar';
    if(!module.video)return 'language-video';
    return 'language-examine';
  }
  function missingRequirements(state,pos){
    if(isLetterBox(pos.li,pos.box)){
      const practiced=state.letterProgress[letterProgressKey(pos.li,pos.step)]||[];
      const missing=LETTERS.filter(letter=>!practiced.includes(letter));
      return missing.length?['Practice and draw '+missing.length+' remaining letter'+(missing.length===1?'':'s')]:[];
    }
    const module=state.modules[keyBox(CEFR[pos.li].id,pos.step,pos.box)]||{};
    const required=['vocabulary','voice','grammar','video'];
    const labels={vocabulary:'Vocabulary & writing',voice:'Listening & talking',grammar:'Grammar & rules',video:'YouTube understanding'};
    return required.filter(name=>!module[name]).map(name=>labels[name]);
  }
  function boundaryReady(state,li,step){
    const last=boxCount(li);
    for(let box=1;box<last;box++) if(!isBoxPassed(state,li,step,box))return false;
    return boxStudyComplete(state,li,step,last);
  }
  function currentAssessment(state,pos){
    const last=boxCount(pos.li);
    if(pos.box<last)return {scope:'box',li:pos.li,step:pos.step,box:pos.box};
    if(pos.step<5)return {scope:'step',li:pos.li,step:pos.step,box:last};
    if(pos.li<4)return {scope:'level',li:pos.li,step:5,box:last};
    return {scope:'language',li:4,step:5,box:last};
  }
  function assessmentMissing(state,ctx){
    if(ctx.scope==='box')return missingRequirements(state,{li:ctx.li,step:ctx.step,box:ctx.box});
    if(ctx.scope==='step'){
      if(!boundaryReady(state,ctx.li,ctx.step))return ['Finish every earlier box in this step and complete the last box learning pages'];
      return [];
    }
    if(ctx.scope==='level'){
      for(let step=1;step<5;step++)if(!isStepPassed(state,ctx.li,step))return ['Pass Steps 1–4 before the level examination'];
      if(!boundaryReady(state,ctx.li,5))return ['Finish every box in Step 5 before the level examination'];
      return [];
    }
    if(ctx.scope==='language'){
      for(let li=0;li<4;li++)if(!isLevelPassed(state,li))return ['Finish Levels 1–4 in order before the whole-language examination'];
      for(let step=1;step<5;step++)if(!isStepPassed(state,4,step))return ['Pass C1 Steps 1–4 before the whole-language examination'];
      if(!boundaryReady(state,4,5))return ['Finish every box in the final C1 step before the whole-language examination'];
      return [];
    }
    return [];
  }
  function assessmentPassed(state,ctx){
    if(ctx.scope==='box')return boxExamPassed(state,ctx.li,ctx.step,ctx.box);
    if(ctx.scope==='step')return isStepPassed(state,ctx.li,ctx.step);
    if(ctx.scope==='level')return isLevelPassed(state,ctx.li);
    if(ctx.scope==='language')return state.languagePassed;
    return false;
  }
  function applyAssessmentPass(state,ctx){
    const id=CEFR[ctx.li].id,last=boxCount(ctx.li),finalId=keyBox(id,ctx.step,last);
    if(ctx.scope==='box'){
      const boxId=keyBox(id,ctx.step,ctx.box);
      state.modules[boxId]=state.modules[boxId]||{};
      state.modules[boxId].exam=true;
      if(syncBoxCompletion(state,ctx.li,ctx.step,ctx.box)){
        state.selectedLevel=ctx.li;state.selectedStep=ctx.step;state.selectedBox=Math.min(last,ctx.box+1);
      }
      return;
    }
    state.modules[finalId]=state.modules[finalId]||{};
    state.modules[finalId].exam=true;
    syncBoxCompletion(state,ctx.li,ctx.step,last);
    if(ctx.scope==='step'){
      state.passedSteps=arrayUnique([...state.passedSteps,keyStep(id,ctx.step)]);
      state.selectedLevel=ctx.li;state.selectedStep=ctx.step+1;state.selectedBox=1;
      return;
    }
    state.passedSteps=arrayUnique([...state.passedSteps,keyStep(id,5)]);
    state.passedLevels=arrayUnique([...state.passedLevels,id]);
    if(ctx.scope==='level'){
      state.selectedLevel=Math.min(4,ctx.li+1);state.selectedStep=1;state.selectedBox=1;
      return;
    }
    state.languagePassed=true;
  }
  function applyLevelChallengePass(state,li){
    state.passedLevels=arrayUnique([...state.passedLevels,CEFR[li].id]);
    state.challengeLevel=null;
  }

  function languageHeader(state,pos,kicker,title,description){
    const level=CEFR[pos.li];
    return '<header class="language-page-head"><div><small>'+esc(kicker)+'</small><h1>'+esc(title)+'</h1><p>'+esc(description)+'</p></div><div class="language-context"><button type="button" data-language-ui-switch>'+(lang()==='ar'?'EN':'ع')+'</button><span>'+level.id+'</span><span>'+t('step')+' '+pos.step+'</span><span>'+t('box')+' '+pos.box+'</span></div></header>';
  }

  function isEnglishLetterGate(state){return languageIdentity(courseTargetLanguage(state))==='English';}
  function letterGateRequired(state){return isEnglishLetterGate(state)&&Boolean(state.baseLanguage)&&!state.letterGatePassed;}
  function letterBridge(letter){return ENGLISH_ARABIC_LETTER_BRIDGE.find(item=>item.letter===String(letter||'').toUpperCase())||ENGLISH_ARABIC_LETTER_BRIDGE[0];}
  function letterGateExamQuestions(state){
    const attempts=state.examHistory.filter(item=>item.scope==='letters-gate').length;
    const start=(attempts*10)%LETTER_EXAM_ORDER.length;
    return Array.from({length:10},(_,index)=>{
      const letter=LETTER_EXAM_ORDER[(start+index)%LETTER_EXAM_ORDER.length],bridge=letterBridge(letter);
      return {...bridge,kind:index%2?'lower':'upper',index};
    });
  }
  function letterGatePage(state){
    const learned=state.letterGateProgress.length;
    return '<section class="language-course-page letter-gate-page"><header class="letter-gate-hero"><small>Arabic → English · prerequisite</small><h1>English letters before the course</h1><p>Match English letters to familiar Arabic sounds, then prove you can draw them. You can learn first or go directly to the 10-question drawing exam.</p></header><div class="letter-gate-actions"><button type="button" data-letter-gate-learn><span>Aa</span><small>Learn first</small><h2>Learn the letters</h2><p>'+learned+' / 26 practiced · matched sounds such as د ↔ D are taught first-class; English-only sounds are marked special.</p><b>Open learning →</b></button><button type="button" data-letter-gate-exam><span>10</span><small>Direct path</small><h2>Examine the letters</h2><p>Ten different drawing questions. Passing the exam unlocks the normal English course navigation and pages.</p><b>Start exam →</b></button></div></section>';
  }
  function letterGateLearnPage(state){
    const practiced=state.letterGateProgress||[],ordered=LETTER_LEARNING_ORDER.map(letter=>letterBridge(letter)),firstMissing=ordered.find(item=>!practiced.includes(item.letter))?.letter||'D';
    const stored=state.activeGateLetter,allowedStored=practiced.includes(stored)||stored===firstMissing;
    const letter=allowedStored?stored:firstMissing,bridge=letterBridge(letter),lower=letter.toLowerCase(),word=LETTER_WORDS[letter],done=practiced.includes(letter),allDone=practiced.length===26;
    const selectors=ordered.map(item=>{
      const itemDone=practiced.includes(item.letter),allowed=itemDone||item.letter===firstMissing;
      return '<button type="button" data-gate-letter-select="'+item.letter+'" '+(allowed?'':'disabled')+' class="'+(item.letter===letter?'active ':'')+(itemDone?'done':'')+'"><strong>'+item.letter+'</strong><span>'+(item.arabic||'•')+'</span><b>'+(itemDone?'✓':allowed?'':'🔒')+'</b></button>';
    }).join('');
    const bridgeMarkup=bridge.special
      ? '<div class="letter-sound-bridge special"><span lang="ar" dir="rtl">صوت خاص</span><b>→</b><strong>'+letter+' '+lower+'</strong></div><p class="letter-bridge-note" dir="rtl">لا يوجد مقابل عربي واحد دقيق. '+esc(bridge.note||'استمع إلى النطق الإنجليزي وتعلّم الشكل مباشرة.')+'</p>'
      : '<div class="letter-sound-bridge"><span lang="ar" dir="rtl">'+esc(bridge.arabic)+'</span><b>↔</b><strong>'+letter+' '+lower+'</strong></div><p class="letter-bridge-note" dir="rtl">اربط صوت '+esc(bridge.arabic)+' بالنطق الإنجليزي '+esc(bridge.sound)+(bridge.approximate?' باعتباره أقرب تقريب صوتي.':'.')+'</p>';
    return '<section class="language-course-page language-letters-mobile letter-gate-learning" data-letter-gate-learning><header class="letter-gate-minihead"><button type="button" data-letter-gate-home>←</button><div><small>English letter prerequisite</small><strong>'+practiced.length+' / 26</strong></div><a href="#language-letter-exam">Exam →</a></header><div class="letter-sequence-head"><div><small>Letters practiced</small><strong>'+practiced.length+' / 26</strong></div><div class="letter-sequence-meter"><i style="width:'+Math.round(practiced.length/26*100)+'%"></i></div></div><div class="letter-learning-shell"><aside class="letter-index-grid">'+selectors+'</aside><article class="letter-focus-card"><small>'+(bridge.special?'Special English sound':'Arabic sound match')+'</small>'+bridgeMarkup+'<div class="letter-glyph-pair"><strong>'+letter+'</strong><span>'+lower+'</span></div><button class="letter-hear-button" type="button" data-speak-letter="'+letter+'">▶ Hear '+letter+'</button><div class="letter-pronunciation-check"><strong>Pronounce '+letter+'</strong>'+pronunciationJudgeMarkup(LETTER_SPEECH[letter]||letter,'letter:'+letter,'letter',String(state.pronunciationRatings['letter:'+letter]||''))+'</div><div class="letter-example-word"><span>Example</span><strong>'+esc(word)+'</strong><em dir="rtl">'+esc(LETTER_WORD_AR[word]||'')+'</em><button type="button" data-speak="'+esc(word)+'">Hear word</button></div></article></div><div class="letter-trace-grid"><article><div><small>Uppercase</small><h2>'+letter+'</h2></div><div class="letter-trace-stage"><span aria-hidden="true">'+letter+'</span><canvas id="letter-upper-canvas" data-letter-canvas="upper" width="720" height="280" aria-label="Draw uppercase '+letter+'"></canvas></div><button type="button" data-canvas-clear="letter-upper-canvas">Clear uppercase</button></article><article><div><small>Lowercase</small><h2>'+lower+'</h2></div><div class="letter-trace-stage"><span aria-hidden="true">'+lower+'</span><canvas id="letter-lower-canvas" data-letter-canvas="lower" width="720" height="280" aria-label="Draw lowercase '+lower+'"></canvas></div><button type="button" data-canvas-clear="letter-lower-canvas">Clear lowercase</button></article></div><div class="letter-draw-feedback" data-letter-feedback aria-live="polite">'+(done?'✓ This letter is already practiced.':'Trace both forms until each shape matches the guide.')+'</div><div class="letter-complete-row"><button type="button" data-gate-letter-complete="'+letter+'" data-letter-done="'+(done?'true':'false')+'" disabled>'+(done?'✓ '+letter+' practiced':'Complete '+letter)+'</button><button type="button" data-gate-letter-next '+(done?'':'disabled')+'>Next letter →</button></div>'+(allDone?'<a class="language-exam-cta" href="#language-letter-exam"><span>✓</span><div><strong>Letters examination</strong><p>All 26 letters practiced. Take the 10-question drawing exam.</p></div><b>→</b></a>':'')+'</section>';
  }
  function letterGateExamPage(state){
    const questions=letterGateExamQuestions(state);
    const items=questions.map((q,index)=>{
      const prompt=q.special
        ? '<div class="letter-exam-cue special"><span lang="ar" dir="rtl">صوت إنجليزي خاص</span><button type="button" data-letter-exam-listen="'+q.letter+'">▶ استمع</button></div><h2 dir="rtl">استمع ثم ارسم الحرف الإنجليزي '+(q.kind==='lower'?'الصغير':'الكبير')+'.</h2><p dir="rtl">'+esc(q.note||'لا يوجد مقابل عربي واحد لهذا الصوت.')+'</p>'
        : '<div class="letter-exam-cue"><span lang="ar" dir="rtl">'+esc(q.arabic)+'</span><b>'+esc(q.sound)+'</b></div><h2 dir="rtl">ارسم الحرف الإنجليزي '+(q.kind==='lower'?'الصغير':'الكبير')+' الذي يقابل هذا الصوت.</h2>';
      return '<fieldset class="letter-gate-exam-question" data-letter-exam-question data-expected-letter="'+q.letter+'" data-letter-kind="'+q.kind+'"><legend><span>'+(index+1)+'</span> / 10</legend>'+prompt+'<div class="letter-exam-draw-stage"><canvas id="letter-exam-canvas-'+index+'" width="720" height="300" aria-label="Draw the requested English letter"></canvas></div><div class="letter-exam-question-actions"><button type="button" data-letter-exam-clear="letter-exam-canvas-'+index+'">Clear</button><span data-letter-exam-feedback>Draw a large centered letter.</span></div></fieldset>';
    }).join('');
    return '<section class="language-course-page letter-gate-exam-page" data-letter-gate-exam-page><header class="letter-gate-minihead"><button type="button" data-letter-gate-home>←</button><div><small>English letters prerequisite</small><strong>10 drawing questions</strong></div><a href="#language-letter-learn">Learn →</a></header><header class="letter-gate-exam-head"><small>Exam</small><h1>Draw the English letters</h1><p>Arabic sound matches are used as cues. Special English sounds use audio because they do not have one exact Arabic-letter equivalent. Draw from memory; no letter guide is shown.</p></header><form id="letter-gate-exam-form"><div class="letter-gate-exam-list">'+items+'</div><div class="letter-gate-exam-submit"><div><small>Pass mark</small><strong>8 / 10</strong></div><button class="btn btn-primary" type="submit">Check drawings</button></div><div class="language-exam-result" id="letter-gate-exam-result" aria-live="polite"></div></form></section>';
  }

  function progressPercent(state){
    let completed=0;
    for(let li=0;li<CEFR.length;li++){
      const total=boxCount(li)*5;
      if(isLevelPassed(state,li)){completed+=total;continue;}
      const prefix=CEFR[li].id+':';
      completed+=state.passedBoxes.filter(id=>id.startsWith(prefix)).length;
    }
    return Math.min(100,Math.round((completed/TOTAL_LANGUAGE_BOXES)*100));
  }
  function languageChoicePage(state){
    const target=courseTargetLanguage(state),allowed=allowedBaseLanguages(target);
    const options=allowed.map(base=>base==='Arabic'
      ? '<button type="button" data-language-base="Arabic" lang="ar" dir="rtl"><span>ع</span><div><strong>العربية</strong><small>تعلّم '+esc(target)+' من خلال العربية</small></div><b>←</b></button>'
      : '<button type="button" data-language-base="English" lang="en"><span>EN</span><div><strong>English</strong><small>Learn '+esc(target)+' through English</small></div><b>→</b></button>').join('');
    return '<section class="language-course-page language-learning-language"><div class="language-choice-intro"><small>'+esc(target)+' course</small><h1>Choose your main language</h1><p>Your main language must be different from '+esc(target)+'. It explains grammar and meaning; speaking, pronunciation and video remain in '+esc(target)+'.</p></div><div class="language-choice-options">'+options+
      '</div><p class="language-choice-note">Levels 1–4 use '+(allowed.length===1?esc(allowed[0]):'your selected main language')+' as a bridge. Level 5 switches to '+esc(target)+' only.</p></section>';
  }
  function onboardingPage(state){
    const mode=learningLanguage(state,0);
    return '<section class="language-course-page language-onboarding">'+
      '<header class="language-onboarding-hero"><small>'+esc(mode.base)+' → '+esc(mode.target)+'</small><h1>Begin the driven pathway</h1><p>Every learner starts at Level 1 after the letters prerequisite. The diagnostic can estimate your current level, but it does not skip levels, steps or boxes.</p></header>'+
      '<div class="language-entry-grid">'+
        '<button type="button" data-language-start-zero><span>01</span><small>Full pathway</small><h2>Start from zero</h2><p>Begin at A1 · Step 1 · Box 1 and build every course prerequisite in order.</p><b>Start A1 →</b></button>'+
        '<button type="button" data-language-placement-start><span>02</span><small>Diagnostic</small><h2>Check my current level</h2><p>Take a hard multimodal diagnostic, then begin the same required pathway at Level 1 with a benchmark saved to your analysis.</p><b>Start diagnostic →</b></button>'+
      '</div><p class="language-entry-note">No placement result can bypass the driven sequence: level by level, step by step, box by box, content item by content item.</p></section>';
  }

  function learningFlow(state,pos){
    const route=nextBoxRoute(state,pos);
    const stages=[
      {route:'language-letters',label:t('letters'),key:'vocabulary'},
      {route:'language-voice',label:t('voice'),key:'voice'},
      {route:'language-grammar',label:t('grammar'),key:'grammar'},
      {route:'language-video',label:t('video'),key:'video'},
      {route:'language-examine',label:t('examine'),key:'exam'}
    ];
    const module=state.modules[keyBox(CEFR[pos.li].id,pos.step,pos.box)]||{};
    const learned={vocabulary:Boolean(module.vocabulary),voice:Boolean(module.voice),grammar:Boolean(module.grammar),video:Boolean(module.video)};
    return stages.map((stage,index)=>{
      const done=stage.key==='exam'?boxExamPassed(state,pos.li,pos.step,pos.box):Boolean(module[stage.key]);
      const current=stage.route===route;
      const unlocked=index===0||(index===1&&learned.vocabulary)||(index===2&&learned.vocabulary&&learned.voice)||(index===3&&learned.vocabulary&&learned.voice&&learned.grammar)||(index===4&&learned.vocabulary&&learned.voice&&learned.grammar&&learned.video);
      return '<a href="#'+stage.route+'" class="language-flow-stage '+(done?'done ':'')+(current?'current ':'')+(!unlocked?'locked':'')+'" '+(!unlocked?'aria-disabled="true" tabindex="-1"':'')+'><span>'+(done?'✓':String(index+1).padStart(2,'0'))+'</span><div><small>'+(done?'Complete':current?'Up next':unlocked?'Available':'Locked')+'</small><strong>'+esc(stage.label)+'</strong></div><b>→</b></a>';
    }).join('');
  }

  function learningAnalytics(state,pos){
    const profile=LEVEL_LEARNING_SYSTEMS[pos.li],passed=state.passedBoxes.length,steps=state.passedSteps.length,levels=state.passedLevels.length;
    const scored=(state.examHistory||[]).filter(item=>['box','step','level','language'].includes(item.scope)&&Number.isFinite(Number(item.score)));
    const last=scored.length?Number(scored[scored.length-1].score):null;
    const average=scored.length?Math.round(scored.reduce((sum,item)=>sum+Number(item.score),0)/scored.length):null;
    return '<section class="language-learning-analytics level-system-'+profile.number+'">'+
      '<div><small>Driven pathway</small><strong>Level '+profile.number+' · '+profile.id+'</strong><span>'+esc(profile.name)+'</span></div>'+
      '<div><small>Course status</small><strong>'+passed+' / '+TOTAL_LANGUAGE_BOXES+' boxes</strong><span>'+progressPercent(state)+'% complete</span></div>'+
      '<div><small>Hierarchy</small><strong>'+steps+' / 25 steps</strong><span>'+levels+' / 5 levels complete</span></div>'+
      '<div><small>Exam analysis</small><strong>'+(average===null?'No score yet':average+'% average')+'</strong><span>'+(last===null?'Pass the first box exam to begin analysis.':'Last '+last+'% · '+scored.length+' scored exam'+(scored.length===1?'':'s'))+'</span></div>'+
      '<div><small>Readiness target</small><strong>'+(profile.id==='C1'?'C1 / IELTS':'Next outcome')+'</strong><span>'+(profile.id==='C1'?'Preparation target; no score guarantee.':esc(profile.target))+'</span></div>'+
      '</section>';
  }

  function homePage(){
    const state=languageState();
    if(!state.baseLanguage)return languageChoicePage(state);
    if(letterGateRequired(state))return letterGatePage(state);
    if(!state.onboardingComplete&&!state.placementPending)return onboardingPage(state);
    const pos=clampSelection(state),level=CEFR[pos.li],mode=learningLanguage(state,pos.li);
    const levels=CEFR.map((item,index)=>{
      const unlocked=levelUnlocked(state,index),passed=isLevelPassed(state,index),selected=index===pos.li;
      return '<button class="language-map-level '+(selected?'selected ':'')+(passed?'passed ':'')+(!unlocked?'locked':'')+'" data-language-level="'+index+'" '+(unlocked?'':'disabled')+'><span>'+item.id+'</span><b>'+(passed?'✓':unlocked?'':'⌁')+'</b></button>';
    }).join('');
    const steps=[1,2,3,4,5].map(step=>{
      const unlocked=stepUnlocked(state,pos.li,step),passed=isStepPassed(state,pos.li,step);
      return '<button type="button" data-language-step="'+step+'" '+(unlocked?'':'disabled')+' class="language-map-step '+(step===pos.step?'active ':'')+(passed?'passed':'')+'"><span>'+step+'</span><b>'+(passed?'✓':'')+'</b></button>';
    }).join('');
    const nextRoute=nextBoxRoute(state,pos);
    return '<section class="language-course-page language-home language-home-simple level-system-'+LEVEL_LEARNING_SYSTEMS[pos.li].number+'">'+
      '<header class="language-home-simple-head"><div><small>'+esc(mode.immersion?mode.target+' immersion':mode.base+' → '+mode.target)+'</small><strong>'+esc(mode.target)+'</strong></div><div class="language-home-percent"><b>'+progressPercent(state)+'%</b><span>'+level.id+'</span></div></header>'+
      learningAnalytics(state,pos)+
      '<section class="language-home-current"><div class="language-home-box"><span>'+t('box')+'</span><strong>'+pos.box+'</strong><small>'+level.id+' · '+pos.step+'</small></div><div class="language-home-stage-list">'+learningFlow(state,pos)+'</div><a class="language-home-continue" href="#'+nextRoute+'"><span>'+t('resume')+'</span><b>→</b></a></section>'+
      '<nav class="language-course-map" aria-label="Course map"><div class="language-map-levels">'+levels+'</div><div class="language-map-steps">'+steps+'</div>'+boxSelector(state,pos)+'</nav></section>';
  }

  function boxSelector(state,pos){
    let html='<div class="language-box-strip">';
    for(let box=1;box<=boxCount(pos.li);box++){
      const unlocked=adminLanguageAuthoring()||boxUnlocked(state,pos.li,pos.step,box),passed=isBoxPassed(state,pos.li,pos.step,box),letter=isLetterBox(pos.li,box);
      html+='<button type="button" data-language-box="'+box+'" '+(unlocked?'':'disabled')+' class="'+(box===pos.box?'active ':'')+(passed?'passed ':'')+(letter?'letter-box':'')+'">'+(letter?'Aa':box)+'</button>';
    }
    return html+'</div>';
  }

  function processTop(state,pos,count){
    const mode=learningLanguage(state,pos.li),labels=processLabels(state,pos.li);
    return '<header class="language-box-process-bar"><div class="language-process-box"><span>'+t('box')+'</span><strong>'+pos.box+'</strong></div><div class="language-process-language"><small>'+(mode.immersion?esc(labels.immersion):esc(mode.base)+' → '+esc(mode.target))+'</small><strong>'+esc(mode.instruction)+'</strong></div><div class="language-process-count" aria-live="polite"><span data-process-position>01</span><i>/</i><b>'+count+'</b></div></header><div class="language-process-meter" aria-hidden="true"><i data-process-meter style="width:'+(count?100/count:100)+'%"></i></div>';
  }
  function processStage(state,pos,page,item,markup,index){
    const targetOnly=page==='pronunciation'||page==='video',instructionLanguage=targetOnly?learningLanguage(state,pos.li).target:learningLanguage(state,pos.li).instruction;
    return '<section class="language-process-stage" data-language-process-stage="'+index+'" '+(index?'hidden':'')+'><p class="language-bridge-instruction" dir="'+(instructionLanguage==='Arabic'?'rtl':'ltr')+'">'+esc(bridgeInstruction(state,pos,item?.type||'info',page))+'</p>'+markup+'</section>';
  }
  function languageProcessPage(state,pos,page,entries,completion='',extraClass=''){
    if(!entries.length)entries=[{item:{type:'info'},markup:'<div class="language-process-empty">No learning activity has been added to this page.</div>'}];
    const labels=processLabels(state,pos.li),stages=entries.map((entry,index)=>processStage(state,pos,page,entry.item,entry.markup,index)).join('');
    const dots=entries.map((entry,index)=>'<button type="button" data-process-go="'+index+'" class="'+(index===0?'active':'')+'" aria-label="'+esc(labels.item)+' '+(index+1)+'"></button>').join('');
    const profile=LEVEL_LEARNING_SYSTEMS[pos.li];
    const banner='<div class="level-system-banner"><div><small>Level '+profile.number+' · '+profile.id+'</small><strong>'+esc(profile.name)+'</strong></div><span>'+esc(profile.method)+'</span><b>'+esc(profile.difficulty)+'</b></div>';
    return '<section class="language-course-page language-process-page level-system-'+profile.number+' '+extraClass+'" data-language-process="'+esc(page)+'" data-process-count="'+entries.length+'">'+processTop(state,pos,entries.length)+banner+'<div class="language-process-stage-list">'+stages+'</div><nav class="language-process-nav"><button type="button" data-process-previous disabled><span>←</span>'+esc(labels.back)+'</button><div class="language-process-dots">'+dots+'</div><button type="button" data-process-next>'+esc(labels.next)+'<span>→</span></button></nav><div class="language-process-completion">'+completion+'</div></section>';
  }

  function contentItemAttrs(item){return ' data-language-content-item="'+esc(item.id)+'" data-language-content-type="'+esc(item.type||'info')+'"';}
  function infoItemCard(item,extraClass=''){
    const icon={info:'◇',sound:'◖',words:'Aa',writing:'✎',video:'▶',response:'↗',dictation:'◉',speaking:'⌁',rule:'§',steps:'↳',notes:'□'}[item.type]||'◇';
    return '<article class="language-content-item language-premium-item '+extraClass+'"'+contentItemAttrs(item)+'><div class="language-item-top"><span class="language-item-icon">'+icon+'</span><small>'+esc(item.eyebrow||'Information')+'</small><b>'+esc(item.type||'guide')+'</b></div><h2>'+esc(item.title||'Untitled item')+'</h2>'+(item.body?'<p>'+esc(item.body)+'</p>':'')+'</article>';
  }
  function itemWords(item){return Array.isArray(item.words)?item.words:String(item.words||'').split(/\n|,/).map(value=>value.trim()).filter(Boolean);}
  function itemWordPairs(item,state,pos){
    if(Array.isArray(item.wordPairs)&&item.wordPairs.length)return item.wordPairs;
    return vocabularyPairs(state,pos,itemWords(item));
  }
  function itemLines(item,name){const value=item[name];return Array.isArray(value)?value:String(value||'').split(/\n/).map(line=>line.trim()).filter(Boolean);}

  function letterBoxPage(state,pos){
    const pkey=letterProgressKey(pos.li,pos.step),practiced=state.letterProgress[pkey]||[];
    const items=languagePageItems(pos.li,pos.step,pos.box,'letters');
    const firstMissing=LETTERS.find(letter=>!practiced.includes(letter))||'A';
    const stored=state.activeLetterByStep[pkey];
    const storedAllowed=practiced.includes(stored)||stored===firstMissing;
    const letter=storedAllowed?stored:firstMissing,lower=letter.toLowerCase(),word=LETTER_WORDS[letter],arabic=usesArabicBridge(state,pos.li),done=practiced.includes(letter),allDone=LETTERS.every(item=>practiced.includes(item));
    const selectors=LETTERS.map(item=>{
      const itemDone=practiced.includes(item),allowed=itemDone||item===firstMissing;
      return '<button type="button" data-letter-select="'+item+'" '+(allowed?'':'disabled')+' class="'+(item===letter?'active ':'')+(itemDone?'done':'')+'"><strong>'+item+'</strong><span>'+item.toLowerCase()+'</span><b>'+(itemDone?'✓':allowed?'':'🔒')+'</b></button>';
    }).join('');
    const letterWorkflow='<div class="letter-sequence-head"><div><small>'+(arabic?'الحروف المكتملة':'Letters completed')+'</small><strong>'+practiced.length+' / 26</strong></div><div class="letter-sequence-meter"><i style="width:'+Math.round(practiced.length/26*100)+'%"></i></div></div>'+
      '<div class="letter-learning-shell"><aside class="letter-index-grid">'+selectors+'</aside><article class="letter-focus-card"><small>'+(arabic?'الحرف الحالي':'Current letter')+'</small><div class="letter-glyph-pair"><strong>'+letter+'</strong><span>'+lower+'</span></div><button class="letter-hear-button" type="button" data-speak-letter="'+letter+'" aria-label="Hear letter '+letter+'">▶ '+(arabic?'استمع':'Hear')+' '+letter+'</button><div class="letter-example-word"><span>'+(arabic?'كلمة مثال':'Example word')+'</span><strong>'+esc(word)+'</strong>'+(arabic?'<em dir="rtl">'+esc(LETTER_WORD_AR[word]||'')+'</em>':'')+'<button type="button" data-speak="'+esc(word)+'">'+(arabic?'استمع للكلمة':'Hear word')+'</button></div><p>'+(arabic?'استمع إلى اسم الحرف بالإنجليزية، اربط شكله بصوته وكلمة المثال، ثم ارسم الشكلين قبل الانتقال.':'Audio says the letter name only. Follow the guide with your finger and complete both shapes before moving forward.')+'</p></article></div>'+
      '<div class="letter-trace-grid"><article><div><small>Uppercase</small><h2>'+letter+'</h2></div><div class="letter-trace-stage"><span aria-hidden="true">'+letter+'</span><canvas id="letter-upper-canvas" data-letter-canvas="upper" width="720" height="280" aria-label="Draw uppercase '+letter+'"></canvas></div><button type="button" data-canvas-clear="letter-upper-canvas">Clear uppercase</button></article><article><div><small>Lowercase</small><h2>'+lower+'</h2></div><div class="letter-trace-stage"><span aria-hidden="true">'+lower+'</span><canvas id="letter-lower-canvas" data-letter-canvas="lower" width="720" height="280" aria-label="Draw lowercase '+lower+'"></canvas></div><button type="button" data-canvas-clear="letter-lower-canvas">Clear lowercase</button></article></div>'+
      '<div class="letter-draw-feedback" data-letter-feedback aria-live="polite">'+(done?(arabic?'هذا الحرف مكتمل. يمكنك مراجعته أو المتابعة.':'This letter is already completed. You can review it or continue.'):(arabic?'تتبّع الشكلين. يتحقق التطبيق من تغطية الشكل والخروج عن المسار.':'Trace both forms. The app checks shape coverage and off-guide strokes before allowing completion.'))+'</div>'+
      '<div class="letter-complete-row"><button type="button" data-letter-complete="'+letter+'" data-letter-done="'+(done?'true':'false')+'" disabled>'+(done?'✓ '+letter+' completed':'Complete '+letter)+'</button><button type="button" data-letter-next '+(done?'':'disabled')+'>Next letter →</button></div>'+
      (allDone?'<a class="language-exam-cta" href="#language-examine"><span>✓</span><div><strong>Letters examination</strong><p>Continue when all letters are ready.</p></div><b>→</b></a>':'');
    return languageProcessPage(state,pos,'letters',[{item:{type:'sound'},markup:letterWorkflow}],'','language-letters-mobile');
  }

  function pronunciationPage(state,pos){
    const data=boxData(pos.li,pos.step,pos.box),id=keyBox(CEFR[pos.li].id,pos.step,pos.box),module=state.modules[id]||{},items=languagePageItems(pos.li,pos.step,pos.box,'letters');
    const entries=items.map(item=>{
      let markup='';
      if(item.type==='words')markup='<article class="language-content-item language-word-item"'+contentItemAttrs(item)+'><small>'+esc(item.eyebrow||'Vocabulary')+'</small><h2>'+esc(item.title||'Vocabulary set')+'</h2><p>'+esc(item.body||'')+'</p><div class="language-pronunciation-grid language-vocabulary-only">'+itemWordPairs(item,state,pos).map(pair=>'<div class="language-vocabulary-card"><strong>'+esc(pair.target)+'</strong>'+(pair.meaning?'<small dir="rtl">'+esc(pair.meaning)+'</small>':'')+'</div>').join('')+'</div></article>';
      else if(item.type==='writing')markup='<article class="language-writing-task language-content-item"'+contentItemAttrs(item)+'><small>'+esc(item.eyebrow||'Writing')+'</small><h2>'+esc(item.title||'Writing task')+'</h2><p>'+esc(item.body||'')+'</p><textarea id="language-pronunciation-writing" rows="6" placeholder="'+esc(item.placeholder||'Write here…')+'"></textarea></article>';
      else markup=infoItemCard(item);
      return {item,markup};
    });
    const hasWriting=items.some(item=>item.type==='writing');
    const completion='<button class="language-complete-bar '+(module.vocabulary?'done':'')+'" type="button" data-language-module="vocabulary" '+(module.vocabulary||hasWriting?'':'disabled')+'>'+(module.vocabulary?'✓ '+t('completed'):(hasWriting?'Complete vocabulary and writing items':'Add a writing item before completion'))+'</button>';
    return languageProcessPage(state,pos,'vocabulary',entries,completion,'language-pronunciation-lesson language-vocabulary-writing-page');
  }

  function videoUnderstandingPage(state,pos){
    const data=boxData(pos.li,pos.step,pos.box),id=keyBox(CEFR[pos.li].id,pos.step,pos.box),module=state.modules[id]||{};
    const items=languagePageItems(pos.li,pos.step,pos.box,'video'),videoItem=items.find(item=>item.type==='video'),responseItem=items.find(item=>item.type==='response');
    const watched=Boolean(state.watchedVideos[id]),saved=state.videoResponses[id]||'',rating=String(state.videoRatings[id]||''),responseLanguage=learningLanguage(state,pos.li).target;
    const youtubeUrl=String(videoItem?.youtubeUrl||'').trim(),validYouTube=/^https:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\//i.test(youtubeUrl);
    const entries=items.map(item=>{
      let markup='';
      if(item.type==='video')markup='<article class="language-youtube-card language-content-item"'+contentItemAttrs(item)+'><div><small>'+esc(item.eyebrow||'YouTube video')+'</small><h2>'+esc(item.title||data.title)+'</h2><p>Watch the admin-supplied video. This page evaluates only what you understood from this video.</p></div><div class="language-youtube-actions">'+(validYouTube?'<a href="'+esc(youtubeUrl)+'" target="_blank" rel="noopener noreferrer" data-youtube-video>▶ Open YouTube</a>':'<span class="language-youtube-missing">Add a valid YouTube link from Content Control.</span>')+'<button type="button" data-video-watched '+(validYouTube?'':'disabled')+'>'+(watched?'✓ Watched':'I finished watching')+'</button></div></article>';
      else if(item.type==='response')markup='<article class="language-video-response language-content-item"'+contentItemAttrs(item)+'><small>'+esc(item.eyebrow||'YouTube understanding')+'</small><h2>'+esc(item.title||'Write what you understood')+'</h2><p>'+esc(item.body||'')+'</p><textarea id="language-video-response" rows="8" placeholder="'+esc(item.placeholder||'Write what you understood…')+'">'+esc(saved)+'</textarea><div class="language-video-grade '+(rating==='bad'?'failed':rating?'accepted':'')+'" data-video-rating '+(rating?'':'hidden')+'><small>Gemini rating</small><strong>'+esc(rating||'')+'</strong><span>'+(rating==='bad'?'Not accepted · revise your understanding and submit again.':rating?'Accepted · YouTube understanding complete.':'')+'</span></div><p class="language-feedback" data-video-response-feedback></p></article>';
      return {item,markup};
    });
    const ready=Boolean(videoItem&&responseItem&&validYouTube);
    const completion='<button class="language-complete-bar '+(module.video?'done':'')+'" type="button" data-language-module="video" data-video-evaluate '+(module.video||ready?'':'disabled')+'>'+(module.video?'✓ '+t('completed'):(ready?'Judge understanding with Gemini':'Add a valid video and understanding response first'))+'</button>';
    return languageProcessPage(state,pos,'video',entries,completion,'language-video-page');
  }

  function lettersPage(){
    const state=languageState(),pos=activeLanguagePosition(state);
    return pronunciationPage(state,pos);
  }
  function videoPage(){
    const state=languageState(),pos=activeLanguagePosition(state);
    return videoUnderstandingPage(state,pos);
  }

  function currentLearningBox(state,pos){
    if(!isLetterBox(pos.li,pos.box))return boxData(pos.li,pos.step,pos.box);
    if(adminLanguageAuthoring())return {box:pos.box,title:CEFR[pos.li].id+' · Step '+pos.step+' · Letters box',grammarTitle:'Letters box'};
    return null;
  }
  function boxOneGate(state,pos,title,intro){
    const practiced=state.letterProgress[letterProgressKey(pos.li,pos.step)]||[];
    const gate='<article class="language-box-one-gate"><span>Aa</span><div><small>Letters prerequisite</small><h2>Finish A–Z first.</h2><p>'+practiced.length+' / 26 letters complete.</p></div><div><a href="#language-letters">Open letters</a><a href="#language-examine">Examine</a></div></article>';
    return languageProcessPage(state,pos,'prerequisite',[{item:{type:'info'},markup:gate}]);
  }

  function voicePage(){
    const state=languageState(),pos=activeLanguagePosition(state),data=currentLearningBox(state,pos);
    if(!data)return boxOneGate(state,pos,t('voice'),t('voiceIntro'));
    const module=state.modules[keyBox(CEFR[pos.li].id,pos.step,data.box)]||{},items=languagePageItems(pos.li,pos.step,pos.box,'voice');
    const entries=items.map(item=>{
      let markup='';
      if(item.type==='pronunciation'){const pkey='box:'+id+':'+item.id,prating=String(state.pronunciationRatings[pkey]||'');markup='<article class="language-practice-card pronunciation language-content-item"'+contentItemAttrs(item)+'><small>'+esc(item.eyebrow||'Pronunciation')+'</small><h2>'+esc(item.title||'Pronounce the requested word')+'</h2><p>'+esc(item.body||'')+'</p>'+pronunciationJudgeMarkup(item.targetText||'',pkey,'word',prating)+'</article>';}
      else if(item.type==='dictation')markup='<article class="language-practice-card dictation language-content-item"'+contentItemAttrs(item)+'><small>'+esc(item.eyebrow||'Voice → text')+'</small><h2>'+esc(item.title||'Listen and write')+'</h2><button class="language-audio-button" type="button" data-speak="'+esc(item.audioText||'')+'">▶ '+t('listen')+'</button><textarea id="language-dictation" rows="4" placeholder="'+esc(item.placeholder||'Type what you hear')+'"></textarea><button type="button" data-check-dictation="'+esc(item.audioText||'')+'">'+t('check')+'</button><p class="language-feedback" data-dictation-feedback></p></article>';
      else if(item.type==='speaking'){const targetText=item.targetText||item.body||'';markup='<article class="language-practice-card reverse language-content-item"'+contentItemAttrs(item)+'><small>'+esc(item.eyebrow||'Text → voice')+'</small><h2>'+esc(item.title||t('speak'))+'</h2><blockquote dir="'+(usesArabicBridge(state,pos.li)?'rtl':'ltr')+'">'+esc(item.body||'')+'</blockquote><button class="language-audio-button secondary" type="button" data-recognize="'+esc(targetText)+'">🎙 '+t('start')+'</button><textarea id="language-reverse-fallback" rows="3" placeholder="'+esc(item.placeholder||'Recognition transcript')+'"></textarea><button type="button" data-check-reverse="'+esc(targetText)+'">'+t('check')+'</button><p class="language-feedback" data-reverse-feedback></p></article>';}
      else markup=infoItemCard(item);
      return {item,markup};
    });
    const completeReady=items.some(item=>item.type==='pronunciation')&&items.some(item=>item.type==='dictation')&&items.some(item=>item.type==='speaking');
    const completion='<button class="language-complete-bar '+(module.voice?'done':'')+'" type="button" data-language-module="voice" '+(module.voice||completeReady?'':'disabled')+'>'+(module.voice?'✓ '+t('completed'):(completeReady?'Complete pronunciation, listening and speaking first':'Add pronunciation, listening and speaking items before completion'))+'</button>';
    return languageProcessPage(state,{li:pos.li,step:pos.step,box:data.box},'voice',entries,completion,'language-practice-page');
  }

  function grammarPage(){
    const state=languageState(),pos=activeLanguagePosition(state),data=currentLearningBox(state,pos);if(!data)return boxOneGate(state,pos,t('grammar'),t('grammarIntro'));
    const module=state.modules[keyBox(CEFR[pos.li].id,pos.step,data.box)]||{},items=languagePageItems(pos.li,pos.step,pos.box,'grammar');
    const contentDirection=usesArabicBridge(state,pos.li)?'rtl':'ltr';
    const entries=items.map((item,index)=>{
      let markup='';
      if(item.type==='rule')markup='<article class="language-rule-card primary language-content-item" dir="'+contentDirection+'"'+contentItemAttrs(item)+'><span>'+String(index+1).padStart(2,'0')+'</span><small>'+esc(item.eyebrow||'Grammar rule')+'</small><h2>'+esc(item.title||'Grammar rule')+'</h2><p>'+esc(item.body||'')+'</p><div class="language-examples" dir="ltr">'+(item.example1?'<code>'+esc(item.example1)+'</code>':'')+(item.example2?'<code>'+esc(item.example2)+'</code>':'')+'</div></article>';
      else if(item.type==='grammar-practice')markup='<article class="language-rule-card language-content-item" dir="'+contentDirection+'"'+contentItemAttrs(item)+'><span>'+String(index+1).padStart(2,'0')+'</span><small>'+esc(item.eyebrow||'Rule practice')+'</small><h2>'+esc(item.title||'Apply the rule')+'</h2><p>'+esc(item.body||'')+'</p><textarea id="language-grammar-writing" dir="ltr" rows="5" placeholder="'+esc(item.placeholder||'Write rule examples…')+'"></textarea></article>';
      return {item,markup};
    });
    const hasPractice=items.some(item=>item.type==='grammar-practice');
    const completion='<button class="language-complete-bar '+(module.grammar?'done':'')+'" type="button" data-language-module="grammar" '+(module.grammar||hasPractice?'':'disabled')+'>'+(module.grammar?'✓ '+t('completed'):(hasPractice?'Complete the rule practice first':'Add a rule-practice item before completion'))+'</button>';
    return languageProcessPage(state,{li:pos.li,step:pos.step,box:data.box},'grammar',entries,completion,'language-grammar-page');
  }

  function reviewPage(){
    const state=languageState(),pos=activeLanguagePosition(state),data=currentLearningBox(state,pos);if(!data)return boxOneGate(state,pos,t('review'),t('reviewIntro'));
    const id=keyBox(CEFR[pos.li].id,pos.step,data.box),module=state.modules[id]||{},notes=state.notes[id]||'',items=languagePageItems(pos.li,pos.step,pos.box,'review');
    const entries=items.map(item=>{
      let markup='';
      if(item.type==='words')markup='<article class="language-memory-card language-content-item"'+contentItemAttrs(item)+'><small>'+esc(item.eyebrow||'Active vocabulary')+'</small><h2>'+esc(item.title||'Vocabulary')+'</h2><p>'+esc(item.body||'')+'</p><div class="language-vocab-grid language-vocabulary-pairs">'+itemWordPairs(item,state,pos).map(pair=>'<button type="button" data-speak="'+esc(pair.target)+'"><span><strong>'+esc(pair.target)+'</strong>'+(pair.meaning?'<small dir="rtl">'+esc(pair.meaning)+'</small>':'')+'</span><b>▶</b></button>').join('')+'</div></article>';
      else if(item.type==='steps')markup='<article class="language-memory-card language-content-item"'+contentItemAttrs(item)+'><small>'+esc(item.eyebrow||'Learning trick')+'</small><h2>'+esc(item.title||'Learning method')+'</h2><p>'+esc(item.body||'')+'</p><ol>'+itemLines(item,'steps').map(step=>'<li>'+esc(step)+'</li>').join('')+'</ol></article>';
      else if(item.type==='notes')markup='<article class="language-memory-card notes language-content-item"'+contentItemAttrs(item)+'><small>'+esc(item.eyebrow||t('notes'))+'</small><h2>'+esc(item.title||'Notes')+'</h2><p>'+esc(item.body||'')+'</p><textarea id="language-box-notes" rows="8" placeholder="'+esc(item.placeholder||'Notes…')+'">'+esc(notes)+'</textarea><button type="button" data-save-language-notes="'+esc(id)+'">'+t('save')+'</button></article>';
      else markup=infoItemCard(item);
      return {item,markup};
    });
    const completion='<button class="language-complete-bar '+(module.review?'done':'')+'" type="button" data-language-module="review" '+(items.length?'':'disabled')+'>'+(module.review?'✓ '+t('completed'):(items.length?t('complete'):'Add at least one review item'))+'</button>';
    return languageProcessPage(state,{li:pos.li,step:pos.step,box:data.box},'review',entries,completion,'language-review-page');
  }

  function letterExamQuestions(step){
    const offset=(step-1)*5;
    const letters=['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
    const pick=index=>letters[(offset+index)%letters.length];
    const a=pick(0),b=pick(1),c=pick(2),d=pick(3),e=pick(4);
    return [
      {prompt:'Which uppercase letter matches lowercase '+a.toLowerCase()+'?',correct:a,options:[a,b,c,d]},
      {prompt:'Which lowercase letter matches uppercase '+b+'?',correct:b.toLowerCase(),options:[b.toLowerCase(),c.toLowerCase(),d.toLowerCase(),e.toLowerCase()]},
      {prompt:'Which letter comes immediately after '+c+'?',correct:letters[(letters.indexOf(c)+1)%26],options:[letters[(letters.indexOf(c)+1)%26],b,d,e]},
      {prompt:'Which letter comes immediately before '+e+'?',correct:letters[(letters.indexOf(e)+25)%26],options:[letters[(letters.indexOf(e)+25)%26],a,b,c]},
      {prompt:'Which pair shows the same letter?',correct:d+' / '+d.toLowerCase(),options:[d+' / '+d.toLowerCase(),d+' / '+e.toLowerCase(),c+' / '+d.toLowerCase(),a+' / '+b.toLowerCase()]},
      {prompt:'Which option contains the uppercase form of '+a.toLowerCase()+'?',correct:a,options:[a,b,d,e]},
      {prompt:'Which option contains the lowercase form of '+c+'?',correct:c.toLowerCase(),options:[c.toLowerCase(),a.toLowerCase(),d.toLowerCase(),e.toLowerCase()]},
      {prompt:'Which letter is two places after '+a+'?',correct:letters[(letters.indexOf(a)+2)%26],options:[letters[(letters.indexOf(a)+2)%26],b,d,e]},
      {prompt:'Which pair is NOT the same letter?',correct:b+' / '+c.toLowerCase(),options:[a+' / '+a.toLowerCase(),d+' / '+d.toLowerCase(),e+' / '+e.toLowerCase(),b+' / '+c.toLowerCase()]},
      {prompt:'Which sequence is in correct alphabetical order?',correct:a+', '+b+', '+c,options:[a+', '+b+', '+c,c+', '+b+', '+a,b+', '+a+', '+c,a+', '+c+', '+b]}
    ].map(q=>({...q,options:arrayUnique(q.options)}));
  }
  function boxQuestionSet(li,step,box){
    const level=CEFR[li],profile=LEVEL_LEARNING_SYSTEMS[li],data=boxData(li,step,box),state=languageState();
    const nextBox=box===boxCount(li)?Math.max(firstLearningBox(li),box-1):box+1,adjacent=boxData(li,step,nextBox);
    const meaning=usesArabicBridge(state,li)?vocabularyMeaning(data.words[0],'Arabic'):data.words[0];
    const meaning2=usesArabicBridge(state,li)?vocabularyMeaning(data.words[1],'Arabic'):data.words[1];
    const simpleDistractors=arrayUnique([adjacent.words[0],data.words[1],data.words[2],data.words[3]]).filter(Boolean);
    const tricky=li>=3;
    const hardest=li>=4;
    const sentence=data.grammarExample1,second=data.grammarExample2;
    const nearMiss=sentence.replace(/\b(is|are|has|have|was|were)\b/i,match=>match.toLowerCase()==='is'?'are':match.toLowerCase()==='are'?'is':match.toLowerCase()==='has'?'have':match.toLowerCase()==='have'?'has':match.toLowerCase()==='was'?'were':'was');
    const questions=[
      {type:'mcq',prompt:'Translate this meaning into the target word: '+meaning,correct:data.words[0],options:arrayUnique([data.words[0],...simpleDistractors])},
      {type:'listen-choice',prompt:li===0?'Listen to the word and choose what you heard.':'Listen and choose the exact sentence.',audio:li===0?data.words[1]:data.voicePrompt,correct:li===0?data.words[1]:data.voicePrompt,options:li===0?arrayUnique([data.words[1],...simpleDistractors]):arrayUnique([data.voicePrompt,adjacent.voicePrompt,data.reversePrompt,second])},
      {type:'fill',prompt:li===0?'Write the English word for: '+meaning2:'Complete the key word needed in this '+(li===1?'simple':'level-appropriate')+' sentence task.',correct:data.words[1],options:[]},
      {type:'speak',prompt:li===0?'Pronounce this word clearly: '+data.words[0]:li===1?'Pronounce the complete simple sentence clearly.':tricky?'Pronounce the sentence accurately despite the more complex wording.':'Pronounce the complete model sentence clearly.',correct:li===0?data.words[0]:second,options:[]},
      {type:'mcq',prompt:tricky?'Choose the grammatically precise sentence. Near-miss distractors are intentional.':'Choose the sentence that correctly applies '+data.grammarTitle+'.',correct:sentence,options:arrayUnique([sentence,nearMiss,adjacent.grammarExample1,data.words.slice(0,4).join(' ')])},
      {type:'true-false',prompt:'True or false: '+data.grammarRule,correct:'True',options:['True','False']},
      {type:'listen-fill',prompt:li===0?'Listen and type the word exactly.':hardest?'Listen once and transcribe the advanced sentence exactly.':'Listen and transcribe the sentence exactly.',audio:li===0?data.words[2]:data.voicePrompt,correct:li===0?data.words[2]:data.voicePrompt,options:[]},
      {type:'short-answer',prompt:li<2?'Translate/rebuild the target-language model using these main-language cues: '+meaning+' · '+meaning2:tricky?'Reformulate the model without changing its core meaning; use this canonical answer for scoring.':'Translate/rebuild the model meaning into the target language.',correct:sentence,options:[]},
      {type:'ordering',prompt:'Build the model sentence in the correct order.',correct:sentence.replace(/[.!?]$/,''),tokens:sentence.replace(/[.!?]$/,'').split(/\s+/).sort((a,b)=>a.localeCompare(b)),options:[]},
      {type:'multi-select',prompt:tricky?'Select both statements that remain valid under the rule; distractors may differ by one detail.':'Select both valid learning statements.',correct:[data.grammarRule,data.recall],options:arrayUnique([data.grammarRule,data.recall,adjacent.grammarRule,'Vocabulary alone is enough; grammar never changes meaning.'])}
    ];
    if(hardest){
      questions[3].prompt='Pronounce the precise C1 model clearly, preserving word boundaries and the intended phrasing.';
      questions[4].prompt='Choose the most defensible C1 form; the distractors are deliberately plausible.';
      questions[7].prompt='Reformulate at C1 level while preserving meaning, stance and logical relation; score against the canonical model.';
    }
    return questions.map(question=>({...question,levelSystem:profile.name,examStyle:profile.examStyle}));
  }

  function representativeBoxes(li){
    const last=boxCount(li),first=firstLearningBox(li);
    return arrayUnique([1,first,Math.max(first,Math.round(last*.2)),Math.round(last*.4),Math.round(last*.6),Math.round(last*.8),last]);
  }
  function defaultAssessmentQuestions(ctx){
    if(ctx.scope==='box')return boxQuestionSet(ctx.li,ctx.step,ctx.box);
    const out=[];
    if(ctx.scope==='step'){
      representativeBoxes(ctx.li).forEach((box,index)=>{
        const set=boxQuestionSet(ctx.li,ctx.step,box);
        out.push(set[index%set.length],set[(index+3)%set.length],set[(index+6)%set.length]);
      });
      return out.slice(0,15);
    }
    if(ctx.scope==='level'){
      for(let step=1;step<=5;step++){
        const reps=representativeBoxes(ctx.li);
        [reps[1],reps[2],reps[3],reps[4],reps[reps.length-1]].forEach((box,index)=>{
          const set=boxQuestionSet(ctx.li,step,box);
          out.push(set[(step+index*2)%set.length]);
        });
      }
      return out.slice(0,25);
    }
    for(let li=0;li<CEFR.length;li++){
      const reps=representativeBoxes(li);
      [1,2,3,4,5].forEach((step,index)=>{
        [reps[1],reps[3],reps[reps.length-1]].forEach((box,offset)=>{
          const set=boxQuestionSet(li,step,box);
          out.push(set[(li+index+offset*3)%set.length]);
        });
      });
    }
    return out.slice(0,40);
  }

  function assessmentQuestions(ctx){return examQuestionsFor(ctx);}

  function placementScene(kind){
    if(kind==='station')return '<svg viewBox="0 0 420 220" role="img" aria-label="A train platform scene"><rect width="420" height="220" rx="20" fill="#eaf2ff"/><rect y="154" width="420" height="66" fill="#cbd5e1"/><rect x="40" y="72" width="250" height="82" rx="12" fill="#2563eb"/><rect x="61" y="88" width="54" height="36" rx="4" fill="#dbeafe"/><rect x="129" y="88" width="54" height="36" rx="4" fill="#dbeafe"/><circle cx="92" cy="161" r="18" fill="#334155"/><circle cx="240" cy="161" r="18" fill="#334155"/><circle cx="337" cy="90" r="16" fill="#f59e0b"/><path d="M337 106v45M337 120l-23 25M337 121l25 18" stroke="#475569" stroke-width="8" stroke-linecap="round"/><rect x="311" y="150" width="55" height="8" rx="4" fill="#64748b"/></svg>';
    return '<svg viewBox="0 0 420 220" role="img" aria-label="A meeting and presentation scene"><rect width="420" height="220" rx="20" fill="#f8fafc"/><rect x="24" y="24" width="210" height="115" rx="12" fill="#dbeafe"/><path d="M52 111L98 73l42 18 55-44" fill="none" stroke="#2563eb" stroke-width="7" stroke-linecap="round"/><rect x="72" y="166" width="276" height="18" rx="9" fill="#94a3b8"/><circle cx="285" cy="75" r="18" fill="#f59e0b"/><path d="M285 94v58M285 112l-30 24M285 112l34 20" stroke="#475569" stroke-width="9" stroke-linecap="round"/><circle cx="363" cy="120" r="14" fill="#fb7185"/><path d="M363 134v35" stroke="#475569" stroke-width="8" stroke-linecap="round"/></svg>';
  }
  function placementQuestions(){
    return [
      {type:'mcq',prompt:'Choose the grammatically correct sentence.',correct:'She has been working here since 2022.',options:['She has been working here since 2022.','She works here since 2022.','She has working here since 2022.','She is work here since 2022.']},
      {type:'listen-fill',prompt:'Voice → text: write exactly what you hear.',audio:'Had I known about the delay, I would have taken an earlier train.',correct:'Had I known about the delay, I would have taken an earlier train.'},
      {type:'tts-mcq',prompt:'Text → voice: listen to the sentence, then choose its closest meaning.',audio:'The proposal is unlikely to be approved unless the committee revises its underlying assumptions.',correct:'Approval probably requires the committee to change its basic assumptions.',options:['Approval probably requires the committee to change its basic assumptions.','The proposal has already been approved without changes.','The committee rejected every assumption before reading the proposal.','Approval is certain even if the assumptions remain unchanged.']},
      {type:'image-fill',prompt:'Image → text: describe what is happening in one precise English sentence.',scene:'station',keywords:['train','platform','person'],correct:'A person is waiting on a platform beside a train.'},
      {type:'translate-fill',prompt:'Translate into precise English: لو كنت قد راجعت البيانات بعناية أكبر، لما توصلت إلى ذلك الاستنتاج.',correct:'If I had reviewed the data more carefully, I would not have reached that conclusion.'},
      {type:'mcq',prompt:'Which sentence uses hedging appropriately in formal analysis?',correct:'The findings appear to suggest that the policy may have had a limited effect.',options:['The findings appear to suggest that the policy may have had a limited effect.','The findings absolutely prove everything forever.','The findings maybe are effecting policy definitely.','The findings proved perhaps certainly a limited effect.']},
      {type:'listen-fill',prompt:'Voice → text: transcribe the sentence exactly.',audio:'Not only did the intervention fail to reduce costs, but it also introduced additional administrative complexity.',correct:'Not only did the intervention fail to reduce costs, but it also introduced additional administrative complexity.'},
      {type:'image-fill',prompt:'Image → text: explain the scene in a complete English sentence.',scene:'presentation',keywords:['presentation','chart','people'],correct:'A presenter is explaining a chart to another person.'},
      {type:'translate-fill',prompt:'Translate into English: على الرغم من أن الأدلة تبدو مقنعة للوهلة الأولى، فإنها لا تبرر استنتاجاً قاطعاً.',correct:'Although the evidence appears convincing at first glance, it does not justify a definitive conclusion.'},
      {type:'tts-mcq',prompt:'Listen and choose the implication.',audio:'Much as I appreciate the ambition of the project, its implementation remains financially unsustainable.',correct:'The speaker respects the ambition but considers the implementation too costly to sustain.',options:['The speaker respects the ambition but considers the implementation too costly to sustain.','The speaker believes the project has no ambition.','The project has already become financially sustainable.','The speaker refuses to discuss implementation.']},
      {type:'mcq',prompt:'Choose the sentence with correct inversion.',correct:'Rarely have we encountered such a persistent discrepancy.',options:['Rarely have we encountered such a persistent discrepancy.','Rarely we have encountered such a persistent discrepancy.','Rarely did encountered we such discrepancy.','Rarely have encountered we such a discrepancy.']},
      {type:'translate-fill',prompt:'Translate into English: لولا القيود الزمنية، لكان من الممكن إجراء تحليل أكثر شمولاً للنتائج المتعارضة.',correct:'But for the time constraints, a more comprehensive analysis of the conflicting results could have been conducted.'},
      {type:'mcq',prompt:'Which option is the most precise C1-style reformulation?',correct:'The apparent correlation should not be interpreted as evidence of causality without further analysis.',options:['The apparent correlation should not be interpreted as evidence of causality without further analysis.','Correlation means causation and no more work is needed.','The things are related so one surely causes the other.','The apparent correlation is causal because it appears so.']},
      {type:'listen-fill',prompt:'Voice → text: transcribe this advanced sentence.',audio:'Were the underlying assumptions to change, the model would require substantial recalibration.',correct:'Were the underlying assumptions to change, the model would require substantial recalibration.'},
      {type:'translate-fill',prompt:'Translate into English: من المرجح أن يكون التباين ناتجاً جزئياً عن اختلاف طرق أخذ العينات، لا عن تغير حقيقي في الظاهرة نفسها.',correct:'The variation is likely to result partly from differences in sampling methods rather than from a genuine change in the phenomenon itself.'}
    ];
  }
  function answerSimilarity(value,correct){return similarity(value,correct);}
  function placementQuestionCorrect(question,value){
    const answer=String(value||'').trim();
    if(question.type==='mcq'||question.type==='tts-mcq')return answer===question.correct;
    if(question.keywords){
      const normalized=normalizeText(answer);
      const hits=question.keywords.filter(word=>normalized.includes(normalizeText(word))).length;
      return hits>=2&&normalized.split(' ').length>=5;
    }
    return answerSimilarity(answer,question.correct)>=.72;
  }
  function placementRecommendedLevel(score){
    if(score<30)return 0;
    if(score<45)return 1;
    if(score<62)return 2;
    if(score<80)return 3;
    return 4;
  }
  function renderPlacementQuestion(question,index){
    const name='placement-q'+index;
    if(question.type==='mcq'||question.type==='tts-mcq'){
      return '<fieldset class="placement-question"><legend><span>'+(index+1)+'</span>'+esc(question.prompt)+'</legend>'+
        (question.type==='tts-mcq'?'<button type="button" class="placement-listen" data-placement-listen="'+esc(question.audio)+'">▶ Play voice</button>':'')+
        question.options.map(option=>'<label><input type="radio" name="'+name+'" value="'+esc(option)+'" required><span>'+esc(option)+'</span></label>').join('')+'</fieldset>';
    }
    const visual=question.type==='image-fill'?'<div class="placement-scene">'+placementScene(question.scene)+'</div>':'';
    const listen=question.type==='listen-fill'?'<button type="button" class="placement-listen" data-placement-listen="'+esc(question.audio)+'">▶ Play voice</button>':'';
    return '<fieldset class="placement-question fill"><legend><span>'+(index+1)+'</span>'+esc(question.prompt)+'</legend>'+visual+listen+'<input type="text" name="'+name+'" autocomplete="off" required placeholder="Type your answer"></fieldset>';
  }
  function placementExamPage(){
    const questions=placementQuestions();
    return '<section class="language-course-page language-placement-page"><header class="language-page-head placement"><div><small>Diagnostic examination</small><h1>Benchmark my English</h1><p>This difficult multimodal diagnostic estimates your current level for analysis. The course still begins at Level 1 and never skips the driven sequence.</p></div><div class="language-context"><span>15 tasks</span><span>Multimodal</span><span>A1–C1 benchmark</span></div></header>'+
      '<div class="placement-warning"><strong>Do not use translation tools.</strong><span>Your result is a benchmark only; learning starts at Level 1 · Step 1 · Box 1.</span></div>'+
      '<form id="language-placement-form" class="language-exam-form placement-form">'+questions.map(renderPlacementQuestion).join('')+'<button class="btn btn-primary" type="submit">Evaluate my level</button><div class="language-exam-result" id="language-placement-result"></div></form></section>';
  }
  function levelChallengePanel(state){
    return '<section class="language-level-challenges"><div><small>Independent level challenges</small><h2>Examine any level</h2><p>Score greater than 80% to mark only that level complete. Lower levels are not credited, and a gap still blocks studying higher levels.</p></div><div class="language-challenge-grid">'+CEFR.map((level,index)=>'<button type="button" data-challenge-level="'+index+'" class="'+(isLevelPassed(state,index)?'passed':'')+'"><span>'+level.id+'</span><strong>'+(isLevelPassed(state,index)?'✓ Completed':'Challenge level')+'</strong></button>').join('')+'</div></section>';
  }
  function assessmentTitle(ctx){
    if(ctx.scope==='box')return 'Box '+ctx.box+' examination';
    if(ctx.scope==='step')return 'Step '+ctx.step+' examination';
    if(ctx.scope==='level')return CEFR[ctx.li].id+' level examination';
    return 'Whole English language examination';
  }
  function assessmentDescription(ctx){
    if(ctx.scope==='box')return 'Pass at 80% or higher to finish this box.';
    if(ctx.scope==='step')return 'The last box has no separate box exam. This assessment covers the entire step and completes its last box when passed.';
    if(ctx.scope==='level')return 'The final step ends with one whole-level examination instead of a separate Step 5 final-box exam.';
    return 'The final C1 boundary is one comprehensive examination across the complete English pathway.';
  }
  function examTypeLabel(type,arabic=false){
    const labels=arabic?{mcq:'اختيار واحد','true-false':'صح أو خطأ','multi-select':'إجابات متعددة',fill:'إكمال الكلمة','short-answer':'إجابة مكتوبة',speak:'نطق صوتي','listen-choice':'اختيار سمعي','listen-fill':'إملاء سمعي',ordering:'بناء الجملة'}:{mcq:'Single choice','true-false':'True / false','multi-select':'Multiple response',fill:'Fill the blank','short-answer':'Written response',speak:'Spoken production','listen-choice':'Listening choice','listen-fill':'Listening transcription',ordering:'Sentence builder'};
    return labels[type]||labels.mcq;
  }
  function examPrompt(prompt,arabic){
    if(!arabic)return prompt;
    const exact={
      'Which sentence best demonstrates this box’s target grammar?':'أي جملة تطبق قاعدة هذا الصندوق بأفضل صورة؟',
      'Which statement correctly describes this box’s grammar focus?':'أي عبارة تصف قاعدة هذا الصندوق بدقة؟',
      'Listen once, then choose the sentence you heard.':'استمع مرة واحدة، ثم اختر الجملة التي سمعتها.',
      'Complete the active-vocabulary word for this box.':'اكتب كلمة المفردات النشطة المطلوبة في هذا الصندوق.',
      'Write the complete reader-ready model from this box.':'اكتب النموذج الإنجليزي الكامل الصحيح من هذا الصندوق.',
      'What is the communicative function of this box?':'ما الوظيفة التواصلية لهذا الصندوق؟',
      'Listen and transcribe the pronunciation focus exactly.':'استمع واكتب نموذج النطق كما تسمعه تماماً.',
      'Which instruction best matches the writing task?':'أي تعليمات تطابق مهمة الكتابة؟',
      'Build the model sentence in the correct order.':'رتّب كلمات الجملة الإنجليزية ترتيباً صحيحاً.',
      'Select both valid review prompts.':'اختر طريقتي المراجعة الصحيحتين.'
    };
    if(exact[prompt])return exact[prompt];
    if(prompt.startsWith('True or false:'))return 'صح أم خطأ: '+prompt.slice(14);
    return prompt;
  }
  function renderExamQuestion(q,index,state,pos){
    const type=q.type||'mcq',qid=q.id||('question-'+index),name='q'+index;
    const arabic=usesArabicBridge(state,pos.li),head='<div class="language-question-head" dir="'+(arabic?'rtl':'ltr')+'"><span>'+(index+1)+'</span><div><small>'+esc(examTypeLabel(type,arabic))+'</small><legend>'+esc(examPrompt(q.prompt,arabic))+'</legend></div></div>';
    const listen=(type==='listen-choice'||type==='listen-fill')?'<button type="button" class="language-exam-listen" data-speak="'+esc(q.audio||q.correct||'')+'"><span>▶</span> '+(arabic?'تشغيل الصوت':'Play audio')+'</button>':'';
    let answer='';
    if(type==='speak')answer='<div class="language-exam-speak">'+pronunciationJudgeMarkup(q.correct||'','',String(q.correct||'').trim().split(/\s+/).length>1?'sentence':'word','',name)+'</div>';
    else if(type==='fill'||type==='short-answer'||type==='listen-fill')answer='<label class="language-exam-text"><span>'+(arabic?'إجابتك باللغة الهدف':'Your answer')+'</span><input type="text" name="'+name+'" autocomplete="off" required placeholder="'+(arabic?'اكتب الإجابة باللغة الهدف…':'Type your answer…')+'"></label>';
    else if(type==='ordering')answer='<div class="language-ordering" data-ordering="'+name+'"><div class="language-order-answer" data-order-answer aria-label="Your sentence"></div><div class="language-order-bank">'+(q.tokens||String(q.correct||'').split(/\s+/)).map(token=>'<button type="button" data-order-token="'+esc(token)+'">'+esc(token)+'</button>').join('')+'</div><input type="hidden" name="'+name+'"></div>';
    else if(type==='multi-select')answer='<div class="language-answer-options multiple">'+(q.options||[]).map(option=>'<label><input type="checkbox" name="'+name+'" value="'+esc(option)+'"><span><i></i>'+esc(option)+'</span></label>').join('')+'</div>';
    else answer='<div class="language-answer-options">'+(q.options||[]).map(option=>'<label><input type="radio" name="'+name+'" value="'+esc(option)+'" required><span><i></i>'+esc(option)+'</span></label>').join('')+'</div>';
    return '<fieldset class="language-exam-question-item" data-language-exam-item="'+esc(qid)+'" data-question-type="'+esc(type)+'">'+head+listen+answer+'</fieldset>';
  }
  function examAnswerCorrect(question,form,index){
    const type=question.type||'mcq',name='q'+index;
    if(type==='multi-select'){
      const answer=form.getAll(name).map(String).sort(),correct=(Array.isArray(question.correct)?question.correct:[question.correct]).map(String).sort();
      return answer.length===correct.length&&answer.every((value,i)=>value===correct[i]);
    }
    const answer=String(form.get(name)||'').trim(),correct=String(question.correct||'').trim();
    if(type==='fill')return normalizeText(answer)===normalizeText(correct);
    if(type==='speak')return geminiRatingAccepted(answer);
    if(type==='short-answer'||type==='listen-fill')return answerSimilarity(answer,correct)>=.82;
    if(type==='ordering')return normalizeText(answer)===normalizeText(correct);
    return answer===correct;
  }
  function examFormMarkup(questions,mode,passed,state,pos){
    if(!questions.length)return '<div class="language-exam-prereqs"><strong>Exam unavailable</strong><span>Add at least one exam question from Content Control → Control the exam.</span></div>';
    return '<form id="language-exam-form" data-exam-mode="'+mode+'" data-exam-stepper class="language-exam-form"><div class="language-exam-progress"><span data-exam-position>01 / '+questions.length+'</span><i><b data-exam-meter style="width:'+(100/questions.length)+'%"></b></i></div><div class="language-exam-question-list">'+questions.map((q,index)=>renderExamQuestion(q,index,state,pos)).join('')+'</div><p class="language-exam-step-message" data-exam-step-message aria-live="polite"></p><nav class="language-exam-step-nav"><button type="button" data-exam-previous disabled>←</button><button type="button" data-exam-next>→</button></nav><div class="language-exam-submit"><div><small>Complete</small><strong>'+questions.length+' answers</strong></div><button class="btn btn-primary" type="submit" '+(passed?'disabled':'')+'>'+(passed?'✓ Exam passed':t('submitExam'))+'</button></div><div class="language-exam-result" id="language-exam-result" aria-live="polite"></div></form>';
  }

  function examinePage(){
    const state=languageState();
    if(state.placementPending)return placementExamPage();
    const pos=activeLanguagePosition(state);
    if(false&&Number.isInteger(state.challengeLevel)&&!languageAuthoringTarget){
      const li=state.challengeLevel,ctx={scope:'level',li,step:5,box:boxCount(li)},questions=assessmentQuestions(ctx),passed=isLevelPassed(state,li);
      const challengePos={li,step:5,box:boxCount(li)};
      return '<section class="language-course-page language-exam-process-page">'+processTop(state,challengePos,questions.length)+'<button type="button" class="language-cancel-challenge" data-cancel-level-challenge>←</button>'+examFormMarkup(questions,'challenge',passed,state,challengePos)+'</section>';
    }
    const ctx=naturalExamContext(pos.li,pos.step,pos.box),missing=languageAuthoringTarget?[]:assessmentMissing(state,ctx),ready=languageAuthoringTarget||missing.length===0,passed=assessmentPassed(state,ctx);
    const questions=ready?assessmentQuestions(ctx):[];
    return '<section class="language-course-page language-exam-process-page">'+processTop(state,pos,questions.length||1)+(!ready?'<div class="language-exam-prereqs"><strong>Still required</strong>'+missing.map(item=>'<span>'+esc(item)+'</span>').join('')+'</div>':examFormMarkup(questions,'natural',passed,state,pos))+'</section>';
  }

  let personalTimer=null;
  const personalRoomKey=()=> 'dafatii:personal-focus-room:'+String(window.DafatiiCourses.active().id||'none')+':v1';
  function personalRoomPage(){
    const room=window.DafatiiData.readJSON(personalRoomKey(),{goal:'',notes:'',minutes:50,sessions:0})||{goal:'',notes:'',minutes:50,sessions:0};
    return '<section class="language-course-page personal-focus-page"><header class="personal-focus-hero"><div><small>Personal course · one private room</small><h1>My Focus Room</h1><p>A single distraction-controlled studio for deliberate study, session timing, working notes and materials.</p></div><div class="personal-focus-stat"><strong>'+Number(room.sessions||0)+'</strong><span>focus sessions</span></div></header><div class="personal-focus-grid"><article class="personal-focus-timer"><small>Focus block</small><div id="personal-focus-clock">'+String(Number(room.minutes||50)).padStart(2,'0')+':00</div><div><button type="button" data-personal-timer="start">Start</button><button type="button" data-personal-timer="reset">Reset</button></div><label>Minutes<input id="personal-focus-minutes" type="number" min="5" max="180" value="'+Number(room.minutes||50)+'"></label></article><article class="personal-focus-card"><small>One outcome</small><h2>What must be true when this block ends?</h2><textarea id="personal-focus-goal" rows="4" placeholder="Define one observable outcome…">'+esc(room.goal||'')+'</textarea><button type="button" data-personal-save>Save room</button></article><article class="personal-focus-card wide"><small>Working notes</small><h2>Keep the room quiet; capture only useful thinking.</h2><textarea id="personal-focus-notes" rows="10" placeholder="Notes, questions, formulas, links…">'+esc(room.notes||'')+'</textarea></article></div></section>';
  }
  function savePersonalRoom(extra={}){const previous=window.DafatiiData.readJSON(personalRoomKey(),{})||{};window.DafatiiData.writeJSON(personalRoomKey(),{...previous,...extra});}
  function bindPersonalRoom(){
    document.querySelector('[data-personal-save]')?.addEventListener('click',()=>{savePersonalRoom({goal:document.getElementById('personal-focus-goal').value,notes:document.getElementById('personal-focus-notes').value,minutes:Number(document.getElementById('personal-focus-minutes').value)||50});});
    document.querySelector('[data-personal-timer="reset"]')?.addEventListener('click',()=>{if(personalTimer){clearInterval(personalTimer);personalTimer=null;}const m=Number(document.getElementById('personal-focus-minutes').value)||50;document.getElementById('personal-focus-clock').textContent=String(m).padStart(2,'0')+':00';});
    document.querySelector('[data-personal-timer="start"]')?.addEventListener('click',()=>{if(personalTimer)return;let remaining=(Number(document.getElementById('personal-focus-minutes').value)||50)*60;const clock=document.getElementById('personal-focus-clock');personalTimer=setInterval(()=>{remaining--;clock.textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');if(remaining<=0){clearInterval(personalTimer);personalTimer=null;const room=window.DafatiiData.readJSON(personalRoomKey(),{})||{};savePersonalRoom({sessions:Number(room.sessions||0)+1,goal:document.getElementById('personal-focus-goal').value,notes:document.getElementById('personal-focus-notes').value,minutes:Number(document.getElementById('personal-focus-minutes').value)||50});}},1000);});
  }

  function languageContent(page){
    if(page==='language-home')return homePage();
    if(page==='language-letter-learn')return letterGateLearnPage(languageState());
    if(page==='language-letter-exam')return letterGateExamPage(languageState());
    if(page==='language-letters')return lettersPage();
    if(page==='language-voice')return voicePage();
    if(page==='language-grammar')return grammarPage();
    if(page==='language-video')return videoPage();
    if(page==='language-review')return reviewPage();
    if(page==='language-examine')return examinePage();
    return homePage();
  }

  function installWorkspaceRoutes(){
    const previousContent=workspaceContent;
    workspaceContent=function(page,parts,title){
      if(isLanguage()&&LANGUAGE_ROUTES.includes(page))return languageContent(page);
      if(courseType()==='personal'&&page==='study-rooms')return personalRoomPage();
      return previousContent(page,parts,title);
    };
    const previousWorkspace=workspace;
    workspace=function(current){
      const type=courseType(),page=String(current||'').split('/')[0];
      if(type==='language' && window.DafatiiCourses.active().id){
        const state=languageState();
        if(!languageAuthoringTarget&&!state.baseLanguage&&page!=='language-home'){setHash('language-home');return;}
        if(!languageAuthoringTarget&&letterGateRequired(state)&&!LETTER_GATE_ROUTES.includes(page)&&!['change-course','profile','settings'].includes(page)){setHash('language-home');return;}
        if(!languageAuthoringTarget&&!letterGateRequired(state)&&['language-letter-learn','language-letter-exam'].includes(page)){setHash('language-home');return;}
        if(!languageAuthoringTarget&&!letterGateRequired(state)&&state.placementPending&&page!=='language-examine'){setHash('language-examine');return;}
        if(!languageAuthoringTarget&&!letterGateRequired(state)&&!state.onboardingComplete&&!state.placementPending&&page!=='language-home'){setHash('language-home');return;}
        if(!languageAuthoringTarget&&Object.prototype.hasOwnProperty.call(LEARNING_LANE_PREREQUISITES,page)){const pos=clampSelection(state);if(!learningLaneUnlocked(state,pos,page)){setHash(nextBoxRoute(state,pos));return;}}
        if(!LANGUAGE_ROUTES.includes(page) && !['change-course','profile','settings','representer','admin'].includes(page)){setHash('language-home');return;}
      }
      if(type==='personal'&&page==='chat'){setHash('study-rooms');return;}
      previousWorkspace(current);
      adaptNavigation();
      if(type==='language')bindLanguagePage();
      if(type==='personal'&&page==='study-rooms')bindPersonalRoom();
    };
  }

  const navSpec=[
    ['language-home','nav-home','home'],['language-letters','file','letters'],['language-voice','nav-messages','voice'],
    ['language-grammar','star','grammar'],['language-video','play','video'],['language-examine','check','examine']
  ];
  function icon(name){return window.DafatiiIcons && window.DafatiiIcons.icon ? window.DafatiiIcons.icon(name) : '<span>•</span>';}
  function languageNavLabel(item){return t(item[2]);}
  function navLaneState(route){const state=languageState(),pos=clampSelection(state);return learningLaneUnlocked(state,pos,route);}
  function sideLanguageNav(current){
    return navSpec.map(item=>{const unlocked=navLaneState(item[0]);return '<a href="#'+item[0]+'" class="quiet-link '+(current===item[0]?'selected ':'')+(!unlocked?'language-nav-locked':'')+'" '+(current===item[0]?'aria-current="page" ':'')+(!unlocked?'aria-disabled="true" tabindex="-1"':'')+'>'+icon(item[1])+'<span>'+esc(languageNavLabel(item))+'</span></a>';}).join('');
  }
  function bottomLanguageNav(current){
    return navSpec.map(item=>{const unlocked=navLaneState(item[0]);return '<a href="#'+item[0]+'" class="bottom-nav-item language-bottom-item '+(current===item[0]?'is-active ':'')+(!unlocked?'language-nav-locked':'')+'" '+(current===item[0]?'aria-current="page" ':'')+(!unlocked?'aria-disabled="true" tabindex="-1"':'')+'><span class="bottom-nav-icon">'+icon(item[1])+'</span><span class="bottom-nav-label">'+esc(languageNavLabel(item))+'</span></a>';}).join('');
  }
  function adaptNavigation(){
    const type=courseType(),current=(location.hash||'#language-home').replace(/^#\/?/,'').split('/')[0];
    if(type==='personal'){
      document.querySelectorAll('a[href^="#chat"],[data-page="chat"],[data-bottom-nav-item="chat"]').forEach(node=>node.remove());
      if(current==='study-rooms')document.querySelector('.quiet-workspace>.sub-nav')?.remove();
      return;
    }
    if(type!=='language')return;
    document.querySelector('.quiet-workspace>.sub-nav')?.remove();
    document.querySelector('.quiet-return-button')?.remove();
    const shell=document.querySelector('.quiet-workspace');
    if(shell){
      shell.classList.add('language-course-shell');
      shell.dataset.languagePage=current.replace(/^language-/,'')||'home';
    }
    const state=languageState(),gate=letterGateRequired(state)||['language-letter-learn','language-letter-exam'].includes(current);
    const side=document.querySelector('.quiet-sidebar > nav'),desktop=document.querySelector('.quiet-desktop-tabs'),bottom=document.querySelector('.bottom-nav');
    if(gate){
      if(side)side.innerHTML='';
      if(desktop)desktop.innerHTML='';
      if(bottom)bottom.innerHTML='';
      const toolbarTitle=document.querySelector('.quiet-toolbar-title strong'),toolbarKicker=document.querySelector('.quiet-toolbar-title small');
      if(toolbarTitle)toolbarTitle.textContent='English letters';
      if(toolbarKicker)toolbarKicker.textContent='Prerequisite';
      return;
    }
    const activeNav=navSpec.find(item=>item[0]===current);
    const toolbarTitle=document.querySelector('.quiet-toolbar-title strong');
    const toolbarKicker=document.querySelector('.quiet-toolbar-title small');
    const target=courseTargetLanguage(languageState());
    if(toolbarTitle)toolbarTitle.textContent=activeNav?languageNavLabel(activeNav):target+' course';
    if(toolbarKicker)toolbarKicker.textContent=target+' course';
    if(side)side.innerHTML=sideLanguageNav(current);
    if(desktop)desktop.innerHTML=sideLanguageNav(current);
    if(bottom)bottom.innerHTML=bottomLanguageNav(current);
  }

  function normalizeText(value){
    return String(value||'').toLowerCase().replace(/[^\p{L}\p{N}\s']/gu,' ').replace(/\s+/g,' ').trim();
  }
  function similarity(a,b){
    const x=normalizeText(a).split(' '),y=normalizeText(b).split(' ');
    if(!x.length||!y.length)return 0;
    const ys=new Map();y.forEach(word=>ys.set(word,(ys.get(word)||0)+1));
    let match=0;x.forEach(word=>{if(ys.get(word)>0){match++;ys.set(word,ys.get(word)-1);}});
    return (2*match)/(x.length+y.length);
  }
  function speak(text){
    if(!('speechSynthesis' in window))return;
    speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(String(text||''));utterance.lang=speechLocale(courseTargetLanguage(languageState()));utterance.rate=.88;speechSynthesis.speak(utterance);
  }
  function speakLetter(letter){
    const key=String(letter||'').toUpperCase();
    speak(LETTER_SPEECH[key]||key);
  }
  function rasterGrid(data,width,height,cols=30,rows=18){
    const grid=new Uint8Array(cols*rows);
    for(let row=0;row<rows;row++){
      const y0=Math.floor(row*height/rows),y1=Math.max(y0+1,Math.floor((row+1)*height/rows));
      for(let col=0;col<cols;col++){
        const x0=Math.floor(col*width/cols),x1=Math.max(x0+1,Math.floor((col+1)*width/cols));
        let hits=0,samples=0;
        for(let y=y0;y<y1;y+=2){
          for(let x=x0;x<x1;x+=2){
            samples++;
            if(data[(y*width+x)*4+3]>24)hits++;
          }
        }
        if(samples&&hits/samples>=.035)grid[row*cols+col]=1;
      }
    }
    return {grid,cols,rows};
  }
  function glyphGuideGrid(canvas,letter,kind){
    const guide=document.createElement('canvas');guide.width=canvas.width;guide.height=canvas.height;
    const ctx=guide.getContext('2d',{willReadFrequently:true});
    const glyph=kind==='lower'?String(letter).toLowerCase():String(letter).toUpperCase();
    ctx.clearRect(0,0,guide.width,guide.height);
    ctx.fillStyle='#000';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='900 '+Math.round(guide.height*.72)+'px Manrope, "DM Sans", sans-serif';
    ctx.fillText(glyph,guide.width/2,guide.height/2+guide.height*.035);
    return rasterGrid(ctx.getImageData(0,0,guide.width,guide.height).data,guide.width,guide.height);
  }
  function hasNeighbor(grid,col,row,cols,rows,radius=1){
    for(let y=Math.max(0,row-radius);y<=Math.min(rows-1,row+radius);y++){
      for(let x=Math.max(0,col-radius);x<=Math.min(cols-1,col+radius);x++){
        if(grid[y*cols+x])return true;
      }
    }
    return false;
  }
  function normalizedRasterGrid(data,width,height,cols=24,rows=24){
    let minX=width,minY=height,maxX=-1,maxY=-1;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>24){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}
    const grid=new Uint8Array(cols*rows);
    if(maxX<minX||maxY<minY)return {grid,cols,rows};
    const spanX=Math.max(1,maxX-minX+1),spanY=Math.max(1,maxY-minY+1);
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      if(data[(y*width+x)*4+3]<=24)continue;
      const col=Math.min(cols-1,Math.floor((x-minX)/spanX*cols)),row=Math.min(rows-1,Math.floor((y-minY)/spanY*rows));
      grid[row*cols+col]=1;
    }
    return {grid,cols,rows};
  }
  function normalizedGlyphGuideGrid(canvas,letter,kind){
    const guide=document.createElement('canvas');guide.width=canvas.width;guide.height=canvas.height;
    const ctx=guide.getContext('2d',{willReadFrequently:true}),glyph=kind==='lower'?String(letter).toLowerCase():String(letter).toUpperCase();
    ctx.clearRect(0,0,guide.width,guide.height);ctx.fillStyle='#000';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 '+Math.round(guide.height*.72)+'px Manrope, "DM Sans", sans-serif';ctx.fillText(glyph,guide.width/2,guide.height/2+guide.height*.035);
    return normalizedRasterGrid(ctx.getImageData(0,0,guide.width,guide.height).data,guide.width,guide.height);
  }
  function scoreLetterCanvas(canvas,letter,kind,normalized=false){
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    const user=normalized?normalizedRasterGrid(data,canvas.width,canvas.height):rasterGrid(data,canvas.width,canvas.height);
    const guide=normalized?normalizedGlyphGuideGrid(canvas,letter,kind):glyphGuideGrid(canvas,letter,kind);
    let guideCount=0,userCount=0,covered=0,onGuide=0;
    for(let row=0;row<guide.rows;row++){
      for(let col=0;col<guide.cols;col++){
        const index=row*guide.cols+col;
        if(guide.grid[index]){
          guideCount++;
          if(hasNeighbor(user.grid,col,row,user.cols,user.rows,1))covered++;
        }
        if(user.grid[index]){
          userCount++;
          if(hasNeighbor(guide.grid,col,row,guide.cols,guide.rows,1))onGuide++;
        }
      }
    }
    if(!guideCount||!userCount)return {valid:false,score:0,coverage:0,precision:0};
    const coverage=covered/guideCount,precision=onGuide/userCount;
    const score=coverage*.58+precision*.42;
    const enoughInk=userCount>=Math.max(5,guideCount*(normalized?.18:.36));
    const valid=normalized?(enoughInk&&coverage>=.38&&precision>=.46&&score>=.43):(enoughInk&&coverage>=.60&&precision>=.58&&score>=.64);
    return {valid,score,coverage,precision};
  }
  function bindValidatedLetterCanvas(canvas,letter,kind,onScore,options={}){
    if(!canvas)return;
    const ctx=canvas.getContext('2d',{willReadFrequently:true}),normalized=Boolean(options.normalized);
    ctx.lineWidth=normalized?Math.max(18,Math.round(canvas.width/34)):Math.max(10,Math.round(canvas.width/62));ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#111827';
    let drawing=false,last=null;
    const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*(canvas.width/r.width),y:(e.clientY-r.top)*(canvas.height/r.height)};};
    const drawEvent=e=>{
      const events=typeof e.getCoalescedEvents==='function'?e.getCoalescedEvents():[e];
      for(const item of events){
        const p=point(item);
        if(!last){ctx.beginPath();ctx.moveTo(p.x,p.y);last=p;continue;}
        const mid={x:(last.x+p.x)/2,y:(last.y+p.y)/2};
        ctx.quadraticCurveTo(last.x,last.y,mid.x,mid.y);ctx.stroke();last=p;
      }
    };
    const evaluate=()=>{const result=scoreLetterCanvas(canvas,letter,kind,normalized);canvas.dataset.valid=String(result.valid);canvas.dataset.score=String(result.score);onScore(result);};
    canvas.onpointerdown=e=>{if(e.cancelable)e.preventDefault();drawing=true;canvas.setPointerCapture(e.pointerId);last=null;drawEvent(e);};
    canvas.onpointermove=e=>{if(!drawing)return;if(e.cancelable)e.preventDefault();drawEvent(e);};
    canvas.onpointerup=e=>{if(!drawing)return;if(e.cancelable)e.preventDefault();drawEvent(e);drawing=false;last=null;evaluate();};
    canvas.onpointercancel=()=>{drawing=false;last=null;evaluate();};
    canvas.__letterClear=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);canvas.dataset.valid='false';canvas.dataset.score='0';onScore({valid:false,score:0,coverage:0,precision:0});};
  }
  function bindLetterDrawing(){
    const upper=document.getElementById('letter-upper-canvas'),lower=document.getElementById('letter-lower-canvas'),gate=Boolean(document.querySelector('[data-letter-gate-learning]'));
    const complete=document.querySelector(gate?'[data-gate-letter-complete]':'[data-letter-complete]'),next=document.querySelector(gate?'[data-gate-letter-next]':'[data-letter-next]'),feedback=document.querySelector('[data-letter-feedback]');
    if(!upper||!lower||!complete)return;
    const letter=(gate?complete.dataset.gateLetterComplete:complete.dataset.letterComplete)||'A',alreadyDone=complete.dataset.letterDone==='true';
    const pronunciation=gate?document.querySelector('[data-pronunciation-key="letter:'+letter+'"]'):null;
    let upperResult={valid:false,score:0},lowerResult={valid:false,score:0},pronunciationPassed=!gate||pronunciation?.dataset.pronunciationAccepted==='true';
    const update=()=>{
      if(alreadyDone){
        complete.disabled=true;if(next)next.disabled=false;
        if(feedback)feedback.textContent='✓ '+letter+' is already completed. You can retrace it for practice or continue.';
        return;
      }
      const valid=upperResult.valid&&lowerResult.valid&&pronunciationPassed;
      complete.disabled=!valid;if(next)next.disabled=true;
      const upperPct=Math.round((upperResult.score||0)*100),lowerPct=Math.round((lowerResult.score||0)*100);
      if(feedback)feedback.textContent=valid
        ? '✓ Shapes and Gemini pronunciation are accepted. Complete '+letter+' to continue.'
        : 'Finish all checks · uppercase '+upperPct+'% · lowercase '+lowerPct+'% · pronunciation '+(pronunciationPassed?'✓':'needed')+'.';
    };
    if(gate)pronunciation?.addEventListener('dafatii:pronunciationgraded',event=>{pronunciationPassed=Boolean(event.detail?.accepted);update();});
    bindValidatedLetterCanvas(upper,letter,'upper',result=>{upperResult=result;update();});
    bindValidatedLetterCanvas(lower,letter,'lower',result=>{lowerResult=result;update();});
    document.querySelectorAll('[data-canvas-clear]').forEach(button=>button.onclick=()=>{
      const canvas=document.getElementById(button.dataset.canvasClear);canvas?.__letterClear?.();
    });
    update();
  }

  function bindLetterGateExam(){
    document.querySelectorAll('[data-letter-exam-listen]').forEach(button=>button.onclick=()=>speakLetter(button.dataset.letterExamListen));
    const canvases=[...document.querySelectorAll('[data-letter-exam-question]')].map(question=>{
      const canvas=question.querySelector('canvas'),letter=question.dataset.expectedLetter,kind=question.dataset.letterKind||'upper',feedback=question.querySelector('[data-letter-exam-feedback]');
      bindValidatedLetterCanvas(canvas,letter,kind,result=>{
        if(feedback)feedback.textContent=result.valid?'✓ Shape recognized.':'Keep the requested letter large and centered, then try again.';
      },{normalized:true});
      return canvas;
    });
    document.querySelectorAll('[data-letter-exam-clear]').forEach(button=>button.onclick=()=>document.getElementById(button.dataset.letterExamClear)?.__letterClear?.());
    const form=document.getElementById('letter-gate-exam-form');
    if(!form)return;
    form.onsubmit=event=>{
      event.preventDefault();
      const correct=canvases.filter(canvas=>canvas?.dataset.valid==='true').length,score=Math.round(correct/10*100),passed=correct>=8,result=document.getElementById('letter-gate-exam-result');
      updateLanguage(state=>{
        state.examHistory.push({scope:'letters-gate',score,correct,total:10,passed,at:Date.now()});
        if(passed)state.letterGatePassed=true;
      });
      result.className='language-exam-result '+(passed?'passed':'failed');
      result.textContent=passed?'Passed · '+correct+'/10 drawings recognized. The English course is unlocked.':'Score '+correct+'/10. Redraw the missed letters or return to learning, then retry.';
      if(passed)setTimeout(()=>setHash('language-home'),700);
    };
  }

  function videoResponseValid(language,value){
    return String(value||'').trim().length>=3;
  }
  const GEMINI_ACCEPTED_RATINGS = Object.freeze(['moderate','good','very good']);
  function geminiRatingAccepted(rating){return GEMINI_ACCEPTED_RATINGS.includes(String(rating||'').toLowerCase());}
  function pronunciationJudgeMarkup(targetText,stateKey,kind,rating,inputName=''){
    const value=String(rating||'').toLowerCase(),accepted=geminiRatingAccepted(value);
    return '<div class="language-pronunciation-judge '+(value==='bad'?'failed ':accepted?'accepted ':'')+'" data-pronunciation-judge data-pronunciation-target="'+esc(targetText)+'" data-pronunciation-key="'+esc(stateKey||'')+'" data-pronunciation-kind="'+esc(kind||'word')+'" data-pronunciation-accepted="'+(accepted?'true':'false')+'">'+
      '<div class="language-pronunciation-command"><strong>'+esc(targetText)+'</strong><button type="button" data-gemini-pronunciation>🎙 '+(accepted?'Record again':'Open microphone')+'</button></div>'+
      '<div class="language-pronunciation-grade" data-pronunciation-grade '+(value?'':'hidden')+'><small>Gemini pronunciation</small><strong data-pronunciation-rating-value>'+esc(value)+'</strong><span data-pronunciation-rating-message>'+(value==='bad'?'Not accepted · pronounce it again.':accepted?'Accepted · pronunciation passed.':'')+'</span></div>'+
      '<p class="language-feedback" data-pronunciation-feedback>'+(accepted?'Accepted. You may continue.':'')+'</p>'+
      (inputName?'<input type="hidden" name="'+esc(inputName)+'" value="'+esc(value)+'">':'')+
    '</div>';
  }
  function blobAsBase64(blob){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(String(reader.result||'').split(',')[1]||'');
      reader.onerror=()=>reject(reader.error||new Error('Could not read microphone recording.'));
      reader.readAsDataURL(blob);
    });
  }
  function bindGeminiPronunciation(){
    document.querySelectorAll('[data-pronunciation-judge]').forEach(root=>{
      const button=root.querySelector('[data-gemini-pronunciation]'),feedback=root.querySelector('[data-pronunciation-feedback]'),grade=root.querySelector('[data-pronunciation-grade]'),ratingValue=root.querySelector('[data-pronunciation-rating-value]'),ratingMessage=root.querySelector('[data-pronunciation-rating-message]'),hidden=root.querySelector('input[type="hidden"]');
      if(!button)return;
      let recorder=null,stream=null,chunks=[],timer=null,busy=false;
      const targetText=String(root.dataset.pronunciationTarget||'').trim(),kind=String(root.dataset.pronunciationKind||'word'),stateKey=String(root.dataset.pronunciationKey||'');
      const stopTracks=()=>{if(stream){stream.getTracks().forEach(track=>track.stop());stream=null;}};
      const showRating=rating=>{
        const accepted=geminiRatingAccepted(rating);
        root.dataset.pronunciationAccepted=accepted?'true':'false';
        root.classList.toggle('accepted',accepted);root.classList.toggle('failed',rating==='bad');
        if(hidden){hidden.value=rating;hidden.dispatchEvent(new Event('change',{bubbles:true}));}
        if(grade)grade.hidden=!rating;
        if(ratingValue)ratingValue.textContent=rating||'';
        if(ratingMessage)ratingMessage.textContent=rating==='bad'?'Not accepted · pronounce it again.':accepted?'Accepted · pronunciation passed.':'';
        root.dispatchEvent(new CustomEvent('dafatii:pronunciationgraded',{bubbles:true,detail:{rating,accepted,stateKey}}));
      };
      const evaluate=async blob=>{
        busy=true;button.disabled=true;button.textContent='Gemini is judging…';
        if(feedback)feedback.textContent='Uploading this short recording securely for pronunciation evaluation…';
        try{
          if(!window.DafatiiApi?.request)throw new Error('The grading API client is unavailable.');
          const audioData=await blobAsBase64(blob);
          const state=languageState(),pos=activeLanguagePosition(state);
          const result=await window.DafatiiApi.request('/language/pronunciation',{method:'POST',body:{
            targetText,kind,audioData,mimeType:(blob.type||'audio/webm'),targetLanguage:courseTargetLanguage(state),level:CEFR[pos.li].id
          }});
          const rating=String(result?.rating||'').toLowerCase();
          if(!['bad','moderate','good','very good'].includes(rating))throw new Error('Gemini returned an unsupported pronunciation rating.');
          if(stateKey)updateLanguage(value=>{value.pronunciationRatings[stateKey]=rating;});
          showRating(rating);
          if(feedback)feedback.textContent=rating==='bad'?'Not accepted. Listen to the target and pronounce it again.':rating==='moderate'?'Accepted · recognizable pronunciation.':rating==='good'?'Accepted · good pronunciation.':'Accepted · very good pronunciation.';
        }catch(error){
          if(feedback)feedback.textContent=error?.message||'Pronunciation grading failed. Try again.';
        }finally{
          busy=false;button.disabled=false;button.textContent='🎙 Record again';stopTracks();
        }
      };
      button.onclick=async()=>{
        if(busy)return;
        if(recorder&&recorder.state==='recording'){clearTimeout(timer);recorder.stop();button.disabled=true;return;}
        if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){if(feedback)feedback.textContent='Microphone recording is not supported in this browser.';return;}
        try{
          stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
          const candidates=['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4'];
          const mime=candidates.find(type=>typeof MediaRecorder.isTypeSupported!=='function'||MediaRecorder.isTypeSupported(type))||'';
          recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);chunks=[];
          recorder.ondataavailable=event=>{if(event.data?.size)chunks.push(event.data);};
          recorder.onstop=()=>{clearTimeout(timer);const blob=new Blob(chunks,{type:recorder.mimeType||chunks[0]?.type||'audio/webm'});recorder=null;if(!blob.size){stopTracks();if(feedback)feedback.textContent='No microphone audio was captured. Try again.';button.disabled=false;return;}evaluate(blob);};
          recorder.onerror=()=>{clearTimeout(timer);recorder=null;stopTracks();button.disabled=false;button.textContent='🎙 Open microphone';if(feedback)feedback.textContent='Microphone recording failed. Try again.';};
          recorder.start();
          button.textContent='■ Stop & judge';if(feedback)feedback.textContent='Recording… pronounce '+targetText+' clearly, then stop.';
          timer=setTimeout(()=>{if(recorder?.state==='recording')recorder.stop();},6000);
        }catch(error){stopTracks();if(feedback)feedback.textContent='Microphone permission is required for pronunciation.';}
      };
    });
  }

  function bindVideoUnderstanding(){
    const watchedButton=document.querySelector('[data-video-watched]'),field=document.getElementById('language-video-response');
    const complete=document.querySelector('[data-video-evaluate]'),feedback=document.querySelector('[data-video-response-feedback]'),ratingBox=document.querySelector('[data-video-rating]');
    if(!field||!complete)return;
    const state=languageState(),pos=activeLanguagePosition(state),id=keyBox(CEFR[pos.li].id,pos.step,pos.box);
    const items=languagePageItems(pos.li,pos.step,pos.box,'video'),videoItem=items.find(item=>item.type==='video'),responseItem=items.find(item=>item.type==='response');
    if(!videoItem||!responseItem)return;
    const youtubeUrl=String(videoItem.youtubeUrl||'').trim(),validYouTube=/^https:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\//i.test(youtubeUrl);
    const responseLanguage=learningLanguage(state,pos.li).target;
    let watched=Boolean(state.watchedVideos[id]),busy=false;
    const setRating=(rating,message)=>{
      if(ratingBox){
        ratingBox.hidden=!rating;
        ratingBox.classList.toggle('failed',rating==='bad');
        ratingBox.classList.toggle('accepted',Boolean(rating&&rating!=='bad'));
        ratingBox.querySelector('strong').textContent=rating||'';
        ratingBox.querySelector('span').textContent=message||'';
      }
    };
    const updateGate=()=>{
      const valid=videoResponseValid(responseLanguage,field.value),done=complete.classList.contains('done');
      complete.disabled=done||busy||!(validYouTube&&watched&&valid);
      if(done)complete.textContent='✓ '+t('completed');
      else if(busy)complete.textContent='Gemini is judging…';
      else if(!validYouTube)complete.textContent='Add a valid YouTube video link first';
      else if(!watched)complete.textContent='Watch the YouTube video first';
      else if(!valid)complete.textContent='Write what you understood first';
      else complete.textContent='Judge understanding with Gemini';
      if(feedback&&!busy)feedback.textContent=valid?'Ready for Gemini understanding evaluation.':'Write what you understood from the video.';
    };
    watchedButton?.addEventListener('click',()=>{
      if(!validYouTube)return;
      watched=true;
      watchedButton.textContent='✓ Watched';
      updateLanguage(value=>{value.watchedVideos[id]=true;});
      updateGate();
    });
    field.addEventListener('input',()=>{
      setRating('','');
      if(feedback)feedback.textContent='';
      updateGate();
    });
    field.addEventListener('blur',()=>updateLanguage(value=>{value.videoResponses[id]=field.value;}));
    complete.onclick=async()=>{
      if(complete.disabled||busy)return;
      busy=true;setRating('','');
      if(feedback)feedback.textContent='Gemini is comparing your explanation with the YouTube video…';
      updateGate();
      try{
        if(!window.DafatiiApi?.request)throw new Error('The grading API client is unavailable.');
        const result=await window.DafatiiApi.request('/language/video-understanding',{method:'POST',body:{
          videoUrl:youtubeUrl,responseText:field.value,level:CEFR[pos.li].id,step:pos.step,box:pos.box,targetLanguage:responseLanguage
        }});
        const rating=String(result?.rating||'').toLowerCase();
        if(!['bad','moderate','good','very good'].includes(rating))throw new Error('Gemini returned an unsupported rating.');
        const accepted=rating!=='bad';
        updateLanguage(value=>{
          value.videoResponses[id]=field.value;
          value.videoRatings[id]=rating;
          value.modules[id]=value.modules[id]||{};
          value.modules[id].video=accepted;
          syncBoxCompletion(value,pos.li,pos.step,pos.box);
        });
        if(accepted){
          setRating(rating,rating==='moderate'?'Accepted · enough correct understanding to continue.':rating==='good'?'Accepted · good understanding.':'Accepted · very good understanding.');
          if(feedback)feedback.textContent='Accepted. You can continue to the exam.';
          setTimeout(()=>render(),650);
        }else{
          setRating('bad','Not accepted · revise what you understood and submit again.');
          if(feedback)feedback.textContent='Not accepted. Rewatch the video, rewrite your understanding, and ask Gemini to judge it again.';
        }
      }catch(error){
        setRating('','');
        if(feedback)feedback.textContent=error?.message||'Gemini grading failed. Try again.';
      }finally{
        busy=false;updateGate();
      }
    };
    updateGate();
  }

  function bindPlacementExam(){
    document.querySelectorAll('[data-placement-listen]').forEach(button=>button.onclick=()=>speak(button.dataset.placementListen));
    const form=document.getElementById('language-placement-form');
    if(!form)return;
    form.onsubmit=event=>{
      event.preventDefault();
      const questions=placementQuestions(),data=new FormData(form);
      let correct=0;
      questions.forEach((question,index)=>{if(placementQuestionCorrect(question,data.get('placement-q'+index)))correct++;});
      const score=Math.round(correct/questions.length*100),li=placementRecommendedLevel(score),result=document.getElementById('language-placement-result');
      updateLanguage(state=>{
        state.onboardingComplete=true;state.placementPending=false;state.placementResult={score,level:CEFR[li].id,at:Date.now()};
        state.entryLevel=0;state.selectedLevel=0;state.selectedStep=1;state.selectedBox=1;state.challengeLevel=null;
        state.examHistory.push({scope:'placement',score,level:CEFR[li].id,at:Date.now()});
      });
      result.className='language-exam-result passed';
      result.textContent='Diagnostic result · '+score+'% · benchmark '+CEFR[li].id+'. Your driven pathway starts at A1 · Step 1 · Box 1.';
      setTimeout(()=>setHash('language-home'),1200);
    };
  }
  function bindLearningProcess(){
    document.querySelectorAll('[data-language-process]').forEach(root=>{
      const stages=[...root.querySelectorAll('[data-language-process-stage]')],dots=[...root.querySelectorAll('[data-process-go]')];
      const previous=root.querySelector('[data-process-previous]'),next=root.querySelector('[data-process-next]'),position=root.querySelector('[data-process-position]'),meter=root.querySelector('[data-process-meter]');
      if(!stages.length)return;
      let active=0,furthest=0;
      const show=index=>{
        active=Math.min(stages.length-1,Math.max(0,index));
        furthest=Math.max(furthest,active);
        stages.forEach((stage,i)=>{stage.hidden=i!==active;stage.classList.toggle('active',i===active);});
        dots.forEach((dot,i)=>{dot.classList.toggle('active',i===active);dot.disabled=i>furthest;dot.classList.toggle('locked',i>furthest);});
        if(previous)previous.disabled=active===0;
        if(next)next.hidden=active===stages.length-1;
        if(position)position.textContent=String(active+1).padStart(2,'0');
        if(meter)meter.style.width=Math.round((active+1)/stages.length*100)+'%';
        root.classList.toggle('is-final',active===stages.length-1);
      };
      previous?.addEventListener('click',()=>show(active-1));
      next?.addEventListener('click',()=>show(active+1));
      dots.forEach((dot,index)=>dot.addEventListener('click',()=>{if(index<=furthest)show(index);}));
      show(0);
    });
  }
  function bindExamStepper(){
    const form=document.querySelector('[data-exam-stepper]');
    if(!form)return;
    const questions=[...form.querySelectorAll('.language-exam-question-item')],previous=form.querySelector('[data-exam-previous]'),next=form.querySelector('[data-exam-next]'),position=form.querySelector('[data-exam-position]'),meter=form.querySelector('[data-exam-meter]'),message=form.querySelector('[data-exam-step-message]');
    if(!questions.length)return;
    let active=0;
    const answered=question=>{
      const type=question.dataset.questionType||'mcq';
      if(type==='multi-select')return Boolean(question.querySelector('input[type="checkbox"]:checked'));
      if(type==='ordering')return Boolean(question.querySelector('input[type="hidden"]')?.value.trim());
      if(type==='speak')return Boolean(question.querySelector('input[type="hidden"]')?.value.trim());
      if(['fill','short-answer','listen-fill'].includes(type))return Boolean(question.querySelector('input[type="text"]')?.value.trim());
      return Boolean(question.querySelector('input[type="radio"]:checked'));
    };
    const show=index=>{
      active=Math.min(questions.length-1,Math.max(0,index));
      questions.forEach((question,i)=>{question.hidden=i!==active;question.classList.toggle('active',i===active);question.classList.remove('needs-answer');});
      previous.disabled=active===0;next.hidden=active===questions.length-1;
      position.textContent=String(active+1).padStart(2,'0')+' / '+questions.length;
      meter.style.width=Math.round((active+1)/questions.length*100)+'%';
      form.classList.toggle('is-final',active===questions.length-1);
      if(message)message.textContent='';
    };
    previous.addEventListener('click',()=>show(active-1));
    next.addEventListener('click',()=>{
      if(!answered(questions[active])){
        questions[active].classList.add('needs-answer');
        if(message)message.textContent=learningLanguage(languageState(),activeLanguagePosition(languageState()).li).instruction==='Arabic'?'أكمل إجابتك أولاً.':'Answer this question before continuing.';
        questions[active].querySelector('input,button,textarea')?.focus();return;
      }
      show(active+1);
    });
    show(0);
  }
  function bindLanguagePage(){
    const authoring=adminLanguageAuthoring();
    bindLearningProcess();
    bindExamStepper();
    document.querySelectorAll('[data-speak]').forEach(button=>button.onclick=()=>speak(button.dataset.speak));
    bindGeminiPronunciation();
    document.querySelectorAll('[data-speak-letter]').forEach(button=>button.onclick=()=>speakLetter(button.dataset.speakLetter));
    document.querySelector('[data-language-ui-switch]')?.addEventListener('click',()=>{applyInterfaceLanguage(lang()==='ar'?'en':'ar');render();});

    document.querySelectorAll('[data-language-base]').forEach(button=>button.addEventListener('click',()=>{
      const base=button.dataset.languageBase;
      if(!allowedBaseLanguages(courseTargetLanguage(languageState())).includes(base))return;
      updateLanguage(state=>{state.baseLanguage=base;});
      render();
    }));

    document.querySelector('[data-letter-gate-learn]')?.addEventListener('click',()=>setHash('language-letter-learn'));
    document.querySelector('[data-letter-gate-exam]')?.addEventListener('click',()=>setHash('language-letter-exam'));
    document.querySelectorAll('[data-letter-gate-home]').forEach(button=>button.onclick=()=>setHash('language-home'));
    document.querySelectorAll('[data-gate-letter-select]').forEach(button=>button.onclick=()=>{
      const letter=button.dataset.gateLetterSelect;
      updateLanguage(state=>{const first=LETTER_LEARNING_ORDER.find(item=>!state.letterGateProgress.includes(item));if(state.letterGateProgress.includes(letter)||letter===first)state.activeGateLetter=letter;});
      render();
    });
    document.querySelector('[data-gate-letter-next]')?.addEventListener('click',event=>{
      if(event.currentTarget.disabled)return;
      updateLanguage(state=>{const current=state.activeGateLetter||'D',index=LETTER_LEARNING_ORDER.indexOf(current);state.activeGateLetter=LETTER_LEARNING_ORDER[(index+1)%LETTER_LEARNING_ORDER.length];});
      render();
    });
    document.querySelector('[data-gate-letter-complete]')?.addEventListener('click',event=>{
      if(event.currentTarget.disabled)return;
      const letter=event.currentTarget.dataset.gateLetterComplete;
      updateLanguage(state=>{state.letterGateProgress=arrayUnique([...state.letterGateProgress,letter]);state.activeGateLetter=LETTER_LEARNING_ORDER.find(item=>!state.letterGateProgress.includes(item))||letter;});
      render();
    });

    document.querySelector('[data-language-start-zero]')?.addEventListener('click',()=>{
      updateLanguage(state=>{state.onboardingComplete=true;state.placementPending=false;state.placementResult=null;state.entryLevel=0;state.selectedLevel=0;state.selectedStep=1;state.selectedBox=1;});
      render();
    });
    document.querySelector('[data-language-placement-start]')?.addEventListener('click',()=>{
      updateLanguage(state=>{state.placementPending=true;state.challengeLevel=null;});
      setHash('language-examine');
    });

    document.querySelectorAll('[data-language-level]').forEach(button=>button.onclick=()=>{const li=Number(button.dataset.languageLevel);if(authoring){setLanguageAuthoringTarget({li,step:1,box:1});render();return;}updateLanguage(state=>{if(levelUnlocked(state,li)){state.selectedLevel=li;state.selectedStep=1;state.selectedBox=1;}});render();});
    document.querySelectorAll('[data-language-step]').forEach(button=>button.onclick=()=>{const step=Number(button.dataset.languageStep);if(authoring){setLanguageAuthoringTarget({step,box:1});render();return;}updateLanguage(state=>{const pos=clampSelection(state);if(stepUnlocked(state,pos.li,step)){state.selectedStep=step;state.selectedBox=1;}});render();});
    document.querySelectorAll('[data-language-box]').forEach(button=>button.onclick=()=>{const box=Number(button.dataset.languageBox);if(authoring){setLanguageAuthoringTarget({box});render();return;}updateLanguage(state=>{const pos=clampSelection(state);if(boxUnlocked(state,pos.li,pos.step,box))state.selectedBox=box;});render();});

    if(authoring){bindLetterDrawing();return;}

    document.querySelectorAll('[data-letter-select]').forEach(button=>button.onclick=()=>{const letter=button.dataset.letterSelect;updateLanguage(state=>{const pos=clampSelection(state);state.activeLetterByStep[letterProgressKey(pos.li,pos.step)]=letter;});render();});
    document.querySelector('[data-letter-next]')?.addEventListener('click',event=>{if(event.currentTarget.disabled)return;updateLanguage(state=>{const pos=clampSelection(state),pkey=letterProgressKey(pos.li,pos.step),current=state.activeLetterByStep[pkey]||LETTERS.find(letter=>!(state.letterProgress[pkey]||[]).includes(letter))||'A';const index=LETTERS.indexOf(current);state.activeLetterByStep[pkey]=LETTERS[(index+1)%LETTERS.length];});render();});
    document.querySelector('[data-letter-complete]')?.addEventListener('click',event=>{
      if(event.currentTarget.disabled)return;
      const letter=event.currentTarget.dataset.letterComplete;
      updateLanguage(state=>{const pos=clampSelection(state),pkey=letterProgressKey(pos.li,pos.step),list=state.letterProgress[pkey]||[];state.letterProgress[pkey]=arrayUnique([...list,letter]);const next=LETTERS.find(item=>!state.letterProgress[pkey].includes(item));if(next)state.activeLetterByStep[pkey]=next;syncBoxCompletion(state,pos.li,pos.step,pos.box);});
      render();
    });

    const vocabularyWriting=document.getElementById('language-pronunciation-writing'),vocabularyComplete=document.querySelector('[data-language-module="vocabulary"]');
    if(vocabularyWriting&&vocabularyComplete&&!vocabularyComplete.classList.contains('done')){
      const minimum=activeLanguagePosition(languageState()).li===0?8:20;
      const update=()=>{vocabularyComplete.disabled=normalizeText(vocabularyWriting.value).length<minimum;vocabularyComplete.textContent=vocabularyComplete.disabled?'Complete the writing task first':t('complete');};
      vocabularyWriting.addEventListener('input',update);update();
    }
    const grammarWriting=document.getElementById('language-grammar-writing'),grammarComplete=document.querySelector('[data-language-module="grammar"]');
    if(grammarWriting&&grammarComplete&&!grammarComplete.classList.contains('done')){
      const update=()=>{grammarComplete.disabled=normalizeText(grammarWriting.value).length<12;grammarComplete.textContent=grammarComplete.disabled?'Complete the rule practice first':t('complete');};
      grammarWriting.addEventListener('input',update);update();
    }

    document.querySelectorAll('[data-language-module]').forEach(button=>{
      if(button.dataset.languageModule==='video')return;
      button.onclick=()=>{if(!button.disabled)markModule(button.dataset.languageModule);};
    });

    const voiceComplete=document.querySelector('[data-language-module="voice"]');
    const pronunciationJudge=document.querySelector('.language-practice-card.pronunciation [data-pronunciation-judge]');
    let pronunciationPassed=pronunciationJudge?.dataset.pronunciationAccepted==='true',dictationPassed=false,reversePassed=false;
    const updateVoice=()=>{if(voiceComplete&&!voiceComplete.classList.contains('done')){voiceComplete.disabled=!(pronunciationPassed&&dictationPassed&&reversePassed);voiceComplete.textContent=voiceComplete.disabled?'Complete pronunciation, listening and speaking first':t('complete');}};
    pronunciationJudge?.addEventListener('dafatii:pronunciationgraded',event=>{pronunciationPassed=Boolean(event.detail?.accepted);updateVoice();});
    document.querySelector('[data-check-dictation]')?.addEventListener('click',event=>{
      const score=similarity(document.getElementById('language-dictation').value,event.currentTarget.dataset.checkDictation);
      dictationPassed=score>=.92;document.querySelector('[data-dictation-feedback]').textContent=dictationPassed?'Excellent match.':'Try again. Focus on every content word and ending.';updateVoice();
    });
    document.querySelector('[data-check-reverse]')?.addEventListener('click',event=>{
      const score=similarity(document.getElementById('language-reverse-fallback').value,event.currentTarget.dataset.checkReverse);
      reversePassed=score>=.86;document.querySelector('[data-reverse-feedback]').textContent=reversePassed?'Clear match.':'Try again and keep the same meaning and key wording.';updateVoice();
    });
    document.querySelector('[data-recognize]')?.addEventListener('click',()=>{
      const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
      const field=document.getElementById('language-reverse-fallback'),feedback=document.querySelector('[data-reverse-feedback]');
      if(!Recognition){feedback.textContent='Speech recognition is not available in this browser. Type what you said, then check it.';field.focus();return;}
      const recognition=new Recognition();recognition.lang=speechLocale(courseTargetLanguage(languageState()));recognition.interimResults=false;recognition.maxAlternatives=1;
      recognition.onresult=e=>{field.value=e.results[0][0].transcript;feedback.textContent='Captured. Check the result.';};
      recognition.onerror=()=>{feedback.textContent='Recognition failed. You can type the spoken sentence instead.';};recognition.start();
    });

    document.querySelector('[data-save-language-notes]')?.addEventListener('click',event=>{const id=event.currentTarget.dataset.saveLanguageNotes,value=document.getElementById('language-box-notes').value;updateLanguage(state=>{state.notes[id]=value;});event.currentTarget.textContent='✓ '+t('save');});

    document.querySelectorAll('[data-ordering]').forEach(builder=>{
      const answer=builder.querySelector('[data-order-answer]'),bank=builder.querySelector('.language-order-bank'),input=builder.querySelector('input[type="hidden"]');
      const sync=()=>{input.value=[...answer.querySelectorAll('button')].map(button=>button.dataset.orderToken).join(' ');builder.classList.toggle('has-answer',Boolean(input.value));};
      builder.querySelectorAll('[data-order-token]').forEach(button=>button.addEventListener('click',()=>{(button.parentElement===bank?answer:bank).appendChild(button);sync();}));
    });

    document.querySelectorAll('[data-challenge-level]').forEach(button=>button.onclick=()=>{
      updateLanguage(state=>{state.challengeLevel=Number(button.dataset.challengeLevel);state.placementPending=false;});
      setHash('language-examine');
    });
    document.querySelector('[data-cancel-level-challenge]')?.addEventListener('click',()=>{updateLanguage(state=>{state.challengeLevel=null;});render();});

    const exam=document.getElementById('language-exam-form');
    if(exam)exam.onsubmit=event=>{
      event.preventDefault();
      const state=languageState(),mode=exam.dataset.examMode||'natural';
      let ctx;
      if(mode==='challenge'){
        const li=state.challengeLevel;if(!Number.isInteger(li))return;
        ctx={scope:'level',li,step:5,box:boxCount(li)};
      }else{
        const pos=clampSelection(state);ctx=currentAssessment(state,pos);
        if(assessmentMissing(state,ctx).length)return;
      }
      const questions=assessmentQuestions(ctx),form=new FormData(exam);
      let correct=0;questions.forEach((q,index)=>{if(examAnswerCorrect(q,form,index))correct++;});
      const score=Math.round((correct/questions.length)*100),passed=mode==='challenge'?score>80:score>=80,result=document.getElementById('language-exam-result');
      updateLanguage(value=>{
        value.examHistory.push({scope:mode==='challenge'?'level-challenge':ctx.scope,level:CEFR[ctx.li].id,step:ctx.step,box:ctx.box,score,passed,at:Date.now()});
        if(passed){
          if(mode==='challenge')applyLevelChallengePass(value,ctx.li);
          else applyAssessmentPass(value,ctx);
        }
      });
      if(passed){
        result.className='language-exam-result passed';
        result.textContent=mode==='challenge'
          ? 'Passed · '+score+'%. '+CEFR[ctx.li].id+' is complete. Lower levels were not changed.'
          : 'Passed · '+score+'%. '+assessmentTitle(ctx)+' is complete.';
        setTimeout(()=>render(),1000);
      }else{
        result.className='language-exam-result failed';
        result.textContent='Score '+score+'%. '+(mode==='challenge'?'A level challenge requires greater than 80%.':'Pass mark is 80%. Review and retry.');
      }
    };

    bindPlacementExam();
    bindVideoUnderstanding();
    bindLetterDrawing();
    bindLetterGateExam();
  }

  function installCourseChangeRouting(){
    window.addEventListener('dafatii:coursechanged',()=>{
      const current=(location.hash||'').replace(/^#\/?/,'').split('/')[0];
      if(current!=='change-course')return;
      setTimeout(()=>setHash(courseType()==='language'?'language-home':'dashboard/overview'),0);
    });
  }

  wrapCourseCreation();
  installCreateInterceptor();
  installWorkspaceRoutes();
  installCourseChangeRouting();
  window.DafatiiCourseModes=Object.freeze({
    courseType,isLanguage,levels:CEFR,levelSystems:LEVEL_LEARNING_SYSTEMS,boxData,boxCount,totalBoxes:TOTAL_LANGUAGE_BOXES,openTypeChooser,
    languageAuthoring:Object.freeze({
      pages:['letters','voice','grammar','video'],
      pageName:languagePageName,
      getItems:selection=>languagePageItems(selection.li,selection.step,selection.box,selection.page).map(item=>({...item})),
      getSchemas:(page,li)=>languageItemSchemas(page,li),
      createItem:createLanguageItem,
      saveItem:saveLanguageItem,
      deleteItem:deleteLanguageItem,
      emptyPage:emptyLanguagePage,
      resetPage:resetLanguagePage,
      begin:beginLanguageAuthoring,
      end:endLanguageAuthoring,
      current:()=>languageAuthoringTarget?{...languageAuthoringTarget}:null,
      examContext:selection=>naturalExamContext(selection.li,selection.step,selection.box),
      getExamQuestions:selection=>examQuestionsFor(naturalExamContext(selection.li,selection.step,selection.box)).map((q,index)=>({...q,id:q.id||('q-'+index)})),
      saveExamQuestion,
      deleteExamQuestion,
      emptyExamQuestions
    })
  });
})();
