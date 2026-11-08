// Behavioural models of every functional block of the trainer.
// Numbers come from the Emona ETT-101 specification sheet (V1.1) and the ETT-101 / DATEx user manuals.
// Where the documents are silent or contradict each other the chosen value is marked "ASSUMED" (see SPEC.md).
import {
  FS, SOS, OnePole, HighPass1, AllPass1, lowpassFromProto, ELLIP_PROTO, ELLIP_DC,
  SOS_CHANNEL_BPF, SOS_BASEBAND, SOS_NOISE, NOISE_GAIN, SOS_SPEECH, gauss, rail, clamp, NoiseSrc, DecimLPF, DEC, butterProto, shapedNoise
} from './dsp.js';

export const BLK = 256;            // samples per processing block (53 us)
const BW_600K = 600e3;            // ETT-101 spec V1.1 bandwidth of adders, amplifier and multipliers
export const VTH = 1.5;            // digital input threshold (TTL)
const HI = 5, LO = 0;              // digital output levels
const us = x => Math.round(x * 1e-6 * FS);
const buf = () => new Float64Array(BLK);

// ---------------------------------------------------------------------------------------------
class Mod {
  constructor(id, sim) { this.id = id; this.sim = sim; this.out = {}; this.in = {}; this.conn = {}; this.p = {}; }
  outputs(...names) { for (const n of names) this.out[n] = buf(); }
  knob(name, v = 0.5) { this.p[name] = v; }
  set(name, v) { this.p[name] = v; if (this.onParam) this.onParam(name); }
}

// ===================== MASTER SIGNALS =====================
// 100 kHz sine/cos 4 Vpp, 100 kHz digital, 8.333 kHz digital, 2.083 kHz sine & digital (all synchronous)
const N2K = 2304; // samples per 2.0833 kHz cycle (= 48 carrier cycles)
const TAB = (() => {
  const s100 = new Float64Array(N2K), c100 = new Float64Array(N2K), d100 = new Float64Array(N2K),
    d8 = new Float64Array(N2K), d2 = new Float64Array(N2K), s2 = new Float64Array(N2K);
  for (let i = 0; i < N2K; i++) {
    const a = 2 * Math.PI * (i % 48) / 48;
    s100[i] = 2 * Math.sin(a); c100[i] = 2 * Math.cos(a);
    d100[i] = (i % 48) < 24 ? HI : LO;
    d8[i] = (i % 576) < 288 ? HI : LO;
    d2[i] = i < N2K / 2 ? HI : LO;
    s2[i] = 2 * Math.sin(2 * Math.PI * i / N2K);
  }
  return { s100, c100, d100, d8, d2, s2 };
})();
class Master extends Mod {
  constructor(id, sim) { super(id, sim); this.outputs('SINE100', 'COS100', 'DIG100', 'DIG8', 'DIG2', 'SINE2'); }
  process(n) {
    const o = this.out; let k = this.sim.t % N2K;
    for (let i = 0; i < n; i++, k = k === N2K - 1 ? 0 : k + 1) {
      o.SINE100[i] = TAB.s100[k]; o.COS100[i] = TAB.c100[k]; o.DIG100[i] = TAB.d100[k];
      o.DIG8[i] = TAB.d8[k]; o.DIG2[i] = TAB.d2[k]; o.SINE2[i] = TAB.s2[k];
    }
  }
}

// ===================== ADDER (variable gains, inverting) =====================
// OUT = -(G.A + g.B), 0 < G,g < 2 (ETT-101 user manual: "Note that gains G and g are negative"; Emona lab manual
// Exp.3: "the gain for the Adder module's A input -1"). Bandwidth approx. 600 kHz (ETT-101 spec V1.1) -> one pole.
class Adder extends Mod {
  constructor(id, sim) { super(id, sim); this.outputs('OUT'); this.knob('G', 0.5); this.knob('g', 0.5); this.bw = new OnePole(BW_600K); }
  process(n) {
    const A = this.in.A, B = this.in.B, o = this.out.OUT, G = 2 * this.p.G, g = 2 * this.p.g;
    for (let i = 0; i < n; i++) o[i] = -(G * A[i] + g * B[i]);
    this.bw.run(o, o, n); for (let i = 0; i < n; i++) o[i] = rail(o[i]);
  }
}

// ===================== ADDER 2 (fixed unity gains) – inside channel module =====================
// Fixed gain of 1, bandwidth approx. 600 kHz (ETT-101 spec V1.1)
class Adder2 extends Mod {
  constructor(id, sim) { super(id, sim); this.outputs('OUT'); this.bw = new OnePole(BW_600K); }
  process(n) { const a = this.in.NOISE, b = this.in.SIGNAL, o = this.out.OUT; for (let i = 0; i < n; i++) o[i] = a[i] + b[i]; this.bw.run(o, o, n); for (let i = 0; i < n; i++) o[i] = rail(o[i]); }
}

