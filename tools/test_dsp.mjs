import { lowpassFromProto, ELLIP_PROTO, ELLIP_DC, sosResponse, SOS, FS, AllPass1 } from '../src/engine/dsp.js';
for (const fc of [600, 2000, 12000]) {
  const s = lowpassFromProto(ELLIP_PROTO, fc, FS, ELLIP_DC);
  const db = f => (20*Math.log10(Math.hypot(...sosResponse(s, f)))).toFixed(2);
  console.log('fc', fc, 'DC', db(1), '0.5fc', db(fc*0.5), 'fc', db(fc), '1.4fc', db(fc*1.4), '5fc', db(fc*5));
  // time-domain stability check: step response settles to DC gain
  const f = new SOS(s); const x = new Float64Array(2_000_000).fill(1); f.run(x, x, x.length); console.log('  step end', x[x.length-1].toFixed(5));
}
const ap = new AllPass1(); const f0=2083.33; const phi=90; const tau=Math.tan(phi/4*Math.PI/180)/(2*Math.PI*f0);
ap.setTau(tau); const ap2=new AllPass1(); ap2.setTau(tau);
const n=48000*2; const x=new Float64Array(n), y=new Float64Array(n); for(let i=0;i<n;i++) x[i]=Math.sin(2*Math.PI*f0*i/FS);
ap.run(x,y,n); ap2.run(y,y,n);
// estimate phase via correlation over last part
let sc=0,ss=0; for(let i=n/2;i<n;i++){ sc+=y[i]*Math.cos(2*Math.PI*f0*i/FS); ss+=y[i]*Math.sin(2*Math.PI*f0*i/FS);} 
console.log('allpass x2 phase', (Math.atan2(sc,ss)*180/Math.PI).toFixed(2), 'amp', (2*Math.hypot(sc,ss)/(n/2)).toFixed(4));
