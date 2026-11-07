import { Sim } from '../src/engine/sim.js';
import { FS } from '../src/engine/dsp.js';
const s = new Sim();
const stats = (ch, n) => { const b = s.read(ch, s.t, n, new Float64Array(n)); let mx=-1e9,mn=1e9,sum=0; for (const v of b){mx=Math.max(mx,v);mn=Math.min(mn,v);sum+=v;} return {max:+mx.toFixed(3),min:+mn.toFixed(3),avg:+(sum/n).toFixed(3)}; };
// ---- AM: (DC + message) x carrier
s.addLead('master.SINE2','adder.A','y'); s.addLead('vdc.VDC','adder.B','y');
s.mods.vdc.set('VDC', 0.5 + 1/5);   // +1.0 V
s.mods.adder.set('G', 0.25); s.mods.adder.set('g', 0.5);  // G=0.5 -> 2Vpp*0.5=1Vpp ; g=1
s.addLead('adder.OUT','mult1.XDC','r'); s.addLead('master.SINE100','mult1.YDC','r');
s.setProbe('CH1','adder.OUT'); s.setProbe('CH2','mult1.KXY');
let t0=performance.now(); s.run(FS*0.2); let t1=performance.now();
console.log('order', s.order.map(m=>m.id).join(','), ' 0.2s sim in', (t1-t0).toFixed(0),'ms');
console.log('adder out', stats('CH1', 4800), ' AM', stats('CH2', 4800));
// envelope max/min -> m
{ const n=4800, b=s.read('CH2', s.t, n, new Float64Array(n)); const env=[]; for(let i=0;i<n;i+=48){let m=0;for(let j=0;j<48;j++)m=Math.max(m,b[i+j]);env.push(m);} const P=Math.max(...env),Q=Math.min(...env); console.log('Pmax',P.toFixed(3),'Pmin',Q.toFixed(3),'m=',((P-Q)/(P+Q)).toFixed(3)); }
// ---- AM demod via rectifier + RC LPF
s.addLead('mult1.KXY','util.RECT_IN','b'); s.addLead('util.RECT','util.RC_IN','b'); s.setProbe('CH1','util.RC'); s.run(FS*0.05);
console.log('demod out', stats('CH1', 9600));
// ---- FM: VCO LO with VDC, measure frequency
const s2=new Sim(); s2.addLead('vdc.VDC','vco.IN','y'); s2.setProbe('CH1','vco.SINE');
const f=(ch,sim)=>{const n=96000,b=sim.read(ch,sim.t,n,new Float64Array(n));let c=0;for(let i=1;i<n;i++) if(b[i-1]<0&&b[i]>=0)c++;return c/(n/FS);};
for (const v of [0, 2, -2]) { s2.mods.vdc.set('VDC', 0.5+v/5); s2.run(FS*0.03); console.log('VCO Vin',v,'f=',f('CH1',s2).toFixed(0)); }
// ---- tuneable LPF
const s3=new Sim(); s3.addLead('master.DIG2','tlpf.IN','y'); s3.setProbe('CH1','tlpf.OUT'); s3.mods.tlpf.set('FC', Math.log(3000/600)/Math.log(20)); s3.run(FS*0.05);
const b3=s3.read('CH1',s3.t,9600,new Float64Array(9600)); console.log('tlpf (2kHz square, fc=3k) -> max', Math.max(...b3).toFixed(3), ' fc=', s3.mods.tlpf.fc().toFixed(0));
