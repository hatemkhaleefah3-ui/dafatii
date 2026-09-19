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
        setHash(`subjects/subject/${encodeURIComponent(targetSubject.id)}/lectures`);
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
