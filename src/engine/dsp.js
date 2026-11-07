// DSP primitives for the simulator. All signals are float64 voltages at FS samples/second.
import FD from './filterdata.js';

export const FS = FD.FS;          // 4.8 MHz -> 100 kHz carrier = exactly 48 samples / cycle
export const DT = 1 / FS;

// ---------- Second-order sections, transposed direct form II (double precision) ----------
export class SOS {
  constructor(sections) { this.set(sections); }
  set(sections) {
    // sections: [[b0,b1,b2,a0,a1,a2], ...]
    const n = sections.length;
    const old = this.z;
    this.n = n;
    this.c = new Float64Array(n * 5);
    for (let i = 0; i < n; i++) {
      const s = sections[i], a0 = s[3];
      this.c[i * 5] = s[0] / a0; this.c[i * 5 + 1] = s[1] / a0; this.c[i * 5 + 2] = s[2] / a0;
      this.c[i * 5 + 3] = s[4] / a0; this.c[i * 5 + 4] = s[5] / a0;
    }
    // Direct form I: the state is the section's own past inputs and outputs (real signal values), so a coefficient change
    // (turning the TUNEABLE LPF knob) continues smoothly instead of producing the large transient a DF-II state gives.
    this.z = (old && old.length === n * 4) ? old : new Float64Array(n * 4);
  }
  reset() { this.z.fill(0); }
  // process src -> dst (may be same array)
  run(src, dst, len) {
    const c = this.c, z = this.z, n = this.n;
    for (let i = 0; i < len; i++) {
      let x = src[i];
      for (let s = 0, ci = 0, zi = 0; s < n; s++, ci += 5, zi += 4) {
        const y = c[ci] * x + c[ci + 1] * z[zi] + c[ci + 2] * z[zi + 1] - c[ci + 3] * z[zi + 2] - c[ci + 4] * z[zi + 3];
        z[zi + 1] = z[zi]; z[zi] = x; z[zi + 3] = z[zi + 2]; z[zi + 2] = y;
        x = y;
      }
      dst[i] = x;
    }
  }
}

// ---------- complex helpers ----------
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };

// Analog prototype (zpk, normalized to 1 rad/s) -> digital SOS lowpass with cutoff fc (prewarped bilinear)
export function lowpassFromProto(proto, fc, fs = FS, dcGain = 1) {
  const wa = 2 * fs * Math.tan(Math.PI * fc / fs);
  const fs2 = 2 * fs;
  const z = proto.z.map(c => [c[0] * wa, c[1] * wa]);
  const p = proto.p.map(c => [c[0] * wa, c[1] * wa]);
  const bl = c => cdiv([fs2 + c[0], c[1]], [fs2 - c[0], -c[1]]);
  const zd = z.map(bl), pd = p.map(bl);
  while (zd.length < pd.length) zd.push([-1, 0]);
  // keep only upper-half-plane members, pair poles (sorted by |p|, closest to unit circle last) with nearest zeros
  const up = a => a.filter(c => c[1] > 1e-12);
  const pu = up(pd).sort((a, b) => Math.hypot(...a) - Math.hypot(...b));
  let zu = up(zd); const zreal = zd.filter(c => Math.abs(c[1]) <= 1e-12);
  // real zeros (e.g. at -1) come in pairs
  for (let i = 0; i + 1 < zreal.length; i += 2) zu.push(['pair', zreal[i][0], zreal[i + 1][0]]);
  const sections = [];
  for (const pp of pu) {
    // nearest remaining zero
    let bi = 0, bd = 1e9;
    zu.forEach((zz, i) => { const zc = zz[0] === 'pair' ? [zz[1], 0] : zz; const d = Math.hypot(zc[0] - pp[0], zc[1] - pp[1]); if (d < bd) { bd = d; bi = i; } });
    const zz = zu.splice(bi, 1)[0];
    let b;
    if (zz === undefined) b = [1, 2, 1];
    else if (zz[0] === 'pair') b = [1, -(zz[1] + zz[2]), zz[1] * zz[2]];
    else b = [1, -2 * zz[0], zz[0] * zz[0] + zz[1] * zz[1]];
    const a = [1, -2 * pp[0], pp[0] * pp[0] + pp[1] * pp[1]];
    // normalize section to unity DC gain
    const g = (a[0] + a[1] + a[2]) / (b[0] + b[1] + b[2]);
    sections.push([b[0] * g, b[1] * g, b[2] * g, a[0], a[1], a[2]]);
  }
  sections[0][0] *= dcGain; sections[0][1] *= dcGain; sections[0][2] *= dcGain;
  return sections;
}

