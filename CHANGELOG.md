# Changelog

All notable changes to ScriptHunt will be documented in this file.

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
