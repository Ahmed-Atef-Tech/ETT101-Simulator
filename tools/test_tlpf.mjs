import { Sim } from '../src/engine/sim.js';
import { FS } from '../src/engine/dsp.js';
const s = new Sim(); s.addLead('vco.SINE','tlpf.IN','r'); s.setProbe('CH1','tlpf.OUT'); s.mods.tlpf.set('GAIN', 0.5);
const fc = 2000; s.mods.tlpf.set('FC', Math.log(fc/600)/Math.log(20));
for (const r of [0.5, 0.9, 1.0, 1.2, 1.4, 3]) {
  const f = fc*r; s.mods.vco.set('FREQ', Math.log(f/1000)/Math.log(17)); s.mods.vco.set('GAIN', 0); s.run(FS*0.05);
  const b = s.read('CH1', s.t, 48000, new Float64Array(48000)); const pp = Math.max(...b)-Math.min(...b);
  console.log(`f=${(s.mods.vco.f0()).toFixed(0)}Hz (${r}fc): ${(20*Math.log10(pp/4)).toFixed(2)} dB`);
}
