const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');

function readFile(name) {
  return fs.readFileSync(path.join(root, name), 'utf8');
}

test('README source table matches code source registry', () => {
  const html = readFile('index.html');
  const readme = readFile('README.md');

  const sourceMatch = html.match(/var SOURCES\s*=\s*\{([\s\S]*?)\n\s*\};\s*\n\s*\/\* -- Custom Sources/);
  assert.ok(sourceMatch, 'SOURCES registry should exist in index.html');

  const nameMatches = sourceMatch[1].matchAll(/name:\s*'([^']+)'/g);
  const codeSourceNames = Array.from(nameMatches, (m) => m[1]).sort();

  assert.ok(codeSourceNames.length >= 6, 'Should have at least 6 sources in code');

  for (const name of codeSourceNames) {
    assert.ok(
      readme.includes(name),
      `README should mention source "${name}" from the code registry`
    );
  }

  const sourceTableMatch = readme.match(/\| Source \| Method.*\n\|[-:|]+\n([\s\S]*?)(?:\n\n|\n---)/);
  assert.ok(sourceTableMatch, 'README should have a source table');

  const readmeSourceLines = sourceTableMatch[1].trim().split('\n').filter((l) => l.startsWith('|'));
  assert.equal(
    readmeSourceLines.length,
    codeSourceNames.length,
    `README source table rows (${readmeSourceLines.length}) should match code source count (${codeSourceNames.length})`
  );
});

test('each source declares page size in code', () => {
  const html = readFile('index.html');
  const sourceMatch = html.match(/var SOURCES\s*=\s*\{([\s\S]*?)\n\s*\};\s*\n\s*\/\* -- Custom Sources/);
  assert.ok(sourceMatch);

  const idMatches = sourceMatch[1].matchAll(/(\w+):\s*\{\s*id:/g);
  const sourceIds = Array.from(idMatches, (m) => m[1]);

  for (const id of sourceIds) {
    const pageSizeRx = new RegExp(id + '.*?pageSize:\\s*(\\d+)', 's');
    const match = sourceMatch[1].match(pageSizeRx);
    assert.ok(match, `Source "${id}" should declare a pageSize`);
    assert.ok(parseInt(match[1]) > 0, `Source "${id}" pageSize should be positive`);
  }
});
