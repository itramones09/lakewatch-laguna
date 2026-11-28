"use strict";
/* Historical observations explorer. All reported values are preserved verbatim. */
window.LakeWatchExplorer = (() => {
  const escape = v => String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
  const labelMonth = p => /^\d{4}-(0[1-9]|1[0-2])$/.test(p) ? new Date(`${p}-01T12:00:00Z`).toLocaleDateString("en-US",{month:"long",year:"numeric",timeZone:"UTC"}) : p;
  const exact = v => typeof v === "number" && Number.isFinite(v) || typeof v === "string" && /^(?:\d+\.?\d*|\.\d+)$/.test(v.trim());
  const classify = v => v === null || v === undefined || v === "" ? "missing" : (typeof v === "string" && /^\s*</.test(v) ? "below-limit" : (exact(v) ? "exact" : "qualified"));
  const csvEscape = val => {
    let v = String(val ?? "");
    // Spreadsheet formula injection defense; preserve original reading strings unchanged in the UI.
    if (/^[=+@\-\t\r]/.test(v)) v = "'" + v;
    return '"' + v.replaceAll('"','""') + '"';
  };
  function create({dataset,onOpenRecord}) {
    const $ = id=>document.getElementById(id);
    const palette=window.LakeWatchPalette;
    const keys = ["station-filter","parameter-filter","date-filter","reading-filter","explorer-search","explorer-page-size"];
    const rows = [];
    let selected=[],page=0,sortBy="period",direction=-1,ready=false;
    // A complete grid also allows users to explicitly locate unavailable readings.
    for (const station of dataset.stations) for (const period of dataset.periods) for (const param of dataset.parameters) {
      const sample=station.samples.find(s=>s.period===period);
      const raw=sample ? sample.values[param.id] ?? null : null;
      const provenance=sample?.provenance?.[param.id] || null;
      const sourceKind=provenance?.sourceKind || 'online';
      const sourceURL=provenance ? (provenance.sourceKind==='offline'?'':provenance.sourceUrl || sample?.sources?.[param.id] || '')
        : raw!==null ? (sample?.sources?.[param.id] || dataset.metadata.quarterlySources?.[period]?.url || '') : '';
      rows.push({stationId:station.id,station:station.name,zone:station.zone,period,parameterId:param.id,parameter:param.name,value:raw,unit:param.unit,kind:classify(raw),
        sourceKind:raw===null?'':sourceKind,source:sourceURL,title:provenance?.title || '',
        organization:provenance?.sourceOrganization || '',publicationDate:provenance?.sourceDate || '',
        reference:provenance?.sourceReference || ''});
    }
    function setControls() {
      $("station-filter").innerHTML='<option value="">All stations</option>'+dataset.stations.map(s=>`<option value="${escape(s.id)}">${escape(s.name)} — ${escape(s.zone)}</option>`).join('');
      $("parameter-filter").innerHTML='<option value="">All parameters</option>'+dataset.parameters.map(p=>`<option value="${escape(p.id)}">${escape(p.name)}</option>`).join('');
      $("date-filter").innerHTML='<option value="">All months</option>'+dataset.periods.map(p=>`<option value="${escape(p)}">${escape(labelMonth(p))}</option>`).join('');
      keys.forEach(id=>$(id).addEventListener(id==='explorer-search'?'input':'change',()=>{page=0;render();}));
      $("explorer-reset").addEventListener('click',()=>{keys.forEach(id=>{if(id==='explorer-page-size')return;$(id).value='';});page=0;sortBy='period';direction=-1;render();});
      document.querySelectorAll('[data-explorer-sort]').forEach(btn=>btn.addEventListener('click',()=>{
        const key=btn.dataset.explorerSort;if(sortBy===key)direction*=-1;else{sortBy=key;direction=1;}page=0;render();
      }));
      $("explorer-prev").addEventListener('click',()=>{page=Math.max(0,page-1);render();});
      $("explorer-next").addEventListener('click',()=>{page++;render();});
      $("explorer-export").addEventListener('click',downloadCSV);
      $("explorer-table-body").addEventListener('click',evt=>{
        const btn=evt.target.closest('[data-explorer-row]'); if(!btn)return;
        const row=selected[Number(btn.dataset.explorerRow)];if(row)onOpenRecord(row);
      });
    }
    function sortVal(row,key){if(key==='value')return exact(row.value)?Number(row.value):-Infinity;return String(row[key] ?? '').toLowerCase();}
    function render() {
      const station=$("station-filter").value, param=$("parameter-filter").value, period=$("date-filter").value, kind=$("reading-filter").value;
      const search=$("explorer-search").value.trim().toLowerCase();
      selected=rows.filter(r=>{
        // Empty 'All reported readings' excludes missing values to avoid presenting invented data.
        if(!kind && r.kind==='missing')return false;
        if(kind && r.kind!==kind)return false;
        if(station && r.stationId!==station)return false;
        if(param && r.parameterId!==param)return false;
        if(period && r.period!==period)return false;
        if(search && ![r.stationId,r.station,r.zone,labelMonth(r.period),r.parameter,r.value,r.unit,r.kind,r.title,r.organization,r.reference].join(' ').toLowerCase().includes(search))return false;
        return true;
      });
      selected.sort((a,b)=>{
        const av=sortVal(a,sortBy), bv=sortVal(b,sortBy);
        return direction*(typeof av==='number' && typeof bv==='number'?av-bv:String(av).localeCompare(String(bv),undefined,{numeric:true}));
      });
      const count=selected.length, pageSize=$("explorer-page-size").value==='all'?Math.max(1,count):Number($("explorer-page-size").value);
      const maxPage=Math.max(0,Math.ceil(count/pageSize)-1);page=Math.min(maxPage,page);
      const start=page*pageSize,end=Math.min(count,start+pageSize);
      const current=selected.slice(start,end);
      $("explorer-table-body").innerHTML=current.length ? current.map((r,i)=>`<tr>
        <td>${escape(r.station)}</td><td>${escape(r.zone)}</td><td>${escape(labelMonth(r.period))}</td>
        <td>${palette.badge(r.parameterId,dataset.parameters.find(p=>p.id===r.parameterId)?.short)} <span class="explorer-parameter-name">${escape(r.parameter)}</span></td><td class="explorer-value" data-parameter="${escape(r.parameterId)}">${escape(r.value === null?'Not reported':r.value)}</td>
        <td>${escape(r.unit==='pH units'?'—':r.unit)}</td><td><span class="explorer-kind explorer-kind--${escape(r.kind)}">${escape(r.kind.replaceAll('-', ' '))}</span></td>
        <td><button type="button" class="explorer-row-open" data-explorer-row="${start+i}">View</button></td></tr>`).join('') : '<tr><td colspan="8" class="table-empty">No matching data. Change the filters or use Clear All Filters.</td></tr>';
      const activeParam=dataset.parameters.find(p=>p.id===$("parameter-filter").value);
      $("explorer-active-parameter").innerHTML=activeParam?`<span>Filtered parameter</span>${palette.badge(activeParam.id,activeParam.short)} <small>${escape(activeParam.name)}</small>`:
        `<span>Parameter key</span><div class="parameter-legend parameter-legend--compact">${palette.legend(dataset.parameters)}</div>`;
      $("explorer-match-count").textContent=`${count} records`;
      $("explorer-count-total").textContent=count;
      $("explorer-count-exact").textContent=selected.filter(x=>x.kind==='exact').length;
      $("explorer-count-below").textContent=selected.filter(x=>x.kind==='below-limit').length;
      $("explorer-page-info").textContent=count?`Showing ${start+1}–${end} of ${count} matching records`:'No matching records';
      $("explorer-prev").disabled=page===0;
      $("explorer-next").disabled=page>=maxPage;
      $("explorer-export").disabled=count===0;
      document.querySelectorAll('[data-explorer-sort]').forEach(b=>{
        const th=b.closest('th');if(th)th.setAttribute('aria-sort',b.dataset.explorerSort===sortBy?(direction===1?'ascending':'descending'):'none');
      });
    }
    function downloadCSV(){
      if(!selected.length)return;
      const header=['Station ID','Station','Bay / area','Month','Parameter','Reported value','Unit','Value type','Source Type','Report / document title','Original source URL','Issuing organization','Publication date','Reference / pages'];
      const lines=[header,...selected.map(r=>[r.stationId,r.station,r.zone,r.period,r.parameter,r.value===null?'':r.value,r.unit,r.kind,r.sourceKind,r.title,r.source,r.organization,r.publicationDate,r.reference])].map(fields=>fields.map(csvEscape).join(','));
      const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8;'});
      const href=URL.createObjectURL(blob);
      const anchor=document.createElement('a');anchor.href=href;anchor.download=`LakeWatch_Laguna_Observations_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(anchor);anchor.click();anchor.remove();
      setTimeout(()=>URL.revokeObjectURL(href),1500);
      $("explorer-export-status").textContent=`Exported ${selected.length} filtered records to CSV with online/offline citations where provided.`;
    }
    function initialize(){if(ready)return;ready=true;setControls();render();}
    return {initialize,refresh:render};
  }
  return {create};
})();
