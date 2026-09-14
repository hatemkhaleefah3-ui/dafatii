(() => {
  'use strict';
  async function open(fileId, metadata, options = {}) {
    const supplied = Array.isArray(options.items) ? options.items : [];
    const images = supplied.filter(item => item?.fileId && String(item.contentType || '').startsWith('image/'));
    const gallery = metadata.contentType.startsWith('image/') ? (images.some(item => item.fileId === fileId) ? images : [{ ...metadata, fileId }]) : [{ ...metadata, fileId }];
    let index = Math.max(0, gallery.findIndex(item => item.fileId === fileId));
    let current = gallery[index]; let scale = 1; let rotation = 0;
    const root = document.createElement('div'); root.className = 'dafatii-viewer media-viewer';
    root.innerHTML = `<section class="dafatii-viewer-panel" role="dialog" aria-modal="true" aria-label="File viewer">
      <header><div class="viewer-title"><strong data-viewer-title>${escapeHtml(metadata.filename)}</strong><span data-viewer-meta>${formatBytes(metadata.size)}</span></div><div class="viewer-actions">
        <button data-action="previous" aria-label="Previous image" hidden>←</button><span data-gallery-count></span><button data-action="next" aria-label="Next image" hidden>→</button>
        <button data-action="zoom-out" class="image-tool" hidden aria-label="Zoom out">−</button><button data-action="reset" class="image-tool" hidden>100%</button><button data-action="zoom-in" class="image-tool" hidden aria-label="Zoom in">＋</button><button data-action="rotate" class="image-tool" hidden aria-label="Rotate">↻</button>
        <button data-action="pip" class="video-tool" hidden>Picture in picture</button><button data-action="download">Download</button><button data-action="fullscreen">Fullscreen</button><button data-action="close" aria-label="Close">×</button>
      </div></header><div class="media-stage"><div class="file-reading-state">Opening file…</div></div><div class="image-filmstrip" hidden></div></section>`;
    document.body.append(root);
    const panel = root.querySelector('.dafatii-viewer-panel'); const stage = root.querySelector('.media-stage'); const filmstrip = root.querySelector('.image-filmstrip');
    const imageTools = () => root.querySelectorAll('.image-tool'); const videoTools = () => root.querySelectorAll('.video-tool');
    const setVisible = (nodes, visible) => nodes.forEach(node => { node.hidden = !visible; });
    const applyTransform = () => { const image = stage.querySelector('.image-reader'); if (image) image.style.transform = `scale(${scale}) rotate(${rotation}deg)`; root.querySelector('[data-action=reset]').textContent = `${Math.round(scale * 100)}%`; };
    const showError = message => { stage.innerHTML = `<div class="viewer-error"><strong>Unable to display this file</strong><p>${escapeHtml(message)}</p><button data-action="download">Download file</button></div>`; };
    async function render() {
      current = gallery[index]; scale = 1; rotation = 0;
      root.querySelector('[data-viewer-title]').textContent = current.filename;
      root.querySelector('[data-viewer-meta]').textContent = `${formatBytes(current.size)} · ${friendlyType(current.contentType)}`;
      setVisible(imageTools(), current.contentType.startsWith('image/')); setVisible(videoTools(), false);
      root.querySelector('[data-action=previous]').hidden = gallery.length < 2; root.querySelector('[data-action=next]').hidden = gallery.length < 2;
      root.querySelector('[data-gallery-count]').textContent = gallery.length > 1 ? `${index + 1} / ${gallery.length}` : '';
      stage.innerHTML = '<div class="file-reading-state">Opening file…</div>';
      try {
        const url = await window.DafatiiFiles.getViewUrl(current.fileId);
        if (current.contentType.startsWith('image/')) {
          stage.innerHTML = `<div class="image-canvas"><img class="image-reader" src="${escapeHtml(url)}" alt="${escapeHtml(current.filename)}"><button class="gallery-arrow previous" data-action="previous" aria-label="Previous image">‹</button><button class="gallery-arrow next" data-action="next" aria-label="Next image">›</button></div>`;
          const image = stage.querySelector('img'); image.addEventListener('error', () => showError('The image data could not be loaded from storage.')); image.addEventListener('dblclick', () => { scale = scale === 1 ? 2 : 1; applyTransform(); }); applyTransform();
        } else if (current.contentType.startsWith('audio/')) {
          stage.innerHTML = `<div class="audio-reader"><div class="audio-art">♫</div><strong>${escapeHtml(current.filename)}</strong><audio src="${escapeHtml(url)}" controls autoplay preload="metadata"></audio></div>`;
          stage.querySelector('audio').addEventListener('error', () => showError('The audio data could not be loaded from storage.'));
        } else if (current.contentType.startsWith('video/')) {
          stage.innerHTML = `<div class="video-reader"><video src="${escapeHtml(url)}" controls autoplay playsinline preload="metadata"></video></div>`; setVisible(videoTools(), true);
          stage.querySelector('video').addEventListener('error', () => showError('The video data could not be loaded or this codec is unsupported.'));
        } else if (['text/plain', 'text/csv'].includes(current.contentType)) await renderText(url, current, stage);
        else if (/spreadsheet|excel/.test(current.contentType) && window.XLSX) await renderSheet(url, stage);
        else stage.innerHTML = genericCard(current);
        renderFilmstrip();
      } catch (error) { showError(error.message); }
    }
    function renderFilmstrip() {
      if (gallery.length < 2 || !current.contentType.startsWith('image/')) { filmstrip.hidden = true; return; }
      filmstrip.hidden = false;
      filmstrip.innerHTML = gallery.map((item, position) => `<button class="${position === index ? 'active' : ''}" data-gallery-index="${position}" aria-label="Open ${escapeHtml(item.filename)}"><span>${position + 1}</span><strong>${escapeHtml(item.filename)}</strong></button>`).join('');
      filmstrip.querySelector('.active')?.scrollIntoView({ inline: 'center', block: 'nearest' });
      gallery.forEach(async (item, position) => { try { const url = await window.DafatiiFiles.getViewUrl(item.fileId); const thumbnail = document.createElement('img'); thumbnail.src = url; thumbnail.alt = ''; filmstrip.querySelector(`[data-gallery-index="${position}"]`)?.prepend(thumbnail); } catch {} });
    }
    async function move(delta) { index = (index + delta + gallery.length) % gallery.length; await render(); }
    const onKey = event => { if (event.key === 'Escape') close(); else if (event.key === 'ArrowLeft' && gallery.length > 1) void move(-1); else if (event.key === 'ArrowRight' && gallery.length > 1) void move(1); };
    const close = () => { document.removeEventListener('keydown', onKey); root.remove(); };
    root.addEventListener('click', async event => {
      const thumbnail = event.target.closest('[data-gallery-index]'); if (thumbnail) { index = Number(thumbnail.dataset.galleryIndex); await render(); return; }
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (event.target === root || action === 'close') close();
      else if (action === 'previous') await move(-1); else if (action === 'next') await move(1);
      else if (action === 'zoom-in') { scale = Math.min(5, scale * 1.25); applyTransform(); }
      else if (action === 'zoom-out') { scale = Math.max(.2, scale / 1.25); applyTransform(); }
      else if (action === 'reset') { scale = 1; rotation = 0; applyTransform(); }
      else if (action === 'rotate') { rotation = (rotation + 90) % 360; applyTransform(); }
      else if (action === 'download') location.assign(await window.DafatiiFiles.getViewUrl(current.fileId, { download: true }));
      else if (action === 'fullscreen') await panel.requestFullscreen?.();
      else if (action === 'pip') await stage.querySelector('video')?.requestPictureInPicture?.();
    });
    stage.addEventListener('wheel', event => { if (!current.contentType.startsWith('image/') || !event.ctrlKey) return; event.preventDefault(); scale = Math.min(5, Math.max(.2, scale * (event.deltaY < 0 ? 1.12 : .89))); applyTransform(); }, { passive: false });
    document.addEventListener('keydown', onKey); await render();
  }
  async function renderText(url, metadata, stage) {
    const response = await fetch(url, { headers: { Range: 'bytes=0-2097151' } }); if (!response.ok) throw new Error(`Unable to read file (${response.status}).`);
    const content = await response.text(); stage.innerHTML = metadata.contentType === 'text/csv' ? csvTable(content) : `<pre class="text-reader">${escapeHtml(content)}</pre>`;
    if (Number(metadata.size) > 2097152) stage.insertAdjacentHTML('afterbegin', '<p class="viewer-notice">Showing the first 2 MB. Download the file to read the rest.</p>');
  }
  async function renderSheet(url, stage) {
    const response = await fetch(url); if (!response.ok) throw new Error(`Unable to read spreadsheet (${response.status}).`);
    const workbook = XLSX.read(await response.arrayBuffer(), { type: 'array' }); const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }).slice(0, 500).map(row => row.slice(0, 60));
    stage.innerHTML = `<div class="sheet-reader"><div class="sheet-name">${escapeHtml(workbook.SheetNames[0] || 'Sheet 1')}</div>${rowsToTable(rows)}</div>`;
  }
  const csvTable = content => `<div class="sheet-reader">${rowsToTable(content.split(/\r?\n/).slice(0, 500).map(line => line.split(',').slice(0, 60)))}</div>`;
  const rowsToTable = rows => `<table>${rows.map((row, index) => `<tr>${row.map(cell => `<${index ? 'td' : 'th'}>${escapeHtml(cell ?? '')}</${index ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</table>`;
  const genericCard = metadata => `<div class="generic-file-reader"><div class="generic-file-icon" aria-hidden="true">FILE</div><h2>${friendlyType(metadata.contentType)}</h2><p>${escapeHtml(metadata.filename)}</p><span>${formatBytes(metadata.size)} · ${escapeHtml(metadata.contentType)}</span><p class="muted">Download this file to open it in a compatible application.</p></div>`;
  function friendlyType(type) { if (type.startsWith('image/')) return 'Image'; if (type.startsWith('video/')) return 'Video'; if (type.startsWith('audio/')) return 'Audio'; if (type === 'text/csv') return 'CSV'; if (type.startsWith('text/')) return 'Text'; return type.split('/').pop().replace(/[.-]/g, ' '); }
  function formatBytes(value) { const size = Number(value) || 0; if (size < 1024) return `${size} B`; if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`; return `${(size / 1048576).toFixed(1)} MB`; }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  window.DafatiiMedia = Object.freeze({ open });
})();
