# Changelog

All notable changes to ScriptHunt will be documented in this file.

## [Unreleased]

### Security
- Hardened the optional Cloudflare Worker with exact HTTPS target allowlisting, redirect rejection, bounded 5 MB response streaming, upstream timeout/failure handling, and status/content-type propagation.
- Prevented failed, empty, oversized, invalid-content, and non-userscript responses from receiving or caching a clean security score, and retained successful scan provenance.
- Replaced parser-blocking dynamic `document.write` CSP injection with a static policy compatible with validated HTTPS custom sources, proxies, and dependency checks.
- Moved GitHub tokens from persistent localStorage to tab-scoped session storage, with one-time legacy migration, reset/invalid-token cleanup, reload persistence, and fresh-tab isolation.

### Fixed
- Propagated each search AbortSignal through direct, proxy, GitHub code, and custom-source requests so replacement searches cancel network work instead of only ignoring late results.
- Removed Google Fonts runtime requests by vendoring OFL-licensed Outfit and JetBrains Mono WOFF2 assets and adding them to the offline shell cache.

### Added
- Added versioned source result envelopes and visible per-source provenance for partiality, pagination, latency, cache use, privacy route, HTTP status, and normalized failures.
- Added a public-proxy fallback preference with target-URL disclosure and an explicit failure state when no allowed proxy route remains.
- Added visible GitHub repository/authenticated-code modes, effective query qualifiers, incomplete-result warnings, and 1,000-result ceiling evidence while preserving repository results when code search fails.
- Reconciled package and lockfile version metadata, pinned the verified Playwright release, and expanded version drift tests to cover both lockfile version fields and the dependency pin.
- Replaced implied trust for unscanned/unavailable evidence with explicit Unknown, stale-evidence, and dependency-unverified labels, with inspectable scan URL, timestamp, status, hash, and cache age.
- Added optional bounded-concurrency, non-executing HTTPS integrity checks for `@require` and `@resource` dependencies, including canonical provenance, pinning state, declared hash verification, failures, content changes, and parent-scan caching.
- Added installed/favorite import previews with valid, invalid, duplicate, conflict, and manager-format counts; merge, replace, skip-conflict, and cancel actions; and versioned pre-import snapshots with one-click rollback.
- Replaced unconstrained custom-source field guessing with declarative schema-v1 manifests covering stable identity, capabilities, privacy route, response/mapping paths, and strict byte/item/time limits; legacy templates migrate to a bounded compatibility mapping.
- Made the executable source registry authoritative for README source rows and diagnostics method/route/capability claims, with local drift tests and complete package release metadata.
- Added exact-URL applicability simulation for userscript scheme, host, port, path, include globs, and exclusion rules while retaining domain-only host hints.
- Versioned offline search records now preserve source route, status, partiality, failures, and scan evidence; legacy IndexedDB/localStorage copies migrate and deduplicate by newest valid record, with visible schema and eviction diagnostics.
- Added a local accessibility matrix across four themes and 320/375/768/1280px viewports, including text contrast, focus visibility, reduced motion, native/fallback popovers, keyboard result actions, comparison focus, and overflow checks.
- Added verified 192×192 and 512×512 PWA icons to the manifest and offline shell.

## [v0.5.1]

### Security
- Fixed CORS proxy origin confusion — `startsWith('http://localhost')` now requires exact origin match, preventing subdomain impersonation (e.g. `http://localhost.evil.com`). Regression test added.
- Hardened CSP meta tag construction — proxy URLs with semicolons, single-quotes, or commas in the pathname are now rejected before CSP injection.
- Custom source URLs from untrusted API responses are now sanitized through `safeUrl()` before rendering.
- Script scan fetch now rejects responses larger than 5 MB to prevent memory exhaustion from malicious install URLs.

### Fixed
- Search race condition: overlapping searches from rapid typing now abort stale in-flight requests instead of concatenating results from different queries.
- Spam detection no longer false-positives high-install scripts from sources that don't report ratings (GitHub, OpenUserJS, ScriptCat, Gists).
- `hashString` FNV-1a implementation now uses `Math.imul` for correct 32-bit arithmetic, preventing cross-engine hash inconsistencies.
- `installedState()` per-card localStorage parse replaced with cached reads — ~100x fewer JSON.parse calls during result rendering.
- `setFavs`, `setInstalledScripts`, `setSavedSearches`, and `lsWriteOfflineEntries` now wrapped in try/catch with user-facing toast for localStorage quota errors.
- Broken `og:image` meta tag pointed to nonexistent `banner.png` — now points to `icon.png`.
- OLED theme result card border now uses `var(--border)` instead of hardcoded `#222`.
- Removed dead CSS media query `@media (prefers-color-scheme: light) { html.theme-auto { } }`.
- Removed dead `canScan` variable — always `true`, all conditional branches were unreachable.
- Custom source IDs now use deterministic hashes instead of `Math.random()`, fixing cross-session deduplication.
- Added `.trust-dim-score` CSS styling (monospace, proper color).
- Modal title uses `<h2>` instead of `<div>` for proper heading hierarchy.
- Stats bar text (`id="statsText"`) now has `aria-live="polite"` so screen readers announce result counts.