// Tuneable LPF prototype: 8th-order elliptic, 0.3 dB ripple, 60 dB stopband (MAX740x-style, meets Emona spec)
export const ELLIP_PROTO = FD.ellipProto;
export const ELLIP_DC = Math.pow(10, -0.3 / 20); // even-order elliptic: DC sits at the bottom of the ripple
export const SOS_CHANNEL_BPF = FD.bpf;   // 6th-order Chebyshev I, 0.1 dB, 88-112 kHz, gain 1
export const SOS_BASEBAND = FD.bb;       // 4th-order Butterworth, 1.6 kHz, gain 0.9
export const SOS_NOISE = FD.noise;       // shaping for white noise 10 Hz .. 240 kHz
export const NOISE_GAIN = FD.noiseGain;
export const SOS_SPEECH = FD.speech;     // microphone 300 Hz .. 3 kHz

// One-pole lowpass (RC), exact discretisation (impulse invariant on step)
export class OnePole {
  constructor(fc) { this.set(fc); this.y = 0; }
  set(fc) { this.a = Math.exp(-2 * Math.PI * fc / FS); }
  run(src, dst, len) { let y = this.y; const a = this.a, b = 1 - a; for (let i = 0; i < len; i++) { y = a * y + b * src[i]; dst[i] = y; } this.y = y; }
}

// First-order highpass (AC coupling)
export class HighPass1 {
  constructor(fc) { this.a = Math.exp(-2 * Math.PI * fc / FS); this.x1 = 0; this.y1 = 0; }
  run(src, dst, len) { let x1 = this.x1, y1 = this.y1; const a = this.a, g = (1 + a) / 2; for (let i = 0; i < len; i++) { const x = src[i]; const y = g * (x - x1) + a * y1; x1 = x; y1 = y; dst[i] = y; } this.x1 = x1; this.y1 = y1; }
}

// First-order analog all-pass (1 - s tau)/(1 + s tau) via bilinear transform. Unity gain, phase -2 atan(w tau)
export class AllPass1 {
  constructor() { this.x1 = 0; this.y1 = 0; this.c = 0; }
  setTau(tau) { const k = 2 * tau * FS; this.c = (1 - k) / (1 + k); }
  run(src, dst, len) { let x1 = this.x1, y1 = this.y1; const c = this.c; for (let i = 0; i < len; i++) { const x = src[i]; const y = c * x + x1 - c * y1; x1 = x; y1 = y; dst[i] = y; } this.x1 = x1; this.y1 = y1; }
}

// Fast Gaussian noise from a precomputed table (2^20 samples), read with random jumps between blocks
const GT_BITS = 20, GT = new Float32Array(1 << GT_BITS);
(() => { for (let i = 0; i < GT.length; i += 2) { let u = 0; while (u === 0) u = Math.random(); const v = Math.random(), r = Math.sqrt(-2 * Math.log(u)); GT[i] = r * Math.cos(2 * Math.PI * v); GT[i + 1] = r * Math.sin(2 * Math.PI * v); } })();
export class NoiseSrc {
  constructor() { this.i = (Math.random() * GT.length) | 0; }
  fill(dst, n, scale, add = false) {
    let i = this.i; const m = GT.length - 1;
    if (add) for (let k = 0; k < n; k++) { dst[k] += scale * GT[i]; i = (i + 1) & m; }
    else for (let k = 0; k < n; k++) { dst[k] = scale * GT[i]; i = (i + 1) & m; }
    this.i = (i + ((Math.random() * 4096) | 0)) & m;
  }
}
// Gaussian random (Box-Muller, cached) - for occasional use
let gSpare = null;
export function gauss() {
  if (gSpare !== null) { const v = gSpare; gSpare = null; return v; }
  let u = 0, v = 0; while (u === 0) u = Math.random(); v = Math.random();
  const r = Math.sqrt(-2 * Math.log(u)); gSpare = r * Math.sin(2 * Math.PI * v); return r * Math.cos(2 * Math.PI * v);
}

