# ScriptHunt

![Version](https://img.shields.io/badge/version-0.4.0-blue)
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
npm test
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
| **Parallel Fetching** | All sources searched concurrently via `Promise.allSettled()` — results stream in progressively |
| **Cross-Source Dedup** | Eliminates duplicate scripts with trust boost for scripts found on 2+ platforms |
| **Trust Scoring** | Three-axis scoring (Popularity 40%, Security 35%, Freshness 25%) with visible dimension breakdown |
| **Security Scanner** | Pattern-based code analysis for any result with a raw `.user.js` URL, with clear blocker messages when metadata cannot be fetched |
| **Permission Risk Pills** | Color-coded pills showing @grant danger levels (safe/warn/danger) per script |
| **Script Comparison** | Select up to 3 scripts for side-by-side comparison with best-value highlighting |
| **Favorites** | Save scripts to localStorage with export/import as JSON and undo on removal |
| **Advanced Query Syntax** | `site:`, `author:`, `updated:`, `grant:` operators with domain-aware by-site.json search and metadata-backed grant filtering |
| **Advanced Filters** | Visible controls for source, license, minimum installs, updated date, @grant, risk, and applies-to domain |
| **Filter Results** | Instantly narrow loaded results by name/description/author without re-querying sources |
| **Source Health** | Auto-disables failing sources with exponential backoff; auto-re-enables after cooldown |
| **Source Toggles** | Enable/disable sources with preferences persisted across sessions |
| **Live Status Chips** | Real-time per-source indicators with CORS proxy health and suspension status |
| **Sort Controls** | Sort by relevance, trust score, total/daily installs, rating, last updated, or name |
| **Infinite Scroll** | Automatic pagination fetches next page from all active sources |
| **Staleness Indicators** | Active/Aging/Stale badges on result cards based on last update date |
| **Spam Detection** | Low-quality results auto-dimmed and pushed to bottom of results |
| **Metadata Viewer** | Formatted @-directive display with syntax highlighting |
| **Bookmarklet** | One-click "find scripts for this page" from any website (works on file:// too) |
| **URL Parameters** | Shareable search links via `?q=` query parameter |
| **Keyboard Navigation** | Tab/arrow key navigation, Enter to open, Escape to close modals |
| **Accessibility** | ARIA roles, labels, live regions for screen reader support |
| **Web Share API** | Native mobile sharing via share button on result cards |
| **Content Security Policy** | Dynamic CSP restricting connections to known API domains (supports custom proxies) |
| **View Transitions** | GPU-accelerated smooth transitions between search states |
| **Themes** | Dark, Light, OLED black, and Auto (follows OS preference) |
| **PWA** | Installable as a Progressive Web App with offline-capable service worker |
| **Responsive Design** | Full mobile/tablet/desktop support with CSS container queries |
| **Zero Dependencies** | Single HTML file, no build tools, no npm, no frameworks |

---

## Supported Sources

| Source | Method | Auth Required | CORS | Per-Page | Metadata |
|--------|--------|:---:|:---:|:---:|----------|
| **Greasy Fork** | JSON API + by-site.json | No | Native (`*`) | 100 | Installs, ratings, version, dates, license, author |
| **Sleazy Fork** | JSON API (direct) | No | Native (`*`) | 100 | Same as Greasy Fork (adult-flagged scripts) |
| **GitHub** | REST API v3 + Code Search | Optional token | Native CORS | 30 | Stars, forks, language, license, dates |
| **OpenUserJS** | HTML scraping via proxy | No | Via proxy | ~25 | Name, author, install URL |
| **Userscript.Zone** | HTML scraping via proxy | No | Via proxy | ~10 | Name, description, install URL |
| **ScriptCat** | JSON API v2 | No | Native CORS | 30 | Installs, ratings, version, dates, author |
| **GitHub Gists** | HTML scraping via proxy | No | Via proxy | ~10 | Name, author, install URL |

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

For higher rate limits and `.user.js` file-level code search, set a GitHub token:
```javascript
localStorage.setItem('sh_pref_ghtoken', '"ghp_your_token_here"');
```
This enables the code search endpoint (finds individual `.user.js` files across all repos) and increases the rate limit from 10 to 30 requests/minute.

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
This gives you a private proxy with domain allowlisting on Cloudflare's free tier (100K req/day). The bundled Worker allows only OpenUserJS, Userscript.Zone, GitHub Gist search, and raw Gist hosts.

To use your custom proxy:
```javascript
localStorage.setItem('sh_pref_proxy', '"https://your-proxy.workers.dev"');
```
The app will try your proxy first, then fall back to the public proxies. The CSP is automatically updated to allow your custom proxy domain.

### URL Parameters

| Parameter | Example | Description |
|-----------|---------|-------------|
| `q` | [`?q=dark+mode`](https://sysadmindoc.github.io/UserScriptHunt/?q=dark+mode) | Pre-fills search and auto-executes on page load |

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
GitHub source searches repositories (not individual files) using keyword matching against `userscript OR tampermonkey OR greasemonkey`. With a GitHub token set, code search additionally finds individual `.user.js` files for more precise results.

**OpenUserJS or Gists return no results or fail**
These sources depend on CORS proxy availability. If all proxies are down or rate-limited, the source will show a "Failed" status chip and auto-pause with exponential backoff. Results from other sources will still display normally.

**Rate limits**
GitHub enforces 10 search requests/minute for unauthenticated users (30/min with a token). Heavy pagination or rapid searching may trigger a 403 response — the app tracks rate limits and auto-backs off.

**Can I self-host a CORS proxy?**
Yes. Deploy the included Cloudflare Worker template (free tier: 100K requests/day) and set your proxy URL in localStorage.

---

## Tech Stack

- **Single-file HTML** — no build step, no bundler, no framework
- **Vanilla JavaScript (ES2022)** — async/await, Promise.allSettled, AbortController, DOMParser, Popover API
- **CSS Custom Properties** — full theming via variables with 4 theme modes
- **Source Adapter Registry** — adding a new source requires only a `SOURCES` entry with a `search()` function
- **Google Fonts** — JetBrains Mono (logo/monospace) + Outfit (UI)
- **CORS Proxy** — allorigins.win → codetabs → everyorigin fallback chain with exponential backoff
- **PWA** — manifest.json + service worker for installability and offline caching
- **localStorage** — preferences, favorites, source toggles, and theme persist locally; no tracking, no cookies, no server-side state

---

## Roadmap

- [ ] URL deep-linking for all state (sources, sort, filters)

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
