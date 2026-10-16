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


## Chart release (2026-10-16)

`charts.js` owns the read-only chart models, responsive SVG, safe labels, keyboard/touch exploration and exact-value tables. The default **Este mês** uses the current day in America/Sao_Paulo at each refresh; rolling 7/14/30/90-day filters remain available. Existing filters and the 15-second refresh loop apply to all charts.

- Visits: daily line, including zero-visit dates. The current day is partial.
- Hours: horizontal bars, descending views, ties by hour; all 24 hours remain scrollable.
- Clicks: vertical bars descending by raw clicks, with unknown cards isolated. Zero-click cards remain in the exact-value table. Ranking totals reconcile with all clicks, not unique clicking sessions.
- Engagement: daily median and duration histogram from received heartbeat durations. Each modern session is counted once and assigned to its first in-period page view in the selected filter context. Duration is summed only inside the period; missing measurement is null, not zero, and breaks the line. The histogram excludes unmeasured sessions and shows its sample size.

The additive `engagement` field comes from `bio_analytics_charts` in the bio repository; no collection, public page, legacy-history or permission change is needed. Deploy that migration before this frontend. Old frontend clients ignore the new field. Run `node --experimental-default-type=module tests/studio-client.mjs` and `node --experimental-default-type=module tests/studio-charts.mjs`. Database tests live in `link-bio/tests/charts-database.py` and run only against disposable localhost PostgreSQL.

Rollback: revert the chart frontend commit; the additive database response is backward compatible and may remain. If necessary, restore only the previous `analytics_private.report` definition from the predeploy backup. Never roll back by deleting events or user accounts. Local QA pages, snapshots and real aggregate JSON must stay outside the repository.
