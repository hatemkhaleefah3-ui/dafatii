(() => {
  'use strict';
  function enhance() {
    const chip = document.querySelector('.user-chip'); if (!chip) return;
    const user = window.DafatiiAuth.user;
    if (user && !chip.querySelector('.account-logout')) {
      chip.querySelector('span:last-child').textContent = user.displayName;
      const button = document.createElement('button'); button.type = 'button'; button.className = 'account-logout'; button.textContent = 'Sign out';
      button.onclick = async () => { await window.DafatiiAuth.logout(); location.hash = 'join'; };
      chip.append(button);
    }
  }
  new MutationObserver(enhance).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('dafatii:auth:changed', enhance);
})();