// ===================== MULTIPLIER  out = k.X.Y =====================
// ETT-101 spec V1.1: "Characteristic k.X(t).Y(t), k approx 1", bandwidth approx. 600 kHz.
// Consistent with the lab book: DSBSC (4 Vp-p x 4 Vp-p) is viewed at 2 V/div, and in DSBSC Part C the modulator
// overloads with the BUFFER at half travel. (The "approximately one half" sentence in the DATEx manual text is
// carried over from the older TIMS multiplier and contradicts the ETT-101 / DATEx spec tables.)
export const MULT_K = 1;
class Multiplier extends Mod {
  constructor(id, sim, withAC) {
    super(id, sim); this.withAC = withAC; this.outputs('KXY');
    if (withAC) { this.hx = new HighPass1(16); this.hy = new HighPass1(16); this.tx = buf(); this.ty = buf(); }
    this.bw = new OnePole(BW_600K);
  }
  process(n) {
    const o = this.out.KXY; let X = this.in.XDC, Y = this.in.YDC;
    if (this.withAC) {
      const tx = this.tx, ty = this.ty;
      if (this.conn.XAC) this.hx.run(this.in.XAC, tx, n); else tx.fill(0);
      if (this.conn.YAC) this.hy.run(this.in.YAC, ty, n); else ty.fill(0);
      for (let i = 0; i < n; i++) o[i] = MULT_K * (X[i] + tx[i]) * (Y[i] + ty[i]);
    } else for (let i = 0; i < n; i++) o[i] = MULT_K * X[i] * Y[i];
    this.bw.run(o, o, n); for (let i = 0; i < n; i++) o[i] = rail(o[i]);
  }
}

// ===================== BUFFER (amplifier, headphone driver) =====================
// Gain 0..10 (ETT-101 user manual), bandwidth DC to approx. 600 kHz (spec V1.1). INVERTING: Lab manual Vol.2 Exp.12
// and Exp.13 use the Buffer "to invert the message so that it's in phase with the Integrator's output".
// The GAIN pot is the headphone volume control -> audio (log) taper; this also matches the lab book (DSBSC Part C:
// no overload at 1/4 travel, overload at 1/2 travel).
class Buffer extends Mod {
  constructor(id, sim) { super(id, sim); this.outputs('OUT'); this.knob('GAIN', 0.3); this.bw = new OnePole(BW_600K); }
  gain() { return 10 * this.p.GAIN * this.p.GAIN; }
  process(n) { const x = this.in.IN, o = this.out.OUT, g = this.gain(); for (let i = 0; i < n; i++) o[i] = -g * x[i]; this.bw.run(o, o, n); for (let i = 0; i < n; i++) o[i] = rail(o[i]); }
}

// ===================== NOISE GENERATOR (white 10 Hz..240 kHz; 4.8 / 2.4 / 0.48 Vrms) =====================
class Noise extends Mod {
  constructor(id, sim) { super(id, sim); this.outputs('N0', 'N6', 'N20'); this.tab = shapedNoise(); this.i = (Math.random() * this.tab.length) | 0; }
  process(n) {
    const T = this.tab, M = T.length - 1, a = this.out.N0, b = this.out.N6, c = this.out.N20; let i = this.i;
    for (let k = 0; k < n; k++, i = (i + 1) & M) { const v = 4.8 * T[i]; a[k] = v > 11 ? 11 : v < -11 ? -11 : v; b[k] = 0.5 * v; c[k] = 0.1 * v; }
    this.i = (i + ((Math.random() * 65536) | 0)) & M;
  }
}

// ===================== CHANNEL MODULE =====================
class Channel extends Mod {
  constructor(id, sim) { super(id, sim); this.outputs('BPF', 'BB'); this.bpf = new SOS(SOS_CHANNEL_BPF); this.bb = new DecimLPF(lowpassFromProto(butterProto(4), 1.6e3, FS / DEC, 0.9)); }
  process(n) {
    if (this.conn.BPF_IN) { this.bpf.run(this.in.BPF_IN, this.out.BPF, n); const o = this.out.BPF; for (let i = 0; i < n; i++) o[i] = rail(o[i]); } else this.out.BPF.fill(0);
    if (this.conn.BB_IN) this.bb.run(this.in.BB_IN, this.out.BB, n); else this.out.BB.fill(0);
  }
}

