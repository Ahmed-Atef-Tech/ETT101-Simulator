// Draws the trainer front panel and handles its knobs / switches.
import { el, pts } from './svg.js';
import { FRAMES, BLOCKS, SOCKET_POS, KNOBS, SLIDES, DIPS, LEDS, TEXTS, LINES, DASHED, SYMBOLS } from './layout.js';
import { SOCKETS } from '../engine/modules.js';
import { LOGO } from './logo.js';

const W = '#eceae4'; // panel print colour

export function knobReadout(sim, mod, p) {
  const m = sim.mods[mod], v = m.p[p];
  switch (mod + '.' + p) {
    case 'adder.G': return `G = ${(2 * v).toFixed(2)}`;
    case 'adder.g': return `g = ${(2 * v).toFixed(2)}`;
    case 'tpg.WIDTH': return `Width = ${(5 + 35 * v).toFixed(1)} µs`;
    case 'tpg.DELAY': return `Delay = ${(50 + 250 * v).toFixed(0)} µs`;
    case 'buffer.GAIN': return `Gain = ${m.gain().toFixed(2)}`;
    case 'phase.PHASE': return `Phase ≈ ${(m.phaseDeg() + (m.p.INV ? 180 : 0)).toFixed(0)}° @ ${m.range === 'HI' ? '100 kHz' : '2.08 kHz'}`;
    case 'tlpf.FC': return `fc = ${(m.fc() / 1000).toFixed(2)} kHz`;
    case 'tlpf.GAIN': return `Gain = ${(2 * v).toFixed(2)}`;
    case 'vdc.VDC': return `VDC = ${m.volts().toFixed(2)} V`;
    case 'vco.GAIN': return `Sensitivity = ${(m.sens() / 1000).toFixed(2)} kHz/V`;
    case 'vco.FREQ': return `f0 = ${(m.f0() / 1000).toFixed(2)} kHz`;
  }
  return v.toFixed(2);
}

export class Panel {
  constructor(root, sim, hooks) {
    this.sim = sim; this.hooks = hooks; this.g = el('g', { id: 'board' }, root);
    this.knobEls = {}; this.ledEls = {}; this.slideEls = {}; this.dipEls = {};
    this.draw();
  }

