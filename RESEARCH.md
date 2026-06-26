# Research — ScriptHunt

## Executive Summary
ScriptHunt is a static, single-file userscript discovery app that searches Greasy Fork, Sleazy Fork, GitHub repositories/code, OpenUserJS, Userscript.Zone, ScriptCat, and opt-in GitHub Gists from one browser page. Verified: its strongest current shape is broad aggregation plus local trust/security tooling without a backend; the highest-value direction is making that aggregation dependable and truthful before adding more sources. Priority opportunities: fix proxy and custom Worker reliability, make advertised query operators actually filter, restore clean-checkout tests, expand security/metadata scanning to every installable source, add source diagnostics and recovery, turn advanced filters into visible controls, deep-link all search state, add metadata/parser fixtures, harden accessibility, and add offline recovery for recent searches.

## Product Map
- Core workflows: search across enabled sources; filter/sort loaded results; inspect trust/security/metadata; compare scripts; favorite/export/import; install through source/raw `.user.js` links.
- User personas: power users comparing scripts across catalogs; cautious users vetting grants and remote code before install; script authors checking competing implementations; mobile users finding a script to install later in a manager.
- Platforms and distribution: static GitHub Pages-style web app, PWA manifest plus service worker shell cache, no backend requirement, optional self-hosted Cloudflare Worker CORS proxy.
- Key integrations and data flows: native JSON from Greasy Fork/Sleazy Fork/GitHub/ScriptCat; proxied HTML scraping for OpenUserJS, Userscript.Zone, and GitHub Gists; localStorage for preferences/favorites/tokens/proxy URL; in-memory five-minute result cache.

## Competitive Landscape
- Greasy Fork/Sleazy Fork: strong catalog search, per-site pages, language/license filters, stats and version endpoints. Learn: metadata-backed filters and domain matching are table-stakes. Avoid: becoming a single-catalog community/forum product.
- Userscript.Zone: Tampermonkey-linked discovery focused on URL/domain matching across multiple source types. Learn: site-aware discovery should use `@match`/applies-to metadata, not only keyword filtering. Avoid: opaque scraping dependencies that give users no failure details.
- OpenUserJS: FOSS catalog with community requests for RSS/new-script updates and a long migration/dependency history. Learn: update feeds and source resilience matter. Avoid: relying on undocumented HTML when a stable feed/API can be used.
- ScriptCat: active manager/catalog with recent migration and backup requests. Learn: users care about install compatibility, update URLs, and preserving per-script settings. Avoid: expanding ScriptHunt into a full userscript manager or cloud backup app.
- Violentmonkey, quoid/userscripts, and Tampermonkey: managers define install handoff expectations, metadata semantics, `@require`/`@connect` risk, and current-site discovery. Learn: normalize install/update URLs and explain permission failures. Avoid: depending on manager internals that a static page cannot inspect.
- Userscript-Plus/current-site helpers: show demand for browser-context discovery and filtering already-installed scripts. Learn: imported install history is valuable. Avoid: stale extension-only distribution as the primary route.
- SearXNG, npms, Socket, and OpenSSF Scorecard: adjacent search/trust systems. Learn: expose source health, scoring dimensions, and security rationale. Avoid: opaque or dependency-heavy scoring that cannot be audited in a single-file app.

## Security, Privacy, and Reliability
- Verified bug: `index.html` parses `grant:` into `grantFilter` but `executeSearch()` only applies author/date filtering; README advertises advanced query syntax that is not enforced.
- Verified reliability risk: `index.html` sends OpenUserJS, Userscript.Zone, and GitHub Gists through public proxies; live search for `youtube` returned Greasy Fork and GitHub only while proxied sources failed. CodeTabs also documents 5 requests/second and 5 MB limits.
- Verified custom proxy bug: `cors-proxy/worker.js` allows OpenUserJS, Userscript.Zone, Greasy Fork, and Sleazy Fork targets, but the app also proxies `gist.github.com` and `gist.githubusercontent.com`; a deployed Worker cannot support all configured sources.
- Verified trust gap: `fetchAndScan()` exits for GitHub/Gists and card actions only enable scan/metadata for Greasy Fork, Sleazy Fork, and OpenUserJS, so ScriptCat, GitHub, and Gist trust scores use partial security evidence.
- Verified recovery gap: source health is in-memory only; users get toasts but no persistent source/proxy diagnostics, no retry controls, and no diagnostic export for failed searches.
- Verified privacy posture: data stays local by design, but GitHub token and custom proxy URL are stored in localStorage; import/export lacks schema/version validation beyond basic array checks.
- Verified accessibility gap: source toggles are custom `div role=checkbox` controls, card icon buttons rely on `title` without explicit labels, and the compare modal does not implement an obvious focus trap.
- Likely security hardening: scanner should flag unpinned or unusual `@require`, broad `@connect *`, update/download URL mismatches, and obfuscation patterns; these map to Violentmonkey metadata docs and manager security discussions.

