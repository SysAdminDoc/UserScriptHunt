const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');

const repo = path.resolve(__dirname, '..');
const appVersion = require(path.join(repo, 'package.json')).version;
const output = path.join(repo, 'assets', 'screenshots');
const socialPreview = path.join(repo, 'assets', 'social-preview.png');
const port = Number(process.env.SCRIPTHUNT_CAPTURE_PORT || 3218);
const fixedTime = new Date('2026-09-06T14:00:00Z');

const results = [
  {
    id: 401,
    name: 'YouTube Enhancer',
    description: 'Cleaner controls, playback shortcuts, and a focused theater layout.',
    users: [{ name: 'PixelPilot' }],
    url: 'https://greasyfork.org/en/scripts/401-youtube-enhancer',
    code_url: 'https://greasyfork.org/scripts/401-youtube-enhancer/code/YouTube%20Enhancer.user.js',
    version: '3.8.2',
    daily_installs: 184,
    total_installs: 284300,
    good_ratings: 1460,
    bad_ratings: 21,
    created_at: '2024-01-10T00:00:00Z',
    code_updated_at: '2026-08-29T00:00:00Z',
    license: 'MIT'
  },
  {
    id: 402,
    name: 'Sponsor Timeline Tools',
    description: 'Marks sponsored segments and adds precise chapter navigation.',
    users: [{ name: 'OpenVideoLab' }],
    url: 'https://greasyfork.org/en/scripts/402-sponsor-timeline-tools',
    code_url: 'https://greasyfork.org/scripts/402-sponsor-timeline-tools/code/Sponsor%20Timeline%20Tools.user.js',
    version: '2.4.0',
    daily_installs: 97,
    total_installs: 128900,
    good_ratings: 833,
    bad_ratings: 14,
    created_at: '2024-04-02T00:00:00Z',
    code_updated_at: '2026-08-22T00:00:00Z',
    license: 'GPL-3.0'
  },
  {
    id: 403,
    name: 'YouTube Focus Mode',
    description: 'Hides recommendation loops while keeping search and subscriptions handy.',
    users: [{ name: 'QuietWeb' }],
    url: 'https://greasyfork.org/en/scripts/403-youtube-focus-mode',
    code_url: 'https://greasyfork.org/scripts/403-youtube-focus-mode/code/YouTube%20Focus%20Mode.user.js',
    version: '1.9.5',
    daily_installs: 61,
    total_installs: 87600,
    good_ratings: 504,
    bad_ratings: 8,
    created_at: '2025-02-12T00:00:00Z',
    code_updated_at: '2026-08-18T00:00:00Z',
    license: 'Apache-2.0'
  },
  {
    id: 404,
    name: 'Cinema Keyboard Controls',
    description: 'Adds precise seek, speed, subtitle, and volume controls for video sites.',
    users: [{ name: 'FrameByFrame' }],
    url: 'https://greasyfork.org/en/scripts/404-cinema-keyboard-controls',
    code_url: 'https://greasyfork.org/scripts/404-cinema-keyboard-controls/code/Cinema%20Keyboard%20Controls.user.js',
    version: '5.2.1',
    daily_installs: 43,
    total_installs: 63200,
    good_ratings: 381,
    bad_ratings: 6,
    created_at: '2024-09-06T00:00:00Z',
    code_updated_at: '2026-08-11T00:00:00Z',
    license: 'MIT'
  },
  {
    id: 405,
    name: 'Playlist Workspace',
    description: 'Organizes long playlists with notes, filters, and local progress tracking.',
    users: [{ name: 'QueueCraft' }],
    url: 'https://greasyfork.org/en/scripts/405-playlist-workspace',
    code_url: 'https://greasyfork.org/scripts/405-playlist-workspace/code/Playlist%20Workspace.user.js',
    version: '1.6.0',
    daily_installs: 28,
    total_installs: 41800,
    good_ratings: 226,
    bad_ratings: 4,
    created_at: '2025-01-22T00:00:00Z',
    code_updated_at: '2026-08-03T00:00:00Z',
    license: 'BSD-3-Clause'
  },
  {
    id: 406,
    name: 'Transcript Search Panel',
    description: 'Searches captions in place and jumps directly to matching moments.',
    users: [{ name: 'CaptionLab' }],
    url: 'https://greasyfork.org/en/scripts/406-transcript-search-panel',
    code_url: 'https://greasyfork.org/scripts/406-transcript-search-panel/code/Transcript%20Search%20Panel.user.js',
    version: '2.1.3',
    daily_installs: 19,
    total_installs: 27500,
    good_ratings: 188,
    bad_ratings: 3,
    created_at: '2025-04-17T00:00:00Z',
    code_updated_at: '2026-07-27T00:00:00Z',
    license: 'MIT'
  }
];

