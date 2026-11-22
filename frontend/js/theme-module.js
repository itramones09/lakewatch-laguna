"use strict";
/* One-click light/dark theme toggle. The legacy system preference follows the OS until toggled. */
(() => {
  const storageKey = 'lakewatch-appearance';
  const root = document.documentElement;
  const systemPreference = window.matchMedia?.('(prefers-color-scheme: dark)');

  function savedPreference() {
    let pref = root.dataset.themePreference || 'system';
    return ['light', 'dark', 'system'].includes(pref) ? pref : 'system';
  }

  function applyTheme(preference) {
    const resolved = preference === 'system'
      ? (systemPreference?.matches ? 'dark' : 'light')
      : preference;
    root.dataset.themePreference = preference;
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;

    const button = document.getElementById('theme-toggle');
    if (button) {
      const action = resolved === 'dark' ? 'light' : 'dark';
      button.setAttribute('aria-label', `Switch to ${action} mode`);
      button.title = `Switch to ${action} mode`;
      button.dataset.mode = resolved;
    }

    // Preserve the event consumed by charts and other responsive components.
    window.dispatchEvent(new CustomEvent('lakewatch-theme-change', {
      detail: { preference, resolved }
    }));
  }

  function initialize() {
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    applyTheme(savedPreference());

    button.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(storageKey, next); } catch (_) { /* Theme still works without storage. */ }
      applyTheme(next);
      const status = document.getElementById('theme-toggle-status');
      if (status) status.textContent = `${next === 'dark' ? 'Dark' : 'Light'} mode enabled`;
    });

    // Respect a previously saved System preference until someone clicks the toggle.
    const syncSystem = () => {
      if (savedPreference() === 'system') applyTheme('system');
    };
    if (systemPreference?.addEventListener) systemPreference.addEventListener('change', syncSystem);
    else systemPreference?.addListener?.(syncSystem);
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
