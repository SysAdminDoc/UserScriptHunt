# Blocked Roadmap

- [ ] P2: Add CI smoke workflow for static app and Worker
  Blocked: Project rules prohibit GitHub Actions workflows; use the local deterministic `npm run qa` path instead.
  Evidence: `ROADMAP.md` item requested `.github/workflows/`; global repo rules forbid GitHub Actions for builds/tests/deploys.
  Touches: `.github/workflows/`, `package.json`, `tests/`, `cors-proxy/worker.js`.
  Acceptance: Unblock only if repository policy changes to allow GitHub Actions, then CI would run install, Playwright smoke tests, and Worker allowlist tests on pull requests.
  Complexity: M