function safeScriptFor(url) {
  const id = Number(new URL(url).pathname.match(/\/scripts\/(\d+)-/)?.[1]);
  const result = results.find((item) => item.id === id) || results[0];
  return `// ==UserScript==
// @name ${result.name}
// @namespace https://example.com/scripthunt
// @version ${result.version}
// @description ${result.description}
// @license ${result.license}
// @match https://www.youtube.com/*
// @grant none
// ==/UserScript==
document.documentElement.dataset.scripthuntFixture = 'ready';
`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await delay(100);
  }
  throw new Error('Static server did not start.');
}

async function preparePage(context, baseURL) {
  const page = await context.newPage();
  await page.clock.setFixedTime(fixedTime);
  await page.addInitScript(() => {
    Object.defineProperty(Performance.prototype, 'now', {
      configurable: true,
      value: () => 1000
    });
    localStorage.setItem('sh_pref_sources', JSON.stringify({
      greasyfork: true,
      sleazyfork: false,
      github: false,
      openuserjs: false,
      uszone: false,
      scriptcat: false,
      gists: false
    }));
    localStorage.setItem('sh_pref_theme', JSON.stringify('dark'));
    localStorage.setItem('sh_pref_locale', JSON.stringify('en'));
  });
  await page.route('https://api.greasyfork.org/**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify(results)
  }));
  await page.route(/https:\/\/greasyfork\.org\/scripts\/\d+-.*/, (route) => route.fulfill({
    contentType: 'text/javascript',
    body: safeScriptFor(route.request().url())
  }));
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content: '*{animation:none!important;transition:none!important;caret-color:transparent!important}'
  });
  return page;
}

async function runSearch(page) {
  await page.fill('#searchInput', 'youtube');
  await page.press('#searchInput', 'Enter');
  await page.locator('.result-card').first().waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelectorAll('.result-card').length === 6);
}

async function scanTopCards(page, count) {
  const cards = page.locator('.result-card');
  for (let index = 0; index < count; index += 1) {
    const card = cards.nth(index);
    await card.locator('[data-action="scan"]').click();
    await card.locator('.trust-toggle').waitFor({ state: 'visible' });
    await page.waitForFunction((cardIndex) => {
      const cardElement = document.querySelectorAll('.result-card')[cardIndex];
      return cardElement && !cardElement.querySelector('.trust-toggle').textContent.includes('Unscanned');
    }, index);
    await card.locator('[data-action="scan"]').click();
  }
}

async function captureApp(browser, baseURL) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'dark',
    deviceScaleFactor: 1,
    serviceWorkers: 'block'
  });
  const page = await preparePage(context, baseURL);
  await page.screenshot({ path: path.join(output, '01-search.png') });

  await runSearch(page);
  await scanTopCards(page, 3);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(output, '02-results.png') });

  const cards = page.locator('.result-card');
  await cards.nth(0).locator('[data-action="compare"]').click();
  await cards.nth(1).locator('[data-action="compare"]').click();
  await page.locator('.compare-go').click();
  await page.locator('#modalOverlay.visible').waitFor({ state: 'visible' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(output, '03-compare.png') });
  await page.locator('.modal-close').click();
  await page.locator('#compareClear').click();
  await page.waitForFunction(() => !document.querySelector('.result-card.selected'));
  await page.waitForTimeout(450);

  await page.evaluate(() => applyTheme('light'));
  await page.waitForTimeout(80);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(output, '04-light-results.png') });
  await context.close();

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: 'dark',
    deviceScaleFactor: 1,
    serviceWorkers: 'block'
  });
  const mobilePage = await preparePage(mobileContext, baseURL);
  await runSearch(mobilePage);
  await scanTopCards(mobilePage, 1);
  await mobilePage.evaluate(() => {
    const stats = document.getElementById('statsBar');
    if (stats) window.scrollTo(0, Math.max(0, stats.offsetTop - 18));
  });
  await mobilePage.screenshot({ path: path.join(output, '05-mobile-results.png') });
  await mobileContext.close();
}