// ===================== PHASE SHIFTER =====================
// Two cascaded first-order all-pass sections -> phase -4.atan(w.tau); knob sets the shift at the range centre
// frequency (2.083 kHz LO / 100 kHz HI) from ~5 deg to ~175 deg. 180 deg switch inverts. Range auto-detect at 40 kHz.
class PhaseShifter extends Mod {
  constructor(id, sim) {
    super(id, sim); this.outputs('OUT'); this.knob('PHASE', 0.5); this.p.INV = 0;
    this.a1 = new AllPass1(); this.a2 = new AllPass1(); this.range = 'LO';
    this.cnt = 0; this.cross = 0; this.state = 0; this.update();
  }
  phaseDeg() { return 5 + 170 * this.p.PHASE; }
  update() {
    const f0 = this.range === 'HI' ? 100e3 : 2083.33;
    const tau = Math.tan(this.phaseDeg() / 4 * Math.PI / 180) / (2 * Math.PI * f0);
    this.a1.setTau(tau); this.a2.setTau(tau);
  }
  onParam() { this.update(); }
  get led() { return this.range === 'LO'; }
  process(n) {
    const x = this.in.IN, o = this.out.OUT;
    // frequency detector (zero crossings with hysteresis) over 4 ms windows
    let st = this.state, cr = this.cross;
    for (let i = 0; i < n; i++) { const v = x[i]; if (st === 0 && v > 0.05) { st = 1; cr++; } else if (st === 1 && v < -0.05) st = 0; }
    this.state = st; this.cross = cr; this.cnt += n;
    if (this.cnt >= 19200) {
      const f = this.cross / (this.cnt / FS); const r = f > 40e3 ? 'HI' : 'LO';
      if (r !== this.range) { this.range = r; this.update(); }
      this.cnt = 0; this.cross = 0;
    }
    this.a1.run(x, o, n); this.a2.run(o, o, n);
    if (this.p.INV) for (let i = 0; i < n; i++) o[i] = -o[i];
  }
}

// ===================== UTILITIES =====================
// Comparator hysteresis: Emona DxIQ-45G user manual (same Utilities comparator), "IN Hysteresis Voltage approx. +/-50mV"
const COMP_HYS = 0.05;
class Utilities extends Mod {
  constructor(id, sim) {
    super(id, sim); this.outputs('COMP', 'RECT', 'DIODE', 'RC');
    this.rectBW = new OnePole(100e3); /* spec: RECTIFIER bandwidth DC to 100 kHz */ this.dv = 0; /* DIODE & RC LPF state (capacitor voltage) */ this.rcLP = new OnePole(2.6e3);
    this.cst = 0; this.drift = 0; this.tmp = buf(); this.compTr = new OnePole(0.35 / 500e-9); /* spec: TTL output rise time 500 ns typ. */
  }
  process(n) {
    const o = this.out;
    // comparator (REF must be connected - a floating REF input wanders, as on the real board)
    if (this.conn.CIN || this.conn.REF) {
      const x = this.in.CIN, r = this.in.REF, fl = !this.conn.REF; let st = this.cst;
      for (let i = 0; i < n; i++) {
        let ref = r[i];
        if (fl) ref = this.drift + 0.02 * Math.sin(i * 0.37 + this.drift * 50);
        const d = x[i] - ref;
        if (st === 0 && d > COMP_HYS) st = 1; else if (st === 1 && d < -COMP_HYS) st = 0;
        o.COMP[i] = st ? HI : LO;
      }
      this.cst = st; this.compTr.run(o.COMP, o.COMP, n);
      if (!this.conn.REF) this.drift = Math.max(-0.8, Math.min(0.8, this.drift + 0.01 * gauss()));
    }
    // precision half-wave rectifier (bandwidth ~100 kHz)
    if (this.conn.RECT_IN) { const x = this.in.RECT_IN, t = this.tmp; for (let i = 0; i < n; i++) t[i] = x[i] > 0 ? x[i] : 0; this.rectBW.run(t, o.RECT, n); } else o.RECT.fill(0);
    // simple silicon diode followed by single-pole RC LPF (-3 dB 2.6 kHz)
    // DIODE & RC LPF = series diode into a parallel RC (a peak / envelope detector). The diode charges C quickly through
    // the source resistance, R discharges it with tau = RC (-3 dB 2.6 kHz, spec V1.1). This is what makes the lab manual's
    // "8 kHz sawtooth" (TWIN PULSE Q2 -> DIODE & RC LPF, Vol.2 Exp.9 Figure 5).
    if (this.conn.DIODE_IN) {
      const x = this.in.DIODE_IN, d = o.DIODE; let v = this.dv;
      for (let i = 0; i < n; i++) { v += DT_S * (diodeI(x[i] - v) / TAU_CHG - v / TAU_RC); d[i] = v; }
      this.dv = v;
    } else { o.DIODE.fill(0); this.dv = 0; }
    // single-pole RC LPF (-3 dB 2.6 kHz)
    if (this.conn.RC_IN) this.rcLP.run(this.in.RC_IN, o.RC, n); else o.RC.fill(0);
  }
}
// silicon diode into a resistive node: smooth knee around 0.6 V
// silicon diode forward characteristic (voltage beyond the ~0.6 V knee, smooth)
function diodeI(v) { const vt = 0.045, vd = 0.6; const x = (v - vd) / vt; return x > 30 ? v - vd : vt * Math.log1p(Math.exp(x)); }
const DT_S = 1 / FS, TAU_RC = 1 / (2 * Math.PI * 2.6e3);  // 61.2 us
const TAU_CHG = TAU_RC / 30;                                // charge through ~330 ohm source vs ~10 k discharge resistor (ASSUMED ratio)