  draw() {
    const g = this.g;
    // board
    el('rect', { x: 26, y: 6, width: 1192, height: 996, rx: 16, fill: 'url(#boardGrad)', stroke: '#000', 'stroke-width': 2 }, g);
    el('rect', { x: 30, y: 10, width: 1184, height: 988, rx: 13, fill: 'none', stroke: '#2b2b2e', 'stroke-width': 1.5 }, g);
    for (const [x, y] of [[44, 24], [1200, 24], [44, 984], [1200, 984], [44, 521], [1200, 521], [560, 521], [612, 24]]) this.screw(x, y);
    // header
    el('text', { x: 96, y: 56, text: 'Telecoms-Trainer', fill: W, 'font-size': 33, 'font-weight': 500, 'letter-spacing': -0.5, class: 'pt' }, g);
    el('rect', { x: 682, y: 35, width: 26, height: 26, fill: '#e9e2c9', rx: 2 }, g);
    el('text', { x: 716, y: 55, text: 'DIGITAL', fill: W, 'font-size': 15, class: 'pt' }, g);
    el('circle', { cx: 819, cy: 47, r: 13, fill: '#e9e2c9' }, g);
    el('text', { x: 842, y: 55, text: 'ANALOG', fill: W, 'font-size': 15, class: 'pt' }, g);
    el('text', { x: 1060, y: 38, text: 'DC IN', fill: W, 'font-size': 15, 'text-anchor': 'middle', class: 'pt' }, g);
    el('text', { x: 1048, y: 56, text: '9 -15V 1A', fill: W, 'font-size': 15, 'text-anchor': 'middle', class: 'pt' }, g);
    el('circle', { cx: 1109, cy: 41, r: 11, fill: '#bfc3c7', stroke: '#6c7075', 'stroke-width': 2 }, g);
    el('circle', { cx: 1109, cy: 41, r: 5, fill: '#111' }, g);
    // frames
    for (const [x1, y1, x2, y2] of FRAMES) el('rect', { x: x1, y: y1, width: x2 - x1, height: y2 - y1, fill: 'none', stroke: W, 'stroke-width': 1.7 }, g);
    for (const l of LINES) el('polyline', { points: pts(l), fill: 'none', stroke: W, 'stroke-width': 1.6 }, g);
    for (const l of DASHED) el('polyline', { points: pts(l), fill: 'none', stroke: W, 'stroke-width': 1.8, 'stroke-dasharray': '6 4' }, g);
    for (const [t, x, y] of SYMBOLS) this.symbol(t, x, y);
    for (const [x, y, t, s, a, w] of TEXTS) {
      if (!t.includes('_c')) { el('text', { x, y, text: t, fill: W, 'font-size': s, 'text-anchor': a, 'font-weight': w, class: 'pt' }, g); continue; }
      const tx = el('text', { x, y, fill: W, 'font-size': s, 'text-anchor': a, class: 'pt' }, g), [pre, post] = t.split('_c');
      el('tspan', { text: pre, 'font-weight': 700 }, tx); el('tspan', { text: 'c', 'font-weight': 700, dy: 3.5, 'font-size': s * 0.78 }, tx);
      if (post) el('tspan', { text: post, dy: -3.5 }, tx);
    }
    // owner logo in the expansion area (where the trainer's own logo is printed on the real board)
    const lg = el('g', { fill: W, class: 'ownerLogo' }, g), M = LOGO.mark, X = LOGO.text;
    const ms = 112 / M.w; el('path', { d: M.d, transform: `translate(${1058 - 56},${700}) scale(${ms})`, 'fill-rule': 'evenodd' }, lg);
    const ts = 214 / X.w; el('path', { d: X.d, transform: `translate(${1058 - 107},${836}) scale(${ts})`, 'fill-rule': 'evenodd' }, lg);
    // sockets
    this.sockG = el('g', {}, g);
    for (const id in SOCKET_POS) this.socket(id);
    for (const k of KNOBS) this.knob(...k);
    for (const s of SLIDES) this.slide(...s);
    for (const d of DIPS) this.dip(...d);
    for (const [id, x, y] of LEDS) this.led(id, x, y);
    // info buttons
    this.infoG = el('g', { class: 'infoLayer' }, g);
    for (const id in BLOCKS) {
      const [, y1, x2] = BLOCKS[id];
      const b = el('g', { class: 'infoBtn', transform: `translate(${x2 - 11},${y1 + 11})`, 'data-mod': id }, this.infoG);
      el('circle', { r: 9, fill: '#f2c21b', stroke: '#1e2427', 'stroke-width': 1.4 }, b);
      el('text', { y: 4.6, text: 'i', fill: '#1e2427', 'font-size': 13.5, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Georgia,serif', 'font-style': 'italic' }, b);
      b.addEventListener('click', e => { e.stopPropagation(); this.hooks.info(id); });
    }
  }

  screw(x, y) {
    const g = el('g', { transform: `translate(${x},${y})` }, this.g);
    el('circle', { r: 8, fill: 'url(#screwGrad)', stroke: '#555', 'stroke-width': 1 }, g);
    el('path', { d: 'M-5,-1.2 h10 v2.4 h-10z M-1.2,-5 h2.4 v10 h-2.4z', fill: '#5b5b5b', transform: `rotate(${(x * 7 + y * 3) % 90})` }, g);
  }

  socket(id) {
    const [x, y] = SOCKET_POS[id], kind = SOCKETS[id][3];
    const g = el('g', { class: 'sock', 'data-socket': id, transform: `translate(${x},${y})` }, this.sockG);
    if (kind === 'd') el('rect', { x: -13, y: -13, width: 26, height: 26, rx: 2.5, fill: 'url(#creamGrad)', stroke: '#7b6e4d', 'stroke-width': 1 }, g);
    else el('circle', { r: 13, fill: 'url(#creamGrad)', stroke: '#7b6e4d', 'stroke-width': 1 }, g);
    el('circle', { r: 6.2, fill: '#3a2e1c', stroke: '#b89c5b', 'stroke-width': 1.6 }, g);
    el('circle', { r: 2.6, fill: '#050403' }, g);
    el('circle', { r: 16, class: 'sockHit', fill: 'transparent' }, g);
  }

  knob(mod, p, x, y) {
    const g = el('g', { class: 'knob', transform: `translate(${x},${y})`, 'data-mod': mod, 'data-p': p }, this.g);
    el('rect', { x: -23, y: -23, width: 46, height: 46, rx: 3, fill: 'url(#potGrad)', stroke: '#8c7536', 'stroke-width': 1.2 }, g);
    el('rect', { x: -20, y: -20, width: 40, height: 40, rx: 2, fill: 'none', stroke: 'rgba(255,255,255,.35)', 'stroke-width': 1 }, g);
    el('circle', { r: 16.5, fill: 'url(#rotorGrad)', stroke: '#9b8240', 'stroke-width': 1.2 }, g);
    const rot = el('g', {}, g);
    el('rect', { x: -2.4, y: -14, width: 4.8, height: 28, rx: 1.5, fill: '#6b5622' }, rot);
    el('rect', { x: -1, y: -14, width: 2, height: 9, fill: '#3c2f0f' }, rot); // pointer half
    this.knobEls[mod + '.' + p] = rot;
    this.updateKnob(mod, p);
    // interaction
    el('rect', { x: -30, y: -30, width: 60, height: 60, fill: 'transparent' }, g);
    let last = null, cx = 0, cy = 0;
    const move = e => {
      const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy), fine = e.shiftKey ? 0.2 : 1;
      if (last) {
        const mx = e.clientX - last.x, my = e.clientY - last.y;
        let dv = (mx - my) / 260; // right / up = clockwise
        if (last.d > 12) { const rx = (last.x - cx) / last.d, ry = (last.y - cy) / last.d; const tang = rx * my - ry * mx, rad = rx * mx + ry * my; if (Math.abs(tang) > Math.abs(rad)) dv = (tang / last.d) * 180 / Math.PI / 270; } // turning around the pot like a screwdriver
        this.setKnob(mod, p, this.sim.mods[mod].p[p] + dv * fine);
      }
      last = { x: e.clientX, y: e.clientY, a: Math.atan2(dy, dx), d }; this.hooks.knobTip(mod, p, e);
    };
    const up = e => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); this.hooks.knobTip(null); };
    g.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const b = g.getBoundingClientRect(); cx = b.x + b.width / 2; cy = b.y + b.height / 2; last = null; move(e); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); this.hooks.knobTip(mod, p, e); });
    g.addEventListener('wheel', e => { e.preventDefault(); e.stopPropagation(); const st = e.shiftKey ? 0.002 : 0.012; this.setKnob(mod, p, this.sim.mods[mod].p[p] - Math.sign(e.deltaY) * st); this.hooks.knobTip(mod, p, e, true); }, { passive: false });
    g.addEventListener('pointerenter', e => this.hooks.hoverKnob(mod, p, e));
    g.addEventListener('pointerleave', () => this.hooks.hoverKnob(null));
  }
  setKnob(mod, p, v) { v = Math.max(0, Math.min(1, v)); this.sim.mods[mod].set(p, v); this.updateKnob(mod, p); this.hooks.changed(); }
  updateKnob(mod, p) { const v = this.sim.mods[mod].p[p]; this.knobEls[mod + '.' + p].setAttribute('transform', `rotate(${-135 + 270 * v})`); }

  slide(mod, p, x, y, mode) {
    const g = el('g', { class: 'slide', transform: `translate(${x},${y})` }, this.g);
    el('rect', { x: -13, y: -25, width: 26, height: 50, fill: 'none', stroke: W, 'stroke-width': 1.6 }, g);
    el('rect', { x: -9, y: -21, width: 18, height: 42, rx: 2, fill: 'url(#slideGrad)', stroke: '#555', 'stroke-width': 1 }, g);
    el('rect', { x: -5, y: -17, width: 10, height: 34, rx: 1.5, fill: '#1b1b1b' }, g);
    const th = el('g', {}, g);
    el('rect', { x: -6, y: -8, width: 12, height: 16, rx: 2, fill: 'url(#thumbGrad)', stroke: '#777', 'stroke-width': .8 }, th);
    for (const dy of [-4, 0, 4]) el('line', { x1: -4, x2: 4, y1: dy, y2: dy, stroke: '#888', 'stroke-width': 1 }, th);
    this.slideEls[mod + '.' + p] = { th, mode };
    this.updateSlide(mod, p);
    g.addEventListener('pointerdown', e => { e.stopPropagation(); const m = this.sim.mods[mod]; m.set(p, m.p[p] ? 0 : 1); this.updateSlide(mod, p); this.hooks.changed(); this.hooks.click(); });
  }
  updateSlide(mod, p) {
    const { th, mode } = this.slideEls[mod + '.' + p]; let v = this.sim.mods[mod].p[p]; if (mode === 'inv') v = 1 - v;
    th.setAttribute('transform', `translate(0,${v ? 8 : -8})`);
  }

  dip(mod, x, y) {
    const g = el('g', { class: 'dip', transform: `translate(${x},${y})` }, this.g);
    el('rect', { x: -14, y: -21, width: 28, height: 42, fill: 'none', stroke: W, 'stroke-width': 1.5 }, g);
    el('rect', { x: -11, y: -17, width: 22, height: 34, rx: 2, fill: '#d42a2a', stroke: '#8d1414', 'stroke-width': 1 }, g);
    const t = [];
    for (const [i, p] of [[0, 'S1'], [1, 'S2']]) {
      const cx = -5 + 10 * i;
      el('rect', { x: cx - 3.5, y: -13, width: 7, height: 26, rx: 1, fill: '#6d0e0e' }, g);
      const k = el('rect', { x: cx - 3.5, width: 7, height: 12, rx: 1, fill: '#f6f2ea', stroke: '#bbb', 'stroke-width': .6, class: 'dipk' }, g);
      t.push([k, p]);
      k.addEventListener('pointerdown', e => { e.stopPropagation(); const m = this.sim.mods[mod]; m.set(p, m.p[p] ? 0 : 1); this.updateDip(mod); this.hooks.changed(); this.hooks.click(); });
    }
    this.dipEls[mod] = t; this.updateDip(mod);
  }
  updateDip(mod) { for (const [k, p] of this.dipEls[mod]) k.setAttribute('y', this.sim.mods[mod].p[p] ? 1 : -13); }

  led(id, x, y) {
    const g = el('g', { transform: `translate(${x},${y})` }, this.g);
    el('circle', { r: 9.5, fill: 'none', stroke: W, 'stroke-width': 1.5 }, g);
    const c = el('circle', { r: 5.6, fill: '#4a0d0d', stroke: '#200', 'stroke-width': 1 }, g);
    this.ledEls[id] = c;
  }
  updateLeds() {
    const s = (id, on) => { const c = this.ledEls[id]; const v = on ? 1 : 0; if (c._v === v) return; c._v = v; c.setAttribute('fill', on ? '#ff3b2f' : '#4a0d0d'); c.setAttribute('filter', on ? 'url(#ledGlow)' : ''); };
    s('power', true); s('phase', this.sim.mods.phase.led); s('pcmdec', this.sim.mods.pcmdec.led);
  }
  refreshAll() { for (const [m, p] of KNOBS) this.updateKnob(m, p); for (const [m, p] of SLIDES) this.updateSlide(m, p); for (const [m] of DIPS) this.updateDip(m); }

  // ---------------- panel symbols ----------------
  symbol(t, x, y) {
    const g = el('g', { transform: `translate(${x},${y})`, fill: 'none', stroke: W, 'stroke-width': 1.6 }, this.g);
    const box = (w = 30, h = 30) => el('rect', { x: -w / 2, y: -h / 2, width: w, height: h }, g);
    const line = (x1, y1, x2, y2) => el('line', { x1, y1, x2, y2 }, g);
    const txt = (s, sz = 11, dy = 4) => el('text', { y: dy, text: s, fill: W, stroke: 'none', 'font-size': sz, 'text-anchor': 'middle', 'font-weight': 700, class: 'pt' }, g);
    const ins = (n, w = 15) => { if (n === 1) line(-w - 16, 0, -w, 0); else { line(-w - 16, -6, -w, -6); line(-w - 16, 6, -w, 6); } };
    const outs = (n, w = 15) => { if (n === 1) line(w, 0, w + 16, 0); else { line(w, -6, w + 16, -6); line(w, 6, w + 16, 6); } };
    switch (t) {
      case 'add': box(); ins(2); outs(1); line(-9, 0, 9, 0); line(0, -9, 0, 9); g.setAttribute('stroke-width', 2.2); break;
      case 'mul': box(); ins(2); outs(1); line(-7, -7, 7, 7); line(-7, 7, 7, -7); break;
      case 'tpg': g.setAttribute('transform', 'translate(0,0)');
        el('rect', { x: 356.5, y: 127, width: 32, height: 32 }, g);
        el('path', { d: 'M342,150 H356.5 M388.5,136 H404 M388.5,150 H404' }, g);
        el('path', { d: 'M356.5,147.4 L360.3,150 L356.5,152.6', 'stroke-width': 1.3 }, g);
        el('path', { d: 'M361,140 H365.2 V134.8 H372.6 V140 H383.2 M366,153.1 H373.2 V146.3 H379.6 V153.1 H383.2', 'stroke-width': 1.5 }, g); break;
      case 'sh': el('rect', { x: -16, y: -16.5, width: 32, height: 33 }, g); el('path', { d: 'M-16,3 l6,4 l-6,4', 'stroke-width': 1.4 }, g); txt('S/H', 10, 2); break;
      case 'noise': box(28, 30); line(14, 0, 32, 0); el('path', { d: 'M-10,8 l3,-16 l3,14 l3,-12 l3,12 l3,-15 l3,16' }, g); break;
      case 'buf': el('path', { d: 'M-8,-9 L10,0 L-8,9 Z' }, g); line(-26, 0, -8, 0); line(10, 0, 28, 0); break;
      case 'phase': box(28, 28); ins(1, 14); outs(1, 14); txt('Ø', 17, 6); break;
      case 'lpf': box(30, 30); line(-29, 0, -15, 0); line(15, 0, 30, 0);
        el('path', { d: 'M-9,-5.5 c3,-4 6.5,-4 9.5,0 s6.5,4 9.5,0 M-9,5.8 c3,-4 6.5,-4 9.5,0 s6.5,4 9.5,0', 'stroke-width': 1.5 }, g);
        el('path', { d: 'M-4,-2 L5,-9', 'stroke-width': 1.5 }, g); break;
      case 'bpf_s': case 'lpf_s': { box(28, 28);
        const wave = y => `M-8,${y} c2.5,-3.6 5.5,-3.6 8,0 s5.5,3.6 8,0`, cross = y => `M-2.5,${y + 3.2} L2.5,${y - 3.2}`;
        const crossed = t === 'bpf_s' ? [true, false, true] : [true, true, false];
        [-7, 0, 7].forEach((y, i) => { el('path', { d: wave(y), 'stroke-width': 1.5 }, g); if (crossed[i]) el('path', { d: cross(y), 'stroke-width': 1.5 }, g); });
        break; }
      case 'vco': box(32, 30); line(-32, 0, -16, 0); line(16, -6, 32, -6); line(16, 6, 32, 6);
        el('path', { d: 'M-10,-3 v-7 h6 v7 h6 v-7 h6 M-10,6 q5,-7 10,0 t10,0', 'stroke-width': 1.3 }, g); break;
      case 'master': g.setAttribute('transform', 'translate(0,0)');
        el('rect', { x: 598, y: 597.5, width: 32, height: 32 }, g);
        el('path', { d: 'M630,606.8 H647.2 M630,621.2 H647.2' }, g);
        el('path', { d: 'M604.2,607.4 C605.4,602.4 610.6,601.6 613.6,606.6 S621.6,614.6 623.8,607.4 M603.5,623.3 H608.3 V617.1 H615.5 V623.3 H623.5 V616.8', 'stroke-width': 1.5 }, g); break;
      case 'pcmenc': g.setAttribute('transform', 'translate(0,0)');
        el('path', { d: 'M464.3,614.3 H480.6 M499.1,598.2 L480.6,614.3 L499.1,630.8 M499.1,598 H516.5 V631 H499.1 Z M516.5,621.6 H531.7 M464.3,635.4 H508.3 V631 M504.5,630.3 L508.3,625.2 L512.1,630.3' }, g); break;
      case 'pcmdec': g.setAttribute('transform', 'translate(0,0)');
        el('path', { d: 'M838.5,622 H854.4 M854.4,598 H870.4 V631 H854.4 Z M870.4,598 L889,614.5 L870.4,631 M889,614.5 H905.5 M838.5,635.5 H862.4 V631 M858.7,630 L862.4,625.5 L866.1,630' }, g); break;
      case 's2p': box(36, 30); line(-36, -6, -18, -6); line(-36, 6, -18, 6); line(18, -6, 36, -6); line(18, 6, 36, 6); el('path', { d: 'M-18,2 l5,4 l-5,4' }, g); txt('S/P', 10); break;
      case 'sum': box(14, 14); line(-4.5, 0, 4.5, 0); line(0, -4.5, 0, 4.5); g.setAttribute('stroke-width', 1.9); break;
      case 'comp': box(25, 25); el('path', { d: 'M-6.5,6.5 H0 V-7.5 H7.5 M-6.5,-0.5 H7.5', 'stroke-width': 1.5 }, g); break;
      case 'xor': box(24, 22); el('circle', { r: 6.5 }, g); line(-6.5, 0, 6.5, 0); line(0, -6.5, 0, 6.5); break;
      case 'div': box(28, 28); txt('÷', 18, 6); break;
      case 'tri': el('path', { d: 'M-13,-8 L13,0 L-13,8 Z' }, g); break;
      case 'triA': el('path', { d: 'M-9.5,-8.5 L9.5,0 L-9.5,8.5 Z' }, g); break;
      case 'triB': el('path', { d: 'M-7.4,-8.6 L7.4,0 L-7.4,8.6 Z' }, g); break;
      case 'sumA': box(12.4, 12.4); line(-4, 0, 4, 0); line(0, -4, 0, 4); g.setAttribute('stroke-width', 1.8); break;
      case 'sw': el('circle', { cx: -11, cy: 0, r: 2.6, fill: W, stroke: 'none' }, g); el('circle', { cx: 12, cy: 0, r: 2.6, fill: W, stroke: 'none' }, g); line(-11, 0, 6, -10); break;
      case 'arrUp': el('path', { d: 'M-4,6 L0,-1 L4,6 Z', fill: W, stroke: 'none' }, g); break;
      case 'arrDn': el('path', { d: 'M-4,-6 L0,1 L4,-6 Z', fill: W, stroke: 'none' }, g); break;
      case 'icon_width': line(-10, -9, 10, -9); el('path', { d: 'M-6,-12 l-4,3 l4,3 M6,-12 l4,3 l-4,3', 'stroke-width': 1.3 }, g); el('path', { d: 'M-16,10 h7 v-12 h18 v12 h7' }, g); break;
      case 'icon_delay': line(-10, -7, 10, -7); el('path', { d: 'M-6,-10 l-4,3 l4,3 M6,-10 l4,3 l-4,3', 'stroke-width': 1.3 }, g); el('path', { d: 'M-18,12 h12 v-12 h22' }, g); break;
      case 'headphone': el('path', { d: 'M-10,6 v-4 a10,10 0 0 1 20,0 v4', 'stroke-width': 2.5 }, g); el('rect', { x: -13, y: 3, width: 6, height: 11, rx: 2, fill: W }, g); el('rect', { x: 7, y: 3, width: 6, height: 11, rx: 2, fill: W }, g); break;
      case 'jack': { g.setAttribute('class', 'hpjack'); el('circle', { r: 12.5, fill: '#d3d5d8', stroke: '#888', 'stroke-width': 1.5 }, g); el('circle', { r: 8, fill: '#9a9da1', stroke: '#555', 'stroke-width': 1 }, g); el('circle', { r: 4.2, fill: '#060606', stroke: 'none' }, g);
        g.addEventListener('pointerdown', e => { e.stopPropagation(); this.hooks.toggleHeadphones(); }); break; }
      case 'mic': el('circle', { r: 12, fill: '#8d8f93', stroke: '#c9c9c9', 'stroke-width': 2 }, g); el('circle', { r: 8, fill: 'url(#micGrad)', stroke: 'none' }, g);
        el('path', { d: 'M23,8 l7,-9 M26,-4 a4,4 0 1 1 6,4 l-5,-4 z', 'stroke-width': 2, fill: W }, g); el('path', { d: 'M33,-9 a6,6 0 0 1 3,7 M35,-12 a10,10 0 0 1 5,11', 'stroke-width': 1 }, g); break;
      case 'dsub': el('rect', { x: -47, y: -18, width: 94, height: 36 }, g); break;
    }
  }
}
