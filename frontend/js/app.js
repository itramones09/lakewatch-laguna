"use strict";

/*
 * LakeWatch Laguna — application modules
 * Shared state + navigation, station directory, LLDA data, Leaflet, analytics.
 * All measurement values come from data/stations.json. No synthetic sensor readings.
 */
(() => {
  const $ = id => document.getElementById(id);
  const views = Array.from(document.querySelectorAll(".view"));
  const navButtons = Array.from(document.querySelectorAll(".nav-btn"));
  const palette = window.LakeWatchPalette;

  let dataset = null;
  let selectedStationId = "I";
  let selectedPeriod = "2026-06";
  let selectedParameter = "do";
  let mapManager = null;
  let analyticsManager = null;
  let explorerManager = null;
  let historicalManager = null;
  let dataManager = null;
  let currentView = "overview";
  let stationStatusFilter = "active";

  const monthLabel = period => /^\d{4}-(0[1-9]|1[0-2])$/.test(period) ? new Date(`${period}-01T12:00:00Z`).toLocaleDateString("en-US",{month:"long",year:"numeric",timeZone:"UTC"}) : period;

  const safe = value => String(value == null ? "" : value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

  function currentStation() {
    return dataset?.stations.find(s => s.id === selectedStationId) || null;
  }
  function paramDef(id) {
    return dataset?.parameters.find(p => p.id === id) || null;
  }
  function sampleAt(station, period = selectedPeriod) {
    return station?.samples.find(sample => sample.period === period) || null;
  }
  function formatMeasurement(value, parameter) {
    if (value === undefined || value === null || value === "") return "No reported value";
    const label = typeof value === "number" ? String(value) : String(value);
    const unit = parameter.unit === "pH units" ? "" : ` ${parameter.unit}`;
    return `${label}${unit}`;
  }
  function renderValueCards(station, period) {
    const sample = sampleAt(station, period);
    if (!sample) return '<p class="hint">No readings for this month.</p>';
    return dataset.parameters.map(p => `
      <div class="reading-card parameter-card" data-parameter="${safe(p.id)}">
        <span class="reading-label">${palette.badge(p.id,p.short)} <span>${safe(p.name)}</span></span>
        <strong>${safe(formatMeasurement(sample.values[p.id], p))}</strong>
        <small>${safe(p.description)}</small>
      </div>`).join("");
  }

  function historyEvidence(s) {
    if (s.establishedYear) return `Added to monitoring in ${s.establishedYear} (official year only; no day/month published)`;
    if (s.earliestDocumentedYear) return `Documented by ${s.earliestDocumentedYear}; exact establishment date not verified`;
    return 'No official establishment date or independently verified mapped site';
  }
  function appStatusLabel(station) {
    return station.appStatus === "active" ? "Active — recent readings" : "Archived — no recent imported readings";
  }
  function coordinateLabel(station) {
    if (!station.position) return "Unlocated — no verified geographic point";
    return station.coordinateAccuracy === "published-research"
      ? "Published research coordinates (not official GPS)"
      : "Approximate area (not surveyed)";
  }
  function updateStatusTabs() {
    document.querySelectorAll("[data-station-status]").forEach(b => {
      const isSelected = b.dataset.stationStatus === stationStatusFilter;
      b.classList.toggle("is-current", isSelected);
      b.setAttribute("aria-pressed", String(isSelected));
    });
    $("station-status-explainer").textContent = stationStatusFilter === "active"
      ? `Recent readings available through ${monthLabel(dataset.metadata.statusAsOf)}.`
      : `No recent readings in the imported dataset (through ${monthLabel(dataset.metadata.statusAsOf)}). This does not confirm station closure.`;
  }
  function updateParameterKeys() {
    if (!dataset) return;
    const definitions=dataset.parameters;
    $("overview-parameter-guide").innerHTML=palette.legend(definitions,{clickable:true});
    for (const id of ["map-parameter-key","station-parameter-key","about-parameter-key"])
      $(id).innerHTML=palette.legend(definitions);
    updateCurrentParameter();
  }
  function updateCurrentParameter() {
    if(!dataset)return;
    const p=paramDef(selectedParameter);
    $("map-current-parameter").innerHTML=`<span>Selected parameter</span>${palette.badge(p.id,p.short)} <small>${safe(p.name)}</small>`;
    const selector=$("map-parameter");
    selector.dataset.parameter=selectedParameter;
    document.querySelectorAll("[data-parameter-quick]").forEach(btn=>{
      const chosen=btn.dataset.parameterQuick===selectedParameter;
      btn.classList.toggle("is-selected",chosen);
      btn.setAttribute("aria-pressed",String(chosen));
    });
  }
  function renderMapStationPanel() {
    const station = currentStation();
    const outlet = $("map-selected-station");
    if (!station || !dataset) return;
    const p = paramDef(selectedParameter);
    const sample = sampleAt(station);
    outlet.innerHTML = `
      <div class="station-mini">
        <span class="tag tag--teal">${safe(appStatusLabel(station))}</span>
        <h4>${safe(station.name)}</h4>
        <p>${safe(station.zone)}</p>
        <p class="module-caption">${safe(coordinateLabel(station))}</p>
        <div class="mini-reading" data-parameter="${safe(p.id)}">
          <span>${palette.badge(p.id,p.short)} ${safe(monthLabel(selectedPeriod))}</span>
          <strong>${safe(formatMeasurement(sample?.values[p.id], p))}</strong>
        </div>
        <button class="button button--primary button--full" type="button" data-open-selected-station>Open Station Profile</button>
      </div>`;
  }

  function renderDirectory() {
    const root = $("station-directory");
    if (!dataset) return;
    const q = $("station-search").value.trim().toLowerCase();
    updateStatusTabs();
    const filtered = dataset.stations.filter(s => s.appStatus === stationStatusFilter && `${s.name} ${s.zone}`.toLowerCase().includes(q));
    root.innerHTML = filtered.length ? filtered.map(s => `
      <button class="station-list-button ${selectedStationId === s.id ? 'is-selected' : ''}"
              type="button" data-station-id="${safe(s.id)}" role="listitem"
              aria-pressed="${selectedStationId === s.id ? 'true':'false'}">
        <span><strong>${safe(s.name)}</strong><small>${safe(s.zone)}</small><span class="station-status-pill ${s.appStatus === "active" ? "" : "station-status-pill--archived"}">${safe(appStatusLabel(s))}</span><small class="station-accuracy-line">${safe(coordinateLabel(s))}</small></span>
        <span class="station-chevron" aria-hidden="true">${s.position ? "⌖" : "—"}</span>
      </button>`).join("") : '<p class="empty-results">No matching monitoring areas found.</p>';
  }

  function renderProfile() {
    const s = currentStation();
    if (!s || !dataset) return;
    const root = $("station-profile");
    const measurementSource = selectedPeriod > "2023-12" ? dataset.metadata.source2026Url : dataset.metadata.source2023Url;
    const sourceLabel = selectedPeriod > "2023-12" ? "Q2 2026" : "Q4 2023";
    const imported = Object.values(sampleAt(s)?.provenance||{}).length > 0;
    root.innerHTML = `
      <div class="profile-heading">
        <div><h4>${safe(s.name)} — ${safe(s.zone)}</h4></div>
        <span class="tag">${safe(appStatusLabel(s))}</span>
      </div>
      <p class="module-caption">Select a reporting month above to update these readings.</p>
      <div class="reading-grid">${renderValueCards(s,selectedPeriod)}</div>
      <details class="profile-sources">
        <summary>Station history and location sources</summary>
        <div class="profile-source-body">
          <p><strong>Monitoring history:</strong> ${safe(historyEvidence(s))}</p>
          <p><strong>Record evidence:</strong> ${safe(s.stationEvidence || "Not verified")}</p>
          <p><strong>Establishment note:</strong> ${safe(s.establishmentNote || "Not available")}</p>
          <p><strong>Location:</strong> ${safe(coordinateLabel(s))}</p>
          <p>${safe(s.coordinateNote)}</p>
          ${s.position && s.coordinateAccuracy === "published-research" ? `<p><strong>Published coordinates:</strong> ${s.position.lat}° N, ${s.position.lon}° E</p>` : ""}
          ${s.establishmentSource ? `<p><a href="${safe(s.establishmentSource)}" target="_blank" rel="noopener noreferrer">Monitoring history source ↗</a></p>` : ""}
          ${s.coordinateSource && s.position ? `<p><a href="${safe(s.coordinateSource)}" target="_blank" rel="noopener noreferrer">Location source ↗</a></p>` : ""}
        </div>
      </details>
      <p class="data-source-line">${s.appStatus === "archived"
        ? "No monthly measurements are imported for this identifier; archived does not confirm official closure."
        : imported ? "Some readings were administrator-updated in the shared database. Source links are available in Data Explorer; not a live sensor feed."
        : `Measurements: <a href="${safe(measurementSource)}" target="_blank" rel="noopener noreferrer">LLDA ${sourceLabel} report</a> · Historical, not live.`}</p>
      ${s.position ? '<button class="button button--primary" type="button" data-show-station-map>Find station on map</button>' : '<p class="module-caption">Location not shown because no independent position has been verified.</p>'}`;
  }

  function selectStation(stationId, options={}) {
    if (!dataset?.stations.some(s => s.id === stationId)) return;
    selectedStationId = stationId;
    const chosen = currentStation();
    if (chosen && chosen.appStatus !== stationStatusFilter) stationStatusFilter = chosen.appStatus;
    renderDirectory();
    renderProfile();
    renderMapStationPanel();
    updateCurrentParameter();
    $("map-station-locator").value=currentStation()?.position ? stationId : "";
    if (mapManager) mapManager.selectStation(stationId, { zoom: Boolean(options.zoom) });
    analyticsManager?.setSelection(selectedStationId,selectedPeriod,selectedParameter);
  }

  // Shared state from the Analytics filter toolbar flows back into map and stations.
  function onAnalyticsChange(next) {
    if(dataset?.stations.some(s=>s.id===next.stationId)){
      selectedStationId=next.stationId;
      stationStatusFilter=currentStation().appStatus;
    }
    if(dataset?.periods.includes(next.period))selectedPeriod=next.period;
    if(dataset?.parameters.some(p=>p.id===next.parameter))selectedParameter=next.parameter;
    $("station-period").value=selectedPeriod;
    $("map-period").value=selectedPeriod;
    $("map-parameter").value=selectedParameter;
    renderDirectory();
    renderProfile();
    renderMapStationPanel();
    updateCurrentParameter();
    mapManager?.selectStation(selectedStationId);
    mapManager?.setSelection(selectedPeriod,selectedParameter);
  }

  function ensureAnalytics() {
    if(!dataset || analyticsManager)return;
    if(!window.LakeWatchAnalytics){
      $("analytics-render-mode").textContent="Analytics script unavailable";
      return;
    }
    analyticsManager=window.LakeWatchAnalytics.create({dataset,onChange:onAnalyticsChange});
    analyticsManager.initialize(selectedStationId,selectedPeriod,selectedParameter);
  }

  function ensureHistory() {
    if (!dataset || historicalManager || !window.LakeWatchHistorical) return;
    historicalManager = window.LakeWatchHistorical.create({dataset});
    historicalManager.initialize();
  }
  function ensureExplorer() {
    if (!dataset || explorerManager) return;
    if (!window.LakeWatchExplorer) return;
    explorerManager = window.LakeWatchExplorer.create({
      dataset,
      onOpenRecord: record => {
        selectedStationId = record.stationId;
        selectedPeriod = record.period;
        selectedParameter = record.parameterId;
        $("station-period").value = selectedPeriod;
        $("map-period").value = selectedPeriod;
        $("map-parameter").value = selectedParameter;
        selectStation(selectedStationId);
        mapManager?.setSelection(selectedPeriod, selectedParameter);
        analyticsManager?.setSelection(selectedStationId, selectedPeriod, selectedParameter);
        showView("stations");
      }
    });
    explorerManager.initialize();
  }

  function showView(name) {
    const chosen = $("view-" + name);
    if (!chosen) return;
    currentView = name;
    views.forEach(view => { view.hidden = view !== chosen; });
    navButtons.forEach(button => {
      const active = button.dataset.view === name;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    if(name === "explorer") ensureExplorer();
    if(name === "manage" && dataset) {
      if(!dataManager){dataManager=window.LakeWatchData.create({dataset});dataManager.initialize();}
    }
    if(name === "analytics") {
      ensureAnalytics();
      ensureHistory();
      // Chart.js must measure its canvases only after this tab becomes visible.
      requestAnimationFrame(()=>analyticsManager?.refresh());
    }
    if (name === "map") {
      if (!dataset) {
        $("map-status").textContent = "Loading station dataset — retry when ready";
        return;
      }
      if (!mapManager) {
        mapManager = window.LakeWatchMap.create({
          mapElement: "map",
          onSelectStation: id => selectStation(id),
          onCoordinate: text => { $("map-coordinates").textContent = text; },
          onStatus: text => { $("map-status").textContent = text; },
          onBoundary: text => { $("boundary-note").textContent = text; }
        });
        mapManager.initialize(dataset, selectedStationId, selectedPeriod, selectedParameter);
      }
      requestAnimationFrame(() => mapManager.invalidateSize());
    }
    document.querySelectorAll("[data-open-view]").forEach(btn => {
      btn.setAttribute("aria-label", `Open ${btn.dataset.openView} module`);
    });
  }

  document.addEventListener("click", e => {
    const nav = e.target.closest("[data-view], [data-open-view]");
    if (nav) showView(nav.dataset.view || nav.dataset.openView);
    const quick=e.target.closest("[data-parameter-quick]");
    if(quick && dataset){
      selectedParameter=quick.dataset.parameterQuick;
      $("map-parameter").value=selectedParameter;
      updateCurrentParameter();
      renderMapStationPanel();
      mapManager?.setSelection(selectedPeriod,selectedParameter);
      ensureAnalytics();
      analyticsManager?.setSelection(selectedStationId,selectedPeriod,selectedParameter);
      showView("analytics");
    }
    const statusButton = e.target.closest("[data-station-status]");
    if(statusButton) {
      stationStatusFilter=statusButton.dataset.stationStatus;
      $("station-search").value="";
      const first=dataset?.stations.find(s=>s.appStatus===stationStatusFilter);
      if(first)selectStation(first.id);
      else renderDirectory();
    }
    const fromPopup = e.target.closest("[data-popup-station]");
    if(fromPopup) {
      selectStation(fromPopup.dataset.popupStation);
      showView("stations");
      return;
    }
    const stationButton = e.target.closest("[data-station-id]");
    if (stationButton) selectStation(stationButton.dataset.stationId);
    if (e.target.closest("[data-open-selected-station]")) showView("stations");
    if (e.target.closest("[data-show-station-map]")) {
      showView("map");
      if(currentStation()?.position) mapManager?.selectStation(selectedStationId,{zoom:true,openPopup:true});
    }
  });

  $("station-search").addEventListener("input", renderDirectory);
  $("map-station-locator").addEventListener("change", e => {
    const id=e.target.value;
    if(!id)return;
    selectStation(id);
    mapManager?.selectStation(id,{zoom:true,openPopup:true});
  });
  $("station-period").addEventListener("change", e => {
    selectedPeriod=e.target.value;
    $("map-period").value=selectedPeriod;
    renderProfile(); renderMapStationPanel(); mapManager?.setSelection(selectedPeriod,selectedParameter);
    analyticsManager?.setSelection(selectedStationId,selectedPeriod,selectedParameter);
  });
  $("map-period").addEventListener("change", e => {
    selectedPeriod=e.target.value;
    $("station-period").value=selectedPeriod;
    renderMapStationPanel(); renderProfile(); mapManager?.setSelection(selectedPeriod,selectedParameter);
    analyticsManager?.setSelection(selectedStationId,selectedPeriod,selectedParameter);
  });
  $("map-parameter").addEventListener("change", e => {
    selectedParameter=e.target.value;
    updateCurrentParameter();
    renderMapStationPanel(); mapManager?.setSelection(selectedPeriod,selectedParameter);
    analyticsManager?.setSelection(selectedStationId,selectedPeriod,selectedParameter);
  });
  $("reset-map").addEventListener("click", () => mapManager?.resetView());
  $("show-boundary").addEventListener("change", e => mapManager?.showBoundary(e.target.checked));
  $("show-stations").addEventListener("change", e => mapManager?.showStations(e.target.checked));

  async function start() {
    try {
      const status=document.getElementById('api-status-bar');
      try {
        dataset=await window.LakeWatchAPI.getDataset();
        status.textContent='Connected · Shared database readings · Historical observations, not live sensors';
        status.dataset.state='online';
      } catch (apiError) {
        console.warn('Shared API unavailable. Showing bundled historical snapshot only:',apiError);
        const snapshot=await fetch('data/stations.json',{cache:'no-store'});
        if(!snapshot.ok)throw Error('Neither shared API nor historical snapshot is available');
        dataset=await snapshot.json();
        status.textContent='Offline snapshot · Shared database unavailable · Data updates disabled until the backend reconnects';
        status.dataset.state='offline';
      }
      selectedPeriod = dataset.periods.at(-1);
      if (!Array.isArray(dataset.stations) || !dataset.stations.length) throw new Error("No station records found");
      const activeCount=dataset.stations.filter(s=>s.appStatus==="active").length;
      const archivedCount=dataset.stations.filter(s=>s.appStatus==="archived").length;
      $("overview-station-count").textContent=`${activeCount} / ${archivedCount}`;
      $("overview-status-caption").textContent=`Recent readings through ${monthLabel(dataset.metadata.statusAsOf)}; does not confirm official operation.`;
      $("active-stations-count").textContent=String(activeCount);
      $("archived-stations-count").textContent=String(archivedCount);
      $("map-station-locator").innerHTML='<option value="">Select a station…</option>'+dataset.stations.map(s=>
        `<option value="${safe(s.id)}" ${s.position?'':'disabled'}>Stn. ${safe(s.id)} — ${safe(s.zone)} ${s.position?'':'(unlocated)'}</option>`).join("");
      $("overview-reading-count").textContent=dataset.stations.reduce((total,station)=>total+station.samples.reduce((n,sample)=>n+Object.values(sample.values).filter(x=>x!==null && x!=="").length,0),0);
      // Generate selectors from the dataset so newer reporting periods work everywhere.
      for (const id of ["station-period", "map-period"]) {
        const sel=$(id);
        sel.innerHTML=dataset.periods.map(period=>`<option value="${safe(period)}">${safe(monthLabel(period))}</option>`).join("");
        sel.value=selectedPeriod;
      }
      updateParameterKeys();
      renderDirectory();
      renderProfile();
      renderMapStationPanel();
      $("map-station-locator").value=selectedStationId;
      $("map-status").textContent = "Station records loaded";
      if(["map", "analytics", "explorer", "manage"].includes(currentView)) showView(currentView);
    } catch(error) {
      console.error("Station data not available",error);
      const help="Cannot load data/stations.json. Open the project with VS Code Live Server (http://localhost), not by double-clicking index.html.";
      $("station-directory").textContent=help;
      $("station-profile").textContent=help;
      $("map-selected-station").textContent=help;
      $("map-status").textContent="Station JSON unavailable";
      $("analytics-render-mode").textContent="Dataset unavailable. Start Live Server and reload.";
      $("explorer-table-body").innerHTML='<tr><td colspan="8" class="table-empty">Dataset unavailable. Open with VS Code Live Server and reload.</td></tr>';
      $("explorer-match-count").textContent="Data unavailable";
    }
  }
  window.addEventListener("lakewatch-theme-change",()=>{ if(currentView==="analytics") { analyticsManager?.refresh(); historicalManager?.refresh?.(); } });
  showView("overview");
  start();
})();
