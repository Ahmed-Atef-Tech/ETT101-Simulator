// Checks each setup against what the lab book says the student should see.
import { Sim } from '../src/engine/sim.js';
import { FS } from '../src/engine/dsp.js';
import { SETUPS } from './make_setups.mjs';
const load = st => { const s = new Sim(); for (const l of st.leads) s.addLead(l.a, l.b, l.color); for (const id in st.mods) for (const p in st.mods[id]) s.mods[id].set(p, st.mods[id][p]); return s; };
const N = 2304 * 8;
// capture two sockets at the same instant (CH1 and CH2 rings), like the scope does
const rd2 = (s, a, b) => { s.setProbe('CH1', a); s.setProbe('CH2', b); s.run(FS * 0.08); return [s.read('CH1', s.t, N, new Float64Array(N)), s.read('CH2', s.t, N, new Float64Array(N))]; };
const rd = (s, sock) => rd2(s, sock, sock)[0];
const pp = a => Math.max(...a) - Math.min(...a), avg = a => a.reduce((x, v) => x + v, 0) / a.length;
const env = a => { const e = new Float64Array(a.length); for (let i = 0; i < a.length; i++) { let m = -1e9; for (let j = Math.max(0, i - 24); j < Math.min(a.length, i + 24); j++) m = Math.max(m, a[j]); e[i] = m; } return e; };
const corr = (a, b) => { const ma = avg(a), mb = avg(b); let c = 0, p = 0, q = 0; for (let i = 0; i < a.length; i++) { c += (a[i] - ma) * (b[i] - mb); p += (a[i] - ma) ** 2; q += (b[i] - mb) ** 2; } return c / Math.sqrt(p * q); };
const ok = (c, txt) => console.log(`  ${c ? 'PASS' : 'FAIL'}  ${txt}`);
{ const s = load(SETUPS['Term1/Exp1-AM-Modulation']); console.log('Exp 1 AM');
  const [msg, am] = rd2(s, 'adder.OUT', 'mult2.KXY'), e = env(am), ein = e.slice(48, -48), P = 2 * Math.max(...ein), Q = 2 * Math.min(...ein);
  ok(Math.abs(avg(msg) - 1) < 0.02, `ADDER output DC = ${avg(msg).toFixed(3)} V (book step 9: 1 V)`);
  ok(Math.abs(pp(msg) - 1) < 0.03, `ADDER output AC = ${pp(msg).toFixed(3)} Vp-p (book step 10: 1 Vp-p)`);
  ok(corr(msg, e) > 0.98, `upper envelope follows the CH1 message: correlation ${corr(msg, e).toFixed(3)} (book Figure 2)`);
  ok(Math.abs((P - Q) / (P + Q) - 0.5) < 0.02, `P = ${P.toFixed(2)} Vp-p, Q = ${Q.toFixed(2)} Vp-p, m = ${((P - Q) / (P + Q)).toFixed(3)} (book: AM = (1 VDC + 1 Vp-p) x 4 Vp-p, m = 0.5)`);
  s.mods.adder.set('G', 1); const e2 = env(rd(s, 'mult2.KXY')); ok(Math.min(...e2) < 0.05, `G fully clockwise -> envelope reaches zero (over-modulation), min ${Math.min(...e2).toFixed(3)} V`); }
{ const s = load(SETUPS['Term1/Exp2-DSBSC-Modulation']); console.log('Exp 2 DSBSC');
  const [m, d] = rd2(s, 'master.SINE2', 'mult1.KXY'), e = env(d);
  ok(Math.abs(pp(d) - 8) < 0.2, `DSBSC = ${pp(d).toFixed(2)} Vp-p (k = 1: 4 Vp-p x 4 Vp-p -> 8 Vp-p, fits 2 V/div of book step 6)`);
  ok(corr(m.map(Math.abs), e) > 0.95, `envelope = |message| (phase reversal at zero crossings): correlation ${corr(m.map(Math.abs), e).toFixed(3)}`);
  s.addLead('master.SINE2', 'buffer.IN', 'r'); s.removeLead(s.leads.find(l => l.b === 'mult1.YAC').id); s.addLead('buffer.OUT', 'mult1.YAC', 'r');
  s.mods.buffer.set('GAIN', 0.25); const q = rd(s, 'mult1.KXY'); s.mods.buffer.set('GAIN', 0.5); const h = rd(s, 'mult1.KXY'); s.mods.buffer.set('GAIN', 0.6); const h2 = rd(s, 'mult1.KXY');
  const clipped = a => a.filter(v => Math.abs(v) > 10.9).length / a.length;
  ok(clipped(q) === 0, `Part C, BUFFER 1/4 travel: ${pp(q).toFixed(2)} Vp-p, not overloaded (book step 16)`);
  ok(clipped(h2) > 0.01, `Part C, BUFFER just past 1/2 travel: ${pp(h2).toFixed(2)} Vp-p, ${(100 * clipped(h2)).toFixed(1)} % clipped -> overload (book step 17; at exactly 1/2: ${(100 * clipped(h)).toFixed(1)} %)`); }
{ const s = load(SETUPS['Term1/Exp3-AM-Demodulation']); console.log('Exp 3 AM demodulation');
  const [msg, out] = rd2(s, 'adder.OUT', 'util.RC');
  let best = -1, lag = 0; for (let k = 0; k < 300; k += 4) { const c = corr(msg.slice(0, N - 300), out.slice(k, N - 300 + k)); if (c > best) { best = c; lag = k; } }
  ok(best > 0.98, `recovered message has the shape of the CH1 message: correlation ${best.toFixed(3)}, delay ${(lag / FS * 1e6).toFixed(0)} us`);
  ok(pp(out) > 0.2, `recovered message ${pp(out).toFixed(3)} Vp-p with ${avg(out).toFixed(3)} V DC`); }