// ===================== TUNEABLE LPF (8th order elliptic 600 Hz..12 kHz, gain 0..2, fc x100 clock) =====================
export const TLPF_MIN = 300, TLPF_MAX = 15e3;
class TuneableLPF extends Mod {
  constructor(id, sim) {
    super(id, sim); this.outputs('OUT', 'FC100'); this.knob('FC', 0.5); this.knob('GAIN', 0.5);
    this.f = new DecimLPF(lowpassFromProto(ELLIP_PROTO, this.fc(), FS / DEC, ELLIP_DC)); this.lastFc = this.fc(); this.ph = 0;
  }
  // Range: spec V1.1 table guarantees 600 Hz..12 kHz; the ETT-101 user manual gives the control range as 300 Hz..16 kHz and
  // the Emona lab manuals state the maximum cut-off is about 15 kHz (Vol.2 Exp.17 step 31, Exp.18 step 28; DATEx Vol.2
  // Exp.14 "fully clockwise gives 15kHz"). Model: 300 Hz..15 kHz, linear control (taper not documented).
  fc() { return TLPF_MIN + (TLPF_MAX - TLPF_MIN) * this.p.FC; }
  onParam(name) {
    if (name === 'FC') { const fc = this.fc(); if (Math.abs(fc - this.lastFc) / this.lastFc > 1e-3) { this.f.set(lowpassFromProto(ELLIP_PROTO, fc, FS / DEC, ELLIP_DC)); this.lastFc = fc; } }
  }
  process(n) {
    const o = this.out.OUT, g = 2 * this.p.GAIN;
    this.f.run(this.in.IN, o, n);
    for (let i = 0; i < n; i++) o[i] = rail(g * o[i]);
    const inc = 100 * this.lastFc / FS, c = this.out.FC100; let ph = this.ph;
    for (let i = 0; i < n; i++) { ph += inc; if (ph >= 1) ph -= 1; c[i] = ph < 0.5 ? HI : LO; }
    this.ph = ph;
  }
}

// ===================== VARIABLE DC =====================
class VariableDC extends Mod {
  constructor(id, sim) { super(id, sim); this.outputs('P5', 'VDC'); this.knob('VDC', 0.5); this.out.P5.fill(5); }
  volts() { return -2.5 + 5 * this.p.VDC; }
  process(n) { this.out.VDC.fill(this.volts(), 0, n); }
}

// ===================== SPEECH (electret microphone 300 Hz..3 kHz) =====================
class Speech extends Mod {
  constructor(id, sim) { super(id, sim); this.outputs('OUT'); this.f = new SOS(SOS_SPEECH); this.src = new NoiseSrc(); }
  process(n) {
    const o = this.out.OUT; this.sim.mic.pull(o, n);
    this.src.fill(o, n, 0.003, true); // electret self-noise
    this.f.run(o, o, n); for (let i = 0; i < n; i++) o[i] = rail(o[i]);
  }
}

// ===================== EXOR =====================
class Exor extends Mod {
  constructor(id, sim) { super(id, sim); this.outputs('OUT'); }
  process(n) { const a = this.in.A, b = this.in.B, o = this.out.OUT; for (let i = 0; i < n; i++) o[i] = ((a[i] > VTH) !== (b[i] > VTH)) ? HI : LO; }
}