## [v0.5.0]

### Security
- Added `safeUrl`/`safeHref`/`safeOpen` URL protocol allowlist — only `http:` and `https:` URLs are allowed in `href` attributes and `window.open()` calls; `javascript:`, `data:`, and `vbscript:` URLs from malicious source data are rejected.
- Fixed `esc()` misuse in attribute contexts (favorites view) — now uses proper `attr()` escaping via `safeHref`.
- Added 3 hostile fixture Playwright tests verifying XSS payloads in source names/descriptions/authors render as inert text, dangerous URL protocols are stripped from all link and data-url sinks, and import validation rejects favorites with unsafe URLs.

### Added
- Security scanner detects integrity hash evidence (`#sha256=`, `#sha384=`, `#sha512=`, `#md5=`) on `@require` and `@resource` URLs. Hashed dependencies get an info-level finding; unhashed remote dependencies without version evidence get a warning.
- `@resource` dependencies are now scanned for domain trust and integrity evidence, matching existing `@require` coverage.
- Installed script matches now show install provenance details — install/download/update URL agreement status and version drift evidence on result cards.
- Version drift test (`tests/version-drift.test.js`) fails when app, package.json, service worker, README badge, or CHANGELOG versions disagree. Runs as part of `npm run qa`.
- Security scanner now distinguishes `@connect` metadata risk from browser extension site-access requirements — warns when `GM_xmlhttpRequest` is granted without `@connect`, and explains that named `@connect` hosts may also need browser-level site-access permission.
- License names are normalized to SPDX identifiers during source normalization — common aliases like "MIT License", "Apache License 2.0", "GNU GPL v3" map to stable filter values while unknown/custom licenses pass through as-is.
- Source-docs drift test (`tests/source-docs.test.js`) fails when README source table count doesn't match the code source registry, or when sources are missing from README. GitHub repo description updated to list all 7 sources.
- Metadata compatibility lint in security scanner: warns on invalid `@match` wildcard syntax, TLD wildcards, `@connect` wildcard prefix misconceptions, missing `@license`, and declared antifeatures.
- Versioned preference storage (schema v2) with automatic migration on load. "Reset Preferences" button in diagnostics clears preferences, source health, caches, and saved searches without deleting favorites or installed scripts. Preference schema version appears in diagnostics export.
- Accessibility regression tests for diagnostics popover (Escape close), saved searches popover visibility, and mobile viewport (375px) verifying no clipped primary controls.
- GitHub rate-limit status now shows searches remaining, budget fraction, reset time, result cap (1,000), and whether code search is enabled (token vs. no-token).
- Diagnostics exports now include `schema: "scripthunt-diagnostics"` and `schemaVersion: 1` for future replay/migration, plus preference schema diagnostics.
- Installed-script import now recognizes Violentmonkey/ScriptCat manager backup formats (`meta.name`/`custom.includes` shape and `list` arrays) alongside ScriptHunt JSON and generic arrays. Manager backups show "(detected manager backup)" in the import toast.
- Live source canary tests (`npm run test:canary`) verify Greasy Fork, ScriptCat, GitHub, and allorigins proxy are reachable with expected response shapes. Excluded from the default deterministic test suite.
- Result cards show "Version History" links for Greasy Fork (versions page) and GitHub (commits page) sources. Scrape-only sources omit the link.
- Custom source templates: power users can add HTTPS JSON API sources in Diagnostics with `{query}` and `{page}` URL placeholders. Sources are validated (HTTPS-only, no unsafe placeholders), persist in localStorage, and appear as toggleable sources in the search bar.

## [v0.4.1]

