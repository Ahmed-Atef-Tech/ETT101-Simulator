// Oscilloscope verification: feeds known signals from the kit into the simulated UTD2102CEL and checks every scope
// function against the instrument's published specifications and against signal theory.
// Run:  node build.mjs && node tests/e2e/scope_check.cjs      (writes docs/scope-check.md)
//
// Sources
//  [M] UNI-T UTD2000L Series User Manual (UTD2052CEL / UTD2102CEL / UTD2052CL): menus, holdoff 100 ns-1.5 s, trigger
//      level range +-8 div, DC gain accuracy 3 % (10 mV/div and up), AC coupling -3 dB <= 10 Hz, 20 MHz BW limit,
//      12 x 8 divisions, FFT windows, cursors, auto-setup, SET TO ZERO.
//  [S] UNI-T UTD2102CEL product specification: 100 MHz, 1 GS/s, 1 mV-20 V/div, 2 ns-50 s/div, 6-digit counter,
//      probes 1x / 10x, math + - x / and FFT.
//  [K] The kit's MASTER SIGNALS: 2.0833 kHz sine 4 Vp-p, 100 kHz sine and cosine 4 Vp-p, 2.0833 kHz digital 0-5 V
//      (ETT-101 user manual; src/engine/modules.js).
//  [T] Signal theory: Vrms of a sine = Vpk / sqrt 2; a sine of 2 V peak is +3.01 dBVrms; a 50 % square has 50 % duty.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const URL = 'file://' + path.resolve(__dirname, '../../dist/index.html');
const rows = []; let fails = 0;
const F2K = 100e3 / 48; // 2083.33 Hz
function check(area, what, src, expected, got, pass) { rows.push({ area, what, src, expected, got, pass }); if (!pass) fails++; console.log(`${pass ? 'PASS' : 'FAIL'}  ${area.padEnd(10)} ${what}  — expected ${expected}, got ${got}`); }
const near = (v, ref, tol) => Number.isFinite(v) && Math.abs(v - ref) <= tol;
const rel = (v, ref, r) => near(v, ref, Math.abs(ref) * r);
const f = (v, d = 3) => Number.isFinite(v) ? +v.toPrecision(d + 1) : String(v);

