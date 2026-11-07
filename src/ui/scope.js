// Digital storage oscilloscope modelled on the UNI-T UTD2000 series front panel (12 x 8 divisions).
import { el } from './svg.js';
import { FS } from '../engine/dsp.js';
import { RING, RMASK } from '../engine/sim.js';

const VDIV = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20]; // 1 mV/div .. 20 V/div (UTD2000 manual)
const TDIV = [0.5e-6, 1e-6, 2e-6, 5e-6, 10e-6, 20e-6, 50e-6, 100e-6, 200e-6, 500e-6, 1e-3, 2e-3, 5e-3, 10e-3, 20e-3, 50e-3];
const PROBES = [1, 10, 100, 1000];
const COL = { CH1: '#f6e51d', CH2: '#3fd6f7', MATH: '#e070f5', REF: '#ffffff' };
const HDIV = 12, VDIVS = 8;
// screen geometry (canvas 800 x 480)
const GX = 34, GY = 38, GW = 600, GH = 400, PX = GW / HDIV;
const MX = 652, MW = 144;

const MEAS = ['Vpp', 'Vmax', 'Vmin', 'Vamp', 'Vavg', 'Vrms', 'Freq', 'Period', '+Width', '-Width', '+Duty', 'Rise', 'Fall'];

export function fmtV(v) { const a = Math.abs(v); if (a >= 1) return v.toFixed(a >= 10 ? 1 : 2) + 'V'; if (a >= 1e-3) return (v * 1e3).toFixed(a >= 0.1 ? 0 : 1) + 'mV'; return (v * 1e3).toFixed(2) + 'mV'; }
export function fmtT(t) { const a = Math.abs(t); if (a >= 1) return t.toFixed(2) + 's'; if (a >= 1e-3) return +(t * 1e3).toFixed(3) + 'ms'; if (a >= 1e-6) return +(t * 1e6).toFixed(2) + 'us'; return +(t * 1e9).toFixed(0) + 'ns'; }
export function fmtF(f) { if (!isFinite(f) || f <= 0) return '****'; if (f >= 1e6) return (f / 1e6).toFixed(4) + 'MHz'; if (f >= 1e3) return (f / 1e3).toFixed(3) + 'kHz'; return f.toFixed(2) + 'Hz'; }
const fmtDiv = t => { if (t >= 1e-3) return (t * 1e3) + 'ms'; if (t >= 1e-6) return +(t * 1e6).toFixed(2) + 'us'; return (t * 1e9) + 'ns'; };
const fmtVd = v => v >= 1 ? v.toFixed(2) + 'V' : (v * 1e3).toFixed(0) + 'mV';

export class Scope {
  constructor(root, sim, hooks) {
    this.sim = sim; this.hooks = hooks;
    this.X = 1248; this.Y = 40; this.S = 0.8; // placement in the workbench
    this.reset();
    this.g = el('g', { id: 'scope', transform: `translate(${this.X},${this.Y}) scale(${this.S})` }, root);
    this.drawPanel();
    this.frame = { CH1: null, CH2: null };
    this.lastTrig = null; this.avgBuf = {}; this.single = false;
    this.tmp = new Float64Array(1);
  }
  reset() {
    this.st = {
      ch: { CH1: { on: true, vd: 9, fine: 1, pos: 0, cpl: 'DC', bw: false, finemode: false, probe: 0, inv: false },
        CH2: { on: true, vd: 9, fine: 1, pos: 0, cpl: 'DC', bw: false, finemode: false, probe: 0, inv: false } },
      sel: 'CH1', td: 7, hpos: 0, zoom: false, ztd: 4, zpos: 0,
      trig: { src: 'CH1', slope: 'R', mode: 'AUTO', cpl: 'DC', level: 0 },
      run: true, acq: 'Sample', avgN: 16, disp: { type: 'Vectors', persist: 0, fmt: 'YT', grid: 'Dots' },
      math: { on: false, kind: 'FFT', op: '+', fftSrc: 'CH1', win: 'Hanning', dbdiv: 20, fpos: 0, unit: 'dBVrms', vrd: 7 },
      meas: { src: 'CH1', items: ['Vpp', 'Freq', null], all: false },
      cur: { type: 'Off', src: 'CH1', act: 'A', a: -3, b: 3 },
      ref: { on: false, data: null, ch: 'CH1' }, counter: true,
      menu: 'CH1',
    };
  }

  // ===================================== front panel =====================================
  bncPos(ch) { const p = { CH1: [990, 472], CH2: [1118, 472], EXT: [1250, 472] }[ch]; return [this.X + p[0] * this.S, this.Y + p[1] * this.S]; }
  drawPanel() {
    const g = this.g;
    el('rect', { x: 0, y: 0, width: 1400, height: 545, rx: 22, fill: 'url(#scopeBody)', stroke: '#9c978d', 'stroke-width': 2 }, g);
    el('rect', { x: 8, y: 8, width: 1384, height: 529, rx: 18, fill: 'none', stroke: 'rgba(255,255,255,.6)', 'stroke-width': 2 }, g);
    el('rect', { x: 902, y: 18, width: 486, height: 508, rx: 12, fill: 'url(#scopeRight)', stroke: '#b9b4aa', 'stroke-width': 1.5 }, g);
    // badge (no brand)
    el('rect', { x: 46, y: 26, width: 118, height: 30, rx: 3, fill: '#c9302c' }, g);
    el('text', { x: 105, y: 47, text: 'DSO', fill: '#fff', 'font-size': 19, 'font-weight': 800, 'text-anchor': 'middle', 'font-style': 'italic' }, g);
    el('text', { x: 178, y: 48, text: 'UTD2102CEL', fill: '#2a2a2a', 'font-size': 20, 'font-weight': 800, 'font-style': 'italic' }, g);
    el('text', { x: 370, y: 47, text: '100MHz    1GS/s', fill: '#2a2a2a', 'font-size': 15, 'font-weight': 700 }, g);
    el('rect', { x: 540, y: 30, width: 300, height: 24, rx: 2, fill: 'none', stroke: '#8a857c' }, g);
    el('text', { x: 690, y: 47, text: 'DIGITAL STORAGE OSCILLOSCOPE', fill: '#2a2a2a', 'font-size': 12.5, 'font-weight': 700, 'text-anchor': 'middle' }, g);
    // screen bezel + canvas
    el('rect', { x: 72, y: 66, width: 768, height: 456, rx: 10, fill: '#cfcbc3', stroke: '#9e998f', 'stroke-width': 2 }, g);
    el('rect', { x: 88, y: 78, width: 736, height: 432, rx: 4, fill: '#111', stroke: '#2a6fd0', 'stroke-width': 3 }, g);
    const fo = el('foreignObject', { x: 92, y: 82, width: 728, height: 424 }, g);
    const cv = document.createElement('canvas'); cv.width = 800; cv.height = 480; cv.style.width = '728px'; cv.style.height = '424px'; cv.style.display = 'block';
    fo.appendChild(cv); this.cv = cv; this.cx = cv.getContext('2d');
    this.pcv = document.createElement('canvas'); this.pcv.width = GW; this.pcv.height = GH; this.pcx = this.pcv.getContext('2d');
    // PrtSc + F keys
    this.button(872, 92, 'PrtSc', 'prtsc', 'round');
    for (let i = 0; i < 5; i++) this.button(872, 160 + i * 66, 'F' + (i + 1), 'F' + i, 'fkey');
    el('rect', { x: 852, y: 470, width: 40, height: 16, rx: 2, fill: '#2b2b2b', stroke: '#777' }, g);
    // right panel
    const L = (x, y, t, s = 11, w = 700) => el('text', { x, y, text: t, fill: '#2a2a2a', 'font-size': s, 'font-weight': w, 'text-anchor': 'middle' }, g);
    L(978, 46, 'MULTI PURPOSE', 10);
    this.knob(978, 98, 25, 'multi');
    [['MEASURE', 1080, 62], ['ACQUIRE', 1165, 62], ['STORAGE', 1250, 62], ['CURSOR', 1080, 110], ['DISPLAY', 1165, 110], ['UTILITY', 1250, 110]].forEach(([t, x, y]) => this.button(x, y, t, t));
    this.button(1340, 62, 'RUN/STOP', 'run', 'run'); this.button(1340, 110, 'AUTO', 'auto', 'auto');
    el('line', { x1: 912, y1: 140, x2: 1380, y2: 140, stroke: '#a49f95', 'stroke-width': 1.5 }, g);
    L(990, 160, 'VERTICAL', 13); L(1162, 160, 'HORIZONTAL', 13); L(1330, 160, 'TRIGGER', 13);
    L(990, 175, '⇕ POSITION', 9.5); L(1162, 175, '◄ POSITION ►', 9.5); L(1330, 175, '⇕ LEVEL', 9.5);
    el('line', { x1: 1075, y1: 150, x2: 1075, y2: 420, stroke: '#a49f95' }, g); el('line', { x1: 1250, y1: 150, x2: 1250, y2: 420, stroke: '#a49f95' }, g);
    this.knob(978, 208, 22, 'vpos'); this.knob(1150, 208, 22, 'hpos'); this.knob(1330, 212, 22, 'level');
    this.button(1042, 200, 'CH1', 'CH1', 'small'); this.button(1042, 244, 'CH2', 'CH2', 'small'); this.button(978, 256, 'MATH', 'MATH', 'small');
    L(978, 296, '⇔ SCALE', 9.5); this.knob(978, 350, 30, 'vscale');
    this.button(1150, 256, 'MENU', 'HMENU', 'small'); this.button(1216, 212, 'SET TO\nZERO', 'zero', 'tiny');
    L(1150, 296, '⇔ SCALE', 9.5); this.knob(1150, 350, 30, 'tscale');
    this.button(1330, 262, 'MENU', 'TMENU', 'small'); this.button(1330, 308, 'FORCE', 'force', 'small'); this.button(1330, 354, 'HELP', 'help', 'small');
    // BNC
    const bnc = (x, y, label, id, tag) => {
      L(x, y - 34, label, 12);
      if (tag) { el('rect', { x: x - 52, y: y - 10, width: 18, height: 18, fill: '#222' }, g); el('text', { x: x - 43, y: y + 4, text: tag, fill: '#fff', 'font-size': 12, 'font-weight': 700, 'text-anchor': 'middle' }, g); }
      const b = el('g', { 'data-bnc': id, class: 'bnc', transform: `translate(${x},${y})` }, g);
      el('circle', { r: 24, fill: 'url(#bncGrad)', stroke: '#6b6b6b', 'stroke-width': 2 }, b);
      el('circle', { r: 15, fill: '#3a3a3a', stroke: '#999', 'stroke-width': 1.5 }, b);
      el('circle', { r: 4, fill: '#d4b45a' }, b);
      el('circle', { r: 30, fill: 'transparent' }, b);
    };
    bnc(990, 472, 'CH1', 'CH1', 'X'); bnc(1118, 472, 'CH2', 'CH2', 'Y'); bnc(1250, 467, 'EXT TRIG', 'EXT');
    el('text', { x: 1185, y: 506, text: 'All inputs 1MΩ ≈15pF  300V CAT II', fill: '#555', 'font-size': 8.5, 'text-anchor': 'middle' }, g);
    el('rect', { x: 1342, y: 440, width: 8, height: 26, fill: '#c8c8c8', stroke: '#777' }, g); el('rect', { x: 1360, y: 450, width: 8, height: 26, fill: '#c8c8c8', stroke: '#777' }, g);
    L(1356, 492, 'PROBE COMP', 7.5); L(1356, 502, '≈3V 1kHz', 7.5);
  }
  setPlugged() { }