export const clamp = (x, lo, hi) => x < lo ? lo : x > hi ? hi : x;
// soft limiting of an op-amp output close to the +/-12V rails (linear up to ~10V)
export const RAIL = 11;
export function rail(x) { return x > RAIL ? RAIL : x < -RAIL ? -RAIL : x; }

// Frequency response of a digital SOS at frequency f (for tests)
export function sosResponse(sections, f, fs = FS) {
  const w = 2 * Math.PI * f / fs; const e1 = [Math.cos(-w), Math.sin(-w)], e2 = [Math.cos(-2 * w), Math.sin(-2 * w)];
  let h = [1, 0];
  for (const s of sections) {
    const num = [s[0] + s[1] * e1[0] + s[2] * e2[0], s[1] * e1[1] + s[2] * e2[1]];
    const den = [s[3] + s[4] * e1[0] + s[5] * e2[0], s[4] * e1[1] + s[5] * e2[1]];
    h = cmul(h, cdiv(num, den));
  }
  return h;
}

// Butterworth analog prototype (normalized 1 rad/s)
export function butterProto(n) { const p = []; for (let k = 0; k < n; k++) { const a = Math.PI * (2 * k + n + 1) / (2 * n); p.push([Math.cos(a), Math.sin(a)]); } return { z: [], p, k: 1 }; }

// Low-pass filter evaluated at FS/D: box-average decimation, SOS at the low rate, linear interpolation back to FS.
// Used for audio-band filters (fc <= 12 kHz) - same response in the passband, 8x less work.
export const DEC = 8;
export class DecimLPF {
  constructor(sections) { this.f = new SOS(sections); this.acc = 0; this.k = 0; this.y0 = 0; this.y1 = 0; this.one = new Float64Array(1); }
  set(sections) { this.f.set(sections); }
  run(src, dst, len) {
    let acc = this.acc, k = this.k, y0 = this.y0, y1 = this.y1; const one = this.one, f = this.f, inv = 1 / DEC;
    for (let i = 0; i < len; i++) {
      acc += src[i];
      if (++k === DEC) { one[0] = acc * inv; f.run(one, one, 1); y0 = y1; y1 = one[0]; acc = 0; k = 0; }
      dst[i] = y0 + (y1 - y0) * (k * inv);
    }
    this.acc = acc; this.k = k; this.y0 = y0; this.y1 = y1;
  }
}

// Pre-shaped noise table: white noise through the 10 Hz..240 kHz shaping filter, unit rms. Read with random jumps.
let SHAPED = null;
export function shapedNoise() {
  if (SHAPED) return SHAPED;
  const N = 1 << 21, t = new Float32Array(N), f = new SOS(FD.noise), b = new Float64Array(4096); const src = new NoiseSrc();
  for (let w = 0; w < 4; w++) { src.fill(b, 4096, 1); f.run(b, b, 4096); } // settle
  let sq = 0;
  for (let o = 0; o < N; o += 4096) { src.fill(b, 4096, 1); f.run(b, b, 4096); for (let i = 0; i < 4096; i++) { t[o + i] = b[i]; sq += b[i] * b[i]; } }
  const r = Math.sqrt(sq / N); for (let i = 0; i < N; i++) t[i] /= r;
  return (SHAPED = t);
}
