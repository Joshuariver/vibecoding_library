// Development check only: uses the sibling academy's installed puppeteer-core.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const net = require('node:net');
const { spawn } = require('node:child_process');
const puppeteer = require(path.resolve(__dirname, '../../academy/node_modules/puppeteer-core'));
const appDir = path.resolve(__dirname, '..');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let checks = 0;
function check(value, label) { assert.ok(value, label); checks++; console.log('PASS ' + label); }
async function freePort() {
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function waitForServer(url, child, logs) {
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error('Python exited: ' + logs());
    try { if ((await fetch(url)).ok) return; } catch (_) {}
    await sleep(100);
  }
  throw new Error('Server did not start: ' + logs());
}
async function route(page, hash) {
  await page.evaluate(value => { location.hash = value; }, hash);
  await sleep(250);
}
async function exercise(browser, prefix) {
  const port = await freePort();
  let output = '';
  const child = spawn(process.env.PYTHON || 'python', [path.join(appDir, 'main.py')], {
    cwd: appDir, windowsHide: true,
    env: { ...process.env, PORT: String(port), APP_ROOT_PATH: prefix, PYTHONDONTWRITEBYTECODE: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', d => { output += d; });
  child.stderr.on('data', d => { output += d; });
  let spawnError;
  child.on('error', e => { spawnError = e; });
  let proxy, page;
  try {
    await waitForServer(`http://127.0.0.1:${port}/healthz`, child, () => String(spawnError || output));
    let base = `http://127.0.0.1:${port}/`;
    if (prefix) {
      // Reproduce the DEJ reverse proxy, including stripping the public prefix.
      proxy = http.createServer((req, res) => {
        if (!req.url.startsWith(prefix)) { res.writeHead(404).end(); return; }
        const upstream = http.request({ hostname: '127.0.0.1', port,
          path: req.url.slice(prefix.length) || '/', method: req.method, headers: req.headers }, incoming => {
          res.writeHead(incoming.statusCode, incoming.headers); incoming.pipe(res);
        });
        upstream.on('error', () => res.writeHead(502).end());
        req.pipe(upstream);
      });
      await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve));
      // Deliberately omit the trailing slash to verify the generated base URL.
      base = `http://127.0.0.1:${proxy.address().port}${prefix}`;
    }
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    const errors = [], failed = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('requestfailed', req => failed.push(req.url()));
    page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
    await page.goto(base, { waitUntil: 'networkidle0' });
    check(await page.$$eval('.lv-card', items => items.length === 3), `${prefix || '/'} home cards`);
    await page.evaluate(() => {
      Store.setCheck('101', 0, true); Store.toggleFav('101-p4-1');
    });
    await page.reload({ waitUntil: 'networkidle0' });
    check(await page.evaluate(() => Store.persistent && Store.checkCount('101') === 1 && Store.isFav('101-p4-1')), 'progress survives reload');
    await route(page, '#/101/guide/s4');
    check(await page.$$eval('.codebox .copy', items => items.length === 9), 'guide prompts');
    await page.click('.codebox .copy');
    await sleep(150);
    check(await page.evaluate(() => /복사됨/.test(document.querySelector('.codebox .copy').textContent) || !!document.querySelector('.toast')), 'copy action');
    await page.keyboard.down('Control'); await page.keyboard.press('k'); await page.keyboard.up('Control');
    await page.waitForSelector('#srchQ', { visible: true });
    await page.type('#srchQ', '토큰'); await sleep(250);
    check(await page.$$eval('.srch-item', items => items.length > 0), 'search');
    await page.keyboard.press('Escape');
    await route(page, '#/101/labs/03');
    await page.waitForFunction(() => document.querySelector('.labframe')?.style.height);
    let frame = page.frames().find(f => /101-03\.html/.test(f.url()));
    check(!!frame && frame.url().includes(prefix + '/labs/'), 'iframe retains deployment prefix');
    await frame.waitForSelector('#flowBtn');
    await frame.click('#flowBtn');
    check(await frame.$eval('#flowMsg', el => /요청|화면|API|백엔드/.test(el.textContent)), 'interactive lab');
    check(await page.$eval('.labframe', el => parseInt(el.style.height, 10) >= 360), 'iframe height messages');
    await page.click('#themeBtn'); await sleep(200);
    const theme = await page.evaluate(() => document.documentElement.dataset.theme);
    check(await frame.evaluate(value => document.documentElement.dataset.theme === value, theme), 'theme messages');
    await route(page, '#/101/labs/01');
    frame = page.frames().find(f => /101-01\.html/.test(f.url()));
    await frame.waitForSelector('#p_role');
    for (const selector of ['#p_role', '#p_ctx', '#p_cond', '#p_out', '#p_role', '#p_ctx']) await frame.click(selector);
    await page.waitForFunction(() => Store.isLabDone('101', '101-01'));
    check(true, 'automatic lab completion');
    await route(page, '#/300');
    check(await page.$eval('#view', el => /잠김/.test(el.textContent)), 'advanced level locked');
    await page.evaluate(() => { for (let i = 0; i < 10; i++) Store.setCheck('201', i, true); });
    await route(page, '#/301/guide');
    check(await page.$eval('h1.page', el => /해외영업/.test(el.textContent)), 'advanced level unlocked');
    for (const hash of ['#/glossary', '#/prompts', '#/me', '#/101/quiz']) {
      await route(page, hash);
      check(await page.$eval('#view', el => el.textContent.trim().length > 50), hash + ' content');
    }
    // Load every lab in the browser, not only the interacted examples.
    const labs = fs.readdirSync(path.join(appDir, 'static/labs')).filter(name => name.endsWith('.html'));
    check(labs.length === 47, '47 labs present');
    const labPage = await browser.newPage();
    labPage.on('pageerror', error => errors.push(error.message));
    try {
      for (const file of labs) {
        const response = await labPage.goto(new URL('labs/' + file, base.endsWith('/') ? base : base + '/').href);
        assert.equal(response.status(), 200, file);
      }
    } finally { await labPage.close(); }
    check(true, 'all 47 labs load');
    await page.setViewport({ width: 390, height: 800 });
    await route(page, '#/101/labs/05');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'mobile width');
    check(errors.length === 0, 'no JavaScript errors: ' + errors.join('; '));
    check(failed.length === 0, 'no failed requests: ' + failed.join('; '));
  } catch (error) {
    console.error('Browser scenario failed:', error); throw error;
  } finally {
    if (page) await page.close();
    if (proxy) { proxy.closeAllConnections(); await new Promise(resolve => proxy.close(resolve)); }
    if (child.exitCode === null) {
      const exited = new Promise(resolve => child.once('exit', resolve));
      child.kill(); await exited;
    }
  }
}
(async () => {
  const executablePath = [process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium',
  ].find(value => value && fs.existsSync(value));
  assert.ok(executablePath, 'Set CHROME_PATH to a Chrome/Edge executable');
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    await exercise(browser, '');
    await exercise(browser, '/project/academy/test-user/proxy/8000');
    console.log(`All ${checks} browser checks passed`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
