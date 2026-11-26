// Heavy tests beyond the e2e suite (about 15 minutes in all). Build first (node build.mjs), then:
//   node tests/e2e/heavy.cjs [setups|sheets|stress|devices|perf|a11y] ...   (no names = all)
// a11y needs axe-core (npm i --no-save axe-core); it is skipped without it. The page's viewport turns off browser zoom on
// purpose (the kit has its own pinch zoom), so axe's meta-viewport finding is expected and not counted.
const { chromium, devices } = require('playwright');
const ROOT = require('path').resolve(__dirname, '../../dist') + '/';
const URL = 'file://' + ROOT + 'index.html', WEB = 'file://' + ROOT + 'web/index.html';
const want = process.argv.slice(2);
let fails = 0, passes = 0; const log = [];
const ok = (c, m) => { if (c) passes++; else { fails++; console.log('  ✗ ' + m); } };
async function page(browser, opts = {}, url = URL) {
  const ctx = await browser.newContext(opts.dev || { viewport: { width: 1500, height: 880 } }); const p = await ctx.newPage();
  p.errors = []; p.on('pageerror', e => p.errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') p.errors.push(m.text()); });
  p.on('dialog', d => d.accept());
  await p.goto(url); await p.waitForFunction(() => window.__app);
  await p.evaluate(l => { localStorage.clear(); localStorage.setItem('ett.notice', '1'); localStorage.setItem('ett.tour', '1'); localStorage.setItem('ett.fs', '0'); if (l) localStorage.setItem('ett.lang', l); }, opts.lang);
  await p.reload(); await p.waitForFunction(() => window.__app); await p.waitForTimeout(300); return p;
}
const T = async (name, fn) => { if (want.length && !want.includes(name)) return; const t0 = Date.now(); const f0 = fails; console.log(`== ${name}`); try { await fn(); } catch (e) { fails++; console.log('  ✗ crashed: ' + e.message.split('\n')[0]); } console.log(`   ${fails === f0 ? 'PASS' : 'FAIL'} (${((Date.now() - t0) / 1000).toFixed(0)} s)`); };

(async () => {
  const browser = await chromium.launch();

  // ---------------------------------------------------------------- every ready-made setup
  await T('setups', async () => {
    const p = await page(browser);
    const keys = await p.evaluate(() => Object.keys(__app.setups).sort()); ok(keys.length === 69, 'setups: ' + keys.length);
    const quiet = /Speech|Talk|No-Message|Wrong-Code|Jamming|Noise-Only|PLL|Delta-Sigma-Speech|PCM-Through-Narrow|Exp7-FM-Demodulation$|PCM-Variable-DC/i; let empty = [];
    for (const k of keys) {
      const r = await p.evaluate(async k => {
        const S = __app.setups[k]; __app.restore(S); await new Promise(r => setTimeout(r, 700));
        const out = { probes: {}, nan: false, kinds: 0 };
        for (const ch of ['CH1', 'CH2']) { const f = __app.scope.frame && __app.scope.frame[ch]; if (!S.probes || !S.probes[ch] || !f) continue;
          let lo = Infinity, hi = -Infinity; for (const v of f.y) { if (!Number.isFinite(v)) out.nan = true; else { lo = Math.min(lo, v); hi = Math.max(hi, v); } } out.probes[ch] = hi - lo; }
        for (const l of S.leads) for (const s of [l.a, l.b]) { __app.signalKind(s); out.kinds++; }
        // share link round trip
        const before = JSON.stringify((s => [s.leads.map(l => [l.a, l.b, l.color, l.bend || 0]), s.probes, s.mods, s.scope])(__app.snapshot()));
        const code = await __app.shareCode(); __app.wires.clearAll(); __app.restore({ v: 2, leads: [], probes: {} });
        location.hash = '#s=' + code; await new Promise(r => setTimeout(r, 400));
        const after = JSON.stringify((s => [s.leads.map(l => [l.a, l.b, l.color, l.bend || 0]), s.probes, s.mods, s.scope])(__app.snapshot()));
        out.share = before === after; out.len = code.length; return out;
      }, k);
      ok(!r.nan, `${k}: scope shows NaN`); ok(r.share, `${k}: share link does not give back the same setup`); ok(r.len < 2000, `${k}: link too long ${r.len}`);
      for (const [ch, pp] of Object.entries(r.probes)) if (!(pp > 0.02) && !quiet.test(k)) empty.push(`${k} ${ch} ${pp}`);
    }
    ok(!empty.length, 'flat traces: ' + empty.join('; '));
    ok(!p.errors.length, 'page errors: ' + p.errors.slice(0, 3).join(' | '));
    await p.context().close();
  });

  // ---------------------------------------------------------------- every lab sheet, every step, both languages; every figure passes its own wiring check
  await T('sheets', async () => {
    for (const lang of ['en', 'ar']) {
      const p = await page(browser, { lang });
      const sheets = await p.evaluate(() => __app.sheets.map(s => ({ id: s.id, n: s.steps.length, w: s.steps.map((st, i) => st.w ? i : -1).filter(i => i >= 0) })));
      let steps = 0, figs = 0;
      await p.click('#btnGuide');
      for (const sh of sheets) {
        await p.evaluate(() => { const b = document.getElementById('gBack'); if (b) b.click(); });
        await p.click(`.explist [data-e="${sh.id}"]`);
        for (let i = 0; i < sh.n; i++) {
          await p.click(`.stepbar button[data-i="${i}"]`); steps++;
          const txt = await p.evaluate(() => document.getElementById('guide').innerText);
          ok(txt.length > 40 && !/undefined|NaN|\{n\}|\{ch\}/.test(txt), `${lang} ${sh.id} step ${i}: bad text`);
          if (sh.w.includes(i)) {
            figs++;
            await p.evaluate(([id, i]) => __app.restore(__app.setups[__app.sheets.find(x => x.id === id).steps[i].w]), [sh.id, i]);
            await p.click('#gCheck'); await p.waitForTimeout(60);
            const good = await p.evaluate(() => !!document.querySelector('.wcheck.good') && !document.querySelector('.badLead'));
            ok(good, `${lang} ${sh.id} step ${i}: its own figure fails Check my wiring: ` + await p.evaluate(() => (document.querySelector('.wcheck') || {}).innerText));
            const ticks = await p.evaluate(() => [...document.querySelectorAll('.checks li')].every(li => li.classList.contains('ok')));
            ok(ticks, `${lang} ${sh.id} step ${i}: ticks not all done with its own figure`);
          }
        }
      }
      console.log(`   ${lang}: ${sheets.length} sheets, ${steps} steps, ${figs} figure checks`);
      ok(!p.errors.length, lang + ' page errors: ' + p.errors.slice(0, 3).join(' | '));
      await p.context().close();
    }
  });

  // ---------------------------------------------------------------- random stress: wiring, knobs, probes, undo/redo, share
  await T('stress', async () => {
    const p = await page(browser);
    const r = await p.evaluate(async () => {
      const A = __app, rnd = n => Math.floor(Math.random() * n), pick = a => a[rnd(a.length)];
      const socks = [...document.querySelectorAll('[data-socket]')].map(e => e.dataset.socket).filter((v, i, a) => a.indexOf(v) === i);
      const knobs = [...document.querySelectorAll('.knob')].map(g => [g.dataset.mod, g.dataset.p]);
      const key = () => { const s = A.snapshot(); return JSON.stringify([s.leads.map(l => [l.a, l.b]), s.probes, s.mods, s.headphones]); };
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const states = [key()], problems = []; let nan = 0;
      for (let i = 0; i < 140; i++) {
        const a = rnd(10);
        if (a < 4) A.wires.addLead(pick(socks), pick(socks), pick(['red', 'black', 'yellow', 'blue', 'green']));
        else if (a < 6 && A.sim.leads.length) A.wires.removeLead(pick(A.sim.leads).id);
        else if (a < 8) { const [m, q] = pick(knobs); A.panel.setKnob(m, q, Math.random()); }
        else if (a < 9) A.wires.setProbe(pick(['CH1', 'CH2']), Math.random() < .2 ? null : pick(socks));
        else A.wires.clearAll();
        await wait(470); // one undo step per action
        const k = key(); if (k !== states[states.length - 1]) states.push(k);
        for (const ch of ['CH1', 'CH2']) { const f = A.scope.frame && A.scope.frame[ch]; if (f) for (const v of f.y) if (!Number.isFinite(v)) { nan++; break; } }
        if (i % 35 === 34) { // share round trip of a random state
          const before = key(), code = await A.shareCode(); A.restore({ v: 2, leads: [], probes: {} }); location.hash = '#s=' + code; await wait(350);
          if (key() !== before) problems.push('share round trip ' + i); A.undo(); await wait(50); // the open was undoable: back to the same
          if (key() !== before) { A.restore(JSON.parse(JSON.stringify(A.snapshot()))); }
          states.push(key());
        }
      }
      // undo all the way the history allows, checking each step, then redo to the end
      const [hl] = A.histLen(); let back = 0, mismatch = 0; const seq = [key()];
      for (let i = 0; i < hl; i++) { A.undo(); seq.push(key()); back++; }
      for (let i = 0; i < back; i++) A.redo();
      const endOk = key() === seq[0];
      // the sequence walked back must be strictly the recorded states (in reverse)
      const rec = states.slice().reverse(); for (let i = 0; i < Math.min(seq.length, rec.length); i++) if (seq[i] !== rec[i]) { mismatch++; }
      return { n: states.length, hl, back, endOk, mismatch, nan, problems, leads: A.sim.leads.length };
    });
    console.log(`   ${r.n} states, history ${r.hl}, walked back ${r.back}, leads now ${r.leads}`);
    ok(r.endOk, 'redo did not come back to the last state'); ok(r.mismatch === 0, `undo walked through ${r.mismatch} states that were not the recorded ones`);
    ok(r.nan === 0, 'NaN on scope ' + r.nan); ok(!r.problems.length, r.problems.join(', '));
    ok(!p.errors.length, 'page errors: ' + p.errors.slice(0, 3).join(' | '));
    await p.context().close();
  });

  // ---------------------------------------------------------------- devices and languages
  await T('devices', async () => {
    const list = ['iPhone SE', 'iPhone 14 Pro Max', 'Pixel 5', 'Galaxy S8', 'iPad Mini', 'iPad Pro 11', 'Galaxy Tab S4'];
    for (const d of list) for (const orient of ['', ' landscape']) for (const lang of ['en', 'ar']) {
      const name = d + orient; if (!devices[name]) continue; const dev = { ...devices[name] }; delete dev.defaultBrowserType;
      const p = await page(browser, { dev, lang }, WEB);
      const r = await p.evaluate(async () => {
        const vw = innerWidth, vh = innerHeight, rail = document.getElementById('rail'), portraitBlock = getComputedStyle(document.getElementById('rotate')).display !== 'none';
        const inView = el => { if (!el || getComputedStyle(el).display === 'none') return true; const r = el.getBoundingClientRect(); return r.left >= -1 && r.top >= -1 && r.right <= vw + 1 && r.bottom <= vh + 1; };
        const res = { vw, vh, portraitBlock, railFit: rail.scrollWidth <= rail.clientWidth + 1, hscroll: document.documentElement.scrollWidth > vw + 1, cls: rail.className };
        __app.restore(__app.setups['Term1/01-Exp1-AM-Modulation']);
        document.getElementById('btnSettings').click(); await new Promise(r => setTimeout(r, 120)); res.settings = inView(document.getElementById('settings')); document.getElementById('btnSettings').click();
        document.getElementById('btnGuide').click(); await new Promise(r => setTimeout(r, 200)); res.guide = inView(document.getElementById('guide')); document.getElementById('btnGuide').click();
        document.getElementById('btnLib').click(); await new Promise(r => setTimeout(r, 200)); res.lib = inView(document.getElementById('lib')); document.getElementById('btnLib').click();
        res.refShown = getComputedStyle(document.getElementById('btnRef')).display !== 'none'; res.undoShown = getComputedStyle(document.getElementById('btnUndo')).display !== 'none';
        return res; });
      const tag = `${name} ${lang}`;
      if (!r.portraitBlock) { ok(r.railFit, `${tag}: toolbar overflows (${r.cls})`); ok(r.settings, `${tag}: Settings off screen`); ok(r.guide, `${tag}: lab sheet off screen`); ok(r.lib, `${tag}: Load experiment off screen`); ok(r.undoShown, `${tag}: no Undo`); }
      ok(!r.hscroll, `${tag}: page scrolls sideways`);
      ok(!p.errors.length, `${tag}: errors ` + p.errors.slice(0, 2).join(' | '));
      console.log(`   ${tag.padEnd(34)} ${r.vw}x${r.vh} ${r.portraitBlock ? 'rotate-notice' : `rail ${r.cls || '-'} ref:${r.refShown ? 'yes' : 'no'}`}`);
      await p.context().close();
    }
  });

  // ---------------------------------------------------------------- performance and long run
  await T('perf', async () => {
    { const dev = { ...devices['Pixel 5 landscape'] }; delete dev.defaultBrowserType; const p = await page(browser, { dev }, WEB);
      const cdp = await p.context().newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await p.evaluate(() => { __app.restore(__app.setups['Term2/08-Exp19-C-DSSS-Demodulation']); __app.setView('both'); }); await p.waitForTimeout(12000);
      const f = await p.evaluate(() => __fps()); console.log(`   phone at 4x slower CPU: ${f.fps.toFixed(1)} fps, scope every ${f.scopeEvery} frames`); ok(f.fps > 15, 'phone fps too low ' + f.fps);
      await p.context().close(); }
    { const p = await page(browser); const cdp = await p.context().newCDPSession(p); await cdp.send('HeapProfiler.enable');
      await p.evaluate(() => { __app.restore(__app.setups['Term2/08-Exp19-C-DSSS-Demodulation']); __app.setView('both'); });
      const heap = async () => { await cdp.send('HeapProfiler.collectGarbage'); return p.evaluate(() => performance.memory.usedJSHeapSize / 1e6); };
      await p.waitForTimeout(15000); const h1 = await heap(), f1 = await p.evaluate(() => __fps().fps);
      // two minutes with changes going on: knob turns, leads, scope menus
      for (let i = 0; i < 24; i++) { await p.evaluate(i => { __app.panel.setKnob('vco', 'FREQ', (i % 10) / 10); if (i % 4 === 0) { const s = __app.snapshot(); __app.restore(s); } }, i); await p.waitForTimeout(5000); }
      const h2 = await heap(), f2 = await p.evaluate(() => __fps().fps);
      console.log(`   desktop 2 min: heap ${h1.toFixed(1)} → ${h2.toFixed(1)} MB, fps ${f1.toFixed(0)} → ${f2.toFixed(0)}`);
      ok(h2 < h1 * 1.35 + 5, 'memory keeps growing'); ok(f2 > f1 * 0.6, 'gets slower over time'); ok(!p.errors.length, 'errors ' + p.errors.slice(0, 2).join(' | '));
      await p.context().close(); }
  });

  // ---------------------------------------------------------------- accessibility (axe-core), main screens
  await T('a11y', async () => {
    let axe; try { axe = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'); } catch (e) { console.log('   (axe-core not installed: skipped)'); return; }
    for (const lang of ['en', 'ar']) { const p = await page(browser, { lang });
      const run = async what => { await p.addScriptTag({ content: axe }).catch(() => { }); const r = await p.evaluate(async () => (await axe.run(document, { resultTypes: ['violations'], runOnly: ['wcag2a', 'wcag2aa'] })).violations.filter(v => (v.impact === 'critical' || v.impact === 'serious') && v.id !== 'meta-viewport').map(v => `${v.id}(${v.nodes.length}): ${v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(', ')}`)); console.log(`   ${lang} ${what}: ${r.length ? r.join(' | ') : 'no serious issues'}`); return r; };
      const res = [];
      res.push(...await run('main'));
      await p.click('#btnSettings'); res.push(...await run('settings')); await p.click('#btnSettings');
      await p.click('#btnGuide'); await p.click('.explist [data-e="exp3"]'); await p.click('.stepbar button[data-i="1"]'); await p.click('#gCheck'); res.push(...await run('lab sheet + check'));
      await p.click('#btnGuide'); await p.click('#btnBug'); res.push(...await run('report dialog')); await p.keyboard.press('Escape');
      ok(!res.length, `${lang}: ${res.length} serious accessibility issues`);
      await p.context().close(); }
  });

  await browser.close();
  console.log(`\n${passes} checks passed, ${fails} failed`);
  process.exit(fails ? 1 : 0);
})();
