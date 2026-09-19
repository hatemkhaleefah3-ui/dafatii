(() => {
  'use strict';

  const DOC = 'application/msword';
  const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const PPT = 'application/vnd.ms-powerpoint';
  const PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  const TYPES = Object.freeze([DOC, DOCX, PPT, PPTX]);
  const RUNTIME_VERSION = '3.1.1';
  const RUNTIME_PATH = `@file-viewer/web-full@${RUNTIME_VERSION}/dist/`;
  const RUNTIME_CDNS = Object.freeze([
    Object.freeze({ name:'unpkg', base:`https://unpkg.com/${RUNTIME_PATH}` }),
    Object.freeze({ name:'jsdelivr', base:`https://cdn.jsdelivr.net/npm/${RUNTIME_PATH}` })
  ]);
  const RUNTIME_ID = 'dafatii-native-office-runtime';
  const RUNTIME_LOAD_TIMEOUT_MS = 12000;
  const CACHE_TTL_MS = 5 * 60 * 1000;
  const CACHE_MAX_FILE_BYTES = 16 * 1024 * 1024;
  const CACHE_MAX_TOTAL_BYTES = 24 * 1024 * 1024;
  let runtimePromise = null;
  let activeRuntimeBase = RUNTIME_CDNS[0].base;
  const originalFileCache = new Map();

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

  function setStatus(status, message) {
    status.hidden = false;
    status.textContent = message;
  }

  function currentRuntime() {
    return window.FlyfishFileViewerWebFull;
  }

  function loadRuntimeCandidate(candidate, attempt) {
    return new Promise((resolve, reject) => {
      const existingRuntime = currentRuntime();
      if (existingRuntime?.mountViewer) {
        activeRuntimeBase = candidate.base;
        resolve({ runtime:existingRuntime, base:candidate.base });
        return;
      }

      const scriptId = `${RUNTIME_ID}-${attempt}`;
      const stale = document.getElementById(scriptId);
      stale?.remove();

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `${candidate.base}flyfish-file-viewer-web-full.iife.js`;
      script.async = true;
      script.crossOrigin = 'anonymous';

      let settled = false;
      const timer = setTimeout(() => finish(new Error(`${candidate.name} Office runtime timed out.`)), RUNTIME_LOAD_TIMEOUT_MS);
      const finish = error => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        script.removeEventListener('load', onLoad);
        script.removeEventListener('error', onError);
        if (error) {
          script.remove();
          reject(error);
          return;
        }
        const runtime = currentRuntime();
        if (!runtime?.mountViewer) {
          script.remove();
          reject(new Error(`${candidate.name} Office runtime loaded without its browser API.`));
          return;
        }
        activeRuntimeBase = candidate.base;
        resolve({ runtime, base:candidate.base });
      };
      const onLoad = () => finish();
      const onError = () => finish(new Error(`${candidate.name} Office runtime failed to load.`));
      script.addEventListener('load', onLoad, { once:true });
      script.addEventListener('error', onError, { once:true });
      document.head.append(script);
    });
  }

  function loadRuntime() {
    const existingRuntime = currentRuntime();
    if (existingRuntime?.mountViewer) return Promise.resolve({ runtime:existingRuntime, base:activeRuntimeBase });
    if (runtimePromise) return runtimePromise;

    runtimePromise = (async () => {
      let lastError = null;
      for (let index = 0; index < RUNTIME_CDNS.length; index += 1) {
        const candidate = RUNTIME_CDNS[index];
        try {
          return await loadRuntimeCandidate(candidate, index);
        } catch (error) {
          lastError = error;
        }
      }
      throw new Error(`Unable to load the native Office reader runtime${lastError?.message ? `: ${lastError.message}` : '.'}`);
    })().catch(error => {
      runtimePromise = null;
      throw error;
    });

    return runtimePromise;
  }

  function ensureResourceHint(rel, href, as, type) {
    if (document.head.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (as) link.as = as;
    if (type) link.type = type;
    link.crossOrigin = 'anonymous';
    document.head.append(link);
  }

  function warmFormatAssets(type, runtimeBase = RUNTIME_CDNS[0].base) {
    if (type === PPT) {
      const base = `${runtimeBase}vendor/ppt/`;
      ensureResourceHint('modulepreload', `${base}index.mjs`);
      ensureResourceHint('modulepreload', `${base}worker.mjs`);
      ensureResourceHint('preload', `${base}ppt-native.wasm`, 'fetch', 'application/wasm');
      ensureResourceHint('preload', `${base}ppt-font-cjk.otf`, 'font', 'font/otf');
    } else if (type === PPTX) {
      ensureResourceHint('modulepreload', `${runtimeBase}vendor/pptx/pptx.worker.js`);
    } else if (type === DOCX) {
      ensureResourceHint('modulepreload', `${runtimeBase}vendor/docx/docx.worker.js`);
      ensureResourceHint('preload', `${runtimeBase}vendor/docx/jszip.min.js`, 'script', 'text/javascript');
    }
  }

  function nativeFormatOptions(type, runtimeBase = activeRuntimeBase) {
    if (type === PPT) {
      const base = `${runtimeBase}vendor/ppt/`;
      return {
        presentation: {
          pptModuleUrl: `${base}index.mjs`,
          pptWorkerUrl: `${base}worker.mjs`,
          pptWasmUrl: `${base}ppt-native.wasm`,
          pptFontUrl: `${base}ppt-font-cjk.otf`,
          pptWorker: 'auto'
        }
      };
    }
    if (type === PPTX) {
      return { presentation: { workerUrl:`${runtimeBase}vendor/pptx/pptx.worker.js` } };
    }
    if (type === DOCX) {
      return {
        docx: {
          workerUrl: `${runtimeBase}vendor/docx/docx.worker.js`,
          workerJsZipUrl: `${runtimeBase}vendor/docx/jszip.min.js`
        }
      };
    }
    return {};
  }

  function purgeExpiredCache(now = Date.now()) {
    for (const [key, value] of originalFileCache) {
      if (now - value.savedAt > CACHE_TTL_MS) originalFileCache.delete(key);
    }
  }

  function rememberOriginalFile(fileId, buffer, contentType) {
    if (!buffer?.byteLength || buffer.byteLength > CACHE_MAX_FILE_BYTES) return;
    purgeExpiredCache();
    originalFileCache.delete(fileId);
    originalFileCache.set(fileId, { buffer, contentType, savedAt:Date.now() });
    let total = [...originalFileCache.values()].reduce((sum, item) => sum + item.buffer.byteLength, 0);
    while (total > CACHE_MAX_TOTAL_BYTES && originalFileCache.size > 1) {
      const oldestKey = originalFileCache.keys().next().value;
      const oldest = originalFileCache.get(oldestKey);
      originalFileCache.delete(oldestKey);
      total -= oldest?.buffer?.byteLength || 0;
    }
  }

  async function readResponseBuffer(response, onProgress) {
    const total = Number(response.headers.get('content-length')) || 0;
    if (!response.body?.getReader) {
      const buffer = await response.arrayBuffer();
      onProgress?.(buffer.byteLength, total || buffer.byteLength);
      return buffer;
    }

    const reader = response.body.getReader();
    const chunks = [];
    let loaded = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value?.byteLength) continue;
      chunks.push(value);
      loaded += value.byteLength;
      onProgress?.(loaded, total);
    }
    const output = new Uint8Array(loaded);
    let offset = 0;
    for (const chunk of chunks) {
      output.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return output.buffer;
  }

  async function getOriginalFile(fileId, onProgress) {
    purgeExpiredCache();
    const cached = originalFileCache.get(fileId);
    if (cached) {
      originalFileCache.delete(fileId);
      originalFileCache.set(fileId, cached);
      onProgress?.(cached.buffer.byteLength, cached.buffer.byteLength, true);
      return cached;
    }

    const viewUrl = await window.DafatiiFiles.getViewUrl(fileId);
    const response = await fetch(viewUrl, { credentials:'include', cache:'no-store' });
    if (!response.ok) throw new Error(`Unable to read document (${response.status}).`);
    const buffer = await readResponseBuffer(response, (loaded, total) => onProgress?.(loaded, total, false));
    if (!buffer.byteLength) throw new Error('The document is empty.');
    const contentType = normalizedType(response.headers.get('content-type'));
    rememberOriginalFile(fileId, buffer, contentType);
    return { buffer, contentType };
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
      <div class="viewer-file-status" data-office-status>Starting reader…</div>
      <div class="office-workspace-stage native-office-stage" data-office-stage><div class="native-office-host" data-office-native-host></div></div>
    </section>`;
    document.body.append(root);

    const shell = root.querySelector('.immersive-viewer-shell');
    const host = root.querySelector('[data-office-native-host]');
    const status = root.querySelector('[data-office-status]');
    let controller = null;
    let closed = false;
    let slowTimer = 0;
    let zoomSteps = 0;

    const clearSlowTimer = () => {
      if (slowTimer) clearTimeout(slowTimer);
      slowTimer = 0;
    };
    const close = () => {
      if (closed) return;
      closed = true;
      clearSlowTimer();
      try { controller?.destroy?.(); } catch {}
      controller = null;
      root.remove();
    };
    root.querySelector('.immersive-close').onclick = close;
    root.addEventListener('click', event => { if (event.target === root) close(); });

    const zoomIn = () => {
      if (!controller?.zoomIn) return;
      zoomSteps = Math.min(12, zoomSteps + 1);
      return controller.zoomIn();
    };
    const zoomOut = () => {
      if (!controller?.zoomOut) return;
      zoomSteps = Math.max(-12, zoomSteps - 1);
      return controller.zoomOut();
    };
    const resetZoom = () => {
      if (!controller) return;
      if (typeof controller.resetZoom === 'function') { zoomSteps = 0; return controller.resetZoom(); }
      if (typeof controller.setZoom === 'function') { zoomSteps = 0; return controller.setZoom(1); }
      if (typeof controller.setScale === 'function') { zoomSteps = 0; return controller.setScale(1); }
      const count = Math.abs(zoomSteps);
      const action = zoomSteps > 0 ? controller.zoomOut?.bind(controller) : controller.zoomIn?.bind(controller);
      zoomSteps = 0;
      for (let index = 0; index < count; index += 1) setTimeout(() => action?.(), index * 30);
    };

    const context = { fileId, lecture:options.lecture || null, title };
    workspace.mountDock(root, context, {
      notes:true,
      close,
      getPage:() => null,
      zoomIn,
      zoomOut,
      resetZoom,
      search:async query => searchSummary(await controller?.searchDocument?.(query), query),
      download:async () => { location.assign(await window.DafatiiFiles.getViewUrl(fileId, { download:true })); },
      fullscreen:() => shell.requestFullscreen?.()
    });

    try {
      warmFormatAssets(type, RUNTIME_CDNS[0].base);
      setStatus(status, 'Loading reader and document…');

      let lastPercent = -1;
      const filePromise = getOriginalFile(fileId, (loaded, total, cached) => {
        if (closed) return;
        if (cached) {
          setStatus(status, 'Opening cached document…');
          return;
        }
        if (total > 0) {
          const percent = Math.min(100, Math.floor((loaded / total) * 100));
          if (percent !== lastPercent) {
            lastPercent = percent;
            setStatus(status, `Downloading document… ${percent}%`);
          }
        } else if (loaded > 0) {
          setStatus(status, `Downloading document… ${(loaded / 1048576).toFixed(1)} MB`);
        }
      });

      const [{ runtime, base:runtimeBase }, original] = await Promise.all([loadRuntime(), filePromise]);
      if (closed) return root;

      warmFormatAssets(type, runtimeBase);
      const { buffer, contentType } = original;
      const file = new File([buffer], title, {
        type:type || contentType || 'application/octet-stream',
        lastModified:Date.now()
      });

      setStatus(status, type === PPT ? 'Starting PowerPoint engine…' : 'Rendering document…');
      slowTimer = setTimeout(() => {
        if (!closed && !status.hidden) {
          status.textContent = type === PPT
            ? 'Rendering this legacy PowerPoint…'
            : 'Rendering document…';
        }
      }, 8000);

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
          fit:'width',
          ...nativeFormatOptions(type, runtimeBase)
        },
        onStateChange(state) {
          if (closed) return;
          if (state?.error) {
            clearSlowTimer();
            const message = state.error?.message || String(state.error);
            setStatus(status, message);
            return;
          }
          if (state?.ready) {
            clearSlowTimer();
            status.hidden = true;
          } else if (state?.loading && !status.textContent) {
            setStatus(status, 'Rendering document…');
          }
        }
      });
    } catch (error) {
      clearSlowTimer();
      if (!closed) {
        setStatus(status, error?.message || 'Unable to open document.');
        host.innerHTML = `<div class="file-reading-state error">${workspace.esc(status.textContent)}</div>`;
      }
    }

    return root;
  }

  function prewarm(type = PPT) {
    const normalized = normalizedType(type);
    warmFormatAssets(normalized, RUNTIME_CDNS[0].base);
    return loadRuntime().then(({ runtime }) => runtime).catch(() => null);
  }

  window.DafatiiOffice = Object.freeze({ open, prewarm, types:TYPES });
})();
