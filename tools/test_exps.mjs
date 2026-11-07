import { Sim } from '../src/engine/sim.js';
import { FS } from '../src/engine/dsp.js';
const rd = (s, ch, n) => s.read(ch, s.t, n, new Float64Array(n));
const st = b => { let mx=-1e9,mn=1e9,sum=0; for(const v of b){mx=Math.max(mx,v);mn=Math.min(mn,v);sum+=v;} return {pp:+(mx-mn).toFixed(3), avg:+(sum/b.length).toFixed(3)}; };
const freq = b => { const m=(Math.max(...b)+Math.min(...b))/2; let c=0,f=-1,l=-1; for(let i=1;i<b.length;i++) if(b[i-1]<m&&b[i]>=m){ if(f<0)f=i; else {c++;l=i;} } return c/((l-f)/FS); };
const env = (b,per) => { const e=[]; for(let i=0;i+per<=b.length;i+=per){let m=-1e9;for(let j=0;j<per;j++)m=Math.max(m,b[i+j]);e.push(m);} return e; };
// ---- SSB
{ const s=new Sim(); const L=(a,b)=>s.addLead(a,b,'r');
  L('master.SINE2','phase.IN'); L('phase.OUT','mult1.XDC'); L('master.COS100','mult1.YDC'); L('master.SINE2','mult2.XDC'); L('master.SINE100','mult2.YDC');
  L('mult2.KXY','adder.A'); L('mult1.KXY','adder.B'); s.mods.adder.set('G',0.5); s.mods.adder.set('g',0.5); s.mods.phase.set('PHASE',0.5);
  s.setProbe('CH1','adder.OUT'); s.run(FS*0.05);
  const b=rd(s,'CH1',48000); const e=env(b,96); console.log('SSB: pp',st(b).pp,'env ripple',(Math.max(...e)-Math.min(...e)).toFixed(3),'freq',freq(b).toFixed(0), 'LO led', s.mods.phase.led);
  s.mods.phase.set('PHASE',0.3); s.run(FS*0.02); const e2=env(rd(s,'CH1',48000),96); console.log('SSB phase off 90: ripple',(Math.max(...e2)-Math.min(...e2)).toFixed(3));
  // demod
  L('adder.OUT','mult3.XDC'); L('master.SINE100','mult3.YDC'); L('mult3.KXY','tlpf.IN'); s.mods.tlpf.set('FC', 0.6); s.mods.phase.set('PHASE',0.5); s.setProbe('CH2','tlpf.OUT'); s.run(FS*0.05);
  const d=rd(s,'CH2',48000); console.log('SSB demod: pp', st(d).pp, 'f', freq(d).toFixed(0), 'fc', s.mods.tlpf.fc().toFixed(0));
}
// ---- DSBSC + product detector + unsynchronised VCO carrier
{ const s=new Sim(); const L=(a,b)=>s.addLead(a,b,'r');
  L('master.SINE2','mult1.XDC'); L('master.SINE100','mult1.YDC'); L('mult1.KXY','mult2.XDC'); L('master.SINE100','mult2.YDC'); L('mult2.KXY','tlpf.IN'); s.mods.tlpf.set('FC',0.6);
  s.setProbe('CH1','tlpf.OUT'); s.run(FS*0.05); const b=rd(s,'CH1',48000); console.log('DSBSC demod: pp',st(b).pp,'avg',st(b).avg,'f',freq(b).toFixed(0));
  // noisy channel
  s.removeLead(s.leads.find(l=>l.a==='mult1.KXY').id); L('mult1.KXY','adder2.SIGNAL'); L('noise.N20','adder2.NOISE'); L('adder2.OUT','mult2.XDC'); s.run(FS*0.05);
  const n=rd(s,'CH1',48000); console.log('  with -20dB noise: pp', st(n).pp);
  s.setProbe('CH2','noise.N20'); s.run(FS*0.05); const nn=rd(s,'CH2',480000); let r=0; for(const v of nn) r+=v*v; console.log('  noise -20dB rms', Math.sqrt(r/nn.length).toFixed(3));
}
// ---- FM demod via comparator + twin pulse + baseband LPF
{ const s=new Sim(); const L=(a,b)=>s.addLead(a,b,'r');
  L('vdc.VDC','vco.IN'); L('vco.SINE','util.CIN'); L('vdc.GND','util.REF'); L('util.COMP','tpg.CLK'); L('tpg.Q1','channel.BB_IN');
  const v = s.mods.vco; v.set('FREQ', Math.log(10)/Math.log(17)); v.set('GAIN', 0.5); s.mods.tpg.set('WIDTH', (12-5)/35);
  s.setProbe('CH1','vco.SINE'); s.setProbe('CH2','channel.BB');
  for (const vin of [0, 2, -2]) { s.mods.vdc.set('VDC', 0.5+vin/5); s.run(FS*0.06); console.log('FM ZCD Vin',vin,'VCO f',freq(rd(s,'CH1',96000)).toFixed(0),'BB LPF DC', st(rd(s,'CH2',24000)).avg); }
  s.removeLead(s.leads[0].id); L('master.SINE2','vco.IN'); s.run(FS*0.08); const b=rd(s,'CH2',48000); console.log('FM demod 2kHz msg: pp',st(b).pp,'f',freq(b).toFixed(0));
}
// ---- Envelope detector (diode & RC)
{ const s=new Sim(); const L=(a,b)=>s.addLead(a,b,'r');
  L('master.SINE2','adder.A'); L('vdc.VDC','adder.B'); L('adder.OUT','mult1.XDC'); L('master.SINE100','mult1.YDC'); s.mods.vdc.set('VDC',0.3); s.mods.adder.set('g',0.5); s.mods.adder.set('G',0.125);
  L('mult1.KXY','util.DIODE_IN'); s.setProbe('CH1','util.DIODE'); s.run(FS*0.05); const b=rd(s,'CH1',48000); console.log('Diode&RC demod: pp',st(b).pp,'avg',st(b).avg,'f',freq(b).toFixed(0));
}
