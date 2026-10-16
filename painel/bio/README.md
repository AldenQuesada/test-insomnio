# Instituto Studio — stage 1

Unified authenticated dashboard for the existing bio and insomnia aggregates. `/painel/` redirects to the insomnia module; `/painel/bio/` opens the overview. No public bio, quiz or TSL rendering/collection changes belong to this stage.

- `app.js`: navigation, filters, visibility/offline lifecycle and CSV export.
- `auth.js`: existing owner login/session storage with bounded token calls and logout-race protection.
- `client.js`: one request at a time, periodic 15-second refresh, abort and stale-response rejection.
- `views.js`: escaped read-only views, data-derived SVG chart, funnels and empty states.
- `format.js`: display/CSV formatting and coarse device/browser labels.
- `style.css`: panel-only themes and responsive layout.

The server RPC is `analytics_studio_report`, deployed from the bio repository. It owns authorization, metric definitions and the query timestamp. No stored token, credentials, recorded visitor data or mock production result ships with this frontend. Synthetic fixtures exist only in `tests/studio-client.mjs`.

Bio and insomnia retain separate session definitions. Bio filters do not apply to the legacy quiz. Internal traffic is opt-in. Recent bio activity uses 60 seconds; legacy quiz activity uses its configured 10-minute window. Null measurement is displayed as missing. The historical views do not infer confirmed sales, cross-page continuation or causal abandonment. Hotmart and the builder are later stages.

Verify with `node tests/studio-client.mjs` from the repository root, plus desktop/mobile browser inspection with actual authorized aggregate responses. Old `view.js` and legacy modules remain available to cached old clients and for rollback; the Studio entry imports only the versioned new modules. Revert the Stage-1 panel commit to roll back the UI while preserving all tracking history and public pages.


## Chart release (2026-10-16)

`charts.js` owns the read-only chart models, responsive SVG, safe labels, keyboard/touch exploration and exact-value tables. The default **Este mês** uses the current day in America/Sao_Paulo at each refresh; rolling 7/14/30/90-day filters remain available. Existing filters and the 15-second refresh loop apply to all charts.

- Visits: daily line, including zero-visit dates. The current day is partial.
- Hours: horizontal bars, descending views, ties by hour; all 24 hours remain scrollable.
- Clicks: vertical bars descending by raw clicks, with unknown cards isolated. Zero-click cards remain in the exact-value table. Ranking totals reconcile with all clicks, not unique clicking sessions.
- Engagement: daily median and duration histogram from received heartbeat durations. Each modern session is counted once and assigned to its first in-period page view in the selected filter context. Duration is summed only inside the period; missing measurement is null, not zero, and breaks the line. The histogram excludes unmeasured sessions and shows its sample size.

The additive `engagement` field comes from `bio_analytics_charts` in the bio repository; no collection, public page, legacy-history or permission change is needed. Deploy that migration before this frontend. Old frontend clients ignore the new field. Run `node --experimental-default-type=module tests/studio-client.mjs` and `node --experimental-default-type=module tests/studio-charts.mjs`. Database tests live in `link-bio/tests/charts-database.py` and run only against disposable localhost PostgreSQL.

Rollback: revert the chart frontend commit; the additive database response is backward compatible and may remain. If necessary, restore only the previous `analytics_private.report` definition from the predeploy backup. Never roll back by deleting events or user accounts. Local QA pages, snapshots and real aggregate JSON must stay outside the repository.


## Connected journeys (2026-10-16)

`journeys.js` renders the new default Funis visuais tab; `app.js` selects the `journey` read model and retains the historical bio/quiz tabs. The 15-second refresh, stale-response rules, viewer authorization, filters, keyboard operation, mobile layout and CSV export apply. Current bio traffic goes **directly to the sales page**, not through the quiz. The main sequence is bio view → insomnia click → confirmed sales arrival → checkout CTA click. The separate quiz sequence is page view → start → contact screen → server-recorded submit → result CTA → sales arrival → checkout CTA. These cohorts are not added as unique people.

Collection is isolated in `analytics/journey.js`; quiz HTML changes only load it, add its metadata to existing events and decorate the existing result link. TSL rendering/personalization/advertising data are unchanged. The helper never reads `insonia_resultado`. It forwards random IDs only to approved same-origin routes, consumes its query parameters before pixels start, preserves UTMs/hash, respects GPC/DNT/opt-out/preview, supports unavailable storage, keeps reload continuity, and starts fresh for unrelated entries. Thirty minutes without events expires browser correlation; server joins are bounded to 24 hours. `aq_i` preserves internal classification even when browser storage is unavailable. These identifiers are pseudonymous telemetry, not visitor identity or proof of purchase.

The API migration is maintained in `link-bio/supabase/migrations/*_bio_analytics_journeys.sql`. It is additive: existing reports stay unchanged. Analytics DB configuration owns activation date, quiz slug, idle and observation windows. Only the new bio collector release enters the linked cohort; cached old clients and historical events remain in existing summaries. The release value is a collection-contract marker: keep `bio-journey-1` until an explicit contract migration replaces it. Arrival joins use the exact click token, a 5-minute allowance for browser clock skew, and a 24-hour maximum. The query requires a real arrival before downstream sales events and explicit result CTA before attributing an offer to the quiz. It does not infer attribution from the old reused TSL session ID. Existing event `submit` confirms quiz completion by quiz/session/time, without querying responses or leads. Question positions are derived from quiz configuration; values and identities never leave the aggregate function.

A step with no next event stays recent for 30 minutes after its last signal; afterwards it becomes **sem avanço observado**, not proven abandonment. Late records can revise counts. Independent sales block/scroll/button breakdowns do not impose a fake mandatory scroll sequence. The checkout node has no loss calculation because Hotmart is disconnected. New parameters are not forwarded to checkout or advertising payloads. Context-menu copy/open without an observed click cannot be attributed; it remains an observation gap.

Validation: `node tests/journey-tracking.cjs`, existing client/chart tests, local `link-bio/tests/journey-database.py` and all existing DB regressions. Synthetic journeys are transactionally rolled back and never inserted in production. Production browser QA uses `interno=1` and never submits the quiz or opens checkout. A real iPhone Safari is not controlled by this environment; responsive browser testing and Safari-compatible platform APIs are checked, not presented as physical-device proof.

Rollback: revert the two frontend commits (bio collector and this repository); historical collection keeps working. Leave additive records/indexes/private report in place or restore only `ingest` and `studio_report` from `/Users/drquesada/backups-supabase/instituto-quiz/analytics-journey-2026-10-16-predeploy`. Never delete events/accounts/clinical data. Hotmart, builder, cross-device identity and historical reconstruction are not in this release.
