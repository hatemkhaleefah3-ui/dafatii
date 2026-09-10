(() => {
  'use strict';
  async function open(fileId, metadata) {
    const url = await window.DafatiiFiles.getViewUrl(fileId);
    const root = document.createElement('div'); root.className = 'dafatii-viewer media-viewer';
    let media;
    if (metadata.contentType.startsWith('image/')) media = `<img src="${escapeHtml(url)}" alt="${escapeHtml(metadata.filename)}">`;
    else if (metadata.contentType.startsWith('audio/')) media = `<audio src="${escapeHtml(url)}" controls autoplay></audio>`;
    else if (metadata.contentType.startsWith('video/')) media = `<video src="${escapeHtml(url)}" controls autoplay playsinline></video>`;
    else { location.assign(await window.DafatiiFiles.getViewUrl(fileId, { download: true })); return; }
    root.innerHTML = `<section class="dafatii-viewer-panel" role="dialog" aria-modal="true"><header><strong>${escapeHtml(metadata.filename)}</strong><button data-close aria-label="Close">×</button></header><div class="media-stage">${media}</div></section>`;
    root.addEventListener('click', event => { if (event.target === root || event.target.closest('[data-close]')) root.remove(); });
    document.body.append(root);
  }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  window.DafatiiMedia = Object.freeze({ open });
})();

