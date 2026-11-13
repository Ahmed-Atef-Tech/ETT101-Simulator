// Every ready-made setup opens with both traces on the scope screen (CH1/CH2 at their V/div and POSITION). TINY = under 0.8 div, reported only.
import { Sim } from '../src/engine/sim.js';
import { FS } from '../src/engine/dsp.js';
import fs from 'fs'; import path from 'path';
const VDIV = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20];
const TDIV = [2e-9, 5e-9, 10e-9, 20e-9, 50e-9, 100e-9, 200e-9, 0.5e-6, 1e-6, 2e-6, 5e-6, 10e-6, 20e-6, 50e-6, 100e-6, 200e-6, 500e-6, 1e-3, 2e-3, 5e-3, 10e-3, 20e-3, 50e-3];
const R = new URL('../setups', import.meta.url).pathname; let off = 0;
for (const d of (process.argv.length > 2 ? process.argv.slice(2) : ['Term1', 'Term2', 'Extra'])) for (const f of fs.readdirSync(path.join(R, d)).sort()) {
  const st = JSON.parse(fs.readFileSync(path.join(R, d, f))); const s = new Sim();
  for (const l of st.leads) s.addLead(l.a, l.b, l.color); for (const m in st.mods) for (const p in st.mods[m]) s.mods[m].set(p, st.mods[m][p]);
  const ks = ['CH1', 'CH2']; ks.forEach(k => s.setProbe(k, st.probes[k] || null)); s.run(Math.round(FS * 0.6));
  const win = Math.max(TDIV[st.scope.td + (st.scope.tdVer ? 0 : 7)] * 12 * 4, 0.02), N = Math.round(FS * win); const out = [];
  for (const k of ks) { const c = st.scope.ch[k]; if (!st.probes[k] || !c.on) continue;
    const y = s.read(k, s.t, N, new Float64Array(N)); let mn = Infinity, mx = -Infinity, sum = 0; for (const v of y) { mn = Math.min(mn, v); mx = Math.max(mx, v); sum += v; }
    if (c.cpl === 'AC') { const m = sum / N; mn -= m; mx -= m; }
    const vd = VDIV[c.vd] * (c.probe === 1 ? 10 : 1), top = (4 - c.pos) * vd, bot = (-4 - c.pos) * vd;
    const pp = mx - mn, span = pp / vd;
    const flag = (mx > top + 0.02 * vd || mn < bot - 0.02 * vd) ? 'OFF-SCREEN' : span < 0.8 && pp > 0.05 ? 'TINY' : '';
    out.push(`${k} ${mn.toFixed(2)}..${mx.toFixed(2)} V (${span.toFixed(1)} div, screen ${bot.toFixed(1)}..${top.toFixed(1)}) ${flag}`); }
  const bad = out.some(o => /OFF/.test(o)); if (bad) off++;
  console.log((bad ? '!! ' : '   ') + f.replace('.ett.json', '').padEnd(42), out.join(' | '));
}
console.log(off ? off + ' setups run off the screen' : 'every trace is on the screen'); process.exit(off ? 1 : 0);
