// OPEN SETUP files for every experiment in the two lab books, wired exactly as the book's figures.
// Knob positions: the book's own words ("middle" = 0.5, "fully clockwise" = 1, "a quarter" = 0.25, "2 o'clock" = 0.7,
// "3 o'clock" = 0.8 on a 300-degree pot). Where a step says "adjust X until ...", the generator does that adjustment on the
// simulator itself (the same thing the student does), so the file opens at the result the step asks for.
import fs from 'fs';
import { Sim } from '../src/engine/sim.js';
import { FS } from '../src/engine/dsp.js';
import { TLPF_MIN, TLPF_MAX } from '../src/engine/modules.js';

const fcK = f => (f - TLPF_MIN) / (TLPF_MAX - TLPF_MIN);
const V = { 0.1: 6, 0.2: 7, 0.5: 8, 1: 9, 2: 10, 5: 11 };
const VD = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20]; // scope V/div list (src/ui/scope.js VDIV)               // V/div -> scope index (list starts at 1 mV/div)
const T = { '2u': 2, '5u': 3, '10u': 4, '20u': 5, '50u': 6, '100u': 7, '200u': 8, '500u': 9, '1m': 10, '2m': 11, '5m': 12, '10m': 13, '20m': 14, '50m': 15 };
const ch = o => ({ on: true, vd: 9, fine: 1, pos: 0, cpl: 'DC', bw: false, finemode: false, probe: 0, inv: false, ...o });
const scope = (c1, c2, td, extra = {}) => ({ ch: { CH1: ch(c1), CH2: ch(c2) }, sel: 'CH1', td: (() => { if (!(td in T)) throw new Error('unknown Time/div ' + td); return T[td]; })(), hpos: 0, zoom: false, ztd: 4, zpos: 0,
  trig: { src: 'CH1', slope: 'R', mode: 'AUTO', cpl: 'DC', level: 0 }, run: true, acq: 'Sample', avgN: 16,
  disp: { type: 'Vectors', persist: 0, fmt: 'YT', grid: 'Dots' }, math: { on: false, kind: 'FFT', op: '+', fftSrc: 'CH1', win: 'Hanning', dbdiv: 20, fpos: 0, unit: 'dBVrms', vrd: 7 },
  meas: { src: 'CH2', items: ['Vpp', 'Freq', null], all: false }, cur: { type: 'Off', src: 'CH1', act: 'A', a: -3, b: 3 }, menu: null, ...extra });
const TRIG = (src, level = 0, slope = 'R') => ({ trig: { src, slope, mode: 'AUTO', cpl: 'DC', level } });
const EXT = TRIG('EXT', 2.5);
const COLORS = ['yellow', 'red', 'blue', 'green', 'black'];
const L = list => list.map(([a, b], i) => ({ a, b, color: COLORS[i % COLORS.length] }));
const clone = o => JSON.parse(JSON.stringify(o));

// ---- simulator helpers used for the "adjust until" steps ----
function build(st) {
  const s = new Sim(); for (const l of st.leads) s.addLead(l.a, l.b, l.color);
  for (const m in st.mods) for (const p in st.mods[m]) s.mods[m].set(p, st.mods[m][p]);
  return s;
}
function grab(s, a, b, t = 0.04, M = 2304 * 8) {
  s.setProbe('CH1', a); s.setProbe('CH2', b || a); s.run(FS * t);
  return [s.read('CH1', s.t, M, new Float64Array(M)), s.read('CH2', s.t, M, new Float64Array(M))];
}
const pp = a => Math.max(...a) - Math.min(...a);
const avg = a => a.reduce((x, v) => x + v, 0) / a.length;
const corr = (a, b) => { const ma = avg(a), mb = avg(b); let c = 0, p = 0, q = 0; for (let i = 0; i < a.length; i++) { c += (a[i] - ma) * (b[i] - mb); p += (a[i] - ma) ** 2; q += (b[i] - mb) ** 2; } return c / Math.sqrt(p * q); };
// bisection on a monotonic knob: find k in [lo, hi] where f(k) crosses target
function solve(f, target, lo = 0, hi = 1, it = 16) { const up = f(hi) > f(lo); for (let i = 0; i < it; i++) { const m = (lo + hi) / 2; if ((f(m) < target) === up) lo = m; else hi = m; } return +((lo + hi) / 2).toFixed(4); }
const setKnob = (st, mod, p, v) => { st.mods[mod] = { ...(st.mods[mod] || {}), [p]: v }; return st; };

const SETUPS = {};
const add = (folder, name, st) => { SETUPS[`${folder}/${name}`] = st; return st; };
const S = (title, leads, probes, mods, sc, extra = {}) => ({ title, leads: L(leads), probes: { CH1: null, CH2: null, EXT: null, ...probes }, mods, scope: sc, ...extra });
const derive = (base, title, { add: plus = [], remove = [], probes = {}, mods = {}, scope: sc } = {}) => {
  const st = clone(base); st.title = title;
  st.leads = st.leads.filter(l => !remove.some(([a, b]) => l.a === a && (b === undefined || l.b === b)));
  st.leads.push(...L(plus).map((l, i) => ({ ...l, color: COLORS[(st.leads.length + i) % COLORS.length] })));
  st.probes = { ...st.probes, ...probes };
  for (const m in mods) st.mods[m] = { ...(st.mods[m] || {}), ...mods[m] };
  if (sc) st.scope = sc;
  return st;
};

