"use strict";
/* Evidence-based historical context. Never joins annual lake-wide, annual station and monthly station observations into one continuous line. */
window.LakeWatchHistorical = (() => {
  const esc = value => String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
  const number = raw => typeof raw === "number" && Number.isFinite(raw) ? raw : (typeof raw === "string" && /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(raw.trim()) ? Number(raw) : null);
  const display = raw => raw===null || raw===undefined || raw==="" ? "Not reported" : String(raw);
  const monthToYear = period => {const [y,m]=period.split("-").map(Number);return y+(m-.5)/12;};
  function create({dataset}) {
    const $=id=>document.getElementById(id);
    let archive=null,ready=false;
    let selectedParam="bod",stationId="I";
    function stationById(id){return dataset.stations.find(s=>s.id===id);}
    function render(){
      if(!archive)return;
      const paramColor=window.LakeWatchPalette.color(selectedParam);
      const badge=window.LakeWatchPalette.badge(selectedParam,selectedParam.toUpperCase());
      const historicalKey=document.getElementById("history-selected-parameter");
      if(historicalKey)historicalKey.innerHTML=badge+" <span>View the available historical and monthly observations for the selected station.</span>";
      const key=document.querySelector(".history-legend");
      if(key)key.dataset.parameter=selectedParam;
      const station=stationById(stationId);
      if(!station)return;
      const parameter=dataset.parameters.find(p=>p.id===selectedParam);
      const unit=parameter?.unit==='pH units'?'':(parameter?.unit||'mg/L');
      const suffix=unit?` ${unit}`:'';
      const chartName=parameter?.name||selectedParam.toUpperCase();
      const labelName=parameter?.short ? `${chartName} (${parameter.short})` : chartName;
      const lake=archive.lakeAnnual.filter(r=>number(r[selectedParam])!==null).map(r=>({x:r.year,text:String(r.year),value:r[selectedParam],source:'Lake-wide annual mean (ILEC)',href:archive.metadata.lakeAnnualSourceUrl}));
      const annual=archive.stationAnnual.filter(r=>r.stationId===stationId&&number(r[selectedParam])!==null).map(r=>({x:r.year,text:String(r.year),value:r[selectedParam],source:`${station.name} annual average (LLDA)`,href:archive.metadata.stationAnnualSourceUrl}));
      const monthly=(station.samples||[]).map(r=>({x:monthToYear(r.period),text:r.period,value:r.values[selectedParam],source:r.provenance?.[selectedParam] ? `${station.name} monthly measurement (locally imported)` : `${station.name} monthly measurement (LLDA)`,href:r.sources?.[selectedParam] || (r.period>"2023-12"?dataset.metadata.source2026Url:dataset.metadata.source2023Url)}));
      const recent=monthly.filter(r=>number(r.value)!==null);
      const all=[...lake,...annual,...recent];
      const numRaw=all.map(v=>number(v.value)).filter(v=>v!==null);
      const hasAnnual=lake.length>0||annual.length>0;
      const coverage=$('history-coverage-note');
      const legend=$('history-chart').parentElement?.querySelector('.history-legend');
      if(legend){
        const keys=legend.querySelectorAll('span');
        if(keys[0])keys[0].hidden=!lake.length;
        if(keys[1])keys[1].hidden=!annual.length;
        if(keys[2])keys[2].hidden=!monthly.length;
      }
      if(coverage){
        const annualMessage=hasAnnual
          ? `${lake.length?'1990–2000 lake-wide annual':'No lake-wide annual'} and ${annual.length?'2009–2012 station annual':'no station annual'} records for this selection.`
          : `Annual ${esc(chartName)} measurements from 1990–2012 are not included in the imported archive.`;
        const monthMessage=monthly.length
          ? ` Showing ${recent.length} exact numeric monthly point${recent.length===1?'':'s'} for ${esc(station.name)}; reported below-limit or missing values are kept in the table.`
          : ` No monthly measurements are imported for ${esc(station.name)}.`;
        coverage.textContent=annualMessage+monthMessage;
        coverage.dataset.coverage=hasAnnual?'annual':'monthly-only';
      }
      const hi=Math.max(1,...numRaw)*1.15;
      const width=1050,height=370,l=62,r=28,t=26,b=58;
      const xStart=hasAnnual?1990:Math.min(2023,...monthly.map(r=>Number(r.text.slice(0,4))));
      const maxYear=Math.max(2026.8,...monthly.map(r=>r.x+0.2));
      const X=year=>l+(year-xStart)/(maxYear-xStart)*(width-l-r);
      const Y=value=>height-b-(value/hi)*(height-t-b);
      const elements=[];
      for(let i=0;i<5;i++){
        const value=hi*i/4,y=Y(value);elements.push(`<line class="gridline" x1="${l}" x2="${width-r}" y1="${y}" y2="${y}"/><text class="axis-label" text-anchor="end" x="${l-9}" y="${y+4}">${value.toFixed(value<10?1:0)}</text>`);
      }
      const tickYears=hasAnnual?[1990,1995,2000,2005,2010,2015,2020,2026]:Array.from({length:Math.floor(maxYear)-xStart+1},(_,i)=>xStart+i);
      for(const year of [...new Set(tickYears.filter(y=>y>=xStart&&y<=maxYear))])elements.push(`<text class="axis-label" text-anchor="middle" x="${X(year)}" y="${height-24}">${year}</text>`);
      const missingRanges=hasAnnual?[[2001,2008],[2013,2022],[2024,2025]]:[[2024,2025]];
      for(const [from,to] of missingRanges){
        const a=Math.max(from,xStart), b=Math.min(to+.9,maxYear);
        if(b<=a)continue;
        const x=X(a),w=X(b)-x;
        elements.push(`<rect x="${x}" y="${t}" width="${w}" height="${height-t-b}" fill="#a3adb4" fill-opacity=".075" stroke="#9eacb5" stroke-opacity=".13"/><text x="${x+w/2}" y="${t+17}" font-size="11" text-anchor="middle">data gap</text>`);
      }
      function stroke(points,color,label,connect=true,style="solid"){
        if(points.length>1&&connect)elements.push(`<polyline fill="none" stroke="${color}" stroke-width="3.5" stroke-dasharray="${style==='dashed'?'9 5':style==='dotted'?'2 6':'none'}" stroke-linejoin="round" stroke-linecap="round" points="${points.map(o=>X(o.x).toFixed(2)+','+Y(number(o.value)).toFixed(2)).join(' ')}"/>`);
        for(const o of points){
          const raw=number(o.value),cx=X(o.x),cy=Y(raw);
          elements.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="5.5" stroke="${color}" stroke-width="2" fill="#ffffff" role="img" aria-label="${esc(label)} ${esc(o.text)}: ${esc(raw)}${esc(suffix)}"><title>${esc(label)} · ${esc(o.text)} · ${esc(raw)}${esc(suffix)}</title></circle>`);
        }
      }
      stroke(lake,paramColor,'Whole lake annual average',true,'solid');
      stroke(annual,paramColor,`${station.name} annual average`,true,'dashed');
      const segments=[];let segment=[];
      for(const reading of recent){
        const previous=segment.at(-1);
        const delta=previous ? (Number(reading.text.slice(0,4))-Number(previous.text.slice(0,4)))*12+Number(reading.text.slice(5,7))-Number(previous.text.slice(5,7)) : 1;
        if(delta>1&&segment.length){segments.push(segment);segment=[];}
        segment.push(reading);
      }
      if(segment.length)segments.push(segment);
      segments.forEach(part=>stroke(part,paramColor,`${station.name} monthly reading`,true,'dotted'));
      if(numRaw.length){
        $('history-chart').innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(labelName)} observations to ${Math.floor(maxYear)}. Annual and monthly records are shown as separate series; unobserved years remain blank">${elements.join('')}<text x="${l}" y="15" font-size="13" font-weight="700">${esc(labelName)}${esc(suffix)}</text><text x="${width-r}" y="${height-8}" font-size="12" text-anchor="end">Observation year</text></svg>`;
      }else{
        $('history-chart').innerHTML=`<div class="history-empty-state" role="status">No exact numeric ${esc(chartName)} readings are imported for ${esc(station.name)}. Try another station or select a different parameter. See the table for any below-limit observations.</div>`;
      }
      const row = o=>`<tr><td>${esc(o.source)}</td><td>${esc(o.text)}</td><td>${esc(display(o.value))}${o.value==null||o.value===''?'':esc(suffix)}</td><td><a href="${esc(o.href||'')}" target="_blank" rel="noopener noreferrer">Source ↗</a></td></tr>`;
      $('history-table-body').innerHTML=[...lake,...annual,...monthly].map(row).join('')||'<tr><td colspan="4">No historical values found.</td></tr>';
      $('history-summary').innerHTML=`<strong>${numRaw.length} plotted points</strong> · ${lake.length} lake-wide annual · ${annual.length} station annual · ${recent.length} station monthly. ${!hasAnnual?'Only available monthly data are shown for this parameter. ':''}Open the table for reported values.`;
    }
    async function initialize(){
      if(ready)return;ready=true;
      const sel=$('history-station');
      sel.innerHTML=dataset.stations.map(s=>`<option value="${esc(s.id)}">${esc(s.name)} — ${esc(s.zone)}</option>`).join('');
      sel.value=stationId;
      const parameterSelector=$('history-parameter');
      parameterSelector.innerHTML=dataset.parameters.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}${p.unit==='pH units'?'':` · ${esc(p.unit||'mg/L')}`}</option>`).join('');
      parameterSelector.value=selectedParam;
      sel.addEventListener('change',e=>{stationId=e.target.value;render();});
      $('history-parameter').addEventListener('change',e=>{selectedParam=e.target.value;render();});
      try{
        const response=await fetch('data/historical-annual.json',{cache:'no-store'});
        if(!response.ok)throw Error(`HTTP ${response.status}`);
        archive=await response.json();
        if(!archive.lakeAnnual?.length||!archive.stationAnnual?.length)throw Error('Empty historical tables');
        render();
      }catch(error){
        $('history-summary').textContent='The historical annual archive could not load. Use VS Code Live Server and check data/historical-annual.json.';
        console.error('Historical annual archive unavailable',error);
      }
    }
    return {initialize,refresh:render};
  }
  return {create};
})();
