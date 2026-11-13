// End-to-end test suite for the simulator page (dist/index.html), driven through Chromium with Playwright.
// Run:  node build.mjs && node tests/e2e/suite.cjs [--only=LD] [--monkey=3000] [--json=out.json]
// Every test also fails if the page throws or logs an error while it runs.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');

const URL = 'file://' + path.resolve(__dirname, '../../dist/index.html');
const ARGS = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const results = [];
let browser;

// ------------------------------------------------------------------ harness
const tests = [];
const T = (id, area, name, fn) => tests.push({ id, area, name, fn });
class Fail extends Error { }
const ok = (c, msg) => { if (!c) throw new Fail(msg); };
const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Fail(`${msg}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`); };

async function open(opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1600, height: 900 }, acceptDownloads: true, locale: 'en-US' });
  const p = await ctx.newPage();
  p.errs = []; p.dialogs = [];
  p.on('pageerror', e => p.errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_FILE_NOT_FOUND|net::/.test(m.text())) p.errs.push('console: ' + m.text()); });
  p.on('dialog', d => { p.dialogs.push(d.message()); (p.dialogAnswer === false ? d.dismiss() : d.accept()).catch(() => { }); });
  if (opts.init) await p.addInitScript(opts.init);
  await p.goto(URL); await p.waitForFunction(() => window.__app && window.__app.sim);
  if (!opts.keep) { await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ett.notice', '1'); }); await p.reload(); await p.waitForFunction(() => window.__app); }
  else await p.evaluate(() => document.getElementById('modal').classList.remove('open'));
  await p.waitForTimeout(250);
  return p;
}
const center = (p, sel) => p.evaluate(sel => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
const sock = (p, s) => center(p, `[data-socket="${s}"]`);
async function drag(p, a, b, steps = 8) { await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(b.x, b.y, { steps }); await p.mouse.up(); await p.waitForTimeout(60); }
async function wire(p, s1, s2) { await drag(p, await sock(p, s1), await sock(p, s2)); }
const app = (p, fn, arg) => p.evaluate(fn, arg);
const leads = p => app(p, () => __app.sim.leads.map(l => ({ a: l.a, b: l.b, color: l.color, bend: l.bend })));
async function loadSetup(p, f) {
  await p.click('#btnLib'); const tab = f.startsWith('Term1') ? 't1' : f.startsWith('Term2') ? 't2' : 'x';
  await p.click(`.ltab[data-tab="${tab}"]`); await p.click(`.lrow[data-f="${f}"]`); await p.waitForTimeout(150);
}
// every probed signal and every module output must stay a finite number
const finite = p => app(p, () => {
  const s = __app.sim, bad = [];
  for (const ch of ['CH1', 'CH2', 'EXT']) if (s.probes[ch]) { const b = s.read(ch, s.t, 4096, new Float32Array(4096)); if (!b.every(Number.isFinite)) bad.push(ch); }
  for (const id in s.mods) { const m = s.mods[id]; for (const k in (m.out || {})) { const o = m.out[k]; if (o && o.length && !Array.prototype.every.call(o, Number.isFinite)) bad.push(id + '.' + k); } }
  return bad;
});
const lead0Mid = (p, id) => app(p, id => { const g = id ? document.querySelector(`.lead[data-lead="${id}"] .leadHit`) : document.querySelector('.lead[data-lead] .leadHit'); const L = g.getTotalLength(), q = g.getPointAtLength(L * 0.5), m = g.getScreenCTM(); return { x: q.x * m.a + m.e, y: q.y * m.d + m.f, id: g.parentNode.dataset.lead }; }, id);
const svgToScreen = (p, pt) => app(p, pt => { const svg = document.querySelector('#bench'); const q = svg.createSVGPoint(); q.x = pt[0]; q.y = pt[1]; const r = q.matrixTransform(svg.getScreenCTM()); return { x: r.x, y: r.y }; }, pt);

// ================================================================== 1. workspace
T('WS00', 'Workspace', 'Preliminary-version notice shows once on first start, then from the Beta tag and Settings, in both languages', async p => {
  await p.evaluate(() => localStorage.removeItem('ett.notice')); await p.reload(); await p.waitForFunction(() => window.__app); await p.waitForTimeout(200);
  const st = () => p.evaluate(() => ({ open: document.getElementById('modal').classList.contains('open'), body: document.getElementById('modalBody').textContent, yt: getComputedStyle(document.getElementById('modalYT')).display }));
  let s = await st(); ok(s.open, 'notice opens on first start'); ok(/preliminary/i.test(s.body) && /100%/.test(s.body) && /sold/.test(s.body), 'notice says beta, not 100% exact, non-commercial'); eq(s.yt, 'none', 'no video button on the notice');
  await p.click('#modalClose'); await p.reload(); await p.waitForFunction(() => window.__app); await p.waitForTimeout(200);
  ok(!(await st()).open, 'not shown again on the next start');
  await p.click('#btnBeta'); s = await st(); ok(s.open && /preliminary/i.test(s.body), 'Beta tag opens it'); await p.click('#modalClose');
  await p.click('#btnSettings'); await p.click('#btnAbout'); ok((await st()).open, 'Settings → About opens it'); await p.click('#modalClose');
  await p.evaluate(() => window.__app.setLang('ar')); await p.click('#btnBeta'); s = await st(); ok(/نسخة أولية/.test(s.body) && /التربح/.test(s.body), 'Arabic notice'); await p.click('#modalClose');
  await p.evaluate(() => window.__app.setLang('en'));
  await p.click('#btnSettings'); await p.click('#btnHelp'); // help modal still has its video button
  const yt = await p.evaluate(() => { const b = document.getElementById('modalYT'); document.getElementById('modal').classList.remove('open'); return getComputedStyle(b).display; }); ok(yt !== 'none', 'other dialogs keep the video button');
});
T('WS01', 'Workspace', 'View buttons Kit / Both / Scope switch the view', async p => {
  for (const v of ['vKit', 'vScope', 'vBoth']) { const vb0 = await app(p, () => document.querySelector('#bench').getAttribute('viewBox')); await p.click('#' + v); await p.waitForTimeout(80);
    ok(await app(p, v => document.querySelector('#' + v).classList.contains('on'), v), v + ' not lit'); if (v !== 'vBoth') ok(vb0 !== await app(p, () => document.querySelector('#bench').getAttribute('viewBox')), v + ' did not move the view'); }
});
T('WS02', 'Workspace', 'Keys 1, 2, 3 switch the view; ignored while typing', async p => {
  await p.keyboard.press('1'); ok(await app(p, () => document.querySelector('#vKit').classList.contains('on')), '1 → Kit');
  await p.keyboard.press('3'); ok(await app(p, () => document.querySelector('#vScope').classList.contains('on')), '3 → Scope');
  await p.keyboard.press('2'); ok(await app(p, () => document.querySelector('#vBoth').classList.contains('on')), '2 → Both');
  await p.click('#btnLib'); await p.click('#libQ'); await p.keyboard.type('1f3');
  ok(await app(p, () => document.querySelector('#vBoth').classList.contains('on')), 'typing 1/3 in search changed the view');
  eq(await app(p, () => document.querySelector('#libQ').value), '1f3', 'search text');
});
T('WS03', 'Workspace', 'Ctrl + wheel zooms at the cursor, within limits', async p => {
  const w0 = await app(p, () => +document.querySelector('#bench').getAttribute('viewBox').split(' ')[2]);
  await p.mouse.move(800, 500); await p.keyboard.down('Control');
  for (let i = 0; i < 40; i++) await p.mouse.wheel(0, -200);
  const wIn = await app(p, () => +document.querySelector('#bench').getAttribute('viewBox').split(' ')[2]);
  for (let i = 0; i < 80; i++) await p.mouse.wheel(0, 200);
  const wOut = await app(p, () => +document.querySelector('#bench').getAttribute('viewBox').split(' ')[2]);
  await p.keyboard.up('Control');
  ok(wIn < w0 && wIn >= 250, `zoom in ${w0}→${wIn}`); ok(wOut > w0 && wOut <= 2380 * 2 + 1, `zoom out ${wOut}`);
});
T('WS04', 'Workspace', 'Ctrl + / − / 0 zoom and reset; the page itself never zooms', async p => {
  const w = () => app(p, () => +document.querySelector('#bench').getAttribute('viewBox').split(' ')[2]);
  const w0 = await w(); await p.keyboard.press('Control+='); const w1 = await w(); await p.keyboard.press('Control+-'); await p.keyboard.press('Control+-'); const w2 = await w();
  await p.keyboard.press('Control+0'); ok(w1 < w0 && w2 > w1, 'ctrl +/-'); ok(await app(p, () => document.querySelector('#vBoth').classList.contains('on')), 'ctrl 0 resets');
});
T('WS05', 'Workspace', 'Drag the empty bench to pan; double-click resets', async p => {
  const vb = () => app(p, () => document.querySelector('#bench').getAttribute('viewBox'));
  const v0 = await vb(); await drag(p, { x: 1500, y: 850 }, { x: 1300, y: 700 }); ok(v0 !== await vb(), 'pan');
  await p.mouse.dblclick(1500, 850); await p.waitForTimeout(80); ok(await app(p, () => document.querySelector('#vBoth').classList.contains('on')), 'dblclick reset');
});
T('WS06', 'Workspace', 'Chosen view survives a reload', async p => {
  await p.click('#vScope'); await p.reload(); await p.waitForFunction(() => window.__app); await p.waitForTimeout(200);
  ok(await app(p, () => document.querySelector('#vScope').classList.contains('on')), 'view not restored');
});
T('WS07', 'Workspace', 'Window resize keeps the view fitted, no errors', async p => {
  for (const s of [[1100, 650], [1920, 1080], [1366, 768]]) { await p.setViewportSize({ width: s[0], height: s[1] }); await p.waitForTimeout(120); }
  ok(await app(p, () => document.querySelector('#vBoth').classList.contains('on')), 'mode lost on resize');
});

// ================================================================== 2. leads
T('LD01', 'Leads', 'A lead takes the colour picked in the rail (all 5 colours)', async p => {
  const pairs = [['master.SINE2', 'adder.A'], ['vdc.VDC', 'adder.B'], ['adder.OUT', 'mult2.XDC'], ['master.SINE100', 'mult2.YDC'], ['master.COS100', 'mult1.XDC']];
  const cols = ['red', 'black', 'yellow', 'blue', 'green'];
  for (let i = 0; i < 5; i++) { await p.click(`#colors .plugsw[data-c="${cols[i]}"]`); await wire(p, ...pairs[i]); }
  eq((await leads(p)).map(l => l.color), cols, 'lead colours');
});
T('LD02', 'Leads', 'A lead made while another is highlighted is not dimmed (reported bug)', async p => {
  await wire(p, 'master.SINE2', 'adder.A'); await app(p, () => __app.wires.select(__app.sim.leads[0].id));
  await p.click('#colors .plugsw[data-c="yellow"]'); ok(!(await app(p, () => __app.wires.sel)), 'picking a colour keeps the highlight');
  await app(p, () => __app.wires.select(__app.sim.leads[0].id)); await wire(p, 'vdc.VDC', 'adder.B');
  const op = await app(p, () => getComputedStyle(document.querySelector(`.lead[data-lead="${__app.sim.leads[1].id}"]`)).opacity);
  eq(op, '1', 'new lead opacity');
});
T('LD03', 'Leads', 'Dropping on the same socket or on empty space makes no lead', async p => {
  const a = await sock(p, 'master.SINE2'); await drag(p, a, { x: a.x + 2, y: a.y + 1 }); await drag(p, a, { x: 1500, y: 860 });
  eq((await leads(p)).length, 0, 'leads'); eq(await app(p, () => document.querySelectorAll('.leadTmp').length), 0, 'drag preview left behind');
});
T('LD04', 'Leads', 'Three plugs stack in one socket, each removable', async p => {
  await wire(p, 'master.SINE2', 'adder.A'); await wire(p, 'master.SINE2', 'adder.B'); await wire(p, 'master.SINE2', 'mult1.XDC');
  eq(await app(p, () => document.querySelectorAll('.plug[data-socket="master.SINE2"]').length), 3, 'stacked plugs');
  for (let i = 0; i < 3; i++) { const c = await center(p, '.plug[data-socket="master.SINE2"]:last-of-type'); const pl = await app(p, () => { const l = [...document.querySelectorAll('.plug[data-socket="master.SINE2"]')].pop(); const r = l.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }); await p.mouse.dblclick(pl.x, pl.y); await p.waitForTimeout(60); }
  eq((await leads(p)).length, 0, 'all removed by double-clicking plugs');
});
T('LD05', 'Leads', 'Double-click a lead removes it', async p => {
  await wire(p, 'master.SINE2', 'adder.A'); const m = await lead0Mid(p); await p.mouse.dblclick(m.x, m.y); await p.waitForTimeout(60); eq((await leads(p)).length, 0, 'leads');
});
T('LD06', 'Leads', 'Right-click menu recolours and removes', async p => {
  await wire(p, 'master.SINE2', 'adder.A'); let m = await lead0Mid(p);
  await p.mouse.click(m.x, m.y, { button: 'right' }); await p.click('.ctx .plugsw[data-c="green"]'); eq((await leads(p))[0].color, 'green', 'recolour');
  m = await lead0Mid(p); await p.mouse.click(m.x, m.y, { button: 'right' }); ok(!(await app(p, () => !!document.querySelector('.ctx .rs'))), 'reset shown on a straight lead');
  await p.click('.ctx .rm'); eq((await leads(p)).length, 0, 'remove');
});
T('LD07', 'Leads', 'Click highlights; second click, empty bench and Esc clear it', async p => {
  await wire(p, 'master.SINE2', 'adder.A'); await wire(p, 'vdc.VDC', 'adder.B'); const m = await lead0Mid(p);
  await p.mouse.click(m.x, m.y); eq(await app(p, () => __app.wires.sel), m.id, 'select'); await p.mouse.click(m.x, m.y); eq(await app(p, () => __app.wires.sel), null, 'toggle off');
  await p.mouse.click(m.x, m.y); await p.mouse.click(1500, 860); eq(await app(p, () => __app.wires.sel), null, 'bench clears');
  await p.mouse.click(m.x, m.y); await p.keyboard.press('Escape'); eq(await app(p, () => __app.wires.sel), null, 'Esc clears');
});
T('LD08', 'Leads', 'Drag a cable to reshape; click after drag does not toggle; reset; saved', async p => {
  await wire(p, 'master.SINE2', 'adder.A'); const m = await lead0Mid(p);
  await drag(p, m, { x: m.x + 70, y: m.y - 120 }, 10);
  const l = (await leads(p))[0]; ok(Array.isArray(l.bend), 'no bend stored'); eq(await app(p, () => __app.wires.sel), null, 'drag selected the lead');
  const pt = await svgToScreen(p, l.bend); ok(await app(p, ([x, y]) => !!(document.elementFromPoint(x, y).closest('.lead')), [pt.x, pt.y]), 'cable not under the drag point');
  ok(JSON.stringify(await app(p, () => __app.snapshot().leads[0].bend)) === JSON.stringify(l.bend), 'bend not in snapshot');
  await p.mouse.click(pt.x, pt.y, { button: 'right' }); await p.click('.ctx .rs'); ok(!(await leads(p))[0].bend, 'reset');
});
T('LD09', 'Leads', 'Scope probes: connect both ways, move, remove, reshape, reset on move', async p => {
  const bnc = ch => center(p, `[data-bnc="${ch}"]`);
  await drag(p, await bnc('CH1'), await sock(p, 'master.SINE2')); eq(await app(p, () => __app.sim.probes.CH1), 'master.SINE2', 'BNC → socket');
  await drag(p, await sock(p, 'master.SINE100'), await bnc('CH2')); eq(await app(p, () => __app.sim.probes.CH2), 'master.SINE100', 'socket → BNC');
  const pm = await app(p, () => { const g = document.querySelector('.lead.probe[data-probe="CH1"] .leadHit'); const q = g.getPointAtLength(g.getTotalLength() * .5), m = g.getScreenCTM(); return { x: q.x * m.a + m.e, y: q.y * m.d + m.f }; });
  await drag(p, pm, { x: pm.x, y: pm.y + 60 }); ok(await app(p, () => !!__app.wires.probeBend.CH1), 'probe bend');
  await drag(p, await bnc('CH1'), await sock(p, 'adder.OUT')); eq(await app(p, () => [__app.sim.probes.CH1, !!__app.wires.probeBend.CH1]), ['adder.OUT', false], 'moved probe keeps old shape');
  const pm2 = await app(p, () => { const g = document.querySelector('.lead.probe[data-probe="CH2"] .leadHit'); const q = g.getPointAtLength(g.getTotalLength() * .5), m = g.getScreenCTM(); return { x: q.x * m.a + m.e, y: q.y * m.d + m.f }; });
  await p.mouse.dblclick(pm2.x, pm2.y); await p.waitForTimeout(60); eq(await app(p, () => __app.sim.probes.CH2), null, 'dblclick removes probe');
});
T('LD14', 'Leads', 'Scope probe cables take the colour picked in the rail (reported bug), recolour, save, old files stay black', async p => {
  const bnc = ch => center(p, `[data-bnc="${ch}"]`);
  const drawn = ch => app(p, ch => { const g = document.querySelector(`.lead.probe[data-probe="${ch}"]`); const ps = g.querySelectorAll('path'); return [ps[2].getAttribute('stroke'), document.querySelector(`.plug[data-lead-of="probe:${ch}"] circle:nth-child(3)`).getAttribute('fill')]; }, ch);
  const HEX = { red: '#d3261f', yellow: '#f2c21b', blue: '#1f5fd1', green: '#1f9a45' };
  for (const c of ['red', 'yellow', 'blue', 'green']) {
    await p.click(`#colors .plugsw[data-c="${c}"]`);
    // the cable follows the mouse in the picked colour while dragging
    const a = await bnc('CH1'), s = await sock(p, 'master.SINE2'); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move((a.x + s.x) / 2, (a.y + s.y) / 2, { steps: 4 });
    const tmp = await app(p, () => document.querySelector('.leadTmp').getAttribute('stroke')); await p.mouse.move(s.x, s.y, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(60);
    eq(tmp, HEX[c], `drag preview ${c}`); eq(await drawn('CH1'), [HEX[c], HEX[c]], `BNC → socket ${c}`);
  }
  await p.click('#colors .plugsw[data-c="blue"]'); await drag(p, await sock(p, 'master.SINE100'), await bnc('CH2')); eq((await drawn('CH2'))[0], HEX.blue, 'socket → BNC blue');
  await p.click('#colors .plugsw[data-c="black"]'); await drag(p, await bnc('EXT'), await sock(p, 'adder.OUT')); eq((await drawn('EXT'))[0], '#2a2a2a', 'black probe looks like a coax');
  // right-click menu recolours a probe and marks its colour
  const pm = await app(p, () => { const g = document.querySelector('.lead.probe[data-probe="CH2"] .leadHit'); const q = g.getPointAtLength(g.getTotalLength() * .5), m = g.getScreenCTM(); return { x: q.x * m.a + m.e, y: q.y * m.d + m.f }; });
  await p.mouse.click(pm.x, pm.y, { button: 'right' }); eq(await app(p, () => document.querySelector('.ctx .plugsw.sel').dataset.c), 'blue', 'menu marks current colour');
  await p.click('.ctx .plugsw[data-c="red"]'); eq((await drawn('CH2'))[0], HEX.red, 'menu recolour');
  // saved and restored; black is the default and is not written
  const snap = await app(p, () => __app.snapshot()); eq(snap.probeColor, { CH1: 'green', CH2: 'red' }, 'snapshot colours');
  await app(p, s => __app.restore(s), snap); eq([(await drawn('CH1'))[0], (await drawn('CH2'))[0], (await drawn('EXT'))[0]], [HEX.green, HEX.red, '#2a2a2a'], 'restored colours');
  await p.waitForTimeout(3200); await p.reload(); await p.waitForTimeout(700); eq((await drawn('CH1'))[0], HEX.green, 'colour after reload');
  // a file without colours (old saves and the ready-made setups) keeps black probes; junk colours are ignored
  await app(p, () => __app.restore({ v: 2, leads: [], probes: { CH1: 'master.SINE2', CH2: 'adder.OUT' }, probeColor: { CH2: 'purple', CH1: '__proto__' }, mods: {}, scope: {} }));
  eq([(await drawn('CH1'))[0], (await drawn('CH2'))[0]], ['#2a2a2a', '#2a2a2a'], 'old/bad files → black');
  await p.click('#colors .plugsw[data-c="yellow"]'); await drag(p, await bnc('CH1'), await sock(p, 'adder.A')); eq((await drawn('CH1'))[0], HEX.yellow, 'moving a probe takes the picked colour');
});
T('LD10', 'Leads', 'Socket tooltip: live readings when connected, "Nothing connected" when not', async p => {
  const s = await sock(p, 'adder.A'); await p.mouse.move(s.x, s.y); await p.waitForTimeout(250);
  ok(/Nothing connected/.test(await app(p, () => document.querySelector('#tip').textContent)), 'float text');
  await wire(p, 'master.SINE2', 'adder.A'); await p.mouse.move(10, 600); const s2 = await sock(p, 'master.SINE2'); await p.mouse.move(s2.x, s2.y); await p.waitForTimeout(300);
  const tip = await app(p, () => document.querySelector('#tip').textContent); ok(/Vp-p\s*4/.test(tip) && /2\.08/.test(tip) && /DC\s*-?[0-9.]+\s*mV/.test(tip) && Math.abs(parseFloat(tip.split('DC')[1])) < 5, 'readings: ' + tip);
  await p.mouse.move(1500, 860); await p.waitForTimeout(100); ok(await app(p, () => document.querySelector('#tip').style.display === 'none'), 'tip stays after leaving');
});
T('LD11', 'Leads', 'Two outputs shorted: warning shown, simulation stays finite', async p => {
  await wire(p, 'master.SINE2', 'master.SINE100'); await drag(p, await center(p, '[data-bnc="CH1"]'), await sock(p, 'master.SINE2')); await p.waitForTimeout(300);
  const s = await sock(p, 'master.SINE100'); await p.mouse.move(s.x, s.y); await p.waitForTimeout(300);
  ok(/connected together/.test(await app(p, () => document.querySelector('#tip').textContent)), 'no short warning'); eq(await finite(p), [], 'non-finite');
});
T('LD12', 'Leads', 'Remove all leads: Cancel keeps them, OK removes leads and probes', async p => {
  await wire(p, 'master.SINE2', 'adder.A'); await drag(p, await center(p, '[data-bnc="CH1"]'), await sock(p, 'adder.OUT'));
  p.dialogAnswer = false; await p.click('#btnSettings'); await p.click('#btnClear'); eq((await leads(p)).length, 1, 'cancel removed');
  p.dialogAnswer = true; await p.click('#btnSettings'); await p.click('#btnClear'); eq([(await leads(p)).length, await app(p, () => __app.sim.probes.CH1)], [0, null], 'clear');
});
T('LD13', 'Leads', 'Stress: 40 leads render and simulate', async p => {
  await app(p, () => { const S = Object.keys(window.__SOCKS || {}); });
  const ids = await app(p, () => [...document.querySelectorAll('[data-socket]')].map(e => e.getAttribute('data-socket')).filter((v, i, a) => a.indexOf(v) === i));
  await app(p, ids => { for (let i = 0; i < 40; i++) __app.wires.addLead(ids[(i * 7) % ids.length], ids[(i * 13 + 5) % ids.length], ['red', 'blue', 'green', 'yellow', 'black'][i % 5]); }, ids);
  await p.waitForTimeout(500); ok((await leads(p)).length >= 38, 'leads'); eq(await finite(p), [], 'non-finite');
});

// ================================================================== 3. modules
T('MD01', 'Modules', 'Every knob turns by drag and wheel and stays in 0..1', async p => {
  const knobs = await app(p, () => [...document.querySelectorAll('.knob')].map(k => [k.dataset.mod, k.dataset.p]));
  eq(knobs.length, 11, 'knob count');
  for (const [mod, prm] of knobs) {
    const c = await center(p, `.knob[data-mod="${mod}"][data-p="${prm}"]`); if (!c) continue;
    await app(p, ([m, k]) => __app.panel.setKnob(m, k, 0.5), [mod, prm]);
    await p.mouse.move(c.x, c.y); await p.mouse.wheel(0, -100); await p.waitForTimeout(20);
    const vUp = await app(p, ([m, k]) => __app.sim.mods[m].p[k], [mod, prm]); ok(vUp > 0.5, `${mod}.${prm} wheel up ${vUp}`);
    await drag(p, c, { x: c.x + 400, y: c.y - 400 }, 6); const vMax = await app(p, ([m, k]) => __app.sim.mods[m].p[k], [mod, prm]);
    await drag(p, c, { x: c.x - 400, y: c.y + 400 }, 6); const vMin = await app(p, ([m, k]) => __app.sim.mods[m].p[k], [mod, prm]);
    ok(vMax <= 1 && vMin >= 0 && vMax > vMin, `${mod}.${prm} range ${vMin}..${vMax}`);
  }
});
T('MD02', 'Modules', 'Slide switches and DIP switches toggle', async p => {
  const n = await app(p, () => document.querySelectorAll('.slide').length); ok(n >= 3, 'slides ' + n);
  for (let i = 0; i < n; i++) { const before = await app(p, () => JSON.stringify(Object.fromEntries(Object.entries(__app.sim.mods).map(([k, m]) => [k, m.p]))));
    const c = await app(p, i => { const r = document.querySelectorAll('.slide')[i].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, i); await p.mouse.click(c.x, c.y);
    ok(before !== await app(p, () => JSON.stringify(Object.fromEntries(Object.entries(__app.sim.mods).map(([k, m]) => [k, m.p])))), 'slide ' + i + ' did nothing'); }
  const d = await app(p, () => document.querySelectorAll('.dipk').length); ok(d >= 4, 'dips ' + d);
  for (let i = 0; i < d; i++) { const c = await app(p, i => { const r = document.querySelectorAll('.dipk')[i].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, i); await p.mouse.click(c.x, c.y); }
});
T('MD03', 'Modules', 'Every info button opens its module sheet; X, Close, Esc and backdrop close it', async p => {
  const mods = await app(p, () => [...document.querySelectorAll('.infoBtn')].map(b => b.dataset.mod));
  ok(mods.length >= 20, 'info buttons ' + mods.length); let k = 0;
  for (const m of mods) {
    await p.click(`.infoBtn[data-mod="${m}"]`); ok(await app(p, () => document.querySelector('#modal').classList.contains('open')), m + ' did not open');
    ok((await app(p, () => document.querySelector('#modalTitle').textContent)).length > 1, m + ' empty title');
    const how = k++ % 4; if (how === 0) await p.click('#modalX'); else if (how === 1) await p.click('#modalClose'); else if (how === 2) await p.keyboard.press('Escape'); else await p.mouse.click(8, 890);
    ok(!(await app(p, () => document.querySelector('#modal').classList.contains('open'))), m + ' did not close (' + how + ')');
  }
});
T('MD04', 'Modules', 'Headphones plug in and out from the socket and the prop', async p => {
  await p.click('#vKit'); const c = await center(p, '.hpjack'); ok(c, 'no headphone jack'); await p.mouse.click(c.x, c.y);
  ok(await app(p, () => __app.sim.headphones), 'plug in'); await p.mouse.click(c.x, c.y); await p.waitForTimeout(60);
  ok(!(await app(p, () => __app.sim.headphones)), 'unplug by clicking the socket again');
});
T('MD05', 'Modules', 'Guidance off hides info buttons and tooltips; setting persists', async p => {
  await p.click('#tGuide'); ok(!(await app(p, () => document.body.classList.contains('training'))), 'still training');
  const s = await sock(p, 'adder.A'); await p.mouse.move(s.x, s.y); await p.waitForTimeout(250); ok(await app(p, () => document.querySelector('#tip').style.display !== 'block'), 'tooltip shown with guidance off');
  await p.reload(); await p.waitForFunction(() => window.__app); ok(!(await app(p, () => document.body.classList.contains('training'))), 'not persisted');
});

// ================================================================== 4. scope
const SCOPE_BTNS = ['CH1', 'CH2', 'MATH', 'MEASURE', 'ACQUIRE', 'STORAGE', 'CURSOR', 'DISPLAY', 'UTILITY', 'HMENU', 'TMENU', 'run', 'auto', 'zero', 'force', 'prtsc', 'help'];
T('SC01', 'Scope', 'Every front-panel key can be clicked (hit areas) without errors', async p => {
  await p.click('#vScope'); await p.waitForTimeout(150);
  const n = await app(p, () => document.querySelectorAll('.sbtn').length); eq(n, 22, 'scope keys');
  for (let i = 0; i < n; i++) { const c = await app(p, i => { const r = document.querySelectorAll('.sbtn')[i].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, i); await p.mouse.click(c.x, c.y); await p.waitForTimeout(25); if (await app(p, () => document.querySelector('#modal').classList.contains('open'))) await p.keyboard.press('Escape'); }
});
T('SC02', 'Scope', 'Every menu: each soft key cycles all its values (3 full rounds) on a live signal', async p => {
  await loadSetup(p, 'Term1/01-Exp1-AM-Modulation');
  for (const m of ['CH1', 'CH2', 'MATH', 'MEASURE', 'CURSOR', 'ACQUIRE', 'DISPLAY', 'STORAGE', 'UTILITY', 'HMENU', 'TMENU']) {
    await app(p, m => { const s = __app.scope; if (s.st.menu !== m) s.press(m); }, m);
    for (let f = 0; f < 5; f++) for (let k = 0; k < 12; k++) { await app(p, f => __app.scope.press('F' + f), f); if (k % 4 === 0) await p.waitForTimeout(15); }
    await p.waitForTimeout(60);
  }
  await p.waitForTimeout(300); eq(await finite(p), [], 'non-finite');
});
T('SC03', 'Scope', 'V/div, Time/div and positions stop at their limits', async p => {
  const s = () => app(p, () => { const st = __app.scope.st; return [st.ch.CH1.vd, st.td, st.ch.CH1.pos]; });
  await app(p, () => { for (let i = 0; i < 40; i++) { __app.scope.turn('vscale', 1); __app.scope.turn('tscale', 1); __app.scope.turn('vpos', 1, 3); } });
  const hi = await s(); await app(p, () => { for (let i = 0; i < 80; i++) { __app.scope.turn('vscale', -1); __app.scope.turn('tscale', -1); __app.scope.turn('vpos', -1, 3); } }); const lo = await s();
  eq([hi[0], lo[0]], [0, 13], 'V/div index range (1 mV .. 20 V)'); eq([hi[1], lo[1]], [0, 15], 'Time/div index range'); ok(hi[2] <= 10 && lo[2] >= -10, 'position clamp');
});
T('SC04', 'Scope', 'RUN/STOP freezes the trace; SINGLE captures once', async p => {
  await loadSetup(p, 'Term1/01-Exp1-AM-Modulation'); await p.waitForTimeout(300);
  await app(p, () => __app.scope.press('run')); ok(!(await app(p, () => __app.scope.st.run)), 'stop'); await p.waitForTimeout(200);
  await app(p, () => __app.scope.press('run')); ok(await app(p, () => __app.scope.st.run), 'run');
  await app(p, () => { const s = __app.scope; s.press('TMENU'); s.press('F3'); s.press('F3'); }); eq(await app(p, () => __app.scope.st.trig.mode), 'SINGLE', 'single mode'); await p.waitForTimeout(500);
});
T('SC05', 'Scope', 'AUTO works with no signal, with a DC level, and on every ready-made experiment', async p => {
  await app(p, () => __app.scope.press('auto')); await p.waitForTimeout(100);
  await wire(p, 'vdc.VDC', 'adder.A'); await drag(p, await center(p, '[data-bnc="CH1"]'), await sock(p, 'vdc.VDC')); await app(p, () => __app.scope.press('auto')); await p.waitForTimeout(150);
  const files = await app(p, () => [...document.querySelectorAll('.lrow')].length); // panel not open yet: count below
  await p.click('#btnLib'); const all = [];
  for (const t of ['t1', 't2', 'x']) { await p.click(`.ltab[data-tab="${t}"]`); all.push(...await app(p, () => [...document.querySelectorAll('.lrow')].map(r => r.dataset.f))); }
  await p.click('#libX'); eq(all.length, 68, 'setups listed');
  for (const f of all) { await loadSetup(p, f); await p.waitForTimeout(40); await app(p, () => __app.scope.press('auto')); await p.waitForTimeout(40); }
  eq(await finite(p), [], 'non-finite after AUTO');
});
T('SC06', 'Scope', 'FFT, XY, cursors, measurements and counter give finite readings', async p => {
  await loadSetup(p, 'Term1/01-Exp1-AM-Modulation'); await p.waitForTimeout(300);
  await app(p, () => { const s = __app.scope; s.press('MATH'); }); await p.waitForTimeout(300);
  await app(p, () => { const s = __app.scope; s.press('F3'); }); await p.waitForTimeout(200); // Vrms
  await app(p, () => { const s = __app.scope; s.press('MATH'); s.press('HMENU'); s.press('F2'); }); await p.waitForTimeout(300); // XY
  await app(p, () => { const s = __app.scope; s.press('F2'); s.press('CURSOR'); s.press('F0'); for (let i = 0; i < 10; i++) s.turn('multi', 1); }); await p.waitForTimeout(200);
  const cv = await app(p, () => __app.scope.cursorVals()); ok(cv && !/NaN|Infinity/.test(JSON.stringify(cv)), 'cursor values ' + JSON.stringify(cv));
  await app(p, () => { const s = __app.scope; s.press('F0'); const c = s.cursorVals(); window.__tc = c; }); ok(!/NaN/.test(JSON.stringify(await app(p, () => window.__tc))), 'time cursor');
  await app(p, () => { const s = __app.scope; s.press('MEASURE'); s.press('F4'); s.press('UTILITY'); s.press('F0'); }); await p.waitForTimeout(700);
  const f = await app(p, () => { __app.scope._cf = 0; return __app.scope.counterF(); }); ok(Math.abs(f - 2083.3) < 25, 'counter frequency ' + f);
});
T('SC07', 'Scope', 'Screenshot key saves a PNG; Storage ref save/show', async p => {
  await loadSetup(p, 'Term1/01-Exp1-AM-Modulation'); await p.waitForTimeout(200);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }), app(p, () => __app.scope.press('prtsc'))]); ok(/\.png$/.test(dl.suggestedFilename()), 'png name');
  await app(p, () => { const s = __app.scope; s.press('STORAGE'); s.press('F2'); }); ok(await app(p, () => __app.scope.st.ref.on && !!__app.scope.st.ref.data), 'Save Ref shows the ref');
  await app(p, () => __app.scope.press('F3')); ok(!(await app(p, () => __app.scope.st.ref.on)), 'Show Ref toggles it off'); await p.waitForTimeout(200);
});
T('SC08', 'Scope', 'Scope help opens from the HELP key and from Settings', async p => {
  await app(p, () => __app.scope.press('help')); ok(await app(p, () => document.querySelector('#modal').classList.contains('open')), 'help key'); await p.keyboard.press('Escape');
  await p.click('#btnSettings'); await p.click('#btnScopeHelp'); ok(await app(p, () => document.querySelector('#modal').classList.contains('open')), 'settings help');
});

// ================================================================== 5. rail panels
T('RL01', 'Rail', 'Lab sheets: every experiment, every step, prev/next, step buttons, show wiring', async p => {
  await p.click('#btnGuide'); const n = await app(p, () => document.querySelectorAll('.explist [data-e]').length); eq(n, 24, 'lab sheets in the list (7 Term 1 + 13 Term 2 + 4 extra)');
  for (let i = 0; i < n; i++) {
    await app(p, i => document.querySelectorAll('.explist [data-e]')[i].click(), i); await p.waitForTimeout(40);
    const steps = await app(p, () => document.querySelectorAll('.stepbar button').length); ok(steps >= 2, 'steps ' + steps);
    await p.check('#gGhost'); for (let s = 1; s < steps; s++) { await p.click('#gNext'); }
    ok(await app(p, () => document.querySelector('#gNext').disabled), 'next not disabled on the last step');
    await app(p, () => document.querySelector('.stepbar button').click()); ok(await app(p, () => document.querySelector('#gPrev').disabled), 'prev not disabled on step 1');
    await p.click('#gBack');
  }
  await p.click('#gClose'); ok(!(await app(p, () => document.querySelector('#guide').classList.contains('open'))), 'close');
});
T('RL11', 'Rail', 'Lab sheets: grouped by topic, every sheet listed once, every library group links to a sheet', async p => {
  const r = await app(p, () => { const ids = __app.sections.flatMap(s => s.ids); return { ids, all: __app.sheets.map(x => x.id) }; });
  eq(new Set(r.ids).size, r.ids.length, 'a sheet listed twice'); eq([...r.ids].sort().join(), [...r.all].sort().join(), 'sections and sheets differ');
  await p.click('#btnGuide');
  const heads = await app(p, () => [...document.querySelectorAll('.sheetList h3, .sheetList h4')].map(h => h.textContent));
  ok(heads.includes('Analog communication') && heads.includes('Digital communication') && heads.includes('Digital modulation') && heads.filter(h => h === 'Digital communication').length === 1, 'section headings ' + heads.join(' | '));
  ok(await app(p, () => /Term 2 · Exp 4/.test(document.querySelector('.explist [data-e="s15"]').textContent)), 'source tag');
  await p.click('#gClose'); await p.click('#btnLib');
  for (const tab of ['t1', 't2', 'x']) {
    await p.click(`.ltab[data-tab="${tab}"]`);
    const gs = await app(p, () => [...document.querySelectorAll('.gsheet')].map(b => b.dataset.g));
    const groups = await app(p, () => document.querySelectorAll('.lgrp').length);
    eq(gs.length, groups, 'groups without a sheet in tab ' + tab); for (const g of gs) ok(r.all.includes(g), 'unknown sheet ' + g);
  }
});
T('RL12', 'Rail', 'Every lab-sheet step that builds a figure ticks when that figure\'s setup is loaded', async p => {
  const steps = await app(p, () => __app.sheets.flatMap(x => x.steps.map((s, i) => ({ id: x.id, i, w: s.w, n: (s.c || []).length + Object.keys(s.p || {}).length })).filter(s => s.w)));
  ok(steps.length >= 50, 'steps with a setup: ' + steps.length);
  for (const s of steps) {
    ok(s.n > 0, `${s.id} step ${s.i + 1} has no checks`);
    await loadSetup(p, s.w);
    const done = await app(p, s => { const app = __app; const ex = app.sheets.find(x => x.id === s.id), st = ex.steps[s.i];
      const net = (a, b) => app.sim.netOf(a) === app.sim.netOf(b);
      const bad = [...(st.c || []).filter(([a, b]) => !net(a, b)).map(x => x.join('>')), ...Object.entries(st.p || {}).filter(([ch, v]) => !(app.sim.probes[ch] && net(app.sim.probes[ch], v))).map(x => x.join('='))];
      return bad; }, s);
    eq(done.join(' '), '', `${s.id} step ${s.i + 1} (${s.w}) not ticked`);
  }
});
T('RL02', 'Rail', 'Lab sheet ticks a step when its wiring is on the kit', async p => {
  await loadSetup(p, 'Term1/01-Exp1-AM-Modulation');
  await p.click('#btnGuide'); await app(p, () => document.querySelector('.explist [data-e="exp1"]').click()); await p.waitForTimeout(800);
  ok(await app(p, () => document.querySelectorAll('.stepbar button.done').length) >= 2, 'no steps ticked with the AM wiring loaded');
});
T('RL03', 'Rail', 'Load experiment: tabs show 12 / 46 / 10, every row has a page, search works', async p => {
  await p.click('#btnLib'); const cnt = {};
  for (const t of ['t1', 't2', 'x']) { await p.click(`.ltab[data-tab="${t}"]`); cnt[t] = await app(p, () => document.querySelectorAll('.lrow').length);
    ok(await app(p, () => [...document.querySelectorAll('.lrow')].every(r => /PDF \d+/.test(r.querySelector('.lpage').textContent))), t + ' row without page'); }
  eq(cnt, { t1: 12, t2: 46, x: 10 }, 'rows per tab');
  await p.fill('#libQ', 'fsk'); ok(await app(p, () => document.querySelectorAll('.lrow').length) === 3, 'search fsk');
  await p.fill('#libQ', 'zzzz'); ok(await app(p, () => !!document.querySelector('.lnone')), 'no-match message');
  await p.fill('#libQ', ''); await p.keyboard.press('Escape'); ok(!(await app(p, () => document.querySelector('#lib').classList.contains('open'))), 'Esc closes');
});
T('RL04', 'Rail', 'Load experiment loads all 68 exactly as their files', async p => {
  await p.click('#btnLib'); const all = [];
  for (const t of ['t1', 't2', 'x']) { await p.click(`.ltab[data-tab="${t}"]`); all.push(...await app(p, () => [...document.querySelectorAll('.lrow')].map(r => r.dataset.f))); }
  await p.click('#libX');
  const dir = path.resolve(__dirname, '../../setups'); const bad = [];
  for (const f of all) {
    await loadSetup(p, f); const file = JSON.parse(fs.readFileSync(path.join(dir, f + '.ett.json'), 'utf8'));
    const got = await app(p, () => ({ leads: __app.sim.leads.map(l => l.a + '-' + l.b).sort(), probes: __app.sim.probes, td: __app.scope.st.td }));
    if (JSON.stringify(got.leads) !== JSON.stringify(file.leads.map(l => l.a + '-' + l.b).sort()) || got.probes.CH1 !== (file.probes.CH1 || null) || got.td !== (file.scope.td ?? 7)) bad.push(f);
  }
  eq(bad, [], 'setups that load differently from their file'); eq(await finite(p), [], 'non-finite');
});
T('RL05', 'Rail', 'Loading over existing wiring asks first; Cancel keeps the wiring', async p => {
  await wire(p, 'master.SINE2', 'adder.A'); p.dialogAnswer = false; await loadSetup(p, 'Term1/02-Exp2-DSBSC-Modulation');
  eq((await leads(p)).length, 1, 'cancel replaced the wiring'); ok(p.dialogs.length === 1, 'no question asked');
  p.dialogAnswer = true; await p.click(`.lrow[data-f="Term1/02-Exp2-DSBSC-Modulation"]`); ok((await leads(p)).length > 1, 'OK did not load');
});
T('RL06', 'Rail', '"Step-by-step sheet" opens the right lab sheet', async p => {
  await p.click('#btnLib'); await p.click('.gsheet[data-g="exp3"]'); ok(await app(p, () => document.querySelector('#guide').classList.contains('open') && /AM demodulation/i.test(document.querySelector('.expTitle').textContent)), 'sheet');
});
T('RL07', 'Rail', 'Reference opens, contents links scroll, wide tables scroll inside', async p => {
  await p.click('#btnRef'); ok(await app(p, () => document.querySelectorAll('.rtoc a').length) >= 6, 'contents');
  const t0 = await app(p, () => document.querySelector('.rbody').scrollTop); await app(p, () => [...document.querySelectorAll('.rtoc a')].pop().click()); await p.waitForTimeout(700);
  ok(await app(p, () => document.querySelector('.rbody').scrollTop) > t0, 'contents link did not scroll');
  ok(await app(p, () => document.querySelectorAll('.tscroll table').length) >= 2, 'tables'); ok(await app(p, () => document.documentElement.scrollWidth <= innerWidth), 'page overflow');
  await p.click('#btnLib'); ok(await app(p, () => !document.querySelector('#refp').classList.contains('open')), 'opening the list did not close the reference');
});
T('RL08', 'Rail', 'Report a bug: empty → error; filled → WhatsApp with details; unticked → no details', async p => {
  await p.evaluate(() => { window.__opened = []; window.open = u => { window.__opened.push(u); return {}; }; });
  await loadSetup(p, 'Term1/01-Exp1-AM-Modulation');
  await p.click('#btnBug'); await p.click('#bugForm .send'); ok((await app(p, () => document.querySelector('#bugErr').textContent)).length > 3, 'no error for empty');
  await p.fill('#bugWhat', 'scope frozen'); await p.click('#bugForm .send');
  const u = await app(p, () => window.__opened[0]); const msg = decodeURIComponent(u.split('text=')[1]);
  ok(u.startsWith('https://wa.me/201019876314?text='), 'number'); ok(/scope frozen/.test(msg) && /Leads \(4\)/.test(msg) && /AM signal/.test(msg) && /v\d+\.\d+\.\d+/.test(msg), 'details: ' + msg.slice(0, 200));
  await p.click('#btnBug'); await p.fill('#bugWhat', 'second'); await p.uncheck('#bugAttach'); await p.click('#bugForm .send');
  ok(!/Leads/.test(decodeURIComponent((await app(p, () => window.__opened[1])).split('text=')[1])), 'details sent while unticked');
});
T('RL09', 'Rail', 'Report a bug: blocked window → link and Copy instead; Esc and backdrop close', async p => {
  await p.evaluate(() => { window.open = () => null; });
  await p.click('#btnBug'); await p.fill('#bugWhat', 'x'); await p.click('#bugForm .send'); ok(await app(p, () => document.querySelector('#bugFallback').classList.contains('show')), 'fallback');
  ok((await app(p, () => document.querySelector('#bugLink').href)).startsWith('https://wa.me/'), 'link');
  await p.keyboard.press('Escape'); ok(!(await app(p, () => document.querySelector('#bugDlg').classList.contains('open'))), 'Esc');
  await p.click('#btnBug'); ok(!(await app(p, () => document.querySelector('#bugFallback').classList.contains('show'))), 'old fallback still showing');
  await p.mouse.click(5, 895); ok(!(await app(p, () => document.querySelector('#bugDlg').classList.contains('open'))), 'backdrop');
});
T('RL10', 'Rail', 'Settings opens, closes on outside click; Help modal; sound toggle', async p => {
  await p.click('#btnSettings'); ok(await app(p, () => document.querySelector('#settings').classList.contains('open')), 'open'); await p.mouse.click(1500, 860);
  ok(!(await app(p, () => document.querySelector('#settings').classList.contains('open'))), 'outside click'); await p.click('#btnSettings'); await p.click('#btnHelp');
  ok(await app(p, () => document.querySelector('#modal').classList.contains('open')), 'help'); await p.keyboard.press('Escape');
  await p.click('#btnSettings'); await p.click('[data-snd="0"]'); ok(await app(p, () => document.querySelector('[data-snd="0"]').classList.contains('on')), 'sound off');
});

// ================================================================== 6. saving
T('PS01', 'Saving', 'Autosave brings back leads, knobs, scope, headphones and shapes after reload', async p => {
  await loadSetup(p, 'Term1/01-Exp1-AM-Modulation'); await app(p, () => { __app.panel.setKnob('adder', 'G', 0.77); __app.scope.press('MATH'); __app.sim.setHeadphones(true); });
  const m = await lead0Mid(p); await drag(p, m, { x: m.x + 30, y: m.y - 60 });
  const before = await app(p, () => JSON.stringify([__app.sim.leads.map(l => [l.a, l.b, l.color, l.bend]), __app.sim.mods.adder.p.G, __app.scope.st.math.on, __app.sim.headphones]));
  await p.waitForTimeout(3300); await p.reload(); await p.waitForFunction(() => window.__app); await p.waitForTimeout(200);
  eq(await app(p, () => JSON.stringify([__app.sim.leads.map(l => [l.a, l.b, l.color, l.bend]), __app.sim.mods.adder.p.G, __app.scope.st.math.on, __app.sim.headphones])), before, 'state after reload');
}, { keepStorage: true });
T('PS02', 'Saving', 'Save setup downloads a file that Open setup reads back the same', async p => {
  await loadSetup(p, 'Term2/07-Exp18-A-QPSK-Generation');
  await p.click('#btnSettings'); const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#btnSave')]); const file = await dl.path(); const txt = fs.readFileSync(file, 'utf8');
  ok(/\.ett\.json$/.test(dl.suggestedFilename()) && JSON.parse(txt).v === 2, 'saved file');
  const want = await app(p, () => __app.sim.leads.map(l => l.a + '-' + l.b).sort().join());
  await app(p, () => __app.wires.clearAll()); await p.setInputFiles('#fileIn', { name: 'x.ett.json', mimeType: 'application/json', buffer: Buffer.from(txt) }); await p.waitForTimeout(200);
  eq(await app(p, () => __app.sim.leads.map(l => l.a + '-' + l.b).sort().join()), want, 'reopened');
});
T('PS03', 'Saving', 'Old (v1) setup files open with the V/div shifted by one', async p => {
  const f = { leads: [{ a: 'master.SINE2', b: 'adder.A', color: 'red' }], probes: { CH1: 'master.SINE2' }, mods: {}, scope: { ch: { CH1: { vd: 8 } } } };
  await p.setInputFiles('#fileIn', { name: 'old.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(f)) }); await p.waitForTimeout(150);
  eq(await app(p, () => __app.scope.st.ch.CH1.vd), 9, 'migrated V/div');
});
T('PS04', 'Saving', 'Bad files are refused or cleaned, never crash', async p => {
  const put = async (buf, name = 'b.json') => { p.dialogs = []; await p.setInputFiles('#fileIn', { name, mimeType: 'application/json', buffer: Buffer.from(buf) }); await p.waitForTimeout(150); return p.dialogs.slice(); };
  ok((await put('not json')).length === 1, 'garbage not refused'); ok((await put('{"a":1}')).length === 1, 'no leads not refused'); ok((await put('[]')).length === 1, 'array not refused');
  await put(JSON.stringify({ leads: [{ a: 'nope.X', b: 'adder.A' }, { a: 'master.SINE2', b: 'adder.A', color: 'purple', bend: ['x', 2] }], probes: { CH1: 'nope', CH2: 'adder.OUT' }, mods: { ghost: { a: 1 }, adder: { G: 5 } }, probeBend: { CH2: [1, NaN] }, scope: { ch: { CH1: { vd: 999 } }, td: -4 } }));
  const st = await app(p, () => ({ leads: __app.sim.leads.map(l => [l.a, l.b, l.color, !!l.bend]), p1: __app.sim.probes.CH1, p2: __app.sim.probes.CH2, G: __app.sim.mods.adder.p.G, pb: __app.wires.probeBend, vd: __app.scope.st.ch.CH1.vd, td: __app.scope.st.td }));
  eq(st.leads, [['master.SINE2', 'adder.A', 'red', false]], 'leads cleaned'); eq([st.p1, st.p2], [null, 'adder.OUT'], 'probes'); ok(st.G >= 0 && st.G <= 1, 'knob clamped ' + st.G);
  eq(st.pb, {}, 'bad probe shape kept'); ok(st.vd >= 0 && st.vd <= 13 && st.td >= 0 && st.td <= 15, `scope indexes kept out of range: vd ${st.vd} td ${st.td}`);
  await p.waitForTimeout(300); eq(await finite(p), [], 'non-finite');
});
T('PS05', 'Saving', 'Broken autosave or blocked storage: the app still starts and works', async p => {
  await p.evaluate(() => localStorage.setItem('ett.autosave', '{broken')); await p.reload(); await p.waitForFunction(() => window.__app); await wire(p, 'master.SINE2', 'adder.A');
  eq((await leads(p)).length, 1, 'works after broken autosave');
  const q = await open({ init: () => { const t = () => { throw new Error('blocked'); }; Storage.prototype.setItem = t; Storage.prototype.getItem = t; }, keep: true });
  await wire(q, 'master.SINE2', 'adder.A'); await q.click('#btnLib'); await q.click('.ltab[data-tab="t2"]'); await q.waitForTimeout(100); eq((await leads(q)).length, 1, 'works with storage blocked');
  ok(q.errs.filter(e => !/blocked/.test(e)).length === 0, 'errors with storage blocked: ' + q.errs.join(' | ')); await q.context().close();
}, { keepStorage: true });

T('PS06', 'Saving', 'A setup never inherits settings from the one loaded before it', async p => {
  await app(p, () => { const s = __app.scope; s.press('MATH'); for (let i = 0; i < 6; i++) s.turn('tscale', 1); __app.panel.setKnob('vco', 'FREQ', 0.9); });
  await app(p, () => __app.restore({ leads: [{ a: 'master.SINE2', b: 'adder.A', color: 'red' }], probes: {}, mods: {}, scope: { ch: { CH1: { vd: 9 } } }, v: 2 }));
  eq(await app(p, () => [__app.scope.st.math.on, __app.scope.st.td, __app.sim.mods.vco.p.FREQ]), [false, 7, 0.5], 'leftover settings');
});
T('PS08', 'Saving', 'A setup starts from power-on module state (hidden latches and filters do not carry over)', async p => {
  // the SERIAL TO PARALLEL bit-pair phase left by QPSK used to spoil the delta-modulator SNDR null (62 mV -> 904 mV)
  const resid = () => app(p, () => { const s = __app.sim, N = 48000, y = s.read('CH2', s.t, N, new Float64Array(N)); let a = 1e9, b = -1e9; for (const v of y) { a = Math.min(a, v); b = Math.max(b, v); } return b - a; });
  await loadSetup(p, 'Term2/12-Exp16-Vol2-D-Delta-SNDR'); await p.waitForTimeout(1500); const fresh = await resid();
  await loadSetup(p, 'Term2/07-Exp18-A-QPSK-Serial-to-Parallel'); await p.waitForTimeout(900);
  await loadSetup(p, 'Term2/12-Exp16-Vol2-D-Delta-SNDR'); await p.waitForTimeout(1500); const after = await resid();
  ok(fresh < 0.1 && Math.abs(after - fresh) < 0.01, `SNDR residual fresh ${fresh.toFixed(3)} V, after QPSK ${after.toFixed(3)} V`);
});
T('PS07', 'Saving', 'A saved scope reference does not break the next start', async p => {
  await loadSetup(p, 'Term1/01-Exp1-AM-Modulation'); await p.waitForTimeout(300); await app(p, () => { const s = __app.scope; s.press('STORAGE'); s.press('F2'); });
  await p.waitForTimeout(3300); await p.reload(); await p.waitForFunction(() => window.__app); await p.waitForTimeout(500);
  eq(await app(p, () => [__app.scope.st.ref.data, __app.scope.st.ref.on]), [null, false], 'reference after reload');
  await p.evaluate(() => { const a = JSON.parse(localStorage.getItem('ett.autosave')); a.scope.ref = { on: true, ch: 'CH1', data: { y: { 0: 1, 1: 2 }, vd: 1, pos: 0 } }; localStorage.setItem('ett.autosave', JSON.stringify(a)); });
  await p.reload(); await p.waitForFunction(() => window.__app); await p.waitForTimeout(500); eq(await app(p, () => __app.scope.st.ref.data), null, 'old-style reference kept');
});

// ================================================================== 7. language
T('LG01', 'Language', 'Every interface string exists in English and Arabic', async p => {
  const miss = await app(p, async () => { const r = []; for (const l of ['en', 'ar']) { __app.setLang(l); document.querySelectorAll('[data-t]').forEach(n => { if (!n.textContent.trim() || n.textContent === n.dataset.t) r.push(l + ':' + n.dataset.t); }); } __app.setLang('en'); return r; });
  eq(miss, [], 'untranslated keys');
});
T('LG02', 'Language', 'Arabic: right-to-left, panels open with nothing off screen, numbers left-to-right', async p => {
  await app(p, () => __app.setLang('ar')); ok(await app(p, () => document.documentElement.dir === 'rtl'), 'dir');
  for (const b of ['#btnLib', '#btnRef', '#btnBug', '#btnGuide']) { await p.click(b); await p.waitForTimeout(80);
    ok(await app(p, () => document.documentElement.scrollWidth <= innerWidth), b + ' overflow'); await p.keyboard.press('Escape'); if (b === '#btnGuide') await p.click('#btnGuide'); }
  await p.click('#btnLib'); ok(await app(p, () => [...document.querySelectorAll('.lrow .num')].every(n => getComputedStyle(n).direction === 'ltr')), 'page numbers not ltr');
});
T('LG03', 'Language', 'Switching language with a panel open re-labels it', async p => {
  await p.click('#btnLib'); await app(p, () => __app.setLang('ar')); ok(/تجارب/.test(await app(p, () => document.querySelector('#lib h2').textContent)), 'list not re-labelled');
  await p.keyboard.press('Escape'); await p.click('#btnGuide'); await app(p, () => __app.setLang('en')); ok(/Lab sheet/.test(await app(p, () => document.querySelector('#guide h2').textContent)), 'sheet not re-labelled');
});

// ================================================================== 8. sizes
T('LY01', 'Sizes', 'Rail and panels fit from 900 to 1920 px wide, both languages', async p => {
  const bad = [];
  for (const lang of ['en', 'ar']) for (const [w, h] of [[900, 600], [1100, 700], [1280, 720], [1366, 768], [1600, 900], [1920, 1080]]) {
    await p.setViewportSize({ width: w, height: h }); await app(p, l => __app.setLang(l), lang); await p.waitForTimeout(80);
    const r = await app(p, () => { const out = []; const vw = innerWidth, vh = innerHeight; const rail = document.querySelector('#rail');
      for (const el of rail.children) { if (el.type === 'file') continue; const b = el.getBoundingClientRect(); if (b.width && (b.left < 0 || b.right > vw)) out.push('rail:' + (el.id || el.className)); }
      if (document.documentElement.scrollWidth > vw) out.push('page scroll'); return out; });
    for (const sel of ['#btnLib', '#btnRef', '#btnBug']) { await p.click(sel); await p.waitForTimeout(50);
      const o = await app(p, s => { const box = document.querySelector(s === '#btnLib' ? '#lib' : s === '#btnRef' ? '#refp' : '#bugForm').getBoundingClientRect(); return box.left < 0 || box.right > innerWidth || box.top < 0 || box.bottom > innerHeight + 1; }, sel); if (o) r.push(sel + ' panel off screen');
      await p.keyboard.press('Escape'); }
    if (r.length) bad.push(`${lang} ${w}x${h}: ${r.join(', ')}`);
  }
  eq(bad, [], 'layout problems');
});

// ================================================================== 9. performance
T('PF01', 'Speed', 'The simulation runs faster than real time on the heaviest experiments', async p => {
  const out = [];
  for (const f of ['Term2/12-Exp16-Vol2-A-Delta-Modulator', 'Term2/10-Exp8-Vol2-B-PLL-Lock', 'Term2/08-Exp19-D-DSSS-Swept-Jamming', 'Term1/07-Exp7-FM-Demodulation']) {
    await loadSetup(p, f); const r = await app(p, () => { const s = __app.sim, n = 480000, t0 = performance.now(); s.run(n); return (n / 4.8e6) / ((performance.now() - t0) / 1000); });
    out.push([f.split('/')[1], +r.toFixed(2)]);
  }
  p.note = out.map(x => `${x[0]} ×${x[1]}`).join(', '); ok(out.every(x => x[1] > 1), 'slower than real time: ' + p.note);
});

// ================================================================== 10. monkey
T('MK01', 'Random', 'Monkey test: thousands of random clicks, drags, wheels, keys and panel actions', async p => {
  const N = +(ARGS.monkey || 2500); let seed = +(ARGS.seed || 12345); const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; const pick = a => a[Math.floor(rnd() * a.length)];
  const sockets = await app(p, () => [...new Set([...document.querySelectorAll('[data-socket]')].map(e => e.getAttribute('data-socket')))]);
  const keys = ['1', '2', '3', 'Escape', 'Control+=', 'Control+-', 'Control+0', 'Tab', 'Enter', ' '];
  p.dialogAnswer = true; await p.evaluate(() => { window.open = () => ({}); }); const log = [];
  for (let i = 0; i < N; i++) {
    const r = rnd(), act = r < .22 ? 'click' : r < .36 ? 'drag' : r < .46 ? 'wire' : r < .54 ? 'wheel' : r < .62 ? 'key' : r < .70 ? 'scope' : r < .76 ? 'dbl' : r < .80 ? 'right' : r < .85 ? 'lib' : r < .88 ? 'lang' : r < .91 ? 'panel' : r < .95 ? 'knobs' : 'size';
    log.push(act); if (log.length > 30) log.shift();
    try {
      const x = rnd() * 1580 + 10, y = 50 + rnd() * 840;
      if (act === 'click') await p.mouse.click(x, y);
      else if (act === 'dbl') await p.mouse.dblclick(x, y);
      else if (act === 'right') { await p.mouse.click(x, y, { button: 'right' }); if (rnd() < .5) { const c = await center(p, '.ctx button'); if (c) await p.mouse.click(c.x, c.y); } }
      else if (act === 'drag') await drag(p, { x, y }, { x: rnd() * 1580 + 10, y: 50 + rnd() * 840 }, 4);
      else if (act === 'wire') { const a = await sock(p, pick(sockets)), b = await sock(p, pick(sockets)); if (a && b) await drag(p, a, b, 4); }
      else if (act === 'wheel') { if (rnd() < .4) await p.keyboard.down('Control'); await p.mouse.move(x, y); await p.mouse.wheel(0, (rnd() - .5) * 600); await p.keyboard.up('Control'); }
      else if (act === 'key') await p.keyboard.press(pick(keys));
      else if (act === 'scope') await app(p, ([b, k, n]) => { const s = __app.scope; if (k < .5) s.press(b); else s.turn(['vscale', 'vpos', 'tscale', 'hpos', 'level', 'multi'][Math.floor(k * 12) % 6], n); }, [pick([...SCOPE_BTNS.filter(b => b !== 'prtsc' && b !== 'help'), 'F0', 'F1', 'F2', 'F3', 'F4']), rnd(), Math.round((rnd() - .5) * 10)]);
      else if (act === 'lib') { const all = await app(p, () => 0); await app(p, () => document.querySelector('#lib').classList.contains('open') || document.querySelector('#btnLib').click()); const tab = pick(['t1', 't2', 'x']); const t = await center(p, `.ltab[data-tab="${tab}"]`); if (t) await p.mouse.click(t.x, t.y); const rows = await app(p, () => document.querySelectorAll('.lrow').length); if (rows) { const c = await app(p, i => { const e = document.querySelectorAll('.lrow')[i]; e.scrollIntoView(); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, Math.floor(rnd() * rows)); await p.mouse.click(c.x, c.y); } }
      else if (act === 'lang') await app(p, l => __app.setLang(l), pick(['en', 'ar']));
      else if (act === 'panel') { await p.click(pick(['#btnLib', '#btnRef', '#btnBug', '#btnGuide', '#btnSettings', '#tGuide', '#vKit', '#vBoth', '#vScope'])).catch(() => { }); }
      else if (act === 'knobs') await app(p, ([a, b]) => { const ks = [...document.querySelectorAll('.knob')]; const k = ks[Math.floor(a * ks.length)]; __app.panel.setKnob(k.dataset.mod, k.dataset.p, b); }, [rnd(), rnd() * 1.4 - .2]);
      else if (act === 'size') await p.setViewportSize(pick([{ width: 1600, height: 900 }, { width: 1100, height: 700 }, { width: 1920, height: 1080 }]));
    } catch (e) { if (!/Timeout|not visible|detached|intercepts pointer|outside of the viewport|Element is not attached/.test(e.message)) throw e; }
    if (i % 250 === 0) { const bad = await finite(p); if (bad.length) throw new Fail(`non-finite ${bad} after: ${log.join(' ')}`); }
    if (p.errs.length) throw new Fail(`page error at action ${i} (${act}) after: ${log.join(' ')} → ${p.errs[0]}`);
  }
  p.note = N + ' actions';
});

// ------------------------------------------------------------------ runner
(async () => {
  browser = await chromium.launch();
  const only = ARGS.only ? new RegExp('^(' + ARGS.only.split(',').join('|') + ')') : null;
  for (const t of tests) {
    if (only && !only.test(t.id)) continue;
    const t0 = Date.now(); let p, status = 'PASS', detail = '';
    try { p = await open(); await t.fn(p); if (p.errs.length) throw new Fail(p.errs.slice(0, 3).join(' | ')); }
    catch (e) { status = 'FAIL'; detail = (e instanceof Fail ? '' : 'exception: ') + e.message.split('\n')[0]; }
    const note = p && p.note ? p.note : '';
    results.push({ id: t.id, area: t.area, name: t.name, status, detail, note, ms: Date.now() - t0 });
    console.log(`${status === 'PASS' ? 'PASS' : 'FAIL'}  ${t.id}  ${t.name}${detail ? '\n        → ' + detail : ''}${note ? '  [' + note + ']' : ''}  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    if (p) await p.context().close().catch(() => { });
  }
  await browser.close();
  const f = results.filter(r => r.status === 'FAIL').length;
  console.log(`\n${results.length - f}/${results.length} passed`);
  if (ARGS.json) fs.writeFileSync(ARGS.json, JSON.stringify(results, null, 1));
  process.exit(f ? 1 : 0);
})();
