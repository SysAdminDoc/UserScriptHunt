# ScriptHunt

![Version](https://img.shields.io/badge/version-0.5.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Web-ff6600)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&logoColor=black)
![HTML](https://img.shields.io/badge/Single_File-HTML-E34F26?logo=html5&logoColor=white)
![Status](https://img.shields.io/badge/status-active-success)

> Unified search engine for userscripts — query Greasy Fork, Sleazy Fork, GitHub, OpenUserJS, Userscript.Zone, ScriptCat, and GitHub Gists from a single interface.

<img width="1594" height="1059" alt="image" src="https://github.com/user-attachments/assets/8be2abe9-9e0d-4564-ac4b-6baa58e53ab3" />

## **[Try it live → sysadmindoc.github.io/UserScriptHunt](https://sysadmindoc.github.io/UserScriptHunt/)**

ScriptHunt is a zero-dependency, single-file HTML webapp that searches every major userscript repository in parallel and merges the results into one unified, deduplicated feed with trust scoring, security scanning, and comparison tools. No backend required — runs entirely in the browser, deployable as a static page on GitHub Pages.

---

## Quick Start

**Use it now:** Open **[sysadmindoc.github.io/UserScriptHunt](https://sysadmindoc.github.io/UserScriptHunt/)** in any browser.

**Pre-filled search:** [sysadmindoc.github.io/UserScriptHunt/?q=youtube+enhancer](https://sysadmindoc.github.io/UserScriptHunt/?q=youtube+enhancer)

**Self-host:**
```bash
git clone https://github.com/SysAdminDoc/UserScriptHunt.git
cd UserScriptHunt
open index.html
```

**Local verification:**
```bash
npm ci
npm run test:install
npm run qa
```

**GitHub Pages deploy:**
1. Fork or push to a GitHub repository
2. Go to **Settings → Pages → Source → Deploy from branch** (main, root)
3. Access at `https://yourusername.github.io/UserScriptHunt/`

---

## Features

| Feature | Description |
|---------|-------------|
| **7-Source Search** | Queries Greasy Fork, Sleazy Fork, GitHub, OpenUserJS, Userscript.Zone, ScriptCat, and GitHub Gists simultaneously |
| **Parallel Fetching** | Sources search concurrently via `Promise.allSettled()` and a replacement query aborts every active source request |
| **Cross-Source Dedup** | Eliminates duplicate scripts with trust boost for scripts found on 2+ platforms |
| **Trust Scoring** | Weighted popularity, security, freshness, metadata, and source-health dimensions; unscanned, unavailable, stale, and dependency-unverified evidence is labeled instead of implied safe |
| **Security Scanner** | Pattern and metadata analysis for validated raw `.user.js` responses with source URL, fetch time, status, hash, and cache age; failed or non-userscript responses remain Unknown |
| **Dependency Integrity** | Optional, non-executing HTTPS checks for up to 12 `@require`/`@resource` URLs with 1 MB/7 second limits, pinned/floating provenance, declared hash verification, change detection, and cached evidence |
| **Permission Risk Pills** | Color-coded pills showing @grant danger levels (safe/warn/danger) per script |
| **Script Comparison** | Select up to 3 scripts for side-by-side comparison with best-value highlighting |
| **Favorites** | Save scripts locally with versioned JSON export/import, conflict preview, recovery snapshots, and undo |
| **Saved Searches** | Save query/filter/source combinations locally and manually refresh them to badge new or updated results |
| **Installed Import/Export** | Preview manager/app backups before merge, replace, or conflict-skip; every write creates a versioned local snapshot with one-click rollback |
| **Advanced Query Syntax** | `site:`, `author:`, `updated:`, `grant:` operators with domain-aware by-site.json search, exact-URL applicability simulation, and metadata-backed grant filtering |
| **Advanced Filters** | Visible controls for source, license, installs, updated date, catalog language, @grant, risk, and applies-to domain |
| **Applies-To Evidence** | Domain hints show host-level evidence, while exact URL filters simulate scheme, host, port, path, `@match`, `@include`, `@exclude`, and `@exclude-match` behavior |
| **Filter Results** | Instantly narrow loaded results by name/description/author without re-querying sources |
| **Source Health** | Persists failing source cooldowns with retry controls and versioned per-source provenance for partiality, route, latency, HTTP status, and cache use |
| **Offline Recent Searches** | Versioned records preserve source route, status, partiality, errors, and scan age/hash evidence; legacy IndexedDB/localStorage records reconcile by newest valid copy |
| **Cache Diagnostics** | Shows offline/scan cache counts, schema and eviction state, browser quota estimates, and independent cache-clear recovery controls |
| **Source Toggles** | Enable/disable sources with preferences persisted across sessions |
| **Live Status Chips** | Real-time per-source indicators with partial-result reasons, search mode, privacy route, latency, cache use, and suspension status |
| **Sort Controls** | Sort by relevance, trust score, total/daily installs, rating, last updated, or name |
| **Infinite Scroll** | Automatic pagination fetches next page from all active sources |
| **Staleness Indicators** | Active/Aging/Stale badges on result cards based on last update date |
| **Spam Detection** | Low-quality results auto-dimmed and pushed to bottom of results |
| **Metadata Viewer** | Bounded @-directive display with localized keys, compatibility variants, duplicate directives, overflow counts, and syntax highlighting |
| **Install URL Normalization** | Result cards expose normalized install, download, and update URLs for manager handoff checks |
| **Bookmarklet** | One-click "find scripts for this page" from any website (works on file:// too) |
| **URL Parameters** | Shareable search links for query, sources, site/domain, sort order, and visible filters |
| **Keyboard Navigation** | Tab/arrow key navigation, Enter to open, Escape to close modals |
| **Accessibility** | Labeled controls, WCAG-AA text tokens, visible keyboard focus, live regions, trapped/restored modal focus, reduced motion, and tested 320–1280px theme/popover coverage |
| **Web Share API** | Native mobile sharing via share button on result cards |
| **Content Security Policy** | Static parser-safe CSP limits network requests to HTTPS while URL validation and source/proxy contracts constrain destinations |
| **View Transitions** | GPU-accelerated smooth transitions between search states |
| **Themes** | Dark, Light, OLED black, and Auto (follows OS preference) |
| **PWA** | Installable Progressive Web App with 192px/512px icons, update prompts, offline shell fallback notices, and recent-search cache |
| **Responsive Design** | Full mobile/tablet/desktop support with CSS container queries |
| **Runtime Zero Dependencies** | Single HTML file, no app runtime dependencies; npm is used only for local tests via `npm run qa` |

---

## Supported Sources

| Source | Method | Route | Auth Required | CORS | Per-Page | Capabilities | Metadata |
|--------|--------|-------|:---:|:---:|:---:|--------------|----------|
| **Greasy Fork** | JSON API + by-site.json | direct | No | Native (`*`) | 100 | search, pagination, totals, site filter, install URLs | Installs, ratings, version, dates, license, author |
| **Sleazy Fork** | JSON API | direct | No | Native (`*`) | 100 | search, pagination, totals, site filter, install URLs | Installs, ratings, version, dates, license, author |
| **GitHub** | REST API v3 + Code Search | direct | Optional token | Native CORS | 30 | repository search, authenticated code search, pagination, totals | Stars, forks, language, license, dates |
| **OpenUserJS** | HTML scraping | custom/public proxy | No | Via proxy | 25 | search, pagination, install URLs | Name, author, install URL |
| **Userscript.Zone** | HTML scraping | custom/public proxy | No | Via proxy | 10 | search, pagination, install URLs | Name, description, install URL |
| **ScriptCat** | JSON API v2 | direct | No | Native CORS | 30 | search, pagination, totals, install URLs | Installs, ratings, version, dates, author |
| **GitHub Gists** | HTML scraping | custom/public proxy | No | Via proxy | 10 | search, pagination, install URLs | Name, author, install URL |

Custom sources use declarative `scripthunt-source-manifest` schema v1 JSON in Diagnostics. A manifest must declare a stable `custom-*` id/label, direct HTTPS URL template, 1–15 second timeout, 1 KB–2 MB response limit, 1–100 item limit, pagination/total/install-URL capabilities, response paths, and field mappings. Paths read JSON only—custom JavaScript is never evaluated. Existing name/URL templates migrate to the bounded `$legacy` mapping.

```json
{"schema":"scripthunt-source-manifest","schemaVersion":1,"id":"custom-example","label":"Example","request":{"urlTemplate":"https://api.example/search?q={query}&page={page}","route":"direct","timeoutMs":12000,"maxBytes":1048576},"response":{"itemsPath":"items","totalPath":"total","hasMorePath":"hasMore","partialPath":"partial","partialReasonPath":"partialReason","maxItems":50},"mapping":{"id":"id","name":"name","description":"description","author":"author","url":"url","installUrl":"installUrl","version":"version"},"capabilities":{"pagination":true,"totals":true,"installUrls":true}}
```

---

## How It Works

```
┌──────────────────────────────────────────────────────────────────┐
│                        User Search Input                         │
│                     (450ms debounce / Enter)                     │
└──────────────────────────┬───────────────────────────────────────┘
                           │
         ┌────────┬────────┼────────┬──────────┬──────────┐
         ▼        ▼        ▼        ▼          ▼          ▼
    ┌─────────┐┌───────┐┌──────┐┌────────┐┌─────────┐┌────────┐
    │ Greasy  ││Sleazy ││GitHub││OpenUser││Script   ││  Gists │
    │  Fork   ││ Fork  ││ +Code││  JS    ││  Cat    ││        │
    │(Direct) ││(Direct)││(Dir.)││(Proxy) ││(Direct) ││(Proxy) │
    └────┬────┘└───┬───┘└──┬───┘└───┬────┘└────┬────┘└───┬────┘
         └─────────┴───────┴────┬───┴──────────┴─────────┘
                                │
                   Promise.allSettled()
                                │
                                ▼
                 ┌──────────────────────────┐
                 │  Normalize + Deduplicate  │
                 │  Trust Score + Security   │
                 └─────────────┬────────────┘
                               │
                               ▼
                 ┌──────────────────────────┐
                 │   Sort + Filter + Render  │
                 │  (Grid with source badges)│
                 └──────────────────────────┘
```

All source requests fire in parallel via the **source adapter registry** — each source defines a `search()` function and `pageSize`. Results render progressively as each source responds. Failed sources show an error chip and auto-disable with exponential backoff after 3 consecutive failures.

---

## Configuration

### Source Toggles

Click the source chips below the search bar to enable/disable sources at runtime. Preferences persist in localStorage.

Default state:
- Greasy Fork: **Enabled**
- Sleazy Fork: **Disabled** (opt-in for adult content)
- GitHub: **Enabled**
- OpenUserJS: **Enabled**
- Userscript.Zone: **Enabled**
- ScriptCat: **Enabled**
- GitHub Gists: **Disabled** (opt-in, uses CORS proxy)

### GitHub Authenticated Search

For higher rate limits and `.user.js` file-level code search, open **Diagnostics -> GitHub token**, save a token for the current browser tab, then use **Check** to view the current GitHub search rate limit. The token survives reloads in that tab but is not written to persistent localStorage; closing the tab removes it. Legacy localStorage tokens migrate once into tab-scoped session storage. Diagnostics exports include only whether a token is configured and the rate-limit numbers; the token value is never exported.

### CORS Proxies

The app uses CORS proxy services with automatic sequential fallback for sources that don't support CORS natively (OpenUserJS, Userscript.Zone, GitHub Gists).

Default proxy chain:
1. `api.allorigins.win/get` (primary)
2. `api.codetabs.com` (fallback)
3. `everyorigin.jwvbremen.nl` (fallback)

**Self-hosted proxy (recommended for production):**

A Cloudflare Worker template is included in `cors-proxy/`:
```bash
cd cors-proxy
npx wrangler deploy
```
This gives you a private proxy with domain allowlisting on Cloudflare's free tier (100K req/day). The bundled Worker accepts only HTTPS requests to the exact OpenUserJS, Userscript.Zone, GitHub Gist search, and raw Gist hosts. Redirects are rejected, upstream responses are capped at 5 MB, and upstream status/content-type evidence is preserved.

To use your custom proxy, open **Diagnostics**, enter the HTTPS Worker URL, save, then run **Test**. The self-test verifies that an allowed userscript target returns the expected JSON wrapper and that an unrelated host is blocked. The app tries your proxy first, then falls back to the public proxies. Diagnostics report whether a custom proxy is configured without exporting the proxy URL.

### URL Parameters

| Parameter | Example | Description |
|-----------|---------|-------------|
| `q` | [`?q=dark+mode`](https://sysadmindoc.github.io/UserScriptHunt/?q=dark+mode) | Pre-fills search and auto-executes on page load |
| `sources` | `greasyfork,github,scriptcat` | Restores enabled source toggles |
| `site` | `youtube.com` | Restores applies-to domain filter |
| `sort` | `installs` | Restores sort order |
| `license` | `MIT` | Restores license filter |
| `min_installs` | `1000` | Restores minimum total installs filter |
| `updated` | `90` | Restores updated-within-days filter |
| `grant` | `GM_xmlhttpRequest` | Restores @grant metadata filter |
| `risk` | `danger` | Restores risk filter |

---

## Related Tools

> **ScriptHunt** is a standalone web app — open it, type any search query, and browse results across all repositories. No Tampermonkey required.
>
> If you want to find scripts **for the site you're currently browsing** without leaving the page, use the companion userscript instead:

**[UserScript-Finder](https://github.com/SysAdminDoc/UserScript-Finder)** — A Tampermonkey/Violentmonkey userscript. Adds a menu entry to your script manager that detects the current site and instantly searches for scripts matching that domain. Zero visual footprint — nothing appears on the page until you click your script manager icon.

| Tool | Use When |
|------|----------|
| **ScriptHunt** (this repo) | You want to search for any userscript by keyword, browse results, compare installs/ratings |
| **UserScript-Finder** | You're on a website and want to find scripts made specifically for that site |

---

## FAQ / Troubleshooting

**GitHub results seem broad / not all are userscripts**
GitHub source searches repositories (not individual files) using keyword matching against `userscript OR tampermonkey OR greasemonkey`. With a GitHub token set, authenticated code search additionally finds individual `.user.js` files. Status chips and diagnostics disclose the active mode, effective qualifiers, incomplete responses, code-search failures, and GitHub's 1,000-result ceiling.

**OpenUserJS or Gists return no results or fail**
These sources depend on CORS proxy availability. Public proxy services receive the target search or script URL. Diagnostics lets you disable public fallback and use only a custom proxy; without either route, proxy-dependent sources fail explicitly while other source results remain available.

**Rate limits**
GitHub enforces 10 search requests/minute for unauthenticated users (30/min with a token). Heavy pagination or rapid searching may trigger a 403 response — the app tracks rate limits and auto-backs off.

**Can I self-host a CORS proxy?**
Yes. Deploy the included Cloudflare Worker template (free tier: 100K requests/day) and set your proxy URL in localStorage.

---

## Tech Stack

- **Single-file HTML** — no build step, no bundler, no framework
- **Vanilla JavaScript (ES2022)** — async/await, Promise.allSettled, AbortController, DOMParser, Popover API
- **CSS Custom Properties** — full theming via variables with 4 theme modes
- **Source Adapter Registry** — built-in searches return a schema-v1 envelope with items, totals/pagination, partiality, latency, cache, route, HTTP status, and normalized failure evidence
- **Vendored Fonts** — OFL-licensed JetBrains Mono (logo/monospace) and Outfit (UI) WOFF2 subsets are served and cached locally
- **CORS Proxy** — optional custom route followed by an opt-out public allorigins.win → codetabs → everyorigin fallback chain with explicit target-URL disclosure
- **PWA** — manifest.json + service worker for installability, explicit update prompts, offline shell fallback notices, and local recent-search recovery
- **localStorage + IndexedDB** - preferences, favorites, source toggles, theme, recent search results, and scan cache persist locally; diagnostics can clear recoverable caches without deleting user records; no tracking, no cookies, no server-side state
- **Versioned JSON payloads** - favorites and installed-list exports use schema v1; imports validate URLs, preview invalid/duplicate/conflict counts and manager provenance, then snapshot both local lists before mutation for rollback
- **Local QA** - `npm run qa` runs npm audit, Worker tests, version/source-documentation drift checks, and browser tests against the repo-local static server; Playwright is pinned to the exact locally verified release

---

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full plan with research notes and architecture patterns.

---

## Contributing

Issues and PRs welcome. Adding a new source is simple thanks to the adapter registry:

1. Create a `srcYourSource(query, page)` async function that returns results
2. Create a `normYourSource(item)` function that normalizes to the standard schema
3. Add an entry to the `SOURCES` object with `search`, `pageSize`, colors, and default enabled state

No changes to `executeSearch()` needed — the registry dispatches automatically.

---

## License

MIT License — see [LICENSE](LICENSE) for details.