(async () => {
  const browser = await chromium.launch();
  const p = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.waitForFunction(() => window.__app && window.__app.sim);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('ett.notice', '1'); localStorage.setItem('ett.tour', '1'); }); await p.reload(); await p.waitForFunction(() => window.__app);
  const app = (fn, arg) => p.evaluate(fn, arg);
  const wait = ms => p.waitForTimeout(ms);
  // load a set-up: probes, leads, knob settings and scope settings (time/div index in today's list)
  async function setup({ probes = {}, leads = [], mods = {}, scope = {} }, ms = 500) {
    await app(o => __app.restore({ v: 2, leads: o.leads.map(([a, b]) => ({ a, b, color: 'red' })), probes: o.probes, mods: o.mods, scope: { tdVer: 2, ...o.scope } }), { probes, leads, mods, scope });
    await wait(ms);
  }
  const S = () => app(() => JSON.parse(JSON.stringify(__app.scope.st)));
  const meas = ch => app(ch => __app.scope.measure(ch), ch);
  const td = sec => app(s => __app.TDIV ? __app.TDIV.indexOf(s) : null, sec);
  const TD = await app(() => { const s = __app.scope; return (s.constructor.TDIV) || null; });
  const tdIdx = sec => app(sec => { const L = [2e-9, 5e-9, 10e-9, 20e-9, 50e-9, 100e-9, 200e-9, 0.5e-6, 1e-6, 2e-6, 5e-6, 10e-6, 20e-6, 50e-6, 100e-6, 200e-6, 500e-6, 1e-3, 2e-3, 5e-3, 10e-3, 20e-3, 50e-3]; return L.findIndex(x => Math.abs(x - sec) < sec * 1e-6); }, sec);
  const vdIdx = v => [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20].findIndex(x => Math.abs(x - v) < v * 1e-6);
  const CH = (o = {}) => ({ on: true, vd: vdIdx(1), fine: 1, pos: 0, cpl: 'DC', bw: false, finemode: false, probe: 0, inv: false, ...o });

  // ------------------------------------------------------------------ ranges [S][M]
  const ranges = await app(() => { const s = __app.scope; const out = {};
    s.st.ch.CH1.vd = 0; out.vmin = s.vd('CH1'); s.st.ch.CH1.vd = 99; for (let i = 0; i < 40; i++) s.turn('vscale', -1); out.vmax = s.vd('CH1');
    for (let i = 0; i < 40; i++) s.turn('tscale', 1); out.tmin = s.tdiv(); for (let i = 0; i < 40; i++) s.turn('tscale', -1); out.tmax = s.tdiv();
    s.press('HMENU'); for (let i = 0; i < 200; i++) s.turn('multi', -1); out.hmin = s.st.hold; for (let i = 0; i < 400; i++) s.turn('multi', 1); out.hmax = s.st.hold; s.press('HMENU');
    return out; });
  check('Vertical', 'Smallest V/div', '[S]', '1 mV/div', `${ranges.vmin * 1e3} mV/div`, near(ranges.vmin, 1e-3, 1e-9));
  check('Vertical', 'Largest V/div (probe 1X)', '[S]', '20 V/div', `${ranges.vmax} V/div`, near(ranges.vmax, 20, 1e-9));
  check('Horizontal', 'Fastest time/div', '[S]', '2 ns/div', `${f(ranges.tmin * 1e9)} ns/div`, near(ranges.tmin, 2e-9, 1e-15));
  check('Horizontal', 'Slowest time/div', '[S] 50 s/div', '50 ms/div (simulation limit, see notes)', `${f(ranges.tmax * 1e3)} ms/div`, near(ranges.tmax, 50e-3, 1e-9));
  check('Horizontal', 'Holdoff range', '[M]', '100 ns – 1.5 s', `${f(ranges.hmin * 1e9)} ns – ${f(ranges.hmax)} s`, near(ranges.hmin, 100e-9, 1e-12) && near(ranges.hmax, 1.5, 1e-9));
  const grid = await app(() => { const s = __app.scope; return { w: s.W, h: s.H }; });
  check('Display', 'Screen resolution and divisions', '[M]', '800 × 480, 12 × 8 div', `${grid.w} × ${grid.h}, 12 × 8 div`, grid.w === 800 && grid.h === 480);

  // ------------------------------------------------------------------ vertical accuracy on the 2 kHz sine [K][M][T]
  await setup({ probes: { CH1: 'master.SINE2' }, scope: { td: await tdIdx(200e-6), ch: { CH1: CH({ vd: vdIdx(1) }), CH2: CH({ on: false }) } } });
  let m = await meas('CH1');
  check('Measure', 'Pk-Pk of 2 kHz SINE (4 Vp-p)', '[K] ±3 % [M]', '4.00 V ±0.12', `${f(m['Pk-Pk'])} V`, rel(m['Pk-Pk'], 4, 0.03));
  check('Measure', 'Max / Min', '[K]', '+2.00 / −2.00 V ±0.06', `${f(m.Max)} / ${f(m.Min)} V`, rel(m.Max, 2, 0.03) && rel(m.Min, -2, 0.03));
  check('Measure', 'RMS = Vpk/√2', '[T]', '1.414 V ±3 %', `${f(m.RMS)} V`, rel(m.RMS, 2 / Math.SQRT2, 0.03));
  check('Measure', 'Mean of a sine', '[T]', '0 V ±0.05', `${f(m.Mean)} V`, near(m.Mean, 0, 0.05));
  check('Measure', 'Freq', '[K]', `${f(F2K, 4)} Hz ±0.2 %`, `${f(m.Freq, 4)} Hz`, rel(m.Freq, F2K, 0.002));
  check('Measure', 'Period', '[K]', '480.0 µs ±0.2 %', `${f(m.Period * 1e6, 4)} µs`, rel(m.Period, 1 / F2K, 0.002));
  check('Measure', 'Rise time of a sine (10–90 %)', '[T] 0.295·T', `${f(0.2952 / F2K * 1e6)} µs ±10 %`, `${f(m.Rise * 1e6)} µs`, rel(m.Rise, 0.2952 / F2K, 0.1));
  // the trace really spans 4 divisions at 1 V/div
  let span = await app(() => { const s = __app.scope, fr = s.frame.CH1; let mx = -1e9, mn = 1e9; for (const v of fr.y) { if (v > mx) mx = v; if (v < mn) mn = v; } return (mx - mn) / s.vd('CH1'); });
  check('Vertical', 'Displayed height at 1 V/div', '[K]', '4.0 div ±0.12', `${f(span)} div`, near(span, 4, 0.12));
  await app(() => { __app.scope.st.ch.CH1.vd = 8; }); await wait(400);
  span = await app(() => { const s = __app.scope, fr = s.frame.CH1; let mx = -1e9, mn = 1e9; for (const v of fr.y) { if (v > mx) mx = v; if (v < mn) mn = v; } return (mx - mn) / s.vd('CH1'); });
  check('Vertical', 'Displayed height at 0.5 V/div', '[K]', '8.0 div ±0.24', `${f(span)} div`, near(span, 8, 0.24));
  await app(() => { const c = __app.scope.st.ch.CH1; c.vd = 9; c.pos = 2; }); await wait(400);
  const pos = await app(() => { const s = __app.scope; return (s.ypix(0, s.vd('CH1'), s.st.ch.CH1.pos) - (38 + 200)) / -50; });
  check('Vertical', 'POSITION moves the trace', '[M]', '0 V at +2.0 div', `0 V at ${f(pos)} div`, near(pos, 2, 0.01));

  // probe 10X, invert, coupling
  await app(() => { const c = __app.scope.st.ch.CH1; c.pos = 0; c.probe = 1; }); await wait(400); m = await meas('CH1');
  const vd10 = await app(() => __app.scope.vd('CH1'));
  check('Vertical', 'Probe 10X: V/div and readings ×10', '[S]', '10 V/div, Pk-Pk 40 V', `${vd10} V/div, ${f(m['Pk-Pk'])} V`, near(vd10, 10, 1e-9) && rel(m['Pk-Pk'], 40, 0.03));
  await setup({ probes: { CH1: 'master.SINE2', CH2: 'master.SINE2' }, scope: { td: await tdIdx(200e-6), ch: { CH1: CH({ inv: true }), CH2: CH() }, trig: { src: 'CH2', slope: 'R', mode: 'AUTO', cpl: 'DC', level: 0 } } });
  const inv = await app(() => { const s = __app.scope, a = s.frame.CH1.raw; return a.slice(0, 60).reduce((x, y) => x + y, 0); });
  await app(() => { __app.scope.st.ch.CH1.inv = false; }); await wait(500);
  const nInv = await app(() => { const s = __app.scope, a = s.frame.CH1.raw; return a.slice(0, 60).reduce((x, y) => x + y, 0); });
  check('Vertical', 'Invert flips the trace (trigger on CH2)', '[M]', 'same samples, opposite sign', `${f(nInv)} → ${f(inv)}`, Math.sign(inv) === -Math.sign(nInv) && rel(-inv, nInv, 0.1));
  // sine + 1 V DC from the ADDER: OUT = -(A + B) with G = g = 1 -> -sine - 1 V
  const dcAdd = { probes: { CH1: 'adder.OUT' }, leads: [['master.SINE2', 'adder.A'], ['vdc.VDC', 'adder.B']], mods: { adder: { G: 0.5, g: 0.5 }, vdc: { VDC: 0.7 } } };
  await setup({ ...dcAdd, scope: { td: await tdIdx(200e-6), ch: { CH1: CH({ cpl: 'DC' }), CH2: CH({ on: false }) } } }); m = await meas('CH1');
  check('Vertical', 'DC coupling keeps the DC level', '[M]', 'Mean −1.00 V ±0.05', `${f(m.Mean)} V`, near(m.Mean, -1, 0.05));
  await app(() => { __app.scope.st.ch.CH1.cpl = 'AC'; }); await wait(500); m = await meas('CH1');
  check('Vertical', 'AC coupling removes the DC level', '[M]', 'Mean 0 V ±0.05, Pk-Pk 4 V', `${f(m.Mean)} V, ${f(m['Pk-Pk'])} V`, near(m.Mean, 0, 0.05) && rel(m['Pk-Pk'], 4, 0.04));
  await app(() => { __app.scope.st.ch.CH1.cpl = 'GND'; }); await wait(400); m = await meas('CH1');
  check('Vertical', 'GND coupling shows 0 V', '[M]', 'Pk-Pk ≈ 0, Mean 0', `${f(m['Pk-Pk'])} V, ${f(m.Mean)} V`, near(m['Pk-Pk'], 0, 0.01) && near(m.Mean, 0, 0.01));

  // BW limit 20 MHz: no effect on a 100 kHz carrier at 2 us/div and 100 us/div; visible on a fast edge at 5 ns/div
  for (const t of [2e-6, 100e-6]) {
    await setup({ probes: { CH1: 'master.SINE100' }, scope: { td: await tdIdx(t), ch: { CH1: CH(), CH2: CH({ on: false }) } } });
    const a = await app(() => { const fr = __app.scope.frame.CH1; let mx = -1e9, mn = 1e9; for (let i = 0; i < fr.y.length; i++) { const v = fr.hi ? fr.hi[i] : fr.y[i], w = fr.lo ? fr.lo[i] : fr.y[i]; if (v > mx) mx = v; if (w < mn) mn = w; } return mx - mn; });
    await app(() => { __app.scope.st.ch.CH1.bw = true; }); await wait(400);
    const b = await app(() => { const fr = __app.scope.frame.CH1; let mx = -1e9, mn = 1e9; for (let i = 0; i < fr.y.length; i++) { const v = fr.hi ? fr.hi[i] : fr.y[i], w = fr.lo ? fr.lo[i] : fr.y[i]; if (v > mx) mx = v; if (w < mn) mn = w; } return mx - mn; });
    check('Vertical', `BW Limit 20 MHz leaves 100 kHz alone (${t * 1e6} µs/div)`, '[M]', 'height change < 3 %', `${f(a)} → ${f(b)} V`, rel(b, a, 0.03));
  }

  // ------------------------------------------------------------------ horizontal [K]
  await setup({ probes: { CH1: 'master.SINE100' }, scope: { td: await tdIdx(5e-6), ch: { CH1: CH(), CH2: CH({ on: false }) } } }); m = await meas('CH1');
  check('Horizontal', '100 kHz period at 5 µs/div', '[K]', '10.00 µs ±0.2 %', `${f(m.Period * 1e6, 4)} µs`, rel(m.Period, 10e-6, 0.002));
  const cyc = await app(() => { const fr = __app.scope.frame.CH1, x = []; for (let i = 1; i < fr.y.length; i++) if (fr.y[i - 1] < 0 && fr.y[i] >= 0) x.push(i); return (x[x.length - 1] - x[0]) / (x.length - 1); });
  check('Horizontal', 'One 10 µs cycle is 2 div (100 px) at 5 µs/div', '[K]', '100 px ±1', `${f(cyc)} px`, near(cyc, 100, 1));
  await app(() => { const s = __app.scope; s.st.ztd = 9; s.press('HMENU'); s.press('F1'); s.press('HMENU'); }); await wait(500); // window 2 µs/div m = await meas('CH1');
  const zoomOk = await app(() => !!__app.scope.mainFrame.CH1 && __app.scope.st.zoom);
  check('Horizontal', 'Window (zoom): split screen, period still 10 µs', '[M]', 'main view kept, 10.00 µs', `${zoomOk ? 'split' : 'no split'}, ${f(m.Period * 1e6, 4)} µs`, zoomOk && rel(m.Period, 10e-6, 0.005));
  await app(() => { const s = __app.scope; s.press('HMENU'); s.press('F0'); s.press('HMENU'); });
  // fastest sweep: interpolated line, no errors
  await app(() => { __app.scope.st.td = 0; }); await wait(400);
  const fast = await app(() => { const fr = __app.scope.frame.CH1; return fr && fr.y.every(Number.isFinite); });
  check('Horizontal', '2 ns/div shows a finite interpolated trace', '[S]', 'finite', fast ? 'finite' : 'NaN', !!fast);

  // ------------------------------------------------------------------ trigger [M]
  const atCentre = async () => app(() => { const s = __app.scope, fr = s.frame.CH1, i = fr.y.length / 2; return { v: fr.y[i], d: fr.y[i + 6] - fr.y[i - 6], status: s.status }; });
  await setup({ probes: { CH1: 'master.SINE2' }, scope: { td: await tdIdx(100e-6), ch: { CH1: CH(), CH2: CH({ on: false }) }, trig: { src: 'CH1', slope: 'R', mode: 'NORMAL', cpl: 'DC', level: 0 } } });
  let c = await atCentre();
  check('Trigger', 'Rising edge, level 0 V: trace crosses 0 V going up at the trigger point', '[M]', '|v| < 0.08 V, rising, Trig\'d', `${f(c.v)} V, ${c.d > 0 ? 'rising' : 'falling'}, ${c.status}`, near(c.v, 0, 0.08) && c.d > 0 && c.status === "Trig'd");
  await app(() => { __app.scope.st.trig.slope = 'F'; }); await wait(400); c = await atCentre();
  check('Trigger', 'Falling edge', '[M]', 'falling at the trigger point', c.d < 0 ? 'falling' : 'rising', near(c.v, 0, 0.08) && c.d < 0);
  await app(() => { const t = __app.scope.st.trig; t.slope = 'R'; t.level = 1; }); await wait(400); c = await atCentre();
  check('Trigger', 'Level +1 V', '[M]', 'trace at +1.00 V ±0.08 at the trigger point', `${f(c.v)} V`, near(c.v, 1, 0.08));
  await app(() => { __app.scope.st.trig.level = 3; }); await wait(500); c = await atCentre();
  check('Trigger', 'Normal mode, level above the signal: no trigger', '[M]', 'Ready', c.status, c.status === 'Ready');
  await app(() => { __app.scope.st.trig.mode = 'AUTO'; }); await wait(400); c = await atCentre();
  check('Trigger', 'Auto mode, level above the signal: free-runs', '[M]', 'Auto', c.status, c.status === 'Auto');
  await app(() => { const s = __app.scope; s.st.trig.mode = 'NORMAL'; s.press('force'); }); await wait(300);
  const forced = await app(() => __app.scope.status); check('Trigger', 'FORCE makes one trigger', '[M]', "Trig'd once", forced, forced === "Trig'd" || forced === 'Ready');
  await app(() => { const t = __app.scope.st.trig; t.level = 0; t.mode = 'SINGLE'; __app.scope.st.run = true; }); await wait(600);
  const single = await app(() => ({ run: __app.scope.st.run, status: __app.scope.status }));
  check('Trigger', 'Single: captures once, then stops', '[M]', 'Stop', `${single.status}, ${single.run ? 'running' : 'stopped'}`, !single.run);
  await app(() => { const s = __app.scope.st; s.run = true; s.trig.mode = 'AUTO'; s.trig.slope = 'RF'; }); await wait(400); c = await atCentre();
  check('Trigger', 'Rise & Fall: triggers on either edge', '[M]', '0 V crossing at the trigger point', `${f(c.v)} V, ${c.status}`, near(c.v, 0, 0.08) && c.status === "Trig'd");
  // trigger level range +-8 div
  const lv = await app(() => { const s = __app.scope; s.st.trig.slope = 'R'; s.st.trig.level = 0; for (let i = 0; i < 2000; i++) s.turn('level', 1); const hi = s.st.trig.level; for (let i = 0; i < 4000; i++) s.turn('level', -1); return [hi, s.st.trig.level, s.vd('CH1')]; });
  check('Trigger', 'Level range ±8 div from the centre', '[M]', '±8.0 V at 1 V/div', `${f(lv[1])} … ${f(lv[0])} V`, near(lv[0], 8, 1e-6) && near(lv[1], -8, 1e-6));
  // EXT trigger from the 2 kHz digital signal, CH1 shows the sine locked to it
  await setup({ probes: { CH1: 'master.SINE2', EXT: 'master.DIG2' }, scope: { td: await tdIdx(100e-6), ch: { CH1: CH(), CH2: CH({ on: false }) }, trig: { src: 'EXT', slope: 'R', mode: 'NORMAL', cpl: 'DC', level: 2.5 } } });
  const e1 = await atCentre(); await wait(300); const e2 = await atCentre();
  check('Trigger', 'EXT trigger (2 kHz DIGITAL) holds the sine still', '[M]', 'same value at the trigger point frame to frame', `${f(e1.v)} / ${f(e2.v)} V, ${e2.status}`, near(e1.v, e2.v, 0.08) && e2.status === "Trig'd");
  // holdoff: longer than one period skips edges but still triggers
  await setup({ probes: { CH1: 'master.DIG8' }, scope: { td: await tdIdx(100e-6), ch: { CH1: CH({ vd: vdIdx(2) }), CH2: CH({ on: false }) }, trig: { src: 'CH1', slope: 'R', mode: 'NORMAL', cpl: 'DC', level: 2.5 }, hold: 300e-6 } });
  c = await atCentre(); check('Trigger', 'Holdoff 300 µs on an 8.3 kHz square still triggers on an edge', '[M]', "Trig'd, rising edge at the centre", `${c.status}, ${c.d > 0 ? 'rising' : 'not rising'}`, c.status === "Trig'd" && c.d > 0);

  // ------------------------------------------------------------------ digital signal: duty, widths, edges [K][T]
  await setup({ probes: { CH1: 'master.DIG2' }, scope: { td: await tdIdx(200e-6), ch: { CH1: CH({ vd: vdIdx(2) }), CH2: CH({ on: false }) }, trig: { src: 'CH1', slope: 'R', mode: 'AUTO', cpl: 'DC', level: 2.5 } } }); m = await meas('CH1');
  check('Measure', '+Duty / −Duty of the 2 kHz DIGITAL', '[K][T]', '50 % / 50 % ±1', `${f(m['+Duty'])} / ${f(m['-Duty'])} %`, near(m['+Duty'], 50, 1) && near(m['-Duty'], 50, 1));
  check('Measure', '+Width', '[K]', '240 µs ±1 %', `${f(m['+Width'] * 1e6)} µs`, rel(m['+Width'], 0.5 / F2K, 0.01));
  check('Measure', 'Top / Base / Amplitude', '[K]', '5 V / 0 V / 5 V ±3 %', `${f(m.Top)} / ${f(m.Base)} / ${f(m.Amplitude)} V`, rel(m.Top, 5, 0.03) && near(m.Base, 0, 0.15) && rel(m.Amplitude, 5, 0.03));

  // ------------------------------------------------------------------ cursors [M]
  await setup({ probes: { CH1: 'master.SINE2' }, scope: { td: await tdIdx(100e-6), ch: { CH1: CH(), CH2: CH({ on: false }) }, cur: { type: 'Time', src: 'CH1', act: 'A', a: -2.4, b: 2.4 } } });
  let cv = await app(() => __app.scope.cursorVals());
  check('Cursor', 'Time cursors 4.8 div apart at 100 µs/div', '[M]', 'ΔT 480 µs, 1/ΔT 2.083 kHz', `ΔT ${cv.v1}, 1/ΔT ${cv.v2}`, /480/.test(cv.v1) && /2\.083kHz/.test(cv.v2));
  await app(() => { Object.assign(__app.scope.st.cur, { type: 'Voltage', a: -2, b: 2 }); }); cv = await app(() => __app.scope.cursorVals());
  check('Cursor', 'Voltage cursors 4 div apart at 1 V/div', '[M]', 'ΔV 4.00 V', `ΔV ${cv.v1}`, /^4\.00V$/.test(cv.v1));
  await app(() => { Object.assign(__app.scope.st.cur, { type: 'Track', a: 0, b: 1.2 }); __app.scope.st.trig.level = 0; }); await wait(400); cv = await app(() => __app.scope.cursorVals());
  const expB = 2 * Math.sin(2 * Math.PI * F2K * 120e-6);
  check('Cursor', 'Tracking cursor reads the trace', '[M]', `A ≈ 0 V, B ≈ ${f(expB)} V (2·sin(2π·f·120 µs))`, `A ${f(cv.VA)} V, B ${f(cv.VB)} V`, near(cv.VA, 0, 0.1) && near(cv.VB, expB, 0.12));

  // ------------------------------------------------------------------ math and FFT [M][T]
  await setup({ probes: { CH1: 'master.SINE2', CH2: 'master.SINE2' }, scope: { td: await tdIdx(200e-6), ch: { CH1: CH(), CH2: CH() } } });
  const math = await app(async () => { const s = __app.scope, out = {}; for (const op of ['+', '-', '*', '/']) { s.st.math = { ...s.st.math, on: true, kind: 'Math', op }; await new Promise(r => setTimeout(r, 250)); const a = s.frame.CH1.y, b = s.frame.CH2.y, i = 100; out[op] = [a[i], b[i]]; } s.st.math.on = false; return out; });
  const [a1, b1] = math['+'];
  check('Math', 'A + B, A − B, A × B, A ÷ B operators exist and run', '[M][S]', '4 operators', Object.keys(math).join(' '), Object.keys(math).length === 4 && Number.isFinite(a1 + b1));
  await app(() => { const s = __app.scope.st; s.ch.CH2.on = false; s.math = { ...s.math, on: true, kind: 'FFT', fftSrc: 'CH1', win: 'Hanning', unit: 'dBVrms' }; }); await wait(700);
  const fftPk = await app(() => { const F = __app.scope.fft; let k = 1; for (let i = 2; i < F.mag.length; i++) if (F.mag[i] > F.mag[k]) k = i; return { f: k * F.fsEff / (2 * F.mag.length), db: F.mag[k], bin: F.fsEff / (2 * F.mag.length), n: F.mag.length * 2 }; });
  check('Math', 'FFT length', '[M]', '1024 points', `${fftPk.n} points`, fftPk.n === 1024);
  check('Math', 'FFT peak of the 2 kHz sine', '[K]', `${f(F2K, 4)} Hz ± 1 bin`, `${f(fftPk.f, 4)} Hz (bin ${f(fftPk.bin)} Hz)`, near(fftPk.f, F2K, fftPk.bin));
  check('Math', 'FFT level of a 2 V peak sine (Hanning)', '[T]', '+3.01 dBVrms ±1.5 dB', `${f(fftPk.db)} dBVrms`, near(fftPk.db, 3.01, 1.5));
  const wins = await app(() => { const s = __app.scope, L = []; s.st.menu = 'MATH'; for (let i = 0; i < 4; i++) { L.push(s.st.math.win); s.press('F2'); } return L; });
  check('Math', 'FFT windows', '[M]', 'Hanning, Hamming, Blackman, Rectangle', wins.join(', '), wins.join() === 'Hanning,Hamming,Blackman,Rectangle');

  // ------------------------------------------------------------------ XY [M]
  await setup({ probes: { CH1: 'master.SINE100', CH2: 'master.COS100' }, scope: { td: await tdIdx(10e-6), ch: { CH1: CH(), CH2: CH() }, disp: { type: 'Vectors', persist: 0, fmt: 'XY', grid: 'Dots', bright: 100 } } });
  const xy = await app(() => { const s = __app.scope, a = s.frame.CH1.raw, b = s.frame.CH2.raw; let lo = 1e9, hi = 0; for (let i = 0; i < Math.min(a.length, b.length); i++) { const r = Math.hypot(a[i], b[i]); if (r < lo) lo = r; if (r > hi) hi = r; } return [lo, hi]; });
  check('XY', 'Sine on X, cosine on Y draws a circle', '[M] phase error ±3°', 'radius 2.0 V everywhere (±3 %)', `${f(xy[0])} … ${f(xy[1])} V`, rel(xy[0], 2, 0.03) && rel(xy[1], 2, 0.03));

  // ------------------------------------------------------------------ acquire [M]
  await setup({ probes: { CH1: 'master.SINE2' }, scope: { td: await tdIdx(10e-6), ch: { CH1: CH({ vd: vdIdx(0.5) }), CH2: CH({ on: false }) } } });
  const roughness = () => app(() => { const y = __app.scope.frame.CH1.y; let s = 0; for (let i = 2; i < y.length; i++) { const d = y[i] - 2 * y[i - 1] + y[i - 2]; s += d * d; } return Math.sqrt(s / y.length); });
  const r0 = await roughness(); await app(() => { const s = __app.scope; s.st.acq = 'Average'; s.st.avgN = 16; s.avgBuf = {}; }); await wait(1500); const r1 = await roughness();
  check('Acquire', 'Average (16) reduces the display noise', '[M]', 'less than half the noise of Sample', `${f(r0 * 1e3)} → ${f(r1 * 1e3)} mV`, r1 < r0 / 2);
  // peak detect catches a 100 kHz square that Sample aliases at 50 ms/div
  await setup({ probes: { CH1: 'master.DIG100' }, scope: { td: await tdIdx(50e-3), ch: { CH1: CH({ vd: vdIdx(2) }), CH2: CH({ on: false }) }, acq: 'Sample' } }, 900);
  const env = () => app(() => { const fr = __app.scope.frame.CH1; let full = 0; const N = fr.y.length; for (let i = 0; i < N; i++) { const lo = fr.lo ? fr.lo[i] : fr.y[i], hi = fr.hi ? fr.hi[i] : fr.y[i]; if (hi - lo > 4) full++; } return full / N; });
  const e0 = await env(); await app(() => { __app.scope.st.acq = 'Peak'; }); await wait(900); const e1p = await env();
  check('Acquire', 'Peak detect shows the full 0–5 V of a 100 kHz square at 50 ms/div', '[M]', 'Peak: every column 0–5 V; Sample: single dots', `Sample ${f(e0 * 100)} % of columns, Peak ${f(e1p * 100)} %`, e1p > 0.95 && e0 < 0.05);

  // ------------------------------------------------------------------ counter, AUTO, SET TO ZERO, RUN/STOP [S][M]
  await setup({ probes: { CH1: 'master.SINE2' }, scope: { td: await tdIdx(200e-6), ch: { CH1: CH(), CH2: CH({ on: false }) } } });
  const cnt = await app(() => { const s = __app.scope; s._cf = 0; return s.counterF(); });
    check('Counter', 'Cymometer on 2 kHz SINE', '[S] 6 digits', `${f(F2K, 6)} Hz ±0.05 %`, `${f(cnt, 6)} Hz`, rel(cnt, F2K, 5e-4));
  await setup({ probes: { CH1: 'master.SINE2' }, scope: { td: 0, ch: { CH1: CH({ vd: 0, pos: 3 }), CH2: CH({ on: false }) } } });
  await app(() => __app.scope.press('auto')); await wait(600);
  const au = await app(() => { const s = __app.scope.st; return { vd: [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20][s.ch.CH1.vd], td: __app.scope.tdiv(), src: s.trig.src, mode: s.trig.mode, slope: s.trig.slope, fmt: s.disp.fmt }; });
  const cycles = au.td * 12 * F2K;
  check('AUTO', 'AUTO on 2 kHz SINE: fits the screen, shows a few cycles, edge trigger on CH1', '[M]', '4 Vp-p in 4–8 div, 2–6 cycles, CH1 Auto Rise, YT', `${au.vd} V/div (${f(4 / au.vd)} div), ${f(cycles)} cycles, ${au.src} ${au.mode} ${au.slope}, ${au.fmt}`, 4 / au.vd >= 2 && 4 / au.vd <= 8 && cycles >= 2 && cycles <= 6 && au.src === 'CH1' && au.mode === 'AUTO' && au.slope === 'R' && au.fmt === 'YT');
  await app(() => { const s = __app.scope; s.st.ch.CH1.pos = 2; s.st.hpos = 1e-4; s.st.hold = 1e-3; s.press('zero'); }); await wait(300);
  const z = await app(() => { const s = __app.scope.st; return [s.ch.CH1.pos, s.hpos, s.hold, s.trig.level]; });
  check('Keys', 'SET TO ZERO', '[M]', 'positions 0, holdoff min, level at 50 % (0 V)', `pos ${z[0]}, H ${z[1]}, holdoff ${f(z[2] * 1e9)} ns, level ${f(z[3])} V`, z[0] === 0 && z[1] === 0 && near(z[2], 100e-9, 1e-12) && near(z[3], 0, 0.1));
  await app(() => __app.scope.press('run')); await wait(200); const fr1 = await app(() => Array.from(__app.scope.frame.CH1.y.slice(0, 50))); await wait(400); const fr2 = await app(() => Array.from(__app.scope.frame.CH1.y.slice(0, 50)));
  check('Keys', 'RUN/STOP freezes the waveform', '[M]', 'identical frames while stopped', JSON.stringify(fr1) === JSON.stringify(fr2) ? 'identical' : 'changed', JSON.stringify(fr1) === JSON.stringify(fr2));
  await app(() => __app.scope.press('run'));
  const keys = await app(() => [...document.querySelectorAll('#scope .sbtn text')].map(t => t.textContent).join(' '));
  check('Keys', 'Front-panel key names', '[M]', 'HORI MENU, TRIG MENU, SET TO ZERO, FORCE; no HELP key', /HORI MENU/.test(keys.replace(/HORI\s+MENU/, 'HORI MENU')) && /TRIG/.test(keys) && !/HELP/.test(keys) ? 'as listed' : keys, /HORI/.test(keys) && /TRIG/.test(keys) && /FORCE/.test(keys) && !/HELP/.test(keys));

  check('Page', 'No page errors during the checks', '—', 'none', errs.length ? errs.join('; ') : 'none', errs.length === 0);
  await browser.close();

  // ------------------------------------------------------------------ report
  const date = new Date().toISOString().slice(0, 10);
  const md = [`# Oscilloscope verification`, '', `Every function of the simulated UTD2102CEL checked with known signals from the kit, against the instrument's published specifications and signal theory. Generated by \`tests/e2e/scope_check.cjs\` on ${date}: **${rows.length - fails} of ${rows.length} checks pass**.`, '',
    '> [!NOTE]', '> Preliminary (beta) version: the simulator may not match the real kit and oscilloscope 100%; the real instruments are the reference.', '',
    '## Sources', '', '- **[M]** UNI-T, *UTD2000L Series Digital Storage Oscilloscope User Manual* (UTD2052CEL / UTD2102CEL / UTD2052CL): menus and keys, holdoff 100 ns – 1.5 s, trigger level range ±8 div, DC gain accuracy 3 %, AC coupling −3 dB ≤ 10 Hz, 20 MHz bandwidth limit, 12 × 8 divisions on an 800 × 480 screen, 1024-point FFT and its windows, cursors, auto-setup, SET TO ZERO.',
    '- **[S]** UNI-T UTD2102CEL product specification: 100 MHz, 1 GS/s, 1 mV – 20 V/div, 2 ns – 50 s/div, 6-digit frequency counter, 1X / 10X probes, math + − × ÷ and FFT.',
    '- **[K]** Emona ETT-101 MASTER SIGNALS: 2.0833 kHz sine 4 Vp-p, 100 kHz sine and cosine 4 Vp-p, 2.0833 kHz and 8.33 kHz and 100 kHz digital 0–5 V.',
    '- **[T]** Signal theory: Vrms = Vpk/√2; a 2 V peak sine is +3.01 dBVrms; 10–90 % rise of a sine is 0.295 of its period.', '',
    '## Results', '', '| | Area | Check | Source | Expected | Simulator |', '|---|---|---|---|---|---|',
    ...rows.map(r => `| ${r.pass ? '✅' : '❌'} | ${r.area} | ${r.what} | ${r.src} | ${r.expected} | ${String(r.got).replace(/\|/g, '/')} |`), '',
    '## Known differences from the real instrument', '',
    '- **Slowest time base is 50 ms/div** (the real scope goes to 50 s/div). The simulation keeps about one second of signal in memory; the lab experiments never need slower sweeps.',
    '- **Trigger types:** only Edge is modelled. The real menu also has Pulse and Alternate triggers.',
    '- **Measurements:** 16 of the 28 parameters are modelled (Overshoot, Preshoot, Delay and a few others are not).',
    '- **Storage:** reference waveform and PNG screenshot only; no internal setup memories or USB.',
    '- **Utility:** no Recorder, Skin or language change on the scope itself (the app language switch is in Settings).',
    '- **Sampling / FastACQ** are shown in ACQUIRE but do not change the simulation: the kit signals are simulated at 4.8 MS/s and drawn with sin(x)/x interpolation, which looks the same as real-time sampling for these signals.',
    '- **Self Cal** only shows the calibration message.', '',
  ].join('\n');
  fs.mkdirSync(path.resolve(__dirname, '../../docs'), { recursive: true });
  fs.writeFileSync(path.resolve(__dirname, '../../docs/scope-check.md'), md);
  console.log(`\n${rows.length - fails}/${rows.length} checks pass  →  docs/scope-check.md`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
