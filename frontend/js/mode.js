'use strict';
(() => {
  const root=document.documentElement;
  const lite=new Set(['overview','map','stations','analytics','about']);
  const isFull=()=>root.dataset.appMode==='full';
  const allowsLite=name=>lite.has(name);
  const allows=name=>isFull()||allowsLite(name);
  const dialog=document.getElementById('mode-dialog'), pin=document.getElementById('mode-pin');
  const toggle=document.getElementById('mode-switch'), error=document.getElementById('mode-error');
  function update(){
    const full=isFull();
    toggle.textContent=full?'Switch to Lite Mode':'Unlock Full Mode';
    document.getElementById('mode-status').textContent=full?'Full Mode':'Lite Mode';
    document.getElementById('manual-mode-label').textContent=`Phase 11.6 · ${full?'Complete':'Lite'} guide`;
    document.querySelector('[data-nav-group="analysis"] .nav-group-name').textContent=full?'Analysis & Reports':'Analysis';
  }
  function setMode(full){
    root.dataset.appMode=full?'full':'lite';
    try{sessionStorage.setItem('lakewatch-app-mode',root.dataset.appMode);}catch(_){}
    if(!full){for(const id of ['manager-auth-dialog','lake-photo-dialog']){const d=document.getElementById(id);if(d?.open)d.close();}}
    update();window.dispatchEvent(new Event('lakewatch-mode-change'));
  }
  window.LakeWatchMode={isFull,allows,allowsLite};
  toggle.addEventListener('click',()=>{
    if(isFull()){setMode(false);return;}
    pin.value='';error.textContent='';dialog.showModal();pin.focus();
  });
  document.getElementById('mode-cancel').addEventListener('click',()=>dialog.close());
  document.getElementById('mode-form').addEventListener('submit',e=>{
    e.preventDefault();
    if(pin.value!=='1983'){error.textContent='Incorrect PIN. Please try again.';pin.select();return;}
    pin.value='';dialog.close();setMode(true);
  });
  dialog.addEventListener('close',()=>{pin.value='';error.textContent='';});
  update();
})();