// ===================== VCO =====================
// LO: 1..17 kHz, HI: 60..140 kHz (spec V1.1; FREQ control linear). Spec V1.1 (and TIMS VCO): "GAIN G.Vin : 1 < G < 2",
// input range -3 V..+3 V. f = f0 + K0*G*Vin. K0 is not published; the lab manuals bound it:
//   Vol.1 FM demod steps 14-17: GAIN is turned until +2 V gives 15 kHz from 10 kHz -> K0*G = 2.5 kHz/V with G <= 2 -> K0 >= 1.25 kHz/V
//   Vol.1 FSK steps 6-8: GAIN at half travel (G = 1.5), FREQ at a quarter (5 kHz), LINE CODE +-2 V in -> both tones must stay
//   above 0 Hz -> 5 kHz - 2 V * 1.5 * K0 > 0 -> K0 < 1.67 kHz/V.   Model: K0 = 1.3 kHz/V (LO), 13 kHz/V (HI, 10x, ASSUMED).
export const VCO_K0_LO = 1.3e3, VCO_K0_HI = 13e3;
export const VCO_DRIFT = 1e-4; // rms relative frequency wander (ASSUMED, see VCO)
class VCO extends Mod {
  constructor(id, sim) { super(id, sim); this.outputs('SINE', 'DIG'); this.knob('GAIN', 0.5); this.knob('FREQ', 0.5); this.p.HI = 0; this.ph = 0; this.drift = 0; this.seed = 0x2f6b1d; }
  // spec: LO 1..17 kHz, HI 60..140 kHz, linear control. A free-running oscillator is never exactly on frequency: its rest
  // frequency wanders slowly (ASSUMED 1e-4 rms, ~1.5 s), so a VCO used as a local carrier is never phase-locked to the
  // MASTER SIGNALS 100 kHz (Term 1 Exp 4 steps 33-38; the reason for carrier acquisition with a PLL, Term 2 Exp 8).
  f0() { return (this.p.HI ? 60e3 + 80e3 * this.p.FREQ : 1e3 + 16e3 * this.p.FREQ) * (1 + this.drift); }
  wander(n) { // Ornstein-Uhlenbeck step, seeded so every run of a setup is the same
    const rnd = () => { this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0; return (this.seed + 0.5) / 4294967296; };
    const g = Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd()), dt = n / FS, tau = 1.5, sd = VCO_DRIFT;
    this.drift += -this.drift * dt / tau + sd * Math.sqrt(2 * dt / tau) * g;
  }
  sens() { return (this.p.HI ? VCO_K0_HI : VCO_K0_LO) * (1 + this.p.GAIN); }
  process(n) {
    this.wander(n);
    const x = this.in.IN, f0 = this.f0(), k = this.sens(), s = this.out.SINE, d = this.out.DIG;
    const fmin = this.p.HI ? 1e3 : 50, fmax = this.p.HI ? 300e3 : 60e3; let ph = this.ph;
    for (let i = 0; i < n; i++) {
      const f = clamp(f0 + k * x[i], fmin, fmax);
      ph += f / FS; if (ph >= 1) ph -= 1;
      s[i] = 2 * Math.sin(2 * Math.PI * ph); d[i] = ph < 0.5 ? HI : LO;
    }
    this.ph = ph;
  }
}

// ===================== TWIN PULSE GENERATOR =====================
// Q1: width tw (5..40 us) from each CLK rising edge; Q2: same width, delayed td (50..300 us) after Q1. Non-retriggerable.
class TwinPulse extends Mod {
  constructor(id, sim) { super(id, sim); this.outputs('Q1', 'Q2'); this.knob('WIDTH', 0.5); this.knob('DELAY', 0.5); this.last = 0; this.q1 = 0; this.dl = 0; this.q2 = 0; }
  tw() { return us(5 + 35 * this.p.WIDTH); }
  td() { return us(50 + 250 * this.p.DELAY); }
  process(n) {
    const c = this.in.CLK, a = this.out.Q1, b = this.out.Q2, tw = this.tw(), td = this.td();
    let last = this.last, q1 = this.q1, dl = this.dl, q2 = this.q2;
    for (let i = 0; i < n; i++) {
      const lv = c[i] > VTH ? 1 : 0;
      if (lv && !last) { if (q1 <= 0) q1 = tw; if (dl <= 0 && q2 <= 0) dl = td; }
      last = lv;
      a[i] = q1 > 0 ? HI : LO; if (q1 > 0) q1--;
      if (dl > 0) { dl--; if (dl === 0) q2 = tw; }
      b[i] = q2 > 0 ? HI : LO; if (q2 > 0) q2--;
    }
    this.last = last; this.q1 = q1; this.dl = dl; this.q2 = q2;
  }
}

// ===================== DUAL ANALOG SWITCH + SAMPLE & HOLD =====================
class DualSwitch extends Mod {
  // spec V1.1: analog input bandwidth 50 kHz (modelled as one pole on each analog input), CONTROL digital-level only
  constructor(id, sim) { super(id, sim); this.outputs('SH', 'OUT'); this.hold = 0; this.last = 0; this.bw = [new OnePole(50e3), new OnePole(50e3), new OnePole(50e3)]; this.t = [buf(), buf(), buf()]; }
  process(n) {
    const [i1, i2, sh] = [this.in.IN1, this.in.IN2, this.in.SHIN].map((x, k) => { this.bw[k].run(x, this.t[k], n); return this.t[k]; });
    const c1 = this.in.C1, c2 = this.in.C2, o = this.out.OUT, h = this.out.SH;
    let last = this.last, hold = this.hold;
    for (let i = 0; i < n; i++) {
      const l1 = c1[i] > VTH;
      if (l1 && !last) hold = sh[i];
      last = l1; h[i] = hold;
      o[i] = (l1 ? i1[i] : 0) + (c2[i] > VTH ? i2[i] : 0);
    }
    this.last = last ? 1 : 0; this.hold = hold;
  }
}

