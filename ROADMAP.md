# Roadmap

Forward-looking plans for ScriptHunt — zero-dependency, single-file HTML web app that searches Greasy Fork, Sleazy Fork, GitHub, and OpenUserJS in parallel. v0.0.4 today.

## Planned Features

### Sources
- Add: GitHub Gists, GitLab snippets, userstyles.world (CSS), Chrome Web Store extensions
- Add: AMO (Firefox addons), Tampermonkey script catalog, BuiltWith-style "detect what scripts this site has"
- Source auth: optional GitHub token + OAuth device flow so authenticated searches get 5000 req/h instead of 60

### Search
- Full-text query across `@description`, `@name`, `@match` with highlighted matches
- Filter panel: license, min rating, install count range, updated within N months, has/lacks `@grant` types
- Sort: daily installs, weekly installs, updated date, rating, author reputation
- Saved queries pinned to sidebar
- URL deep-linking for filters (`?q=reddit&src=gf,gh&sort=installs&since=90d`)

### Results & Install
- Expand a card to see source preview with syntax highlighting (Prism inline, no build step)
- `@match` matrix — show which of the user's URL inputs each script actually targets
- One-click install via `raw.githubusercontent.com` / `greasyfork.org/scripts/N/.user.js` redirects
- Clipboard copy for install URL + QR code for mobile
- Dedup across sources (name + author) — current behavior expanded with author-alias normalization

### Performance & Offline
- Service worker cache of static HTML + last-N searches for offline browse
- IndexedDB of the user's install history to show "already installed"
- Background revalidation — stale-while-revalidate on source fetches

### Trust
- Flag dangerous `@grant` combinations
- Author reputation score (account age, total installs, fork count)
- Source code diff when a script has an update since last visit
- Malicious-pattern scanner (hardcoded exfil URLs, crypto miners, eval-of-remote-fetch)

## Competitive Research

- **Greasy Fork native search**: baseline — lacks cross-source merge and dedup. We win there.
- **UserScript Finder** (sibling project): in-page companion to ScriptHunt. Keep feature parity so users can pick either.
- **awesome-userscripts repos on GitHub**: community lists, curated. Ingest as a "curated" source with editorial labels.
- **Chrome Web Store / AMO search**: browser extensions are the main alternative to userscripts. Surface them side-by-side so users pick the right tool.

## Nice-to-Haves

- RSS feed of "new scripts for this domain" users can subscribe to
- Browser-extension companion that auto-opens ScriptHunt on any new domain you visit
- "Kit" concept — curated bundles (YouTube Kit, Reddit Kit) that users install with one click
- Script-version watcher — notify when a tracked script updates
- Embed widget (`<iframe>` mode) for blogs to show scripts relevant to their topic
- Side-by-side source diff between two scripts that claim to do the same thing

## Open-Source Research (Round 2)

### Related OSS Projects
- https://github.com/greasyfork-org/greasyfork — upstream GF (OpenAPI-ish endpoints, scripts.json)
- https://github.com/OpenUserJs/OpenUserJS.org — OpenUserJS source + API
- https://github.com/ish4ra/greasyforksearch — multi-site aggregation reference
- https://github.com/ChinaGodMan/UserScripts — Google CSE advanced-operator patterns
- https://github.com/F9y4ng/GreasyFork-Scripts — search-engine-assistant UX ideas
- https://github.com/awesome-scripts/awesome-userscripts — seed taxonomy / curation
- https://github.com/violentmonkey/violentmonkey — install-handoff target
- https://github.com/Tampermonkey/tampermonkey — install-handoff target
- https://github.com/nextapps-de/flexsearch — zero-dep in-browser full-text index (fits single-file HTML)
- https://github.com/krisk/Fuse — fuzzy search library (smaller footprint than flexsearch)

### Features to Borrow
- `scripts.json` bulk-fetch then client-side FlexSearch index — no backend, fits single-file deploy (greasyfork-org API)
- Fuse.js fuzzy match for typos / synonyms (smaller than flexsearch, simpler)
- Domain-match filter ("scripts that run on `*.youtube.com`") using GF's `applies-to` metadata
- Install-count / rating / updated-at sortable columns backed by GF stats (greasyfork-org)
- OpenUserJS federation via its `?output=json` endpoint (OpenUserJS)
- Google Custom Search Engine fallback for GitHub-hosted scripts (ChinaGodMan pattern)
- "Similar scripts" column using tag co-occurrence from awesome-userscripts graph
- Install-handoff via clicking `install` navigates to `*.user.js` raw URL — Tampermonkey/Violentmonkey capture automatically
- Embed widget (`<iframe>` mode) already in roadmap — implement as separate HTML shell rendering filtered view
- RSS/Atom feed per search — "new scripts matching X" (GF already offers per-script RSS; aggregate client-side)

### Patterns & Architectures Worth Studying
- Static-first + client-side indexing: ship a nightly-built JSON of the top N scripts, index in-browser
- Source-adapter layer with unified `ScriptResult` shape: `{ id, source, name, author, appliesTo[], installs, updatedAt, rawUrl }`
- GitHub Pages + GitHub Actions nightly rebuild cron — zero hosting cost for always-fresh index
- IndexedDB cache of last N searches with TTL, using Service Worker for offline access (PWA pattern)
- Shareable query URL (`?q=...&source=gf,ouj&domain=youtube.com`) for linking results
