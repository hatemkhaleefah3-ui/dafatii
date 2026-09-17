(() => {
  'use strict';

  const workspace = window.DafatiiViewerWorkspace;
  if (!workspace?.mountDock) return;

  const rootsByFileId = new Map();
  const sessions = new WeakMap();
  const ZOOM_STEP = 1.18;
  const MAX_PINCH_STEPS = 3;

  const isArabic = () => (document.documentElement.lang || '').toLowerCase().startsWith('ar');
  const copy = () => isArabic()
    ? { title:'جارٍ تجهيز الملف', waiting:'يرجى الانتظار حتى يصبح الملف جاهزاً بالكامل.', pinch:'استخدم إصبعين للتكبير والتصغير.' }
    : { title:'Preparing file', waiting:'Please wait until the file is completely ready.', pinch:'Use two fingers to zoom in and out.' };

  function fileKey(value) {
    return value == null ? '' : String(value);
  }

  function loadingMessage(root) {
    return root.querySelector('[data-office-status], [data-pdf-status]')?.textContent?.trim() || copy().waiting;
  }

  function setLoadingMessage(root, message) {
    const session = sessions.get(root);
    if (!session?.message) return;
    session.message.textContent = String(message || copy().waiting);
  }

  function markError(root, message) {
    const session = sessions.get(root);
    if (!session) return;
    root.classList.remove('reader-ready');
    root.classList.add('reader-loading', 'reader-load-error');
    root.setAttribute('aria-busy', 'false');
    session.screen.setAttribute('role', 'alert');
    setLoadingMessage(root, message || loadingMessage(root));
  }

  function reveal(root) {
    const session = sessions.get(root);
    if (!session || session.ready || !root.isConnected) return;
    const status = root.querySelector('[data-office-status], [data-pdf-status]');
    const text = status?.textContent || '';
    if (/unable|failed|error|تعذر|خطأ/i.test(text) || root.querySelector('.file-reading-state.error')) {
      markError(root, text);
      return;
    }
    session.ready = true;
    root.classList.remove('reader-loading', 'reader-load-error');
    root.classList.add('reader-ready');
    root.setAttribute('aria-busy', 'false');
    session.screen.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      if (session.ready && session.screen.isConnected) session.screen.hidden = true;
    }, 220);
  }

  function installLoadingScreen(root) {
    if (sessions.has(root)) return sessions.get(root);
    const text = copy();
    const screen = document.createElement('div');
    screen.className = 'viewer-loading-screen';
    screen.setAttribute('data-viewer-loading-screen', '');
    screen.setAttribute('role', 'status');
    screen.setAttribute('aria-live', 'polite');
    screen.innerHTML = `
      <div class="viewer-loading-card">
        <span class="viewer-loading-spinner" aria-hidden="true"></span>
        <strong>${workspace.esc(text.title)}</strong>
        <span data-viewer-loading-message>${workspace.esc(loadingMessage(root))}</span>
        <small>${workspace.esc(text.pinch)}</small>
      </div>`;
    root.querySelector('.immersive-viewer-shell')?.append(screen);
    root.classList.add('reader-loading');
    root.setAttribute('aria-busy', 'true');
    const session = { screen, message:screen.querySelector('[data-viewer-loading-message]'), ready:false, statusObserver:null, errorObserver:null };
    sessions.set(root, session);

    const status = root.querySelector('[data-office-status], [data-pdf-status]');
    if (status) {
      const sync = () => {
        const message = status.textContent?.trim();
        if (message) setLoadingMessage(root, message);
        if (root.classList.contains('office-workspace') && status.hidden && !root.querySelector('.file-reading-state.error')) reveal(root);
      };
      session.statusObserver = new MutationObserver(sync);
      session.statusObserver.observe(status, { attributes:true, childList:true, characterData:true, subtree:true });
      sync();
    }

    const stage = root.querySelector('[data-office-stage], [data-pdf-stage]');
    if (stage) {
      session.errorObserver = new MutationObserver(() => {
        const error = stage.querySelector('.file-reading-state.error');
        if (error) markError(root, error.textContent?.trim());
      });
      session.errorObserver.observe(stage, { childList:true, subtree:true });
    }
    return session;
  }

  function distance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  function midpoint(touches, target) {
    const rect = target.getBoundingClientRect();
    return {
      x: ((touches[0].clientX + touches[1].clientX) / 2) - rect.left,
      y: ((touches[0].clientY + touches[1].clientY) / 2) - rect.top
    };
  }

  function bindPinchZoom(root, controls = {}) {
    if (!controls.zoomIn || !controls.zoomOut) return;
    const stage = root.querySelector('[data-pdf-stage], [data-office-stage]');
    const target = root.querySelector('[data-pdf-track], [data-office-native-host], .office-page-track');
    if (!stage || !target || stage.dataset.pinchZoomBound === '1') return;
    stage.dataset.pinchZoomBound = '1';

    let gesture = null;
    const clearPreview = () => {
      target.style.transform = '';
      target.style.transformOrigin = '';
      target.style.willChange = '';
      root.classList.remove('reader-pinching');
    };

    stage.addEventListener('touchstart', event => {
      if (event.touches.length !== 2 || !root.classList.contains('reader-ready')) return;
      const startDistance = distance(event.touches);
      if (!startDistance) return;
      const point = midpoint(event.touches, target);
      gesture = { startDistance, ratio:1 };
      target.style.transformOrigin = `${point.x}px ${point.y}px`;
      target.style.willChange = 'transform';
      root.classList.add('reader-pinching');
      event.preventDefault();
    }, { passive:false });

    stage.addEventListener('touchmove', event => {
      if (!gesture || event.touches.length !== 2) return;
      const ratio = distance(event.touches) / gesture.startDistance;
      gesture.ratio = Math.max(.68, Math.min(1.48, ratio));
      target.style.transform = `scale(${gesture.ratio})`;
      event.preventDefault();
    }, { passive:false });

    const finish = event => {
      if (!gesture || (event.touches && event.touches.length >= 2)) return;
      const ratio = gesture.ratio;
      gesture = null;
      clearPreview();
      if (Math.abs(ratio - 1) < .07) return;
      const rawSteps = Math.max(1, Math.round(Math.abs(Math.log(ratio) / Math.log(ZOOM_STEP))));
      const steps = Math.min(MAX_PINCH_STEPS, rawSteps);
      const action = ratio > 1 ? controls.zoomIn : controls.zoomOut;
      for (let index = 0; index < steps; index += 1) setTimeout(() => action?.(), index * 36);
    };

    stage.addEventListener('touchend', finish, { passive:false });
    stage.addEventListener('touchcancel', finish, { passive:false });
  }

  const originalMountDock = workspace.mountDock.bind(workspace);
  const wrappedWorkspace = Object.freeze({
    ...workspace,
    mountDock(root, context, controls = {}) {
      if (root?.classList?.contains('file-workspace')) {
        installLoadingScreen(root);
        if (context?.fileId != null) rootsByFileId.set(fileKey(context.fileId), root);
        bindPinchZoom(root, controls);
      }
      return originalMountDock(root, context, controls);
    }
  });
  window.DafatiiViewerWorkspace = wrappedWorkspace;

  if (window.DafatiiPdf?.open) {
    const originalPdf = window.DafatiiPdf;
    const originalOpen = originalPdf.open.bind(originalPdf);
    window.DafatiiPdf = Object.freeze({
      ...originalPdf,
      async open(fileId, ...args) {
        const result = await originalOpen(fileId, ...args);
        const root = rootsByFileId.get(fileKey(fileId));
        if (root) reveal(root);
        return result;
      }
    });
  }

  window.DafatiiFileReaderInteractions = Object.freeze({ reveal, markError });
})();