// ===================== SEQUENCE GENERATOR + LINE CODE ENCODER =====================
// X: 31-bit m-sequence, Y: 255-bit m-sequence, SYNC marks start of X. Line code from X: 00 NRZ-L, 01 Bi-phase, 10 RZ-AMI, 11 NRZ-M
// LINE CODE level: +-2 V. Spec V1.1 says "Output LINE-CODE signal +/-2Vp-p"; the Emona DATEx user manual (same encoder)
// spells it out: "either bipolar, +2V and -2V, or tri-level, +2V, 0V and -2V".
const LC_A = 2;
class SequenceGen extends Mod {
  constructor(id, sim) {
    super(id, sim); this.outputs('LINE', 'SYNC', 'X', 'Y'); this.p.S1 = 0; this.p.S2 = 0;
    this.sx = 0b11111; this.sy = 0xff; this.bitX = 1; this.bitY = 1; this.sync = 0; this.last = 0; this.ami = 1; this.nrzm = 1;
  }
  clock() {
    // X: x^5 + x^3 + 1 ; Y: x^8 + x^6 + x^5 + x^4 + 1
    const bx = ((this.sx >> 4) ^ (this.sx >> 2)) & 1; this.sx = ((this.sx << 1) | bx) & 31; this.bitX = this.sx & 1;
    const by = ((this.sy >> 7) ^ (this.sy >> 5) ^ (this.sy >> 4) ^ (this.sy >> 3)) & 1; this.sy = ((this.sy << 1) | by) & 255; this.bitY = this.sy & 1;
    this.sync = this.sx === 0b11111 ? 1 : 0;
    if (this.bitX) { this.ami = -this.ami; this.nrzm = -this.nrzm; }
  }
  process(n) {
    const c = this.in.CLK, o = this.out, code = this.p.S1 * 2 + this.p.S2; let last = this.last;
    for (let i = 0; i < n; i++) {
      const lv = c[i] > VTH ? 1 : 0;
      if (lv && !last) this.clock();
      last = lv;
      o.X[i] = this.bitX ? HI : LO; o.Y[i] = this.bitY ? HI : LO; o.SYNC[i] = this.sync ? HI : LO;
      const b = this.bitX;
      let v;
      if (code === 0) v = b ? LC_A : -LC_A;
      else if (code === 1) v = (b ? 1 : -1) * (lv ? LC_A : -LC_A);
      else if (code === 2) v = b && lv ? LC_A * this.ami : 0;
      else v = LC_A * this.nrzm;
      o.LINE[i] = v;
    }
    this.last = last;
  }
}

// ===================== DIVIDER (/1 /2 /4 /8) =====================
class Divider extends Mod {
  constructor(id, sim) { super(id, sim); this.outputs('OUT'); this.p.S1 = 0; this.p.S2 = 0; this.cnt = 0; this.last = 0; this.state = 0; }
  process(n) {
    const x = this.in.IN, o = this.out.OUT, N = 1 << (this.p.S1 * 2 + this.p.S2);
    let last = this.last, cnt = this.cnt, st = this.state;
    for (let i = 0; i < n; i++) {
      const lv = x[i] > VTH ? 1 : 0;
      if (N === 1) { o[i] = lv ? HI : LO; last = lv; continue; }
      if (lv && !last) { cnt++; if (cnt >= N / 2) { cnt = 0; st ^= 1; } }
      last = lv; o[i] = st ? HI : LO;
    }
    this.last = last; this.cnt = cnt; this.state = st;
  }
}

// ===================== PCM ENCODER (8-bit offset binary, +/-2 V) =====================
class PCMEncoder extends Mod {
  constructor(id, sim) { super(id, sim); this.outputs('FS', 'DATA'); this.p.TDM = 0; this.bit = 7; this.code = 128; this.ch = 1; this.last = 0; }
  process(n) {
    const c = this.in.CLK, x1 = this.in.IN1, x2 = this.in.IN2, o = this.out; let last = this.last;
    for (let i = 0; i < n; i++) {
      const lv = c[i] > VTH ? 1 : 0;
      if (lv && !last) {
        this.bit = (this.bit + 1) % 8;
        if (this.bit === 0) {
          this.ch = this.p.TDM ? (this.ch === 1 ? 2 : 1) : 1;
          const v = this.ch === 1 ? x1[i] : x2[i];
          this.code = clamp(Math.round((v + 2) / 4 * 255), 0, 255);
        }
      }
      last = lv;
      o.DATA[i] = (this.code >> (7 - this.bit)) & 1 ? HI : LO;
      o.FS[i] = (this.bit === 7 && this.ch === 1) ? HI : LO;
    }
    this.last = last;
  }
}

// ===================== PCM DECODER =====================
class PCMDecoder extends Mod {
  constructor(id, sim) { super(id, sim); this.outputs('OUT1', 'OUT2'); this.reg = 0; this.since = 0; this.period = 8; this.v1 = 0; this.v2 = 0; this.last = 0; }
  get led() { return this.period === 16; }
  process(n) {
    const c = this.in.CLK, d = this.in.DATA, f = this.in.FS, o = this.out; let last = this.last;
    for (let i = 0; i < n; i++) {
      const lv = c[i] > VTH ? 1 : 0;
      if (!lv && last) { // falling edge: centre of the bit
        this.reg = ((this.reg << 1) | (d[i] > VTH ? 1 : 0)) & 255; this.since++;
        if (f[i] > VTH) { if (this.since === 8 || this.since === 16) this.period = this.since; this.since = 0; this.v1 = this.reg / 255 * 4 - 2; }
        else if (this.period === 16 && this.since === 8) this.v2 = this.reg / 255 * 4 - 2;
        if (this.since > 64) this.since = 64;
      }
      last = lv; o.OUT1[i] = this.v1; o.OUT2[i] = this.v2;
    }
    this.last = last;
  }
}

