'use strict';
window.LakeWatchAPI = (() => {
  const base = (window.LAKEWATCH_API_BASE_URL || '').replace(/\/+$/, '');
  const key = 'lakewatch-admin-session-v1';
  const storage = () => { try { return window.sessionStorage; } catch { return null; } };
  const token = () => storage()?.getItem(key) || '';
  const saveToken = value => { if (value) storage()?.setItem(key, value); else storage()?.removeItem(key); };
  const connected = () => Boolean(base && /^https?:\/\//.test(base));
  async function request(path, {method='GET', body, auth=false}={}) {
    if (!connected()) throw new Error('Configure the public Render API URL in js/api-config.js.');
    const headers = {Accept:'application/json'};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) {
      if (!token()) throw new Error('Please sign in as administrator.');
      headers.Authorization = `Bearer ${token()}`;
    }
    let response;
    try { response = await fetch(`${base}${path}`, {method, headers, body:body===undefined?undefined:JSON.stringify(body), cache:'no-store'}); }
    catch { throw new Error(`Cannot reach the backend (${base}). Check Render, network access, and CORS settings.`); }
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status===401 && auth) saveToken('');
      const detail = result.detail;
      const msg = typeof detail==='string'?detail:(detail?.message || JSON.stringify(detail || `HTTP ${response.status}`));
      throw new Error(msg);
    }
    return result;
  }
  return {
    base, token, saveToken, connected, request,
    getDataset: () => request('/api/dataset'),
    login: (email,password) => request('/api/auth/login',{method:'POST',body:{email,password}}),
    me: () => request('/api/auth/me',{auth:true}),
    saveBatch: (readings,allowReplace) => request('/api/observations/batch',{method:'POST',auth:true,body:{readings,allowReplace}}),
    audit: () => request('/api/audit',{auth:true}),
    export: () => request('/api/observations/export',{auth:true})
  };
})();
