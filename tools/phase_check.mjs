import fs from 'fs';
import { Sim } from '../src/engine/sim.js';
import { FS } from '../src/engine/dsp.js';
for (const n of ['Exp1-AM-Modulation', 'Exp3-AM-Demodulation']) {
  const st = JSON.parse(fs.readFileSync(`setups/${n}.ett.json`)); const s = new Sim();
  for (const l of st.leads) s.addLead(l.a, l.b, l.color); for (const id in st.mods) for (const p in st.mods[id]) s.mods[id].set(p, st.mods[id][p]);
  s.setProbe('CH1', 'master.SINE2'); s.setProbe('CH2', n.startsWith('Exp1') ? 'mult1.KXY' : 'util.RC'); s.setProbe('EXT', 'adder.OUT'); s.run(FS * 0.06);
  const N = 2304 * 4, m = s.read('CH1', s.t, N, new Float64Array(N)), y = s.read('CH2', s.t, N, new Float64Array(N)), ad = s.read('EXT', s.t, N, new Float64Array(N));
  let env = y; if (n.startsWith('Exp1')) { env = new Float64Array(N); for (let i = 0; i < N; i++) { let mx = 0; for (let j = Math.max(0, i - 24); j < Math.min(N, i + 24); j++) mx = Math.max(mx, Math.abs(y[j])); env[i] = mx; } }
  const mean = a => a.reduce((x, v) => x + v, 0) / a.length; const mm = mean(m), me = mean(env); let c = 0, a2 = 0, b2 = 0;
  for (let i = 0; i < N; i++) { c += (m[i] - mm) * (env[i] - me); a2 += (m[i] - mm) ** 2; b2 += (env[i] - me) ** 2; }
  const P = Math.max(...env), Q = Math.min(...env);
  console.log(n, 'adder DC', mean(ad).toFixed(2), 'V | correlation envelope vs message', (c / Math.sqrt(a2 * b2)).toFixed(3), n.startsWith('Exp1') ? `| m = ${((P - Q) / (P + Q)).toFixed(3)}` : '');
}
