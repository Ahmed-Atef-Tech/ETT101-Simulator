// Responsive UI audit: phones and tablets, portrait and landscape, English and Arabic, every panel and menu.
// Build first (node build.mjs), then: node tests/e2e/ui_audit.cjs [outdir]  -> issues.json + one screenshot per state
// (about 25 minutes; ONLY='iPad|Pixel 7' limits the devices). Exits 1 if anything is found.
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..'), WEB = 'file://' + ROOT + '/dist/web/index.html', SITE = 'file://' + ROOT + '/docs/index.html';
const OUT = process.argv[2] || path.join(require('os').tmpdir(), 'ett-ui-audit'); fs.mkdirSync(OUT, { recursive: true });
const PHONES = ['iPhone SE', 'iPhone 12', 'iPhone 16 Pro Max', 'Pixel 5', 'Pixel 7', 'Galaxy S8', 'Galaxy S9+', 'Moto G4', 'Nokia Lumia 520'];
const TABLETS = ['Nexus 7', 'Galaxy Tab S9', 'Galaxy Tab S4', 'iPad Mini', 'iPad (gen 7)', 'iPad Pro 11', 'Nexus 10'];
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const issues = []; let shots = 0;

// runs in the page: everything visible in the app's own interface (not the kit drawing) must be on screen, readable and tappable
function auditPage(state) {
  const vw = innerWidth, vh = innerHeight, out = [];
  const vis = e => { if (!e) return false; const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.closest('[hidden]'); };
  const name = e => (e.id ? '#' + e.id : e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '')) + (e.textContent.trim() ? ` "${e.textContent.trim().slice(0, 24)}"` : '');
  if (document.documentElement.scrollWidth > vw + 1) out.push(['hscroll', `page scrolls sideways (${document.documentElement.scrollWidth} > ${vw})`]);
  // containers that make up the interface right now
  const roots = ['#rail', '#settings.open', '#guide.open', '#lib.open', '#refp.open', '.ctx', '#modal.open #modalBox', '#bugDlg[open]', '.tourCard', '#rotate', '#pendBar', '#colors.open'].flatMap(s => [...document.querySelectorAll(s)]).filter(vis);
  for (const root of roots) {
    const rr = root.getBoundingClientRect();
    const fixed = getComputedStyle(root).position === 'fixed' || root.id === 'rail' || root.closest('#modal') || root.tagName === 'DIALOG';
    if (rr.left < -1 || rr.top < -1 || rr.right > vw + 1 || rr.bottom > vh + 1) out.push(['offscreen', `${name(root)} goes off screen [${rr.left | 0},${rr.top | 0} → ${rr.right | 0},${rr.bottom | 0}] in ${vw}x${vh}`]);
    // interactive things inside: tappable size and not cut by the screen (inside a scrolling panel they may be below: only check horizontally)
    for (const el of root.querySelectorAll('button, a[href], input, select, textarea, label.sw, [role="button"], summary')) {
      if (!vis(el)) continue; const r = el.getBoundingClientRect();
      if (r.right > vw + 1 || r.left < -1) out.push(['offscreen', `${name(el)} is cut at the side`]);
      const tiny = Math.min(r.width, r.height); if (tiny < 28 && !el.matches('input[type=checkbox], input[type=radio], .plugsw')) out.push(['tap', `${name(el)} is ${r.width | 0}x${r.height | 0} px (hard to tap)`]);
    }
    // text that is cut off (ellipsis or overflow) in buttons, labels and headings
    for (const el of root.querySelectorAll('button, span, label, h1, h2, h3, p, li, b, div.mh, .lrow, .rowt')) {
      if (!vis(el) || el.children.length > 2) continue; const s = getComputedStyle(el);
      if ((s.overflow === 'hidden' || s.overflowX === 'hidden' || s.textOverflow === 'ellipsis' || s.whiteSpace === 'nowrap') && el.scrollWidth > el.clientWidth + 2 && el.textContent.trim().length > 2)
        out.push(['clip', `${name(el)} text is cut (${el.scrollWidth} > ${el.clientWidth})`]);
      const fsz = parseFloat(s.fontSize); if (fsz < 10.5 && el.textContent.trim().length > 1 && !el.closest('svg')) out.push(['font', `${name(el)} font ${fsz}px`]);
    }
  }
  // toolbar items must not overlap each other
  const items = [...document.querySelectorAll('#rail > *')].filter(vis).map(e => [e, e.getBoundingClientRect()]);
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) { const a = items[i][1], b = items[j][1]; if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1 && !items[j][0].matches('#colors.open') && !items[i][0].matches('#colors.open')) out.push(['overlap', `toolbar: ${name(items[i][0])} overlaps ${name(items[j][0])}`]); }
  // two open panels on top of each other, or a panel under the toolbar
  const rail = document.getElementById('rail').getBoundingClientRect();
  for (const p of ['#guide.open', '#lib.open', '#refp.open', '#settings.open'].map(s => document.querySelector(s)).filter(vis)) { const r = p.getBoundingClientRect(); if (r.top < rail.bottom - 2 && getComputedStyle(document.getElementById('rotBar')).display === 'none') out.push(['overlap', `${name(p)} starts under the toolbar (top ${r.top | 0} < ${rail.bottom | 0})`]); }
  return out.map(([k, m]) => ({ k, m, state }));
}

