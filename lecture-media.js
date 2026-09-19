(() => {
  'use strict';

  const ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,video/*';
  const DOCUMENT_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]);
  const copy = {
    en: {
      lecture:'Lecture', add:'Add lecture', edit:'Edit lecture', subject:'Subject', name:'Lecture name', namePlaceholder:'Lecture name', icon:'Icon', notes:'Notes', notesPlaceholder:'Lecture notes…',
      material:'Lecture material', materialHelp:'Attach a PDF, Word, PowerPoint, or video file, or paste a video link.', choose:'Choose file', drop:'Drop a lecture file here', formats:'PDF · Word · PowerPoint · Video', or:'or', videoLink:'Video link', videoPlaceholder:'YouTube, Vimeo, or direct video URL', current:'Current material', remove:'Remove', replace:'Choose a file to replace it', save:'Save changes', create:'Add lecture',
      uploading:'Uploading to Google Drive…', metadata:'Saving lecture metadata to Google Drive…', saved:'Lecture saved.', uploadFailed:'Could not save this lecture to Google Drive.', invalidFile:'Choose a PDF, Word, PowerPoint, or video file.', invalidUrl:'Enter a valid http(s) video URL.', openOriginal:'Open original', fullscreen:'Fullscreen', close:'Close', video:'Video', videoLinkBadge:'Video link', document:'Document', noMedia:'No lecture material added', open:'Open lecture', stored:'Stored in Google Drive'
    },
    ar: {
      lecture:'المحاضرة', add:'إضافة محاضرة', edit:'تعديل المحاضرة', subject:'المادة', name:'اسم المحاضرة', namePlaceholder:'اسم المحاضرة', icon:'الأيقونة', notes:'ملاحظات', notesPlaceholder:'ملاحظات المحاضرة…',
      material:'محتوى المحاضرة', materialHelp:'أرفق ملف PDF أو Word أو PowerPoint أو فيديو، أو الصق رابط فيديو.', choose:'اختيار ملف', drop:'اسحب ملف المحاضرة إلى هنا', formats:'PDF · Word · PowerPoint · فيديو', or:'أو', videoLink:'رابط فيديو', videoPlaceholder:'YouTube أو Vimeo أو رابط فيديو مباشر', current:'المحتوى الحالي', remove:'إزالة', replace:'اختر ملفاً لاستبداله', save:'حفظ التغييرات', create:'إضافة المحاضرة',
      uploading:'جارٍ الرفع إلى Google Drive…', metadata:'جارٍ حفظ بيانات المحاضرة في Google Drive…', saved:'تم حفظ المحاضرة.', uploadFailed:'تعذر حفظ هذه المحاضرة في Google Drive.', invalidFile:'اختر ملف PDF أو Word أو PowerPoint أو ملف فيديو.', invalidUrl:'أدخل رابط فيديو http(s) صالحاً.', openOriginal:'فتح الرابط الأصلي', fullscreen:'ملء الشاشة', close:'إغلاق', video:'فيديو', videoLinkBadge:'رابط فيديو', document:'ملف', noMedia:'لا يوجد محتوى للمحاضرة', open:'فتح المحاضرة', stored:'محفوظ في Google Drive'
    }
  };

  const lang = () => (typeof interfaceLanguage === 'function' ? interfaceLanguage() : document.documentElement.lang) === 'ar' ? 'ar' : 'en';
  const t = key => copy[lang()][key] || copy.en[key] || key;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const uid = () => `lecture-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const activeCourseId = () => window.DafatiiCourses?.active?.().id || null;

  function normalizeUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      return ['http:','https:'].includes(url.protocol) ? url.href : '';
    } catch { return ''; }
  }

  function youtubeId(value) {
    try {
      const url = new URL(value);
      if (url.hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || '';
      if (/(^|\.)youtube\.com$/i.test(url.hostname)) {
        if (url.pathname === '/watch') return url.searchParams.get('v') || '';
        const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/i);
        return match?.[1] || '';
      }
    } catch {}
    return '';
  }

  function vimeoId(value) {
    try {
      const url = new URL(value);
      if (!/(^|\.)vimeo\.com$/i.test(url.hostname)) return '';
      return (url.pathname.match(/\/(\d+)(?:$|\/)/) || [])[1] || '';
    } catch { return ''; }
  }

  function looksLikeVideoUrl(value) {
    const url = normalizeUrl(value);
    if (!url) return false;
    return Boolean(youtubeId(url) || vimeoId(url) || /\.(?:mp4|webm|ogv|ogg|mov|m4v)(?:$|[?#])/i.test(url));
  }

  function validLectureFile(file) {
    if (!(file instanceof File)) return false;
    if (file.type?.startsWith('video/')) return true;
    if (DOCUMENT_TYPES.has(file.type)) return true;
    return /\.(?:pdf|doc|docx|ppt|pptx|mp4|webm|mov|m4v|ogv|ogg)$/i.test(file.name);
  }

  function typeLabel(lecture) {
    const type = String(lecture?.contentType || '');
    if (lecture?.fileId) {
      if (type.startsWith('video/')) return t('video');
      if (type === 'application/pdf') return 'PDF';
      if (/presentation|powerpoint/.test(type) || /\.pptx?$/i.test(lecture.filename || '')) return 'PowerPoint';
      if (/word|msword/.test(type) || /\.docx?$/i.test(lecture.filename || '')) return 'Word';
      return t('document');
    }
    if (lecture?.videoUrl || looksLikeVideoUrl(lecture?.link)) return t('videoLinkBadge');
    return '';
  }

  function subjectButtons(selectedId) {
    return state.subjects.map(subject => `<button type="button" class="academic-toggle ${subject.id === selectedId ? 'active' : ''}" data-lecture-subject="${esc(subject.id)}"><span>${esc(subject.icon || '◇')}</span>${esc(subject.name)}</button>`).join('');
  }

  function currentMaterial(lecture) {
    if (!lecture) return '';
    if (lecture.fileId) return `<div class="lecture-current-material" data-current-material><div><span class="lecture-material-kind">${esc(typeLabel(lecture))}</span><strong>${esc(lecture.filename || t('document'))}</strong><small>${esc(t('stored'))}</small></div><button type="button" class="btn btn-ghost" data-remove-current>${esc(t('remove'))}</button></div>`;
    const videoUrl = lecture.videoUrl || (looksLikeVideoUrl(lecture.link) ? lecture.link : '');
    if (videoUrl) return `<div class="lecture-current-material" data-current-material><div><span class="lecture-material-kind">${esc(t('videoLinkBadge'))}</span><strong class="lecture-current-url">${esc(videoUrl)}</strong></div><button type="button" class="btn btn-ghost" data-remove-current>${esc(t('remove'))}</button></div>`;
    return '';
  }

  async function uploadToDrive(file, status, progress) {
    status.textContent = t('uploading');
    return window.DafatiiFiles.upload(file, {
      courseId: activeCourseId(),
      onProgress: ({ ratio }) => {
        const percent = Math.max(0, Math.min(100, Math.round(Number(ratio || 0) * 100)));
        progress.hidden = false;
        progress.querySelector('i').style.width = `${percent}%`;
        progress.querySelector('span').textContent = `${percent}%`;
      }
    });
  }

  async function uploadMetadata(payload, status) {
    status.textContent = t('metadata');
    const snapshot = {
      version: 1,
      lectureId: payload.id,
      subjectId: payload.subjectId,
      name: payload.name,
      icon: payload.icon,
      notes: payload.notes,
      fileId: payload.fileId || null,
      filename: payload.filename || null,
      contentType: payload.contentType || null,
      size: payload.size || null,
      videoUrl: payload.videoUrl || null,
      storage: 'google-drive',
      updatedAt: Date.now()
    };
    const file = new File([JSON.stringify(snapshot, null, 2)], `.dafatii-lecture-${payload.id}.json`, { type:'application/json' });
    return window.DafatiiFiles.upload(file, { courseId: activeCourseId() });
  }

  function cleanupFile(fileId) {
    if (fileId) void window.DafatiiFiles.delete(fileId).catch(() => {});
  }

  window.openLectureSheet = function(subject, lectureId = '') {
    const currentSubject = subject;
    const currentList = subjectLectures(currentSubject.id);
    const lecture = currentList.find(item => item.id === lectureId);
    const selectedSubjectId = lecture?.subjectId || currentSubject.id;
    const root = document.getElementById('overlay-root');
    if (!root) return;

    root.innerHTML = `<div class="entity-sheet-overlay" id="lecture-media-overlay">
      <section class="entity-sheet academic-sheet lecture-media-sheet" role="dialog" aria-modal="true" aria-label="${esc(lecture ? t('edit') : t('add'))}">
        <div class="entity-sheet-handle"></div>
        <div class="entity-sheet-head"><div><div class="eyebrow">${esc(t('lecture'))}</div><h2>${esc(lecture ? t('edit') : t('add'))}</h2></div><button class="icon-btn" id="lecture-media-close" aria-label="${esc(t('close'))}">×</button></div>
        <form id="lecture-media-form">
          <div class="field"><label>${esc(t('subject'))}</label><div class="academic-toggle-grid" id="lecture-media-subjects">${subjectButtons(selectedSubjectId)}</div></div>
          <div class="field"><label for="lecture-media-name">${esc(t('name'))}</label><input id="lecture-media-name" maxlength="100" required value="${esc(lecture?.name || '')}" placeholder="${esc(t('namePlaceholder'))}"></div>
          <div class="field"><label>${esc(t('icon'))}</label><div class="icon-picker">${LECTURE_ICONS.map(iconValue => `<button type="button" class="icon-choice ${iconValue === (lecture?.icon || LECTURE_ICONS[0]) ? 'active' : ''}" data-lecture-icon="${esc(iconValue)}">${esc(iconValue)}</button>`).join('')}</div></div>
          <div class="field lecture-material-field">
            <div class="lecture-material-heading"><div><label>${esc(t('material'))}</label><small>${esc(t('materialHelp'))}</small></div></div>
            ${currentMaterial(lecture)}
            <label class="lecture-dropzone" id="lecture-dropzone"><input id="lecture-file" type="file" accept="${ACCEPT}" hidden><span class="lecture-drop-icon">⇧</span><strong>${esc(t('drop'))}</strong><small>${esc(t('formats'))}</small><b>${esc(t('choose'))}</b></label>
            <div class="lecture-selected-file" id="lecture-selected-file" hidden></div>
            <div class="lecture-or"><span>${esc(t('or'))}</span></div>
            <label class="lecture-video-link"><span>${esc(t('videoLink'))}</span><input id="lecture-video-url" type="url" inputmode="url" value="${esc(lecture?.videoUrl || (looksLikeVideoUrl(lecture?.link) ? lecture.link : ''))}" placeholder="${esc(t('videoPlaceholder'))}"></label>
          </div>
          <div class="field"><label for="lecture-media-notes">${esc(t('notes'))}</label><textarea id="lecture-media-notes" class="academic-notes" placeholder="${esc(t('notesPlaceholder'))}">${esc(lecture?.notes || '')}</textarea></div>
          <div class="lecture-upload-progress" id="lecture-upload-progress" hidden><div><i></i></div><span>0%</span></div>
          <p class="lecture-media-status" id="lecture-media-status" role="status"></p>
          <button class="btn btn-primary auth-submit" id="lecture-media-submit" type="submit">${esc(lecture ? t('save') : t('create'))}</button>
        </form>
      </section>
    </div>`;

    let chosenSubjectId = selectedSubjectId;
    let chosenIcon = lecture?.icon || LECTURE_ICONS[0];
    let selectedFile = null;
    let removeCurrent = false;
    const fileInput = document.getElementById('lecture-file');
    const videoInput = document.getElementById('lecture-video-url');
    const selected = document.getElementById('lecture-selected-file');
    const dropzone = document.getElementById('lecture-dropzone');
    const status = document.getElementById('lecture-media-status');
    const progress = document.getElementById('lecture-upload-progress');
    const submit = document.getElementById('lecture-media-submit');

    const showFile = file => {
      selectedFile = file;
      removeCurrent = true;
      videoInput.value = '';
      selected.hidden = false;
      selected.innerHTML = `<strong>${esc(file.name)}</strong><small>${esc(file.type || typeLabel({ filename:file.name }))} · ${(file.size / 1048576).toFixed(file.size >= 1048576 ? 1 : 2)} MB</small><button type="button" data-clear-file>×</button>`;
      document.querySelector('[data-current-material]')?.classList.add('is-replaced');
    };

    document.querySelectorAll('[data-lecture-subject]').forEach(button => button.onclick = () => {
      chosenSubjectId = button.dataset.lectureSubject;
      document.querySelectorAll('[data-lecture-subject]').forEach(item => item.classList.toggle('active', item === button));
    });
    document.querySelectorAll('[data-lecture-icon]').forEach(button => button.onclick = () => {
      chosenIcon = button.dataset.lectureIcon;
      document.querySelectorAll('[data-lecture-icon]').forEach(item => item.classList.toggle('active', item === button));
    });
    document.querySelector('[data-remove-current]')?.addEventListener('click', event => {
      removeCurrent = true;
      event.currentTarget.closest('[data-current-material]')?.remove();
    });
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      if (!validLectureFile(file)) { status.textContent = t('invalidFile'); fileInput.value = ''; return; }
      showFile(file);
    });
    selected.addEventListener('click', event => {
      if (!event.target.closest('[data-clear-file]')) return;
      selectedFile = null; fileInput.value = ''; selected.hidden = true;
      if (lecture && !removeCurrent) document.querySelector('[data-current-material]')?.classList.remove('is-replaced');
    });
    videoInput.addEventListener('input', () => {
      if (!videoInput.value.trim()) return;
      selectedFile = null; fileInput.value = ''; selected.hidden = true; removeCurrent = true;
      document.querySelector('[data-current-material]')?.classList.add('is-replaced');
    });
    ['dragenter','dragover'].forEach(type => dropzone.addEventListener(type, event => { event.preventDefault(); dropzone.classList.add('dragging'); }));
    ['dragleave','drop'].forEach(type => dropzone.addEventListener(type, event => { event.preventDefault(); dropzone.classList.remove('dragging'); }));
    dropzone.addEventListener('drop', event => {
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;
      if (!validLectureFile(file)) { status.textContent = t('invalidFile'); return; }
      showFile(file);
    });

    const close = () => { root.innerHTML = ''; };
    document.getElementById('lecture-media-close').onclick = close;
    document.getElementById('lecture-media-overlay').onclick = event => { if (event.target.id === 'lecture-media-overlay') close(); };

    document.getElementById('lecture-media-form').onsubmit = async event => {
      event.preventDefault();
      const studyAfter=event.currentTarget.dataset.studyAfter||'';
      const name = document.getElementById('lecture-media-name').value.trim();
      if (!name) return;
      let videoUrl = normalizeUrl(videoInput.value);
      if (videoInput.value.trim() && !videoUrl) { status.textContent = t('invalidUrl'); return; }
      const targetSubject = state.subjects.find(item => item.id === chosenSubjectId) || currentSubject;
      const previousFileId = lecture?.fileId || null;
      const previousMetadataId = lecture?.metadataFileId || null;
      let newFile = null;
      let newMetadata = null;
      submit.disabled = true;
      status.textContent = '';
      progress.hidden = true;

      try {
        const payload = {
          ...(lecture || {}),
          id: lecture?.id || uid(),
          name,
          icon: chosenIcon,
          notes: document.getElementById('lecture-media-notes').value.trim(),
          subjectId: targetSubject.id,
          storage: 'google-drive'
        };

        if (selectedFile) {
          newFile = await uploadToDrive(selectedFile, status, progress);
          payload.fileId = newFile.id;
          payload.filename = newFile.filename;
          payload.contentType = newFile.contentType;
          payload.size = newFile.size;
          payload.videoUrl = '';
          payload.link = '';
        } else if (videoUrl) {
          payload.fileId = '';
          payload.filename = '';
          payload.contentType = '';
          payload.size = 0;
          payload.videoUrl = videoUrl;
          payload.link = videoUrl;
        } else if (removeCurrent) {
          payload.fileId = '';
          payload.filename = '';
          payload.contentType = '';
          payload.size = 0;
          payload.videoUrl = '';
          payload.link = '';
        } else {
          payload.videoUrl = lecture?.videoUrl || (looksLikeVideoUrl(lecture?.link) ? lecture.link : '');
        }

        newMetadata = await uploadMetadata(payload, status);
        payload.metadataFileId = newMetadata.id;

        if (lecture) state.lectures[currentSubject.id] = currentList.filter(item => item.id !== lecture.id);
        const targetList = subjectLectures(targetSubject.id).filter(item => item.id !== payload.id);
        targetList.push(payload);
        state.lectures[targetSubject.id] = targetList;
        saveLectures();

        if (previousMetadataId && previousMetadataId !== payload.metadataFileId) cleanupFile(previousMetadataId);
        if (previousFileId && previousFileId !== payload.fileId) cleanupFile(previousFileId);
        status.textContent = t('saved');
        close();
        if(studyAfter&&['flashcards','mcqs','qa'].includes(studyAfter))window.DafatiiLectureStudyTools?.routeTo(targetSubject.id,payload.id,studyAfter);
        else setHash(`subjects/subject/${encodeURIComponent(targetSubject.id)}/lectures`);
        requestAnimationFrame(decorateLectureCards);
      } catch (error) {
        if (newMetadata?.id) cleanupFile(newMetadata.id);
        if (newFile?.id) cleanupFile(newFile.id);
        status.textContent = `${t('uploadFailed')} ${error.message || ''}`.trim();
        submit.disabled = false;
      }
    };
  };

  function openVideoPlayer(lecture, rawUrl) {
    const url = normalizeUrl(rawUrl);
    if (!url) { showToast(t('invalidUrl')); return; }
    const yt = youtubeId(url);
    const vm = vimeoId(url);
    const embed = yt ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}?autoplay=1&rel=0` : vm ? `https://player.vimeo.com/video/${encodeURIComponent(vm)}?autoplay=1` : '';
    const root = document.createElement('div');
    root.className = 'lecture-video-viewer';
    root.innerHTML = `<section class="lecture-video-panel" role="dialog" aria-modal="true" aria-label="${esc(lecture.name || t('video'))}">
      <header><div><span>${esc(t('video'))}</span><strong>${esc(lecture.name || t('lecture'))}</strong></div><div><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(t('openOriginal'))}</a><button data-video-fullscreen>${esc(t('fullscreen'))}</button><button data-video-close aria-label="${esc(t('close'))}">×</button></div></header>
      <div class="lecture-video-stage">${embed ? `<iframe src="${esc(embed)}" title="${esc(lecture.name || t('video'))}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>` : `<video src="${esc(url)}" controls autoplay playsinline preload="metadata"></video><div class="lecture-video-error" hidden><strong>${esc(t('video'))}</strong><p>${esc(t('openOriginal'))}</p><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(t('openOriginal'))}</a></div>`}</div>
    </section>`;
    document.body.append(root);
    const panel = root.querySelector('.lecture-video-panel');
    const close = () => root.remove();
    root.querySelector('[data-video-close]').onclick = close;
    root.querySelector('[data-video-fullscreen]').onclick = () => panel.requestFullscreen?.();
    root.addEventListener('click', event => { if (event.target === root) close(); });
    root.querySelector('video')?.addEventListener('error', () => {
      const video = root.querySelector('video'); if (video) video.hidden = true;
      const error = root.querySelector('.lecture-video-error'); if (error) error.hidden = false;
    });
  }

  window.openLectureLink = async function(lecture) {
    if (!lecture) return;
    if (lecture.fileId) {
      try { await window.DafatiiFiles.open(lecture.fileId, { lecture }); }
      catch (error) { showToast(`Open failed: ${error.message}`); }
      return;
    }
    const videoUrl = lecture.videoUrl || (looksLikeVideoUrl(lecture.link) ? lecture.link : '');
    if (videoUrl) { openVideoPlayer(lecture, videoUrl); return; }
    const raw = normalizeUrl(lecture.link);
    if (raw) { window.open(raw, '_blank', 'noopener,noreferrer'); return; }
    showToast(t('noMedia'));
  };

  function decorateLectureCards() {
    document.querySelectorAll('.lecture-card-wrap[data-lecture-id][data-subject-id]').forEach(wrapper => {
      const subjectId = wrapper.dataset.subjectId;
      const lecture = subjectLectures(subjectId).find(item => item.id === wrapper.dataset.lectureId);
      const card = wrapper.querySelector('.lecture-card');
      const copyNode = card?.querySelector('.subject-card-copy p');
      if (!lecture || !copyNode) return;
      const label = typeLabel(lecture);
      if (label) copyNode.textContent = `${label} · ${t('open')}`;
      else if (lecture.link) copyNode.textContent = t('open');
      else copyNode.textContent = t('noMedia');
      card.dataset.lectureMedia = label ? '1' : '0';
    });
  }

  new MutationObserver(() => requestAnimationFrame(decorateLectureCards)).observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener('hashchange', () => requestAnimationFrame(decorateLectureCards));
  window.addEventListener('dafatii:datahydrated', () => requestAnimationFrame(decorateLectureCards));
  document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(decorateLectureCards));
})();


/* Lecture study tools v3: lecture-linked flashcards, MCQ and Q&A workspaces */
;(function lectureStudyToolsModule(){
  const TYPES={
    flashcards:{
      label:'Flashcards',singular:'flashcard',icon:'◫',
      description:'Review front-and-back cards from this lecture.',
      columns:[
        {field:'front',label:'Front',aliases:['front']},
        {field:'back',label:'Back',aliases:['back']}
      ]
    },
    mcqs:{
      label:'MCQs',singular:'question',icon:'◉',
      description:'Take a multiple-choice exam and receive immediate scoring.',
      columns:[
        {field:'question',label:'Question',aliases:['question']},
        {field:'correct',label:'Correct option number',aliases:['correctoptionnumber','correctoption','correct','answer']},
        {field:'option1',label:'First option',aliases:['firstoption','option1','first']},
        {field:'option2',label:'Second option',aliases:['secondoption','option2','second']},
        {field:'option3',label:'Third option',aliases:['thirdoption','option3','third']},
        {field:'option4',label:'Fourth option',aliases:['fourthoption','option4','fourth']}
      ]
    },
    qa:{
      label:'Question & Answer',singular:'question',icon:'?',
      description:'Practice questions, reveal answers, and move at your own pace.',
      columns:[
        {field:'question',label:'Question',aliases:['question']},
        {field:'answer',label:'Answer',aliases:['answer']}
      ]
    }
  };
  const ACCEPT='.xlsx,.xls,.xlsb,.ods,.csv,.tsv,.txt,.json';
  const runtime={key:'',mode:'study',index:0,revealed:false,answers:{},draft:[],notice:''};
  const esc=value=>escapeHtml(value??'');
  const clone=value=>JSON.parse(JSON.stringify(value));
  const uid=()=>`study-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const norm=value=>String(value??'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const typeFor=value=>Object.prototype.hasOwnProperty.call(TYPES,value)?value:'';
  const canEdit=()=>!schoolManagedWorkspace();

  function routeParts(){
    return route().split('/');
  }
  function findContext(parts){
    const subjectId=decodeURIComponent(parts[2]||''),lectureId=decodeURIComponent(parts[3]||''),type=typeFor(parts[4]);
    const subject=state.subjects.find(item=>item.id===subjectId);
    const lecture=(state.lectures[subjectId]||[]).find(item=>item.id===lectureId);
    return {subjectId,lectureId,type,subject,lecture};
  }
  function storedItems(lecture,type){
    const items=lecture?.studyTools?.[type]?.items;
    return Array.isArray(items)?items:[];
  }
  function blank(type){
    if(type==='flashcards')return {id:uid(),front:'',back:''};
    if(type==='qa')return {id:uid(),question:'',answer:''};
    return {id:uid(),question:'',correct:1,option1:'',option2:'',option3:'',option4:''};
  }
  function cleanItem(type,item){
    const next={id:String(item?.id||uid())};
    for(const column of TYPES[type].columns)next[column.field]=column.field==='correct'?Math.max(1,Math.min(4,Number(item?.[column.field]||1))):String(item?.[column.field]??'').trim();
    return next;
  }
  function validItem(type,item){
    if(type==='flashcards')return Boolean(item.front&&item.back);
    if(type==='qa')return Boolean(item.question&&item.answer);
    return Boolean(item.question&&item.option1&&item.option2&&item.option3&&item.option4&&Number(item.correct)>=1&&Number(item.correct)<=4);
  }
  function resetRuntime(context){
    const key=`${context.subjectId}:${context.lectureId}:${context.type}`;
    if(runtime.key===key)return;
    const items=storedItems(context.lecture,context.type);
    runtime.key=key;
    runtime.mode=items.length?'study':'manage';
    runtime.index=0;
    runtime.revealed=false;
    runtime.answers={};
    runtime.draft=clone(items);
    runtime.notice='';
  }
  function imageUrl(value){
    const text=String(value||'').trim();
    try{
      const url=new URL(text);
      if(!['http:','https:'].includes(url.protocol))return '';
      return /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(url.pathname)?url.href:'';
    }catch{return '';}
  }
  function rich(value,className=''){
    const text=String(value??'').trim(),image=imageUrl(text);
    if(image)return `<figure class="lecture-study-image ${esc(className)}"><img src="${esc(image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"><figcaption>Image</figcaption></figure>`;
    return `<div class="lecture-study-text ${esc(className)}">${esc(text)}</div>`;
  }
  function routeTo(subjectId,lectureId,type){
    setHash(`subjects/lecture-study/${encodeURIComponent(subjectId)}/${encodeURIComponent(lectureId)}/${type}`);
  }
  function backRoute(context){
    return `subjects/subject/${encodeURIComponent(context.subjectId)}/lectures`;
  }
  function pageHeader(context,items){
    const meta=TYPES[context.type];
    return `<header class="lecture-study-head">
      <button class="lecture-study-back" type="button" data-study-back aria-label="Back to lectures">‹</button>
      <div class="lecture-study-heading"><span>${esc(context.subject?.name||'Subject')} · ${esc(context.lecture.name)}</span><h1>${esc(meta.label)}</h1><p>${esc(meta.description)}</p></div>
      <div class="lecture-study-count"><strong>${items.length}</strong><span>${items.length===1?esc(meta.singular):'items'}</span></div>
    </header>`;
  }
  function emptyStudy(context){
    const meta=TYPES[context.type];
    return `<section class="lecture-study-empty"><span>${esc(meta.icon)}</span><h2>No ${esc(meta.label)} yet</h2><p>Create items manually or import a structured spreadsheet, CSV, TSV, text, or JSON file.</p>${canEdit()?'<button class="btn btn-primary" type="button" data-study-mode="manage">Create set</button>':''}</section>`;
  }
  function flashcardStudy(items){
    const index=Math.min(runtime.index,Math.max(0,items.length-1)),item=items[index];
    return `<section class="lecture-study-session flashcard-session">
      <div class="lecture-study-progress"><span>${index+1} / ${items.length}</span><i style="--study-progress:${((index+1)/items.length)*100}%"></i></div>
      <button class="flashcard-stage ${runtime.revealed?'revealed':''}" type="button" data-study-reveal>
        <span>${runtime.revealed?'Back':'Front'}</span>
        ${rich(runtime.revealed?item.back:item.front)}
        <small>${runtime.revealed?'Tap to show front':'Tap to reveal answer'}</small>
      </button>
      <div class="lecture-study-nav"><button type="button" data-study-prev ${index===0?'disabled':''}>Previous</button><button type="button" data-study-reveal>${runtime.revealed?'Show front':'Reveal'}</button><button type="button" data-study-next ${index===items.length-1?'disabled':''}>Next</button></div>
    </section>`;
  }
  function qaStudy(items){
    const index=Math.min(runtime.index,Math.max(0,items.length-1)),item=items[index];
    return `<section class="lecture-study-session qa-session">
      <div class="lecture-study-progress"><span>Question ${index+1} of ${items.length}</span><i style="--study-progress:${((index+1)/items.length)*100}%"></i></div>
      <article class="qa-exam-card"><span>Question</span>${rich(item.question,'question')}${runtime.revealed?`<div class="qa-answer"><span>Answer</span>${rich(item.answer,'answer')}</div>`:'<button class="btn btn-primary" type="button" data-study-reveal>Reveal answer</button>'}</article>
      <div class="lecture-study-nav"><button type="button" data-study-prev ${index===0?'disabled':''}>Previous</button><button type="button" data-study-reveal>${runtime.revealed?'Hide answer':'Reveal answer'}</button><button type="button" data-study-next ${index===items.length-1?'disabled':''}>Next</button></div>
    </section>`;
  }
  function mcqStudy(items){
    const index=Math.min(runtime.index,Math.max(0,items.length-1)),item=items[index],selected=Number(runtime.answers[index]||0),correct=Number(item.correct);
    const answered=Object.keys(runtime.answers).length,score=Object.entries(runtime.answers).reduce((sum,[key,value])=>sum+(Number(items[Number(key)]?.correct)===Number(value)?1:0),0);
    return `<section class="lecture-study-session mcq-session">
      <div class="lecture-study-score"><div><span>Question</span><strong>${index+1}/${items.length}</strong></div><div><span>Answered</span><strong>${answered}</strong></div><div><span>Score</span><strong>${score}/${answered||0}</strong></div></div>
      <article class="mcq-exam-card"><span>Question ${index+1}</span>${rich(item.question,'question')}<div class="mcq-options">${[1,2,3,4].map(number=>{
        const active=selected===number,truth=selected&&correct===number,wrong=active&&selected!==correct;
        return `<button type="button" data-study-answer="${number}" class="${truth?'correct':wrong?'wrong':active?'selected':''}" ${selected?'disabled':''}><b>${number}</b>${rich(item[`option${number}`])}</button>`;
      }).join('')}</div>${selected?`<p class="mcq-feedback ${selected===correct?'correct':'wrong'}">${selected===correct?'Correct answer.':`Incorrect. The correct option is ${correct}.`}</p>`:''}</article>
      <div class="lecture-study-nav"><button type="button" data-study-prev ${index===0?'disabled':''}>Previous</button><button type="button" data-study-restart>Restart exam</button><button type="button" data-study-next ${index===items.length-1?'disabled':''}>Next</button></div>
    </section>`;
  }
  function studyView(context,items){
    if(!items.length)return emptyStudy(context);
    if(context.type==='flashcards')return flashcardStudy(items);
    if(context.type==='qa')return qaStudy(items);
    return mcqStudy(items);
  }
  function editorField(item,index,column){
    const value=item[column.field]??'',preview=imageUrl(value)?`<div class="lecture-study-field-preview">${rich(value)}</div>`:'';
    if(column.field==='correct')return `<label class="lecture-study-field compact"><span>${esc(column.label)}</span><select data-study-field="${column.field}" data-study-index="${index}">${[1,2,3,4].map(number=>`<option value="${number}" ${Number(value)===number?'selected':''}>${number}</option>`).join('')}</select></label>`;
    return `<label class="lecture-study-field"><span>${esc(column.label)}</span><textarea rows="2" data-study-field="${column.field}" data-study-index="${index}" placeholder="${esc(column.label)} or direct image URL">${esc(value)}</textarea>${preview}</label>`;
  }
  function editorRow(type,item,index){
    const meta=TYPES[type];
    return `<article class="lecture-study-editor-row"><header><div><span>${esc(meta.singular)} ${index+1}</span><strong>${esc(item.front||item.question||`New ${meta.singular}`)}</strong></div><button type="button" data-study-remove="${index}" aria-label="Remove ${esc(meta.singular)}">×</button></header><div class="lecture-study-fields ${type==='mcqs'?'mcq-fields':''}">${meta.columns.map(column=>editorField(item,index,column)).join('')}</div></article>`;
  }
  function managerView(context){
    const meta=TYPES[context.type],columns=meta.columns.map(column=>column.label).join(' · ');
    return `<section class="lecture-study-manager">
      <div class="lecture-study-import-card"><div><span>Import file</span><h2>Import ${esc(meta.label)}</h2><p>Accepted: Excel, OpenDocument, CSV, TSV, TXT, and JSON.</p><small>Column order: ${esc(columns)}</small></div><label class="lecture-study-import"><input id="lecture-study-import" type="file" accept="${ACCEPT}" hidden><b>Import file</b><span>${esc(ACCEPT.replaceAll('.','').toUpperCase())}</span></label></div>
      ${runtime.notice?`<p class="lecture-study-notice" role="status">${esc(runtime.notice)}</p>`:''}
      <div class="lecture-study-editor-toolbar"><div><strong>${runtime.draft.length}</strong><span>items in this set</span></div><button type="button" data-study-add>+ Add ${esc(meta.singular)}</button></div>
      <div class="lecture-study-editor-list">${runtime.draft.length?runtime.draft.map((item,index)=>editorRow(context.type,item,index)).join(''):`<div class="lecture-study-editor-empty">Add an item or import a file to begin.</div>`}</div>
      <footer class="lecture-study-editor-footer"><button class="lecture-study-delete-set" type="button" data-study-delete-set ${storedItems(context.lecture,context.type).length?'':'disabled'}>Delete whole set</button><button class="btn btn-primary" type="button" data-study-save>Save ${esc(meta.label)}</button></footer>
    </section>`;
  }
  function view(parts){
    const context=findContext(parts);
    if(!context.subject||!context.lecture||!context.type)return `<section class="lecture-study-missing"><h1>Study set unavailable</h1><p>The lecture or study type could not be found.</p><button class="btn btn-primary" type="button" data-study-back>Back to lectures</button></section>`;
    resetRuntime(context);
    const items=storedItems(context.lecture,context.type);
    if(!canEdit()&&runtime.mode==='manage')runtime.mode='study';
    return `<section class="lecture-study-page type-${esc(context.type)}">${pageHeader(context,items)}
      <nav class="lecture-study-tabs" aria-label="Study set mode"><button type="button" data-study-mode="study" class="${runtime.mode==='study'?'active':''}">Study</button>${canEdit()?`<button type="button" data-study-mode="manage" class="${runtime.mode==='manage'?'active':''}">${items.length?'Edit set':'Create set'}</button>`:''}</nav>
      ${runtime.mode==='manage'&&canEdit()?managerView(context):studyView(context,items)}
    </section>`;
  }
  function parseDelimited(text){
    const rows=[];let row=[],cell='',quoted=false;
    for(let index=0;index<text.length;index++){
      const char=text[index];
      if(char==='"'){
        if(quoted&&text[index+1]==='"'){cell+='"';index++;}else quoted=!quoted;
      }else if(!quoted&&(char===','||char==='\t'||char===';'||char==='\n'||char==='\r')){
        if(char==='\r'&&text[index+1]==='\n')continue;
        if(char==='\n'||char==='\r'){row.push(cell);if(row.some(value=>String(value).trim()))rows.push(row);row=[];cell='';}
        else{row.push(cell);cell='';}
      }else cell+=char;
    }
    row.push(cell);if(row.some(value=>String(value).trim()))rows.push(row);
    return rows;
  }
  function objectValue(object,column){
    const keys=Object.keys(object||{});
    for(const key of keys)if(column.aliases.includes(norm(key)))return object[key];
    return '';
  }
  function rowsToItems(type,rows){
    const columns=TYPES[type].columns;
    if(!Array.isArray(rows)||!rows.length)return [];
    if(rows.every(row=>row&&typeof row==='object'&&!Array.isArray(row))){
      return rows.map(row=>cleanItem(type,Object.fromEntries(columns.map(column=>[column.field,objectValue(row,column)])))).filter(item=>validItem(type,item));
    }
    const matrix=rows.map(row=>Array.isArray(row)?row:[row]);
    const header=matrix[0].map(norm),hasHeader=columns.filter(column=>header.some(value=>column.aliases.includes(value))).length>=Math.min(2,columns.length);
    const indexes=columns.map((column,position)=>hasHeader?header.findIndex(value=>column.aliases.includes(value)):position);
    return matrix.slice(hasHeader?1:0).map(row=>{
      const raw={};columns.forEach((column,position)=>raw[column.field]=indexes[position]>=0?row[indexes[position]]:'');
      return cleanItem(type,raw);
    }).filter(item=>validItem(type,item));
  }
  async function importFile(file,type){
    const extension=String(file.name||'').split('.').pop().toLowerCase();
    if(extension==='json'){
      const parsed=JSON.parse(await file.text());
      const rows=Array.isArray(parsed)?parsed:Array.isArray(parsed?.items)?parsed.items:[];
      return rowsToItems(type,rows);
    }
    if(window.XLSX){
      const workbook=window.XLSX.read(await file.arrayBuffer(),{type:'array'});
      const sheet=workbook.Sheets[workbook.SheetNames[0]];
      return rowsToItems(type,window.XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false}));
    }
    return rowsToItems(type,parseDelimited(await file.text()));
  }
  function redraw(parts){
    const main=document.querySelector('.workspace-main');if(!main)return;
    main.innerHTML=view(parts);bind(parts);
  }
  function saveSet(context,parts){
    const cleaned=runtime.draft.map(item=>cleanItem(context.type,item)).filter(item=>validItem(context.type,item));
    if(!cleaned.length){runtime.notice='Add at least one complete item before saving.';redraw(parts);return;}
    context.lecture.studyTools=context.lecture.studyTools&&typeof context.lecture.studyTools==='object'?context.lecture.studyTools:{};
    context.lecture.studyTools[context.type]={version:1,items:cleaned,updatedAt:Date.now()};
    context.lecture.updatedAt=Date.now();
    saveLectures();
    runtime.key='';runtime.mode='study';runtime.notice='';
    showToast(`${TYPES[context.type].label} saved.`);
    redraw(parts);
  }
  function bind(parts){
    const context=findContext(parts);
    document.querySelector('[data-study-back]')?.addEventListener('click',()=>setHash(context.subject?backRoute(context):'subjects/All%20subjects'));
    document.querySelectorAll('[data-study-mode]').forEach(button=>button.addEventListener('click',()=>{
      runtime.mode=button.dataset.studyMode;
      if(runtime.mode==='manage')runtime.draft=clone(storedItems(context.lecture,context.type));
      runtime.notice='';runtime.index=0;runtime.revealed=false;redraw(parts);
    }));
    document.querySelectorAll('[data-study-reveal]').forEach(button=>button.addEventListener('click',()=>{runtime.revealed=!runtime.revealed;redraw(parts);}));
    document.querySelector('[data-study-prev]')?.addEventListener('click',()=>{runtime.index=Math.max(0,runtime.index-1);runtime.revealed=false;redraw(parts);});
    document.querySelector('[data-study-next]')?.addEventListener('click',()=>{const length=storedItems(context.lecture,context.type).length;runtime.index=Math.min(length-1,runtime.index+1);runtime.revealed=false;redraw(parts);});
    document.querySelectorAll('[data-study-answer]').forEach(button=>button.addEventListener('click',()=>{runtime.answers[runtime.index]=Number(button.dataset.studyAnswer);redraw(parts);}));
    document.querySelector('[data-study-restart]')?.addEventListener('click',()=>{runtime.answers={};runtime.index=0;runtime.revealed=false;redraw(parts);});
    document.querySelectorAll('[data-study-field]').forEach(field=>field.addEventListener('input',()=>{const item=runtime.draft[Number(field.dataset.studyIndex)];if(item)item[field.dataset.studyField]=field.dataset.studyField==='correct'?Number(field.value):field.value;}));
    document.querySelector('[data-study-add]')?.addEventListener('click',()=>{runtime.draft.push(blank(context.type));redraw(parts);});
    document.querySelectorAll('[data-study-remove]').forEach(button=>button.addEventListener('click',()=>{runtime.draft.splice(Number(button.dataset.studyRemove),1);redraw(parts);}));
    document.querySelector('[data-study-save]')?.addEventListener('click',()=>saveSet(context,parts));
    document.querySelector('[data-study-delete-set]')?.addEventListener('click',()=>{
      if(!confirm(`Delete all ${TYPES[context.type].label} for this lecture?`))return;
      if(context.lecture.studyTools)delete context.lecture.studyTools[context.type];
      context.lecture.updatedAt=Date.now();saveLectures();
      runtime.key='';runtime.mode='manage';showToast(`${TYPES[context.type].label} deleted.`);redraw(parts);
    });
    document.getElementById('lecture-study-import')?.addEventListener('change',async event=>{
      const file=event.target.files?.[0];if(!file)return;
      runtime.notice='Importing…';redraw(parts);
      try{
        const imported=await importFile(file,context.type);
        if(!imported.length)throw new Error('No valid rows matched the required columns.');
        runtime.draft.push(...imported);runtime.notice=`Imported ${imported.length} ${imported.length===1?'item':'items'}.`;
      }catch(error){runtime.notice=error?.message||'The file could not be imported.';}
      redraw(parts);
    });
  }
  function decorateEditor(subject,lectureId){
    const form=document.getElementById('lecture-media-form');if(!form||form.querySelector('.lecture-study-editor-launchers'))return;
    const lecture=(state.lectures[subject.id]||[]).find(item=>item.id===lectureId);
    const block=document.createElement('section');block.className='lecture-study-editor-launchers';
    block.innerHTML=`<div><span>Lecture study tools</span><h3>Create or edit practice for this lecture</h3><p>These Flashcards, MCQs, and Question & Answer sets belong only to this lecture.</p></div><div>${Object.entries(TYPES).map(([type,meta])=>{
      const count=storedItems(lecture,type).length;
      return `<button type="button" data-editor-study="${type}"><span>${esc(meta.icon)}</span><b>${count?'Edit':'Make'} ${esc(meta.label)}</b>${count?`<small>${count} items</small>`:`<small>${lecture?'Not added':'Saves lecture first'}</small>`}</button>`;
    }).join('')}</div>`;
    const submit=document.getElementById('lecture-media-submit');submit?.before(block);
    block.querySelectorAll('[data-editor-study]').forEach(button=>button.addEventListener('click',()=>{
      const type=button.dataset.editorStudy;
      if(lecture){routeTo(subject.id,lecture.id,type);return;}
      const name=document.getElementById('lecture-media-name');
      if(!name?.value.trim()){name?.focus();name?.reportValidity();return;}
      form.dataset.studyAfter=type;
      form.requestSubmit();
    }));
  }

  function viewerStudyRoute(event){
    const actionMap={flashcards:'flashcards',mcqs:'mcqs','question-answer':'qa'};
    const type=actionMap[event.detail?.action],lecture=event.detail?.lecture;
    if(!type||!lecture?.id)return;
    let subjectId=String(lecture.subjectId||'');
    if(!subjectId){
      const owner=Object.entries(state.lectures||{}).find(([,items])=>Array.isArray(items)&&items.some(item=>String(item.id)===String(lecture.id)));
      subjectId=owner?.[0]||'';
    }
    if(!subjectId)return;
    event.preventDefault();
    routeTo(subjectId,lecture.id,type);
  }

  const api={view,bind,routeTo};
  window.DafatiiLectureStudyTools=api;
  const originalWorkspaceContent=workspaceContent;
  workspaceContent=function(page,parts,title){
    if(page==='subjects'&&parts[1]==='lecture-study')return view(parts);
    return originalWorkspaceContent(page,parts,title);
  };
  const originalBindWorkspace=bindWorkspace;
  bindWorkspace=function(subject){
    originalBindWorkspace(subject);
    const parts=routeParts();
    if(parts[0]==='subjects'&&parts[1]==='lecture-study')bind(parts);
  };
  const originalOpenLectureSheet=window.openLectureSheet;
  window.openLectureSheet=function(subject,lectureId=''){
    const result=originalOpenLectureSheet(subject,lectureId);
    requestAnimationFrame(()=>decorateEditor(subject,lectureId));
    return result;
  };
  window.addEventListener('dafatii:viewer-study-action',viewerStudyRoute);
})();
