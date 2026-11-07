// Experiments 4-7 wired exactly as the book's figures, knobs at the book's positions.
import { Sim } from '../src/engine/sim.js';
import { FS } from '../src/engine/dsp.js';
const N = 2304 * 8, pp = a => Math.max(...a) - Math.min(...a), avg = a => a.reduce((x, v) => x + v, 0) / a.length;
const rd2 = (s, a, b, t = 0.08) => { s.setProbe('CH1', a); s.setProbe('CH2', b); s.run(FS * t); return [s.read('CH1', s.t, N, new Float64Array(N)), s.read('CH2', s.t, N, new Float64Array(N))]; };
const corr = (a, b) => { const ma = avg(a), mb = avg(b); let c = 0, p = 0, q = 0; for (let i = 0; i < a.length; i++) { c += (a[i] - ma) * (b[i] - mb); p += (a[i] - ma) ** 2; q += (b[i] - mb) ** 2; } return c / Math.sqrt(p * q); };
const bestLag = (a, b) => { let best = -2, lag = 0; for (let k = 0; k < 2304; k += 4) { const c = corr(a.slice(0, N - 2304), b.slice(k, N - 2304 + k)); if (c > best) { best = c; lag = k; } } return [best, lag / FS * 1e6]; };
const freq = b => { const m = (Math.max(...b) + Math.min(...b)) / 2; let c = 0, f = -1, l = -1; for (let i = 1; i < b.length; i++) if (b[i - 1] < m && b[i] >= m) { if (f < 0) f = i; else { c++; l = i; } } return c / ((l - f) / FS); };
const ok = (c, t) => console.log(`  ${c ? 'PASS' : 'FAIL'}  ${t}`);
const mk = leads => { const s = new Sim(); for (const [a, b] of leads) s.addLead(a, b, 'red'); return s; };
{ console.log('Exp 4 DSBSC demodulation'); const s = mk([['master.SINE100', 'mult1.XAC'], ['master.SINE2', 'mult1.YAC'], ['mult1.KXY', 'mult2.XDC'], ['master.SINE100', 'mult2.YDC'], ['mult2.KXY', 'tlpf.IN']]);
  s.mods.tlpf.set('GAIN', 0.5); s.mods.tlpf.set('FC', 1); const [m, o] = rd2(s, 'master.SINE2', 'tlpf.OUT'); const [c, lag] = bestLag(m, o);
  ok(c > 0.99, `recovered message matches the 2 kHz message: correlation ${c.toFixed(3)}, ${pp(o).toFixed(2)} Vp-p, delay ${lag.toFixed(0)} us`);
  s.removeLead(s.leads.find(l => l.a === 'master.SINE100' && l.b === 'mult2.YDC').id); s.addLead('vco.SINE', 'mult2.YDC', 'r'); s.mods.vco.set('HI', 1); s.mods.vco.set('FREQ', 0.5); s.mods.vco.set('GAIN', 0);
  console.log(`        VCO HI with FREQUENCY ADJUST in the middle: ${(s.mods.vco.f0() / 1e3).toFixed(1)} kHz (book: tune it to the 100 kHz carrier)`); }
{ console.log('Exp 5 SSB'); const s = mk([['master.SINE2', 'phase.IN'], ['phase.OUT', 'mult1.XAC'], ['master.COS100', 'mult1.YAC'], ['master.SINE100', 'mult2.XDC'], ['master.SINE2', 'mult2.YDC'], ['mult1.KXY', 'adder.A'], ['mult2.KXY', 'adder.B']]);
  s.mods.phase.set('INV', 1); s.mods.phase.set('PHASE', 0.5);
  // steps 15-19: set each adder input for a 4 Vp-p output
  s.mods.adder.set('G', 0); let lo = 0, hi = 0.5; for (let k = 0; k < 20; k++) { const mid = (lo + hi) / 2; s.mods.adder.set('g', mid); const [, y] = rd2(s, 'adder.OUT', 'adder.OUT', 0.02); if (pp(y) < 4) lo = mid; else hi = mid; } const gK = (lo + hi) / 2;
  s.mods.adder.set('g', 0); lo = 0; hi = 0.5; for (let k = 0; k < 20; k++) { const mid = (lo + hi) / 2; s.mods.adder.set('G', mid); const [, y] = rd2(s, 'adder.OUT', 'adder.OUT', 0.02); if (pp(y) < 4) lo = mid; else hi = mid; } s.mods.adder.set('g', gK);
  console.log(`        steps 15-19: g = ${(2 * gK).toFixed(3)}, G = ${(2 * (lo + hi) / 2).toFixed(3)} (k = 1 -> each DSBSC 8 Vp-p, so gains near 0.5)`);
  // step 21: phase for flattest envelope
  let best = 1e9, bp = 0; for (let p = 0; p <= 1; p += 0.02) { s.mods.phase.set('PHASE', p); const [, y] = rd2(s, 'adder.OUT', 'adder.OUT', 0.02); const e = []; for (let i = 96; i + 48 < N - 96; i += 48) { let mx = -1e9; for (let j = 0; j < 48; j++) mx = Math.max(mx, y[i + j]); e.push(mx); } const r = Math.max(...e) - Math.min(...e); if (r < best) { best = r; bp = p; } }
  s.mods.phase.set('PHASE', bp); const [, y] = rd2(s, 'adder.OUT', 'adder.OUT');
  ok(best < 0.1, `flattest envelope at phase knob ${bp.toFixed(2)} (shift ${(s.mods.phase.phaseDeg() + 180).toFixed(0)}°): ripple ${best.toFixed(3)} V, single sinewave at ${(freq(y) / 1e3).toFixed(3)} kHz (book Q3: 98 or 102 kHz)`);
  s.addLead('adder.OUT', 'mult3.XDC', 'r'); s.addLead('master.SINE100', 'mult3.YDC', 'r'); s.addLead('mult3.KXY', 'tlpf.IN', 'r'); s.mods.tlpf.set('GAIN', 0.5); s.mods.tlpf.set('FC', 1);
  const [m, o] = rd2(s, 'master.SINE2', 'tlpf.OUT'); const [c, lag] = bestLag(m, o); ok(c > 0.99, `recovered message: correlation ${c.toFixed(3)} with the original, ${pp(o).toFixed(2)} Vp-p, delay ${lag.toFixed(0)} us`); }
{ console.log('Exp 6 FM'); const s = mk([]); s.mods.vco.set('HI', 0); s.mods.vco.set('GAIN', 2 / 3); s.mods.vco.set('FREQ', 0.5);
  console.log(`        FREQUENCY ADJUST in the middle: ${(s.mods.vco.f0() / 1e3).toFixed(2)} kHz before trimming (book step 8 trims it to 10 kHz)`);
  s.mods.vco.set('FREQ', (10e3 - 1e3) / 16e3); s.addLead('master.DIG2', 'vco.IN', 'r'); const [m, f] = rd2(s, 'master.DIG2', 'vco.SINE');
  const seg = (lo) => { const idx = []; for (let i = 0; i < N; i++) if ((m[i] > 2.5) === !lo) idx.push(i); return idx; };
  const fr = sel => { let c = 0; for (let k = 1; k < sel.length; k++) if (sel[k] === sel[k - 1] + 1 && f[sel[k] - 1] < 0 && f[sel[k]] >= 0) c++; return c / (sel.length / FS); };
  ok(fr(seg(false)) > fr(seg(true)) * 1.5, `2 kHz DIGITAL message: VCO ${(fr(seg(true)) / 1e3).toFixed(1)} kHz while the message is 0 V, ${(fr(seg(false)) / 1e3).toFixed(1)} kHz while it is 5 V`); }
{ console.log('Exp 7 FM demodulation'); const s = mk([['vdc.VDC', 'vco.IN']]); s.mods.vco.set('HI', 0); s.mods.vco.set('GAIN', 1); s.mods.vco.set('FREQ', (10e3 - 1e3) / 16e3);
  const f = v => { s.mods.vdc.set('VDC', (v + 2.5) / 5); const [, y] = rd2(s, 'vdc.VDC', 'vco.SINE', 0.03); return freq(y); };
  console.log(`        GAIN fully clockwise: ${((f(2) - f(0)) / 2e3).toFixed(2)} kHz/V (book: must be trimmed down to 2.5 kHz/V)`);
  { let lo = 0, hi = 1; for (let k = 0; k < 14; k++) { const g = (lo + hi) / 2; s.mods.vco.set('GAIN', g); if (f(2) < 15e3) lo = g; else hi = g; } console.log(`        GAIN turned to ${((lo + hi) / 2).toFixed(2)} of its travel for 15 kHz at +2 V`); } ok(Math.abs(f(2) - 15e3) < 100 && Math.abs(f(-2) - 5e3) < 100, `GAIN trimmed: +2 V -> ${(f(2) / 1e3).toFixed(2)} kHz, -2 V -> ${(f(-2) / 1e3).toFixed(2)} kHz (book steps 14-17: 15 kHz and 5 kHz)`);
  for (const [a, b] of [['vco.SINE', 'util.CIN'], ['vdc.GND', 'util.REF'], ['util.COMP', 'tpg.CLK'], ['tpg.Q1', 'channel.BB_IN']]) s.addLead(a, b, 'r');
  s.mods.tpg.set('DELAY', 0); s.mods.tpg.set('WIDTH', (12 - 5) / 35);
  const dc = v => { s.mods.vdc.set('VDC', (v + 2.5) / 5); const [, y] = rd2(s, 'vdc.VDC', 'channel.BB', 0.05); return avg(y); };
  const d = [-2, 0, 2].map(dc); ok(d[0] < d[1] && d[1] < d[2], `BASEBAND LPF DC follows VDC: ${d.map(v => v.toFixed(3)).join(' / ')} V at -2 / 0 / +2 V (book: "a small voltage")`);
  s.removeLead(s.leads[0].id); s.addLead('master.SINE2', 'vco.IN', 'r'); const [m, o] = rd2(s, 'master.SINE2', 'channel.BB', 0.1); const [c, lag] = bestLag(m, o);
  ok(c > 0.97, `Part D: demodulated output is the message with some phase shift: correlation ${c.toFixed(3)}, ${pp(o).toFixed(3)} Vp-p, delay ${lag.toFixed(0)} us`); }