// =====================================================================================================
// TERM 1 (Electrical Testing 4 = Emona Lab Manual Vol.1, Exp. 4-10)
// =====================================================================================================
const T1 = 'Term1';
{ // Exp 1 / 3: VDC "almost fully anti-clockwise" -> knob 0.03 = -2.35 V; g turned until the ADDER output is +1 V DC;
  // G turned for a 1 Vp-p message.
  const VDC_KNOB = 0.03, VDC = -2.5 + 5 * VDC_KNOB, g = 1 / -VDC;
  const amMods = { vdc: { VDC: VDC_KNOB }, adder: { G: 0.125, g: g / 2 } };
  const amLeads = [['vdc.VDC', 'adder.B'], ['master.SINE2', 'adder.A'], ['adder.OUT', 'mult2.XDC'], ['master.SINE100', 'mult2.YDC']];
  const am = add(T1, 'Exp1-AM-Modulation', S('Term 1 Exp 1 AM: ADDER out = 1 V DC + 1 Vp-p message (CH1), AM signal (CH2)', amLeads,
    { CH1: 'adder.OUT', CH2: 'mult2.KXY' }, amMods, scope({ vd: V[0.5], pos: 1.2 }, { vd: V[1], pos: -1.4 }, '100u', TRIG('CH1', 1))));
  add(T1, 'Exp2-DSBSC-Modulation', S('Term 1 Exp 2 DSBSC: 4 Vp-p 2 kHz x 4 Vp-p 100 kHz', [['master.SINE100', 'mult1.XAC'], ['master.SINE2', 'mult1.YAC']],
    { CH1: 'master.SINE2', CH2: 'mult1.KXY' }, {}, scope({ vd: V[1], pos: 2 }, { vd: V[2], pos: -1.5 }, '100u')));
  add(T1, 'Exp3-AM-Demodulation', derive(am, 'Term 1 Exp 3 AM demodulation: envelope detector (RECTIFIER then RC LPF)',
    { add: [['mult2.KXY', 'util.RECT_IN'], ['util.RECT', 'util.RC_IN']], probes: { CH2: 'util.RC' }, scope: scope({ vd: V[0.5], pos: 1 }, { vd: V[0.5], pos: -3 }, '100u', TRIG('CH1', 1)) }));
}
{ // Exp 4 DSBSC demodulation (Figure 4: product detector), Part C (Figure 7: BUFFER at 1/4), steps 33-38 (Figure 12: VCO carrier)
  const d = add(T1, 'Exp4-DSBSC-Demodulation', S('Term 1 Exp 4 Part B: product detector recovers the 2 kHz message (TUNEABLE LPF gain middle, fc fully clockwise)',
    [['master.SINE100', 'mult1.XAC'], ['master.SINE2', 'mult1.YAC'], ['mult1.KXY', 'mult2.XDC'], ['master.SINE100', 'mult2.YDC'], ['mult2.KXY', 'tlpf.IN']],
    { CH1: 'master.SINE2', CH2: 'tlpf.OUT' }, { tlpf: { GAIN: 0.5, FC: 1 } }, scope({ vd: V[1], pos: 2 }, { vd: V[2], pos: -1.5 }, '100u')));
  add(T1, 'Exp4-PartC-Buffer', derive(d, 'Term 1 Exp 4 Part C: message through the BUFFER (gain 1/4 of travel); vary the gain to overload the modulator',
    { remove: [['master.SINE2', 'mult1.YAC']], add: [['master.SINE2', 'buffer.IN'], ['buffer.OUT', 'mult1.YAC']], probes: { CH1: 'buffer.OUT' }, mods: { buffer: { GAIN: 0.25 } } }));
  add(T1, 'Exp4-VCO-Carrier', derive(d, 'Term 1 Exp 4 steps 33-38: VCO (HI, middle) as the local carrier - tune it towards 100 kHz',
    { remove: [['master.SINE100', 'mult2.YDC']], add: [['vco.SINE', 'mult2.YDC']], mods: { vco: { HI: 1, FREQ: 0.5, GAIN: 0.5 } } }));
}
{ // Exp 5 SSB: phasing method. Steps 15-19 set each ADDER input for 4 Vp-p; steps 20-23 phase adjust for the flattest envelope.
  const ssb = S('Term 1 Exp 5 SSB: phasing modulator, envelope flattened with the PHASE ADJUST',
    [['master.SINE2', 'phase.IN'], ['phase.OUT', 'mult1.XAC'], ['master.COS100', 'mult1.YAC'], ['master.SINE100', 'mult2.XDC'], ['master.SINE2', 'mult2.YDC'], ['mult1.KXY', 'adder.A'], ['mult2.KXY', 'adder.B']],
    { CH1: 'master.SINE2', CH2: 'adder.OUT' }, { phase: { INV: 1, PHASE: 0.5 }, adder: { G: 0.5, g: 0.5 } }, scope({ vd: V[1], pos: 2 }, { vd: V[1], pos: -1.5 }, '100u'));
  const s = build(ssb);
  s.mods.adder.set('G', 0); const gK = solve(k => { s.mods.adder.set('g', k); return pp(grab(s, 'adder.OUT', null, 0.01)[0]); }, 4, 0, 0.6);
  s.mods.adder.set('g', 0); const GK = solve(k => { s.mods.adder.set('G', k); return pp(grab(s, 'adder.OUT', null, 0.01)[0]); }, 4, 0, 0.6);
  s.mods.adder.set('g', gK);
  let best = 1e9, bp = 0.5;
  for (let p = 0; p <= 1.0001; p += 0.02) { s.mods.phase.set('PHASE', p); const [y] = grab(s, 'adder.OUT', null, 0.01); const e = []; for (let i = 96; i + 48 < y.length - 96; i += 48) { let mx = -1e9; for (let j = 0; j < 48; j++) mx = Math.max(mx, y[i + j]); e.push(mx); } const r = pp(e); if (r < best) { best = r; bp = p; } }
  ssb.mods.adder = { G: GK, g: gK }; ssb.mods.phase = { INV: 1, PHASE: +bp.toFixed(2) };
  add(T1, 'Exp5-SSB-Modulation', ssb);
  add(T1, 'Exp5-SSB-Demodulation', derive(ssb, 'Term 1 Exp 5 Part B: SSB product detector (bottom-row MULTIPLIER + TUNEABLE LPF)',
    { add: [['adder.OUT', 'mult3.XDC'], ['master.SINE100', 'mult3.YDC'], ['mult3.KXY', 'tlpf.IN']], probes: { CH2: 'tlpf.OUT' }, mods: { tlpf: { GAIN: 0.5, FC: 1 } } }));
}
{ // Exp 6 FM: VCO LO, GAIN two-thirds, FREQ trimmed for a 10 kHz rest frequency (step 8)
  const fm = add(T1, 'Exp6-FM-Modulation', S('Term 1 Exp 6 FM: 2 kHz DIGITAL message on the VCO (rest frequency 10 kHz, GAIN 2/3)', [['master.DIG2', 'vco.IN']],
    { CH1: 'master.DIG2', CH2: 'vco.SINE' }, { vco: { HI: 0, GAIN: 0.667, FREQ: +((10e3 - 1e3) / 16e3).toFixed(4) } }, scope({ vd: V[2], pos: 1 }, { vd: V[2], pos: -2 }, '100u')));
  add(T1, 'Exp6-PartC-Sine-Message', derive(fm, 'Term 1 Exp 6 Part C: 2 kHz SINE message (use Display > Persist)',
    { remove: [['master.DIG2', 'vco.IN']], add: [['master.SINE2', 'vco.IN']], probes: { CH1: 'master.SINE2' } }));
}
{ // Exp 7 FM demodulation (zero-crossing detector). Steps 14-17: GAIN turned for 15 kHz at +2 V. Steps 22-24: 12 us pulses.
  const f7 = S('Term 1 Exp 7 Part B: zero-crossing detector; VDC (CH1) shifts the VCO, BASEBAND LPF DC (CH2) follows it',
    [['vdc.VDC', 'vco.IN'], ['vco.SINE', 'util.CIN'], ['vdc.GND', 'util.REF'], ['util.COMP', 'tpg.CLK'], ['tpg.Q1', 'channel.BB_IN']],
    { CH1: 'vdc.VDC', CH2: 'channel.BB' }, { vco: { HI: 0, GAIN: 1, FREQ: +((10e3 - 1e3) / 16e3).toFixed(4) }, vdc: { VDC: 0.9 }, tpg: { DELAY: 0, WIDTH: +((12 - 5) / 35).toFixed(4) } },
    scope({ vd: V[1], pos: 1 }, { vd: V[0.5], pos: -2 }, '50u', { ...TRIG('CH2', 0), meas: { src: 'CH2', items: ['Vavg', null, null], all: false } })); // step 9: trigger source CH2 (CH1 is DC); step 26 watches a DC level, so the readout is its average
  const s = build(f7); const fr = () => { const [y] = grab(s, 'vco.SINE', null, 0.02); let c = 0, f = -1, l = -1; for (let i = 1; i < y.length; i++) if (y[i - 1] < 0 && y[i] >= 0) { if (f < 0) f = i; else { c++; l = i; } } return c / ((l - f) / FS); };
  f7.mods.vco.GAIN = solve(k => { s.mods.vco.set('GAIN', k); return fr(); }, 15e3);
  add(T1, 'Exp7-FM-Demodulation', f7);
  add(T1, 'Exp7-PartD-Sine-Message', derive(f7, 'Term 1 Exp 7 Part D: 2 kHz SINE message demodulated (CH2 AC coupled)',
    { remove: [['vdc.VDC', 'vco.IN']], add: [['master.SINE2', 'vco.IN']], probes: { CH1: 'master.SINE2' }, scope: scope({ vd: V[1], pos: 1.5 }, { vd: V[0.2], pos: -2, cpl: 'AC' }, '200u') }));
}