### Added
- Bounded metadata/security scan cache backed by IndexedDB with localStorage fallback, reducing repeat raw-script fetches across grant/risk filters and reloads.
- Repo-local static test server plus `npm run qa` for deterministic local audit, Worker, and Playwright verification.
- Regression coverage for cached metadata filtering across page reloads.
- In-app custom proxy settings with HTTPS validation, Worker allowlist self-test, remove flow, and diagnostics redaction.
- Installed-script import for local already-installed and update-available result badges.
- Versioned favorites export schema with normalized install, download, update URL, and namespace fields.
- Applies-to evidence on site-filtered result cards and comparison rows, including source site matches and parsed userscript metadata patterns.
- Expandable trust breakdowns showing popularity, security, freshness, metadata, and source-health evidence on cards and comparison rows.
- Catalog language filter for Greasy Fork and Sleazy Fork searches, including shareable URL state and all-languages mode.
- GitHub token settings in Diagnostics with save/remove controls, rate-limit checks, authenticated search headers, and redacted diagnostics.
- Cache Diagnostics section with offline/scan cache counts, StorageManager quota estimates, and independent cache-clear controls.
- Diagnostics, Bookmarklet, and Saved panels now open through a local fallback when the browser Popover API is unavailable.
- Source adapters now have deterministic malformed/empty/rate-limit/proxy-wrapper drift coverage, with invalid JSON and proxy wrapper errors surfaced as recoverable source errors.
- Manager-aware security scan findings for broad `@match`/`@include`, enumerated `@connect`, pinned vs floating `@require`, and update/download URL host drift.
- Metadata parsing now preserves localized `@name`/`@description`, `@exclude-match`, compatibility directives, and repeated keys without overwriting values.
- Metadata viewer output is now bounded for very large repeated directive blocks while keeping parsed metadata available for filters and trust scoring.
- Installed-script exports with `scripthunt-installed` schema v1 plus stricter import validation that skips bad rows without aborting valid rows.
- PWA update prompts with explicit refresh control plus cached-shell fallback notices when the service worker serves stale content offline.
- Saved searches for local query/filter/source snapshots with manual refresh and new/updated result badges.

### Fixed
- Metadata scan cache keys now stay stable when a script declares a different `@updateURL`.

### Changed
- Grant and risk filters now scan scripts through a fixed concurrency pool instead of launching every raw-script fetch at once.
- Favorite/offline script records now preserve normalized install, download, update URL, and namespace fields for later installed-script matching.
- Playwright no longer depends on the external `serve` binary for its web server.
- Custom proxy CSP allowlisting now uses a validated parser-inserted policy instead of mutating an already-parsed meta tag.
- Result cards now expose normalized install/download/update URL links and relabel install actions as updates when imported installed versions differ.

## [v0.4.0]

### Added
- GitHub Gists as an optional seventh source, including proxied HTML discovery and source toggle support.
- Client-side search-within-results filtering for loaded result sets.
- Source health backoff and CORS proxy fallback handling for intermittently failing catalogs.
- Per-source proxy diagnostics with per-proxy failure reasons, visible successful proxy names, and inline retry controls.
- Metadata-backed `grant:` query filtering with visible labels when a source result cannot be verified.
- Security scan and metadata actions for every result, including ScriptCat and Gist raw script URLs, with exact blocker messages for repository results without raw files.
- Fixture-backed source adapter tests for Greasy Fork, GitHub, OpenUserJS, Userscript.Zone, ScriptCat, and GitHub Gists.
- Visible advanced filter controls for license, minimum installs, updated date, @grant, risk, source toggles, and applies-to domain.
- Complete URL deep-linking for query, enabled sources, site/domain, sort order, and visible filters.
- Persistent source-health cooldowns plus diagnostics export for source/proxy failures without leaking tokens or custom proxy URLs.
- Accessibility hardening for icon-only result actions, source-toggle keyboard semantics, and comparison-modal focus trapping/restoration.
- Offline recent-search cache backed by IndexedDB with localStorage fallback, stale-result labeling, recent offline browsing, and revalidation prompts.

### Changed
- Source adapters now dispatch through the registry instead of source-specific branching.
- The bundled Cloudflare Worker allowlist now supports OpenUserJS, Userscript.Zone, GitHub Gists, and raw Gist hosts while rejecting unrelated domains.
- Version and source copy synchronized across package metadata, app UI, service worker, README, and working notes.
- Playwright smoke tests now run from clean checkout dependencies with a committed lockfile and local `serve` script.
- Playwright now uses an isolated local test port, and diagnostics export renders immediately on button activation.
- Result-card generated HTML now escapes attribute values separately from text content.
- Smoke coverage now verifies offline cached-search restore and online revalidation affordances.

## [v0.3.3]

