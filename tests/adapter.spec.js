const { test, expect } = require('@playwright/test');
const fixtures = require('./fixtures/source-adapters');

test('source adapters normalize representative source payloads', async ({ page }) => {
  await page.goto('/');

  const normalized = await page.evaluate((data) => ({
    greasyfork: normGF(data.greasyForkApiItem, 'greasyfork'),
    github: normGH(data.githubRepoItem),
    openuserjs: parseOUJS(data.openUserJsHtml)[0],
    uszone: parseUSZ(data.userscriptZoneHtml)[0],
    scriptcat: normSC(data.scriptCatItem),
    gists: parseGists(data.gistHtml)[0],
  }), fixtures);

  expect(normalized.greasyfork).toMatchObject({
    id: 'greasyfork-210',
    source: 'greasyfork',
    name: 'Fixture Greasy Script',
    author: 'gf-author',
    installUrl: 'https://greasyfork.org/scripts/210-fixture/code/Fixture.user.js',
    totalInstalls: 456,
    license: 'MIT',
  });

  expect(normalized.github).toMatchObject({
    id: 'github-310',
    source: 'github',
    name: 'fixture-userscript',
    author: 'fixture',
    url: 'https://github.com/fixture/fixture-userscript',
    stars: 99,
    license: 'Apache-2.0',
  });

  expect(normalized.openuserjs).toMatchObject({
    source: 'openuserjs',
    name: 'Fixture OpenUserJS',
    author: 'ou-author',
    installUrl: 'https://openuserjs.org/install/ou-author/fixture-openuserjs.user.js',
    totalInstalls: 1234,
  });

  expect(normalized.uszone).toMatchObject({
    source: 'uszone',
    name: 'Fixture Zone Script',
    url: 'https://greasyfork.org/scripts/410-fixture/code/Fixture.user.js',
    installUrl: 'https://greasyfork.org/scripts/410-fixture/code/Fixture.user.js',
  });

  expect(normalized.scriptcat).toMatchObject({
    id: 'scriptcat-510',
    source: 'scriptcat',
    name: 'Fixture ScriptCat',
    author: 'sc-author',
    installUrl: 'https://scriptcat.org/scripts/code/510/Fixture-ScriptCat.user.js',
    totalInstalls: 789,
  });

  expect(normalized.gists).toMatchObject({
    source: 'gists',
    name: 'Fixture Gist Script',
    author: 'gist-author',
    installUrl: 'https://gist.githubusercontent.com/gist-author/abc123/raw/Fixture.user.js',
  });
});
