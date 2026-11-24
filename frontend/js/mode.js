'use strict';
(() => {
  const root=document.documentElement;
  const lite=new Set(['overview','map','stations','analytics','about']);
  const isFull=()=>root.dataset.appMode==='full';
  const allowsLite=name=>lite.has(name);
  const allows=name=>isFull()||allowsLite(name);
  const dialog=document.getElementById('mode-dialog'), pin=document.getElementById('mode-pin');
  const manual=document.getElementById('user-manual-window'), error=document.getElementById('mode-error');
  function update(){
    const full=isFull();
    document.querySelector('[data-nav-group="analysis"] .nav-group-name').textContent=full?'Analysis & Reports':'Analysis';
  }
  function setMode(full){
    root.dataset.appMode=full?'full':'lite';
    try{sessionStorage.setItem('lakewatch-app-mode',root.dataset.appMode);}catch(_){}
    if(!full){for(const id of ['manager-auth-dialog','lake-photo-dialog']){const d=document.getElementById(id);if(d?.open)d.close();}}
    update();window.dispatchEvent(new Event('lakewatch-mode-change'));
  }
  window.LakeWatchMode={isFull,allows,allowsLite};
  document.addEventListener('keydown',e=>{
    if(!e.ctrlKey || e.altKey || e.shiftKey || e.metaKey || (e.key!=='0' && e.code!=='Digit0' && e.code!=='Numpad0'))return;
    if(manual.hidden || !manual.contains(document.activeElement) || document.querySelector('dialog[open]'))return;
    e.preventDefault(); e.stopPropagation();
    if(e.repeat)return;
    if(isFull()){setMode(false);manual.focus({preventScroll:true});return;}
    pin.value='';error.textContent='';dialog.showModal();pin.focus();
  },true);
  document.getElementById('mode-cancel').addEventListener('click',()=>dialog.close());
  document.getElementById('mode-form').addEventListener('submit',e=>{
    e.preventDefault();
    if(pin.value!=='1983'){error.textContent='Incorrect PIN. Please try again.';pin.select();return;}
    pin.value='';dialog.close();setMode(true);
  });
  dialog.addEventListener('close',()=>{pin.value='';error.textContent='';if(!manual.hidden)manual.focus({preventScroll:true});});
  update();
})();
