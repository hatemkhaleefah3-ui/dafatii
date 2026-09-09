(() => {
  const subjectGridSelector = '.academic-toggle-grid';
  const lectureListSelector = '.lecture-multiselect';

  function enhanceSubjectGrid(grid) {
    if (!grid || grid.dataset.dropdownEnhanced === '1') return;

    const buttons = [...grid.querySelectorAll('.academic-toggle[data-subject-id]')];
    if (!buttons.length) return;

    const select = document.createElement('select');
    select.className = 'academic-subject-select';
    select.setAttribute('aria-label', 'Subject');

    buttons.forEach((button) => {
      const option = document.createElement('option');
      option.value = button.dataset.subjectId;
      option.textContent = button.textContent.trim();
      option.selected = button.classList.contains('active');
      select.appendChild(option);
    });

    if (!select.value && buttons[0]) select.value = buttons[0].dataset.subjectId;

    select.addEventListener('change', () => {
      const target = buttons.find((button) => button.dataset.subjectId === select.value);
      target?.click();
    });

    grid.dataset.dropdownEnhanced = '1';
    grid.classList.add('academic-dropdown-source');
    grid.before(select);
  }

  function updateLectureSummary(details) {
    const list = details.querySelector(lectureListSelector);
    const label = details.querySelector('.academic-multiselect-label');
    if (!list || !label) return;

    const checks = [...list.querySelectorAll('input[type="checkbox"]')];
    const selected = checks.filter((input) => input.checked);

    if (!checks.length) {
      label.textContent = 'No lectures available';
      return;
    }

    if (!selected.length) {
      label.textContent = 'Select lectures';
      return;
    }

    if (selected.length === 1) {
      const row = selected[0].closest('.lecture-check');
      const lectureName = row?.querySelector('strong')?.textContent?.trim();
      label.textContent = lectureName || '1 lecture selected';
      return;
    }

    label.textContent = `${selected.length} lectures selected`;
  }

  function enhanceLectureList(list) {
    if (!list) return;

    if (list.dataset.dropdownEnhanced === '1') {
      const details = list.closest('.academic-multiselect-dropdown');
      if (details) updateLectureSummary(details);
      return;
    }

    const details = document.createElement('details');
    details.className = 'academic-multiselect-dropdown';

    const summary = document.createElement('summary');
    const label = document.createElement('span');
    label.className = 'academic-multiselect-label';
    summary.appendChild(label);

    list.before(details);
    details.append(summary, list);
    list.dataset.dropdownEnhanced = '1';

    list.addEventListener('change', () => updateLectureSummary(details));
    updateLectureSummary(details);
  }

  function enhanceAll(root = document) {
    root.querySelectorAll(subjectGridSelector).forEach(enhanceSubjectGrid);
    root.querySelectorAll(lectureListSelector).forEach(enhanceLectureList);
  }

  document.addEventListener('click', (event) => {
    document.querySelectorAll('.academic-multiselect-dropdown[open]').forEach((details) => {
      if (!details.contains(event.target)) details.removeAttribute('open');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('.academic-multiselect-dropdown[open]').forEach((details) => details.removeAttribute('open'));
  });

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches(subjectGridSelector)) enhanceSubjectGrid(node);
        if (node.matches(lectureListSelector)) enhanceLectureList(node);
        enhanceAll(node);
      });

      if (mutation.target instanceof Element && mutation.target.matches(lectureListSelector)) {
        enhanceLectureList(mutation.target);
      }
    });
  });

  const start = () => {
    enhanceAll();
    observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