## Architecture Assessment
- Source registry is the right boundary: `SOURCES` already carries source metadata and search functions. Next improvement is not a framework rewrite; it is fixture-based source adapter tests for HTML/API drift.
- Proxy handling needs a first-class boundary: `fetchViaProxy()` should track per-proxy status, last success, payload/timeout failures, and which sources require proxying.
- Search state needs a serializer: current URL state only restores `q`, while source toggles/sort/site/filter choices live elsewhere; this blocks shareable/reproducible searches.
- Offline behavior is shell-only: `sw.js` caches static assets, but recent results and source health are not available offline. IndexedDB plus StorageManager quota checks fits the no-backend architecture.
- Tests are blocked on clean checkout: `npx playwright test` failed with `Cannot find module '@playwright/test'`; there is a `devDependency` but no lockfile or documented install path in the test command.
- Version/docs drift is recurring: README/UI/service worker show v0.4.0, while `package.json` and `CLAUDE.md` still show v0.3.0; `CHANGELOG.md` stops before the recent Gist/source-health work.
- Distribution and observability gaps are practical, not conceptual: add CI smoke tests and a copyable diagnostics bundle before adding more sources.
- Mobile layout passed a narrow viewport smoke check with no document overflow; no mobile redesign is warranted now.
- Plugin ecosystem should remain source-adapter oriented: custom source templates and fixtures fit; a broad plugin marketplace does not fit the static-file scope.
- i18n/l10n should be limited to source locale/language filters for now; full UI localization conflicts with the single-file/no-build constraint unless the project adopts a build step.

## Rejected Ideas
- Full backend/server-side search - contradicts the static, no-backend philosophy; use optional Worker only for CORS.
- User accounts, reviews, and social features - catalogs already own community identity; ScriptHunt should keep preferences local.
- Browser extension manager replacement - manager projects show migration/cloud-backup demand, but it is out of scope for a discovery app.
- Chrome Web Store/AMO as primary result sources - extensions are a different artifact and trust model; mixing them would confuse userscript scoring.
- GitLab snippets as a near-term source - GitHub search showed low direct competitor signal and GitLab snippets do not provide a practical `.user.js` discovery surface without broad scraping.
- Full UI i18n - too much surface for a single-file/no-build app; locale filters on sources are a better fit.
- ML/vector ranking - no verified need at current result scale; transparent trust dimensions are more useful and auditable.
- Public-proxy-only strategy - live failures and proxy limits make it insufficient; self-hosted Worker plus diagnostics is the sustainable path.

## Sources
### Project And Code
- https://github.com/SysAdminDoc/UserScriptHunt

### Direct Competitors And Managers
- https://github.com/greasyfork-org/greasyfork
- https://github.com/greasyfork-org/greasyfork/issues/1545
- https://github.com/OpenUserJs/OpenUserJS.org
- https://github.com/OpenUserJs/OpenUserJS.org/issues/2026
- https://www.userscript.zone/
- https://github.com/scriptscat/scriptcat
- https://github.com/scriptscat/scriptcat/issues/1484
- https://github.com/scriptscat/scriptcat/issues/1483
- https://github.com/violentmonkey/violentmonkey/issues/2540
- https://github.com/violentmonkey/violentmonkey/issues/2263
- https://github.com/quoid/userscripts/issues/836
- https://github.com/quoid/userscripts/issues/871
- https://github.com/quoid/userscripts/issues/817
- https://github.com/jae-jae/Userscript-Plus/issues/63

### APIs, Specs, And Platforms
- https://docs.github.com/en/rest/search/search
- https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
- https://www.tampermonkey.net/script_installation.php
- https://www.tampermonkey.net/documentation.php
- https://violentmonkey.github.io/api/metadata-block/
- https://developer.mozilla.org/en-US/docs/Web/API/StorageManager
- https://codetabs.com/cors-proxy/cors-proxy.html
- https://allorigins.win/
- https://github.com/alianza/everyorigin
- https://developers.cloudflare.com/workers/platform/limits/

### Adjacent Trust/Search Systems
- https://github.com/searxng/searxng
- https://api-docs.npms.io/
- https://github.com/ossf/scorecard
- https://socket.dev/
- https://arxiv.org/html/2503.04292

## Open Questions
- Does ScriptCat document a stable direct `.user.js` download URL, or should ScriptHunt treat the current install URL pattern as best-effort only?
- Which self-hosted CORS Worker URL, if any, should the production deployment recommend by default?
- Should GitHub/Gist script scanning prefer raw-url fetches directly or always go through the Worker to avoid CORS variance?