// =====================================================================================================
// TERM 2 (Electrical Testing 7)
// =====================================================================================================
const T2 = 'Term2';
{ // Exp 11 Sampling and reconstruction
  add(T2, 'Exp11-A-Natural-Sampling', S('Term 2 Exp 11 Part A (Figure 2): natural sampling of the 2 kHz message by the 8 kHz clock',
    [['master.DIG8', 'das.C2'], ['master.SINE2', 'das.IN2']], { CH1: 'master.SINE2', CH2: 'das.OUT' }, {}, scope({ vd: V[1], pos: 2 }, { vd: V[1], pos: -2 }, '100u')));
  const sh = add(T2, 'Exp11-A-Sample-and-Hold', S('Term 2 Exp 11 Part A (Figure 4): sample-and-hold',
    [['master.SINE2', 'das.SHIN'], ['master.DIG8', 'das.C1']], { CH1: 'master.SINE2', CH2: 'das.SH' }, {}, scope({ vd: V[1], pos: 2 }, { vd: V[1], pos: -2 }, '100u')));
  const rec = add(T2, 'Exp11-C-Reconstruction', derive(sh, 'Term 2 Exp 11 Part C (Figure 7): TUNEABLE LPF reconstructs the message (fc turned up just past 2 kHz)',
    { add: [['das.SH', 'tlpf.IN']], probes: { CH2: 'tlpf.OUT' }, mods: { tlpf: { GAIN: 0.5, FC: +fcK(2.5e3).toFixed(4) } } }));
  add(T2, 'Exp11-D-Aliasing', derive(rec, 'Term 2 Exp 11 Part D (Figure 9): VCO DIGITAL (LO, fully clockwise) is the sample clock - turn FREQ down to see aliasing',
    { remove: [['master.DIG8', 'das.C1']], add: [['vco.DIG', 'das.C1']], mods: { vco: { HI: 0, FREQ: 1, GAIN: 0.5 } } }));
}
{ // Exp 12 PCM encoding (8 kHz bit clock)
  add(T2, 'Exp12-A-PCM-0V', S('Term 2 Exp 12 Part A (Figure 5): 0 V in -> code 10000000. FS (CH1, slope -) and PCM DATA (CH2)',
    [['vdc.GND', 'pcmenc.IN1'], ['master.DIG8', 'pcmenc.CLK']], { CH1: 'pcmenc.FS', CH2: 'pcmenc.DATA' }, { pcmenc: { TDM: 0 } },
    scope({ vd: V[5], pos: 1 }, { vd: V[5], pos: -3 }, '100u', TRIG('CH1', 2.5, 'F'))));
  add(T2, 'Exp12-B-PCM-Variable-DC', S('Term 2 Exp 12 Part B (Figure 7): VDC (CH1) encoded on PCM DATA (CH2), scope triggered by FS on EXT',
    [['vdc.VDC', 'pcmenc.IN1'], ['master.DIG8', 'pcmenc.CLK']], { CH1: 'vdc.VDC', CH2: 'pcmenc.DATA', EXT: 'pcmenc.FS' }, { pcmenc: { TDM: 0 }, vdc: { VDC: 0.5 } },
    scope({ vd: V[1], pos: 1 }, { vd: V[5], pos: -3 }, '100u', TRIG('EXT', 2.5, 'F'))));
  add(T2, 'Exp12-D-PCM-Sinewave', S('Term 2 Exp 12 Part D (Figure 9): 2 kHz SINE encoded with the VCO (HI, fully anticlockwise) as the bit clock',
    [['master.SINE2', 'pcmenc.IN1'], ['vco.DIG', 'pcmenc.CLK']], { CH1: 'pcmenc.FS', CH2: 'pcmenc.DATA' }, { pcmenc: { TDM: 0 }, vco: { HI: 1, FREQ: 0, GAIN: 0.5 } },
    scope({ vd: V[5], pos: 1 }, { vd: V[5], pos: -3 }, '50u', TRIG('CH1', 2.5))));
}
{ // Exp 13 PCM decoding (100 kHz bit clock, VCO LO fully anticlockwise = 1 kHz message)
  const dec = add(T2, 'Exp13-B-PCM-Decoding', S('Term 2 Exp 13 Part B (Figure 5): PCM encoder -> decoder; message (CH1) and stepped decoder output (CH2)',
    [['vco.SINE', 'pcmenc.IN1'], ['master.DIG100', 'pcmenc.CLK'], ['pcmenc.FS', 'pcmdec.FS'], ['pcmenc.DATA', 'pcmdec.DATA'], ['master.DIG100', 'pcmdec.CLK']],
    { CH1: 'vco.SINE', CH2: 'pcmdec.OUT1' }, { pcmenc: { TDM: 0 }, vco: { HI: 0, FREQ: 0, GAIN: 0.5 } }, scope({ vd: V[1], pos: 2 }, { vd: V[1], pos: -2 }, '500u')));
  add(T2, 'Exp13-D-Recovering-Message', derive(dec, 'Term 2 Exp 13 Part D (Figure 10): TUNEABLE LPF smooths the decoder output (fc turned up until the message is recovered)',
    { add: [['pcmdec.OUT1', 'tlpf.IN']], probes: { CH2: 'tlpf.OUT' }, mods: { tlpf: { GAIN: 0.5, FC: +fcK(2e3).toFixed(4) } } }));
}
{ // Exp 15 ASK
  const ask = add(T2, 'Exp15-A-ASK-Generation', S('Term 2 Exp 15 Part A (Figure 2): ASK - 2 kHz SINE switched by the X data (scope triggered by SYNC on EXT)',
    [['master.DIG2', 'seq.CLK'], ['seq.X', 'das.C2'], ['master.SINE2', 'das.IN2']], { CH1: 'seq.X', CH2: 'das.OUT', EXT: 'seq.SYNC' }, { seq: { S1: 0, S2: 0 } },
    scope({ vd: V[5], pos: 1.5 }, { vd: V[2], pos: -2 }, '1m', EXT)));
  const ask100 = add(T2, 'Exp15-A-ASK-100kHz-Carrier', derive(ask, 'Term 2 Exp 15 Part A (Figure 4): VCO (HI, middle) as a 100 kHz carrier',
    { remove: [['master.SINE2', 'das.IN2']], add: [['vco.SINE', 'das.IN2']], mods: { vco: { HI: 1, FREQ: 0.5, GAIN: 0.5 } } }));
  const askB = add(T2, 'Exp15-B-ASK-Envelope-Detection', derive(ask100, 'Term 2 Exp 15 Part B (Figure 6): RECTIFIER + TUNEABLE LPF (gain and fc fully clockwise) recover the data',
    { add: [['das.OUT', 'util.RECT_IN'], ['util.RECT', 'tlpf.IN']], probes: { CH2: 'tlpf.OUT' }, mods: { tlpf: { GAIN: 1, FC: 1 } } }));
  askB.scope.ch.CH2.vd = V[0.5]; // the envelope is under 1 Vp-p (the 100 kHz carrier is 1.8 Vp-p after the switch's 50 kHz bandwidth)
  const askC = derive(askB, 'Term 2 Exp 15 Part C (Figure 8): COMPARATOR restores the data (VDC set so the outputs match)',
    { add: [['tlpf.OUT', 'util.CIN'], ['vdc.VDC', 'util.REF']], probes: { CH2: 'util.COMP' } });
  askC.scope.ch.CH2.vd = V[2]; // back to 2 V/div for the 0/5 V comparator output
  { const s = build(askB); const [, y] = grab(s, 'seq.X', 'tlpf.OUT', 0.04); const mid = (Math.max(...y) + Math.min(...y)) / 2; askC.mods.vdc = { VDC: +((mid + 2.5) / 5).toFixed(3) }; }
  add(T2, 'Exp15-C-ASK-Comparator', askC);
}
{ // Exp 16 FSK: LINE CODE (DIP 00) -> VCO, GAIN half, FREQ a quarter; Part B FREQ at 2 o'clock, TLPF gain fully clockwise
  const fsk = add(T2, 'Exp16-A-FSK-Generation', S('Term 2 Exp 16 Part A (Figure 2): FSK - LINE CODE data on the VCO (LO, GAIN half, FREQ a quarter)',
    [['master.DIG2', 'seq.CLK'], ['seq.LINE', 'vco.IN']], { CH1: 'seq.LINE', CH2: 'vco.SINE', EXT: 'seq.SYNC' }, { seq: { S1: 0, S2: 0 }, vco: { HI: 0, GAIN: 0.5, FREQ: 0.25 } },
    scope({ vd: V[1], pos: 2 }, { vd: V[2], pos: -2 }, '500u', EXT)));
  const fskB = derive(fsk, 'Term 2 Exp 16 Part B (Figure 4): TUNEABLE LPF picks out the lower tone (fc turned down from fully clockwise until the higher tone is gone)',
    { add: [['vco.SINE', 'tlpf.IN']], probes: { CH2: 'tlpf.OUT' }, mods: { vco: { FREQ: 0.7 }, tlpf: { GAIN: 1, FC: +fcK(12.3e3).toFixed(4) } } });
  add(T2, 'Exp16-B-FSK-Filtering', fskB);
  const fskC = derive(fskB, 'Term 2 Exp 16 Part B (Figures 6-8): RECTIFIER + BASEBAND LPF envelope detector, then COMPARATOR (VDC set to the middle of the envelope)',
    { add: [['tlpf.OUT', 'util.RECT_IN'], ['util.RECT', 'channel.BB_IN'], ['channel.BB', 'util.CIN'], ['vdc.VDC', 'util.REF']], probes: { CH2: 'util.COMP' } });
  { const s = build(fskC); const [y] = grab(s, 'channel.BB', null, 0.06, 2304 * 30); const mid = (Math.max(...y) + Math.min(...y)) / 2; fskC.mods.vdc = { VDC: +((mid + 2.5) / 5).toFixed(3) }; }
  add(T2, 'Exp16-C-FSK-Envelope-and-Comparator', fskC);
}
{ // Exp 17 BPSK (8 kHz bit clock)
  const b = add(T2, 'Exp17-A-BPSK-Generation', S('Term 2 Exp 17 Part A (Figure 2): BPSK - LINE CODE (NRZ-L) x 100 kHz COS',
    [['master.DIG8', 'seq.CLK'], ['seq.LINE', 'mult2.XDC'], ['master.COS100', 'mult2.YDC']], { CH1: 'seq.LINE', CH2: 'mult2.KXY', EXT: 'seq.SYNC' }, { seq: { S1: 0, S2: 0 } },
    scope({ vd: V[1], pos: 2 }, { vd: V[2], pos: -2 }, '100u', EXT)));
  const bB = add(T2, 'Exp17-B-BPSK-Product-Detector', derive(b, 'Term 2 Exp 17 Part B (Figure 4): product detector (MULTIPLIER + TUNEABLE LPF, fc fully clockwise, gain middle)',
    { add: [['mult2.KXY', 'mult3.XDC'], ['master.COS100', 'mult3.YDC'], ['mult3.KXY', 'tlpf.IN']], probes: { CH2: 'tlpf.OUT' }, mods: { tlpf: { GAIN: 0.5, FC: 1 } } }));
  add(T2, 'Exp17-C-BPSK-Comparator', derive(bB, 'Term 2 Exp 17 Part C (Figure 6): COMPARATOR restores the data (VDC middle = 0 V reference)',
    { add: [['tlpf.OUT', 'util.CIN'], ['vdc.VDC', 'util.REF']], probes: { CH2: 'util.COMP' }, mods: { vdc: { VDC: 0.5 } } }));
}
{ // Exp 18 QPSK
  const q = add(T2, 'Exp18-A-QPSK-Serial-to-Parallel', S('Term 2 Exp 18 Part A (Figure 3): X data split into X1 (CH1) and X2 (CH2); DIVIDER /2 clocks the converter',
    [['master.DIG8', 'seq.CLK'], ['master.DIG8', 'div.IN'], ['div.OUT', 's2p.CLK'], ['seq.X', 's2p.SERIAL']], { CH1: 's2p.X1', CH2: 's2p.X2', EXT: 'seq.SYNC' },
    { seq: { S1: 0, S2: 0 }, div: { S1: 0, S2: 1 } }, scope({ vd: V[2], pos: 2 }, { vd: V[2], pos: -2 }, '500u', EXT)));
  const qA = derive(q, 'Term 2 Exp 18 Part A (Figures 5-9): QPSK = X1 x 100 kHz SINE + X2 x 100 kHz COS, each set for 4 Vp-p on the ADDER',
    { add: [['s2p.X1', 'mult1.XDC'], ['master.SINE100', 'mult1.YDC'], ['s2p.X2', 'mult2.XDC'], ['master.COS100', 'mult2.YDC'], ['mult1.KXY', 'adder.A'], ['mult2.KXY', 'adder.B']],
      probes: { CH1: 'adder.OUT', CH2: 's2p.X1' }, scope: scope({ vd: V[2], pos: 1.5 }, { vd: V[2], pos: -2.5 }, '200u', EXT) });
  { const s = build(qA); s.mods.adder.set('G', 0); qA.mods.adder = { g: solve(k => { s.mods.adder.set('g', k); return pp(grab(s, 'adder.OUT', null, 0.02)[0]); }, 4, 0, 0.6) };
    s.mods.adder.set('g', 0); qA.mods.adder.G = solve(k => { s.mods.adder.set('G', k); return pp(grab(s, 'adder.OUT', null, 0.02)[0]); }, 4, 0, 0.6); }
  add(T2, 'Exp18-A-QPSK-Generation', qA);
  const qB = derive(qA, 'Term 2 Exp 18 Part B (Figure 11): phase discrimination - PHASE SHIFTER (0) adjusted until X1 (even bits) is recovered',
    { add: [['master.SINE100', 'phase.IN'], ['phase.OUT', 'mult3.XDC'], ['adder.OUT', 'mult3.YDC'], ['mult3.KXY', 'tlpf.IN']],
      probes: { CH1: 's2p.X1', CH2: 'tlpf.OUT' }, mods: { tlpf: { GAIN: 0.5, FC: 1 }, phase: { INV: 0, PHASE: 0.5 } }, scope: scope({ vd: V[2], pos: 2 }, { vd: V[2], pos: -2 }, '1m', EXT) });
  // the student turns PHASE ADJUST until the filter output looks like X1 (or X2); if only an inverted copy can be reached
  // with the book's PHASE CHANGE position, that is what the file opens at and the title says so
  const tunePhase = (st, inv, ref) => { const s = build(st); s.mods.phase.set('INV', inv); let best = -2, worst = 2, bp = 0.5, wp = 0.5;
    for (let p = 0; p <= 1.0001; p += 0.025) { s.mods.phase.set('PHASE', p); const [a, y] = grab(s, ref, 'tlpf.OUT', 0.03); const c = corr(a.slice(0, a.length - 400), y.slice(400)); if (c > best) { best = c; bp = p; } if (c < worst) { worst = c; wp = p; } }
    return best > 0.85 ? [{ INV: inv, PHASE: +bp.toFixed(3) }, false] : [{ INV: inv, PHASE: +wp.toFixed(3) }, true]; };
  let inv1; [qB.mods.phase, inv1] = tunePhase(qB, 0, 's2p.X1'); if (inv1) qB.title += ' (only an inverted copy is reachable at PHASE CHANGE 0)';
  add(T2, 'Exp18-B-QPSK-Recover-X1', qB);
  const qB2 = derive(qB, 'Term 2 Exp 18 Part B steps 46-47: PHASE SHIFTER 180 and adjusted until X2 (odd bits) is recovered', { probes: { CH1: 's2p.X2' } });
  let inv2; [qB2.mods.phase, inv2] = tunePhase(qB2, 1, 's2p.X2'); if (inv2) qB2.title += ' (only an inverted copy is reachable at PHASE CHANGE 180)';
  add(T2, 'Exp18-B-QPSK-Recover-X2', qB2);
  add(T2, 'Exp18-B-QPSK-Comparator', derive(qB, 'Term 2 Exp 18 Part B (Figure 13): COMPARATOR (REF to GND) restores the recovered X1 data',
    { add: [['tlpf.OUT', 'util.CIN'], ['vdc.GND', 'util.REF']], probes: { CH2: 'util.COMP' } }));
}
{ // Exp 19 DSSS (100 kHz chip clock)
  const d = add(T2, 'Exp19-A-DSSS-Generation', S('Term 2 Exp 19 Part A (Figure 1): DSSS - 2 kHz message x PN sequence (LINE CODE, 100 kHz clock)',
    [['master.DIG100', 'seq.CLK'], ['seq.LINE', 'mult3.XDC'], ['master.SINE2', 'mult3.YDC']], { CH1: 'master.SINE2', CH2: 'mult3.KXY' }, { seq: { S1: 0, S2: 0 } },
    scope({ vd: V[1], pos: 2 }, { vd: V[2], pos: -2 }, '100u')));
  const dC = add(T2, 'Exp19-C-DSSS-Demodulation', derive(d, 'Term 2 Exp 19 Part C (Figure 4): despreading with the same PN sequence (X) on the AC inputs, TUNEABLE LPF fc at half travel',
    { add: [['mult3.KXY', 'mult1.YAC'], ['seq.X', 'mult1.XAC'], ['mult1.KXY', 'tlpf.IN']], probes: { CH2: 'tlpf.OUT' }, mods: { tlpf: { GAIN: 0.5, FC: 0.5 } } }));
  add(T2, 'Exp19-C-DSSS-Wrong-Code', derive(dC, 'Term 2 Exp 19 Part C (Figure 7): despreading with the wrong PN sequence (Y) - no message',
    { remove: [['seq.X', 'mult1.XAC']], add: [['seq.Y', 'mult1.XAC']] }));
  const jam = add(T2, 'Exp19-D-DSSS-Jamming', derive(dC, 'Term 2 Exp 19 Part D (Figure 8): a VCO (HI, middle) jamming signal added in the channel by the ADDER',
    { remove: [['mult3.KXY', 'mult1.YAC']], add: [['mult3.KXY', 'adder.A'], ['vco.SINE', 'adder.B'], ['adder.OUT', 'mult1.YAC']], probes: { CH1: 'adder.OUT' },
      mods: { vco: { HI: 1, FREQ: 0.5, GAIN: 0.5 }, adder: { G: 0.5, g: 0.5 } } }));
  add(T2, 'Exp19-D-DSSS-Swept-Jamming', derive(jam, 'Term 2 Exp 19 Part D (Figure 10): the jammer swept by the 2 kHz SINE (VCO GAIN fully clockwise)',
    { add: [['master.SINE2', 'vco.IN']], mods: { vco: { GAIN: 1 } } }));
  add(T2, 'Exp19-D-DSSS-Noise', derive(jam, 'Term 2 Exp 19 Part D (Figure 11): NOISE (-20 dB) in the channel instead of the jammer',
    { remove: [['vco.SINE', 'adder.B']], add: [['noise.N20', 'adder.B']] }));
}
{ // Vol.2 Exp 6 PWM (8 kHz sawtooth from TWIN PULSE Q2 -> DIODE & RC LPF)
  const saw = add(T2, 'Exp6-A-PWM-Sawtooth', S('Term 2 Exp 6 Part A (Figure 4): 8 kHz sawtooth (TWIN PULSE WIDTH and DELAY fully anticlockwise)',
    [['master.DIG8', 'tpg.CLK'], ['tpg.Q2', 'util.DIODE_IN']], { CH1: 'util.DIODE' }, { tpg: { WIDTH: 0, DELAY: 0 } }, scope({ vd: V[1], pos: -3 }, { vd: V[1], pos: -3 }, '100u')));
  const pwB = derive(saw, 'Term 2 Exp 6 Part B (Figures 6-8): PWM of a DC voltage (ADDER output at the middle of the sawtooth, G at half travel)',
    { add: [['vdc.VDC', 'adder.B'], ['adder.OUT', 'util.REF'], ['util.DIODE', 'util.CIN']], probes: { CH2: 'util.COMP' }, mods: { vdc: { VDC: 0.03 }, adder: { G: 0.5, g: 0.5 } } });
  { const s = build(saw); const [y] = grab(s, 'util.DIODE', null, 0.02); const mid = (Math.max(...y) + Math.min(...y)) / 2; // step 24: DC exactly half way between the peaks
    const s2 = build(pwB); pwB.mods.adder.g = solve(k => { s2.mods.adder.set('g', k); return avg(grab(s2, 'adder.OUT', null, 0.005)[0]); }, mid, 0, 1); pwB.mods._mid = mid; }
  const mid = pwB.mods._mid; delete pwB.mods._mid; add(T2, 'Exp6-B-PWM-DC-Input', pwB);
  const pwC = derive(pwB, 'Term 2 Exp 6 Part C (Figure 10): PWM of the 2 kHz SINE (G just below the point where the message peaks reach the sawtooth peaks)',
    { add: [['master.SINE2', 'adder.A']], probes: { CH1: 'adder.OUT', CH2: 'util.COMP' }, scope: scope({ vd: V[1], pos: -1 }, { vd: V[5], pos: -3 }, '200u') });
  { const s = build(saw); const [y] = grab(s, 'util.DIODE', null, 0.02); const span = Math.max(...y) - Math.min(...y);
    const s2 = build(pwC); pwC.mods.adder.G = +(0.9 * solve(k => { s2.mods.adder.set('G', k); return pp(grab(s2, 'adder.OUT', null, 0.005)[0]); }, span, 0, 1)).toFixed(4); }
  add(T2, 'Exp6-C-PWM-Sine-Message', pwC);
  const pwD = add(T2, 'Exp6-D-PWM-Demodulation', derive(pwC, 'Term 2 Exp 6 Part D (Figure 14): TUNEABLE LPF recovers the message from the PWM signal',
    { add: [['util.COMP', 'tlpf.IN']], probes: { CH1: 'master.SINE2', CH2: 'tlpf.OUT' }, mods: { tlpf: { GAIN: 0.5, FC: +fcK(3e3).toFixed(4) } }, scope: scope({ vd: V[1], pos: 2 }, { vd: V[1], pos: -2 }, '200u') }));
  add(T2, 'Exp6-E-PWM-Nyquist', derive(pwD, 'Term 2 Exp 6 Part E: VCO (LO, GAIN anticlockwise, FREQ fully clockwise) as the message - turn FREQ down past half the sample rate',
    { remove: [['master.SINE2', 'adder.A']], add: [['vco.SINE', 'adder.A']], probes: { CH1: 'vco.SINE' }, mods: { vco: { HI: 0, GAIN: 0, FREQ: 1 } }, scope: scope({ vd: V[1], pos: 2 }, { vd: V[1], pos: -2 }, '100u') }));
}
{ // Vol.2 Exp 8 Carrier acquisition using the PLL
  const am = S('Term 2 Exp 8 Part A (Figure 5): 8.33 kHz sine (TUNEABLE LPF, 4 Vp-p, with its DC) amplitude-modulates the 100 kHz carrier',
    [['master.DIG8', 'tlpf.IN'], ['tlpf.OUT', 'mult3.XDC'], ['master.SINE100', 'mult3.YDC']], { CH1: 'tlpf.OUT', CH2: 'mult3.KXY' }, { tlpf: { FC: 1, GAIN: 0.5 } },
    scope({ vd: V[2], pos: 1 }, { vd: V[2], pos: -2 }, '20u'));
  { const s = build(am); am.mods.tlpf.GAIN = solve(k => { s.mods.tlpf.set('GAIN', k); return pp(grab(s, 'tlpf.OUT', null, 0.005)[0]); }, 4, 0, 1); }
  add(T2, 'Exp8-A-PLL-AM-Signal', am);
  add(T2, 'Exp8-B-PLL-Lock', derive(am, 'Term 2 Exp 8 Part B (Figure 8): PLL = MULTIPLIER (phase detector) + RC LPF (loop filter) + VCO (HI, middle); VCO (CH2) locks to the 100 kHz carrier (CH1)',
    { add: [['mult3.KXY', 'mult1.XAC'], ['vco.SINE', 'mult1.YAC'], ['mult1.KXY', 'util.RC_IN'], ['util.RC', 'vco.IN']], probes: { CH1: 'master.SINE100', CH2: 'vco.SINE' },
      mods: { vco: { HI: 1, FREQ: 0.5, GAIN: 0.5 } }, scope: scope({ vd: V[1], pos: 2 }, { vd: V[1], pos: -2 }, '2u') }));
}
{ // Vol.2 Exp 9 SNR and eye diagrams (2 kHz data, NOISE -20 dB)
  const n = add(T2, 'Exp9-A-Noisy-Data', S('Term 2 Exp 9 Part A (Figure 1): LINE CODE data + NOISE (-20 dB) in the channel ADDER (move the lead to -6 dB / 0 dB for more noise)',
    [['master.DIG2', 'seq.CLK'], ['seq.LINE', 'adder2.SIGNAL'], ['noise.N20', 'adder2.NOISE']], { CH1: 'adder2.OUT', EXT: 'seq.SYNC' }, { seq: { S1: 0, S2: 0 } },
    scope({ vd: V[1], pos: 0 }, { on: false }, '1m', EXT)));
  add(T2, 'Exp9-B-Band-Limited', derive(n, 'Term 2 Exp 9 Part B (Figure 3): the noisy data band-limited by the BASEBAND LPF',
    { add: [['adder2.OUT', 'channel.BB_IN']], probes: { CH1: 'channel.BB' } }));
}
{ // Vol.2 Exp 16 Delta modulation: ADDER (summer), COMPARATOR (limiter), S2P (sampler, 100 kHz clock), RC LPF (integrator)
  const dmLeads = [['master.SINE2', 'adder.A'], ['util.RC', 'adder.B'], ['adder.OUT', 'util.REF'], ['gnd2', 'util.CIN'], ['util.COMP', 's2p.SERIAL'], ['master.DIG100', 's2p.CLK'], ['s2p.X1', 'util.RC_IN'], ['master.SINE2', 'buffer.IN']];
  const dm = S('Term 2 Exp 16 Part A (Figures 3-7): delta modulator. Inverted message (BUFFER, CH1) and integrator / RC LPF output (CH2), AC coupled',
    dmLeads, { CH1: 'buffer.OUT', CH2: 'util.RC' }, { adder: { G: 0.5, g: 0.5 }, buffer: { GAIN: 0.3 } }, scope({ vd: V[1], cpl: 'AC' }, { vd: V[1], cpl: 'AC' }, '100u'));
  { const s = build(dm); const [, r] = grab(s, 'buffer.OUT', 'util.RC', 0.03); const target = pp(r); // "set its output to the same amplitude"
    dm.mods.buffer.GAIN = solve(k => { s.mods.buffer.set('GAIN', k); return pp(grab(s, 'buffer.OUT', null, 0.005)[0]); }, target, 0, 1); }
  add(T2, 'Exp16v2-A-Delta-Modulator', dm);
  add(T2, 'Exp16v2-B-Delta-Signal', derive(dm, 'Term 2 Exp 16 Part B (Figure 9): the delta signal on X1 (CH2); g at 3 o\'clock for a larger step size',
    { probes: { CH2: 's2p.X1' }, mods: { adder: { g: 0.8 } }, scope: scope({ vd: V[1], cpl: 'AC' }, { vd: V[2], pos: -2 }, '100u') }));
  const dd = add(T2, 'Exp16v2-C-Delta-Demodulation', derive(dm, 'Term 2 Exp 16 Part C (Figure 14): TUNEABLE LPF on the delta signal recovers the message',
    { add: [['s2p.X1', 'tlpf.IN']], probes: { CH1: 'master.SINE2', CH2: 'tlpf.OUT' }, mods: { tlpf: { GAIN: 0.5, FC: +fcK(3e3).toFixed(4) } }, scope: scope({ vd: V[1], pos: 2 }, { vd: V[1], pos: -2 }, '100u') }));
  dd.title = 'Term 2 Exp 16 Part C (Figure 14): TUNEABLE LPF on the delta signal; fc turned down from fully clockwise until the message is recovered';
  const sn = derive(dd, 'Term 2 Exp 16 Part D (Figure 20): SNDR - the inverted, phase-matched message (BUFFER + PHASE SHIFTER) cancels the recovered message, leaving the distortion',
    { remove: [['master.SINE2', 'buffer.IN']], add: [['master.SINE2', 'buffer.IN'], ['buffer.OUT', 'phase.IN'], ['phase.OUT', 'adder2.SIGNAL'], ['tlpf.OUT', 'adder2.NOISE']],
      probes: { CH1: 'master.SINE2', CH2: 'adder2.OUT' }, mods: { phase: { INV: 0, PHASE: 0.5 } } });
  { const s = build(sn); const [, t] = grab(s, 'phase.OUT', 'tlpf.OUT', 0.03); const amp = pp(t); // step 40: stolen message to the same amplitude
    s.mods.buffer.set('GAIN', solve(k => { s.mods.buffer.set('GAIN', k); return pp(grab(s, 'phase.OUT', null, 0.01)[0]); }, amp, 0, 1)); sn.mods.buffer = { GAIN: s.mods.buffer.p.GAIN };
    const rms = a => Math.sqrt(avg(a.map(v => (v - avg(a)) ** 2)));
    let best = 1e9, bp = 0.5; for (let p = 0; p <= 1.0001; p += 0.02) { s.mods.phase.set('PHASE', p); const v = rms(grab(s, 'adder2.OUT', null, 0.01)[0]); if (v < best) { best = v; bp = p; } } sn.mods.phase.PHASE = +bp.toFixed(2);
    s.mods.phase.set('PHASE', bp); let bg = s.mods.buffer.p.GAIN; best = 1e9; for (let g = bg * 0.8; g <= bg * 1.2; g += bg * 0.02) { s.mods.buffer.set('GAIN', g); const v = rms(grab(s, 'adder2.OUT', null, 0.01)[0]); if (v < best) { best = v; sn.mods.buffer.GAIN = +g.toFixed(4); } } }
  add(T2, 'Exp16v2-D-Delta-SNDR', sn);
}
{ // Vol.2 Exp 17 Delta-sigma: integrator moved in front of the comparator
  const ds = add(T2, 'Exp17v2-A-Delta-Sigma-Modulator', S('Term 2 Exp 17 Part A (Figures 3-7): delta-sigma modulator. Inverted message (BUFFER, CH1, 1 V/div) and RC LPF output (CH2, 0.5 V/div), AC coupled',
    [['master.SINE2', 'adder.A'], ['s2p.X1', 'adder.B'], ['adder.OUT', 'util.RC_IN'], ['util.RC', 'util.REF'], ['gnd2', 'util.CIN'], ['util.COMP', 's2p.SERIAL'], ['master.DIG100', 's2p.CLK'], ['master.SINE2', 'buffer.IN']],
    { CH1: 'buffer.OUT', CH2: 'util.RC' }, { adder: { G: 0.5, g: 0.5 }, buffer: { GAIN: 0.3 } }, scope({ vd: V[1], cpl: 'AC' }, { vd: V[0.5], cpl: 'AC' }, '100u')));
  add(T2, 'Exp17v2-A-Delta-Sigma-Signal', derive(ds, 'Term 2 Exp 17 Part A step 18: the delta-sigma pulse train on X1 (CH2, 1 V/div)',
    { probes: { CH1: 'master.SINE2', CH2: 's2p.X1' }, scope: scope({ vd: V[1], pos: 2 }, { vd: V[1], pos: -2 }, '100u') }));
  add(T2, 'Exp17v2-B-Delta-Sigma-Demodulation', derive(ds, 'Term 2 Exp 17 Part B (Figure 11): TUNEABLE LPF on X1; fc turned down from fully clockwise until the message is recovered',
    { add: [['s2p.X1', 'tlpf.IN']], probes: { CH1: 'master.SINE2', CH2: 'tlpf.OUT' }, mods: { tlpf: { GAIN: 0.5, FC: +fcK(3e3).toFixed(4) } }, scope: scope({ vd: V[1], pos: 2 }, { vd: V[1], pos: -2 }, '100u') }));
}

