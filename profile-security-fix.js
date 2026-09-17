(() => {
  'use strict';

  const INITIAL_PIN_KEY = 'dafatii:studentInitialPin:v1';
  let scheduled = false;
  let hideTimer = null;

  const copy = {
    en: {
      reveal:'Reveal PIN', hide:'Hide PIN', title:'Reveal student PIN', body:'Enter your account password to view the PIN.', password:'Password', confirm:'Show PIN', cancel:'Cancel', checking:'Checking password…', incorrect:'Password is incorrect.', rotated:'A new PIN was created because the previous PIN was stored only as a one-way hash. Save this PIN securely.', error:'PIN could not be revealed.'
    },
    ar: {
      reveal:'إظهار PIN', hide:'إخفاء PIN', title:'إظهار رمز PIN للطالب', body:'أدخل كلمة مرور الحساب لعرض رمز PIN.', password:'كلمة المرور', confirm:'إظهار PIN', cancel:'إلغاء', checking:'جارٍ التحقق من كلمة المرور…', incorrect:'كلمة المرور غير صحيحة.', rotated:'تم إنشاء PIN جديد لأن الرمز السابق كان محفوظاً كتجزئة أحادية الاتجاه فقط. احفظ هذا الرمز بأمان.', error:'تعذر إظهار PIN.'
    }
  };

  const lang = () => document.documentElement.lang === 'ar' ? 'ar' : 'en';
  const t = key => copy[lang()][key] || copy.en[key] || key;
  const route = () => location.hash.replace(/^#\/?/, '').split('/')[0];

  function pinElement(root) {
    const blocks = root.querySelectorAll('.student-card-back .student-secret-block');
    return blocks.length > 1 ? blocks[1].querySelector('strong') : null;
  }

  function maskPin(root) {
    const pin = pinElement(root);
    const card = root.querySelector('[data-student-card]');
    const button = root.querySelector('[data-secure-pin-reveal]');
    if (pin) pin.textContent = '••••';
    card?.classList.remove('student-pin-visible');
    card?.classList.add('student-pin-guarded');
    if (button) button.textContent = t('reveal');
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    try { dialog.close(); } catch {}
    dialog.remove();
  }

  function passwordDialog(root) {
    return new Promise(resolve => {
      const dialog = document.createElement('dialog');
      dialog.className = 'student-pin-dialog';
      dialog.innerHTML = `<form method="dialog" class="student-pin-dialog-card"><h2>${t('title')}</h2><p>${t('body')}</p><label>${t('password')}<input type="password" name="password" autocomplete="current-password" maxlength="256" required></label><div class="student-pin-dialog-error" role="status"></div><div class="student-pin-dialog-actions"><button type="button" class="btn btn-ghost" data-pin-cancel>${t('cancel')}</button><button type="submit" class="btn btn-primary">${t('confirm')}</button></div></form>`;
      document.body.appendChild(dialog);
      const form = dialog.querySelector('form');
      const input = form.elements.password;
      const error = dialog.querySelector('.student-pin-dialog-error');
      dialog.querySelector('[data-pin-cancel]').onclick = () => { closeDialog(dialog); resolve(null); };
      dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); resolve(null); }, { once:true });
      form.onsubmit = async event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const submit = form.querySelector('[type=submit]');
        submit.disabled = true;
        error.textContent = t('checking');
        try {
          const result = await window.DafatiiApi.request('/auth/reveal-pin', { method:'POST', body:{ password:input.value } });
          closeDialog(dialog);
          resolve(result);
        } catch (requestError) {
          submit.disabled = false;
          input.select();
          error.textContent = requestError?.code === 'INVALID_PASSWORD' ? t('incorrect') : (requestError?.message || t('error'));
        }
      };
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
      setTimeout(() => input.focus(), 30);
    });
  }

  async function revealPin(root) {
    const card = root.querySelector('[data-student-card]');
    const button = root.querySelector('[data-secure-pin-reveal]');
    if (card?.classList.contains('student-pin-visible')) { maskPin(root); return; }
    const result = await passwordDialog(root);
    if (!result?.pin) return;
    const pin = pinElement(root);
    if (!pin) return;
    pin.textContent = result.pin;
    card?.classList.add('student-pin-guarded', 'student-pin-visible');
    if (button) button.textContent = t('hide');
    const status = root.querySelector('[data-secure-pin-status]');
    if (status) status.textContent = result.rotated ? t('rotated') : '';
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => maskPin(root), 30000);
  }

  function enhanceProfile() {
    if (route() !== 'profile') return;
    const root = document.querySelector('[data-student-profile-v2]');
    if (!root || root.dataset.pinSecurityReady === 'true') return;
    root.dataset.pinSecurityReady = 'true';
    sessionStorage.removeItem(INITIAL_PIN_KEY);
    root.querySelector('.student-credential-once')?.remove();
    maskPin(root);

    const idButton = root.querySelector('[data-reveal-student-id]');
    const host = idButton?.parentElement || root.querySelector('.student-card-panel');
    if (!host) return;
    let actions = host.querySelector('.student-secret-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'student-secret-actions';
      if (idButton) actions.appendChild(idButton);
      host.appendChild(actions);
    }
    const reveal = document.createElement('button');
    reveal.type = 'button';
    reveal.className = 'student-reveal-pin';
    reveal.dataset.securePinReveal = '';
    reveal.textContent = t('reveal');
    reveal.onclick = event => { event.stopPropagation(); void revealPin(root); };
    actions.appendChild(reveal);

    const status = document.createElement('p');
    status.className = 'student-pin-status';
    status.dataset.securePinStatus = '';
    actions.insertAdjacentElement('afterend', status);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; enhanceProfile(); });
  }

  new MutationObserver(schedule).observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener('hashchange', () => { clearTimeout(hideTimer); hideTimer = null; schedule(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { const root = document.querySelector('[data-student-profile-v2]'); if (root) maskPin(root); } });
  schedule();
})();
