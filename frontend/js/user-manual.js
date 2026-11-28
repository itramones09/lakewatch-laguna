"use strict";
/*
 * User Manual — a non-modal floating workspace.
 * It does not trap focus, blur the page, or prevent interacting with main navigation.
 */
(() => {
  const fullGuides = [
    {
      id: "overview", label: "Overview", kicker: "Start here", title: "Environmental Overview",
      summary: "Your starting point for understanding Laguna de Bay's monitored areas, available parameters and historical coverage.",
      steps: [
        ["Review the summary cards", "Check the station counts, latest reporting period and number of imported monthly values. These describe the dataset, not live sensor activity."],
        ["Choose a water-quality parameter", "Click one of the six color-coded parameter shortcuts to open its charts and interpretation in Analytics."],
        ["Choose a task", "Use the task cards to find a station, explore the map, compare observations or create a PDF report."],
        ["Navigate by category", "Use Explore, Analysis & Reports, Administration, or Help & Information in the grouped navigation. Photo Gallery is a direct main-menu button. The breadcrumb shows your current module."],
        ["Switch appearance", "Use the sun/moon button in the header to toggle light and dark mode. Your choice is saved in this browser when storage is available."],
        ["Open module-specific guidance", "Open Help & Information → Open User Manual, then choose the module tab. The floating manual stays open while you navigate. Choose a tab or Open module; minimize, restore, close or drag the header on desktop."],
      ],
      tip: "Parameter colors identify measurement types—not whether the lake water is safe or unsafe."
    },
    {
      id: "map", label: "Lake Map", kicker: "Explore the geography", title: "Interactive Lake Map & Incident Watch",
      summary: "Locate reporting areas, explore the lake boundary and view readings for a selected month and parameter.",
      steps: [
        ["Choose the reporting month", "Use the Reporting month selector in Map Controls. The station values will update to the available measurements for that month."],
        ["Choose the parameter", "Use Parameter shown on markers to change which measurement is displayed on station tags."],
        ["Find a monitoring station", "Type a station identifier or lake bay into Find a station. The station selector narrows to matching entries; choose a located station to zoom to it."],
        ["Select a monitoring station", "Click a station tag on the larger map, or choose it from the filtered station selector. The Selected Station card will update."],
        ["Expand the map", "Choose Expand map for a larger view; choose Exit expanded map or press Escape to return."],
        ["Adjust map layers", "Use the Street/Satellite switch on the map to change the base layer, and the checkboxes below to control shoreline, station markers and incident locations."],
        ["Open the full profile", "Select Open Station Profile from the selected-station card to navigate to Monitoring Stations."],
        ["Inspect or submit incidents", "Scroll to Incident reporting to read dated source-documented incidents. Authorized administrators can sign in and publish a sourced report."],
      ],
      tip: "Green tags indicate published research coordinates; amber tags indicate approximate areas. These are not certified LLDA sampling GPS positions. Incident markers represent monitoring areas, not surveyed event coordinates."
    },
    {
      id: "stations", label: "Stations", kicker: "Study one location", title: "Monitoring Stations",
      summary: "Browse station identifiers, examine historical measurements and read individual parameter interpretations.",
      steps: [
        ["Choose Active or Archived", "Select Active Stations to see entries with recent imported readings. Choose Archived Stations to see references without recent imported readings; archived does not confirm closure."],
        ["Find a monitoring area", "Use Search by station ID or lake bay, then select a station from the directory."],
        ["Select a sampling period", "Set View measurements from to the month you want to investigate."],
        ["Read the six measurements", "Inspect the parameter cards. Missing observations and values such as <0.1 are displayed as reported, not converted to zero."],
        ["Interpret the selected value", "Use the Parameter Interpretation panel in the station profile to see what a measurement can indicate and what it cannot establish."],
        ["Check provenance or open another view", "Expand Station history and location sources; use Export station PDF report or Find station on map when available."],
      ],
      tip: "Station status is based on imported data availability, not an independent LLDA statement that the station is currently operational."
    },
    {
      id: "analytics", label: "Analytics", kicker: "Analyze the readings", title: "Water Quality Analytics",
      summary: "Explore trends, compare stations from matching dates, review the historical archive and evaluate cautious predictive models.",
      steps: [
        ["Set the main chart filters", "Choose Monitoring station, Water quality parameter and Comparison month. The historical trend and comparison views will respond."],
        ["Inspect exact values", "Open View exact station values under the charts. The tables preserve missing and below-reporting-limit labels."],
        ["Explore the extended historical archive", "Choose DO, BOD, pH, nitrate, phosphate or TSS and a station in Extended Historical Archive (1990–June 2026). BOD/TSS include annual records; the others have available monthly observations only. Lake-wide annual (1990–2000), station annual (2009–2012) and monthly (2020, 2023 and 2026) series remain separate. Missing years stay blank. Expand plotted source readings and Historical data sources to verify coverage."],
        ["Compare several stations", "Under Multi-station comparison, choose a parameter and month. Check stations individually, or use Select All with Readings. Use Unselect All to clear the selection."],
        ["Review predictive analytics", "Choose a model dataset, parameter and station (if applicable), then click Evaluate forecast. The tool may report insufficient data rather than estimate a current value."],
        ["Open station or export report", "Use Station Profile, Show on Map, or Export PDF to continue working with the selected observation."],
      ],
      tip: "Only compare readings with the same date, parameter and compatible units. Predictive estimates are academic demonstrations, not official water-quality forecasts."
    },
    {
      id: "explorer", label: "Data Explorer", kicker: "Find and export records", title: "Data Explorer",
      summary: "Search the imported water-quality table, sort observations and export the selected records as CSV.",
      steps: [
        ["Refine the dataset", "Use Monitoring station, Parameter, Reporting month and Reading classification to narrow the observations."],
        ["Search within records", "Type into Search records to find a station, bay, month, parameter or reading."],
        ["Sort the table", "Click a column heading such as Station, Month or Reading to change the sort order."],
        ["Change the number of rows", "Use Rows per page and the Previous/Next controls to browse large result sets."],
        ["Open a station", "Choose View in a record to open its Monitoring Stations profile."],
        ["Export what you filtered", "Click Export Filtered CSV to download all matching records, not just the current page."],
      ],
      tip: "A below-limit reading such as <0.1 is not an exact numeric value of 0 or 0.1. Source details may differ between bundled records and administrator updates."
    },
    {
      id: "context", label: "Lake Context", kicker: "Beyond lake samples", title: "Lake Context & Environmental Datasets",
      summary: "View atmospheric reference conditions and separately documented lake-level, tributary and temperature measurements.",
      steps: [
        ["Inspect the context cards", "Review precipitation total, mean air temperature and number of available weather days."],
        ["Read the weather chart", "The Rainfall and air temperature chart uses historical Open-Meteo atmospheric data near the lake."],
        ["Refresh available observations", "Use Refresh weather context to request updated available source values."],
        ["Browse curated datasets", "Review cited contextual observations in Curated environmental datasets. These are separate from LLDA laboratory water-quality readings."],
        ["Add a sourced context record", "Authorized administrators may use the Admin sign-in popup, then enter observation date, dataset type, site, measured value and original reference."],
      ],
      tip: "Air temperature is not lake water temperature; contextual weather estimates do not prove that a given water-quality reading had a particular cause."
    },
    {
      id: "reports", label: "Reports", kicker: "Prepare a document", title: "Water Quality Reports",
      summary: "Create a professional PDF with the observations, dates and available provenance notes you select.",
      steps: [
        ["Station water quality summary", "Choose monthly, quarterly or annual reporting frequency and period. Station summary shows exact monthly values or available-month means; Individual monthly values preserves each reading. Download CSV or Print / Save summary PDF. Check coverage and qualifiers."],
        ["Choose report scope", "Select Selected monitoring station or All reporting stations."],
        ["Set station and period", "If you chose one station, choose it; then set Reporting month and Parameter (or All six parameters)."],
        ["Select optional sections", "Use Include incident summary and Include contextual-data summary as appropriate."],
        ["Preview the document", "Click Preview report and review the observation table, title, dates and notes."],
        ["Download the PDF", "Click Download PDF report. With the live backend connected, FastAPI generates the source-labeled PDF."],
      ],
      tip: "Review the PDF before sharing it. The report presents historical sources and limitations; it is not an official LLDA certification."
    },
    {
      id: "manage", label: "Manage Data", kicker: "Administrator workspace", title: "Manage Data",
      summary: "Authorized administrators can review and publish source-documented observations to the shared database.",
      steps: [
        ["Sign in", "Click Admin sign in in the site header. Enter the credentials configured in Render. The login popup opens without navigating away from your current module."],
        ["Open Manage Data", "Choose Manage Data in the main navigation once authenticated."],
        ["Choose how to add data", "Select Manual entry, Import CSV / Excel file, or Import data from URL."],
        ["Document the original reference", "Manual/file updates can use Online publication (source URL) or Offline / printed document (issuing organization and publication date). A direct URL import uses its URL automatically."],
        ["Prepare a validation preview", "Enter a reported reading or import a compatible file/data URL; click the corresponding Preview button. Check source information, duplicates, corrections and invalid rows."],
        ["Approve carefully", "If correcting a previously published reading, explicitly allow administrator-approved corrections; then select Save validated readings."],
        ["Verify and preserve data", "Check the published result in Data Explorer/Analytics, review Shared change history, and periodically download a shared JSON backup."],
      ],
      tip: "Do not publish invented or uncited measurements. Manage Data is protected; public visitors may browse the datasets but cannot save changes."
    },
    {
      id: "gallery", label: "Photo Gallery", kicker: "Explore lake photographs", title: "Laguna de Bay Photo Gallery",
      summary: "Browse an expanding collection of real lake and shoreline photographs credited to Wikimedia Commons contributors.",
      steps: [
        ["Open the Photo Gallery", "Select Photo Gallery directly from the main menu bar."],
        ["Browse the carousel", "The center photo rotates automatically every 4.2 seconds when the gallery is visible. Side previews show nearby photos in perspective. Hover to temporarily pause; use Pause rotation or Play rotation to control playback."],
        ["Navigate manually", "Use the arrows, Left/Right keys when the preview region has focus, or swipe horizontally. Manual navigation pauses rotation. Photos wrap around the loaded matching collection."],
        ["Filter photographs", "Use All photos, Lake views, Lakeside life, or Sunsets. Search matches photos already loaded. Filtering or searching pauses rotation; select Play rotation to resume."],
        ["Retrieve more photographs", "Select Load more photographs to request additional lake-focused Wikimedia Commons records."],
        ["Enlarge and credit a photo", "Select the center image to open its enlarged viewer. Use its arrows or Left/Right keys to browse matching photos; close with Escape or the close button. Source and license links identify the creator and reuse conditions."],
      ],
      tip: "The gallery uses externally hosted photographs and internet access, including featured photo URLs. Automatic rotation is initially off if your device requests reduced motion. Photos illustrate Laguna de Bay; they are not measurements of water quality."
    },
    {
      id: "about", label: "About & Sources", kicker: "Methods and references", title: "About & Sources",
      summary: "Understand the project, the developers, data methodology and the publications used in LakeWatch Laguna.",
      steps: [
        ["Read Academic Context", "The first card lists the university campus, MIT program, course and project developers."],
        ["Review purpose and capabilities", "Read Project purpose and What you can do to understand the application's scope."],
        ["Understand limitations", "Read Data stewardship and Environmental intelligence. Expand Data methodology & limitations for dates, station chronology and coordinate reliability."],
        ["Visit the official LLDA site", "Below Academic Context, use Visit LLDA official website to open https://llda.gov.ph/ in a new tab. LakeWatch is an independent academic project, not an official LLDA service."],
        ["Open source references", "Photo Gallery is now a separate main-menu module, and parameter colors are explained in Overview. Use the grouped References & source library card to open original LLDA reports, guidelines, geographic references and technical documentation."],
      ],
      tip: "The website is live, but its water-quality measurements are not a live LLDA sensor feed."
    }
  ];

  const liteGuides = fullGuides.filter(g=>window.LakeWatchMode.allowsLite(g.id)).map(g=>{
    const steps = {
      overview: [["Review the overview", "Check the reporting stations and latest reporting period."],["Choose a parameter", "Open charts using one of the six parameter shortcuts."],["Navigate", "Use Explore for the map and stations, Analysis for charts, and Help & Information for references and this guide."]],
      map: [["Choose month and parameter", "Use Map Controls to select the measurement shown on markers."],["Explore the map", "Zoom, pan, toggle the boundary or station layer, and select a marker."],["Open a station", "Read the selected station card or open its profile."]],
      stations: [["Find a station", "Search by identifier or lake bay and select a station."],["Select a month", "Choose an available reporting period."],["Read six parameters", "Review the values, units and interpretation. Missing readings are not zero."]],
      analytics: [["Choose filters", "Select a station, parameter and comparison month."],["Read charts", "Review the station trend and compare stations for matching periods."],["Inspect exact values", "Use the source-value tables to check missing and qualified readings."]],
      about: [["Read Academic Context", "Review the project purpose and academic information."],["Visit LLDA", "Use the official LLDA website link."],["Review sources", "Open the references and methodology to understand data and map limitations."]]
    };
    const summaries={overview:"Start with the map, station readings or charts.",map:"Explore Laguna de Bay and its monitoring locations.",stations:"Review available measurements and interpretations.",analytics:"Visualize and compare reported water-quality observations.",about:"Review academic context, source references and limitations."};
    return {...g,title:g.id==='map'?'Interactive Lake Map':g.title,summary:summaries[g.id],steps:steps[g.id],tip:g.id==='map'?'Station coordinates are approximate, not certified LLDA sampling GPS positions.':g.id==='analytics'?'Compare like parameters, dates and units.':g.tip};
  });
  let guides = window.LakeWatchMode.isFull()?fullGuides:liteGuides;
  let lookup = new Map(guides.map(item => [item.id, item]));
  const escapeText = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  const win = document.getElementById('user-manual-window');
  const restore = document.getElementById('manual-restore');
  const tabs = document.getElementById('manual-tabs');
  const body = document.getElementById('manual-content');
  const loc = document.getElementById('manual-current-location');
  const go = document.getElementById('manual-open-module');
  const dragHandle = document.getElementById('manual-drag-handle');
  if (!win || !tabs || !body || !restore) return;

  let active = 'overview';
  let lastFocus = null;
  const currentMainModule = () => document.querySelector('.site-nav .nav-btn.is-active')?.dataset.view || 'overview';

  function renderGuide(id, options={}) {
    const guide = lookup.get(id) || lookup.get('overview');
    active = guide.id;
    for(const tab of tabs.querySelectorAll('[data-manual-tab]')){
      const selected = tab.dataset.manualTab === active;
      tab.classList.toggle('is-selected', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    body.innerHTML = `<div class="manual-intro">
        <span class="manual-kicker">${escapeText(guide.kicker)}</span>
        <h3>${escapeText(guide.title)}</h3><p>${escapeText(guide.summary)}</p>
      </div>
      <div class="manual-steps-title"><strong>How to use this module</strong><span>${guide.steps.length} steps</span></div>
      <ol class="manual-steps">${guide.steps.map(([title, desc], i) => `<li><span class="manual-step-number" aria-hidden="true">${i + 1}</span><div><h4>${escapeText(title)}</h4><p>${escapeText(desc)}</p></div></li>`).join('')}</ol>
      <div class="manual-tip"><strong>Useful note</strong><p>${escapeText(guide.tip)}</p></div>`;
    loc.textContent = `${guide.label} guide`;
    go.textContent = `Open ${guide.label} module ↗`;
    go.dataset.module = guide.id;
    if (options.resetScroll !== false) body.scrollTop = 0;
    tabs.querySelector(`[data-manual-tab="${guide.id}"]`)?.scrollIntoView({block:'nearest',inline:'nearest'});
  }

  function rebuildTabs(){ tabs.innerHTML = guides.map(guide => `<button type="button" id="manual-tab-${guide.id}" class="manual-tab" data-manual-tab="${guide.id}" role="tab" aria-controls="manual-content" aria-selected="false" tabindex="-1">${escapeText(guide.label)}</button>`).join(''); }
  rebuildTabs();
  window.addEventListener('lakewatch-mode-change',()=>{
    guides=window.LakeWatchMode.isFull()?fullGuides:liteGuides;
    lookup=new Map(guides.map(g=>[g.id,g]));
    rebuildTabs(); renderGuide(lookup.has(active)?active:'overview');
  });

  function show(id=currentMainModule()){
    lastFocus = document.activeElement;
    win.hidden = false;
    restore.hidden = true;
    renderGuide(id);
    tabs.querySelector(`[data-manual-tab="${active}"]`)?.focus({preventScroll:true});
  }
  function close(){
    win.hidden = true;
    restore.hidden = true;
    if (lastFocus?.isConnected) lastFocus.focus({preventScroll:true});
  }
  function minimize(){
    win.hidden = true;
    restore.hidden = false;
    restore.focus({preventScroll:true});
  }
  function followView(id) {
    // Follow actual navigation without closing or moving the floating guide.
    if (!win.hidden && lookup.has(id)) renderGuide(id);
  }

  // Clicking non-interactive guide content makes the floating window active.
  win.addEventListener('pointerdown', e=>{
    if(!e.target.closest('button,a,input,select,textarea,[tabindex]'))win.focus({preventScroll:true});
  });
  restore.addEventListener('click', () => show(active));
  document.getElementById('manual-close')?.addEventListener('click', close);
  document.getElementById('manual-minimize')?.addEventListener('click', minimize);
  tabs.addEventListener('click', e => {
    const btn=e.target.closest('[data-manual-tab]');
    if(btn)renderGuide(btn.dataset.manualTab);
  });
  tabs.addEventListener('keydown', e => {
    const key=e.key;
    if (!['ArrowRight','ArrowLeft','Home','End'].includes(key)) return;
    e.preventDefault();
    const idx=guides.findIndex(g=>g.id===active);
    const next = key==='Home' ? 0 : key==='End' ? guides.length-1 : (idx+(key==='ArrowRight'?1:-1)+guides.length)%guides.length;
    renderGuide(guides[next].id);
    tabs.querySelector(`[data-manual-tab="${active}"]`)?.focus({preventScroll:true});
  });
  go.addEventListener('click',()=>{
    const target=go.dataset.module;
    const nav=document.querySelector(`.site-nav [data-view="${target}"]`);
    nav?.click();
  });
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-manual-open]');
    if(btn){
      const id=btn.dataset.manualOpen;
      show(lookup.has(id)?id:currentMainModule());
    }
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && !win.hidden && !document.querySelector('dialog[open]')){
      e.preventDefault();close();
    }
  });

  // Optional dragging on desktop. Mouse-only physical positioning; keyboard users
  // can always access all content and main navigation without dragging.
  let drag=null;
  dragHandle?.addEventListener('pointerdown',e=>{
    if(e.button!==0 || window.innerWidth<=700 || e.target.closest('button'))return;
    const rect=win.getBoundingClientRect();
    drag={x:e.clientX,y:e.clientY,left:rect.left,top:rect.top};
    dragHandle.setPointerCapture?.(e.pointerId);
  });
  dragHandle?.addEventListener('pointermove',e=>{
    if(!drag)return;
    const left=Math.min(Math.max(8,drag.left+(e.clientX-drag.x)),window.innerWidth-win.offsetWidth-8);
    const top=Math.min(Math.max(8,drag.top+(e.clientY-drag.y)),window.innerHeight-90);
    Object.assign(win.style,{left:`${left}px`,top:`${top}px`,right:'auto',bottom:'auto'});
  });
  const endDrag=()=>drag=null;
  dragHandle?.addEventListener('pointerup',endDrag);
  dragHandle?.addEventListener('pointercancel',endDrag);
  window.addEventListener('resize',()=>{
    if(window.innerWidth<=700){win.style.removeProperty('left');win.style.removeProperty('top');win.style.removeProperty('right');win.style.removeProperty('bottom');}
    else if(win.style.left){
      const r=win.getBoundingClientRect();
      win.style.left=`${Math.max(8,Math.min(r.left,window.innerWidth-r.width-8))}px`;
      win.style.top=`${Math.max(8,Math.min(r.top,window.innerHeight-90))}px`;
    }
  });
  window.LakeWatchManual = {show, close, followView, activeGuide:()=>active};
})();