// ===================== SERIAL TO PARALLEL =====================
// Bipolar outputs +-2 V (spec V1.1). Polarity: logic 1 -> -2 V, logic 0 -> +2 V. Not stated in any document; it is the
// only polarity with which the lab manual's delta and delta-sigma modulators (Vol.2 Exp.16/17, S2P used as the Sampler)
// form a negative-feedback loop, given the inverting ADDER (spec) and the comparator (HIGH when IN > REF, which Vol.1
// ASK Part C needs: the restored data equals the original).
class SerialToParallel extends Mod {
  constructor(id, sim) { super(id, sim); this.outputs('X1', 'X2'); this.ph = 0; this.a = 0; this.x1 = 2; this.x2 = 2; this.last = 0; }
  process(n) {
    const c = this.in.CLK, s = this.in.SERIAL, o = this.out; let last = this.last;
    for (let i = 0; i < n; i++) {
      const lv = c[i] > VTH ? 1 : 0;
      if (lv && !last) { const b = s[i] > VTH ? 1 : 0; if (this.ph === 0) this.a = b; else { this.x1 = this.a ? -2 : 2; this.x2 = b ? -2 : 2; } this.ph ^= 1; }
      last = lv; o.X1[i] = this.x1; o.X2[i] = this.x2;
    }
    this.last = last;
  }
}

