(() => {
  'use strict';
  const KEY = 'dafatii:materialFiles:v1';
  let rendering = false;
  const all = () => window.DafatiiData.readJSON(KEY, []);
  const save = records => window.DafatiiData.writeJSON(KEY, records);
  function context() {
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    return parts[0] === 'subjects' && parts[1] === 'subject' && parts[3] === 'lectures' ? decodeURIComponent(parts[2] || '') : null;
  }
  function render() {
    if (rendering) return;
    const subjectId = context(); const page = document.querySelector('.lectures-page');
    if (!subjectId || !page || page.querySelector('[data-material-files]')) return;
    rendering = true;
    const files = all().filter(item => item.subjectId === subjectId);
    const section = document.createElement('section'); section.className = 'material-files'; section.dataset.materialFiles = '';
    section.innerHTML = `<div class="material-files-head"><div><div class="eyebrow">Private storage</div><h2>Files</h2></div><label class="btn btn-primary material-upload">Upload file<input type="file" hidden></label></div>
      <div class="material-files-list">${files.length ? files.map(card).join('') : '<p class="muted">No uploaded files for this subject.</p>'}</div><p class="material-status" role="status"></p>`;
    page.append(section);
    const status = section.querySelector('.material-status');
    section.querySelector('input[type=file]').addEventListener('change', async event => {
      const file = event.target.files[0]; if (!file) return;
      status.textContent = `Uploading ${file.name}…`;
      try {
        const stored = await window.DafatiiFiles.upload(file);
        save([...all(), { fileId: stored.id, subjectId, filename: stored.filename, contentType: stored.contentType, size: stored.size, createdAt: stored.createdAt }]);
        status.textContent = 'Upload complete.'; section.remove(); render();
      } catch (error) { status.textContent = error.status === 401 ? 'Sign in to upload private files.' : `Upload failed: ${error.message}`; }
      event.target.value = '';
    });
    section.addEventListener('click', async event => {
      const open = event.target.closest('[data-file-open]'); const remove = event.target.closest('[data-file-delete]');
      if (open) try { await window.DafatiiFiles.open(open.dataset.fileOpen); } catch (error) { status.textContent = `Open failed: ${error.message}`; }
      if (remove && confirm('Delete this file permanently?')) {
        try { await window.DafatiiFiles.delete(remove.dataset.fileDelete); save(all().filter(item => item.fileId !== remove.dataset.fileDelete)); section.remove(); render(); }
        catch (error) { status.textContent = `Delete failed: ${error.message}`; }
      }
    });
    rendering = false;
  }
  function card(item) {
    return `<article class="material-file"><button data-file-open="${escapeHtml(item.fileId)}"><strong>${escapeHtml(item.filename)}</strong><span>${escapeHtml(item.contentType)} · ${formatBytes(item.size)}</span></button><button class="material-delete" data-file-delete="${escapeHtml(item.fileId)}" aria-label="Delete ${escapeHtml(item.filename)}">×</button></article>`;
  }
  function formatBytes(value) { const size = Number(value); if (size < 1024) return `${size} B`; if (size < 1048576) return `${(size / 1024).toFixed(1)} KiB`; return `${(size / 1048576).toFixed(1)} MiB`; }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  new MutationObserver(render).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('hashchange', render); window.addEventListener('dafatii:datahydrated', render);
})();

