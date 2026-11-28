'use strict';
/* LakeWatch Laguna Intelligence Studio. No fabricated water-quality or incident data. */
window.LakeWatchStudio = (() => {
  const byId = id => document.getElementById(id);
  const esc = v => String(v == null ? '' : v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  const urlSafe = value => {try {const u=new URL(String(value));return ['http:','https:'].includes(u.protocol) ? u.href : '';}catch{return ''}};
  const link = (url,title='Source') => urlSafe(url) ? `<a href="${esc(urlSafe(url))}" target="_blank" rel="noopener noreferrer">${esc(title)}</a>` : esc(title);
  const exact = raw => typeof raw==='number'?Number.isFinite(raw)?raw:null : (typeof raw==='string' && /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(raw.trim()) ? Number(raw.trim()) : null);
  const rawValue = (station,period,param) => station?.samples?.find(x=>x.period===period)?.values?.[param];
  const dateLabel = period => /^\d{4}-\d{2}$/.test(period) ? new Date(`${period}-01T12:00:00Z`).toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'}) : period;
  const monthNo = p => Number(p.slice(0,4))*12+Number(p.slice(5,7))-1;
  const typeName = {fish_kill:'Fish kill',algal_bloom:'Algal bloom',spill:'Reported spill',sediment:'Sediment / erosion',other:'Environmental event'};
  const kindName = {rainfall:'Rainfall',air_temperature:'Air temperature',lake_level:'Lake level',tributary_flow:'Tributary flow',water_temperature:'Lake water temperature'};
  const palette = () => window.LakeWatchPalette;
  let dataset=null,incidents=[],context=[],weather=null,selectedComparison=new Set(),annualCache=null,mapManager=null,initiated=false;
  const param = id => dataset?.parameters.find(p=>p.id===id);
  const unit = id => {const u=param(id)?.unit||'';return u==='pH units'?'':u};
  const st = id => dataset?.stations.find(x=>x.id===id);
  const readableValue = (raw,id) => raw==null||raw===''?'Not reported':`${raw}${unit(id)?' '+unit(id):''}`;
  const themeColor = id => ({do:'#2686c8',bod:'#e17d3a',ph:'#9573da',nitrate:'#0c9979',phosphate:'#cd568e',tss:'#b58a24'})[id]||'#0e9688';
  const setStatus=(id,msg,err=false)=>{const el=byId(id);if(el){el.textContent=msg;el.dataset.error=err?'true':'false'}};
  // Ambient freshwater Class C references — these are NOT drinking-water or general safety cutoffs.
  // Nitrate and phosphate require confirmation of the original chemical reporting basis.
  const denr2016='https://pab.emb.gov.ph/wp-content/uploads/2017/07/DAO-2016-08-WQG-and-GES.pdf';
  const denr2021='https://naro.law.upd.edu.ph/wp-content/uploads/2022/11/DENR-Administrative-Order-No-2021-19.pdf';
  const guideline={
    do:{reference:'At least 5 mg/L',threshold:5,test:'minimum',basis:'Dissolved oxygen (mg/L)',source:'DENR DAO 2016-08',url:denr2016,
      meaning:'DO is the dissolved oxygen available to fish and other aquatic organisms. Lower readings can mean greater oxygen stress; concentrations vary with temperature, photosynthesis and sampling time.'},
    bod:{reference:'At most 7 mg/L',threshold:7,test:'maximum',basis:'BOD (mg/L)',source:'DENR DAO 2016-08',url:denr2016,
      meaning:'BOD measures oxygen consumed by microorganisms as they break down biodegradable organic matter. Higher BOD can contribute to declining oxygen conditions.'},
    ph:{reference:'6.5–9.0 pH units',min:6.5,max:9,test:'range',basis:'pH (unitless)',source:'DENR DAO 2016-08',url:denr2016,
      meaning:'pH indicates acidity or alkalinity. Values outside the guideline range can stress aquatic organisms and change chemical toxicity or nutrient availability.'},
    nitrate:{reference:'At most 7 mg/L as NO₃–N',test:'basis-unverified',basis:'Guideline is nitrate-nitrogen (NO₃–N), not necessarily nitrate ion (NO₃)',source:'DENR DAO 2016-08',url:denr2016,
      meaning:'Nitrate is a nutrient for algae and aquatic plants. Higher concentrations can contribute to nutrient enrichment, but low nitrate alone does not prove the lake has low nutrient pollution.'},
    phosphate:{reference:'At most 0.025 mg/L as phosphorus (total/reactive)',test:'basis-unverified',basis:'Guideline is phosphate as phosphorus (P), not necessarily phosphate ion (PO₄)',source:'DENR DAO 2021-19',url:denr2021,
      meaning:'Phosphate is an important nutrient for algal growth. Excess available phosphorus can contribute to eutrophication and oxygen problems after algae decompose.'},
    tss:{reference:'At most 80 mg/L',threshold:80,test:'maximum',basis:'Total suspended solids (mg/L)',source:'DENR DAO 2016-08',url:denr2016,
      meaning:'TSS measures suspended particles such as sediments and organic matter. Higher values can reduce light penetration and affect aquatic habitats.'}
  };
  function interpret(paramId,value){
    const g=guideline[paramId];
    if(!g)return {title:'Water-quality measurement',detail:'Review the original reported value, station and sample date.',note:'No benchmark configured.',status:'Not evaluated',tone:'neutral',reference:'Not available',basis:'',source:'',sourceUrl:''};
    const base={reference:g.reference,basis:g.basis,source:g.source,sourceUrl:g.url,detail:g.meaning};
    const raw=String(value??'').trim();
    if(value==null||raw==='')return {...base,title:'No reported reading',status:'Cannot assess',tone:'neutral',note:'There is no reported measurement for this station and period. Missing means unknown, not zero.'};
    if(raw.startsWith('<')||raw.startsWith('>'))return {...base,title:'Qualified laboratory result',status:'Not directly comparable',tone:'neutral',note:`The report states ${raw}${unit(paramId)?' '+unit(paramId):''}. This is a detection/reporting bound, not an exact measured value. It cannot be treated as zero or plotted as an exact numeric point.`};
    const n=exact(value);
    if(n===null)return {...base,title:'Qualified laboratory result',status:'Not evaluated',tone:'neutral',note:'The reported measurement is not an exact numeric value; confirm the laboratory qualifier before comparison.'};
    if(g.test==='basis-unverified')return {...base,title:'Nutrient enrichment indicator',status:'Reference only — unit basis unverified',tone:'neutral',note:`Reported value: ${readableValue(value,paramId)}. The imported dataset does not confirm the chemical basis required by the DENR guideline. Do not label this result within or outside the guideline until the original laboratory units and method are verified.`};
    const meets=g.test==='minimum'?n>=g.threshold:g.test==='maximum'?n<=g.threshold:n>=g.min&&n<=g.max;
    const boundary=g.test==='range'?(n===g.min||n===g.max):(n===g.threshold);
    let note='';
    if(paramId==='do')note=meets?`The observed ${n} mg/L DO meets the 5 mg/L Class C minimum. Oxygen was available at this sampling time, but conditions can change rapidly.`:`The observed ${n} mg/L DO is below the 5 mg/L Class C minimum; low oxygen may stress fish and other aquatic life.`;
    if(paramId==='bod')note=meets?`The observed ${n} mg/L BOD is at or below the 7 mg/L Class C maximum. This suggests no exceedance for biodegradable oxygen demand at this sampling time.`:`The observed ${n} mg/L BOD exceeds the 7 mg/L Class C maximum and warrants investigation of organic loading.`;
    if(paramId==='ph')note=meets?`The observed pH of ${n} lies within the 6.5–9.0 Class C range${boundary?', at the boundary':''}. It describes acidity/alkalinity, not whether the water is drinkable.`:`The observed pH of ${n} is outside the 6.5–9.0 Class C range. This may affect aquatic organisms and chemical behavior.`;
    if(paramId==='tss')note=meets?`The observed ${n} mg/L TSS is at or below the 80 mg/L Class C maximum. Suspended particles can still vary after rain or sediment disturbance.`:`The observed ${n} mg/L TSS exceeds the 80 mg/L Class C maximum, suggesting substantial suspended-particle loading at this sampling time.`;
    return {...base,title:meets?'Within the Class C screening reference':'Outside the Class C screening reference',status:meets?'Within reference':'Outside reference',tone:meets?'within':'outside',note};
  }
  function renderInterpretation({stationId,period}){
    if(!dataset)return;
    const station=st(stationId), target=byId('station-interpretation');if(!target||!station)return;
    const selected=target.dataset.selected && param(target.dataset.selected)?target.dataset.selected:dataset.parameters[0].id;
    const p=param(selected),value=rawValue(station,period,selected),info=interpret(selected,value);
    target.innerHTML=`<div class="insight-head"><div><p class="eyebrow">What this reading means for Laguna de Bay</p><h4>Parameter Interpretation</h4></div><span class="tag">Class C freshwater · environmental screening</span></div>
      <div class="insight-tabs" role="group" aria-label="Choose a parameter">${dataset.parameters.map(x=>`<button type="button" data-interpret-param="${esc(x.id)}" class="insight-tab ${selected===x.id?'is-selected':''}" style="--accent:${themeColor(x.id)}" aria-pressed="${selected===x.id}">${esc(x.short)}</button>`).join('')}</div>
      <div class="insight-reading" style="--accent:${themeColor(selected)}"><div><span>${esc(p.name)}</span><strong>${esc(readableValue(value,selected))}</strong><small>${esc(station.name)} · ${esc(dateLabel(period))}</small></div><span aria-hidden="true">◉</span></div>
      <div class="insight-reference-grid">
        <div class="insight-reference-card"><small>Class C freshwater guideline</small><strong>${esc(info.reference)}</strong><span>${esc(info.basis)}</span></div>
        <div class="insight-reference-card"><small>Reading vs. guideline</small><strong class="insight-status insight-status--${esc(info.tone)}">${esc(info.status)}</strong><span>${esc(info.source)} — ambient water guideline</span></div>
      </div>
      <div class="insight-explanation"><h5>${esc(info.title)}</h5><p>${esc(info.detail)}</p><p class="insight-note"><strong>What this value suggests:</strong> ${esc(info.note)}</p><p class="insight-safety-note">Guidelines are screening references for Class C freshwater, <strong>not drinking-water or swimming-safety limits</strong>. Meeting one parameter guideline never proves that the lake is safe; full assessment requires other pollutants, sampling context, and verified laboratory methods.</p><small>Reference: ${link(info.sourceUrl,info.source)} · Applies only when station classification, parameter definition and units match.</small></div>`;
    target.querySelectorAll('[data-interpret-param]').forEach(b=>b.addEventListener('click',()=>{target.dataset.selected=b.dataset.interpretParam;renderInterpretation({stationId,period})}));
  }
  function populate(){
    const opts=(items, value, display) => items.map(x=>`<option value="${esc(value(x))}">${esc(display(x))}</option>`).join('');
    for(const id of ['studio-comp-param','forecast-parameter']) byId(id).innerHTML=opts(dataset.parameters.filter(p=>id!=='forecast-parameter'||p.id==='bod'||p.id==='tss'),p=>p.id,p=>p.name);
    byId('studio-comp-period').innerHTML=opts(dataset.periods,p=>p,dateLabel);
    for (const id of ['forecast-station','report-station','incident-station']) {
      const list=opts(dataset.stations,s=>s.id,s=>`${s.name} · ${s.zone}`);
      byId(id).innerHTML=(id==='incident-station'?'<option value="">Not linked to a station</option>':'')+list;
    }
    byId('report-period').innerHTML=opts(dataset.periods,p=>p,dateLabel);
    byId('report-parameter').innerHTML='<option value="all">All six parameters</option>'+opts(dataset.parameters,p=>p.id,p=>p.name);
    const latest=dataset.periods.at(-1);byId('studio-comp-period').value=latest;byId('report-period').value=latest;
    selectedComparison=new Set(dataset.stations.filter(s=>rawValue(s,latest,'do')!=null).slice(0,5).map(s=>s.id));
    renderComparisonPicker();renderComparison();runForecast(false);renderReport();
  }
  function renderComparisonPicker(){
    const root=byId('studio-comp-stations');root.innerHTML=dataset.stations.map(s=>`<label><input type="checkbox" value="${esc(s.id)}" ${selectedComparison.has(s.id)?'checked':''}><span>${esc(s.name)} <small>${esc(s.zone)}</small></span></label>`).join('');
  }
  function renderComparison(){
    const id=byId('studio-comp-param').value,period=byId('studio-comp-period').value,p=param(id);
    const chosen=dataset.stations.filter(s=>selectedComparison.has(s.id));
    const exactRows=chosen.map(s=>({station:s,raw:rawValue(s,period,id)})).map(r=>({...r,number:exact(r.raw)}));
    const valid=exactRows.filter(r=>r.number!==null), maximum=Math.max(1,...valid.map(r=>r.number));
    const root=byId('studio-comp-chart');
    if(!chosen.length){root.innerHTML='<p class="hint">Choose at least one monitoring station.</p>';} else {
      root.innerHTML=exactRows.map(r=>`<div class="compare-row"><div class="compare-row-head"><strong>${esc(r.station.name)}</strong><span>${esc(readableValue(r.raw,id))}</span></div><div class="compare-track"><div style="width:${r.number===null?0:Math.max(1,Math.round(r.number/maximum*100))}%;background:${themeColor(id)}"></div></div>${r.number===null?'<small>Not plotted: missing or non-exact reading</small>':''}</div>`).join('');
    }
    const values=valid.map(r=>r.number);const min=values.length?Math.min(...values):null,max=values.length?Math.max(...values):null;
    byId('studio-comp-summary').textContent=`${p.name} · ${dateLabel(period)} · ${valid.length}/${chosen.length} selected stations have exact values${values.length?`. Range: ${min}–${max} ${unit(id)}`:'. No numeric comparison possible'}. This is a descriptive comparison, not a pollution ranking.`;
  }
  const linearRegression=(items)=>{
    const n=items.length,mx=items.reduce((a,b)=>a+b.x,0)/n,my=items.reduce((a,b)=>a+b.y,0)/n;
    const denom=items.reduce((a,b)=>a+(b.x-mx)**2,0);if(!denom)return null;
    const slope=items.reduce((a,b)=>a+(b.x-mx)*(b.y-my),0)/denom, intercept=my-slope*mx;
    const fitted=items.map(d=>intercept+slope*d.x), sst=items.reduce((a,b)=>a+(b.y-my)**2,0);
    const r2=sst>0?1-items.reduce((a,b,i)=>a+(b.y-fitted[i])**2,0)/sst:null;
    return {slope,intercept,r2,predict:x=>Math.max(0,intercept+slope*x)};
  };
  const fmt=v=>Number.isFinite(v)?v.toFixed(2):'—';
  async function fetchAnnual(){if(annualCache)return annualCache;const r=await fetch('data/historical-annual.json');if(!r.ok)throw Error('Cannot load historical annual archive');annualCache=await r.json();return annualCache;}
  async function runForecast(showBusy=true){
    const output=byId('forecast-result'); if(showBusy) output.innerHTML='<p class="hint">Checking data completeness…</p>';
    const kind=byId('forecast-series').value,paramId=byId('forecast-parameter').value,stationId=byId('forecast-station').value;
    byId('forecast-station-wrap').hidden=kind==='annual';
    let series=[],label='',unitText=unit(paramId),lastYear=null;
    if(kind==='annual') {
      try {const archive=await fetchAnnual();series=archive.lakeAnnual.map(row=>({key:row.year,x:row.year,y:exact(row[paramId])})).filter(x=>x.y!==null); label='Lake-wide annual average (historical)';}
      catch(e){output.textContent=e.message;return;}
    }else {
      const station=st(stationId);series=(station?.samples||[]).map(s=>({key:s.period,x:monthNo(s.period),y:exact(s.values[paramId])})).filter(x=>x.y!==null);
      label=`${station?.name||'Station'} monthly observations`;
    }
    series.sort((a,b)=>a.x-b.x);
    const span=series.length>1?series.at(-1).x-series[0].x:null;
    if(series.length<6||span!==series.length-1){output.innerHTML=`<div class="model-empty"><span>Not enough consecutive observations</span><h4>Forecast withheld</h4><p>${esc(label)} has ${series.length} exact data points${span!==null?`, spanning ${span+1} potential periods`:''}. At least 6 consecutive like-for-like ${kind==='annual'?'annual':'monthly'} measurements are required; gaps and &lt; detection-limit values are excluded.</p><p>Record more dated observations through Manage Data to unlock a monthly forecast. The existing historical chart remains available for descriptive exploration.</p></div>`;return;}
    if(kind==='monthly'){
      const latest=series.at(-1).x, current=(new Date().getUTCFullYear()*12+new Date().getUTCMonth());
      if(current-latest>18){output.innerHTML='<p class="model-empty">Monthly observations are too old for a current forecast (last exact observation is over 18 months old). The model is intentionally withheld.</p>';return;}
    }
    const withIndex=series.map((d,i)=>({x:i,y:d.y}));const training=withIndex.slice(0,-2),holdout=withIndex.slice(-2);
    const testModel=linearRegression(training),model=linearRegression(withIndex);if(!model||!testModel)return;
    const mae=holdout.reduce((a,d)=>a+Math.abs(d.y-testModel.predict(d.x)),0)/holdout.length;
    const recent=series.at(-1);
    const futures=[1,2].map(delta=>{const x=withIndex.length-1+delta;let time;
      if(kind==='annual'){time=String(recent.x+delta);}else{const idx=recent.x+delta;time=`${Math.floor(idx/12)}-${String(idx%12+1).padStart(2,'0')}`;}
      return {time,value:model.predict(x)};});
    const retrospective=kind==='annual';
    output.innerHTML=`<div class="model-header"><span class="tag ${retrospective?'':'tag--teal'}">${retrospective?'Retrospective model demonstration':'Experimental forward projection'}</span><strong>${esc(label)}</strong></div>
      <div class="model-metrics"><div><small>Available observations</small><strong>${series.length}</strong></div><div><small>Holdout MAE</small><strong>${fmt(mae)} ${esc(unitText)}</strong></div><div><small>Fit R²</small><strong>${fmt(model.r2)}</strong></div></div>
      <div class="model-forecast">${futures.map(f=>`<div><small>${esc(f.time)}</small><strong>${fmt(f.value)} ${esc(unitText)}</strong></div>`).join('')}</div>
      <p class="model-warning">${retrospective?'Model extrapolates only immediately beyond '+recent.key+'. These are historical retrospective estimates, NOT a forecast for the present-day lake.':'An experimental two-period linear extrapolation, not an LLDA forecast or a substitute for future sampling.'} Based on a simple linear regression; short series, seasonality, outliers and changing methods can make predictions unreliable. No confidence interval or safety rating is implied.</p>`;
  }
  async function loadIncidents(){
    try {incidents=(await window.LakeWatchAPI.incidents()).records||[];}
    catch(e){incidents=[];setStatus('incident-form-status','Incident registry unavailable: '+e.message,true);}
    renderIncidents();mapManager?.setIncidentReports(incidents);
  }
  function renderIncidents(){const root=byId('incident-feed');
    if(!incidents.length){root.innerHTML='<div class="incident-empty"><span>◌</span><h5>No reports in this registry</h5><p>No incidents have been published by an administrator. This does not mean that no incidents occurred.</p></div>';return;}
    root.innerHTML=incidents.map(r=>`<article class="incident-item"><div class="incident-head"><span class="tag">${esc(typeName[r.incidentType]||'Event')}</span><time>${esc(r.eventDate)}</time></div><h5>${esc(r.title)}</h5><p>${esc(r.description)}</p><small>${r.stationId?'Station '+esc(r.stationId)+' · ':''}${link(r.sourceUrl,r.sourceTitle)}</small><small class="source-caption">Administrator-documented · not an official LLDA incident confirmation</small></article>`).join('');
  }
  async function loadContext(){try{context=(await window.LakeWatchAPI.contextRecords()).records||[];}catch(e){context=[];setStatus('context-form-status','Cannot load curated context: '+e.message,true)}renderContext();}
  function renderContext(){const root=byId('context-records');
    if(!context.length){root.innerHTML='<div class="incident-empty"><span>≋</span><h5>No curated context readings yet</h5><p>Authorized users can add dated, sourced lake levels, tributary flows and temperature records.</p></div>';return;}
    root.innerHTML=`<div class="table-scroll"><table><thead><tr><th>Date</th><th>Dataset</th><th>Site</th><th>Reading</th><th>Source</th></tr></thead><tbody>${context.map(r=>`<tr><td>${esc(r.observationDate)}</td><td>${esc(kindName[r.kind]||r.kind)}</td><td>${esc(r.location)}</td><td>${esc(r.value)} ${esc(r.unit)}</td><td>${link(r.sourceUrl,r.sourceTitle)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  const ymd=d=>d.toISOString().slice(0,10);
  async function loadWeather(){
    setStatus('weather-status','Loading historical weather context from Open-Meteo…');
    const now=new Date();const end=new Date(now.getTime()-5*86400000),start=new Date(now.getTime()-39*86400000);
    const params=new URLSearchParams({latitude:'14.38',longitude:'121.25',start_date:ymd(start),end_date:ymd(end),daily:'precipitation_sum,temperature_2m_mean',timezone:'Asia/Manila'});
    const url=`https://archive-api.open-meteo.com/v1/archive?${params}`;
    try {
      const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
      const res=await fetch(url,{signal:controller.signal});clearTimeout(timer);
      if(!res.ok)throw Error('HTTP '+res.status);
      const body=await res.json(); const daily=body.daily;
      if(!daily||!Array.isArray(daily.time))throw Error('Daily weather fields unavailable');
      weather=daily.time.map((date,i)=>({date,rain:daily.precipitation_sum?.[i]??null,temp:daily.temperature_2m_mean?.[i]??null}));
      const rains=weather.map(x=>x.rain).filter(Number.isFinite),temps=weather.map(x=>x.temp).filter(Number.isFinite);
      byId('weather-rain').textContent=rains.length?`${fmt(rains.reduce((a,b)=>a+b,0))} mm`:'—';
      byId('weather-temp').textContent=temps.length?`${fmt(temps.reduce((a,b)=>a+b,0)/temps.length)} °C`:'—';
      byId('weather-days').textContent=String(weather.length);
      byId('weather-dates').textContent=`${daily.time[0]} to ${daily.time.at(-1)} · 14.38°N, 121.25°E · Historical gridded weather estimates`;
      renderWeather();setStatus('weather-status','Source: Open-Meteo Historical Weather API. Precipitation and 2 m air temperature are atmospheric context—not water-quality measurements.');
    } catch(e){weather=null;byId('weather-rain').textContent='—';byId('weather-temp').textContent='—';byId('weather-days').textContent='—';byId('context-weather-chart').innerHTML='<p class="model-empty">External weather service is unavailable. No substitute values are displayed.</p>';setStatus('weather-status','Weather context not available: '+e.message,true);}
  }
  function renderWeather(){const root=byId('context-weather-chart'),rows=weather.filter(x=>Number.isFinite(x.rain)||Number.isFinite(x.temp));
    if(!rows.length){root.innerHTML='<p class="hint">No daily values were returned.</p>';return;}
    const maxRain=Math.max(1,...rows.map(x=>x.rain||0));
    root.innerHTML=`<div class="weather-legend"><span><i></i> Daily precipitation (mm)</span><span>Temperature values in accompanying table (°C)</span></div><div class="weather-bars">${rows.map(x=>`<div class="weather-day" title="${esc(x.date)} · rainfall ${esc(x.rain??'N/A')} mm · air temperature ${esc(x.temp??'N/A')} °C"><span style="height:${x.rain==null?0:Math.max(1,x.rain/maxRain*100)}%"></span></div>`).join('')}</div><div class="weather-axis"><span>${esc(rows[0].date)}</span><span>${esc(rows.at(-1).date)}</span></div><details><summary>Accessible daily values</summary><div class="table-scroll"><table><thead><tr><th>Day</th><th>Rainfall (mm)</th><th>Air temperature (°C)</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.rain??'Missing')}</td><td>${esc(x.temp??'Missing')}</td></tr>`).join('')}</tbody></table></div></details>`;
  }
  function gatherReport(){
    const scope=byId('report-scope').value,stationId=byId('report-station').value,period=byId('report-period').value,pid=byId('report-parameter').value;
    const stations=scope==='all'?dataset.stations:[st(stationId)].filter(Boolean);
    const params=dataset.parameters.filter(p=>pid==='all'||pid===p.id);
    const rows=[];for(const station of stations)for(const p of params){let raw=rawValue(station,period,p.id);rows.push({station:station.name,zone:station.zone,param:p.name,short:p.short,value:readableValue(raw,p.id),raw,source:station.samples.find(x=>x.period===period)?.provenance?.[p.id]||null});}
    const sources=[...new Set(Object.values(dataset.metadata.quarterlySources||{}).map(s=>s.url))].filter(Boolean);
    return {scope,stations,period,params,rows,sources,includeIncidents:byId('report-incidents').checked,includeContext:byId('report-context').checked};
  }
  function renderReport(){if(!dataset)return;const d=gatherReport();byId('report-station').disabled=d.scope==='all';
    const previewRows=d.rows.slice(0,Math.min(d.rows.length,24));
    byId('report-preview').innerHTML=`<div class="print-report-top"><img class="print-logo-image" src="assets/lakewatch-laguna-logo.png" alt="LakeWatch Laguna logo"><div><small>LAKEWATCH LAGUNA / ENVIRONMENTAL INTELLIGENCE</small><h3>Water Quality Monitoring Report</h3></div></div><p>Laguna de Bay · ${esc(dateLabel(d.period))} · ${d.stations.length} selected monitoring areas</p>
    <div class="report-stats"><div><strong>${d.rows.filter(r=>r.raw!=null&&r.raw!=='').length}</strong><small>Available readings</small></div><div><strong>${d.rows.length}</strong><small>Requested observations</small></div><div><strong>${d.params.length}</strong><small>Parameters</small></div></div>
    <h4>Reported measurements</h4><div class="table-scroll"><table><thead><tr><th>Station</th><th>Parameter</th><th>Reported value</th></tr></thead><tbody>${previewRows.map(r=>`<tr><td>${esc(r.station)}</td><td>${esc(r.param)}</td><td>${esc(r.value)}</td></tr>`).join('')}</tbody></table></div>${d.rows.length>24?`<p class="hint">Preview shows 24 of ${d.rows.length} rows; PDF will contain the full report.</p>`:''}
    <p class="source-caption">Source periods are historical, not live sensors. Unverified station locations, below-limit observations, original citations, and missing readings remain qualified.</p>
    <div class="report-signature"><span>Prepared by LakeWatch Laguna</span><span>MIT · LSPU San Pablo · 2026</span></div>`;
    setStatus('report-status',`${d.rows.length} measurements prepared for review. PDF includes all selected rows, source references and limitations.`);
  }
  function reportLines(d){
    const lines=[];
    lines.push('REPORT SCOPE',`${d.scope==='all'?'All monitoring stations':d.stations[0]?.name||'Station'} | ${dateLabel(d.period)} | ${d.params.length} parameter(s)`,'',
    'REPORTED MEASUREMENTS');
    for(const r of d.rows){lines.push(`${r.station}  /  ${r.param}  /  ${r.value}`);if(r.source){const citation=[r.source.title,r.source.sourceOrganization,r.source.sourceDate,r.source.sourceReference].filter(Boolean).join(' · ');lines.push(`  Administrator citation: ${citation||r.source.sourceUrl||'See Data Explorer'}`);}}
    lines.push('', 'INTERPRETATION AND QUALITY NOTES',
      'Values are historical measurements, not real-time sensors. A missing reading is not zero.',
      'Values beginning with < are below reporting limits and not exact numeric measurements.',
      'Map marker locations may be approximate. This report does not certify water safety.',
      'Environmental interpretation must confirm station classification, method and units.');
    if(d.includeIncidents){lines.push('', 'DOCUMENTED ENVIRONMENTAL INCIDENTS');lines.push(incidents.length?`${incidents.length} administrator-documented incident(s) in the shared registry; not automatically verified by LLDA.`:'No administrator-documented incident reports in this application. Absence does not establish that no incidents occurred.');incidents.slice(0,40).forEach(i=>lines.push(`${i.eventDate} / ${typeName[i.incidentType]||'Event'} / ${i.title} / ${i.sourceTitle}${i.sourceUrl?' / '+i.sourceUrl:''}`));}
    if(d.includeContext){lines.push('', 'ENVIRONMENTAL CONTEXT');lines.push(context.length?`${context.length} independently cited environmental context record(s) in the shared database.`:'No separately curated environmental context readings available.');context.slice(0,40).forEach(r=>lines.push(`${r.observationDate} / ${kindName[r.kind]||r.kind} / ${r.location} / ${r.value} ${r.unit} / ${r.sourceTitle}${r.sourceUrl?' / '+r.sourceUrl:''}`)); if(weather?.length)lines.push(`Recent weather context: Open-Meteo historical daily precipitation and air temperature; NOT LLDA water readings.`);}
    lines.push('', 'SOURCES AND PROVENANCE','Original historical observations from LLDA quarterly reporting and station sources.');
    for(const u of d.sources)lines.push(u);
    lines.push('Historical interpretation/academic uses only. Verify individual citations before official use.','Report generated '+new Date().toISOString().slice(0,10));
    return lines;
  }
  async function createPDF(){const d=gatherReport();renderReport();
    const api=window.LakeWatchAPI;
    if(api?.connected()){
      setStatus('report-status','Generating source-labeled PDF through the shared Render backend…');
      try{
        const params=new URLSearchParams({stationId:d.scope==='all'?'all':d.stations[0].id,
          period:d.period,parameter:d.params.length===dataset.parameters.length?'all':d.params[0].id,
          includeIncidents:String(d.includeIncidents),includeContext:String(d.includeContext)});
        const response=await fetch(`${api.base}/api/reports/pdf?${params}`,{cache:'no-store'});
        if(!response.ok)throw Error(`PDF API HTTP ${response.status}`);
        const blob=await response.blob();
        if(blob.size<100||!blob.type.includes('pdf'))throw Error('Invalid PDF response');
        const url=URL.createObjectURL(blob),anchor=document.createElement('a');
        anchor.href=url;anchor.download=`LakeWatch_Laguna_${d.period}_${d.scope}_Report.pdf`;
        document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),12000);
        setStatus('report-status','Professional PDF report downloaded from Render. Original sources and limitations are included.');
        return;
      }catch(e){setStatus('report-status','Backend PDF not available; trying local export: '+e.message);}
    }
    const library=window.jspdf?.jsPDF;
    if(!library){
      setStatus('report-status','PDF library unavailable. Opened print-friendly report; select Save as PDF in your browser.');
      const pop=window.open('','_blank');
      if(!pop){setStatus('report-status','Popup blocked. Allow popups or enable the PDF library.',true);return;}
      const content=reportLines(d).map(l=>esc(l)).join('\n');
      pop.document.write(`<html><head><title>LakeWatch Laguna Report</title><style>body{font:12px Arial;padding:32px;color:#123}h1{color:#064a55}pre{white-space:pre-wrap;line-height:1.5}@media print{body{padding:5mm}}</style></head><body><h1>LakeWatch Laguna</h1><p>Water Quality Monitoring Report</p><pre>${content}</pre><script>window.onload=()=>window.print()<\/script></body></html>`);pop.document.close();return;
    }
    const pdf=new library({unit:'pt',format:'a4'}),w=595.28,h=841.89,margin=47,lineHeight=15;
    let y=141,page=1;
    function header(){pdf.setFillColor(10,39,58);pdf.rect(0,0,w,112,'F');pdf.setFillColor(18,162,147);pdf.rect(0,108,w,4,'F');pdf.setTextColor(255,255,255);pdf.setFont('helvetica','bold');pdf.setFontSize(12);pdf.text('LAKEWATCH  LAGUNA',margin,40);pdf.setFontSize(22);pdf.text('Water Quality Report',margin,76);pdf.setFontSize(9);pdf.text('MONITORING  /  ANALYTICS  /  HISTORICAL DATA',margin,95);pdf.setTextColor(30,56,70);}
    function footer(){pdf.setFontSize(8);pdf.setTextColor(104,121,132);pdf.text(`LakeWatch Laguna   ·   MIT / LSPU San Pablo   ·   Page ${page}`,margin,h-28);pdf.text('Historical references · Not live sensor readings',w-margin,h-28,{align:'right'});}
    header();pdf.setFont('helvetica','normal');pdf.setFontSize(10);pdf.text(`${dateLabel(d.period)}  |  ${d.stations.length} monitoring area(s)  |  ${d.params.length} parameter(s)`,margin,y);y+=26;
    for(const rawLine of reportLines(d)){
      const textLine=String(rawLine).replace(/[^\x20-\x7E]/g,' ');
      const isHeading=/^(REPORT SCOPE|REPORTED MEASUREMENTS|INTERPRETATION AND QUALITY NOTES|DOCUMENTED ENVIRONMENTAL INCIDENTS|ENVIRONMENTAL CONTEXT|SOURCES AND PROVENANCE)$/.test(rawLine);
      if(isHeading) y+=12;
      pdf.setFont('helvetica',isHeading?'bold':'normal');pdf.setFontSize(isHeading?11:9);
      pdf.setTextColor(isHeading?12:70,isHeading?120:88,isHeading?112:105);
      const wrapped=pdf.splitTextToSize(textLine,w-2*margin);
      for(const line of wrapped){if(y>h-65){footer();pdf.addPage();page++;header();y=138;}pdf.text(line||' ',margin,y);y+=isHeading?18:lineHeight;}
    }
    footer();pdf.save(`LakeWatch_Laguna_${d.period}_${d.scope}_Report.pdf`);
    setStatus('report-status','PDF file generated successfully. Review the downloaded report and its source citations.');
  }
  function bind(){
    const el=byId('studio-comp-stations');el.addEventListener('change',e=>{if(e.target.matches('input[type=checkbox]')){e.target.checked?selectedComparison.add(e.target.value):selectedComparison.delete(e.target.value);renderComparison();}});
    for(const id of ['studio-comp-param','studio-comp-period'])byId(id).addEventListener('change',()=>{renderComparisonPicker();renderComparison()});
    byId('studio-comp-none').addEventListener('click',()=>{
      selectedComparison.clear();
      renderComparisonPicker();
      renderComparison();
    });
    byId('studio-comp-select-readings').addEventListener('click',()=>{
      const parameter=byId('studio-comp-param').value;
      const period=byId('studio-comp-period').value;
      // All stations with an actual reported entry in the selected month/parameter.
      // Below-limit values are valid reports, but are still excluded from numeric bars.
      selectedComparison=new Set(dataset.stations.filter(station=>{
        const value=rawValue(station,period,parameter);
        return value!==undefined && value!==null && String(value).trim()!=='';
      }).map(station=>station.id));
      renderComparisonPicker();
      renderComparison();
    });
    byId('forecast-series').addEventListener('change',()=>{byId('forecast-station-wrap').hidden=byId('forecast-series').value==='annual';runForecast();});
    for(const id of ['forecast-parameter','forecast-station'])byId(id).addEventListener('change',()=>runForecast());
    byId('forecast-run').addEventListener('click',()=>runForecast());
    byId('show-incidents').addEventListener('change',e=>mapManager?.showIncidents(e.target.checked));
    byId('incident-form').addEventListener('submit',async e=>{
      e.preventDefault();const form=e.currentTarget;const item=Object.fromEntries(new FormData(form).entries());item.stationId=item.stationId||null;
      try{setStatus('incident-form-status','Saving documented report…');await window.LakeWatchAPI.addIncident(item);form.reset();setStatus('incident-form-status','Report saved with its citation.');await loadIncidents();}
      catch(err){setStatus('incident-form-status',err.message,true)}
    });
    byId('context-form').addEventListener('submit',async e=>{
      e.preventDefault();const form=e.currentTarget,item=Object.fromEntries(new FormData(form).entries());item.value=Number(item.value);
      try{setStatus('context-form-status','Saving sourced observation…');await window.LakeWatchAPI.addContext(item);form.reset();setStatus('context-form-status','Context observation saved.');await loadContext();}
      catch(err){setStatus('context-form-status',err.message,true)}
    });
    byId('context-refresh').addEventListener('click',loadWeather);
    for(const id of ['report-scope','report-station','report-period','report-parameter','report-incidents','report-context'])byId(id).addEventListener('change',renderReport);
    byId('report-preview-btn').addEventListener('click',renderReport);
    byId('report-pdf-btn').addEventListener('click',createPDF);
  }
  function initialize(options){if(initiated)return;initiated=true;dataset=options.dataset;populate();bind();loadIncidents();loadContext();loadWeather();}
  function setMapManager(manager){mapManager=manager;if(mapManager)mapManager.setIncidentReports(incidents);}
  function selectReport({stationId,period}){if(!dataset)return;
    if(stationId&&st(stationId))byId('report-station').value=stationId;
    if(period&&dataset.periods.includes(period))byId('report-period').value=period;
    renderReport();}
  function onView(name){if(name==='analytics'&&dataset){renderComparison();}
    if(name==='reports'&&dataset)renderReport();}
  return {initialize,onView,selectReport,renderInterpretation,setMapManager,incidents:()=>incidents,context:()=>context,interpret};
})();
