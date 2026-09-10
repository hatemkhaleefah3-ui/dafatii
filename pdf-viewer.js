const PDFJS_VERSION = '6.3.289';
let pdfjsPromise;
function pdfjs() {
  if (!pdfjsPromise) pdfjsPromise = import(`https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.mjs`).then(lib => { lib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.mjs`; return lib; });
  return pdfjsPromise;
}

async function openPdf(fileId, title = 'PDF') {
  const root = document.createElement('div'); root.className='dafatii-pdf-overlay';
  root.innerHTML=`<div class="dafatii-pdf-viewer"><header><strong></strong><div class="pdf-controls"><button data-prev>←</button><span data-pages>Loading…</span><button data-next>→</button><button data-out>−</button><span data-zoom>100%</span><button data-in>＋</button><button data-fit>Fit</button><button data-full>Fullscreen</button><button data-close>×</button></div></header><main><div class="pdf-status">Loading PDF…</div><canvas hidden></canvas></main></div>`;
  root.querySelector('strong').textContent=title; document.body.appendChild(root);
  const canvas=root.querySelector('canvas'),status=root.querySelector('.pdf-status'),pages=root.querySelector('[data-pages]'),zoomLabel=root.querySelector('[data-zoom]');
  let doc,page=1,scale=1,renderTask;
  async function render(){if(!doc)return;renderTask?.cancel();const p=await doc.getPage(page);const base=p.getViewport({scale:1});const host=root.querySelector('main');const fit=Math.max(.25,(host.clientWidth-32)/base.width);const viewport=p.getViewport({scale:scale*fit});const ratio=window.devicePixelRatio||1;canvas.width=Math.floor(viewport.width*ratio);canvas.height=Math.floor(viewport.height*ratio);canvas.style.width=`${viewport.width}px`;canvas.style.height=`${viewport.height}px`;canvas.hidden=false;status.hidden=true;renderTask=p.render({canvasContext:canvas.getContext('2d'),viewport,transform:ratio===1?null:[ratio,0,0,ratio,0,0]});try{await renderTask.promise;}catch(e){if(e?.name!=='RenderingCancelledException')throw e;}pages.textContent=`${page} / ${doc.numPages}`;zoomLabel.textContent=`${Math.round(scale*100)}%`;}
  root.querySelector('[data-close]').onclick=()=>root.remove();root.querySelector('[data-prev]').onclick=()=>{if(page>1){page--;render();}};root.querySelector('[data-next]').onclick=()=>{if(doc&&page<doc.numPages){page++;render();}};root.querySelector('[data-in]').onclick=()=>{scale=Math.min(3,scale+.2);render();};root.querySelector('[data-out]').onclick=()=>{scale=Math.max(.4,scale-.2);render();};root.querySelector('[data-fit]').onclick=()=>{scale=1;render();};root.querySelector('[data-full]').onclick=()=>root.querySelector('.dafatii-pdf-viewer').requestFullscreen?.();
  try{const [{url},lib]=await Promise.all([window.DafatiiFiles.getView(fileId),pdfjs()]);doc=await lib.getDocument({url}).promise;await render();}catch(error){status.hidden=false;status.textContent=`Unable to open PDF: ${error.message}`;pages.textContent='Error';}
}
window.DafatiiPdfViewer=Object.freeze({open:openPdf});
