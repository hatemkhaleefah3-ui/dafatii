(() => {
  'use strict';
  if (!window.DafitiiDafat || !window.DafitiiApi) return;

  window.DafitiiDafat.createDafaa = async input => {
    const result = await window.DafitiiApi.request('/dafat/create-v2', { method: 'POST', body: input });
    await window.DafitiiDafat.refresh();
    if (result?.dafaa?.id && window.DafitiiDafat.active().id !== result.dafaa.id) {
      await window.DafitiiDafat.switchDafaa(result.dafaa.id);
    }
    return result.dafaa;
  };
})();
