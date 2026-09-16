(() => {
  'use strict';
  const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

  async function open(fileId, metadata, options = {}) {
    if (!window.JSZip) throw new Error('Document reader is unavailable.');
    const workspace = window.DafatiiViewerWorkspace;
    if (!workspace) throw new Error('Viewer workspace is unavailable.');
    const root = document.createElement('div');
    root.className = 'dafatii-immersive-viewer file-workspace office-workspace';
    const title = metadata.filename || workspace.t('file');
    root.innerHTML = `<section class="immersive-viewer-shell immersive-file-shell" role="dialog" aria-modal="true">
      <button class="immersive-close" type="button" aria-label="${workspace.esc(workspace.t('close'))}">×</button>
      <div class="immersive-title"><span>${workspace.esc(workspace.t('file'))}</span><strong>${workspace.esc(title)}</strong></div>
      <div class="viewer-file-status" data-office-status>Preparing document…</div>
      <div class="office-workspace-stage" data-office-stage><div class="office-page-track" data-office-track></div></div>
    </section>`;
    document.body.append(root);

    const shell = root.querySelector('.immersive-viewer-shell');
    const stage = root.querySelector('[data-office-stage]');
    const track = root.querySelector('[data-office-track]');
    const status = root.querySelector('[data-office-status]');
    let axis = workspace.getAxis('office');
    let currentPage = 1;
    stage.dataset.axis = axis;
    const close = () => root.remove();
    root.querySelector('.immersive-close').onclick = close;
    root.addEventListener('click', event => { if (event.target === root) close(); });

    const context = { fileId, lecture:options.lecture || null, title };
    workspace.mountDock(root, context, {
      close,
      getAxis:() => axis,
      setAxis:next => { axis = next === 'horizontal' ? 'horizontal' : 'vertical'; workspace.setAxis('office', axis); stage.dataset.axis = axis; updateCurrentPage(); },
      download:async () => { location.assign(await window.DafatiiFiles.getViewUrl(fileId, { download:true })); },
      fullscreen:() => shell.requestFullscreen?.()
    });

    let frame = 0;
    function updateCurrentPage() {
      frame = 0;
      const pages = [...track.children]; if (!pages.length) return;
      const rect = stage.getBoundingClientRect();
      const center = axis === 'horizontal' ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
      let best = pages[0], distance = Infinity;
      for (const page of pages) {
        const r = page.getBoundingClientRect();
        const point = axis === 'horizontal' ? r.left + r.width / 2 : r.top + r.height / 2;
        const d = Math.abs(point - center); if (d < distance) { distance = d; best = page; }
      }
      currentPage = Number(best.dataset.officePage) || 1;
      status.textContent = pages.length > 1 ? `${workspace.t('page')} ${currentPage} / ${pages.length}` : title;
    }
    stage.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(updateCurrentPage); }, { passive:true });

    try {
      const response = await fetch(await window.DafatiiFiles.getViewUrl(fileId));
      if (!response.ok) throw new Error(`Unable to read document (${response.status}).`);
      const zip = await JSZip.loadAsync(await response.arrayBuffer());
      if (metadata.contentType === DOCX) {
        track.innerHTML = `<div data-office-page="1">${await renderDocx(zip)}</div>`;
        status.textContent = title;
      } else if (metadata.contentType === PPTX) {
        const slides = await renderPptx(zip);
        track.innerHTML = slides.map((html,index) => `<div data-office-page="${index + 1}">${html}</div>`).join('');
        status.textContent = `${workspace.t('page')} 1 / ${slides.length}`;
      } else throw new Error('This document format is not supported by the reader.');
      requestAnimationFrame(updateCurrentPage);
    } catch (error) {
      track.innerHTML = `<div class="file-reading-state error">${escapeHtml(error.message)}</div>`;
      status.textContent = error.message;
    }
  }

  async function renderDocx(zip) {
    const entry = zip.file('word/document.xml'); if (!entry) throw new Error('The Word document is invalid.');
    const xml = parseXml(await entry.async('string'));
    const blocks = Array.from(xml.getElementsByTagNameNS('*', 'p')).map(paragraph => {
      const text = Array.from(paragraph.getElementsByTagNameNS('*', 't')).map(node => node.textContent).join('');
      if (!text.trim()) return '<div class="office-space"></div>';
      const styleNode = paragraph.getElementsByTagNameNS('*', 'pStyle')[0];
      const style = styleNode?.getAttribute('w:val') || styleNode?.getAttribute('val') || '';
      const heading = /^Heading([1-3])$/i.exec(style);
      return heading ? `<h${heading[1]}>${escapeHtml(text)}</h${heading[1]}>` : `<p>${escapeHtml(text)}</p>`;
    }).join('');
    return `<article class="word-reader">${blocks || '<p>This document has no readable text.</p>'}</article>`;
  }

  async function renderPptx(zip) {
    const names = Object.keys(zip.files).filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name)).sort((a,b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
    if (!names.length) throw new Error('The presentation has no readable slides.');
    return Promise.all(names.map(async (name,index) => {
      const xml = parseXml(await zip.file(name).async('string'));
      const paragraphs = Array.from(xml.getElementsByTagNameNS('*', 'p')).map(node => Array.from(node.getElementsByTagNameNS('*', 't')).map(text => text.textContent).join('')).filter(Boolean);
      const [title,...body] = paragraphs;
      return `<article class="slide-reader"><div class="slide-number">Slide ${index + 1}</div><h1>${escapeHtml(title || `Slide ${index + 1}`)}</h1>${body.length ? `<ul>${body.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>` : '<p>No readable text on this slide.</p>'}</article>`;
    }));
  }

  function parseXml(value) { const xml = new DOMParser().parseFromString(value,'application/xml'); if (xml.querySelector('parsererror')) throw new Error('Document content could not be read.'); return xml; }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char])); }
  window.DafatiiOffice = Object.freeze({ open, types:Object.freeze([DOCX,PPTX]) });
})();
