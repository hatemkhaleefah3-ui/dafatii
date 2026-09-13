(() => {
  'use strict';
  async function open(fileId, metadata) {
    const url = await window.DafatiiFiles.getViewUrl(fileId);
    const root = document.createElement('div'); root.className = 'dafatii-viewer media-viewer';
    let media; let loadContent;
    if (metadata.contentType.startsWith('image/')) media = `<img src="${escapeHtml(url)}" alt="${escapeHtml(metadata.filename)}">`;
    else if (metadata.contentType.startsWith('audio/')) media = `<audio src="${escapeHtml(url)}" controls autoplay></audio>`;
    else if (metadata.contentType.startsWith('video/')) media = `<video src="${escapeHtml(url)}" controls autoplay playsinline></video>`;
    else if (['text/plain', 'text/csv'].includes(metadata.contentType)) {
      media = '<div class="file-reading-state">Opening file…</div>';
      loadContent = async stage => {
        const response = await fetch(url, { headers: { Range: 'bytes=0-2097151' } });
        if (!response.ok) throw new Error(`Unable to read file (${response.status}).`);
        const content = await response.text();
        if (metadata.contentType === 'text/csv') stage.innerHTML = csvTable(content);
        else stage.innerHTML = `<pre class="text-reader">${escapeHtml(content)}</pre>`;
        if (Number(metadata.size) > 2097152) stage.insertAdjacentHTML('afterbegin', '<p class="viewer-notice">Showing the first 2 MB. Download the file to read the rest.</p>');
      };
    } else if (/spreadsheet|excel/.test(metadata.contentType) && window.XLSX) {
      media = '<div class="file-reading-state">Opening spreadsheet…</div>';
      loadContent = async stage => {
        const response = await fetch(url); if (!response.ok) throw new Error(`Unable to read spreadsheet (${response.status}).`);
        const workbook = XLSX.read(await response.arrayBuffer(), { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }).slice(0, 500).map(row => row.slice(0, 60));
        stage.innerHTML = `<div class="sheet-reader"><div class="sheet-name">${escapeHtml(workbook.SheetNames[0] || 'Sheet 1')}</div>${rowsToTable(rows)}</div>`;
      };
    } else {
      const label = /word/.test(metadata.contentType) ? 'Word document' : /presentation|powerpoint/.test(metadata.contentType) ? 'Presentation' : /zip/.test(metadata.contentType) ? 'Archive' : 'File';
      media = `<div class="generic-file-reader"><div class="generic-file-icon" aria-hidden="true">${fileGlyph(label)}</div><h2>${label}</h2><p>${escapeHtml(metadata.filename)}</p><span>${formatBytes(metadata.size)} · ${escapeHtml(metadata.contentType)}</span><p class="muted">This format is stored securely and is ready to download.</p></div>`;
    }
    root.innerHTML = `<section class="dafatii-viewer-panel" role="dialog" aria-modal="true"><header><strong>${escapeHtml(metadata.filename)}</strong><div class="viewer-actions"><button data-download>Download</button><button data-close aria-label="Close">×</button></div></header><div class="media-stage">${media}</div></section>`;
    root.addEventListener('click', async event => {
      if (event.target === root || event.target.closest('[data-close]')) root.remove();
      if (event.target.closest('[data-download]')) location.assign(await window.DafatiiFiles.getViewUrl(fileId, { download: true }));
    });
    document.body.append(root);
    if (loadContent) try { await loadContent(root.querySelector('.media-stage')); } catch (error) { root.querySelector('.media-stage').innerHTML = `<div class="file-reading-state error">${escapeHtml(error.message)}</div>`; }
  }
  function csvTable(content) {
    const rows = content.split(/\r?\n/).slice(0, 500).map(line => line.split(',').slice(0, 60));
    return `<div class="sheet-reader">${rowsToTable(rows)}</div>`;
  }
  function rowsToTable(rows) { return `<table>${rows.map((row, index) => `<tr>${row.map(cell => `<${index ? 'td' : 'th'}>${escapeHtml(cell ?? '')}</${index ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</table>`; }
  function fileGlyph(label) { return label === 'Word document' ? 'W' : label === 'Presentation' ? 'P' : label === 'Archive' ? 'ZIP' : 'FILE'; }
  function formatBytes(value) { const size = Number(value) || 0; if (size < 1024) return `${size} B`; if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`; return `${(size / 1048576).toFixed(1)} MB`; }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  window.DafatiiMedia = Object.freeze({ open });
})();
