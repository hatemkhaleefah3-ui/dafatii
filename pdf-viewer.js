(() => {
  'use strict';
  const VERSION = '6.3.289';
  let pdfjsPromise;
  const loadPdfJs = () => pdfjsPromise ||= import(`https://cdn.jsdelivr.net/npm/pdfjs-dist@${VERSION}/build/pdf.mjs`).then(pdfjs => {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${VERSION}/build/pdf.worker.mjs`;
    return pdfjs;
  });
  async function open(fileId, metadata) {
    const root = document.createElement('div');
    root.className = 'dafatii-viewer';
    root.innerHTML = `<section class="dafatii-viewer-panel" role="dialog" aria-modal="true" aria-label="PDF viewer">
      <header><strong>${escapeHtml(metadata.filename)}</strong><div class="pdf-tools">
        <button data-pdf="prev" aria-label="Previous page">←</button><span><input data-pdf="page" inputmode="numeric" value="1"> / <b data-pdf="total">–</b></span><button data-pdf="next" aria-label="Next page">→</button>
        <button data-pdf="out" aria-label="Zoom out">−</button><button data-pdf="fit">Fit</button><button data-pdf="in" aria-label="Zoom in">＋</button><button data-pdf="rotate">↻</button>
        <input data-pdf="search" type="search" placeholder="Search"><button data-pdf="find">Find</button>
        <button data-pdf="download">Download</button><button data-pdf="fullscreen">Fullscreen</button><button data-pdf="close" aria-label="Close">×</button>
      </div></header><div class="pdf-status" data-pdf="status">Loading PDF…</div><div class="pdf-stage"><canvas></canvas></div></section>`;
    document.body.append(root);
    const panel = root.querySelector('.dafatii-viewer-panel');
    const canvas = root.querySelector('canvas');
    const status = root.querySelector('[data-pdf=status]');
    let documentHandle, pageNumber = 1, scale = 1.25, rotation = 0, renderTask;
    const render = async () => {
      if (!documentHandle) return;
      renderTask?.cancel();
      const page = await documentHandle.getPage(pageNumber);
      const viewport = page.getViewport({ scale, rotation });
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * ratio); canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${viewport.width}px`; canvas.style.height = `${viewport.height}px`;
      renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport, transform: ratio === 1 ? null : [ratio, 0, 0, ratio, 0, 0] });
      await renderTask.promise.catch(error => { if (error.name !== 'RenderingCancelledException') throw error; });
      root.querySelector('[data-pdf=page]').value = pageNumber; status.hidden = true;
    };
    const fit = async () => {
      const page = await documentHandle.getPage(pageNumber); const viewport = page.getViewport({ scale: 1, rotation });
      scale = Math.max(0.25, Math.min(3, (root.querySelector('.pdf-stage').clientWidth - 32) / viewport.width)); await render();
    };
    root.addEventListener('click', async event => {
      const action = event.target.dataset.pdf; if (!action) return;
      if (action === 'close') root.remove();
      else if (action === 'prev' && pageNumber > 1) { pageNumber--; await render(); }
      else if (action === 'next' && pageNumber < documentHandle.numPages) { pageNumber++; await render(); }
      else if (action === 'in') { scale = Math.min(4, scale * 1.2); await render(); }
      else if (action === 'out') { scale = Math.max(0.25, scale / 1.2); await render(); }
      else if (action === 'fit') await fit();
      else if (action === 'rotate') { rotation = (rotation + 90) % 360; await render(); }
      else if (action === 'fullscreen') await panel.requestFullscreen?.();
      else if (action === 'download') location.assign(await window.DafatiiFiles.getViewUrl(fileId, { download: true }));
      else if (action === 'find') {
        const query = root.querySelector('[data-pdf=search]').value.trim().toLocaleLowerCase();
        if (!query) return;
        status.hidden = false; status.textContent = 'Searching…';
        for (let offset = 0; offset < documentHandle.numPages; offset += 1) {
          const candidate = ((pageNumber - 1 + offset) % documentHandle.numPages) + 1;
          const text = (await (await documentHandle.getPage(candidate)).getTextContent()).items.map(item => item.str).join(' ').toLocaleLowerCase();
          if (text.includes(query)) { pageNumber = candidate; status.textContent = `Match on page ${candidate}`; await render(); return; }
        }
        status.textContent = 'No match found.';
      }
    });
    root.querySelector('[data-pdf=page]').addEventListener('change', async event => { pageNumber = Math.min(documentHandle.numPages, Math.max(1, Number(event.target.value) || 1)); await render(); });
    try {
      const [pdfjs, url] = await Promise.all([loadPdfJs(), window.DafatiiFiles.getViewUrl(fileId)]);
      documentHandle = await pdfjs.getDocument({ url }).promise;
      root.querySelector('[data-pdf=total]').textContent = documentHandle.numPages;
      await fit();
    } catch (error) { status.hidden = false; status.textContent = `Unable to open PDF: ${error.message}`; }
  }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  window.DafatiiPdf = Object.freeze({ open });
})();

