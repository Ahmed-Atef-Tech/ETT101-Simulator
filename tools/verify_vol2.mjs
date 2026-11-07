// Checks against the second-semester lab book (Emona Lab Manual Vol.2 content)
import { Sim } from '../src/engine/sim.js';
import { FS } from '../src/engine/dsp.js';
import { TLPF_MIN, TLPF_MAX } from '../src/engine/modules.js';
const fcK = f => (f - TLPF_MIN) / (TLPF_MAX - TLPF_MIN);
const N = 2304 * 8, pp = a => Math.max(...a) - Math.min(...a), avg = a => a.reduce((x, v) => x + v, 0) / a.length;
const rd2 = (s, a, b, t = 0.06) => { s.setProbe('CH1', a); s.setProbe('CH2', b || a); s.run(FS * t); return [s.read('CH1', s.t, N, new Float64Array(N)), s.read('CH2', s.t, N, new Float64Array(N))]; };
const corr = (a, b) => { const ma = avg(a), mb = avg(b); let c = 0, p = 0, q = 0; for (let i = 0; i < a.length; i++) { c += (a[i] - ma) * (b[i] - mb); p += (a[i] - ma) ** 2; q += (b[i] - mb) ** 2; } return c / Math.sqrt(p * q); };
const best = (a, b) => { let m = -2, lag = 0; for (let k = 0; k < 2304; k += 4) { const c = corr(a.slice(0, N - 2304), b.slice(k, N - 2304 + k)); if (c > m) { m = c; lag = k; } } return [m, lag / FS * 1e6]; };
const ok = (c, t) => console.log(`  ${c ? 'PASS' : 'FAIL'}  ${t}`);
const mk = L => { const s = new Sim(); for (const [a, b] of L) s.addLead(a, b, 'r'); return s; };
{ console.log('Exp 1 Sampling'); const s = mk([['master.SINE2', 'das.IN1'], ['master.DIG8', 'das.C1']]);
  const [m, y] = rd2(s, 'master.SINE2', 'das.OUT'); const on = y.filter((v, i) => s.read('CH1', s.t, N, new Float64Array(N)) && true);
  let errOn = 0, cnt = 0, d8 = s.mods.master.out; // natural sampling: output follows the message while the 8 kHz clock is high, 0 V otherwise
  { const T = 2304, M = new Float64Array(N); for (let i = 0; i < N; i++) M[i] = ((s.t - N + i) % 576) < 288 ? 1 : 0; for (let i = 0; i < N; i++) { const e = M[i] ? y[i] - m[i] : y[i]; errOn = Math.max(errOn, Math.abs(e)); } }
  ok(errOn < 0.1, `natural sampling: OUT = message while 8 kHz is high, 0 V while low (max error ${errOn.toFixed(3)} V)`);
  s.addLead('master.SINE2', 'das.SHIN', 'r'); const [, h] = rd2(s, 'master.SINE2', 'das.SH'); let steps = 0; for (let i = 1; i < N; i++) if (Math.abs(h[i] - h[i - 1]) > 1e-9) steps++;
  ok(Math.abs(steps / (N / FS) - 8333) < 300, `sample-and-hold: flat steps, ${(steps / (N / FS)).toFixed(0)} level changes per second (8.33 kHz clock)`);
  s.addLead('das.SH', 'tlpf.IN', 'r'); s.mods.tlpf.set('GAIN', 0.5); s.mods.tlpf.set('FC', fcK(2.5e3)); const [m2, r] = rd2(s, 'master.SINE2', 'tlpf.OUT', 0.1); const [c] = best(m2, r);
  ok(c > 0.99, `Part C: reconstructed through the TUNEABLE LPF just above 2 kHz: correlation ${c.toFixed(3)}`); }
{ console.log('Exp 2 PCM encoding'); const s = mk([['vdc.GND', 'pcmenc.IN1'], ['master.DIG8', 'pcmenc.CLK']]);
  const code = () => { const [fs, d] = rd2(s, 'pcmenc.FS', 'pcmenc.DATA', 0.01); let i = N - 1; while (i > 0 && !(fs[i] > 2.5 && fs[i - 1] < 2.5)) i--; const bitT = FS / 8333.33; let c = ''; for (let b = 7; b >= 0; b--) c += d[Math.round(i + 0.5 * bitT - (b) * bitT)] > 2.5 ? '1' : '0'; return c; };
  ok(code() === '10000000', `0 V input -> ${code()} (offset binary, MSB first, FS high during bit 0)`);
  s.removeLead(s.leads[0].id); s.addLead('vdc.VDC', 'pcmenc.IN1', 'r'); s.mods.vdc.set('VDC', 1); const hi = code(); s.mods.vdc.set('VDC', 0); const lo = code();
  ok(hi === '11111111' && lo === '00000000', `VDC fully clockwise (+2.5 V) -> ${hi}, fully anticlockwise (-2.5 V) -> ${lo} (book Table 1: limits near ±2 V)`);
  let v = -2.5, c0 = null; const levels = []; for (; v <= 2.5; v += 0.004) { s.mods.vdc.set('VDC', (v + 2.5) / 5); const c = code(); if (c !== c0) { levels.push([v, c]); c0 = c; } if (levels.length > 3 && c === '11111111') break; }
  const f = levels.find(x => x[1] === '11111111'), z = levels.find(x => x[1] === '00000001');
  console.log(`        code 00000001 first at ${z && z[0].toFixed(3)} V, 11111111 first at ${f && f[0].toFixed(3)} V -> step ${(4 / 256 * 1000).toFixed(1)} mV (book Q13: (V11111111 - V00000000)/256)`); }
{ console.log('Exp 4 ASK'); const s = mk([['master.SINE2', 'das.IN1'], ['seq.X', 'das.C1'], ['master.DIG2', 'seq.CLK']]);
  const [x, a] = rd2(s, 'seq.X', 'das.OUT'); let bad = 0; for (let i = 0; i < N; i++) if (x[i] < 2.5 && Math.abs(a[i]) > 0.01) bad++;
  ok(bad === 0, `ASK: no carrier while the data is logic 0, carrier passes while logic 1 ("What is the ASK voltage at logic 0?" -> 0 V)`); }
{ console.log('Exp 6 BPSK'); const s = mk([['master.DIG2', 'seq.CLK'], ['seq.LINE', 'mult1.XDC'], ['master.SINE100', 'mult1.YDC'], ['mult1.KXY', 'mult2.XDC'], ['master.SINE100', 'mult2.YDC'], ['mult2.KXY', 'tlpf.IN']]);
  s.mods.tlpf.set('GAIN', 0.5); s.mods.tlpf.set('FC', 1); const [l, b] = rd2(s, 'seq.LINE', 'mult1.KXY');
  ok(Math.abs(pp(l) - 4) < 0.05, `LINE CODE (DIP 00 = NRZ-L) swings ${pp(l).toFixed(2)} Vp-p, ±2 V (DATEx user manual)`);
  const [l2, r] = rd2(s, 'seq.LINE', 'tlpf.OUT'); const [c, lag] = best(l2, r); ok(c > 0.9, `product detector recovers the data: correlation ${c.toFixed(3)} (delay ${lag.toFixed(0)} us)`); }
{ console.log('Exp 7 QPSK'); const s = mk([['master.DIG8', 'seq.CLK'], ['seq.X', 's2p.SERIAL'], ['master.DIG8', 's2p.CLK'], ['seq.SYNC', 'div.IN']]); s.mods.div.set('S1', 0); s.mods.div.set('S2', 1);
  const [x1, x2] = rd2(s, 's2p.X1', 's2p.X2'); const tr = a => { let c = 0; for (let i = 1; i < a.length; i++) if (Math.abs(a[i] - a[i - 1]) > 1) c++; return c; };
  ok(Math.abs(pp(x1) - 4) < 0.05 && Math.abs(pp(x2) - 4) < 0.05, `X1, X2 bipolar ±2 V (${pp(x1).toFixed(2)} / ${pp(x2).toFixed(2)} Vp-p)`);
  s.setProbe('CH1', 'seq.SYNC'); s.setProbe('CH2', 'div.OUT'); s.run(FS * 0.15); const L = 480000, sy = s.read('CH1', s.t, L, new Float64Array(L)), dv = s.read('CH2', s.t, L, new Float64Array(L)); const edges = a => { let c = 0; for (let i = 1; i < a.length; i++) if (a[i] > 2.5 && a[i - 1] <= 2.5) c++; return c; };
  ok(edges(sy) === 2 * edges(dv) || Math.abs(edges(sy) - 2 * edges(dv)) <= 1, `Divider with left switch up, right switch down divides by 2: ${edges(sy)} SYNC pulses -> ${edges(dv)}`); }
{ console.log('Exp 9 PWM sawtooth'); const s = mk([['master.DIG8', 'tpg.CLK'], ['tpg.Q2', 'util.DIODE_IN']]); s.mods.tpg.set('WIDTH', 0); s.mods.tpg.set('DELAY', 0);
  const [, w] = rd2(s, 'util.DIODE', 'util.DIODE', 0.03); const seg = w.slice(N - 576 * 3); let rise = 0, fall = 0; for (let i = 1; i < seg.length; i++) { const d = seg[i] - seg[i - 1]; if (d > 0) rise += d; }
  let maxUp = 0; for (let i = 1; i < seg.length; i++) maxUp = Math.max(maxUp, seg[i] - seg[i - 1]); const upSamples = seg.filter((v, i) => i && v > seg[i - 1]).length;
  ok(Math.max(...seg) > 3 && upSamples / seg.length < 0.15, `Q2 -> DIODE & RC LPF gives an 8 kHz sawtooth: peak ${Math.max(...seg).toFixed(2)} V, min ${Math.min(...seg).toFixed(2)} V, rising only ${(100 * upSamples / seg.length).toFixed(0)} % of the time (fast rise, slow decay)`); }
{ console.log('Exp 16 FSK (book steps 6-18, Figure 2: LINE CODE -> VCO)'); const s = mk([['master.DIG2', 'seq.CLK'], ['seq.LINE', 'vco.IN'], ['vco.SINE', 'tlpf.IN']]);
  s.mods.vco.set('HI', 0); s.mods.vco.set('GAIN', 0.5); s.mods.vco.set('FREQ', 0.25); // "about a quarter of its travel"; Figure 2: LINE CODE (DIP 00, NRZ-L) -> VCO INPUT
  const fr = () => { s.setProbe('CH1', 'seq.LINE'); s.setProbe('CH2', 'vco.SINE'); s.run(FS * 0.03); const N = Math.round(FS * 0.0149), x = s.read('CH1', s.t, N, new Float64Array(N)), v = s.read('CH2', s.t, N, new Float64Array(N)); const z = [[], []]; for (let i = 1; i < N; i++) if (v[i - 1] < 0 && v[i] >= 0) z[x[i] > 0 ? 1 : 0].push(i); const per = a => { const d = []; for (let k = 1; k < a.length; k++) if (a[k] - a[k - 1] < FS / 400) d.push(a[k] - a[k - 1]); d.sort((p, q) => p - q); return FS / d[d.length >> 1]; }; /* median period: cycles that straddle a bit edge are outliers */ return [per(z[0]), per(z[1])]; };
  const [f0a, f1a] = fr(); console.log(`        Part A: logic 0 -> ${(f0a / 1e3).toFixed(2)} kHz, logic 1 -> ${(f1a / 1e3).toFixed(2)} kHz`);
  s.mods.vco.set('FREQ', 0.7); s.mods.tlpf.set('GAIN', 0.5); const [f0b, f1b] = fr(); const bit = FS / 2083.33; // step 14: "number 2 on a clock face"
  const pc = (a, q) => { const b = a.slice().sort((p, r) => p - r); return b[Math.floor(q * (b.length - 1))]; };
  const meas = fc => { s.mods.tlpf.set('FC', fcK(fc)); s.setProbe('CH1', 'seq.LINE'); s.setProbe('CH2', 'tlpf.OUT'); s.run(FS * 0.04); const M = Math.round(FS * 0.0149), x = s.read('CH1', s.t, M, new Float64Array(M)), y = s.read('CH2', s.t, M, new Float64Array(M)); const A = [[], []]; /* one full 31-bit X period */
    for (let i = Math.round(2 * bit); i < M; i++) { const st = x[i] > 0 ? 1 : 0; let stable = true; for (let k = 1; k <= bit * 1.5; k += 8) if ((x[i - k] > 0 ? 1 : 0) !== st) { stable = false; break; } if (stable) A[st].push(Math.abs(y[i])); }
    return [pc(A[0], 0.99), pc(A[1], 0.9)]; };
  // step 18: turn fc down from fully clockwise until the higher tone has gone
  let fcStop = null, res; for (let fc = 15e3; fc >= 10.6e3; fc -= 250) { res = meas(fc); if (res[1] < 0.05 * res[0]) { fcStop = fc; break; } } /* 5 %: 0.1 div at 1 V/div, what "equal to zero" looks like on the scope */
  ok(fcStop && res[0] > 1.5, `Part B: tones ${(f0b / 1e3).toFixed(2)} / ${(f1b / 1e3).toFixed(2)} kHz both pass at fc fully clockwise (15 kHz); turning fc down, the logic-1 tone is gone (${fcStop ? (100 * res[1] / res[0]).toFixed(1) : '-'} %) at fc = ${fcStop ? (fcStop / 1e3).toFixed(1) : '-'} kHz while the logic-0 tone passes at ${res[0].toFixed(2)} Vpk -> ASK-like output, Figure 6`); }
{ console.log('Utilities comparator (spec: TTL rise time 500 ns typ.)'); const s = mk([['master.SINE2', 'util.CIN'], ['vdc.GND', 'util.REF']]);
  const [c] = rd2(s, 'util.COMP', null, 0.01); let i = 1; while (!(c[i - 1] < 0.5 && c[i] >= 0.5)) i++; let j = i; while (c[j] < 4.5) j++; let k = i; while (c[k - 1] > 0.5 && k > 1) k--;
  ok(Math.abs((j - i + 1) / FS * 1e9 - 500) < 130, `10-90% rise time (one sample = 208 ns) ${((j - i + 1) / FS * 1e9).toFixed(0)} ns`); }