// ---------------------------------------------------------------------------------------------
// Socket table: id -> [module, port, dir, kind]   dir: in/out/gnd   kind: a (analog, round) / d (digital, square)
export const SOCKETS = {
  'adder.A': ['adder', 'A', 'in', 'a'], 'adder.B': ['adder', 'B', 'in', 'a'], 'adder.OUT': ['adder', 'OUT', 'out', 'a'],
  'mult1.XDC': ['mult1', 'XDC', 'in', 'a'], 'mult1.XAC': ['mult1', 'XAC', 'in', 'a'], 'mult1.YDC': ['mult1', 'YDC', 'in', 'a'], 'mult1.YAC': ['mult1', 'YAC', 'in', 'a'], 'mult1.KXY': ['mult1', 'KXY', 'out', 'a'],
  'mult2.XDC': ['mult2', 'XDC', 'in', 'a'], 'mult2.YDC': ['mult2', 'YDC', 'in', 'a'], 'mult2.KXY': ['mult2', 'KXY', 'out', 'a'],
  'tpg.CLK': ['tpg', 'CLK', 'in', 'd'], 'tpg.Q1': ['tpg', 'Q1', 'out', 'd'], 'tpg.Q2': ['tpg', 'Q2', 'out', 'd'],
  'das.SHIN': ['das', 'SHIN', 'in', 'a'], 'das.SH': ['das', 'SH', 'out', 'a'], 'das.IN1': ['das', 'IN1', 'in', 'a'], 'das.C1': ['das', 'C1', 'in', 'd'], 'das.C2': ['das', 'C2', 'in', 'd'], 'das.IN2': ['das', 'IN2', 'in', 'a'], 'das.OUT': ['das', 'OUT', 'out', 'a'],
  'noise.N0': ['noise', 'N0', 'out', 'a'], 'noise.N6': ['noise', 'N6', 'out', 'a'], 'noise.N20': ['noise', 'N20', 'out', 'a'],
  'buffer.IN': ['buffer', 'IN', 'in', 'a'], 'buffer.OUT': ['buffer', 'OUT', 'out', 'a'],
  'channel.BPF_IN': ['channel', 'BPF_IN', 'in', 'a'], 'channel.BPF': ['channel', 'BPF', 'out', 'a'], 'channel.BB_IN': ['channel', 'BB_IN', 'in', 'a'], 'channel.BB': ['channel', 'BB', 'out', 'a'],
  'adder2.NOISE': ['adder2', 'NOISE', 'in', 'a'], 'adder2.SIGNAL': ['adder2', 'SIGNAL', 'in', 'a'], 'adder2.OUT': ['adder2', 'OUT', 'out', 'a'],
  'phase.IN': ['phase', 'IN', 'in', 'a'], 'phase.OUT': ['phase', 'OUT', 'out', 'a'],
  'util.REF': ['util', 'REF', 'in', 'a'], 'util.CIN': ['util', 'CIN', 'in', 'a'], 'util.COMP': ['util', 'COMP', 'out', 'd'],
  'util.RECT_IN': ['util', 'RECT_IN', 'in', 'a'], 'util.RECT': ['util', 'RECT', 'out', 'a'],
  'util.DIODE_IN': ['util', 'DIODE_IN', 'in', 'a'], 'util.DIODE': ['util', 'DIODE', 'out', 'a'],
  'util.RC_IN': ['util', 'RC_IN', 'in', 'a'], 'util.RC': ['util', 'RC', 'out', 'a'],
  'tlpf.FC100': ['tlpf', 'FC100', 'out', 'd'], 'tlpf.IN': ['tlpf', 'IN', 'in', 'a'], 'tlpf.OUT': ['tlpf', 'OUT', 'out', 'a'],
  'gnd1': [null, 'GND', 'gnd', 'a'], 'gnd2': [null, 'GND', 'gnd', 'a'], 'vdc.GND': [null, 'GND', 'gnd', 'a'],
  'vdc.P5': ['vdc', 'P5', 'out', 'd'], 'vdc.VDC': ['vdc', 'VDC', 'out', 'a'],
  'speech.OUT': ['speech', 'OUT', 'out', 'a'],
  'exor.A': ['exor', 'A', 'in', 'd'], 'exor.B': ['exor', 'B', 'in', 'd'], 'exor.OUT': ['exor', 'OUT', 'out', 'd'],
  'vco.DIG': ['vco', 'DIG', 'out', 'd'], 'vco.IN': ['vco', 'IN', 'in', 'a'], 'vco.SINE': ['vco', 'SINE', 'out', 'a'],
  'seq.LINE': ['seq', 'LINE', 'out', 'a'], 'seq.SYNC': ['seq', 'SYNC', 'out', 'd'], 'seq.X': ['seq', 'X', 'out', 'd'], 'seq.Y': ['seq', 'Y', 'out', 'd'], 'seq.CLK': ['seq', 'CLK', 'in', 'd'],
  'div.IN': ['div', 'IN', 'in', 'd'], 'div.OUT': ['div', 'OUT', 'out', 'd'],
  'pcmenc.IN2': ['pcmenc', 'IN2', 'in', 'a'], 'pcmenc.FS': ['pcmenc', 'FS', 'out', 'd'], 'pcmenc.IN1': ['pcmenc', 'IN1', 'in', 'a'], 'pcmenc.CLK': ['pcmenc', 'CLK', 'in', 'd'], 'pcmenc.DATA': ['pcmenc', 'DATA', 'out', 'd'],
  'master.SINE100': ['master', 'SINE100', 'out', 'a'], 'master.COS100': ['master', 'COS100', 'out', 'a'], 'master.DIG100': ['master', 'DIG100', 'out', 'd'],
  'master.DIG8': ['master', 'DIG8', 'out', 'd'], 'master.DIG2': ['master', 'DIG2', 'out', 'd'], 'master.SINE2': ['master', 'SINE2', 'out', 'a'],
  'mult3.XDC': ['mult3', 'XDC', 'in', 'a'], 'mult3.YDC': ['mult3', 'YDC', 'in', 'a'], 'mult3.KXY': ['mult3', 'KXY', 'out', 'a'],
  's2p.SERIAL': ['s2p', 'SERIAL', 'in', 'd'], 's2p.X1': ['s2p', 'X1', 'out', 'a'], 's2p.CLK': ['s2p', 'CLK', 'in', 'd'], 's2p.X2': ['s2p', 'X2', 'out', 'a'],
  'pcmdec.FS': ['pcmdec', 'FS', 'in', 'd'], 'pcmdec.DATA': ['pcmdec', 'DATA', 'in', 'd'], 'pcmdec.OUT2': ['pcmdec', 'OUT2', 'out', 'a'], 'pcmdec.CLK': ['pcmdec', 'CLK', 'in', 'd'], 'pcmdec.OUT1': ['pcmdec', 'OUT1', 'out', 'a'],
};

export function createModules(sim) {
  const m = {
    master: new Master('master', sim), adder: new Adder('adder', sim), adder2: new Adder2('adder2', sim),
    mult1: new Multiplier('mult1', sim, true), mult2: new Multiplier('mult2', sim, false), mult3: new Multiplier('mult3', sim, false),
    buffer: new Buffer('buffer', sim), noise: new Noise('noise', sim), channel: new Channel('channel', sim), phase: new PhaseShifter('phase', sim),
    util: new Utilities('util', sim), tlpf: new TuneableLPF('tlpf', sim), vdc: new VariableDC('vdc', sim), speech: new Speech('speech', sim),
    exor: new Exor('exor', sim), vco: new VCO('vco', sim), tpg: new TwinPulse('tpg', sim), das: new DualSwitch('das', sim),
    seq: new SequenceGen('seq', sim), div: new Divider('div', sim), pcmenc: new PCMEncoder('pcmenc', sim), pcmdec: new PCMDecoder('pcmdec', sim),
    s2p: new SerialToParallel('s2p', sim),
  };
  return m;
}
