(() => {
  const validGrades = exams => exams
    .filter(exam => exam.degree !== null && exam.degree !== undefined && exam.degree !== '')
    .map(exam => ({...exam, numericDegree:Number(exam.degree)}))
    .filter(exam => Number.isFinite(exam.numericDegree));

  function syncGradeMetrics(){
    const raw = (() => { try { const value=JSON.parse(localStorage.getItem('dafatii:examSchedule')||'[]'); return Array.isArray(value)?value:[]; } catch { return []; } })();
    const graded = validGrades(raw);
    const average = graded.length ? graded.reduce((sum,exam)=>sum+exam.numericDegree,0)/graded.length : null;
    document.querySelectorAll('.suite-metric').forEach(card => {
      if(card.querySelector('p')?.textContent?.trim() !== 'degree average') return;
      const strong=card.querySelector('strong'), detail=card.querySelector('small');
      if(strong) strong.textContent=average===null?'—':average.toFixed(1);
      if(detail) detail.textContent=graded.length?`${graded.length} graded exams`:'Add degrees in Subjects';
    });
    document.querySelectorAll('.suite-subject-progress button[data-suite-go]').forEach(button => {
      const match=button.dataset.suiteGo.match(/^subjects\/subject\/([^/]+)\/analysis$/);
      if(!match) return;
      const subjectId=decodeURIComponent(match[1]);
      const values=graded.filter(exam=>exam.subjectId===subjectId);
      const badge=button.querySelector('b');
      if(badge) badge.textContent=values.length?(values.reduce((sum,exam)=>sum+exam.numericDegree,0)/values.length).toFixed(1):'—';
    });
  }

  if(typeof workspace==='function'){
    const previousWorkspace=workspace;
    workspace=function(current){
      previousWorkspace(current);
      if(current.startsWith('dashboard/')) syncGradeMetrics();
    };
  }
})();
