"use strict";
/* Notify users of administrator-published updates without interrupting analysis. */
(() => {
  const api=()=>window.LakeWatchAPI;
  let initial=null;
  async function check(){
    try {
      const revision=await api().request('/api/revision');
      const value=`${revision.count}|${revision.latestUpdate||''}`;
      if(initial===null) initial=value;
      else if(value!==initial){
        const banner=document.getElementById('api-status-bar');
        banner.textContent='New approved measurements are available. ';
        const btn=document.createElement('button');
        btn.textContent='Reload latest data';
        btn.type='button';btn.className='api-refresh-button';
        btn.addEventListener('click',()=>window.location.reload());
        banner.append(btn);banner.dataset.state='online';
        initial=value;
      }
    } catch (_) { /* Main app shows its own offline/online status. */ }
  }
  window.addEventListener('load',()=>{check();setInterval(check,60000);});
})();
