// Tests for the download page (docs/index.html). GitHub's API is replaced by a fake answer so the tests run offline.
const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '../../docs/index.html');
const REL = { tag_name: 'v9.9.9', published_at: '2026-11-08T10:00:00Z', assets: [
  { name: 'ETT101-Simulator-Setup-9.9.9.exe', size: 86e6, browser_download_url: 'https://example.test/win.exe' },
  { name: 'ETT101-Simulator-9.9.9-mac.dmg', size: 189e6, browser_download_url: 'https://example.test/mac.dmg' },
  { name: 'ETT101-Experiments-Setups.zip', size: 1e5, browser_download_url: 'https://example.test/setups.zip' },
  { name: 'ETT101-Model-Reference.md', size: 1e4, browser_download_url: 'https://example.test/ref.md' }] };
const UA = { win: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36', mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15', linux: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36' };
const results = []; let fails = 0;
const check = (id, name, cond, detail = '') => { results.push({ id, name, ok: !!cond }); if (!cond) fails++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${id}  ${name}${cond ? '' : '  → ' + detail}`); };

(async () => {
  const b = await chromium.launch();
  const page = async (ua, api, vp = { width: 1280, height: 900 }) => {
    const ctx = await b.newContext({ userAgent: UA[ua], viewport: vp }); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
    await ctx.route('https://api.github.com/**', r => api === 'ok' ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(REL) }) : r.abort());
    await ctx.route(/fonts\.(googleapis|gstatic)\.com|ahmed-atef-tech\.github\.io/, r => r.abort());
    await p.goto(URL); await p.waitForTimeout(600); return p;
  };
  // DL01-03 OS detection
  for (const [id, ua, light] of [['DL01', 'win', 'kWin'], ['DL02', 'mac', 'kMac'], ['DL03', 'linux', null]]) {
    const p = await page(ua, 'ok');
    const r = await p.evaluate(() => ({ win: document.querySelector('#kWin').className, mac: document.querySelector('#kMac').className, first: document.querySelector('.dl .btn').id, mine: document.querySelector('#mine').textContent }));
    if (light) check(id, `${ua}: its button is the light one and comes first`, r[light === 'kWin' ? 'win' : 'mac'].includes('btn-light') && r.first === light, JSON.stringify(r));
    else check(id, 'Linux / unknown: both buttons equal, no "your computer" line', !r.win.includes('btn-light') && !r.mac.includes('btn-light') && !r.mine, JSON.stringify(r));
    await p.context().close();
  }
  // DL04 latest release fills every link, size and version
  { const p = await page('win', 'ok'); const r = await p.evaluate(() => ({ w: document.querySelector('#kWin').href, m: document.querySelector('#kMac').href, s: document.querySelector('#lSetups').href, f: document.querySelector('#lRef').href, sz: document.querySelector('#sWin').textContent, v: document.querySelector('#scrVer').textContent, st: document.querySelector('#statusText').textContent }));
    check('DL04', 'Latest release: direct links, sizes, version on the screen and in the status', r.w.endsWith('win.exe') && r.m.endsWith('mac.dmg') && r.s.endsWith('setups.zip') && r.f.endsWith('ref.md') && r.sz === '82 MB' && r.v === 'v9.9.9' && /v9\.9\.9/.test(r.st), JSON.stringify(r)); check('DL05', 'No page errors', !p.errs.length, p.errs.join(' | ')); await p.context().close(); }
  // DL06 GitHub unreachable
  { const p = await page('win', 'fail'); const r = await p.evaluate(() => ({ w: document.querySelector('#kWin').href, st: document.querySelector('#statusText').textContent }));
    check('DL06', 'GitHub unreachable: buttons fall back to the releases page and the status says so', /releases\/latest$/.test(r.w) && /GitHub/.test(r.st), JSON.stringify(r)); await p.context().close(); }
  // DL07 language switch and memory; about stays English
  { const p = await page('win', 'ok'); await p.click('[data-lang="en"]'); const en = await p.evaluate(() => [document.documentElement.dir, document.querySelector('h1').innerText]);
    await p.reload(); await p.waitForTimeout(400); const kept = await p.evaluate(() => document.documentElement.lang);
    await p.click('[data-lang="ar"]'); const ar = await p.evaluate(() => [document.documentElement.dir, getComputedStyle(document.querySelector('.about h2')).direction, document.querySelector('.about h2').textContent]);
    check('DL07', 'Language switch, remembered after reload; "Made by" stays English in Arabic', en[0] === 'ltr' && /telecoms lab/.test(en[1]) && kept === 'en' && ar[0] === 'rtl' && ar[1] === 'ltr' && ar[2] === 'Made by Ahmed Atef', JSON.stringify({ en, kept, ar })); await p.context().close(); }
  // DL08 sizes: no horizontal scroll, panels inside the window
  { let bad = []; for (const w of [360, 390, 768, 1024, 1440, 2560, 3400]) for (const lang of ['ar', 'en']) { const p = await page('win', 'ok', { width: w, height: 900 }); await p.click(`[data-lang="${lang}"]`); await p.waitForTimeout(150);
      const r = await p.evaluate(() => { const o = []; if (document.documentElement.scrollWidth > innerWidth) o.push('h-scroll'); for (const s of ['.hero', '.about', '.nav']) { const b = document.querySelector(s).getBoundingClientRect(); if (b.left < 0 || b.right > innerWidth + 0.5) o.push(s); } return o; });
      if (r.length) bad.push(`${w} ${lang}: ${r}`); await p.context().close(); }
    check('DL08', 'Fits from 360 to 3400 px wide in both languages', !bad.length, bad.join('; ')); }
  await b.close(); console.log(`\n${results.length - fails}/${results.length} passed`); process.exit(fails ? 1 : 0);
})();
