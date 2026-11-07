// Loads every generated setup into the engine and checks the result the book asks the student to see.
import { Sim } from '../src/engine/sim.js';
import { FS } from '../src/engine/dsp.js';
import { SOCKETS } from '../src/engine/modules.js';
import { SETUPS } from './make_setups.mjs';

const avg = a => a.reduce((x, v) => x + v, 0) / a.length, pp = a => Math.max(...a) - Math.min(...a);
const corr = (a, b) => { const ma = avg(a), mb = avg(b); let c = 0, p = 0, q = 0; for (let i = 0; i < a.length; i++) { c += (a[i] - ma) * (b[i] - mb); p += (a[i] - ma) ** 2; q += (b[i] - mb) ** 2; } return c / Math.sqrt(p * q); };
// best correlation over a delay window. For a sinewave message any phase shift is a delay, so the signed maximum is used;
// polarity is only meaningful with a short window (data signals, maxLag well under a bit)
const lagCorr = (a, b, maxLag = 2400, signed = true) => { let best = signed ? -2 : 0, lag = 0; const n = a.length - maxLag; for (let k = 0; k <= maxLag; k += 8) { const c = corr(a.slice(0, n), b.slice(k, k + n)); if (signed ? c > best : Math.abs(c) > Math.abs(best)) { best = c; lag = k; } } return [best, lag / FS * 1e6]; };
const freq = y => { const m = (Math.max(...y) + Math.min(...y)) / 2; let c = 0, f = -1, l = -1; for (let i = 1; i < y.length; i++) if (y[i - 1] < m && y[i] >= m) { if (f < 0) f = i; else { c++; l = i; } } return c / ((l - f) / FS); };
function load(st) {
  const s = new Sim(); const bad = [];
  for (const l of st.leads) { if (!SOCKETS[l.a] || !SOCKETS[l.b]) bad.push(`${l.a}->${l.b}`); else s.addLead(l.a, l.b, l.color); }
  for (const k of ['CH1', 'CH2', 'EXT']) { const v = st.probes[k]; if (v && !SOCKETS[v]) bad.push('probe ' + v); }
  for (const m in st.mods) { if (!s.mods[m]) { bad.push('module ' + m); continue; } for (const p in st.mods[m]) s.mods[m].set(p, st.mods[m][p]); }
  return [s, bad];
}
function rd(s, socks, t = 0.05, dur = 0.01) {
  const ks = ['CH1', 'CH2', 'EXT', 'HOV']; socks.forEach((x, i) => s.setProbe(ks[i], x)); s.run(FS * t);
  const M = Math.round(FS * dur); return socks.map((_, i) => s.read(ks[i], s.t, M, new Float64Array(M)));
}
const agree = (d, c, th = [2.5, 2.5]) => { let best = 0; for (let k = 0; k < 4800; k += 8) { let a = 0; const n = d.length - 4800; for (let i = 0; i < n; i++) a += ((d[i] > th[0]) === (c[i + k] > th[1])) ? 1 : 0; best = Math.max(best, a / n, 1 - a / n); } return best; };
const ok = (name, c, txt) => { console.log(`  ${c ? 'PASS' : 'FAIL'}  ${name}: ${txt}`); if (!c) fails++; };
let fails = 0;

