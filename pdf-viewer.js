(() => {
  'use strict';
  const VERSION = '6.3.289';
  let pdfjsPromise;
  const loadPdfJs = () => pdfjsPromise ||= import(`https://cdn.jsdelivr.net/npm/pdfjs-dist@${VERSION}/build/pdf.mjs`).then(pdfjs => {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${VERSION}/build/pdf.worker.mjs`;
    return pdfjs;
  });

  async function open(fileId, metadata, options = {}) {
    const workspace = window.DafatiiViewerWorkspace;
    if (!workspace) throw new Error('Viewer workspace is unavailable.');
    const root = document.createElement('div');
    root.className = 'dafatii-immersive-viewer file-workspace pdf-workspace';
    const title = metadata.filename || 'PDF';
    root.innerHTML = `<section class="immersive-viewer-shell immersive-file-shell" role="dialog" aria-modal="true" aria-label="PDF viewer">
      <button class="immersive-close" type="button" aria-label="${workspace.esc(workspace.t('close'))}">×</button>
      <div class="immersive-title"><span>PDF</span><strong>${workspace.esc(title)}</strong></div>
      <div class="viewer-file-status" data-pdf-status>Loading PDF…</div>
      <div class="immersive-file-stage" data-pdf-stage><div class="immersive-page-track" data-pdf-track></div></div>
    </section>`;
    document.body.append(root);

    const shell = root.querySelector('.immersive-viewer-shell');
    const stage = root.querySelector('[data-pdf-stage]');
    const track = root.querySelector('[data-pdf-track]');
    const status = root.querySelector('[data-pdf-status]');
    const context = { fileId, lecture: options.lecture || null, title };
    let documentHandle = null;
    let currentPage = 1;
    let axis = workspace.getAxis('pdf');
    let zoom = 1;
    let rotation = 0;
    let renderGeneration = 0;
    let scrollFrame = 0;
    let resizeTimer = 0;
    let closed = false;

    stage.dataset.axis = axis;

    const close = () => {
      closed = true;
      renderGeneration += 1;
      window.removeEventListener('resize', onResize);
      root.remove();
    };
    root.querySelector('.immersive-close').onclick = close;
    root.addEventListener('click', event => { if (event.target === root) close(); });

    function pageNode(number) { return track.querySelector(`[data-pdf-page="${number}"]`); }
    function scrollToPage(number, behavior = 'smooth') {
      const target = pageNode(number); if (!target) return;
      currentPage = Math.max(1, Math.min(documentHandle?.numPages || number, number));
      target.scrollIntoView({ behavior, block:'center', inline:'center' });
    }
    function updateCurrentPage() {
      scrollFrame = 0;
      const pages = [...track.querySelectorAll('[data-pdf-page]')]; if (!pages.length) return;
      const rect = stage.getBoundingClientRect();
      const center = axis === 'horizontal' ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
      let best = pages[0], distance = Infinity;
      for (const page of pages) {
        const r = page.getBoundingClientRect();
        const point = axis === 'horizontal' ? r.left + r.width / 2 : r.top + r.height / 2;
        const d = Math.abs(point - center); if (d < distance) { distance = d; best = page; }
      }
      currentPage = Number(best.dataset.pdfPage) || currentPage;
      status.textContent = `${workspace.t('page')} ${currentPage} / ${documentHandle?.numPages || '—'}`;
    }
    stage.addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateCurrentPage); }, { passive:true });

    async function renderPages(preservePage = currentPage) {
      if (!documentHandle || closed) return;
      const generation = ++renderGeneration;
      status.hidden = false;
      status.textContent = `${workspace.t('page')} ${preservePage} / ${documentHandle.numPages}`;
      track.innerHTML = Array.from({ length:documentHandle.numPages }, (_, index) => `<article class="immersive-page" data-pdf-page="${index + 1}"><canvas></canvas><span class="immersive-page-label">${workspace.esc(workspace.t('page'))} ${index + 1}</span></article>`).join('');
      const stageWidth = Math.max(260, stage.clientWidth - 44);
      const stageHeight = Math.max(320, stage.clientHeight - 130);
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      for (let number = 1; number <= documentHandle.numPages; number += 1) {
        if (generation !== renderGeneration || closed) return;
        const page = await documentHandle.getPage(number);
        const base = page.getViewport({ scale:1, rotation });
        const fit = axis === 'horizontal'
          ? Math.min(stageWidth * .88 / base.width, stageHeight * .9 / base.height)
          : Math.min(stageWidth / base.width, 2.2);
        const scale = Math.max(.22, Math.min(4.5, fit * zoom));
        const viewport = page.getViewport({ scale, rotation });
        const canvas = pageNode(number)?.querySelector('canvas'); if (!canvas) continue;
        canvas.width = Math.max(1, Math.floor(viewport.width * ratio));
        canvas.height = Math.max(1, Math.floor(viewport.height * ratio));
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        const task = page.render({ canvasContext:canvas.getContext('2d'), viewport, transform:ratio === 1 ? null : [ratio,0,0,ratio,0,0] });
        await task.promise.catch(error => { if (error.name !== 'RenderingCancelledException') throw error; });
        if (number % 2 === 0) await new Promise(resolve => requestAnimationFrame(resolve));
      }
      if (generation !== renderGeneration || closed) return;
      requestAnimationFrame(() => scrollToPage(preservePage, 'auto'));
      status.textContent = `${workspace.t('page')} ${preservePage} / ${documentHandle.numPages}`;
    }

    async function search(query) {
      if (!documentHandle || !query) return '';
      const normalized = query.toLocaleLowerCase();
      for (let offset = 0; offset < documentHandle.numPages; offset += 1) {
        const candidate = ((currentPage - 1 + offset) % documentHandle.numPages) + 1;
        const text = (await (await documentHandle.getPage(candidate)).getTextContent()).items.map(item => item.str).join(' ').toLocaleLowerCase();
        if (text.includes(normalized)) { scrollToPage(candidate); return `${workspace.t('page')} ${candidate}`; }
      }
      return lang() === 'ar' ? 'لا توجد نتيجة.' : 'No match found.';
    }
    const lang = () => (typeof interfaceLanguage === 'function' ? interfaceLanguage() : document.documentElement.lang) === 'ar' ? 'ar' : 'en';

    const controls = {
      notes:true,
      close,
      getPage:() => currentPage,
      getAxis:() => axis,
      setAxis:next => { axis = next === 'horizontal' ? 'horizontal' : 'vertical'; workspace.setAxis('pdf', axis); stage.dataset.axis = axis; void renderPages(currentPage); },
      zoomIn:() => { zoom = Math.min(3.5, zoom * 1.18); void renderPages(currentPage); },
      zoomOut:() => { zoom = Math.max(.45, zoom / 1.18); void renderPages(currentPage); },
      rotate:() => { rotation = (rotation + 90) % 360; void renderPages(currentPage); },
      search,
      download:async () => { location.assign(await window.DafatiiFiles.getViewUrl(fileId, { download:true })); },
      fullscreen:() => shell.requestFullscreen?.()
    };
    workspace.mountDock(root, context, controls);

    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (!closed && documentHandle) void renderPages(currentPage); }, 180); };
    window.addEventListener('resize', onResize);

    try {
      const [pdfjs, url] = await Promise.all([loadPdfJs(), options.viewUrl || window.DafatiiFiles.getViewUrl(fileId)]);
      documentHandle = await pdfjs.getDocument({ url }).promise;
      await renderPages(1);
    } catch (error) {
      status.hidden = false;
      status.textContent = `${lang() === 'ar' ? 'تعذر فتح الملف' : 'Unable to open PDF'}: ${error.message}`;
    }
  }

  window.DafatiiPdf = Object.freeze({ open });
})();
