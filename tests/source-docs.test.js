const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');

function readFile(name) {
  return fs.readFileSync(path.join(root, name), 'utf8');
}

function pngInfo(name) {
  const png = fs.readFileSync(path.join(root, name));
  assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a', `${name} should be a PNG`);
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
    colorType: png.readUInt8(25),
  };
}

test('README source table matches code source registry', () => {
  const html = readFile('index.html');
  const readme = readFile('README.md');

  const sourceMatch = html.match(/var SOURCES\s*=\s*\{([\s\S]*?)\n\s*\};\s*\n\s*\/\* -- Custom Sources/);
  assert.ok(sourceMatch, 'SOURCES registry should exist in index.html');

  const sourceRows = Array.from(sourceMatch[1].matchAll(
    /(\w+):\s*\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*method:\s*'([^']+)',\s*route:\s*'([^']+)',\s*auth:\s*'([^']+)',\s*cors:\s*'([^']+)',\s*metadata:\s*'([^']+)',\s*capabilities:\s*'([^']+)'[\s\S]*?pageSize:\s*(\d+)/g
  ), (match) => ({
    key: match[1],
    id: match[2],
    name: match[3],
    method: match[4],
    route: match[5],
    auth: match[6],
    cors: match[7],
    metadata: match[8],
    capabilities: match[9],
    pageSize: Number(match[10]),
  }));
  const codeSourceNames = sourceRows.map((source) => source.name).sort();

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
  const expectedRows = sourceRows.map((source) =>
    `| **${source.name}** | ${source.method} | ${source.route} | ${source.auth} | ${source.cors} | ${source.pageSize} | ${source.capabilities} | ${source.metadata} |`
  );
  assert.deepEqual(readmeSourceLines, expectedRows, 'README source rows should be generated from registry metadata');
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

test('package release metadata identifies the public application', () => {
  const pkg = JSON.parse(readFile('package.json'));
  assert.equal(pkg.name, 'scripthunt');
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.repository, 'github:SysAdminDoc/UserScriptHunt');
  assert.equal(pkg.homepage, 'https://sysadmindoc.github.io/UserScriptHunt/');
  assert.match(pkg.description, /seven built-in catalogs/);
});

test('PWA manifest declares install-grade PNG icons with matching dimensions', () => {
  const manifest = JSON.parse(readFile('manifest.json'));
  const expected = new Map([[192, 'icon-192.png'], [512, 'icon-512.png']]);
  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];

  for (const [size, filename] of expected) {
    const icon = icons.find((entry) => entry.src === filename);
    assert.ok(icon, `manifest should declare ${filename}`);
    assert.equal(icon.sizes, `${size}x${size}`);
    assert.equal(icon.type, 'image/png');
    const png = fs.readFileSync(path.join(root, filename));
    assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a', `${filename} should be a PNG`);
    assert.equal(png.readUInt32BE(16), size, `${filename} width should match manifest`);
    assert.equal(png.readUInt32BE(20), size, `${filename} height should match manifest`);
  }

  const serviceWorker = readFile('sw.js');
  for (const filename of expected.values()) {
    assert.ok(serviceWorker.includes(`'./${filename}'`), `${filename} should be in the offline shell`);
  }
});

test('brand and marketing assets match their published slots', () => {
  const html = readFile('index.html');
  const manifest = JSON.parse(readFile('manifest.json'));
  const mark = pngInfo('assets/brand/scripthunt-mark.png');
  assert.deepEqual([mark.width, mark.height], [1024, 1024]);
  assert.equal(mark.colorType, 6, 'canonical mark should be an RGBA PNG');

  for (const [name, width, height] of [
    ['icon-32.png', 32, 32],
    ['icon-180.png', 180, 180],
    ['assets/social-preview.png', 1280, 640],
    ['assets/screenshots/01-search.png', 1440, 1000],
    ['assets/screenshots/02-results.png', 1440, 1000],
    ['assets/screenshots/03-compare.png', 1440, 1000],
    ['assets/screenshots/04-light-results.png', 1440, 1000],
    ['assets/screenshots/05-mobile-results.png', 390, 844],
  ]) {
    const info = pngInfo(name);
    assert.deepEqual([info.width, info.height], [width, height], `${name} dimensions should match its published slot`);
  }

  const maskable = manifest.icons.find((icon) => icon.purpose === 'maskable');
  assert.ok(maskable, 'manifest should include a dedicated maskable icon');
  assert.equal(maskable.src, 'icon-maskable-512.png');
  assert.deepEqual([pngInfo(maskable.src).width, pngInfo(maskable.src).height], [512, 512]);

  assert.match(html, /assets\/brand\/scripthunt-mark\.png/);
  assert.match(html, /assets\/social-preview\.png/);
  assert.match(html, /icon-32\.png/);
  assert.match(html, /icon-180\.png/);
  assert.doesNotMatch(html, /data:image\/x-icon;base64/);

  const report = JSON.parse(readFile('assets/screenshots/capture-report.json'));
  assert.equal(report.appVersion, JSON.parse(readFile('package.json')).version);
  assert.equal(report.screenshots.length, 5);
});