const CHECKS = {
  'Term1/Exp1-AM-Modulation': s => { const [a, m] = rd(s, ['adder.OUT', 'mult2.KXY']); return [Math.abs(avg(a) - 1) < 0.03 && Math.abs(pp(a) - 1) < 0.05, `ADDER ${avg(a).toFixed(3)} V DC + ${pp(a).toFixed(3)} Vp-p, AM ${pp(m).toFixed(2)} Vp-p`]; },
  'Term1/Exp2-DSBSC-Modulation': s => { const [m] = rd(s, ['mult1.KXY']); return [Math.abs(pp(m) - 8) < 0.3, `DSBSC ${pp(m).toFixed(2)} Vp-p`]; },
  'Term1/Exp3-AM-Demodulation': s => { const [a, r] = rd(s, ['master.SINE2', 'util.RC']); const [c] = lagCorr(a, r); return [c > 0.98, `recovered message correlation ${c.toFixed(3)}`]; },
  'Term1/Exp4-DSBSC-Demodulation': s => { const [a, r] = rd(s, ['master.SINE2', 'tlpf.OUT']); const [c] = lagCorr(a, r); return [c > 0.99, `recovered message correlation ${c.toFixed(3)}, ${pp(r).toFixed(2)} Vp-p`]; },
  'Term1/Exp4-PartC-Buffer': s => { const [b, r] = rd(s, ['buffer.OUT', 'tlpf.OUT']); const [c] = lagCorr(b, r); return [Math.abs(c) > 0.99, `BUFFER ${pp(b).toFixed(2)} Vp-p, recovered correlation ${c.toFixed(3)}`]; },
  'Term1/Exp4-VCO-Carrier': s => { const [v] = rd(s, ['vco.SINE']); return [Math.abs(freq(v) - 100e3) < 500, `VCO ${(freq(v) / 1e3).toFixed(2)} kHz`]; },
  'Term1/Exp5-SSB-Modulation': s => { const [y] = rd(s, ['adder.OUT']); return [Math.abs(freq(y) - 97.917e3) < 300 || Math.abs(freq(y) - 102.083e3) < 300, `single sinewave at ${(freq(y) / 1e3).toFixed(2)} kHz, ${pp(y).toFixed(2)} Vp-p`]; },
  'Term1/Exp5-SSB-Demodulation': s => { const [a, r] = rd(s, ['master.SINE2', 'tlpf.OUT']); const [c] = lagCorr(a, r); return [Math.abs(c) > 0.99, `recovered message correlation ${c.toFixed(3)}`]; },
  'Term1/Exp6-FM-Modulation': s => { const [m, v] = rd(s, ['master.DIG2', 'vco.SINE']); return [pp(v) > 3.5, `FM ${pp(v).toFixed(2)} Vp-p`]; },
  'Term1/Exp6-PartC-Sine-Message': s => { const [v] = rd(s, ['vco.SINE']); return [pp(v) > 3.5, `FM ${pp(v).toFixed(2)} Vp-p`]; },
  'Term1/Exp7-FM-Demodulation': s => { s.mods.vdc.set('VDC', 0.9); const [v] = rd(s, ['vco.SINE'], 0.03); return [Math.abs(freq(v) - 15e3) < 150, `+2 V -> VCO ${(freq(v) / 1e3).toFixed(2)} kHz (book: 15 kHz)`]; },
  'Term1/Exp7-PartD-Sine-Message': s => { const [a, r] = rd(s, ['master.SINE2', 'channel.BB'], 0.1, 0.02); const [c] = lagCorr(a, r); return [Math.abs(c) > 0.95, `demodulated message correlation ${c.toFixed(3)}, ${pp(r).toFixed(3)} Vp-p`]; },

  'Extra/Vol1-Exp3-A-Adder-Model': s => { const [m, o] = rd(s, ['master.SINE2', 'adder.OUT']); return [Math.abs(pp(o) / pp(m) - 2) < 0.05, `input ${pp(m).toFixed(2)} Vp-p -> output ${pp(o).toFixed(2)} Vp-p (book Table 1: twice the input, inverted)`]; },
  'Extra/Vol1-Exp3-B-Phase-Cancellation': s => { const [m, o] = rd(s, ['master.SINE2', 'adder.OUT']); return [pp(o) < 0.1 * pp(m), `output ${pp(o).toFixed(3)} Vp-p (book: close to 0 V but not exactly; try 0.1 V/div)`]; },
  'Extra/Vol2-Exp18-A-AM-Spectrum': s => { const [a, m] = rd(s, ['adder.OUT', 'mult2.KXY'], 0.03, 0.02); const sp = f => { let re = 0, im = 0; for (let i = 0; i < m.length; i++) { re += m[i] * Math.cos(2 * Math.PI * f * i / FS); im += m[i] * Math.sin(2 * Math.PI * f * i / FS); } return 2 * Math.hypot(re, im) / m.length; };
    const [l, c, u] = [90e3, 100e3, 110e3].map(f => sp(s.mods.vco.f0() < 0 ? f : (f === 100e3 ? f : 100e3 + (f - 100e3) * s.mods.vco.f0() / 10e3)));
    return [Math.abs(pp(a) - 1) < 0.05 && c > 1.5 && Math.abs(l / c - 0.25) < 0.03 && Math.abs(u / c - 0.25) < 0.03, `message ${pp(a).toFixed(2)} Vp-p; carrier ${c.toFixed(2)} V, sidebands ${l.toFixed(2)} / ${u.toFixed(2)} V (m = 0.5 -> each sideband = m/2 = 0.25 of the carrier)`]; },
  'Extra/Vol2-Exp18-D-DSBSC-Spectrum': s => { const [m] = rd(s, ['mult1.KXY'], 0.03, 0.02); const sp = f => { let re = 0, im = 0; for (let i = 0; i < m.length; i++) { re += m[i] * Math.cos(2 * Math.PI * f * i / FS); im += m[i] * Math.sin(2 * Math.PI * f * i / FS); } return 2 * Math.hypot(re, im) / m.length; };
    const f0 = s.mods.vco.f0(), c = sp(100e3), l = sp(100e3 - f0), u = sp(100e3 + f0); return [c < 0.02 * l && Math.abs(l - u) < 0.1 * l, `no carrier (${c.toFixed(3)} V), sidebands ${l.toFixed(2)} / ${u.toFixed(2)} V at ${((100e3 - f0) / 1e3).toFixed(1)} / ${((100e3 + f0) / 1e3).toFixed(1)} kHz`]; },
  'Extra/Vol1-Exp14-A-PCM-Through-Narrow-Channel': s => { const [v, o] = rd(s, ['vdc.VDC', 'pcmdec.OUT1'], 0.05, 0.02); const ok1 = Math.abs(avg(o) - avg(v)) < 0.1; s.mods.tlpf.set('FC', 0); const [, o2] = rd(s, ['vdc.VDC', 'pcmdec.OUT1'], 0.1, 0.02);
    return [ok1 && (pp(o2) > 0.3 || Math.abs(avg(o2) - avg(v)) > 0.3), `channel wide: decoder ${avg(o).toFixed(2)} V for ${avg(v).toFixed(2)} V in; fc fully anticlockwise: decoder gives ${avg(o2).toFixed(2)} V (${pp(o2).toFixed(2)} Vp-p) -> wrong codes`]; },
  'Extra/Vol1-Exp14-B-Bandwidth-Limited-Data': s => { const [l, y] = rd(s, ['seq.LINE', 'tlpf.OUT'], 0.05, 0.015); const [c] = lagCorr(l, y, 800, false); s.mods.tlpf.set('FC', 0); const [l2, y2] = rd(s, ['seq.LINE', 'tlpf.OUT'], 0.05, 0.015); const [c2] = lagCorr(l2, y2, 2400, false);
    return [c > 0.95 && c2 < c - 0.05, `fc fully clockwise: correlation ${c.toFixed(3)}; fully anticlockwise: ${c2.toFixed(3)}, ${pp(y2).toFixed(2)} Vp-p (rounded and delayed)`]; },
  'Extra/Vol1-Exp14-B-Higher-Bit-Rate': s => { const [l, y] = rd(s, ['seq.LINE', 'tlpf.OUT'], 0.05, 0.015); const [c] = lagCorr(l, y, 800, false); s.mods.vco.set('FREQ', 1); const [l2, y2] = rd(s, ['seq.LINE', 'tlpf.OUT'], 0.05, 0.015); const [c2] = lagCorr(l2, y2, 800, false);
    return [c2 < c, `10 kHz clock: correlation ${c.toFixed(3)}; 17 kHz clock: ${c2.toFixed(3)} (faster data, same channel -> more distortion)`]; },
  'Extra/Vol1-Exp14-C-Restoring-Data': s => { const [l, y] = rd(s, ['seq.LINE', 'util.COMP'], 0.05, 0.015); const r = agree(l, y, [0, 2.5]); return [r > 0.95, `restored data matches the original on ${(100 * r).toFixed(1)} % of samples (ignoring the delay)`]; },
  'Extra/Vol1-Exp20-B-Undersampling': s => { const [a, y] = rd(s, ['master.SINE2', 'channel.BB'], 0.05, 0.02); const [c] = lagCorr(a, y); return [c > 0.98, `recovered 2 kHz message: correlation ${c.toFixed(3)}, ${pp(y).toFixed(2)} Vp-p`]; },
  'Extra/Vol1-Exp20-C-Unsynchronised-Clock': s => { const [a, y] = rd(s, ['master.SINE2', 'channel.BB'], 0.05, 0.3); const env = []; const B = 2400; for (let i = 0; i + B <= y.length; i += B) env.push(pp(y.slice(i, i + B))); return [Math.max(...env) > 2 * Math.min(...env) + 0.05, `recovered amplitude beats between ${Math.min(...env).toFixed(2)} and ${Math.max(...env).toFixed(2)} Vp-p (clock not locked to the carrier)`]; },
  'Term2/Exp11-A-Natural-Sampling': s => { const [o] = rd(s, ['das.OUT']); return [Math.abs(pp(o) - 4) < 0.3, `sampled message ${pp(o).toFixed(2)} Vp-p`]; },
  'Term2/Exp11-A-Sample-and-Hold': s => { const [h] = rd(s, ['das.SH']); let st = 0; for (let i = 1; i < h.length; i++) if (Math.abs(h[i] - h[i - 1]) > 0.02) st++; const r = st / (h.length / FS); return [Math.abs(r - 8333) < 400, `${r.toFixed(0)} steps per second`]; },
  'Term2/Exp11-C-Reconstruction': s => { const [a, r] = rd(s, ['master.SINE2', 'tlpf.OUT']); const [c] = lagCorr(a, r); return [c > 0.99, `reconstructed correlation ${c.toFixed(3)}, ${pp(r).toFixed(2)} Vp-p`]; },
  'Term2/Exp11-D-Aliasing': s => { const [a, r] = rd(s, ['master.SINE2', 'tlpf.OUT']); const [c] = lagCorr(a, r); s.mods.vco.set('FREQ', (3.2e3 - 1e3) / 16e3); const [a2, r2] = rd(s, ['master.SINE2', 'tlpf.OUT'], 0.05, 0.02); const [c2] = lagCorr(a2, r2);
    return [c > 0.98 && c2 < 0.8, `17 kHz sampling: correlation ${c.toFixed(3)}; 3.2 kHz sampling (below 2 x 2.08 kHz): ${c2.toFixed(3)} -> aliasing`]; },
  'Term2/Exp12-A-PCM-0V': s => { const [f, d] = rd(s, ['pcmenc.FS', 'pcmenc.DATA'], 0.02, 0.004); let i = f.length - 1; while (i > 0 && !(f[i] > 2.5 && f[i - 1] < 2.5)) i--; const b = FS / 8333.33; let c = ''; for (let k = 7; k >= 0; k--) c += d[Math.round(i + 0.5 * b - k * b)] > 2.5 ? '1' : '0'; return [c === '10000000', `code ${c}`]; },
  'Term2/Exp12-B-PCM-Variable-DC': s => { const [d] = rd(s, ['pcmenc.DATA']); return [pp(d) > 4, `PCM DATA toggling ${pp(d).toFixed(1)} V`]; },
  'Term2/Exp12-D-PCM-Sinewave': s => { const [c, d] = rd(s, ['vco.DIG', 'pcmenc.DATA']); return [pp(d) > 4 && Math.abs(freq(c) - 60e3) < 2e3, `bit clock ${(freq(c) / 1e3).toFixed(1)} kHz (book: about 50 kHz), DATA toggling`]; },
  'Term2/Exp13-B-PCM-Decoding': s => { const [a, r] = rd(s, ['vco.SINE', 'pcmdec.OUT1'], 0.05, 0.02); const [c] = lagCorr(a, r); return [c > 0.98, `decoded correlation ${c.toFixed(3)}, ${pp(r).toFixed(2)} Vp-p`]; },
  'Term2/Exp13-D-Recovering-Message': s => { const [a, r] = rd(s, ['vco.SINE', 'tlpf.OUT'], 0.05, 0.02); const [c] = lagCorr(a, r); return [c > 0.99, `recovered correlation ${c.toFixed(3)}`]; },
  'Term2/Exp15-A-ASK-Generation': s => { const [x, a] = rd(s, ['seq.X', 'das.OUT'], 0.03, 0.015); let bad = 0; for (let i = 0; i < x.length; i++) if (x[i] < 2.5 && Math.abs(a[i]) > 0.05) bad++; return [bad < x.length * 0.002 && pp(a) > 3.5, `no carrier at logic 0, ${pp(a).toFixed(2)} Vp-p at logic 1`]; },
  'Term2/Exp15-A-ASK-100kHz-Carrier': s => { const [a] = rd(s, ['das.OUT']); return [pp(a) > 1.5, `ASK ${pp(a).toFixed(2)} Vp-p (100 kHz through the switch's 50 kHz analog bandwidth)`]; },
  'Term2/Exp15-B-ASK-Envelope-Detection': s => { const [x, y] = rd(s, ['seq.X', 'tlpf.OUT'], 0.05, 0.015); const [c] = lagCorr(x, y, 800, false); return [c > 0.8, `recovered data correlation ${c.toFixed(3)} (rounded, as Question 4 expects)`]; },
  'Term2/Exp15-C-ASK-Comparator': s => { const [x, y] = rd(s, ['seq.X', 'util.COMP'], 0.05, 0.015); const a = agree(x, y); return [a > 0.97, `restored data matches the original on ${(100 * a).toFixed(1)} % of samples`]; },
  'Term2/Exp16-A-FSK-Generation': s => { const [l, v] = rd(s, ['seq.LINE', 'vco.SINE'], 0.03, 0.015); const f = [[], []]; let last = -1; for (let i = 1; i < v.length; i++) if (v[i - 1] < 0 && v[i] >= 0) { if (last > 0) f[l[i] > 0 ? 1 : 0].push(FS / (i - last)); last = i; } const med = a => a.sort((p, q) => p - q)[a.length >> 1];
    return [med(f[0]) > 1e3 && med(f[1]) > med(f[0]) * 1.5, `logic 0 -> ${(med(f[0]) / 1e3).toFixed(2)} kHz, logic 1 -> ${(med(f[1]) / 1e3).toFixed(2)} kHz (logic 1 = mark = higher)`]; },
  'Term2/Exp16-B-FSK-Filtering': s => { const [l, y] = rd(s, ['seq.LINE', 'tlpf.OUT'], 0.05, 0.015); const [c] = lagCorr(l, y.map(Math.abs), 800, false); return [c < -0.6, `filter output envelope follows the inverted data (logic-0 tone passed): correlation ${c.toFixed(3)}`]; },
  'Term2/Exp16-C-FSK-Envelope-and-Comparator': s => { const [l, y] = rd(s, ['seq.LINE', 'util.COMP'], 0.05, 0.015); const a = agree(l, y, [0, 2.5]); return [a > 0.95, `comparator output = data (inverted, because the filter keeps the logic-0 tone) on ${(100 * a).toFixed(1)} % of samples`]; },
  'Term2/Exp17-A-BPSK-Generation': s => { const [b] = rd(s, ['mult2.KXY']); return [Math.abs(pp(b) - 8) < 0.4, `BPSK ${pp(b).toFixed(2)} Vp-p (±2 V data x 4 Vp-p carrier)`]; },
  'Term2/Exp17-B-BPSK-Product-Detector': s => { const [l, y] = rd(s, ['seq.LINE', 'tlpf.OUT'], 0.05, 0.015); const [c] = lagCorr(l, y, 800, false); return [c > 0.95, `recovered data correlation ${c.toFixed(3)}`]; },
  'Term2/Exp17-C-BPSK-Comparator': s => { const [x, y] = rd(s, ['seq.X', 'util.COMP'], 0.05, 0.015); const a = agree(x, y); return [a > 0.97, `restored data = original on ${(100 * a).toFixed(1)} %`]; },
  'Term2/Exp18-A-QPSK-Serial-to-Parallel': s => { const [a, b] = rd(s, ['s2p.X1', 's2p.X2'], 0.03, 0.015); return [Math.abs(pp(a) - 4) < 0.1 && Math.abs(pp(b) - 4) < 0.1, `X1 ${pp(a).toFixed(2)} Vp-p, X2 ${pp(b).toFixed(2)} Vp-p`]; },
  'Term2/Exp18-A-QPSK-Generation': s => { const [q] = rd(s, ['adder.OUT']); return [pp(q) > 4 && pp(q) < 7, `QPSK ${pp(q).toFixed(2)} Vp-p (each BPSK 4 Vp-p)`]; },
  'Term2/Exp18-B-QPSK-Recover-X1': s => { const [a, b, y] = rd(s, ['s2p.X1', 's2p.X2', 'tlpf.OUT'], 0.05, 0.015); const [c1] = lagCorr(a, y, 800, false), [c2] = lagCorr(b, y, 800, false); return [Math.abs(c1) > 0.9 && Math.abs(c2) < 0.4, `correlation with X1 ${c1.toFixed(3)}, with X2 ${c2.toFixed(3)}`]; },
  'Term2/Exp18-B-QPSK-Recover-X2': s => { const [a, b, y] = rd(s, ['s2p.X1', 's2p.X2', 'tlpf.OUT'], 0.05, 0.015); const [c1] = lagCorr(a, y, 800, false), [c2] = lagCorr(b, y, 800, false); return [Math.abs(c2) > 0.9 && Math.abs(c1) < 0.4, `correlation with X2 ${c2.toFixed(3)}, with X1 ${c1.toFixed(3)}`]; },
  'Term2/Exp18-B-QPSK-Comparator': s => { const [a, y] = rd(s, ['s2p.X1', 'util.COMP'], 0.05, 0.015); const r = agree(a, y, [0, 2.5]); return [r > 0.95, `restored X1 matches on ${(100 * r).toFixed(1)} %`]; },
  'Term2/Exp19-A-DSSS-Generation': s => { const [d] = rd(s, ['mult3.KXY']); return [pp(d) > 3, `DSSS ${pp(d).toFixed(2)} Vp-p`]; },
  'Term2/Exp19-C-DSSS-Demodulation': s => { const [a, y] = rd(s, ['master.SINE2', 'tlpf.OUT'], 0.05, 0.02); const [c] = lagCorr(a, y); return [c > 0.95, `despread message correlation ${c.toFixed(3)}, ${pp(y).toFixed(2)} Vp-p`]; },
  'Term2/Exp19-C-DSSS-Wrong-Code': s => { const [a, y] = rd(s, ['master.SINE2', 'tlpf.OUT'], 0.05, 0.02); const [c] = lagCorr(a, y); return [Math.abs(c) < 0.4, `wrong code: correlation ${c.toFixed(3)} (no message)`]; },
  'Term2/Exp19-D-DSSS-Jamming': s => { const [a, y] = rd(s, ['master.SINE2', 'tlpf.OUT'], 0.05, 0.02); const [c] = lagCorr(a, y); return [c > 0.8, `message survives the jammer: correlation ${c.toFixed(3)}`]; },
  'Term2/Exp19-D-DSSS-Swept-Jamming': s => { const [a, y] = rd(s, ['master.SINE2', 'tlpf.OUT'], 0.05, 0.02); const [c] = lagCorr(a, y); return [c > 0.7, `message survives the swept jammer: correlation ${c.toFixed(3)}`]; },
  'Term2/Exp19-D-DSSS-Noise': s => { const [a, y] = rd(s, ['master.SINE2', 'tlpf.OUT'], 0.05, 0.02); const [c] = lagCorr(a, y); return [c > 0.8, `message with channel noise: correlation ${c.toFixed(3)}`]; },
  'Term2/Exp6-A-PWM-Sawtooth': s => { const [y] = rd(s, ['util.DIODE']); return [Math.abs(freq(y) - 8333) < 100 && pp(y) > 2, `sawtooth ${(freq(y) / 1e3).toFixed(2)} kHz, ${pp(y).toFixed(2)} Vp-p`]; },
  'Term2/Exp6-B-PWM-DC-Input': s => { const [c] = rd(s, ['util.COMP']); const d = c.filter(v => v > 2.5).length / c.length; return [d > 0.2 && d < 0.8, `duty cycle ${(100 * d).toFixed(0)} % with the DC half way between the peaks (RC-decay sawtooth spends less time above its mid voltage)`]; },
  'Term2/Exp6-C-PWM-Sine-Message': s => { const [c] = rd(s, ['util.COMP']); const w = []; let run = 0; for (let i = 1; i < c.length; i++) { if (c[i] > 2.5) run++; else if (run) { w.push(run); run = 0; } } return [pp(w) > 0.3 * Math.max(...w), `pulse width varies ${(Math.min(...w) / FS * 1e6).toFixed(0)}-${(Math.max(...w) / FS * 1e6).toFixed(0)} us with the message`]; },
  'Term2/Exp6-D-PWM-Demodulation': s => { const [a, y] = rd(s, ['master.SINE2', 'tlpf.OUT'], 0.05, 0.02); const [c] = lagCorr(a, y); return [Math.abs(c) > 0.95, `recovered message correlation ${c.toFixed(3)} (${c < 0 ? 'inverted: sawtooth on IN, message on REF' : 'in phase'})`]; },
  'Term2/Exp6-E-PWM-Nyquist': s => { const [a, y] = rd(s, ['vco.SINE', 'tlpf.OUT'], 0.05, 0.02); return [pp(y) < pp(a), `17 kHz message (> 8.33/2 kHz): output ${pp(y).toFixed(2)} Vp-p is not the message`]; },
  'Term2/Exp8-A-PLL-AM-Signal': s => { const [t, m] = rd(s, ['tlpf.OUT', 'mult3.KXY']); return [Math.abs(pp(t) - 4) < 0.15 && Math.abs(freq(t) - 8333) < 50, `8.33 kHz sine ${pp(t).toFixed(2)} Vp-p with ${avg(t).toFixed(2)} V DC (book: 4 Vp-p, "2 V DC")`]; },
  'Term2/Exp8-B-PLL-Lock': s => { s.mods.vco.set('FREQ', 0.5 + 400 / 80e3); const [c, v] = rd(s, ['master.SINE100', 'vco.SINE'], 0.08, 0.01); return [Math.abs(freq(v) - 100e3) < 20, `VCO started 400 Hz off; it pulls in to ${(freq(v) / 1e3).toFixed(3)} kHz (carrier 100.000 kHz) -> locked`]; },
  'Term2/Exp9-A-Noisy-Data': s => { const [y] = rd(s, ['adder2.OUT']); return [pp(y) > 2.5, `noisy data ${pp(y).toFixed(2)} Vp-p`]; },
  'Term2/Exp9-B-Band-Limited': s => { const [y, b] = rd(s, ['adder2.OUT', 'channel.BB']); const hf = a => { let e = 0; for (let i = 1; i < a.length; i++) e += (a[i] - a[i - 1]) ** 2; return e; }; return [hf(b) < 0.01 * hf(y), `BASEBAND LPF removes the wideband noise (sample-to-sample energy ${(hf(b) / hf(y) * 100).toFixed(2)} % of the input)`]; },
  'Term2/Exp16v2-A-Delta-Modulator': s => { const [b, r] = rd(s, ['buffer.OUT', 'util.RC'], 0.05, 0.02); const [c] = lagCorr(b, r, 400); return [c > 0.9, `integrator tracks the inverted message: correlation ${c.toFixed(3)}, ${pp(r).toFixed(2)} Vp-p`]; },
  'Term2/Exp16v2-B-Delta-Signal': s => { const [x] = rd(s, ['s2p.X1']); let t = 0; for (let i = 1; i < x.length; i++) if (x[i] !== x[i - 1]) t++; return [t > 50, `X1 delta signal, ${(t / (x.length / FS) / 1e3).toFixed(1)} k transitions per second`]; },
  'Term2/Exp16v2-C-Delta-Demodulation': s => { const [a, y] = rd(s, ['master.SINE2', 'tlpf.OUT'], 0.05, 0.02); const [c] = lagCorr(a, y); return [Math.abs(c) > 0.9, `recovered message correlation ${c.toFixed(3)}`]; },
  'Term2/Exp16v2-D-Delta-SNDR': s => { const [t, e] = rd(s, ['tlpf.OUT', 'adder2.OUT'], 0.05, 0.02); return [pp(e) < 0.6 * pp(t), `after cancelling, ${pp(e).toFixed(2)} Vp-p left of a ${pp(t).toFixed(2)} Vp-p message (SNDR about ${(20 * Math.log10(pp(t) / pp(e))).toFixed(1)} dB)`]; },
  'Term2/Exp17v2-A-Delta-Sigma-Modulator': s => { const [b, r] = rd(s, ['buffer.OUT', 'util.RC'], 0.05, 0.02); return [pp(r) < pp(b), `RC LPF output ${pp(r).toFixed(2)} Vp-p (small error signal), message ${pp(b).toFixed(2)} Vp-p`]; },
  'Term2/Exp17v2-A-Delta-Sigma-Signal': s => { const [m, x] = rd(s, ['master.SINE2', 's2p.X1'], 0.05, 0.02); const [c] = lagCorr(m, x, 400, false); return [Math.abs(c) > 0.5, `pulse density follows the message: correlation ${c.toFixed(3)}`]; },
  'Term2/Exp17v2-B-Delta-Sigma-Demodulation': s => { const [a, y] = rd(s, ['master.SINE2', 'tlpf.OUT'], 0.05, 0.02); const [c] = lagCorr(a, y); return [Math.abs(c) > 0.95, `recovered message correlation ${c.toFixed(3)}, ${pp(y).toFixed(2)} Vp-p`]; },
};
for (const [name, st] of Object.entries(SETUPS)) {
  const [s, bad] = load(st);
  if (bad.length) { ok(name, false, 'unknown sockets/modules: ' + bad.join(', ')); continue; }
  const f = CHECKS[name]; if (!f) { ok(name, false, 'no check written'); continue; }
  try { const [c, t] = f(s); ok(name, c, t); } catch (e) { ok(name, false, 'error ' + e.message); }
}
console.log(fails ? `${fails} FAILED` : 'all setups pass');
