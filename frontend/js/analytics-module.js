"use strict";

/* LakeWatch Laguna — analytics dashboard.
 * Only exact numerical readings are charted. Censored readings (e.g. <0.1)
 * remain visible as original text in accessible tables and summary cards,
 * but are NOT converted to fabricated numbers.
 * Chart.js handles interactive charts when available; local SVG fallback
 * displays honest, functional charts without Chart.js/internet access.
 */
window.LakeWatchAnalytics = (() => {
  const escapeHTML = value => String(value ?? "").replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");

  const monthLabel = period => /^\d{4}-(0[1-9]|1[0-2])$/.test(period) ? new Date(`${period}-01T12:00:00Z`).toLocaleDateString("en-US",{month:"short",year:"numeric",timeZone:"UTC"}) : period;

  function exactNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && /^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(value.trim())) {
      const n=Number(value.trim());
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  function create({dataset, onChange}) {
    const $ = id => document.getElementById(id);
    const state = {stationId: dataset.stations[0].id, period: dataset.periods.at(-1), parameter: dataset.parameters[0].id};
    let trendChart = null;
    let comparisonChart = null;
    let initialized = false;
    const palette=window.LakeWatchPalette;

    function stationById(id) { return dataset.stations.find(s=>s.id===id); }
    function parameterById(id) { return dataset.parameters.find(p=>p.id===id); }
    function sampleByPeriod(station, period) { return station?.samples.find(s=>s.period===period); }
    function rawValue(station,period,param) { return sampleByPeriod(station,period)?.values[param] ?? null; }
    function unitText(parameter) { return parameter.unit === "pH units" ? "" : ` ${parameter.unit}`; }
    function readingText(value,parameter) { return value===null || value==="" ? "Not reported" : `${value}${unitText(parameter)}`; }

    function writeControls() {
      const stationSelect = $("analytics-station");
      const parameterSelect = $("analytics-parameter");
      const periodSelect = $("analytics-period");
      stationSelect.innerHTML = dataset.stations.map(s=>`<option value="${escapeHTML(s.id)}">${escapeHTML(s.name)} — ${escapeHTML(s.zone)}</option>`).join("");
      parameterSelect.innerHTML = dataset.parameters.map(p=>`<option value="${escapeHTML(p.id)}">${escapeHTML(p.name)}${p.unit==='pH units'?'':` (${escapeHTML(p.unit)})`}</option>`).join("");
      periodSelect.innerHTML = dataset.periods.map(p=>`<option value="${escapeHTML(p)}">${escapeHTML(monthLabel(p))}</option>`).join("");
      syncControlValues();
      for(const [id,key] of [["analytics-station","stationId"],["analytics-parameter","parameter"],["analytics-period","period"]]) {
        $(id).addEventListener("change", e => {
          state[key]=e.target.value;
          onChange({ ...state });
          render();
        });
      }
    }

    function syncControlValues() {
      $("analytics-station").value=state.stationId;
      $("analytics-parameter").value=state.parameter;
      $("analytics-period").value=state.period;
    }

    function renderTextAndTables(station,parameter,trend,compared) {
      const value = rawValue(station,state.period,state.parameter);
      const exactAtMonth = compared.filter(item=>item.exact!==null);
      const numbers = exactAtMonth.map(item=>item.exact);
      const currentNum = exactNumber(value);
      const censored = compared.filter(item => item.raw!==null && item.exact===null);
      const unreported = compared.filter(item=>item.raw===null).length;
      const average = numbers.length ? numbers.reduce((a,b)=>a+b,0)/numbers.length : null;
      const precision = num => num === null ? "—" : (Math.round(num*100)/100).toLocaleString("en-US",{maximumFractionDigits:2});
      $("analytics-summary").innerHTML = `
        <div class="analytics-reading" data-parameter="${escapeHTML(parameter.id)}"><span>Selected reading · ${palette.badge(parameter.id,parameter.short)}</span>
          <strong>${escapeHTML(readingText(value,parameter))}</strong>
          <small>${escapeHTML(station.name)} · ${escapeHTML(monthLabel(state.period))}</small></div>
        <div class="analytics-stats">
          <div class="analytics-stat"><span>Lowest exact reading</span><strong>${precision(numbers.length?Math.min(...numbers):null)}${escapeHTML(unitText(parameter))}</strong></div>
          <div class="analytics-stat"><span>Highest exact reading</span><strong>${precision(numbers.length?Math.max(...numbers):null)}${escapeHTML(unitText(parameter))}</strong></div>
          <div class="analytics-stat"><span>Mean of exact readings</span><strong>${precision(average)}${escapeHTML(unitText(parameter))}</strong></div>
          <div class="analytics-stat"><span>Exact values in comparison</span><strong>${exactAtMonth.length} of ${compared.length}</strong></div>
        </div>
        <p class="analytics-stat-note">Summary statistics are calculated only from exact numeric values for ${escapeHTML(monthLabel(state.period))}. ${censored.length} reported below-limit value(s) excluded; this is not a regulatory compliance assessment.</p>`;

      const allRows = trend.map(item=>`<tr><th scope="row">${escapeHTML(monthLabel(item.period))}</th><td>${item.isGap ? "No observations loaded" : escapeHTML(readingText(item.raw,parameter))}</td><td>${item.isGap ? '<span class="reading-flag">Data gap, no interpolation</span>' : (item.exact===null ? '<span class="reading-flag">Not plotted — non-exact</span>' : 'Exact reading')}</td></tr>`).join("");
      $("analytics-trend-table").innerHTML=allRows;
      const comparedRows=compared.map(item=>`<tr><th scope="row">${escapeHTML(item.station.name)} — ${escapeHTML(item.station.zone)}</th><td>${escapeHTML(readingText(item.raw,parameter))}</td><td>${item.exact===null?'<span class="reading-flag">Not plotted — non-exact</span>':'Exact reading'}</td></tr>`).join("");
      $("analytics-compare-table").innerHTML=comparedRows;
      $("analytics-selected-reading").textContent=`${station.name}: ${readingText(value,parameter)} (${monthLabel(state.period)})`;
      const countNonExact=trend.filter(item=>item.exact===null&&!item.isGap).length;
      $("analytics-trend-note").textContent=`${parameter.name} (${parameter.unit === 'pH units'?'unitless':parameter.unit}) at ${station.name} · available historical periods. ${countNonExact?`${countNonExact} non-exact value(s) omitted from the numeric line.`:'All plotted observations are exact numbers.'}`;
      $("analytics-compare-note").textContent=`${parameter.name} across ${compared.length} station areas · ${monthLabel(state.period)}. ${censored.length ? `${censored.length} non-exact reading(s) shown only in the table.` : ""} ${unreported ? `${unreported} station(s) have no reported value for this month.` : ""}`;
    }

    function makeDomain(values) {
      if(!values.length) return [0,1];
      let min = Math.min(...values), max = Math.max(...values);
      let pad = Math.max((max-min)*.17, Math.abs(max)*.04, .1);
      if(min===max) pad=Math.max(Math.abs(min)*.1,.3);
      return [Math.max(0,min-pad),max+pad];
    }
    function fallbackLineSvg(trend, parameter,station) {
      const width=740, height=270, left=62,right=30,top=19,bottom=47;
      const vals=trend.filter(v=>v.exact!==null).map(v=>v.exact);
      const [lo,hi]=makeDomain(vals);
      const x=i=>left+(width-left-right)*(i/Math.max(1,trend.length-1));
      const y=v=>top+(height-top-bottom)*(1-(v-lo)/(hi-lo));
      let grid="";
      for(let i=0;i<5;i++){
        const tick=lo+(hi-lo)*i/4, yy=y(tick);
        grid+=`<line x1="${left}" x2="${width-right}" y1="${yy.toFixed(1)}" y2="${yy.toFixed(1)}" stroke="#e5edef" stroke-width="1"/><text x="${left-9}" y="${(yy+4).toFixed(1)}" text-anchor="end" font-size="12" fill="#637b85">${(Math.round(tick*100)/100).toLocaleString('en-US',{maximumFractionDigits:2})}</text>`;
      }
      let segments=[], current=[];
      trend.forEach((item,i)=>{
        if(item.exact===null){if(current.length) segments.push(current);current=[];}
        else current.push(`${x(i).toFixed(1)},${y(item.exact).toFixed(1)}`);
      });
      if(current.length)segments.push(current);
      const paths=segments.filter(s=>s.length>1).map(s=>`<polyline points="${s.join(' ')}" fill="none" stroke="${palette.color(parameter.id)}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`).join("");
      const markers=trend.map((item,i)=>item.exact===null?`<text x="${x(i)}" y="${height-bottom-18}" text-anchor="middle" font-size="11" fill="#936e2c">non-exact</text>`:`<circle cx="${x(i)}" cy="${y(item.exact)}" r="6" fill="${palette.color(parameter.id)}" stroke="white" stroke-width="2"/><text x="${x(i)}" y="${y(item.exact)-13}" text-anchor="middle" font-size="12" font-weight="700" fill="#195364">${item.exact}</text>`).join("");
      const xLabels=trend.map((v,i)=>`<text x="${x(i)}" y="${height-17}" text-anchor="middle" font-size="12" fill="#4f6873">${escapeHTML(monthLabel(v.period))}</text>`).join("");
      return `<svg class="analytics-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Trend of ${escapeHTML(parameter.name)} at ${escapeHTML(station.name)} across the available historical reporting periods. Values below detection limits are omitted.">${grid}${paths}${markers}${xLabels}</svg>`;
    }
    function fallbackBarSvg(compared,parameter) {
      const width=Math.max(680,compared.length*68+100),height=280,left=60,right=24,top=20,bottom=64;
      const vals=compared.filter(item=>item.exact!==null).map(item=>item.exact);
      const [,maxRaw]=makeDomain(vals);
      const max=Math.max(1,maxRaw);
      const gap=(width-left-right)/compared.length, barWidth=Math.min(65,gap*.57);
      let grid="";
      for(let i=0;i<5;i++){
        const val=max*i/4,yy=top+(height-top-bottom)*(1-val/max);
        grid+=`<line x1="${left}" x2="${width-right}" y1="${yy.toFixed(1)}" y2="${yy.toFixed(1)}" stroke="#e5edef"/><text x="${left-8}" y="${yy+4}" text-anchor="end" font-size="12" fill="#637b85">${(Math.round(val*100)/100).toLocaleString('en-US',{maximumFractionDigits:2})}</text>`;
      }
      const bars=compared.map((item,i)=>{
        const center=left+gap*(i+.5);
        if(item.exact===null) return `<text x="${center}" y="${height-bottom-28}" text-anchor="middle" font-size="11" fill="#936e2c">non-exact</text><text x="${center}" y="${height-17}" text-anchor="middle" font-size="12" fill="#4f6873">${escapeHTML(item.station.name)}</text>`;
        const yy=top+(height-top-bottom)*(1-item.exact/max);
        const h=height-bottom-yy;
        return `<rect x="${(center-barWidth/2).toFixed(1)}" y="${yy.toFixed(1)}" width="${barWidth}" height="${Math.max(1,h).toFixed(1)}" rx="5" fill="${palette.color(parameter.id)}" opacity="${item.station.id===state.stationId?1:0.64}"/><text x="${center}" y="${Math.max(11,yy-10)}" text-anchor="middle" font-size="12" font-weight="700" fill="#195364">${item.exact}</text><text x="${center}" y="${height-17}" text-anchor="middle" font-size="12" fill="#4f6873">${escapeHTML(item.station.name)}</text>`;
      }).join("");
      return `<svg class="analytics-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHTML(parameter.name)} comparison by station for ${escapeHTML(monthLabel(state.period))}. Non-exact readings not plotted.">${grid}${bars}</svg>`;
    }

    function destroyCharts() {
      if(trendChart){trendChart.destroy();trendChart=null;}
      if(comparisonChart){comparisonChart.destroy();comparisonChart=null;}
    }

    function renderWithChartJs(trend,compared,parameter,station) {
      const styles = getComputedStyle(document.documentElement);
      const tickColor = styles.getPropertyValue("--chart-text").trim() || "#496775";
      const gridColor = styles.getPropertyValue("--chart-grid").trim() || "#e4edef";
      const unitLabel=parameter.unit==='pH units'?'pH':parameter.unit;
      const baseOptions = (ylabel)=>({
        responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:'index',intersect:false},
        plugins:{legend:{display:false},tooltip:{callbacks:{label:context=>{
          const raw=context.dataset.rawValues?.[context.dataIndex];
          return `${context.dataset.label}: ${readingText(raw,parameter)}`;
        }}}},
        scales:{x:{ticks:{color:tickColor,maxRotation:65,minRotation:35,autoSkip:false,font:{size:10}},grid:{display:false}},y:{title:{display:true,text:ylabel,color:tickColor},ticks:{color:tickColor},grid:{color:gridColor}}}
      });
      const trendValues=trend.map(item=>item.exact);
      const comparisonValues=compared.map(item=>item.exact);
      trendChart=new Chart($("analytics-trend-canvas"),{
        type:"line",
        data:{labels:trend.map(item=>monthLabel(item.period)),datasets:[{
          label:parameter.short || parameter.name, data:trendValues,
          rawValues:trend.map(item=>item.raw),borderColor:palette.color(parameter.id),backgroundColor:palette.color(parameter.id),
          pointBackgroundColor:palette.color(parameter.id),pointBorderColor:"#fff",pointBorderWidth:2,pointRadius:6,
          tension:.25,spanGaps:false,fill:false,borderWidth:3
        }]},options:baseOptions(unitLabel)
      });
      comparisonChart=new Chart($("analytics-compare-canvas"),{
        type:"bar",
        data:{labels:compared.map(item=>item.station.name),datasets:[{
          label:parameter.short || parameter.name, data:comparisonValues,
          rawValues:compared.map(item=>item.raw),backgroundColor:compared.map(item=>item.station.id===state.stationId?palette.color(parameter.id):palette.color(parameter.id)+"A0"),
          hoverBackgroundColor:palette.color(parameter.id),borderRadius:5,maxBarThickness:35
        }]},options:baseOptions(unitLabel)
      });
      $("analytics-render-mode").textContent="Interactive Chart.js visualizations";
      $("analytics-trend-canvas").hidden=false;
      $("analytics-compare-canvas").hidden=false;
      $("analytics-trend-fallback").hidden=true;
      $("analytics-compare-fallback").hidden=true;
    }

    function renderFallback(trend,compared,parameter,station) {
      destroyCharts();
      $("analytics-trend-canvas").hidden=true;
      $("analytics-compare-canvas").hidden=true;
      $("analytics-trend-fallback").innerHTML=fallbackLineSvg(trend,parameter,station);
      $("analytics-compare-fallback").innerHTML=fallbackBarSvg(compared,parameter);
      $("analytics-trend-fallback").hidden=false;
      $("analytics-compare-fallback").hidden=false;
      $("analytics-render-mode").textContent="Responsive SVG charts (Chart.js unavailable)";
    }

    function render() {
      if(!initialized) return;
      const station=stationById(state.stationId);
      const parameter=parameterById(state.parameter);
      if(!station||!parameter)return;
      const trend=dataset.periods.flatMap((period,index)=>{
        const raw=rawValue(station,period,state.parameter);
        const point={period,raw,exact:exactNumber(raw)};
        if(index===0)return [point];
        const previous=dataset.periods[index-1];
        const months=(Number(period.slice(0,4))-Number(previous.slice(0,4)))*12 + Number(period.slice(5,7))-Number(previous.slice(5,7));
        return months>1 ? [{period:"Observation gap",raw:null,exact:null,isGap:true},point] : [point];
      });
      const compared=dataset.stations.filter(s=>s.reportingStatus!=="unverified-legacy").map(s=>{
        const raw=rawValue(s,state.period,state.parameter);
        return {station:s,raw,exact:exactNumber(raw)};
      });
      $("analytics-parameter-badge").innerHTML=palette.badge(parameter.id,parameter.short);
      $("analytics-parameter").dataset.parameter=parameter.id;
      $("analytics-trend-heading").textContent=`${parameter.name} · ${station.name}`;
      $("analytics-compare-heading").textContent=`${parameter.name} · ${monthLabel(state.period)}`;
      renderTextAndTables(station,parameter,trend,compared);
      destroyCharts();
      if(typeof window.Chart==="function"){
        try { renderWithChartJs(trend,compared,parameter,station); }
        catch(error){console.warn("Chart.js could not render. Using SVG charts.",error);renderFallback(trend,compared,parameter,station);}
      } else renderFallback(trend,compared,parameter,station);
    }

    function initialize(stationId,period,parameter) {
      if(initialized)return;
      writeControls();initialized=true;
      setSelection(stationId,period,parameter);
    }
    function setSelection(stationId,period,parameter) {
      if(stationById(stationId))state.stationId=stationId;
      if(dataset.periods.includes(period))state.period=period;
      if(parameterById(parameter))state.parameter=parameter;
      if(initialized){syncControlValues();render();}
    }
    function refresh(){render();}
    return {initialize,setSelection,refresh};
  }
  return {create,exactNumber};
})();
