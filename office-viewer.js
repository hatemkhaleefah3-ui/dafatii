(() => {
  'use strict';
  const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  async function open(fileId, metadata) {
    if (!window.JSZip) throw new Error('Document reader is unavailable.');
    const root = document.createElement('div'); root.className = 'dafatii-viewer office-viewer';
    root.innerHTML = `<section class="dafatii-viewer-panel" role="dialog" aria-modal="true"><header><strong>${escapeHtml(metadata.filename)}</strong><div class="viewer-actions"><span data-office-count></span><button data-office-prev hidden>←</button><button data-office-next hidden>→</button><button data-download>Download</button><button data-close aria-label="Close">×</button></div></header><div class="office-stage"><div class="file-reading-state">Preparing document…</div></div></section>`;
    document.body.append(root);
    const stage = root.querySelector('.office-stage'); let slides = []; let current = 0;
    const renderSlide = () => { stage.innerHTML = slides[current]; root.querySelector('[data-office-count]').textContent = `${current + 1} / ${slides.length}`; root.querySelector('[data-office-prev]').disabled = current === 0; root.querySelector('[data-office-next]').disabled = current === slides.length - 1; };
    root.addEventListener('click', async event => {
      if (event.target === root || event.target.closest('[data-close]')) root.remove();
      else if (event.target.closest('[data-download]')) location.assign(await window.DafatiiFiles.getViewUrl(fileId, { download: true }));
      else if (event.target.closest('[data-office-prev]') && current > 0) { current--; renderSlide(); }
      else if (event.target.closest('[data-office-next]') && current < slides.length - 1) { current++; renderSlide(); }
    });
    try {
      const response = await fetch(await window.DafatiiFiles.getViewUrl(fileId));
      if (!response.ok) throw new Error(`Unable to read document (${response.status}).`);
      const zip = await JSZip.loadAsync(await response.arrayBuffer());
      if (metadata.contentType === DOCX) stage.innerHTML = await renderDocx(zip);
      else if (metadata.contentType === PPTX) { slides = await renderPptx(zip); root.querySelector('[data-office-prev]').hidden = false; root.querySelector('[data-office-next]').hidden = false; renderSlide(); }
      else throw new Error('This document format is not supported by the reader.');
    } catch (error) { stage.innerHTML = `<div class="file-reading-state error">${escapeHtml(error.message)}</div>`; }
  }
  async function renderDocx(zip) {
    const entry = zip.file('word/document.xml'); if (!entry) throw new Error('The Word document is invalid.');
    const xml = parseXml(await entry.async('string'));
    const blocks = Array.from(xml.getElementsByTagNameNS('*', 'p')).map(paragraph => {
      const text = Array.from(paragraph.getElementsByTagNameNS('*', 't')).map(node => node.textContent).join('');
      if (!text.trim()) return '<div class="office-space"></div>';
      const styleNode = paragraph.getElementsByTagNameNS('*', 'pStyle')[0]; const style = styleNode?.getAttribute('w:val') || styleNode?.getAttribute('val') || '';
      const heading = /^Heading([1-3])$/i.exec(style);
      return heading ? `<h${heading[1]}>${escapeHtml(text)}</h${heading[1]}>` : `<p>${escapeHtml(text)}</p>`;
    }).join('');
    return `<article class="word-reader">${blocks || '<p>This document has no readable text.</p>'}</article>`;
  }
  async function renderPptx(zip) {
    const names = Object.keys(zip.files).filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name)).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
    if (!names.length) throw new Error('The presentation has no readable slides.');
    return Promise.all(names.map(async (name, index) => {
      const xml = parseXml(await zip.file(name).async('string'));
      const paragraphs = Array.from(xml.getElementsByTagNameNS('*', 'p')).map(node => Array.from(node.getElementsByTagNameNS('*', 't')).map(text => text.textContent).join('')).filter(Boolean);
      const [title, ...body] = paragraphs;
      return `<article class="slide-reader"><div class="slide-number">Slide ${index + 1}</div><h1>${escapeHtml(title || `Slide ${index + 1}`)}</h1>${body.length ? `<ul>${body.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>` : '<p>No readable text on this slide.</p>'}</article>`;
    }));
  }
  function parseXml(value) { const xml = new DOMParser().parseFromString(value, 'application/xml'); if (xml.querySelector('parsererror')) throw new Error('Document content could not be read.'); return xml; }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  window.DafatiiOffice = Object.freeze({ open, types: Object.freeze([DOCX, PPTX]) });
})();