async function captureSocialPreview(browser) {
  const mark = await fs.readFile(path.join(repo, 'assets', 'brand', 'scripthunt-mark.png'));
  const screenshot = await fs.readFile(path.join(output, '02-results.png'));
  const outfit = await fs.readFile(path.join(repo, 'fonts', 'outfit-latin.woff2'));
  const mono = await fs.readFile(path.join(repo, 'fonts', 'jetbrains-mono-latin.woff2'));
  const context = await browser.newContext({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.setContent(`<!doctype html>
    <html><head><style>
      @font-face{font-family:Outfit;src:url(data:font/woff2;base64,${outfit.toString('base64')}) format('woff2');font-weight:300 700}
      @font-face{font-family:JetBrainsMono;src:url(data:font/woff2;base64,${mono.toString('base64')}) format('woff2');font-weight:400 700}
      *{box-sizing:border-box}html,body{width:1280px;height:640px;margin:0;overflow:hidden}
      body{font-family:Outfit,Segoe UI,sans-serif;background:#060810;color:#eef4ff}
      main{height:100%;display:grid;grid-template-columns:500px 1fr;gap:44px;padding:58px 54px 54px 62px;position:relative}
      main:before{content:'';position:absolute;left:0;top:0;bottom:0;width:9px;background:#1688ff}
      .brand{display:flex;align-items:center;gap:13px;margin-bottom:58px}
      .brand img{width:66px;height:66px;object-fit:contain}
      .brand strong{font-family:JetBrainsMono,monospace;font-size:29px;letter-spacing:-1px}
      .eyebrow{font-family:JetBrainsMono,monospace;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#52dfff;margin-bottom:16px}
      h1{font-size:48px;line-height:1.02;letter-spacing:-1.7px;margin:0 0 22px;max-width:450px}
      p{font-size:20px;line-height:1.45;color:#9aa9bf;margin:0;max-width:430px}
      .facts{display:grid;grid-template-columns:repeat(2,max-content);gap:11px 28px;margin-top:34px;color:#dbe6f8;font-size:14px}
      .facts span:before{content:'';display:inline-block;width:7px;height:7px;border-radius:50%;background:#1688ff;margin-right:9px}
      .preview{height:500px;align-self:center;border:1px solid #29344a;background:#0b0e16;border-radius:14px;padding:10px;box-shadow:0 26px 70px rgba(0,0,0,.48);overflow:hidden}
      .preview img{width:100%;height:100%;display:block;object-fit:cover;object-position:top center;border-radius:8px}
    </style></head><body><main>
      <section>
        <div class="brand"><img src="data:image/png;base64,${mark.toString('base64')}" alt=""><strong>ScriptHunt</strong></div>
        <div class="eyebrow">Userscript discovery</div>
        <h1>Find better scripts. See the evidence.</h1>
        <p>Search seven catalogs at once. Compare trust and inspect metadata before you install.</p>
        <div class="facts"><span>Seven catalogs</span><span>No account</span><span>Local favorites</span><span>Offline ready</span></div>
      </section>
      <div class="preview"><img src="data:image/png;base64,${screenshot.toString('base64')}" alt=""></div>
    </main></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: socialPreview });
  await context.close();
}

async function main() {
  await fs.rm(output, { recursive: true, force: true });
  await fs.mkdir(output, { recursive: true });
  const server = spawn(process.execPath, ['tests/static-server.js', String(port), '.'], {
    cwd: repo,
    stdio: 'ignore',
    windowsHide: true
  });

  let browser;
  try {
    const baseURL = `http://127.0.0.1:${port}`;
    await waitForServer(baseURL);
    browser = await chromium.launch({ headless: true });
    await captureApp(browser, baseURL);
    await captureSocialPreview(browser);
    await fs.writeFile(path.join(output, 'capture-report.json'), `${JSON.stringify({
      appVersion,
      capturedAt: fixedTime.toISOString(),
      fixtureQuery: 'youtube',
      screenshots: [
        { file: '01-search.png', viewport: '1440x1000', theme: 'dark', state: 'search' },
        { file: '02-results.png', viewport: '1440x1000', theme: 'dark', state: 'results' },
        { file: '03-compare.png', viewport: '1440x1000', theme: 'dark', state: 'comparison' },
        { file: '04-light-results.png', viewport: '1440x1000', theme: 'light', state: 'results' },
        { file: '05-mobile-results.png', viewport: '390x844', theme: 'dark', state: 'results' }
      ]
    }, null, 2)}\n`, 'utf8');
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
