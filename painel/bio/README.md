# Instituto Studio — stage 1

Unified authenticated dashboard for the existing bio and insomnia aggregates. `/painel/` redirects to the insomnia module; `/painel/bio/` opens the overview. No public bio, quiz or TSL rendering/collection changes belong to this stage.

- `app.js`: navigation, filters, visibility/offline lifecycle and CSV export.
- `auth.js`: existing owner login/session storage with bounded token calls and logout-race protection.
- `client.js`: one request at a time, periodic 15-second refresh, abort and stale-response rejection.
- `views.js`: escaped read-only views, data-derived SVG chart, funnels and empty states.
- `format.js`: display/CSV formatting and coarse device/browser labels.
- `style.css`: panel-only themes and responsive layout.

The server RPC is `analytics_studio_report`, deployed from the bio repository. It owns authorization, metric definitions and the query timestamp. No stored token, credentials, recorded visitor data or mock production result ships with this frontend. Synthetic fixtures exist only in `tests/studio-client.mjs`.

Bio and insomnia retain separate session definitions. Bio filters do not apply to the legacy quiz. Internal traffic is opt-in. Recent bio activity uses 60 seconds; legacy quiz activity uses its configured 10-minute window. Null measurement is displayed as missing. The UI does not infer confirmed sales, cross-page continuation or causal abandonment. Hotmart and the builder are later stages.

Verify with `node tests/studio-client.mjs` from the repository root, plus desktop/mobile browser inspection with actual authorized aggregate responses. Old `view.js` and legacy modules remain available to cached old clients and for rollback; the Studio entry imports only the versioned new modules. Revert the Stage-1 panel commit to roll back the UI while preserving all tracking history and public pages.
