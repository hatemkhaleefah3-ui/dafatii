(() => {
  document.addEventListener('click', event => {
    const row = event.target.closest?.('.suite-dashboard [data-deadline-source]');
    if(!row) return;
    const source = row.dataset.deadlineSource;
    if(source === 'exam') setHash('calendar/Exams');
    else if(source === 'assignment') setHash('subjects/Assignments');
    else setHash('calendar/Deadlines');
  });
})();
