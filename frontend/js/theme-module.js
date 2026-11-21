"use strict";
/* Accessible Light / Dark / System setting. Works across all six modules. */
(() => {
  const key='lakewatch-appearance';
  const options=['light','system','dark'];
  const root=document.documentElement;
  const media=window.matchMedia?.('(prefers-color-scheme: dark)');
  const getPref=()=>options.includes(root.dataset.themePreference)?root.dataset.themePreference:'system';
  function apply(pref) {
    const choice=options.includes(pref)?pref:'system';
    const resolved=choice==='system'?(media?.matches?'dark':'light'):choice;
    root.dataset.themePreference=choice;
    root.dataset.theme=resolved;
    root.style.colorScheme=resolved;
    document.getElementById('appearance-current').textContent=choice.charAt(0).toUpperCase()+choice.slice(1);
    document.getElementById('appearance-status').textContent=`${choice.charAt(0).toUpperCase()+choice.slice(1)} selected · ${resolved} colors active`;
    document.querySelectorAll('input[name="appearance"]').forEach(input=>input.checked=input.value===choice);
    // The Analytics dashboard can refresh Chart.js axes when the theme changes.
    window.dispatchEvent(new CustomEvent('lakewatch-theme-change',{detail:{preference:choice,resolved}}));
  }
  const initialize = () => {
    apply(getPref());
    document.querySelectorAll('input[name="appearance"]').forEach(input=>input.addEventListener('change',()=>{
      try{localStorage.setItem(key,input.value);}catch(e){}
      apply(input.value);
      document.getElementById('appearance-settings').open=false;
    }));
    media?.addEventListener?.('change',()=>{if(getPref()==='system')apply('system');});
    document.addEventListener('click',e=>{
      const details=document.getElementById('appearance-settings');
      if(details.open&&!details.contains(e.target))details.open=false;
    });
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();
