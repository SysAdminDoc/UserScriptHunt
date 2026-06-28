module.exports = {
  greasyForkApiItem: {
    id: 210,
    name: 'Fixture Greasy Script',
    description: 'Greasy Fork fixture description.',
    users: [{ name: 'gf-author' }],
    url: 'https://greasyfork.org/en/scripts/210-fixture',
    code_url: 'https://greasyfork.org/scripts/210-fixture/code/Fixture.user.js',
    version: '2.1.0',
    daily_installs: 3,
    total_installs: 456,
    good_ratings: 21,
    bad_ratings: 1,
    created_at: '2025-01-01T00:00:00Z',
    code_updated_at: '2026-01-01T00:00:00Z',
    license: 'MIT',
  },

  githubRepoItem: {
    id: 310,
    name: 'fixture-userscript',
    full_name: 'fixture/fixture-userscript',
    description: 'GitHub fixture repository.',
    owner: { login: 'fixture' },
    html_url: 'https://github.com/fixture/fixture-userscript',
    stargazers_count: 99,
    forks_count: 4,
    created_at: '2025-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    license: { spdx_id: 'Apache-2.0' },
    language: 'JavaScript',
  },

  openUserJsHtml: `
    <div class="script-panel">
      <a href="/scripts/ou-author/fixture-openuserjs">Fixture OpenUserJS</a>
      <p class="script-description">OpenUserJS fixture description.</p>
      <span class="badge">1,234</span>
    </div>`,

  userscriptZoneHtml: `
    <div>
      <a href="https://greasyfork.org/scripts/410-fixture/code/Fixture.user.js">Fixture Zone Script</a>
      <small>Userscript.Zone fixture description.</small>
    </div>`,

  scriptCatItem: {
    id: 510,
    name: 'Fixture ScriptCat',
    description: 'ScriptCat fixture description.',
    username: 'sc-author',
    script: { version: '5.1.0' },
    today_install: 6,
    total_install: 789,
    score: 4.5,
    createtime: 1735689600,
    updatetime: 1767225600,
  },

  gistHtml: `
    <div class="gist-snippet">
      <a href="/gist-author/abc123">Fixture Gist Script</a>
      <a href="/gist-author/abc123/raw/Fixture.user.js">Fixture.user.js</a>
      <span class="author">gist-author</span>
      <div class="f6">Gist fixture description.</div>
    </div>`,
};
