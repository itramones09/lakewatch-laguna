"use strict";
/*
 * LakeWatch map module — location-provenance-aware Leaflet station tags.
 * Published academic coordinates are deliberately differentiated from
 * approximate LLDA-map-derived locations; neither is certified LLDA GPS.
 * Shoreline is explicitly NON-INTERACTIVE so it cannot absorb marker clicks.
 */
window.LakeWatchMap = (() => {
  const lakeBounds = [[14.12,121.00],[14.61,121.58]];
  const esc = v => String(v == null ? "" : v)
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
  const validRegion = geom => {
    if (!geom || !(geom.type==='Polygon'||geom.type==='MultiPolygon')) return false;
    const points=[];
    function collect(node) {
      if(Array.isArray(node)&&typeof node[0]==='number')points.push(node);
      else if(Array.isArray(node))node.forEach(collect);
    }
    collect(geom.coordinates);
    return points.length>=15 && points.some(([lon,lat])=>lon>121.0&&lon<121.6&&lat>14.1&&lat<14.6);
  };
  function create({mapElement,onSelectStation,onCoordinate,onStatus,onBoundary}) {
    let map=null;
    let activeBaseLayer=null;
    let selectedBasemap='street';
    let streetLayer=null, satelliteLayer=null;
    const mapFrame=document.getElementById('lake-map-frame');
    const expandButton=document.getElementById('map-expand-view');
    const exitButton=document.getElementById('map-expanded-close');
    const basemapButtons=[...document.querySelectorAll('[data-map-basemap]')];
    let boundaryLayer=null;
    let stationLayer=null;
    let incidentLayer=null;
    let incidentReports=[];
    let incidentsVisible=true;
    const markers=new Map();
    let dataset=null;
    let currentStation='I', currentPeriod='2026-06', currentParameter='do';
    let showOutline=true, showPins=true, sizeChecked=false;

    const currentParam=()=>dataset?.parameters.find(p=>p.id===currentParameter);
    const sample=(station)=>station.samples.find(x=>x.period===currentPeriod);
    const sourceConfidence=s=>s.coordinateAccuracy==='published-research'
      ? 'Published research coordinates (rounded to 0.001°; not certified LLDA GPS)'
      : 'Approximate regional placement (not a measured location)';
    const locationClass=s=>s.appStatus==='archived'?'is-archived':
      s.coordinateAccuracy==='published-research'?'is-published':'is-approx';
    function icon(s,selected) {
      return L.divIcon({
        className:`lw-station-icon ${locationClass(s)} ${selected?'is-selected':''}`,
        iconSize:[42,42],iconAnchor:[21,21],popupAnchor:[0,-17],
        tooltipAnchor:[0,-17],
        html:`<span class="lw-pin-hit" data-parameter="${esc(currentParameter)}" aria-hidden="true"><span class="lw-pin-tag">${esc(s.id)}</span></span>`
      });
    }
    function popup(s){
      const p=currentParam(), record=sample(s), raw=record?.values?.[currentParameter];
      const reported=raw===undefined||raw===null||raw===''?'No reading in selected month':
        `${String(raw)}${p.unit==='pH units'?'':' '+p.unit}`;
      return `<div class="station-popup">
        <strong>Station ${esc(s.id)} — ${esc(s.zone)}</strong>
        <p><b>Reporting status:</b> ${s.appStatus==='active'?'Recent imported readings':'Archived in this app (no recent imported readings)'}</p>
        <p>${window.LakeWatchPalette.badge(p.id,p.short)} (${esc(currentPeriod)}): <strong>${esc(reported)}</strong></p>
        <p class="confidence">${esc(sourceConfidence(s))}</p>
        <button type="button" class="button button--primary" data-popup-station="${esc(s.id)}">Open station profile</button>
        <small>Historical LLDA measurements, not real-time data.</small></div>`;
    }
    function updateMarkers() {
      if(!dataset || !map)return;
      for(const s of dataset.stations){
        const m=markers.get(s.id);
        if(!m)continue;
        m.setIcon(icon(s,s.id===currentStation));
        m.setPopupContent(popup(s));
        const p=currentParam(), raw=sample(s)?.values?.[currentParameter];
        const value=raw===undefined?'No measurement':String(raw);
        m.setTooltipContent(`Station ${s.id} · ${s.zone} · ${value}${raw===undefined||p.unit==='pH units'?'':' '+p.unit}`);
        m.setZIndexOffset(s.id===currentStation?1500:0);
      }
    }
    function addStations(){
      stationLayer=L.layerGroup();
      for(const s of dataset.stations){
        const pos=s.position;
        if(!pos||!Number.isFinite(pos.lat)||!Number.isFinite(pos.lon))continue;
        // Leaflet markers use keyboard focus, descriptive titles and generous 42px targets.
        const marker=L.marker([pos.lat,pos.lon],{
          icon:icon(s,s.id===currentStation),title:`Station ${s.id}: ${s.zone}`,
          alt:`Station ${s.id} monitoring location`,keyboard:true,
          riseOnHover:true,riseOffset:1800,bubblingMouseEvents:false
        });
        marker.bindPopup(popup(s),{autoPan:true,closeButton:true});
        marker.bindTooltip(`Station ${s.id}: ${s.zone}`,{direction:'top',opacity:.95});
        marker.on('click',()=>{
          currentStation=s.id;
          onSelectStation(s.id);
          updateMarkers();
          marker.openPopup();
        });
        marker.addTo(stationLayer);
        markers.set(s.id,marker);
      }
      stationLayer.addTo(map);
      updateMarkers();
    }
    function replaceBoundary(geojson,verified){
      try{
        const layer=L.geoJSON(geojson,{
          interactive:false, // Key fix: geometry does not block station tags.
          style:{color:verified?'#007e92':'#e2a226',weight:verified?3:2.5,
            fillColor:verified?'#22b7c5':'#e9ba59',fillOpacity:verified?.11:.12,
            dashArray:verified?undefined:'7 6',interactive:false}
        });
        if(!layer.getLayers().length||!layer.getBounds().isValid())return false;
        if(boundaryLayer)map.removeLayer(boundaryLayer);
        boundaryLayer=layer;
        if(showOutline)layer.addTo(map);
        // Keep tagged station markers above other geometry even as layers refresh.
        if(showPins&&stationLayer)stationLayer.bringToFront?.();
        onBoundary(verified?'OSM lake shoreline loaded. Map markers show coordinate-source confidence.':
          'Dashed schematic shoreline (approximate); attempting OpenStreetMap boundary…');
        return true;
      }catch(err){console.warn('Boundary geometry rejected',err);return false;}
    }
    async function loadBoundary(){
      let fallback=null;
      try{
        const response=await fetch('data/lake-schematic.geojson');
        if(!response.ok)throw Error(`HTTP ${response.status}`);
        fallback=await response.json();
        replaceBoundary(fallback,false);
      }catch(err){onBoundary('Shoreline overlay unavailable; the OpenStreetMap lake is still visible.');}
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),11000);
      try{
        const url='https://nominatim.openstreetmap.org/lookup?osm_ids=R79348&format=geojson&polygon_geojson=1&polygon_threshold=0.001';
        const response=await fetch(url,{signal:controller.signal});
        if(!response.ok)throw Error(`HTTP ${response.status}`);
        const body=await response.json();
        const features=body.type==='FeatureCollection'?body.features:body.type==='Feature'?[body]:[];
        const good=features.find(x=>validRegion(x.geometry));
        if(!good)throw Error('No valid shoreline geometry');
        replaceBoundary(good,true);
      }catch(err){
        console.warn('OSM geometry unavailable; schematic remains',err);
        onBoundary(fallback?'Dashed amber shoreline is a schematic, not a surveyed boundary.':
          'Shoreline overlay unavailable; use the OpenStreetMap base map.');
      }finally{clearTimeout(timer);}
    }
    function redrawIncidents(){
      if(!map||typeof L==='undefined')return;
      if(incidentLayer){map.removeLayer(incidentLayer);incidentLayer=null;}
      incidentLayer=L.layerGroup();
      for(const r of incidentReports){
        const station=dataset?.stations.find(s=>s.id===r.stationId);
        if(!station?.position)continue;
        const marker=L.circleMarker([station.position.lat,station.position.lon],{
          radius:9,color:'#c25822',weight:3,fillColor:'#ffbc67',fillOpacity:.9,bubblingMouseEvents:false
        });
        marker.bindPopup(`<div class="station-popup"><strong>${esc(r.title)}</strong><p>${esc(r.eventDate)} · ${esc(r.incidentType.replaceAll('_',' '))}</p><p>${esc(r.description)}</p><p>Location shown at Station ${esc(r.stationId)} as a geographic reference only; the event site is not surveyed.</p><small>Administrator-documented report; not independently confirmed by LLDA.</small></div>`);
        marker.bindTooltip(`Incident report near station ${r.stationId}: ${r.title}`);
        marker.addTo(incidentLayer);
      }
      if(incidentsVisible)incidentLayer.addTo(map);
    }
    function setIncidentReports(rows){incidentReports=Array.isArray(rows)?rows:[];redrawIncidents();}
    function showIncidents(v){incidentsVisible=v;if(!map||!incidentLayer)return;v?incidentLayer.addTo(map):map.removeLayer(incidentLayer);}
    function safeGetMapPreference(){
      try{return localStorage.getItem('lakewatch-map-basemap')==='satellite'?'satellite':'street';}
      catch{return 'street';}
    }
    function saveMapPreference(mode){
      try{localStorage.setItem('lakewatch-map-basemap',mode);}catch{}
    }
    function setBasemap(mode){
      if(mode!=='street' && mode!=='satellite')return;
      selectedBasemap=mode;
      basemapButtons.forEach(button=>{
        const current=button.dataset.mapBasemap===mode;
        button.classList.toggle('is-current',current);
        button.setAttribute('aria-pressed',String(current));
      });
      if(map){
        const next=mode==='satellite'?satelliteLayer:streetLayer;
        if(next && next!==activeBaseLayer){
          if(activeBaseLayer)map.removeLayer(activeBaseLayer);
          activeBaseLayer=next.addTo(map);
        }
      }
      saveMapPreference(mode);
    }
    function updateMapViewport(){
      if(!map)return;
      requestAnimationFrame(()=>map.invalidateSize({pan:false}));
      setTimeout(()=>map.invalidateSize({pan:false}),190);
    }
    function setExpanded(expanded){
      if(!mapFrame)return;
      mapFrame.classList.toggle('is-expanded',expanded);
      document.body.classList.toggle('lake-map-expanded',expanded);
      if(expandButton){
        expandButton.setAttribute('aria-pressed',String(expanded));
        expandButton.title=expanded?'Exit expanded map':'Expand the interactive map';
        const text=expandButton.querySelector('.expand-text');
        if(text)text.textContent=expanded?'Exit expanded map':'Expand map';
      }
      if(exitButton)exitButton.hidden=!expanded;
      updateMapViewport();
    }
    if(exitButton)exitButton.hidden=true;
    exitButton?.addEventListener('click',()=>{setExpanded(false);expandButton?.focus();});
    basemapButtons.forEach(button=>button.addEventListener('click',()=>setBasemap(button.dataset.mapBasemap)));
    expandButton?.addEventListener('click',()=>setExpanded(!mapFrame?.classList.contains('is-expanded')));
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape' && mapFrame?.classList.contains('is-expanded')){
        setExpanded(false);expandButton?.focus();
      }
    });
    function initialize(data,stationId,period,param){
      dataset=data;currentStation=stationId;currentPeriod=period;currentParameter=param;
      if(map)return;
      if(typeof L==='undefined'){onStatus('Leaflet did not load. Check internet access.');return;}
      map=L.map(mapElement,{zoomControl:true,scrollWheelZoom:true,preferCanvas:false});
      map.fitBounds(lakeBounds,{padding:[16,16]});
      streetLayer=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
        maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).on('tileerror',()=>{
        if(selectedBasemap==='street')onStatus('Street map tiles could not load — check internet connection');
      });
      satelliteLayer=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{
        maxZoom:19,
        attribution:'Satellite tiles &copy; <a href="https://www.esri.com" target="_blank" rel="noopener noreferrer">Esri</a>, Vantor, Earthstar Geographics and GIS contributors'
      }).on('tileerror',()=>{
        if(selectedBasemap==='satellite')onStatus('Satellite imagery is unavailable. Try Street view.');
      });
      setBasemap(safeGetMapPreference());
      L.control.scale({imperial:false}).addTo(map);
      map.on('click',({latlng})=>onCoordinate(`${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`));
      addStations();
      redrawIncidents();
      const verified=dataset.stations.filter(s=>s.position&&s.coordinateAccuracy==='published-research').length;
      const approx=dataset.stations.filter(s=>s.position&&s.coordinateAccuracy!=='published-research').length;
      onStatus(`${markers.size} station tags: ${verified} published-coordinate and ${approx} approximate-area pins; ${dataset.stations.length-markers.size} unlocated`);
      const countNode=document.getElementById('map-location-summary');
      if(countNode)countNode.textContent=`${markers.size} mapped lake stations · ${verified} research-coordinate locations · ${approx} approximate areas · ${dataset.stations.length-markers.size} unlocated records`;
      loadBoundary();
    }
    function selectStation(id,{zoom=false,openPopup=false}={}){
      currentStation=id;
      updateMarkers();
      const m=markers.get(id);
      if(m&&map){
        if(zoom){
          map.setView(m.getLatLng(),Math.max(map.getZoom(),11),{animate:true});
        }
        if(openPopup)m.openPopup();
      }
    }
    function setSelection(period,param){currentPeriod=period;currentParameter=param;updateMarkers();}
    function showBoundary(v){showOutline=v;if(!map||!boundaryLayer)return;v?boundaryLayer.addTo(map):map.removeLayer(boundaryLayer);}
    function showStations(v){showPins=v;if(!map||!stationLayer)return;v?stationLayer.addTo(map):map.removeLayer(stationLayer);}
    function resetView(){map?.fitBounds(lakeBounds,{padding:[16,16]});}
    function invalidateSize(){if(!map)return;map.invalidateSize();if(!sizeChecked){resetView();sizeChecked=true;} else updateMapViewport();}
    return {initialize,selectStation,setSelection,showBoundary,showStations,showIncidents,setIncidentReports,resetView,invalidateSize};
  }
  return {create};
})();
