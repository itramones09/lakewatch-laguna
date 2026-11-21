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
      if(historicalKey)historicalKey.innerHTML=badge+" <span>Series styles distinguish lake-wide, station annual and station monthly records.</span>";
      const key=document.querySelector(".history-legend");
      if(key)key.dataset.parameter=selectedParam;
      const station=stationById(stationId);
      const lake=archive.lakeAnnual.filter(r=>number(r[selectedParam])!==null).map(r=>({x:r.year,text:String(r.year),value:r[selectedParam],source:'Lake-wide annual mean (ILEC)',href:archive.metadata.lakeAnnualSourceUrl}));
      const annual=archive.stationAnnual.filter(r=>r.stationId===stationId&&number(r[selectedParam])!==null).map(r=>({x:r.year,text:String(r.year),value:r[selectedParam],source:`${station.name} annual average (LLDA)`,href:archive.metadata.stationAnnualSourceUrl}));
      const monthly=(station.samples||[]).map(r=>({x:monthToYear(r.period),text:r.period,value:r.values[selectedParam],source:r.provenance?.[selectedParam] ? `${station.name} monthly measurement (locally imported)` : `${station.name} monthly measurement (LLDA)`,href:r.sources?.[selectedParam] || (r.period>"2023-12"?dataset.metadata.source2026Url:dataset.metadata.source2023Url)}));
      const recent=monthly.filter(r=>number(r.value)!==null);
      const all=[...lake,...annual,...recent];
      const numRaw=all.map(v=>number(v.value)).filter(v=>v!==null);
      const hi=Math.max(1,...numRaw)*1.15;
      const width=1050,height=370,l=62,r=28,t=26,b=58;
      const maxYear=Math.max(2026.8,...monthly.map(r=>r.x+0.2));
      const X=year=>l+(year-1990)/(maxYear-1990)*(width-l-r);
      const Y=value=>height-b-(value/hi)*(height-t-b);
      const elements=[];
      for(let i=0;i<5;i++){
        const value=hi*i/4,y=Y(value);elements.push(`<line class="gridline" x1="${l}" x2="${width-r}" y1="${y}" y2="${y}"/><text class="axis-label" text-anchor="end" x="${l-9}" y="${y+4}">${value.toFixed(value<10?1:0)}</text>`);
      }
      for(const year of [...new Set([1990,1995,2000,2005,2010,2015,2020,2026,Math.floor(maxYear)])])elements.push(`<text class="axis-label" text-anchor="middle" x="${X(year)}" y="${height-24}">${year}</text>`);
      for(const [from,to] of [[2001,2008],[2013,2022]]){
        const x=X(from),w=X(to+0.9)-x;
        elements.push(`<rect x="${x}" y="${t}" width="${w}" height="${height-t-b}" fill="#a3adb4" fill-opacity=".075" stroke="#9eacb5" stroke-opacity=".13"/><text x="${x+w/2}" y="${t+17}" font-size="11" fill="#7b8791" text-anchor="middle">data gap</text>`);
      }
      function stroke(points,color,label,connect=true,style="solid"){
        if(points.length>1&&connect)elements.push(`<polyline fill="none" stroke="${color}" stroke-width="3.5" stroke-dasharray="${style==='dashed'?'9 5':style==='dotted'?'2 6':'none'}" stroke-linejoin="round" stroke-linecap="round" points="${points.map(o=>X(o.x).toFixed(2)+','+Y(number(o.value)).toFixed(2)).join(' ')}"/>`);
        for(const o of points){
          const raw=number(o.value),cx=X(o.x),cy=Y(raw);
          elements.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="5.5" stroke="${color}" stroke-width="2" fill="#ffffff" role="img" aria-label="${esc(label)} ${esc(o.text)}: ${esc(raw)} milligrams per liter"><title>${esc(label)} · ${esc(o.text)} · ${esc(raw)} mg/L</title></circle>`);
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
      const paramName=selectedParam==='bod'?'Biochemical Oxygen Demand (BOD)':'Total Suspended Solids (TSS)';
      $('history-chart').innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${paramName} from 1990 through ${Math.floor(maxYear)}, with three distinctly separated annual and monthly observation types; years without observations are blank">${elements.join('')}<text x="${l}" y="15" font-size="13" font-weight="700" fill="#617987">${esc(paramName)} (mg/L)</text><text x="${width-r}" y="${height-8}" font-size="12" fill="#617987" text-anchor="end">Observation year</text></svg>`;
      const row = o=>`<tr><td>${esc(o.source)}</td><td>${esc(o.text)}</td><td>${esc(display(o.value))} mg/L</td><td><a href="${esc(o.href)}" target="_blank" rel="noopener noreferrer">Source ↗</a></td></tr>`;
      $('history-table-body').innerHTML=[...lake,...annual,...monthly].map(row).join('')||'<tr><td colspan="4">No historical values found.</td></tr>';
      $('history-summary').innerHTML=`<strong>${numRaw.length} plotted points</strong> · ${lake.length} lake-wide annual · ${annual.length} station annual · ${recent.length} monthly. Open the table for all reported values.`;
    }
    async function initialize(){
      if(ready)return;ready=true;
      const sel=$('history-station');
      sel.innerHTML=dataset.stations.map(s=>`<option value="${esc(s.id)}">${esc(s.name)} — ${esc(s.zone)}</option>`).join('');
      sel.value=stationId;
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
