const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');

function readFile(name) {
  return fs.readFileSync(path.join(root, name), 'utf8');
}

test('all version strings match across files', () => {
  const pkg = JSON.parse(readFile('package.json'));
  const pkgVersion = pkg.version;

  const html = readFile('index.html');
  const htmlDisplayMatch = html.match(/<span class="version">v([^<]+)<\/span>/);
  assert.ok(htmlDisplayMatch, 'index.html should contain a version display span');
  assert.equal(htmlDisplayMatch[1], pkgVersion, 'index.html display version should match package.json');

  const htmlCommentMatch = html.match(/ScriptHunt v([\d.]+)/);
  assert.ok(htmlCommentMatch, 'index.html should contain a ScriptHunt version comment');
  assert.equal(htmlCommentMatch[1], pkgVersion, 'index.html comment version should match package.json');

  const sw = readFile('sw.js');
  const swMatch = sw.match(/CACHE_NAME\s*=\s*'scripthunt-v([\d.]+)'/);
  assert.ok(swMatch, 'sw.js should contain a CACHE_NAME with version');
  assert.equal(swMatch[1], pkgVersion, 'sw.js cache name version should match package.json');

  const readme = readFile('README.md');
  const readmeBadgeMatch = readme.match(/version-([\d.]+)-blue/);
  assert.ok(readmeBadgeMatch, 'README.md should contain a version badge');
  assert.equal(readmeBadgeMatch[1], pkgVersion, 'README.md badge version should match package.json');

  const changelog = readFile('CHANGELOG.md');
  const changelogMatch = changelog.match(/## \[v([\d.]+)\]/);
  assert.ok(changelogMatch, 'CHANGELOG.md should contain a version header');
  assert.equal(changelogMatch[1], pkgVersion, 'CHANGELOG.md latest version should match package.json');
});