async function run(browser, dev, devName, lang) {
  const ctx = await browser.newContext(dev), q = await ctx.newPage(); const errs = [];
  q.on('pageerror', e => errs.push(e.message)); q.on('console', m => { if (m.type() === 'error' && !/favicon|net::ERR_FILE/.test(m.text())) errs.push(m.text()); }); q.on('dialog', d => d.accept());
  const tag = `${devName} ${lang}`, file = s => path.join(OUT, `${devName.replace(/[^A-Za-z0-9]+/g, '_')}_${lang}_${s}.png`);
  const shot = async s => { await q.screenshot({ path: file(s) }); shots++; };
  const check = async s => { const r = await q.evaluate(auditPage, s); for (const i of r) issues.push({ dev: tag, ...i }); await shot(s); };
  await q.goto(WEB); await q.waitForFunction(() => window.__app);
  await q.evaluate(l => { localStorage.clear(); localStorage.setItem('ett.notice', '1'); localStorage.setItem('ett.lang', l); localStorage.setItem('ett.fs', '0'); }, lang); await q.reload(); await q.waitForFunction(() => window.__app); await q.waitForTimeout(600);
  // first run: the welcome guide
  const portrait = dev.viewport.height > dev.viewport.width;
  if (await q.evaluate(() => !!document.querySelector('.tourCard'))) { await check('0tour'); await q.evaluate(() => { const b = [...document.querySelectorAll(".tourCard button")].find(b => /skip|تخط/i.test(b.textContent)); b && b.click(); }); await q.waitForTimeout(250); }
  const rot = await q.evaluate(() => getComputedStyle(document.getElementById('rotate')).display !== 'none');
  if (rot) { await check('1rotate'); await q.evaluate(() => document.getElementById('rotOK').click()); await q.waitForTimeout(250); }
  await q.evaluate(() => { __app.restore(__app.setups['Term1/01-Exp1-AM-Modulation']); }); await q.waitForTimeout(400);
  await check('2main');
  const tools = await q.evaluate(() => getComputedStyle(document.getElementById('rotBar')).display === 'none');
  if (tools) {
    const click = async sel => { const ok = await q.evaluate(s => { const e = document.querySelector(s); if (!e || getComputedStyle(e).display === 'none') return false; e.click(); return true; }, sel); await q.waitForTimeout(280); return ok; };
    if (await click('#btnSettings')) { await check('3settings'); await click('#btnSettings'); }
    if (await click('#btnGuide')) { await q.evaluate(() => { const b = document.querySelector('.explist [data-e="exp3"]'); b && b.click(); }); await q.waitForTimeout(150);
      await q.evaluate(() => { const b = document.querySelector('.stepbar button[data-i="1"]'); b && b.click(); }); await q.waitForTimeout(100); await q.evaluate(() => { const b = document.getElementById('gCheck'); b && b.click(); }); await q.waitForTimeout(200);
      await check('4sheet'); await click('#btnGuide'); }
    if (await click('#btnLib')) { await check('5library'); await click('#btnLib'); }
    if (await click('#btnRef')) { await check('6reference'); await click('#btnRef'); }
    // socket menu (hold) — open it the way a phone would, through its handler
    await q.evaluate(() => { const s = document.querySelector('[data-socket="mult2.KXY"]'); const r = s.getBoundingClientRect(); s.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 })); }); await q.waitForTimeout(200);
    if (await q.evaluate(() => !!document.querySelector('.sockMenu'))) { await check('7socketmenu'); await q.keyboard.press('Escape'); await q.mouse.click(5, dev.viewport.height - 5).catch(() => { }); await q.waitForTimeout(150); }
    if (await q.evaluate(() => document.getElementById('rail').classList.contains('c5'))) { await q.evaluate(() => document.querySelector('#colors .plugsw.sel').click()); await q.waitForTimeout(150); await check('8colours'); await q.evaluate(() => document.querySelector('#colors .plugsw.sel').click()); }
    if (await click('#btnBug') || await q.evaluate(() => { document.getElementById('bugMi').click(); return true; })) { await q.waitForTimeout(200); await check('9report'); await q.keyboard.press('Escape'); await q.waitForTimeout(150); }
    await q.evaluate(() => document.getElementById('btnHelp').click()); await q.waitForTimeout(250); await check('10help'); await q.evaluate(() => document.getElementById('modalX') && document.getElementById('modalX').click()); await q.waitForTimeout(150);
    await q.evaluate(() => document.getElementById('btnOpenLink').click()); await q.waitForTimeout(250); await check('11openlink'); await q.evaluate(() => document.getElementById('modalX') && document.getElementById('modalX').click()); await q.waitForTimeout(150);
    await q.evaluate(() => __app.setView('scope')); await q.waitForTimeout(300); await check('12scope');
  }
  for (const e of errs) issues.push({ dev: tag, k: 'error', m: e, state: '-' });
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  const list = [...PHONES, ...TABLETS];
  for (const d of list) for (const o of ['', ' landscape']) for (const lang of ['en', 'ar']) {
    const n = d + o; if (ONLY && !ONLY.test(n)) continue; const dev = { ...devices[n] }; delete dev.defaultBrowserType;
    try { await run(browser, dev, n, lang); } catch (e) { issues.push({ dev: `${n} ${lang}`, k: 'crash', m: e.message.split('\n')[0], state: '-' }); }
    process.stdout.write('.');
  }
  // the download page
  for (const d of ['iPhone SE', 'Pixel 7', 'iPad Mini', 'iPad Mini landscape', 'Pixel 7 landscape']) {
    const dev = { ...devices[d] }; delete dev.defaultBrowserType; const ctx = await browser.newContext(dev), q = await ctx.newPage(); const errs = []; q.on('pageerror', e => errs.push(e.message));
    await q.goto(SITE); await q.waitForTimeout(700);
    const r = await q.evaluate(() => { const vw = innerWidth, out = []; if (document.documentElement.scrollWidth > vw + 1) out.push({ k: 'hscroll', m: `download page scrolls sideways (${document.documentElement.scrollWidth} > ${vw})` });
      for (const el of document.querySelectorAll('a, button, img, h1, h2, p, li, table, pre, code')) { const s = getComputedStyle(el); if (s.display === 'none') continue; const b = el.getBoundingClientRect(); if (b.width && (b.right > vw + 1)) out.push({ k: 'offscreen', m: `download page: ${el.tagName} "${el.textContent.trim().slice(0, 30)}" runs past the side (${b.right | 0} > ${vw})` });
        if (el.matches('a, button') && b.width && Math.min(b.width, b.height) < 24 && el.textContent.trim()) out.push({ k: 'tap', m: `download page: link "${el.textContent.trim().slice(0, 30)}" is ${b.width | 0}x${b.height | 0}` }); }
      return out; });
    for (const i of r) issues.push({ dev: d + ' (download page)', state: 'site', ...i }); for (const e of errs) issues.push({ dev: d + ' (download page)', k: 'error', m: e, state: 'site' });
    await q.screenshot({ path: path.join(OUT, `site_${d.replace(/[^A-Za-z0-9]+/g, '_')}.png`), fullPage: true }); shots++; await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'issues.json'), JSON.stringify(issues, null, 1));
  const by = {}; for (const i of issues) { const key = `${i.k} | ${i.state} | ${i.m.replace(/\d+x\d+ px|\[[^\]]*\]|\(\d+ > \d+\)|in \d+x\d+/g, '#')}`; (by[key] = by[key] || []).push(i.dev); }
  console.log(`\n${shots} screenshots, ${issues.length} findings, ${Object.keys(by).length} distinct`);
  for (const [k, v] of Object.entries(by).sort((a, b) => b[1].length - a[1].length)) console.log(`${String(v.length).padStart(3)}  ${k}   e.g. ${[...new Set(v)].slice(0, 3).join(', ')}`);
  process.exit(issues.length ? 1 : 0);
})();
