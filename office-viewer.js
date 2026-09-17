(() => {
  'use strict';

  const DOC = 'application/msword';
  const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const PPT = 'application/vnd.ms-powerpoint';
  const PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  const TYPES = Object.freeze([DOC, DOCX, PPT, PPTX]);
  const RUNTIME_VERSION = '3.1.1';
  const RUNTIME_URL = `https://cdn.jsdelivr.net/npm/@file-viewer/web-full@${RUNTIME_VERSION}/dist/flyfish-file-viewer-web-full.iife.js`;
  const RUNTIME_ID = 'dafatii-native-office-runtime';
  let runtimePromise = null;

  function normalizedType(value) {
    return String(value || '').toLowerCase().split(';')[0].trim();
  }

  function filenameFor(metadata = {}) {
    const fallbackByType = {
      [DOC]: 'document.doc',
      [DOCX]: 'document.docx',
      [PPT]: 'presentation.ppt',
      [PPTX]: 'presentation.pptx'
    };
    return String(metadata.filename || metadata.originalFilename || metadata.name || fallbackByType[normalizedType(metadata.contentType)] || 'document');
  }

  function loadRuntime() {
    if (window.FlyfishFileViewerWebFull?.mountViewer) return Promise.resolve(window.FlyfishFileViewerWebFull);
    if (runtimePromise) return runtimePromise;

    runtimePromise = new Promise((resolve, reject) => {
      const finish = () => {
        const runtime = window.FlyfishFileViewerWebFull;
        if (runtime?.mountViewer) resolve(runtime);
        else reject(new Error('Native Office reader loaded without its browser API.'));
      };
      const fail = () => reject(new Error('Unable to load the native Office reader runtime.'));

      const existing = document.getElementById(RUNTIME_ID);
      if (existing) {
        existing.addEventListener('load', finish, { once:true });
        existing.addEventListener('error', fail, { once:true });
        if (window.FlyfishFileViewerWebFull?.mountViewer) finish();
        return;
      }

      const script = document.createElement('script');
      script.id = RUNTIME_ID;
      script.src = RUNTIME_URL;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.addEventListener('load', finish, { once:true });
      script.addEventListener('error', fail, { once:true });
      document.head.append(script);
    }).catch(error => {
      runtimePromise = null;
      throw error;
    });

    return runtimePromise;
  }

  function searchSummary(result, query) {
    if (!result) return 'No match found.';
    const total = Number(result.total ?? result.totalCount ?? result.count ?? result.results?.length ?? result.matches?.length);
    if (Number.isFinite(total)) return total > 0 ? `${total} match${total === 1 ? '' : 'es'} for “${query}”.` : 'No match found.';
    return result.query ? `Search completed for “${result.query}”.` : `Search completed for “${query}”.`;
  }

  async function open(fileId, metadata, options = {}) {
    const type = normalizedType(metadata?.contentType);
    if (!TYPES.includes(type)) throw new Error('This Office file type is not supported by the reader.');

    const workspace = window.DafatiiViewerWorkspace;
    if (!workspace) throw new Error('Viewer workspace is unavailable.');

    const root = document.createElement('div');
    root.className = 'dafatii-immersive-viewer file-workspace office-workspace native-office-workspace';
    const title = filenameFor({ ...metadata, contentType:type });
    root.innerHTML = `<section class="immersive-viewer-shell immersive-file-shell" role="dialog" aria-modal="true" aria-label="${workspace.esc(title)}">
      <button class="immersive-close" type="button" aria-label="${workspace.esc(workspace.t('close'))}">×</button>
      <div class="immersive-title"><span>${workspace.esc(workspace.t('file'))}</span><strong>${workspace.esc(title)}</strong></div>
      <div class="viewer-file-status" data-office-status>Preparing document…</div>
      <div class="office-workspace-stage native-office-stage" data-office-stage><div class="native-office-host" data-office-native-host></div></div>
    </section>`;
    document.body.append(root);

    const shell = root.querySelector('.immersive-viewer-shell');
    const host = root.querySelector('[data-office-native-host]');
    const status = root.querySelector('[data-office-status]');
    let controller = null;
    let closed = false;

    const close = () => {
      if (closed) return;
      closed = true;
      try { controller?.destroy?.(); } catch {}
      controller = null;
      root.remove();
    };
    root.querySelector('.immersive-close').onclick = close;
    root.addEventListener('click', event => { if (event.target === root) close(); });

    const context = { fileId, lecture:options.lecture || null, title };
    workspace.mountDock(root, context, {
      notes:true,
      close,
      getPage:() => null,
      zoomIn:() => controller?.zoomIn?.(),
      zoomOut:() => controller?.zoomOut?.(),
      search:async query => searchSummary(await controller?.searchDocument?.(query), query),
      download:async () => { location.assign(await window.DafatiiFiles.getViewUrl(fileId, { download:true })); },
      fullscreen:() => shell.requestFullscreen?.()
    });

    try {
      const [runtime, viewUrl] = await Promise.all([
        loadRuntime(),
        window.DafatiiFiles.getViewUrl(fileId)
      ]);
      if (closed) return root;

      const response = await fetch(viewUrl, { credentials:'include', cache:'no-store' });
      if (!response.ok) throw new Error(`Unable to read document (${response.status}).`);
      const buffer = await response.arrayBuffer();
      if (closed) return root;
      if (!buffer.byteLength) throw new Error('The document is empty.');

      const file = new File([buffer], title, {
        type:type || normalizedType(response.headers.get('content-type')) || 'application/octet-stream',
        lastModified:Date.now()
      });

      controller = runtime.mountViewer(host, {
        file,
        filename:title,
        name:title,
        size:buffer.byteLength,
        options:{
          toolbar:false,
          watermark:false,
          styleIsolation:'none',
          theme:document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
          fit:'width'
        },
        onStateChange(state) {
          if (closed) return;
          if (state?.error) {
            const message = state.error?.message || String(state.error);
            status.hidden = false;
            status.textContent = message;
            return;
          }
          if (state?.ready) status.hidden = true;
          else if (state?.loading) {
            status.hidden = false;
            status.textContent = 'Preparing document…';
          }
        }
      });
    } catch (error) {
      if (!closed) {
        status.hidden = false;
        status.textContent = error?.message || 'Unable to open document.';
        host.innerHTML = `<div class="file-reading-state error">${workspace.esc(status.textContent)}</div>`;
      }
    }

    return root;
  }

  window.DafatiiOffice = Object.freeze({ open, types:TYPES });
})();