  button(x, y, label, id, kind) {
    const g = el('g', { class: 'sbtn', transform: `translate(${x},${y})` }, this.g);
    let shape;
    if (kind === 'round') { shape = el('circle', { r: 21, fill: 'url(#blueBtn)', stroke: '#244a8a', 'stroke-width': 1.5 }, g); }
    else {
      const w = kind === 'fkey' ? 44 : kind === 'small' ? 60 : kind === 'tiny' ? 54 : 72, h = kind === 'fkey' ? 34 : kind === 'tiny' ? 34 : 30;
      shape = el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 5, fill: 'url(#btnGrad)', stroke: '#6f6b64', 'stroke-width': 1.3 }, g);
    }
    { const w = kind === 'round' ? 50 : (kind === 'fkey' ? 44 : kind === 'small' ? 60 : kind === 'tiny' ? 54 : 72) + 10, h = kind === 'round' ? 50 : (kind === 'fkey' || kind === 'tiny' ? 34 : 30) + 10;
      el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: 'transparent' }, g); } // larger click target (5 px round the key)
    const lines = label.split('\n');
    lines.forEach((t, i) => el('text', { y: 4 + (i - (lines.length - 1) / 2) * 11, text: t, fill: kind === 'round' ? '#fff' : '#1d1d1d', 'font-size': kind === 'fkey' ? 12 : 10, 'font-weight': 800, 'text-anchor': 'middle' }, g));
    this.btnShapes = this.btnShapes || {}; this.btnShapes[id] = { shape, kind };
    g.addEventListener('pointerdown', e => { e.stopPropagation(); g.setAttribute('transform', `translate(${x},${y + 1.5})`); this.press(id); this.hooks.click(); });
    g.addEventListener('pointerup', () => g.setAttribute('transform', `translate(${x},${y})`));
    g.addEventListener('pointerleave', () => g.setAttribute('transform', `translate(${x},${y})`));
  }
  knob(x, y, r, id) {
    const g = el('g', { class: 'sknob', transform: `translate(${x},${y})` }, this.g);
    el('circle', { r: r + 4, fill: '#b9b5ad', stroke: '#8c877f' }, g);
    el('circle', { r, fill: 'url(#knobGrad)', stroke: '#9a958c', 'stroke-width': 1.5 }, g);
    const rot = el('g', {}, g);
    for (let i = 0; i < 24; i++) { const a = i * 15 * Math.PI / 180; el('line', { x1: Math.cos(a) * (r - 3), y1: Math.sin(a) * (r - 3), x2: Math.cos(a) * r, y2: Math.sin(a) * r, stroke: '#cfcac1', 'stroke-width': 1.2 }, rot); }
    el('circle', { r: r * 0.7, fill: 'url(#knobTop)', stroke: '#d5d0c6' }, g);
    el('circle', { r: r + 16, fill: 'transparent' }, g); // generous grab area
    let acc = 0, moved = false, ang = 0, last = null, cx = 0, cy = 0, lastT = 0;
    const turn = n => { const now = performance.now(); const fast = now - lastT < 45 ? 3 : 1; lastT = now; ang += n * 15; rot.setAttribute('transform', `rotate(${ang})`); this.turn(id, n, fast); };
    const step = 16; // screen px (or 18 deg of rotation) per detent
    const mv = e => {
      const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy);
      if (last) {
        const mx = e.clientX - last.x, my = e.clientY - last.y;
        let delta = mx - my; // right / up = clockwise
        if (last.d > 14) { const rx = (last.x - cx) / last.d, ry = (last.y - cy) / last.d; const tang = rx * my - ry * mx, rad = rx * mx + ry * my; if (Math.abs(tang) > Math.abs(rad)) delta = tang; } // moving around the knob = turning it
        acc += delta; if (Math.abs(acc) > 3) moved = true;
        while (Math.abs(acc) >= step) { turn(Math.sign(acc)); acc -= Math.sign(acc) * step; }
      }
      last = { x: e.clientX, y: e.clientY, a: Math.atan2(dy, dx), d };
    };
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); if (!moved) { this.push(id); this.hooks.click(); } };
    g.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const b = g.getBoundingClientRect(); cx = b.x + b.width / 2; cy = b.y + b.height / 2; last = null; mv(e); acc = 0; moved = false; window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); });
    g.addEventListener('wheel', e => { e.preventDefault(); e.stopPropagation(); turn(e.deltaY < 0 ? 1 : -1); }, { passive: false });
  }

  // ===================================== controls =====================================
  vd(ch) { const c = this.st.ch[ch]; return VDIV[c.vd] * c.fine * PROBES[c.probe]; }       // displayed V/div
  pf(ch) { return PROBES[this.st.ch[ch].probe]; }
  tdiv() { return TDIV[this.st.td]; }
  press(id) {
    const s = this.st;
    if (id === 'CH1' || id === 'CH2') {
      const c = s.ch[id];
      if (!c.on) { c.on = true; s.sel = id; s.menu = id; }
      else if (s.menu === id && s.sel === id) { c.on = false; const o = id === 'CH1' ? 'CH2' : 'CH1'; s.sel = s.ch[o].on ? o : id; s.menu = s.ch[o].on ? o : null; }
      else { s.sel = id; s.menu = id; }
    } else if (id === 'MATH') {
      if (s.menu === 'MATH' && s.math.on) { s.math.on = false; s.menu = null; s.sel = s.ch.CH1.on ? 'CH1' : 'CH2'; }
      else { s.math.on = true; s.menu = 'MATH'; s.sel = 'MATH'; }
    } else if (/^F\d$/.test(id)) { const m = this.menuDef(); const it = m && m.items[+id[1]]; if (it && it.f) it.f(); }
    else if (id === 'run') { s.run = !s.run; if (s.run) { this.single = false; this.frozen = null; } else if (this.lastTrigUsed) this.freeze(this.lastTrigUsed); }
    else if (id === 'auto') this.autoset();
    else if (id === 'zero') { if (s.zoom) s.zpos = 0; else s.hpos = 0; }
    else if (id === 'force') this.forceNext = true;
    else if (id === 'prtsc') this.hooks.screenshot(this.cv);
    else if (id === 'help') this.hooks.scopeHelp();
    else s.menu = s.menu === id ? null : id;
    this.hooks.changed();
  }
  push(id) {
    const s = this.st;
    if (id === 'vpos') { if (s.sel === 'MATH') s.math.fpos = 0; else s.ch[s.sel].pos = 0; }
    if (id === 'hpos') { if (s.zoom) s.zpos = 0; else s.hpos = 0; }
    if (id === 'level') this.level50();
    if (id === 'vscale' && s.sel !== 'MATH') { const c = s.ch[s.sel]; c.finemode = !c.finemode; if (!c.finemode) c.fine = 1; }
    if (id === 'multi' && s.menu === 'CURSOR') s.cur.act = s.cur.act === 'A' ? 'B' : s.cur.act === 'B' ? 'AB' : 'A';
  }
  turn(id, n, fast = 1) {
    const s = this.st;
    if (id === 'vscale') {
      if (s.sel === 'MATH') { if (s.math.kind === 'FFT' && s.math.unit === 'Vrms') s.math.vrd = Math.max(0, Math.min(VDIV.length - 1, (s.math.vrd ?? 7) - n)); else { const L = [1, 2, 5, 10, 20]; s.math.dbdiv = L[Math.max(0, Math.min(4, L.indexOf(s.math.dbdiv) - n))]; } }
      else { const c = s.ch[s.sel]; if (c.finemode) { c.fine = Math.max(0.4, Math.min(2.5, c.fine * (1 - 0.01 * n))); } else { c.vd = Math.max(0, Math.min(VDIV.length - 1, c.vd - n)); c.fine = 1; } }
    }
    if (id === 'vpos') { if (s.sel === 'MATH') s.math.fpos += n * 0.1 * fast; else { const c = s.ch[s.sel]; c.pos = Math.max(-10, Math.min(10, Math.round((c.pos + n * 0.1 * fast) * 50) / 50)); } }
    if (id === 'tscale') { if (s.zoom) s.ztd = Math.max(0, Math.min(s.td, s.ztd - n)); else { s.td = Math.max(0, Math.min(TDIV.length - 1, s.td - n)); if (s.ztd > s.td) s.ztd = s.td; } }
    if (id === 'hpos') { if (s.zoom) { const half = 6 * TDIV[s.td] - 6 * TDIV[s.ztd]; s.zpos = Math.max(-half, Math.min(half, s.zpos - n * fast * TDIV[s.ztd] / 5)); } else { s.hpos -= n * fast * this.tdiv() / 5; const lim = 0.35; s.hpos = Math.max(-lim, Math.min(lim, s.hpos)); if (Math.abs(s.hpos) < this.tdiv() / 50) s.hpos = 0; } }
    if (id === 'level') { const src = s.trig.src; const vd = src === 'CH1' || src === 'CH2' ? this.vd(src) : 0.2; s.trig.level += n * vd * 0.05 * fast; this.levelShow = performance.now(); }
    if (id === 'multi') {
      if (s.menu === 'CURSOR') { const k = n * 0.08 * fast; if (s.cur.act !== 'B') s.cur.a += k; if (s.cur.act !== 'A') s.cur.b += k; }
      else if (s.menu === 'ACQUIRE' && s.acq === 'Average') { const L = [2, 4, 8, 16, 32, 64, 128, 256]; s.avgN = L[Math.max(0, Math.min(7, L.indexOf(s.avgN) + n))]; }
    }
    this.hooks.changed();
  }
  level50() {
    const s = this.st, src = s.trig.src; if (src === 'LINE') return;
    const n = Math.min(RING / 2, Math.max(4800, Math.round(12 * this.tdiv() * FS * 2)));
    const r = this.ring(src), t = this.now(); let mx = -1e9, mn = 1e9, step = Math.max(1, Math.floor(n / 20000));
    for (let i = 0; i < n; i += step) { const v = r[(t - n + i) & RMASK]; if (v > mx) mx = v; if (v < mn) mn = v; }
    const pf = src === 'EXT' ? 1 : this.pf(src); s.trig.level = (mx + mn) / 2 * pf * (src !== 'EXT' && s.ch[src].inv ? -1 : 1);
    this.levelShow = performance.now();
  }

  autoset() {
    const s = this.st; s.run = true; this.single = false; this.frozen = null; s.zoom = false; s.math.on = false; s.disp.fmt = 'YT'; s.acq = 'Sample';
    let tf = 0;
    for (const ch of ['CH1', 'CH2']) {
      const r = this.sim.rings[ch], t = this.sim.t, n = 96000 * 2; let mx = -1e9, mn = 1e9, sum = 0;
      for (let i = 0; i < n; i += 4) { const v = r[(t - n + i) & RMASK]; if (v > mx) mx = v; if (v < mn) mn = v; sum += v; }
      const c = s.ch[ch]; const pp = (mx - mn) * this.pf(ch);
      if (this.sim.probes[ch] && pp > 0.03) {
        c.on = true; c.cpl = 'DC'; c.fine = 1; c.finemode = false; c.inv = false;
        let k = 0; while (k < VDIV.length - 1 && VDIV[k] * this.pf(ch) * 5 < pp) k++; c.vd = k;
        c.pos = -((mx + mn) / 2 * this.pf(ch)) / (VDIV[k] * this.pf(ch));
        c.pos = Math.max(-3.5, Math.min(3.5, c.pos));
        const f = this.freqOf(r, t, 96000 * 2, (mx + mn) / 2, (mx - mn) * 0.1);
        if (!tf && f >= 50) { tf = f; s.trig.src = ch; s.trig.level = 0; } // AC trigger coupling: 50 % level = 0 V of the AC part
      } else if (!this.sim.probes[ch]) c.on = ch === 'CH1';
    }
    s.trig.mode = 'AUTO'; s.trig.slope = 'R'; s.trig.cpl = 'AC'; s.hpos = 0;
    if (tf > 0) { const want = 2.5 / tf / HDIV; let k = 0; while (k < TDIV.length - 1 && TDIV[k] < want) k++; s.td = k; }
    else s.td = 10;
    s.menu = null;
  }
  freqOf(r, t, n, mid, hy) {
    // start in the state of the first sample, so a window that opens while the signal is high is not counted as an edge
    let st = r[(t - n) & RMASK] > mid ? 1 : 0, first = -1, last = -1, cnt = 0;
    for (let i = 0; i < n; i++) { const v = r[(t - n + i) & RMASK]; if (st === 0 && v > mid + hy) { st = 1; if (first < 0) first = i; else { cnt++; last = i; } } else if (st === 1 && v < mid - hy) st = 0; }
    return cnt > 0 ? cnt / ((last - first) / FS) : 0;
  }

  // ===================================== menus =====================================
  menuDef() {
    const s = this.st, cyc = (arr, v) => arr[(arr.indexOf(v) + 1) % arr.length];
    switch (s.menu) {
      case 'CH1': case 'CH2': { const c = s.ch[s.menu]; return { title: s.menu, items: [
        { label: 'Coupling', value: c.cpl, f: () => c.cpl = cyc(['DC', 'AC', 'GND'], c.cpl) },
        { label: 'BW Limit', value: c.bw ? 'ON' : 'OFF', f: () => c.bw = !c.bw },
        { label: 'Volts/Div', value: c.finemode ? 'Fine' : 'Coarse', f: () => { c.finemode = !c.finemode; if (!c.finemode) c.fine = 1; } },
        { label: 'Probe', value: PROBES[c.probe] + 'X', f: () => c.probe = (c.probe + 1) % 4 },
        { label: 'Invert', value: c.inv ? 'ON' : 'OFF', f: () => c.inv = !c.inv }] }; }
      case 'MATH': { const m = s.math; return { title: 'MATH', items: m.kind === 'FFT' ? [
        { label: 'Type', value: 'FFT', f: () => m.kind = 'Math' },
        { label: 'Source', value: m.fftSrc, f: () => m.fftSrc = cyc(['CH1', 'CH2'], m.fftSrc) },
        { label: 'Window', value: m.win, f: () => m.win = cyc(['Hanning', 'Hamming', 'Blackman', 'Rectangle'], m.win) },
        { label: 'Unit', value: m.unit === 'Vrms' ? 'Vrms' : 'dBVrms', f: () => m.unit = m.unit === 'Vrms' ? 'dBVrms' : 'Vrms' }] : [
        { label: 'Type', value: 'Math', f: () => m.kind = 'FFT' },
        { label: 'Source A', value: 'CH1' }, { label: 'Operator', value: { '+': 'A+B', '-': 'A-B', '*': 'A×B', '/': 'A÷B' }[m.op], f: () => m.op = cyc(['+', '-', '*', '/'], m.op) },
        { label: 'Source B', value: 'CH2' }, { label: '', value: '' }] }; }
      case 'TMENU': { const t = s.trig; return { title: 'TRIGGER', items: [
        { label: 'Type', value: 'Edge' },
        { label: 'Source', value: { CH1: 'CH1', CH2: 'CH2', EXT: 'EXT', EXT5: 'EXT/5', LINE: 'AC Line' }[t.src], f: () => t.src = cyc(['CH1', 'CH2', 'EXT', 'EXT5', 'LINE'], t.src) },
        { label: 'Slope', value: t.slope === 'R' ? 'Rising ⟋' : 'Falling ⟍', f: () => t.slope = t.slope === 'R' ? 'F' : 'R' },
        { label: 'Mode', value: { AUTO: 'Auto', NORMAL: 'Normal', SINGLE: 'Single' }[t.mode], f: () => { t.mode = cyc(['AUTO', 'NORMAL', 'SINGLE'], t.mode); this.single = false; s.run = true; } },
        { label: 'Coupling', value: { DC: 'DC', AC: 'AC', HF: 'HF Reject', LF: 'LF Reject' }[t.cpl], f: () => t.cpl = cyc(['DC', 'AC', 'HF', 'LF'], t.cpl) }] }; }
      case 'HMENU': return { title: 'HORIZONTAL', items: [
        { label: 'Main', value: s.zoom ? '' : '●', f: () => s.zoom = false },
        { label: 'Zoom', value: s.zoom ? '●' : '', f: () => { s.zoom = true; if (s.ztd >= s.td) s.ztd = Math.max(0, s.td - 2); } },
        { label: 'Format', value: s.disp.fmt, f: () => s.disp.fmt = s.disp.fmt === 'YT' ? 'XY' : 'YT' }, { label: '', value: '' }, { label: '', value: '' }] };
      case 'MEASURE': { const m = s.meas; const cy = i => () => { const L = [null, ...MEAS]; m.items[i] = L[(L.indexOf(m.items[i]) + 1) % L.length]; };
        return { title: 'MEASURE', items: [
          { label: 'Source', value: m.src, f: () => m.src = cyc(['CH1', 'CH2'], m.src) },
          { label: 'Param 1', value: m.items[0] || 'OFF', f: cy(0) }, { label: 'Param 2', value: m.items[1] || 'OFF', f: cy(1) }, { label: 'Param 3', value: m.items[2] || 'OFF', f: cy(2) },
          { label: 'All Param', value: m.all ? 'ON' : 'OFF', f: () => m.all = !m.all }] }; }
      case 'CURSOR': { const c = s.cur; const r = this.cursorVals(); return { title: 'CURSOR', items: [
        { label: 'Type', value: c.type, f: () => c.type = cyc(['Off', 'Voltage', 'Time'], c.type) },
        { label: 'Source', value: c.src, f: () => c.src = cyc(['CH1', 'CH2'], c.src) },
        { label: 'Active', value: c.act === 'AB' ? 'A & B' : c.act, f: () => c.act = cyc(['A', 'B', 'AB'], c.act) },
        { label: r ? r.l1 : '', value: r ? r.v1 : '' }, { label: r ? r.l2 : '', value: r ? r.v2 : '' }] }; }
      case 'ACQUIRE': return { title: 'ACQUIRE', items: [
        { label: 'Mode', value: s.acq, f: () => { s.acq = cyc(['Sample', 'Peak', 'Average'], s.acq); this.avgBuf = {}; } },
        { label: 'Averages', value: s.acq === 'Average' ? String(s.avgN) : '--', f: () => { const L = [2, 4, 8, 16, 32, 64, 128, 256]; s.avgN = L[(L.indexOf(s.avgN) + 1) % 8]; } },
        { label: 'Sampling', value: 'Real Time' }, { label: 'Sa Rate', value: fmtF(this.saRate()).replace('Hz', 'Sa/s') }, { label: '', value: '' }] };
      case 'DISPLAY': return { title: 'DISPLAY', items: [
        { label: 'Type', value: s.disp.type, f: () => s.disp.type = cyc(['Vectors', 'Dots'], s.disp.type) },
        { label: 'Persist', value: ['OFF', '1s', '2s', '5s', 'Infinite'][s.disp.persist], f: () => { s.disp.persist = (s.disp.persist + 1) % 5; this.pcx.clearRect(0, 0, GW, GH); } },
        { label: 'Format', value: s.disp.fmt, f: () => s.disp.fmt = s.disp.fmt === 'YT' ? 'XY' : 'YT' },
        { label: 'Grid', value: s.disp.grid, f: () => s.disp.grid = cyc(['Dots', 'Lines', 'Off'], s.disp.grid) }, { label: 'Clear', value: '', f: () => this.pcx.clearRect(0, 0, GW, GH) }] };
      case 'STORAGE': { const r = s.ref; return { title: 'STORAGE', items: [
        { label: 'Save Image', value: 'PNG', f: () => this.hooks.screenshot(this.cv) },
        { label: 'Ref Source', value: r.ch, f: () => r.ch = cyc(['CH1', 'CH2'], r.ch) },
        { label: 'Save Ref', value: '', f: () => { const f = this.frame[r.ch]; if (f) { r.data = { y: Float32Array.from(f.y), lo: f.lo && Float32Array.from(f.lo), hi: f.hi && Float32Array.from(f.hi), vd: this.vd(r.ch), pos: s.ch[r.ch].pos }; r.on = true; } } },
        { label: 'Show Ref', value: r.on ? 'ON' : 'OFF', f: () => r.on = !r.on && !!r.data }, { label: '', value: '' }] }; }
      case 'UTILITY': return { title: 'UTILITY', items: [
        { label: 'Counter', value: s.counter ? 'ON' : 'OFF', f: () => s.counter = !s.counter },
        { label: 'Self Cal', value: '', f: () => { this.calibrating = performance.now(); } },
        { label: 'Default', value: 'Setup', f: () => { this.reset(); this.avgBuf = {}; } },
        { label: 'Language', value: 'English' }, { label: 'System', value: 'Info' }] };
    }
    return null;
  }
  cursorVals() {
    const c = this.st.cur; if (c.type === 'Off') return null;
    if (c.type === 'Time') { const td = this.st.zoom ? TDIV[this.st.ztd] : this.tdiv(); const dt = (c.b - c.a) * td; return { l1: 'ΔT', v1: fmtT(Math.abs(dt)), l2: '1/ΔT', v2: dt ? fmtF(1 / Math.abs(dt)) : '****', A: c.a * td, B: c.b * td }; }
    const vd = this.vd(c.src), p = this.st.ch[c.src].pos; return { l1: 'ΔV', v1: fmtV(Math.abs((c.b - c.a) * vd)), l2: 'A / B', v2: `${fmtV((c.a - p) * vd)}`, A: (c.a - p) * vd, B: (c.b - p) * vd };
  }
  saRate() { const W = HDIV * (this.st.zoom ? TDIV[this.st.ztd] : this.tdiv()); return Math.min(1e9, 2500 / W * 4); }

  // ===================================== acquisition =====================================
  ring(ch) { return this.frozen ? this.frozen.rings[ch] : this.sim.rings[ch]; }
  now() { return this.frozen ? this.frozen.t : this.sim.t; }
  freeze(trig) { // keep the acquisition memory so the stopped waveform can still be zoomed and scrolled
    const r = this.sim.rings; this.frozen = { t: this.sim.t, trig, rings: { CH1: r.CH1.slice(), CH2: r.CH2.slice(), EXT: r.EXT.slice() } };
  }
  srcVal(src, idx) { // trigger source value (displayed volts)
    if (src === 'EXT' || src === 'EXT5') return this.ring('EXT')[idx & RMASK] / (src === 'EXT5' ? 5 : 1);
    const v = this.ring(src)[idx & RMASK] * this.pf(src); return this.st.ch[src].inv ? -v : v;
  }
  findTrigger(now, need) {
    const s = this.st, tr = s.trig;
    if (tr.src === 'LINE') { const P = FS / 50; const tmax = now - need; return { t: Math.floor(tmax / P) * P, frac: 0 }; }
    const W = HDIV * this.tdiv() * FS;
    const tmax = now - need - 2, len = Math.min(RING - W * 1.5 - need - 10, Math.max(4 * W, 120000, 0) | 0);
    const t0 = tmax - Math.min(len, 1500000);
    const vd = tr.src === 'CH1' || tr.src === 'CH2' ? this.vd(tr.src) : 0.5;
    const L = tr.level, h = Math.max(0.12 * vd, 0.004); const rising = tr.slope === 'R';
    let mean = 0;
    if (tr.cpl === 'AC' || tr.cpl === 'LF') { const n = 48000; const st = Math.max(1, n / 2000 | 0); let c = 0; for (let i = 0; i < n; i += st) { mean += this.srcVal(tr.src, tmax - i); c++; } mean /= c; }
    let armed = false, found = -1, frac = 0, prev = 0;
    const hf = tr.cpl === 'HF'; let acc = 0; const K = 24;
    for (let i = t0; i <= tmax; i++) {
      let v = this.srcVal(tr.src, i) - mean;
      if (hf) { acc += v - this.srcVal(tr.src, i - K) + mean; v = acc / K; }
      const x = rising ? v - L : L - v;
      if (x < -h) armed = true;
      else if (armed && x >= 0 && i > t0) { found = i; frac = prev < 0 ? (-prev) / (x - prev) : 0; armed = false; }
      prev = x;
    }
    return found >= 0 ? { t: found - 1, frac } : null;
  }

  update() {
    const s = this.st;
    if (!s.run) { if (!this.frozen && this.lastTrigUsed) this.freeze(this.lastTrigUsed); if (this.frozen) this.capture(this.frozen.trig); this.render(); return; }
    this.frozen = null;
    const now = this.sim.t, tdiv = this.tdiv();
    const Wm = HDIV * tdiv * FS; // samples in main window
    // main window is centred at trigger + hpos
    const need = Math.max(0, Math.ceil(Wm / 2 + s.hpos * FS));
    let trig = this.findTrigger(now, need);
    let status;
    if (trig) { status = "Trig'd"; this.lastSeen = performance.now(); }
    else if (this.forceNext) { trig = { t: now - need - 1, frac: 0 }; status = "Trig'd"; }
    else if (s.trig.mode === 'AUTO') { trig = { t: now - need - 1, frac: 0 }; status = 'Auto'; }
    else { status = 'Ready'; this.status = status; this.render(); return; }
    this.forceNext = false;
    this.status = status;
    this.capture(trig); this.lastTrigUsed = trig;
    if (s.trig.mode === 'SINGLE' && status === "Trig'd") { s.run = false; this.status = 'Stop'; this.freeze(trig); }
    this.render();
  }

  capture(trig) {
    const s = this.st; const tdiv = s.zoom ? TDIV[s.ztd] : this.tdiv();
    const W = HDIV * tdiv * FS; const centre = trig.t + trig.frac + (s.hpos + (s.zoom ? s.zpos : 0)) * FS;
    const start = centre - W / 2;
    this.view = { start, W, tdiv, trig };
    for (const ch of ['CH1', 'CH2']) {
      const c = s.ch[ch]; if (!c.on && !(s.math.on && (s.math.kind === 'Math' || s.math.fftSrc === ch)) && !(s.meas.src === ch)) { this.frame[ch] = null; continue; }
      this.frame[ch] = this.extract(ch, start, W);
    }
    if (s.math.on && s.math.kind === 'FFT') this.fft = this.computeFFT(s.math.fftSrc, trig);
  }
  chanMean(ch) { // AC coupling: remove the DC level of the last 0.1 s
    const r = this.ring(ch), t = this.now(), n = 48000; let m = 0, c = 0; for (let i = 0; i < n; i += 37) { m += r[(t - i) & RMASK]; c++; } return m / c;
  }
  extract(ch, start, W) {
    const s = this.st, c = s.ch[ch], r = this.ring(ch), pf = this.pf(ch) * (c.inv ? -1 : 1);
    const off = c.cpl === 'AC' ? this.chanMean(ch) : 0, gnd = c.cpl === 'GND';
    const N = GW; const out = { y: new Float32Array(N), lo: null, hi: null, raw: null, rawStart: start };
    let seed = 12345 + (ch === 'CH2' ? 777 : 0); const rnd = this.frozen ? () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) : Math.random;
    const noise = () => (rnd() + rnd() + rnd() - 1.5) * 0.004 * this.vd(ch);
    const samp = i => gnd ? 0 : (r[i & RMASK] - off) * pf;
    // raw samples for measurements (decimated to <= 20000)
    const n = Math.max(2, Math.round(W)), st = Math.max(1, Math.floor(n / 20000)), s0 = Math.floor(start);
    const raw = new Float32Array(Math.floor(n / st)); for (let i = 0; i < raw.length; i++) raw[i] = samp(s0 + i * st);
    out.raw = raw; out.rawDt = st / FS;
    const bw = c.bw;
    if (W > N * 1.5) { // min/max per column
      out.lo = new Float32Array(N); out.hi = new Float32Array(N);
      for (let x = 0; x < N; x++) {
        const a = Math.floor(start + x * W / N), b = Math.max(a + 1, Math.floor(start + (x + 1) * W / N));
        let mn = 1e9, mx = -1e9; const step = Math.max(1, Math.floor((b - a) / 400));
        for (let i = a; i < b; i += step) { const v = samp(i); if (v < mn) mn = v; if (v > mx) mx = v; }
        const nz = noise(); out.lo[x] = mn + nz; out.hi[x] = mx + nz; out.y[x] = (mn + mx) / 2;
      }
      if (s.acq === 'Sample' && W > N * 400) { // very slow sweeps: sample decimation like a real DSO (no peak detect)
        for (let x = 0; x < N; x++) { const v = samp(Math.floor(start + x * W / N)) + noise(); out.lo[x] = out.hi[x] = out.y[x] = v; }
        out.lo = out.hi = null;
      }
    } else { // interpolate (Lanczos-3, like sin(x)/x interpolation)
      for (let x = 0; x < N; x++) {
        const t = start + x * W / N, i0 = Math.floor(t), fr = t - i0; let acc = 0, ws = 0;
        for (let k = -2; k <= 3; k++) { const d = k - fr; const w = d === 0 ? 1 : Math.abs(d) >= 3 ? 0 : (3 * Math.sin(Math.PI * d) * Math.sin(Math.PI * d / 3)) / (Math.PI * Math.PI * d * d); acc += w * samp(i0 + k); ws += w; }
        out.y[x] = acc / ws + noise();
      }
    }
    if (bw) { const a = 0.6; let p = out.y[0]; for (let x = 0; x < N; x++) { p = a * p + (1 - a) * out.y[x]; out.y[x] = p; } }
    // averaging
    if (s.acq === 'Average') {
      const k = ch + s.td + s.vd; let A = this.avgBuf[ch];
      if (!A || A.key !== k) A = this.avgBuf[ch] = { key: k, y: Float32Array.from(out.y), n: 1 };
      else { A.n = Math.min(A.n + 1, s.avgN); for (let x = 0; x < N; x++) A.y[x] += (out.y[x] - A.y[x]) / A.n; }
      out.y = Float32Array.from(A.y); out.lo = out.hi = null;
    }
    return out;
  }
  computeFFT(ch, trig) {
    const s = this.st, c = s.ch[ch], r = this.ring(ch), pf = this.pf(ch);
    // integer decimation (a fractional step makes the sample spacing jitter, which puts spurs ~35 dB down across the span)
    const N = 4096, dec = Math.max(1, Math.round(HDIV * this.tdiv() * FS / N)), W = dec * N, end = Math.floor(trig.t + W / 2 + s.hpos * FS), start = end - W;
    const x = new Float64Array(N), st = Math.max(1, Math.floor(dec / 64));
    for (let i = 0; i < N; i++) { const a = start + i * dec; let acc = 0, cnt = 0; for (let j = a; j < a + dec; j += st) { acc += r[j & RMASK]; cnt++; } x[i] = acc / cnt * pf; }
    const wf = { Hanning: i => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N), Hamming: i => 0.54 - 0.46 * Math.cos(2 * Math.PI * i / N), Blackman: i => 0.42 - 0.5 * Math.cos(2 * Math.PI * i / N) + 0.08 * Math.cos(4 * Math.PI * i / N), Rectangle: () => 1 }[s.math.win];
    let ws = 0; const re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N; i++) { const w = wf(i); ws += w; re[i] = x[i] * w; }
    fft(re, im);
    const mag = new Float32Array(N / 2);
    for (let k = 0; k < N / 2; k++) { const a = Math.hypot(re[k], im[k]) * 2 / ws / Math.SQRT2; mag[k] = 20 * Math.log10(a + 1e-9); }
    return { mag, fsEff: FS / dec };
  }

  // ===================================== rendering =====================================
  lights() {
    const s = this.st, B = this.btnShapes, set = (id, c) => { const b = B[id]; if (b && b._c !== c) { b._c = c; b.shape.setAttribute('fill', c || (b.kind === 'round' ? 'url(#blueBtn)' : 'url(#btnGrad)')); } };
    set('CH1', s.ch.CH1.on ? (s.sel === 'CH1' ? '#ffe94a' : '#e9dd84') : null);
    set('CH2', s.ch.CH2.on ? (s.sel === 'CH2' ? '#5fe0ff' : '#a9e4ef') : null);
    set('MATH', s.math.on ? '#e7a2f7' : null);
    set('run', s.run ? '#58e070' : '#ff5a4d'); set('auto', '#9df0a9');
  }
  render() {
    this.lights();
    const g = this.cx, s = this.st;
    g.fillStyle = '#1d5fc9'; g.fillRect(0, 0, 800, 480);
    const bg = g.createLinearGradient(0, 0, 0, 480); bg.addColorStop(0, '#2c7fe3'); bg.addColorStop(1, '#1a59bf'); g.fillStyle = bg; g.fillRect(0, 0, 800, 480);
    g.fillStyle = '#000'; g.fillRect(GX - 2, GY - 2, GW + 4, GH + 4);
    // persistence layer
    if (s.disp.persist) {
      const life = [0, 1, 2, 5, 1e9][s.disp.persist]; if (life < 1e8) { this.pcx.globalCompositeOperation = 'destination-out'; this.pcx.fillStyle = `rgba(0,0,0,${Math.min(1, 1 / (30 * life))})`; this.pcx.fillRect(0, 0, GW, GH); this.pcx.globalCompositeOperation = 'source-over'; }
      g.drawImage(this.pcv, GX, GY);
    }
    this.drawGrid(g);
    g.save(); g.beginPath(); g.rect(GX, GY, GW, GH); g.clip();
    const v = this.view;
    if (this.calibrating && performance.now() - this.calibrating < 3000) { g.fillStyle = '#fff'; g.font = 'bold 22px Arial'; g.textAlign = 'center'; g.fillText('Self Calibrating...', GX + GW / 2, GY + GH / 2); }
    else if (s.disp.fmt === 'XY') this.drawXY(g);
    else {
      if (s.ref.on && s.ref.data) this.drawTrace(g, s.ref.data, s.ref.data.vd, s.ref.data.pos, COL.REF, 0.8);
      if (s.math.on && s.math.kind === 'Math') this.drawMath(g);
      for (const ch of ['CH2', 'CH1']) if (s.ch[ch].on && this.frame[ch]) {
        this.drawTrace(g, this.frame[ch], this.vd(ch), s.ch[ch].pos, COL[ch]);
        if (s.disp.persist) this.drawTrace(this.pcx, this.frame[ch], this.vd(ch), s.ch[ch].pos, COL[ch], 0.5, -GX, -GY);
      }
      if (s.math.on && s.math.kind === 'FFT' && this.fft) this.drawFFT(g);
      this.drawCursors(g);
    }
    g.restore();
    this.drawMarkers(g); this.drawBars(g); this.drawMenu(g);
    if (s.meas.all) this.drawAllMeas(g); else this.drawMeas(g);
    if (this.levelShow && performance.now() - this.levelShow < 1500) this.drawLevelLine(g);
  }
  drawGrid(g) {
    const s = this.st; if (s.disp.grid === 'Off') return;
    g.fillStyle = '#6b6b6b'; g.strokeStyle = '#555';
    if (s.disp.grid === 'Lines') { g.lineWidth = 1; g.beginPath(); for (let i = 0; i <= HDIV; i++) { g.moveTo(GX + i * PX + .5, GY); g.lineTo(GX + i * PX + .5, GY + GH); } for (let j = 0; j <= VDIVS; j++) { g.moveTo(GX, GY + j * PX + .5); g.lineTo(GX + GW, GY + j * PX + .5); } g.stroke(); }
    else { for (let i = 0; i <= HDIV; i++) for (let y = 0; y <= GH; y += 5) g.fillRect(GX + i * PX, GY + y, 1, 1); for (let j = 0; j <= VDIVS; j++) for (let x = 0; x <= GW; x += 5) g.fillRect(GX + x, GY + j * PX, 1, 1); }
    g.fillStyle = '#8a8a8a';
    for (let x = 0; x <= GW; x += 10) { g.fillRect(GX + x, GY + GH / 2 - 3, 1, 7); }
    for (let y = 0; y <= GH; y += 10) { g.fillRect(GX + GW / 2 - 3, GY + y, 7, 1); }
    g.strokeStyle = '#9a9a9a'; g.lineWidth = 1; g.strokeRect(GX - .5, GY - .5, GW + 1, GH + 1);
  }
  ypix(v, vd, pos) { return GY + GH / 2 - (v / vd + pos) * PX; }
  drawTrace(g, f, vd, pos, col, alpha = 1, ox = 0, oy = 0) {
    const s = this.st; g.save(); g.translate(ox, oy); g.globalAlpha = alpha; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 1.6;
    const N = f.y.length, X = x => GX + x * GW / N;
    if (f.lo && f.hi) {
      g.beginPath();
      for (let x = 0; x < N; x++) { const a = this.ypix(f.hi[x], vd, pos), b = this.ypix(f.lo[x], vd, pos); g.moveTo(X(x) + .5, a - .8); g.lineTo(X(x) + .5, b + .8); if (x > 0 && s.disp.type === 'Vectors') { const pa = this.ypix(f.hi[x - 1], vd, pos), pb = this.ypix(f.lo[x - 1], vd, pos); if (pb < a) { g.moveTo(X(x) + .5, pb); g.lineTo(X(x) + .5, a); } if (pa > b) { g.moveTo(X(x) + .5, b); g.lineTo(X(x) + .5, pa); } } }
      g.lineWidth = 1.3; g.stroke();
    } else if (s.disp.type === 'Dots') { for (let x = 0; x < N; x += 3) g.fillRect(X(x), this.ypix(f.y[x], vd, pos) - 1, 2, 2); }
    else { g.beginPath(); for (let x = 0; x < N; x++) { const y = this.ypix(f.y[x], vd, pos); if (x === 0) g.moveTo(X(x), y); else g.lineTo(X(x), y); } g.stroke(); }
    g.restore();
  }
  drawMath(g) {
    const a = this.frame.CH1, b = this.frame.CH2; if (!a || !b) return; const op = this.st.math.op;
    const y = new Float32Array(a.y.length); for (let i = 0; i < y.length; i++) y[i] = op === '+' ? a.y[i] + b.y[i] : op === '-' ? a.y[i] - b.y[i] : op === '*' ? a.y[i] * b.y[i] : Math.max(-1e3, Math.min(1e3, a.y[i] / (Math.abs(b.y[i]) < 1e-3 ? (b.y[i] < 0 ? -1e-3 : 1e-3) : b.y[i])));
    const vd = op === '*' ? this.vd('CH1') * this.vd('CH2') : op === '/' ? this.vd('CH1') / this.vd('CH2') : this.vd('CH1');
    this.drawTrace(g, { y }, vd, this.st.math.fpos, COL.MATH);
  }
  drawFFT(g) {
    const m = this.st.math, F = this.fft; const span = F.fsEff / 2; const nb = F.mag.length; const lin = m.unit === 'Vrms', vr = VDIV[m.vrd ?? 7];
    g.strokeStyle = COL.MATH; g.lineWidth = 1.3; g.beginPath();
    const top = 20 + m.fpos * m.dbdiv; // dBVrms at the top line
    for (let x = 0; x < GW; x++) {
      const a = Math.floor(x * nb / GW), b = Math.max(a + 1, Math.floor((x + 1) * nb / GW)); let mx = -300; for (let k = a; k < b; k++) if (F.mag[k] > mx) mx = F.mag[k];
      const y = lin ? GY + GH - (Math.pow(10, mx / 20) / vr + m.fpos) * PX : GY + (top - mx) / m.dbdiv * PX; if (x === 0) g.moveTo(GX + x, y); else g.lineTo(GX + x, y);
    }
    g.stroke();
    this.fftInfo = `FFT ${m.fftSrc}  ${fmtF(span / HDIV)}/div  ${lin ? fmtV(vr) + 'rms/div' : m.dbdiv + 'dBVrms/div'}  ${m.win}`;
  }
  drawXY(g) {
    const a = this.frame.CH1, b = this.frame.CH2; if (!a || !b || !a.raw || !b.raw) return; const s = this.st;
    g.strokeStyle = COL.CH1; g.lineWidth = 1.2; g.beginPath();
    const n = Math.min(a.raw.length, b.raw.length), st = Math.max(1, Math.floor(n / 4000));
    for (let i = 0; i < n; i += st) { const x = GX + GW / 2 + (a.raw[i] / this.vd('CH1') + s.ch.CH1.pos) * PX, y = GY + GH / 2 - (b.raw[i] / this.vd('CH2') + s.ch.CH2.pos) * PX; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
    g.stroke();
  }
  drawCursors(g) {
    const c = this.st.cur; if (c.type === 'Off') return;
    g.setLineDash([4, 3]); g.strokeStyle = '#ff8c2a'; g.lineWidth = 1;
    for (const [k, v] of [['A', c.a], ['B', c.b]]) {
      g.beginPath();
      if (c.type === 'Time') { const x = GX + GW / 2 + v * PX; g.moveTo(x, GY); g.lineTo(x, GY + GH); }
      else { const y = GY + GH / 2 - v * PX; g.moveTo(GX, y); g.lineTo(GX + GW, y); }
      g.stroke(); g.fillStyle = '#ff8c2a'; g.font = '11px Arial'; g.fillText(k, c.type === 'Time' ? GX + GW / 2 + v * PX + 3 : GX + 4, c.type === 'Time' ? GY + 12 : GY + GH / 2 - v * PX - 3);
    }
    g.setLineDash([]);
    const r = this.cursorVals(); g.fillStyle = '#ffb36b'; g.font = '12px Arial'; g.textAlign = 'left';
    g.fillText(`A: ${c.type === 'Time' ? fmtT(r.A) : fmtV(r.A)}   B: ${c.type === 'Time' ? fmtT(r.B) : fmtV(r.B)}   ${r.l1}: ${r.v1}`, GX + 6, GY + GH - 8);
  }
  drawLevelLine(g) {
    const s = this.st, src = s.trig.src; if (src !== 'CH1' && src !== 'CH2') return;
    const y = this.ypix(s.trig.level, this.vd(src), s.ch[src].pos); g.setLineDash([6, 4]); g.strokeStyle = '#ff9e3d'; g.beginPath(); g.moveTo(GX, y); g.lineTo(GX + GW, y); g.stroke(); g.setLineDash([]);
  }
  drawMarkers(g) {
    const s = this.st;
    for (const ch of ['CH1', 'CH2']) {
      if (!s.ch[ch].on) continue; let y = GY + GH / 2 - s.ch[ch].pos * PX; const clipped = y < GY || y > GY + GH; y = Math.max(GY, Math.min(GY + GH, y));
      g.fillStyle = COL[ch]; g.beginPath(); g.moveTo(GX - 16, y - 7); g.lineTo(GX - 6, y - 7); g.lineTo(GX - 1, y); g.lineTo(GX - 6, y + 7); g.lineTo(GX - 16, y + 7); g.closePath(); g.fill();
      g.fillStyle = '#000'; g.font = 'bold 11px Arial'; g.textAlign = 'center'; g.fillText(ch[2], GX - 10, y + 4); if (clipped) { g.fillStyle = COL[ch]; }
    }
    // trigger position (top) and level (right)
    const tx = GX + GW / 2 - (s.hpos / this.tdiv()) * PX * (s.zoom ? this.tdiv() / TDIV[s.ztd] : 1);
    g.fillStyle = '#ff9e3d'; const cx = Math.max(GX, Math.min(GX + GW, tx)); g.beginPath(); g.moveTo(cx - 6, GY - 12); g.lineTo(cx + 6, GY - 12); g.lineTo(cx, GY - 3); g.fill();
    const src = s.trig.src;
    if (src === 'CH1' || src === 'CH2') { let y = this.ypix(s.trig.level, this.vd(src), s.ch[src].pos); y = Math.max(GY, Math.min(GY + GH, y)); g.fillStyle = COL[src]; g.beginPath(); g.moveTo(GX + GW + 14, y - 6); g.lineTo(GX + GW + 14, y + 6); g.lineTo(GX + GW + 3, y); g.fill(); g.fillStyle = '#000'; }
  }
  drawBars(g) {
    const s = this.st; g.textAlign = 'left';
    // top bar
    const stc = { "Trig'd": '#2bd14a', Auto: '#2bd14a', Ready: '#f3c614', Stop: '#ff3b30' };
    const status = s.run ? this.status || 'Auto' : 'Stop';
    g.fillStyle = stc[status] || '#2bd14a'; g.fillRect(8, 6, 58, 22); g.fillStyle = '#000'; g.font = 'bold 13px Arial'; g.textAlign = 'center'; g.fillText(status, 37, 22);
    g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = '13px Arial';
    g.fillText(`H Pos: ${fmtT(s.hpos)}`, 250, 22);
    if (s.zoom) { g.fillStyle = '#ffd34d'; g.fillText(`ZOOM ${fmtDiv(TDIV[s.ztd])}`, 92, 22); }
    else { g.fillText(s.acq === 'Average' ? `Avg ${s.avgN}` : s.acq, 92, 22); }
    // zoom overview strip
    if (s.zoom) { const w = 120, x0 = 430; g.strokeStyle = '#fff'; g.strokeRect(x0, 10, w, 14); const frac = TDIV[s.ztd] / this.tdiv(); const cx = x0 + w / 2 + (s.zpos / (HDIV * this.tdiv())) * w; g.fillStyle = 'rgba(255,211,77,.7)'; g.fillRect(cx - frac * w / 2, 11, Math.max(2, frac * w), 12); }
    // bottom bar
    const y = 466; g.font = 'bold 13px Arial';
    const chBox = (ch, x) => {
      const c = s.ch[ch]; g.fillStyle = c.on ? COL[ch] : '#5b7fb5'; g.fillRect(x, y - 15, 20, 20); g.fillStyle = '#000'; g.textAlign = 'center'; g.fillText(ch[2], x + 10, y);
      g.fillStyle = '#0d2a5e'; g.fillRect(x + 22, y - 15, 104, 20); g.fillStyle = c.on ? '#fff' : '#8aa'; g.textAlign = 'left';
      const sym = c.cpl === 'DC' ? '⎓' : c.cpl === 'AC' ? '∿' : '⏚';
      g.fillText(`${sym} ${fmtVd(this.vd(ch))}${c.finemode ? '*' : ''}${c.bw ? ' B' : ''}${c.inv ? ' ↕' : ''}`, x + 28, y);
    };
    chBox('CH1', 34); chBox('CH2', 168);
    g.fillStyle = '#0d2a5e'; g.fillRect(302, y - 15, 110, 20); g.fillStyle = '#fff'; g.fillText(`M ${fmtDiv(this.tdiv())}`, 310, y);
    const tr = s.trig; const src = { CH1: '1', CH2: '2', EXT: 'EXT', EXT5: 'EXT/5', LINE: 'AC' }[tr.src];
    g.fillStyle = '#0d2a5e'; g.fillRect(418, y - 15, 122, 20); g.fillStyle = '#ff9e3d'; g.fillText(`${src} ${tr.slope === 'R' ? '⟋' : '⟍'} ${fmtV(tr.level)}`, 424, y);
    if (s.counter) { const f = this.counterF(); g.fillStyle = '#0d2a5e'; g.fillRect(546, y - 15, 90, 20); g.fillStyle = '#fff'; g.font = '12px Arial'; g.fillText(fmtF(f), 550, y); }
    if (s.math.on && s.math.kind === 'FFT' && this.fftInfo) { g.fillStyle = COL.MATH; g.font = '12px Arial'; g.fillText(this.fftInfo, GX + 6, GY + 16); }
  }
  counterF() {
    const now = performance.now(); if (this._cf && now - this._cfT < 400) return this._cf;
    const src = this.st.trig.src === 'EXT5' ? 'EXT' : this.st.trig.src; if (src === 'LINE') return 50;
    const r = this.ring(src), T = this.now(); const n = 120000; let mx = -1e9, mn = 1e9; for (let i = 0; i < n; i += 7) { const v = r[(T - n + i) & RMASK]; if (v > mx) mx = v; if (v < mn) mn = v; }
    this._cf = mx - mn > 0.02 ? this.freqOf(r, T, n, (mx + mn) / 2, (mx - mn) * 0.15) : 0; this._cfT = now; return this._cf;
  }
  drawMenu(g) {
    const m = this.menuDef(), x = MX, w = MW;
    const grad = g.createLinearGradient(x, 0, x + w, 0); grad.addColorStop(0, '#3b8cf0'); grad.addColorStop(1, '#1f63cf');
    if (!m) return;
    g.fillStyle = '#0f3f99'; g.fillRect(x, 4, w, 28); g.fillStyle = '#fff'; g.font = 'bold 15px Arial'; g.textAlign = 'center'; g.fillText(m.title, x + w / 2, 24);
    for (let i = 0; i < 5; i++) {
      const it = m.items[i]; const y = 38 + i * 87;
      g.fillStyle = grad; g.fillRect(x, y, w, 82); g.strokeStyle = '#8fc0ff'; g.strokeRect(x + .5, y + .5, w - 1, 81);
      if (!it || (!it.label && !it.value)) continue;
      g.fillStyle = '#fff'; g.font = 'bold 15px Arial'; g.fillText(it.label, x + w / 2, y + 28);
      if (it.value !== '') { g.fillStyle = '#123f8f'; g.fillRect(x + 12, y + 42, w - 24, 26); g.fillStyle = '#fff'; g.font = '15px Arial'; g.fillText(it.value, x + w / 2, y + 61); }
    }
  }
  measure(ch) {
    const f = this.frame[ch]; if (!f || !f.raw) return null;
    const a = f.raw, n = a.length; let mx = -1e9, mn = 1e9, sum = 0, sq = 0;
    for (let i = 0; i < n; i++) { const v = a[i]; if (v > mx) mx = v; if (v < mn) mn = v; sum += v; sq += v * v; }
    // top/base by histogram
    const H = new Uint32Array(64), sp = (mx - mn) || 1e-9; for (let i = 0; i < n; i++) H[Math.min(63, Math.floor((a[i] - mn) / sp * 64))]++;
    let hb = 0, ht = 63; for (let i = 0; i < 32; i++) if (H[i] > H[hb]) hb = i; for (let i = 32; i < 64; i++) if (H[i] > H[ht]) ht = i;
    const base = H[hb] > n * 0.05 ? mn + (hb + .5) / 64 * sp : mn, top = H[ht] > n * 0.05 ? mn + (ht + .5) / 64 * sp : mx;
    const mid = (mx + mn) / 2, hy = sp * 0.1; const ups = [], dns = []; let stt = a[0] > mid ? 1 : 0;
    for (let i = 1; i < n; i++) { if (!stt && a[i] > mid + hy) { stt = 1; ups.push(i); } else if (stt && a[i] < mid - hy) { stt = 0; dns.push(i); } }
    const dt = f.rawDt; let per = NaN, pw = NaN, nw = NaN;
    if (ups.length >= 2) per = (ups[ups.length - 1] - ups[0]) / (ups.length - 1) * dt;
    if (ups.length && dns.length) { const u = ups[0]; const d = dns.find(x => x > u); if (d) pw = (d - u) * dt; const d0 = dns[0]; const u2 = ups.find(x => x > d0); if (u2) nw = (u2 - d0) * dt; }
    const edge = (lo, hi, rising) => { // 10-90 %
      const L = base + 0.1 * (top - base), Hh = base + 0.9 * (top - base);
      for (let i = 1; i < n; i++) { if (rising && a[i - 1] < L && a[i] >= L) { for (let j = i; j < n; j++) if (a[j] >= Hh) return (j - i) * dt; return NaN; } if (!rising && a[i - 1] > Hh && a[i] <= Hh) { for (let j = i; j < n; j++) if (a[j] <= L) return (j - i) * dt; return NaN; } }
      return NaN;
    };
    return { Vpp: mx - mn, Vmax: mx, Vmin: mn, Vamp: top - base, Vavg: sum / n, Vrms: Math.sqrt(sq / n), Freq: 1 / per, Period: per, '+Width': pw, '-Width': nw, '+Duty': pw / per * 100, Rise: edge(0, 0, true), Fall: edge(0, 0, false) };
  }
  fmtMeas(k, v) { if (v === undefined || !isFinite(v)) return '****'; if (k === 'Freq') return fmtF(v); if (k === '+Duty') return v.toFixed(1) + '%'; if (['Period', '+Width', '-Width', 'Rise', 'Fall'].includes(k)) return fmtT(v); return fmtV(v); }
  drawMeas(g) {
    const m = this.st.meas, items = m.items.filter(Boolean); if (!items.length) return; const r = this.measure(m.src); if (!r) return;
    g.font = '13px Arial'; g.textAlign = 'left'; let x = GX + 4; const y = GY + GH - 26;
    for (const k of items) { const t = `${m.src[2]}: ${k}=${this.fmtMeas(k, r[k])}`; const w = g.measureText(t).width + 12; g.fillStyle = 'rgba(10,30,70,.85)'; g.fillRect(x, y, w, 20); g.fillStyle = COL[m.src]; g.fillText(t, x + 6, y + 15); x += w + 6; }
  }
  drawAllMeas(g) {
    const m = this.st.meas, r = this.measure(m.src); if (!r) return;
    g.fillStyle = 'rgba(8,24,60,.92)'; g.fillRect(GX + 40, GY + 40, GW - 80, GH - 80); g.strokeStyle = '#7fb0ff'; g.strokeRect(GX + 40, GY + 40, GW - 80, GH - 80);
    g.fillStyle = COL[m.src]; g.font = 'bold 14px Arial'; g.textAlign = 'left'; g.fillText(`All Parameters — ${m.src}`, GX + 56, GY + 64);
    g.font = '13px Arial'; g.fillStyle = '#fff';
    MEAS.forEach((k, i) => { const col = i % 2, row = Math.floor(i / 2); g.fillText(`${k}: ${this.fmtMeas(k, r[k])}`, GX + 56 + col * 250, GY + 92 + row * 26); });
  }
}

// in-place radix-2 FFT
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let j = 0; j < len / 2; j++) { const a = i + j, b = a + len / 2; const xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr; re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } }
  }
}
