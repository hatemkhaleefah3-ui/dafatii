(() => {
  'use strict';
  const previous = window.openLectureLink;
  if (typeof previous !== 'function') return;

  function normalize(value) {
    const raw = String(value || '').trim(); if (!raw) return '';
    try { const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`); return ['http:','https:'].includes(url.protocol) ? url.href : ''; }
    catch { return ''; }
  }
  function isVideo(value) {
    const url = normalize(value); if (!url) return false;
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'youtu.be' || /(^|\.)youtube\.com$/i.test(parsed.hostname) || /(^|\.)vimeo\.com$/i.test(parsed.hostname)) return true;
    } catch {}
    return /\.(?:mp4|webm|ogv|ogg|mov|m4v)(?:$|[?#])/i.test(url);
  }

  window.openLectureLink = async function(lecture) {
    if (!lecture) return previous(lecture);
    if (lecture.fileId) return previous(lecture);
    const candidate = lecture.videoUrl || (isVideo(lecture.link) ? lecture.link : '');
    if (candidate && window.DafatiiViewerWorkspace) {
      try { return await window.DafatiiViewerWorkspace.openVideo({ url:normalize(candidate), lecture }); }
      catch (error) { if (typeof showToast === 'function') showToast(error.message || 'Unable to open video.'); return; }
    }
    return previous(lecture);
  };
})();
