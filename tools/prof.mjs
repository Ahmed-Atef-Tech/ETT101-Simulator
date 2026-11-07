import { Sim } from '../src/engine/sim.js';
import { FS } from '../src/engine/dsp.js';
const s=new Sim(); const L=(a,b)=>s.addLead(a,b,'r');
L('master.SINE2','phase.IN'); L('phase.OUT','mult1.XDC'); L('master.COS100','mult1.YDC'); L('master.SINE2','mult2.XDC'); L('master.SINE100','mult2.YDC');
L('mult2.KXY','adder.A'); L('mult1.KXY','adder.B'); L('adder.OUT','mult3.XDC'); L('master.SINE100','mult3.YDC'); L('mult3.KXY','tlpf.IN');
L('noise.N20','adder2.NOISE'); L('adder2.OUT','channel.BB_IN');
s.setProbe('CH1','adder.OUT'); s.setProbe('CH2','tlpf.OUT'); s.setProbe('EXT','channel.BB');
s.run(FS*0.2);
const T={}; for (const m of s.order) { const f=m.process.bind(m); m.process=n=>{const t=performance.now(); f(n); T[m.id]=(T[m.id]||0)+performance.now()-t;}; }
const t0=performance.now(); s.run(FS*1); const tot=performance.now()-t0;
console.log('1 s of sim:', tot.toFixed(0),'ms'); console.log(Object.entries(T).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+':'+v.toFixed(0)).join('  '));