// =====================================================================================================
// EXTRA: Emona Lab Manual Vol.1 Exp 3 (official SAMPLE lab manual) - not in the course books
// =====================================================================================================
{ const X = 'Extra';
  const a = S('Vol.1 Exp 3 Part A (Figure 2): ADDER models y = -(x + x); G and g each set for a gain of -1 (output = 2 x input)',
    [['master.SINE2', 'adder.A'], ['master.SINE2', 'adder.B']], { CH1: 'master.SINE2', CH2: 'adder.OUT' }, { adder: { G: 0.5, g: 0.5 } },
    scope({ vd: V[1], pos: 2 }, { vd: V[2], pos: -2 }, '200u'));
  { // steps 6-12: each input alone, gain adjusted until the output is the same size as the input
    const s = build(S('', [['master.SINE2', 'adder.A']], {}, { adder: { G: 0.5, g: 0 } }, null)); const [m] = grab(s, 'master.SINE2', null, 0.01);
    a.mods.adder.G = solve(k => { s.mods.adder.set('G', k); return pp(grab(s, 'adder.OUT', null, 0.01)[0]); }, pp(m));
    const s2 = build(S('', [['master.SINE2', 'adder.B']], {}, { adder: { G: 0, g: 0.5 } }, null));
    a.mods.adder.g = solve(k => { s2.mods.adder.set('g', k); return pp(grab(s2, 'adder.OUT', null, 0.01)[0]); }, pp(m)); }
  add(X, 'Vol1-Exp3-A-Adder-Model', a);
  const b = derive(a, 'Vol.1 Exp 3 Part B (Figure 4): y = x + (x shifted 180 deg) -> nearly 0 V; PHASE ADJUST then g turned for the smallest output (CH2 0.1 V/div)',
    { remove: [['master.SINE2', 'adder.B']], add: [['master.SINE2', 'phase.IN'], ['phase.OUT', 'adder.B']], probes: { CH2: 'adder.OUT' },
      mods: { phase: { INV: 1, PHASE: 0.5 } }, scope: scope({ vd: V[1], pos: 2 }, { vd: V[0.1], pos: 0 }, '200u') });
  { const s = build(b); const r = () => pp(grab(s, 'adder.OUT', null, 0.01)[0]);
    let best = 1e9, bp = 0.5; for (let p = 0; p <= 1.0001; p += 0.02) { s.mods.phase.set('PHASE', p); const v = r(); if (v < best) { best = v; bp = p; } } s.mods.phase.set('PHASE', bp); b.mods.phase.PHASE = +bp.toFixed(2);
    const g0 = b.mods.adder.g; best = 1e9; for (let g = g0 * 0.8; g <= g0 * 1.2; g += g0 * 0.01) { s.mods.adder.set('g', g); const v = r(); if (v < best) { best = v; b.mods.adder.g = +g.toFixed(4); } } }
  add(X, 'Vol1-Exp3-B-Phase-Cancellation', b);
}


