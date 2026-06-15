# ScriptHunt

![Version](https://img.shields.io/badge/version-0.3.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Web-ff6600)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&logoColor=black)
![HTML](https://img.shields.io/badge/Single_File-HTML-E34F26?logo=html5&logoColor=white)
![Status](https://img.shields.io/badge/status-active-success)

> Unified search engine for userscripts — query Greasy Fork, Sleazy Fork, GitHub, and OpenUserJS from a single interface.

<img width="1594" height="1059" alt="image" src="https://github.com/user-attachments/assets/8be2abe9-9e0d-4564-ac4b-6baa58e53ab3" />

**Live:** https://sysadmindoc.github.io/UserScriptHunt/

ScriptHunt is a zero-dependency, single-file HTML webapp that searches every major userscript repository in parallel and merges the results into one unified, deduplicated feed. No backend required — runs entirely in the browser, deployable as a static page on GitHub Pages.

---

## Quick Start

**Local:**
```bash
git clone https://github.com/SysAdminDoc/UserScriptHunt.git
cd UserScriptHunt
open userscript-search.html
```

**GitHub Pages:**
1. Push to a GitHub repository
2. Go to **Settings → Pages → Source → Deploy from branch** (main, root)
3. Access at `https://yourusername.github.io/UserScriptHunt/`

**Direct link with pre-filled search:**
```
userscript-search.html?q=youtube+enhancer
```

---

## Features

| Feature | Description |
|---------|-------------|
| Multi-Source Search | Queries Greasy Fork, Sleazy Fork, GitHub, OpenUserJS, and Userscript.Zone simultaneously |
| Parallel Fetching | All sources searched concurrently via `Promise.allSettled()` — results stream in progressively |
| Cross-Source Dedup | Eliminates duplicate scripts with multi-source trust boost for scripts found on 2+ platforms |
| Trust Scoring | 0-100 trust score based on installs, ratings, freshness, security scan, and cross-platform presence |
| Security Scanner | Pattern-based code analysis for dangerous APIs, obfuscation, @require chain validation, crypto mining domains |
| Permission Risk Pills | Color-coded pills showing @grant danger levels (safe/warn/danger) per script |
| Script Comparison | Select up to 3 scripts for side-by-side comparison with best-value highlighting |
| Favorites | Save scripts to localStorage with export/import as JSON and undo on removal |
| Advanced Query Syntax | `site:`, `author:`, `updated:`, `grant:` operators with domain-aware by-site.json search |
| Source Toggles | Enable/disable sources with preferences persisted across sessions in localStorage |
| Live Status Chips | Real-time per-source indicators with CORS proxy health info |
| Sort Controls | Sort by relevance, trust score, total/daily installs, rating, last updated, or name |
| Infinite Scroll | Automatic pagination fetches next page from all active sources |
| Staleness Indicators | Active/Aging/Stale badges on result cards based on last update date |
| Spam Detection | Low-quality results auto-dimmed and pushed to bottom of results |
| Metadata Viewer | Formatted @-directive display with syntax highlighting |
| Bookmarklet | One-click "find scripts for this page" from any website |
| URL Parameters | Shareable search links via `?q=` query parameter |
| Keyboard Navigation | Tab/arrow key navigation, Enter to open, Escape to close modals |
| Accessibility | ARIA roles, labels, live regions for screen reader support |
| Web Share API | Native mobile sharing via share button on result cards |
| Content Security Policy | CSP meta tag restricting connections to known API domains |
| View Transitions | GPU-accelerated smooth transitions between search states |
| Skeleton Loading | Animated placeholder cards during search |
| Responsive Design | Full mobile/tablet/desktop support with CSS container queries |
| Zero Dependencies | Single HTML file, no build tools, no npm, no frameworks |
| Dark Theme | Deep dark UI with accent-colored source badges and card stripes |

---

## Supported Sources

| Source | Method | Auth Required | CORS | Per-Page | Metadata |
|--------|--------|:---:|:---:|:---:|----------|
| **Greasy Fork** | JSON API + by-site.json | No | Native (`*`) | 100 | Installs, ratings, version, dates, license, author |
| **Sleazy Fork** | JSON API (direct) | No | Native (`*`) | 100 | Same as Greasy Fork (adult-flagged scripts) |
| **GitHub** | REST API v3 | No | Native CORS | 30 | Stars, forks, language, license, dates |
| **OpenUserJS** | HTML scraping via proxy | No | Via proxy | ~25 | Name, author, install URL |
| **Userscript.Zone** | HTML scraping via proxy | No | Via proxy | ~10 | Name, description, install URL |

### Source Details

**Greasy Fork / Sleazy Fork**
- Endpoint: `https://api.greasyfork.org/en/scripts.json?q={query}&page={n}`
- Direct fetch with native CORS (`Access-Control-Allow-Origin: *`)
- Largest userscript repository (~100,000+ scripts)
- 100 results per page
- Full metadata: daily/total installs, good/bad ratings, fan score, version, license, code URL

**GitHub**
- Endpoint: `https://api.github.com/search/repositories?q={query}+userscript`
- Searches repos tagged with userscript/tampermonkey/greasemonkey keywords
- Unauthenticated rate limit: 10 requests/minute for search
- Returns stars, forks, language, license, owner info

**OpenUserJS**
- Endpoint: `https://openuserjs.org/?q={query}&orderBy=installs&orderDir=desc&p={n}`
- HTML response parsed via DOMParser (no JSON API available)
- Routed through CORS proxy (allorigins.win with codetabs fallback)
- ~12,000 scripts indexed

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Search Input                        │
│                     (450ms debounce / Enter)                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┼────────────┬────────────┐
              ▼            ▼            ▼            ▼
     ┌──────────────┐ ┌──────────┐ ┌────────┐ ┌───────────┐
     │ Greasy Fork  │ │ Sleazy   │ │ GitHub │ │ OpenUserJS│
     │  (Direct)    │ │ (Direct) │ │(Direct)│ │  (Proxy)  │
     └──────┬───────┘ └────┬─────┘ └───┬────┘ └─────┬─────┘
            │              │           │             │
            └──────────────┴─────┬─────┴─────────────┘
                                 │
                    Promise.allSettled()
                                 │
                                 ▼
                  ┌──────────────────────────┐
                  │  Normalize + Deduplicate  │
                  │   (ID + name::author)     │
                  └─────────────┬────────────┘
                                │
                                ▼
                  ┌──────────────────────────┐
                  │    Sort + Render Cards    │
                  │  (Grid with source badges)│
                  └──────────────────────────┘
```

All source requests fire in parallel. Results render progressively as each source responds — fast sources appear immediately while slower ones are still loading. Failed sources display an error chip but never block other results.

---

## Configuration

### Source Toggles

Click the source chips below the search bar to enable/disable sources at runtime. Active sources have a bright dot and highlighted border. Disabled sources are skipped entirely (no requests sent).

Default state:
- Greasy Fork: **Enabled**
- Sleazy Fork: **Disabled** (opt-in for adult content)
- GitHub: **Enabled**
- OpenUserJS: **Enabled**

### CORS Proxies

The app uses CORS proxy services with automatic sequential fallback for **OpenUserJS and Userscript.Zone** (HTML scraping). Greasy Fork, Sleazy Fork, and GitHub all have native CORS support and are fetched directly with no proxy.

Default proxy chain:
1. `api.allorigins.win/get` (primary — wraps HTML in JSON)
2. `api.codetabs.com` (fallback — passes through raw content)

**Self-hosted proxy (recommended for production):**

A Cloudflare Worker template is included in `cors-proxy/`:
```bash
cd cors-proxy
npx wrangler deploy
```
This gives you a private proxy with domain allowlisting on Cloudflare's free tier (100K req/day).

To use your custom proxy, set it in the browser console:
```javascript
localStorage.setItem('sh_pref_proxy', '"https://your-proxy.workers.dev"');
```
The app will try your proxy first, then fall back to the public proxies.

### URL Parameters

| Parameter | Example | Description |
|-----------|---------|-------------|
| `q` | `?q=dark+mode` | Pre-fills search and auto-executes on page load |

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
GitHub source searches repositories (not individual files) using keyword matching against `userscript OR tampermonkey OR greasemonkey`. This casts a wider net but may include related tools and libraries alongside actual userscripts.

**OpenUserJS returns no results or fails**
OpenUserJS results depend on CORS proxy availability. If both proxies are down or rate-limited, OpenUserJS will show a "Failed" status chip. Results from other sources will still display normally.

**Rate limits**
GitHub enforces 10 search requests/minute for unauthenticated users. Heavy pagination or rapid searching may trigger a 403 response — the app will surface this as an error chip.

**Can I self-host a CORS proxy?**
Yes. Deploy a Cloudflare Worker (free tier: 100K requests/day) as a simple CORS proxy and update the `fetchViaProxy` function.

---

## Tech Stack

- **Single-file HTML** — no build step, no bundler, no framework
- **Vanilla JavaScript (ES2022)** — async/await, Promise.allSettled, AbortController, DOMParser
- **CSS Custom Properties** — full theming via variables
- **Google Fonts** — JetBrains Mono (logo/monospace) + Outfit (UI)
- **CORS Proxy** — allorigins.win/codetabs fallback chain, only used for OpenUserJS HTML scraping
- **No localStorage** — stateless, no tracking, no cookies

---

## Roadmap

- [ ] Userscript.Zone integration (HTML scraping — would add 10+ aggregated sub-sources)
- [ ] ScriptCat store integration
- [ ] GitHub authenticated code search (`.user.js` file-level search)
- [ ] Metadata block preview (parse @match, @grant, @require from script headers)
- [ ] One-click install URLs (direct `.user.js` links for Tampermonkey/Violentmonkey)
- [ ] Search history / saved searches (sessionStorage)
- [ ] Filter by target site (e.g. show only scripts for youtube.com)
- [ ] Dark/OLED theme toggle

---

## Contributing

Issues and PRs welcome. If adding a new source, follow the existing adapter pattern:

1. Create a `searchSourceName(query, page)` async function
2. Return an array of normalized result objects matching the schema
3. Add the source to the `SOURCES` config object
4. Wire it into `executeSearch()`

---

## License

MIT License — see [LICENSE](LICENSE) for details.