### Fixed
- Security: Add `rel="noopener"` to all `target="_blank"` links and `noopener` feature to all `window.open()` calls
- Share button no longer reuses the external-link icon — now has a distinct share network icon
- `color-mix()` fallback for Safari <16.2 — source toggle active state degrades gracefully
- Mobile: search `font-size: 16px` prevents iOS auto-zoom on input focus
- Mobile: touch targets enlarged to 36px minimum on buttons, source toggles, and card action icons
- Removed inline `onclick="event.stopPropagation()"` from card links (unnecessary with `rel="noopener"`)
- Search placeholder shortened to "Search userscripts..." — advanced query hints are in the empty state below

## [v0.3.2]

### Improved
- Complete visual polish pass: refined color palette, spacing rhythm, and typography scale across all themes
- Tightened design tokens: added --radius-sm, --transition variable, tuned shadow depths and dim colors
- Header: cleaner vertical rhythm with grouped version/theme meta row, smaller logo, better tagline weight
- Search: narrower max-width (680px), refined padding, lighter focus ring (3px vs 4px glow)
- Source toggles: active state now uses subtle tinted background via color-mix(), tighter gaps
- Result cards: reduced hover lift (1px vs 2px), subtler stripe opacity, better badge sizing
- Card action icons: proper auto-margin on first icon only, hover background instead of just color change
- Comparison modal: backdrop blur effect, refined close button with hover background
- Empty state: extracted to reusable constant (eliminated duplicate), search icon instead of document icon, code elements styled via CSS class
- Toast: flexbox layout with proper alignment, underline-style undo link instead of pill button
- Light theme: cards get subtle box-shadow for depth, modal/compare bar shadows tuned, backdrop blur
- OLED theme: increased card border contrast (#222 vs #1a1a1a)
- GitHub source badge color changed from near-white (#e6edf3) to visible gray (#8b949e) — works in all themes
- Skeleton bars: more realistic content-proportioned widths
- prefers-reduced-motion: now uses universal selector to disable all animation and transitions
- Mobile: tighter padding, smaller logo, responsive compare grid columns
- font-family: added BlinkMacSystemFont and Segoe UI fallbacks, enabled font smoothing

## [v0.3.1]

### Fixed
- Fatal init crash: `_prefGet` used before defined, breaking proxy and source initialization
- `document.title` showed HTML entities (&amp;) instead of raw text for special characters
- Sort stability: spam sort no longer scrambles primary sort order within non-spam results
- Service worker cached wrong absolute paths; now uses relative paths for GitHub Pages compatibility
- GitHub code search install URL construction no longer breaks on URLs without `/blob/`
- Modal overlay now uses lighter backdrop in light theme for proper contrast
- Empty state text now lists all 6 sources including ScriptCat
- CORS proxy worker now rejects non-GET requests (was allowing POST/PUT/DELETE through)
- Meta charset moved before meta description per HTML spec requirement
- Meta description updated to list all sources accurately
- Test assertion updated for 6 source toggles (was 5)

### Added
- `prefers-reduced-motion` support — disables all card/toast/panel animations
- Light theme fixes: select dropdowns, card buttons, and compare bar shadow now theme-aware

## [v0.3.0]

### Added
- Persist user preferences (source toggles, sort order) in localStorage across sessions
- AbortSignal.timeout polyfill for Safari <16.4 and Firefox <100
- GitHub API rate-limit tracking with adaptive backoff and auto-recovery
- Trust scoring system with 0-100 scale based on installs, ratings, freshness, and security scan
- Security scanner — pattern-based code analysis for dangerous APIs, obfuscation, and permission risks
- Permission risk pills showing @grant danger levels per script
- Script comparison mode — select up to 3 scripts for side-by-side comparison with best-value highlighting
- Favorites system with localStorage persistence
- Search history with sessionStorage
- Advanced query syntax: `site:`, `author:`, `updated:`, `grant:` operators
- Staleness indicators (Active / Aging / Stale) on result cards
- Spam detection with low-quality result dimming
- Userscript.Zone as a fifth search source
- Bookmarklet for "find scripts for this page"
- Site filter input for domain-specific searches
- Metadata block viewer with formatted @-directive display
- Infinite scroll pagination across all sources

### Changed
- Version synchronized to v0.3.0 across all files

## [v0.0.4]

- Initial public release
- Multi-source search across Greasy Fork, Sleazy Fork, GitHub, OpenUserJS
- Parallel fetching with Promise.allSettled
- Cross-source deduplication by name + author
- Source toggle chips with live status indicators
- Sort by relevance, installs, rating, updated, name
- URL parameter support (?q=query)
- Skeleton loading states
- Responsive dark theme
- Zero dependencies, single-file HTML