// ----- Adapted from the Emona DATEx Lab Manual Vol.1 (same author, same modules). The DATEx uses the NI ELVIS function
// generator, DMM and signal analyser; here the VCO, the scope's own readings and the scope FFT take their place. -----
{ const X = 'Extra';
  const FFT2 = { math: { on: true, kind: 'FFT', op: '+', fftSrc: 'CH2', win: 'Hanning', dbdiv: 20, fpos: 0, unit: 'dBVrms', vrd: 7 } };
  const f10 = +((10e3 - 1e3) / 16e3).toFixed(4); // VCO LO at 10 kHz (DATEx: function generator 10 kHz, 4 Vp-p)
  // DATEx Exp 7 = ETT Vol.2 Exp 18: AM and DSBSC in the frequency domain
  const am = S('Vol.2 Exp 18 (DATEx Exp 7) Part A-C: AM = (1 V DC + 1 Vp-p 10 kHz) x 4 Vp-p 100 kHz; FFT of the AM signal shows the carrier and sidebands at 90 / 100 / 110 kHz',
    [['vco.SINE', 'adder.A'], ['vdc.VDC', 'adder.B'], ['adder.OUT', 'mult2.XDC'], ['master.SINE100', 'mult2.YDC']], { CH1: 'adder.OUT', CH2: 'mult2.KXY' },
    { vco: { HI: 0, FREQ: f10, GAIN: 0.5 }, vdc: { VDC: 0.03 }, adder: { G: 0.125, g: +(1 / 2.35 / 2).toFixed(4) } },
    scope({ vd: V[0.5], pos: 1 }, { vd: V[1], pos: -1 }, '1m', { ...TRIG('CH1', 1), ...FFT2 }));
  { const s = build(am); am.mods.adder.G = solve(k => { s.mods.adder.set('G', k); return pp(grab(s, 'adder.OUT', null, 0.01)[0]); }, 1, 0, 0.5); } // step 23: 1 Vp-p
  add(X, 'Vol2-Exp18-A-AM-Spectrum', am);
  add(X, 'Vol2-Exp18-D-DSBSC-Spectrum', S('Vol.2 Exp 18 (DATEx Exp 7) Part D-E: DSBSC = 10 kHz (VCO) x 100 kHz; FFT shows only the two sidebands at 90 and 110 kHz',
    [['master.SINE100', 'mult1.XAC'], ['vco.SINE', 'mult1.YAC']], { CH1: 'vco.SINE', CH2: 'mult1.KXY' }, { vco: { HI: 0, FREQ: f10, GAIN: 0.5 } },
    scope({ vd: V[2], pos: 2 }, { vd: V[2], pos: -1 }, '1m', FFT2)));
  // DATEx Exp 16 = ETT Vol.1 Exp 14: bandwidth limiting and restoring digital signals
  add(X, 'Vol1-Exp14-A-PCM-Through-Narrow-Channel', S('Vol.1 Exp 14 (DATEx Exp 16) Part A: PCM DATA through the TUNEABLE LPF (the channel); turn fc down until the decoder output shows errors. Message = VDC (the DATEx uses a 20 Hz sine)',
    [['vdc.VDC', 'pcmenc.IN1'], ['master.DIG2', 'pcmenc.CLK'], ['master.DIG2', 'pcmdec.CLK'], ['pcmenc.FS', 'pcmdec.FS'], ['pcmenc.DATA', 'tlpf.IN'], ['tlpf.OUT', 'pcmdec.DATA']],
    { CH1: 'vdc.VDC', CH2: 'pcmdec.OUT1' }, { pcmenc: { TDM: 0 }, vdc: { VDC: 0.7 }, tlpf: { GAIN: 0.5, FC: 0.5 } }, scope({ vd: V[1], pos: 1 }, { vd: V[1], pos: -2 }, '10m')));
  const bw = add(X, 'Vol1-Exp14-B-Bandwidth-Limited-Data', S('Vol.1 Exp 14 (DATEx Exp 16) Part B: LINE CODE data (2 kHz clock) through the TUNEABLE LPF; turn fc anticlockwise to narrow the channel',
    [['master.DIG2', 'seq.CLK'], ['seq.LINE', 'tlpf.IN']], { CH1: 'seq.LINE', CH2: 'tlpf.OUT', EXT: 'seq.SYNC' }, { seq: { S1: 0, S2: 0 }, tlpf: { GAIN: 0.5, FC: 1 } },
    scope({ vd: V[2], pos: 2 }, { vd: V[2], pos: -2 }, '1m', EXT)));
  add(X, 'Vol1-Exp14-B-Higher-Bit-Rate', derive(bw, 'Vol.1 Exp 14 (DATEx Exp 16) steps 41-46: the VCO (LO) clocks the data faster; raise FREQ to see the same channel distort it more (DATEx: 2 kHz to 50 kHz)',
    { remove: [['master.DIG2', 'seq.CLK']], add: [['vco.DIG', 'seq.CLK']], mods: { vco: { HI: 0, FREQ: +((10e3 - 1e3) / 16e3).toFixed(4), GAIN: 0.5 } }, scope: scope({ vd: V[2], pos: 2 }, { vd: V[2], pos: -2 }, '200u', EXT) }));
  const rs = derive(bw, 'Vol.1 Exp 14 (DATEx Exp 16) Part C: COMPARATOR restores the band-limited data (channel narrowed to 1.5 kHz, VDC reference)',
    { add: [['tlpf.OUT', 'util.CIN'], ['vdc.VDC', 'util.REF']], probes: { CH1: 'tlpf.OUT', CH2: 'util.COMP' }, mods: { tlpf: { FC: +fcK(1.5e3).toFixed(4) }, vdc: { VDC: 0.5 } },
      scope: scope({ vd: V[2], pos: 1.5 }, { vd: V[5], pos: -3 }, '1m', EXT) });
  add(X, 'Vol1-Exp14-C-Restoring-Data', rs);
  // DATEx Exp 22 = ETT Vol.1 Exp 20: undersampling in software defined radio
  const us = S('Vol.1 Exp 20 (DATEx Exp 22) Part B: undersampling - the 100 kHz DSBSC sampled at 8.33 kHz (12 x below the carrier) and smoothed by the BASEBAND LPF gives back the 2 kHz message',
    [['master.SINE100', 'mult1.XAC'], ['master.SINE2', 'mult1.YAC'], ['mult1.KXY', 'das.SHIN'], ['master.DIG8', 'das.C1'], ['das.SH', 'channel.BB_IN']],
    { CH1: 'master.SINE2', CH2: 'channel.BB' }, {}, scope({ vd: V[1], pos: 2 }, { vd: V[0.5], pos: -2 }, '500u'));
  add(X, 'Vol1-Exp20-B-Undersampling', us);
  add(X, 'Vol1-Exp20-C-Unsynchronised-Clock', derive(us, 'Vol.1 Exp 20 (DATEx Exp 22) Part C: the sample clock from the VCO (LO, about 8.33 kHz) is not locked to the carrier - the recovered message beats',
    { remove: [['master.DIG8', 'das.C1']], add: [['vco.DIG', 'das.C1']], mods: { vco: { HI: 0, GAIN: 0.5, FREQ: +((8.333e3 + 2 - 1e3) / 16e3).toFixed(5) } } }));
}

