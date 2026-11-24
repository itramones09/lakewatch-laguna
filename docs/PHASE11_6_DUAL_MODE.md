# Phase 11.6 — Dual Mode

- New browser session: Lite Mode. Refresh retains mode in sessionStorage.
- Help & Information → Unlock Full Mode; configured PIN `1983`. Wrong PIN does not change mode; Cancel remains in Lite.
- Full Mode restores all original modules. Switch to Lite Mode requires no PIN and returns to Overview if an advanced module was active.
- Lite retains Overview, Map, Stations, basic Analytics, About, theme and source links. It hides Data Explorer, Lake Context, Reports, Manage Data, Gallery, incident layers, extended archive, prediction, advanced comparison studio and report/export shortcuts.
- Manual changes its tabs and instructions automatically.
- The hard-coded PIN is inspectable in frontend source; it is not authorization. Backend authentication is unchanged.

## Acceptance checks
Open a fresh tab/session; verify Lite navigation and basic charts. Test wrong PIN, Cancel and correct PIN. Open Gallery and switch back to Lite; verify Overview appears. Refresh in both modes. Open manual and verify five vs ten tabs. Check incident layer is disabled in Lite. Verify admin sign-in remains independently required in Full Mode.
