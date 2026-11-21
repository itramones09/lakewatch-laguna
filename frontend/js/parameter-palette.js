"use strict";
/* Parameter identity colors only. Never infer compliance or health from a color. */
window.LakeWatchPalette = (() => {
  const ids = ["do", "bod", "ph", "nitrate", "phosphate", "tss"];
  const fallback = {
    do: "#126baf", bod: "#ba5420", ph: "#874cb0",
    nitrate: "#0c8063", phosphate: "#b73f77", tss: "#8b6d18"
  };
  const safeId = id => ids.includes(id) ? id : "do";
  function color(id) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(`--param-${safeId(id)}`).trim();
    return value || fallback[safeId(id)];
  }
  function badge(id, label) {
    const param=safeId(id);
    const text=String(label || param).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
    return `<span class="parameter-badge" data-parameter="${param}"><span class="parameter-dot" aria-hidden="true"></span>${text}</span>`;
  }
  function legend(parameters, {clickable = false} = {}) {
    return parameters.map(p => clickable ?
      `<button type="button" class="parameter-shortcut" data-parameter="${safeId(p.id)}" data-parameter-quick="${safeId(p.id)}" aria-label="Explore ${p.name} in Analytics"><span class="parameter-dot" aria-hidden="true"></span><span><strong>${p.short || p.name}</strong><small>${p.name}</small></span><span aria-hidden="true">↗</span></button>`:
      badge(p.id,p.short || p.name)
    ).join("");
  }
  return Object.freeze({ids,color,badge,legend,safeId});
})();