export { SETUPS };
if (process.argv[1].endsWith('make_setups.mjs')) {
  fs.rmSync('setups', { recursive: true, force: true });
  // file names follow the order of the experiments in each book (Term 2: Vol.1 Exp 11-19, then Vol.2 Exp 6, 8, 9, 16, 17)
  const ORDER = { Exp11: '01', Exp12: '02', Exp13: '03', Exp15: '04', 'Exp16-': '05', 'Exp17-': '06', Exp18: '07', Exp19: '08', 'Exp6-': '09', 'Exp8-': '10', 'Exp9-': '11', Exp16v2: '12', Exp17v2: '13' };
  const fileName = name => { const [folder, base] = name.split('/'); if (folder === 'Extra') return `${folder}/${base}`; if (folder === 'Term1') return `${folder}/0${base.match(/^Exp(\d)/)[1]}-${base}`;
    const k = Object.keys(ORDER).sort((x, y) => y.length - x.length).find(k => base.startsWith(k)); return `${folder}/${ORDER[k]}-${base.replace('Exp16v2', 'Exp16-Vol2').replace('Exp17v2', 'Exp17-Vol2').replace(/^Exp(6|8|9)-/, 'Exp$1-Vol2-')}`; };
  // every file opens triggered: if the trigger level is outside the trigger source's swing (e.g. 0 V on a 0/5 V digital
  // signal), it is moved to the middle of the swing - what "adjust the trigger level for a stable display" does on the real scope
  for (const st of Object.values(SETUPS)) {
    const tr = st.scope.trig, src = tr.src === 'EXT' ? st.probes.EXT : st.probes[tr.src]; if (!src || tr.cpl === 'AC') continue;
    const sim = build(st); sim.setProbe('CH1', src); sim.run(FS * 0.03); const M = 48000, y = sim.read('CH1', sim.t, M, new Float64Array(M));
    let mx = -1e9, mn = 1e9; for (const v of y) { if (v > mx) mx = v; if (v < mn) mn = v; }
    const r = mx - mn; if (r > 0.05 && (tr.level < mn + 0.1 * r || tr.level > mx - 0.1 * r)) tr.level = +((mx + mn) / 2).toFixed(2);
  }
  // every trace opens on the screen: a channel that would run off the top or bottom gets its POSITION moved (and, if it
  // is taller than the screen, the next V/div up) - what "adjust the Vertical Attenuation and Position controls" does
  for (const st of Object.values(SETUPS)) {
    const on = ['CH1', 'CH2'].filter(k => st.probes[k] && st.scope.ch[k].on); if (!on.length) continue;
    const sim = build(st); on.forEach(k => sim.setProbe(k, st.probes[k])); sim.run(FS * 0.3); const M = Math.round(FS * 0.04);
    for (const k of on) {
      const c = st.scope.ch[k], y = sim.read(k, sim.t, M, new Float64Array(M)); let mx = -1e9, mn = 1e9, sum = 0;
      for (const v of y) { if (v > mx) mx = v; if (v < mn) mn = v; sum += v; }
      if (c.cpl === 'AC') { mx -= sum / M; mn -= sum / M; }
      const fits = () => mn / VD[c.vd] + c.pos >= -4.02 && mx / VD[c.vd] + c.pos <= 4.02; if (fits()) continue; // the top and bottom grid lines are on the screen
      while ((mx - mn) / VD[c.vd] > 7.6 && c.vd < VD.length - 1) c.vd++;
      c.pos = Math.round(Math.max(-3.8 - mn / VD[c.vd], Math.min(3.8 - mx / VD[c.vd], c.pos)) * 10) / 10;
    }
    if (!st.probes.CH2 && st.probes.CH1 && st.scope.meas.src === 'CH2') st.scope.meas.src = 'CH1'; // one-channel set-ups measure CH1
  }
  for (const [name, s] of Object.entries(SETUPS)) { const f = fileName(name); fs.mkdirSync(`setups/${f.split('/')[0]}`, { recursive: true }); fs.writeFileSync(`setups/${f}.ett.json`, JSON.stringify({ v: 2, headphones: false, ...s }, null, 1)); }
  console.log(Object.keys(SETUPS).length, 'setups written');
}
