(() => {
  'use strict';

  const definitions = Object.freeze({
    xlsx:Object.freeze({
      global:'XLSX',
      sources:Object.freeze([
        'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
        'https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js'
      ])
    })
  });
  const pending = new Map();
  const LOAD_TIMEOUT_MS = 15000;

  function inject(source, globalName) {
    return new Promise((resolve, reject) => {
      const available = window[globalName];
      if (available) { resolve(available); return; }

      const script = document.createElement('script');
      script.src = source;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';

      let settled = false;
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
        const loaded = window[globalName];
        if (!loaded) {
          script.remove();
          reject(new Error(`${globalName} loaded without exposing its browser API.`));
          return;
        }
        resolve(loaded);
      };
      const onLoad = () => finish();
      const onError = () => finish(new Error(`Failed to load ${source}.`));
      const timer = setTimeout(() => finish(new Error(`Timed out while loading ${source}.`)), LOAD_TIMEOUT_MS);
      script.addEventListener('load', onLoad, { once:true });
      script.addEventListener('error', onError, { once:true });
      document.head.append(script);
    });
  }

  async function load(name) {
    const definition = definitions[name];
    if (!definition) throw new Error(`Unknown optional vendor: ${name}.`);
    if (window[definition.global]) return window[definition.global];
    if (pending.has(name)) return pending.get(name);

    const request = (async () => {
      let lastError;
      for (const source of definition.sources) {
        try { return await inject(source, definition.global); }
        catch (error) { lastError = error; }
      }
      throw new Error(`Unable to load ${name}. Check the network connection and try again.`, { cause:lastError });
    })().catch(error => {
      pending.delete(name);
      throw error;
    });
    pending.set(name, request);
    return request;
  }

  window.DafatiiVendors = Object.freeze({
    xlsx:() => load('xlsx')
  });
})();
