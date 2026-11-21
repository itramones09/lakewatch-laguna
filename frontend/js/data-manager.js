'use strict';
/* Manage Data: the browser validates imports for preview; the backend revalidates
 * every write and owns the shared PostgreSQL data and administrator authorization.
 */
window.LakeWatchData = (() => {
  const $ = id => document.getElementById(id);
  const esc = text => String(text??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  const norm = s => String(s??'').toLowerCase().replace(/[^a-z0-9]+/g,'');
  const keyOf = r => `${r.stationId}|${r.period}|${r.parameter}`;
  const validURL = u => {try {const x = new URL(u);return ['https:','http:'].includes(x.protocol) && !!x.hostname;}catch{return false;}};
  const validValue = value => /^(?:<\s*)?(?:\d+(?:\.\d+)?|\.\d+)$/.test(String(value).trim()) && Number(String(value).replace('<','').trim())<=100000;
  const validPeriod = value => /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && value>='1970-01' && value <= new Date().toISOString().slice(0,7);
  const aliases = {
    stationId:['stationid','station','stationnumber','stationno'],period:['month','period','samplemonth','samplingmonth','date','samplingdate'],
    parameter:['parameter','parameterid','parametername','waterqualityparameter'],value:['reportedvalue','value','reading','measurement','reportedreading'],
    sourceUrl:['officialsourceurl','sourceurl','source','url','referenceurl'],unit:['unit','units'],title:['sourcetitle','reporttitle']
  };
  function csvParse(text){
    const rows=[];let row=[],field='',quoted=false;
    text=String(text).replace(/^\uFEFF/,'');
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(quoted){if(c==='"' && text[i+1]==='"'){field+='"';i++;}else if(c==='"')quoted=false;else field+=c;}
      else if(c==='"'){if(field.trim())throw Error('Malformed CSV quoting');quoted=true;}
      else if(c===','){row.push(field);field='';}
      else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);field='';if(row.some(v=>v.trim()))rows.push(row);row=[];}
      else field+=c;
    }
    if(quoted)throw Error('Unclosed quoted field in CSV');
    row.push(field);if(row.some(v=>v.trim()))rows.push(row);
    if(rows.length<2)throw Error('CSV needs a header and at least one record.');
    const heads=rows[0].map(norm);
    return rows.slice(1).map(cells=>{const r={};for(const [key,names] of Object.entries(aliases)){
      const ix=heads.findIndex(h=>names.includes(h));if(ix>=0)r[key]=cells[ix]??'';
    }return r;});
  }
  function decodeJSON(text){
    const data=JSON.parse(text);
    const rows=Array.isArray(data)?data:[data?.readings,data?.records,data?.data].find(Array.isArray);
    if(!rows)throw Error('JSON needs an array or a readings/records/data array.');
    return rows;
  }
  function download(name, text, type){
    const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');
    a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function create({dataset}){
    const api=window.LakeWatchAPI;
    let prepared=[], loggedIn=false, initialized=false, sessionEmail='';
    const params=dataset.parameters, stationIds=new Set(dataset.stations.map(s=>s.id));
    const previous = () => {
      const m=new Map();for(const s of dataset.stations)for(const sample of s.samples)for(const p of params){
        const v=sample.values[p.id];if(v!==undefined && v!==null && v!=='')m.set(`${s.id}|${sample.period}|${p.id}`,String(v));
      }return m;
    };
    const method=()=>document.querySelector('input[name="manager-method"]:checked')?.value||'manual';
    const say=(message, level='info')=>{ $('manager-message').textContent=message;$('manager-message').dataset.level=level;};
    const authMessage=(message)=>{ $('manager-auth-message').textContent=message; };
    function paramId(value){const v=norm(value), map={dissolvedoxygen:'do',biochemicaloxygendemand:'bod',phlevel:'ph',nitraten:'nitrate',inorganicphosphate:'phosphate',totalsuspendedsolids:'tss'};
      return params.find(p=>[norm(p.id),norm(p.short),norm(p.name)].includes(v))?.id||map[v]||'';}
    function stationId(value){const s=String(value??'').toUpperCase().trim().replace(/^(STN\.?|STATION)\s*/,'').trim();return stationIds.has(s)?s:'';}
    function normalizeRecord(raw, sourceMethod){
      const obj={};for(const [key,names] of Object.entries(aliases)){
        const original=Object.keys(raw).find(k=>names.includes(norm(k)));
        obj[key]=raw[original??key]??raw[key]??'';
      }
      const r={
        stationId:stationId(obj.stationId),period:String(obj.period??'').slice(0,7),parameter:paramId(obj.parameter),
        value:String(obj.value??'').trim().replace(/^<\s+/,'<'),
        sourceUrl:String(obj.sourceUrl || $('manager-source').value || (sourceMethod==='url'?$('manager-url').value:'')).trim(),
        title:String(obj.title || $('manager-source-title').value || '').trim(),method:sourceMethod
      };
      const unit=String(obj.unit??'').trim();let error='';
      if(!r.stationId)error='Unknown station ID';
      else if(!validPeriod(r.period))error='Invalid or future sampling month';
      else if(!r.parameter)error='Unknown parameter';
      else if(!validValue(r.value))error='Invalid reading';
      else if(r.parameter==='ph' && Number(r.value.replace('<',''))>14)error='pH must be ≤14';
      else if(!validURL(r.sourceUrl))error='Source URL required';
      else if(r.title.length>160)error='Source title too long';
      else if(unit && norm(unit)!==norm(params.find(p=>p.id===r.parameter).unit) && !(r.parameter==='ph'&&['none','ph','unitless'].includes(norm(unit))))error='Unit mismatch';
      return {...r,error};
    }
    function renderPreview(){
      let ready=0,conflict=0,duplicate=0,invalid=0;
      for(const r of prepared){if(r.error)invalid++;else if(r.status==='ready')ready++;else if(r.status==='conflict')conflict++;else duplicate++;}
      $('manager-preview-count').textContent=`${prepared.length} rows`;
      $('manager-preview-summary').textContent=`${ready} new · ${conflict} corrections · ${duplicate} unchanged · ${invalid} invalid. All updates are revalidated on the server.`;
      $('manager-preview-body').innerHTML=prepared.length ? prepared.slice(0,30).map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.stationId||'—')}</td><td>${esc(r.period||'—')}</td><td>${esc(r.parameter||'—')}</td><td>${esc(r.value||'—')}</td><td><span class="manager-tag manager-tag--${r.error?'error':r.status}">${esc(r.error||{ready:'New',conflict:'Correction',duplicate:'Unchanged'}[r.status])}</span></td></tr>`).join('') : '<tr><td colspan="6" class="table-empty">Choose an import method and preview.</td></tr>';
      $('manager-save').disabled=(!loggedIn || !(ready+conflict) || invalid>0);
    }
    function preview(rows,sourceMethod){
      if(!rows.length || rows.length>500)throw Error('An import must contain 1–500 rows.');
      const old=previous(),seen=new Set();
      prepared=rows.map(raw=>{
        const r=normalizeRecord(raw,sourceMethod),key=keyOf(r);
        if(r.error){r.status='error';return r;}
        if(seen.has(key)){r.error='Repeated station/month/parameter in file';r.status='error';return r;}
        seen.add(key);const prev=old.get(key);r.status=prev===undefined?'ready':prev===r.value?'duplicate':'conflict';return r;
      });
      renderPreview();say(`Preview prepared: ${prepared.length} readings. Review and save to the shared database.`,'success');
    }
    async function readFile(){
      const file=$('manager-upload').files?.[0];if(!file)throw Error('Select a CSV, Excel or JSON file.');
      if(file.size>2*1024*1024)throw Error('Maximum file size is 2 MB.');
      const ext=file.name.split('.').pop().toLowerCase();
      if(ext==='csv')return csvParse(await file.text());
      if(ext==='json')return decodeJSON(await file.text());
      if(['xlsx','xls'].includes(ext)){
        if(!window.XLSX)throw Error('Excel reader unavailable. Check your internet or export the workbook as CSV.');
        const workbook=XLSX.read(await file.arrayBuffer(),{type:'array'});
        if(!workbook.SheetNames.length)throw Error('Excel workbook has no worksheet.');
        return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]],{defval:'',raw:false});
      }
      throw Error('Accepted file types: CSV, XLSX, XLS and JSON.');
    }
    async function readURL(){
      const url=$('manager-url').value.trim();if(!validURL(url))throw Error('Provide a direct HTTP(S) CSV or JSON URL.');
      if(/\.pdf(?:[?#]|$)/i.test(url))throw Error('PDF reports require conversion or manual entry.');
      const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);
      try{
        const response=await fetch(url,{signal:controller.signal,credentials:'omit',headers:{Accept:'text/csv,application/json,text/plain'}});
        if(!response.ok)throw Error(`Source returned HTTP ${response.status}`);
        const raw=await response.text();if(raw.length>2*1024*1024)throw Error('Response exceeds 2 MB');
        const type=response.headers.get('content-type')||'';
        if(/text\/html|application\/pdf/i.test(type))throw Error('This URL is a web page or PDF; use direct CSV or JSON.');
        return /json/i.test(type)||/^[\s\uFEFF]*[\[{]/.test(raw)?decodeJSON(raw):csvParse(raw);
      }catch(e){if(e instanceof TypeError)throw Error('The website blocked browser fetch (CORS), or the source is unavailable.');throw e;}
      finally{clearTimeout(timeout);}
    }
    function setAuthorized(ok,email=''){
      loggedIn=ok;sessionEmail=email;
      $('manager-login-panel').hidden=ok;
      $('manager-layout').hidden=!ok;
      $('manager-session').hidden=!ok;
      $('manager-local-count').textContent=ok?'Shared database connected':'Admin sign-in required';
      $('manager-storage-info').textContent='Approved observations are stored in the Render PostgreSQL database and shared with all visitors.';
      $('manager-editor').value=email;
      if(ok){$('manager-session-label').textContent=`Signed in: ${email}`;renderAudit();}
      else {$('manager-audit').textContent='Sign in to view the audit history.';}
      renderPreview();
    }
    async function renderAudit(){
      try{
        const result=await api.audit();
        $('manager-audit').innerHTML=result.rows.length?result.rows.slice(0,30).map(r=>`<div class="manager-audit-line"><strong>${esc(r.stationId)} · ${esc(r.period)} · ${esc(r.parameter)}</strong> — ${esc(r.value)} <small>${esc(r.editor)} · ${esc(r.method)} · ${esc(r.at)}${r.previousValue!==null?' · previous '+esc(r.previousValue):''}</small></div>`).join(''):'No shared updates yet.';
      }catch(e){$('manager-audit').textContent=e.message;}
    }
    async function save(){
      const readings=prepared.filter(r=>r.status==='ready'||r.status==='conflict');
      if(!readings.length)return say('No new or corrected readings to save.','error');
      if(prepared.some(r=>r.error))return say('Correct invalid rows first.','error');
      if(readings.some(r=>r.status==='conflict')&&!$('manager-allow-replace').checked)return say('Allow corrections before replacing existing readings.','error');
      if(!confirm(`Publish ${readings.length} reading(s) to the shared database? All visitors will see these updates.`))return;
      $('manager-save').disabled=true;say('Publishing validated readings to the shared database…');
      try{
        const result=await api.saveBatch(readings.map(({stationId,period,parameter,value,sourceUrl,title,method})=>({stationId,period,parameter,value,sourceUrl,title,method})),$('manager-allow-replace').checked);
        say(`Saved ${result.saved} reading(s), ${result.unchanged} unchanged. Refreshing…`,'success');
        window.location.reload();
      }catch(e){say(e.message,'error');renderPreview();}
    }
    async function backup(){
      try{const data=await api.export();download(`LakeWatch_Shared_Updates_${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(data,null,2),'application/json');say('Shared backup downloaded.','success');}
      catch(e){say(e.message,'error');}
    }
    async function initialize(){
      if(initialized)return;initialized=true;
      $('manager-station').innerHTML=dataset.stations.map(s=>`<option value="${esc(s.id)}">${esc(s.name)} — ${esc(s.zone)}</option>`).join('');
      $('manager-parameter').innerHTML=params.map(p=>`<option value="${esc(p.id)}">${esc(p.name)} (${esc(p.unit)})</option>`).join('');
      $('manager-period').value=dataset.periods.at(-1);
      setAuthorized(false);
      $('manager-login-form').addEventListener('submit',async event=>{
        event.preventDefault();const email=$('manager-login-email').value.trim(),pass=$('manager-login-password').value;
        authMessage('Checking credentials…');
        try{const result=await api.login(email,pass);api.saveToken(result.access_token);$('manager-login-password').value='';setAuthorized(true,result.email);authMessage('');}
        catch(e){authMessage(e.message);}
      });
      $('manager-logout').addEventListener('click',()=>{api.saveToken('');setAuthorized(false);authMessage('Signed out.');});
      if(api.token()){
        try{const result=await api.me();setAuthorized(true,result.email);}
        catch(e){api.saveToken('');setAuthorized(false);authMessage('Please sign in. Previous session expired.');}
      }
      document.querySelectorAll('input[name="manager-method"]').forEach(radio=>radio.addEventListener('change',()=>{
        const m=method();$('manager-manual').hidden=m!=='manual';$('manager-file').hidden=m!=='file';$('manager-url-panel').hidden=m!=='url';
        prepared=[];renderPreview();say('Prepare readings for validation.');
      }));
      $('manager-manual-preview').addEventListener('click',()=>{
        try{preview([{stationId:$('manager-station').value,period:$('manager-period').value,parameter:$('manager-parameter').value,value:$('manager-value').value}],'manual');}catch(e){say(e.message,'error');}
      });
      $('manager-file-preview').addEventListener('click',async()=>{try{say('Reading file…');preview(await readFile(),'file');}catch(e){say(e.message,'error');}});
      $('manager-url-preview').addEventListener('click',async()=>{try{say('Fetching source…');preview(await readURL(),'url');}catch(e){say(e.message,'error');}});
      $('manager-template').addEventListener('click',()=>download('LakeWatch_Import_Template.csv','"Station ID","Month","Parameter","Reported value","Unit","Official source URL"\r\n"I","2026-07","do","7.4","mg/L","https://example.org/report"','text/csv'));
      $('manager-save').addEventListener('click',save);
      $('manager-backup').addEventListener('click',backup);
      $('manager-reset').addEventListener('click',()=>window.location.reload());
      $('manager-allow-replace').addEventListener('change',renderPreview);
      renderPreview();
    }
    return {initialize};
  }
  return {create,csvParse,decodeJSON,validValue,validPeriod};
})();
