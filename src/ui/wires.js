// Patch leads (2 mm stackable) and oscilloscope leads (BNC -> 2 mm).
import { el } from './svg.js';
import { SOCKET_POS } from './layout.js';

export const LEAD_COLORS = { red: '#d3261f', black: '#4a5057', yellow: '#f2c21b', blue: '#1f5fd1', green: '#1f9a45' };
const DARK = { red: '#7c120e', black: '#16191c', yellow: '#94720a', blue: '#0e3274', green: '#0d5023' };
const HOLD_MS = 800; // touch: hold a socket this long (a ring fills meanwhile) for its menu
const PROBE_TAG = { CH1: '#f2d21b', CH2: '#35d0f0', EXT: '#c8c8c8' };

export class Wires {
  constructor(svg, layer, sim, scope, hooks) {
    this.svg = svg; this.layer = layer; this.sim = sim; this.scope = scope; this.hooks = hooks;
    this.color = 'red'; this.paths = new Map(); this.probeEls = {};
    this.tmp = null; this.sel = null; // sel: the highlighted lead id, or 'probe:CH1'
    this.probeBend = {}; // probe cable shapes, like lead.bend: the point the cable is pulled through
    this.probeColor = {}; // probe cable colour per channel; none = black (old files and the 68 ready-made setups)
    this.bendDrag = null; this.justBent = false;
    this.wireG = el('g', {}, layer); this.probeG = el('g', {}, layer); this.plugG = el('g', {}, layer); this.dragG = el('g', {}, layer);
    svg.addEventListener('pointerdown', e => this.down(e));
    window.addEventListener('pointermove', e => this.move(e));
    window.addEventListener('pointerup', e => this.up(e));
  }
  toSvg(e) { const p = this.svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(this.svg.getScreenCTM().inverse()); }
  sockAt(e) {
    if (e.pointerType === 'touch') { // a finger: a lead's cable under it wins, otherwise the socket whose centre is nearest
      const u = document.elementFromPoint(e.clientX, e.clientY); if (u && u.closest('.lead') && !u.closest('[data-socket]')) return null;
      return this.nearSocket(e);
    }
    const t = document.elementFromPoint(e.clientX, e.clientY); if (!t) return null;
    const s = t.closest('[data-socket]'); if (s) return { sock: s.getAttribute('data-socket') };
    const b = t.closest('[data-bnc]'); if (b) return { bnc: b.getAttribute('data-bnc') };
    return null;
  }
  // a fingertip is wider than a socket: take the nearest socket or BNC within about 22 screen pixels
  nearSocket(e) {
    const m = this.svg.getScreenCTM(); if (!m) return null; const R2 = 22 * 22; let best = null, bd = R2;
    const test = (p, hit) => { const x = m.a * p[0] + m.c * p[1] + m.e, y = m.b * p[0] + m.d * p[1] + m.f, d = (x - e.clientX) ** 2 + (y - e.clientY) ** 2; if (d < bd) { bd = d; best = hit; } };
    for (const k in SOCKET_POS) test(SOCKET_POS[k], { sock: k });
    for (const ch of ['CH1', 'CH2', 'EXT']) test(this.scope.bncPos(ch), { bnc: ch });
    return best;
  }
  endHold() { if (this.hold) { clearTimeout(this.hold.t); this.hold.ring.remove(); this.hold = null; } }
  // a second finger landed (pinch): drop whatever the first finger started
  cancel() {
    this.endHold();
    if (this.tmp) { this.tmp.path.remove(); this.tmp = null; this.svg.classList.remove('dragging'); this.hooks.hoverTarget(null); }
    if (this.bendDrag) { const bd = this.bendDrag; clearTimeout(bd.press); this.bendDrag = null; this.svg.classList.remove('bending'); if (bd.moved) this.hooks.changed(); }
  }
  // touch: two taps on the same lead within 350 ms remove it (the mouse uses a double-click)
  doubleTap(id) { const now = performance.now(), hit = this.lastTap && this.lastTap.id === id && now - this.lastTap.t < 350; this.lastTap = hit ? null : { id, t: now }; return hit; }
  pos(sock) { return SOCKET_POS[sock]; }

  // ---------- creating leads by dragging ----------
  // after "lead to another socket" (or "probe to a socket") the next tap on a socket makes the connection
  setPending(from) {
    this.layer.querySelectorAll('.pendingRing').forEach(x => x.remove()); this.pending = from || null; if (!from) return;
    const p = from.sock ? this.pos(from.sock) : this.scope.bncPos(from.bnc);
    el('circle', { class: 'pendingRing', cx: p[0], cy: p[1], r: from.bnc ? 26 : 16, fill: 'none', 'pointer-events': 'none' }, this.dragG);
  }
  connect(a, b) { // a and b: { sock } or { bnc }; returns true when something was connected
    if (a.sock && b.sock && a.sock !== b.sock) { this.addLead(a.sock, b.sock, this.color); this.hooks.plugged(); return true; }
    const bnc = a.bnc || b.bnc, sock = a.sock || b.sock;
    if (bnc && sock && !(a.bnc && b.bnc)) { this.probeColor[bnc] = this.color; this.setProbe(bnc, sock); this.hooks.plugged(); return true; }
    return false;
  }
  down(e) {
    if (e.button !== 0) return;
    const hit = this.sockAt(e);
    if (this.pending && hit) { // the other end of a lead started from a menu
      e.preventDefault(); const from = this.pending; this.setPending(null);
      if (!(from.sock && from.sock === hit.sock) && !(from.bnc && from.bnc === hit.bnc)) this.hooks.pendingDone(this.connect(from, hit));
      else this.hooks.pendingDone(false);
      return;
    }
    if (!hit) {
      const g = e.target.closest && e.target.closest('.lead');
      if (g) {
        const ch = g.getAttribute('data-probe'), lead = ch ? null : this.sim.leads.find(l => l.id === g.getAttribute('data-lead'));
        if (ch || lead) {
          e.preventDefault(); const bd = this.bendDrag = { g, ch, lead, x: e.clientX, y: e.clientY, moved: false, touch: e.pointerType === 'touch' };
          // touch: hold still for half a second = the right-click menu (colour, reset shape, remove)
          if (bd.touch) bd.press = setTimeout(() => { if (this.bendDrag === bd && !bd.moved) { bd.menu = true; this.longPressT = performance.now(); this.hooks.leadMenu(ch ? { probe: ch } : lead, { clientX: bd.x, clientY: bd.y }); } }, 550);
        }
      }
      return;
    }
    e.preventDefault();
    const pl = e.target.closest && e.target.closest('[data-lead-of]');
    // a new lead must not be born dimmed under another lead's highlight
    if (this.sel && !(pl && pl.getAttribute('data-lead-of') === this.sel)) { this.sel = null; this.layer.classList.remove('hasSel'); this.layer.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); }
    this.downAt = { x: e.clientX, y: e.clientY, lead: pl ? pl.getAttribute('data-lead-of') : null };
    const p0 = hit.sock ? this.pos(hit.sock) : this.scope.bncPos(hit.bnc);
    // touch: holding a socket still for a moment opens its menu (connect to CH1 / CH2 / EXT, or tap the other end)
    if (e.pointerType === 'touch') {
      const ring = el('circle', { class: 'holdRing', cx: p0[0], cy: p0[1], r: hit.bnc ? 26 : 16, fill: 'none', 'pointer-events': 'none', pathLength: 100 }, this.dragG);
      this.hold = { x: e.clientX, y: e.clientY, ring, t: setTimeout(() => { const h = this.hold; if (!h) return; this.hold = null; h.ring.remove(); if (this.tmp) { this.tmp.path.remove(); this.tmp = null; this.svg.classList.remove('dragging'); this.hooks.hoverTarget(null); } this.hooks.socketMenu(hit, { clientX: h.x, clientY: h.y }); }, HOLD_MS) };
    }
    this.tmp = { from: hit, p0, path: el('path', { class: 'leadTmp', 'pointer-events': 'none', fill: 'none', stroke: LEAD_COLORS[this.color], 'stroke-width': hit.bnc ? 8 : 6.5, 'stroke-linecap': 'round', opacity: .85 }, this.dragG) };
    this.svg.classList.add('dragging');
  }
  move(e) {
    const bd = this.bendDrag;
    if (bd) {
      if (bd.menu || (!bd.moved && Math.hypot(e.clientX - bd.x, e.clientY - bd.y) < (bd.touch ? 10 : 4))) return;
      if (!bd.moved) { bd.moved = true; clearTimeout(bd.press); this.svg.classList.add('bending'); this.hooks.hoverLead(null); }
      const p = this.toSvg(e), pt = [Math.max(-300, Math.min(2700, p.x)), Math.max(-300, Math.min(1400, p.y))];
      if (bd.ch) this.probeBend[bd.ch] = pt; else bd.lead.bend = pt;
      // reshape in place (no redraw) so the drag stays smooth and the click that follows can be told apart
      const [a, b] = bd.ch ? [this.scope.bncPos(bd.ch), this.pos(this.sim.probes[bd.ch])] : [this.pos(bd.lead.a), this.pos(bd.lead.b)];
      const d = this.through(a, b, pt);
      bd.g.querySelectorAll('path').forEach(el => el.setAttribute('d', d));
      return;
    }
    if (this.hold && Math.hypot(e.clientX - this.hold.x, e.clientY - this.hold.y) > 10) this.endHold();
    if (!this.tmp) return; const p = this.toSvg(e); this.tmp.path.setAttribute('d', this.curve(this.tmp.p0, [p.x, p.y], !!this.tmp.from.bnc));
    const hit = this.sockAt(e); this.hooks.hoverTarget(hit && hit.sock);
  }
  up(e) {
    const bd = this.bendDrag;
    if (bd) {
      clearTimeout(bd.press); this.bendDrag = null; this.svg.classList.remove('bending');
      if (bd.moved) { this.justBent = true; setTimeout(() => { this.justBent = false; }, 0); this.hooks.changed(); }
      else if (bd.touch && !bd.menu && this.doubleTap(bd.ch ? 'probe:' + bd.ch : bd.lead.id)) { if (bd.ch) this.setProbe(bd.ch, null); else this.removeLead(bd.lead.id); }
      return;
    }
    this.endHold();
    if (!this.tmp) return;
    const from = this.tmp.from, hit = this.sockAt(e);
    this.tmp.path.remove(); this.tmp = null; this.svg.classList.remove('dragging'); this.hooks.hoverTarget(null);
    if (!hit) return;
    const d = this.downAt; if (d && d.lead && from.sock && hit.sock === from.sock && Math.hypot(e.clientX - d.x, e.clientY - d.y) < (e.pointerType === 'touch' ? 10 : 4)) {
      if (e.pointerType === 'touch' && this.doubleTap(d.lead)) { if (d.lead.startsWith('probe:')) this.setProbe(d.lead.slice(6), null); else this.removeLead(d.lead); return; } // two taps on a plug remove its lead
      this.select(this.sel === d.lead ? null : d.lead); return;
    }
    this.connect(from, hit);
  }

  select(id) {
    this.sel = id;
    this.layer.classList.toggle('hasSel', !!id);
    this.layer.querySelectorAll('.sel').forEach(x => x.classList.remove('sel'));
    if (!id) return;
    const g = id.startsWith('probe:') ? this.layer.querySelector(`.lead.probe[data-probe="${id.slice(6)}"]`) : this.layer.querySelector(`.lead[data-lead="${id}"]`);
    if (g) { g.classList.add('sel'); g.parentNode.appendChild(g); }
    this.layer.querySelectorAll(`[data-lead-of="${id}"]`).forEach(x => x.classList.add('sel'));
  }
  resetShape(target) { if (target && target.probe) delete this.probeBend[target.probe]; else if (target) delete target.bend; this.render(); this.hooks.changed(); }
  // a smooth cable from a to b that passes through m (both control points at (8m - a - b) / 6 put B(0.5) on m)
  through(a, b, m) { const px = (8 * m[0] - a[0] - b[0]) / 6, py = (8 * m[1] - a[1] - b[1]) / 6; return `M${a[0]},${a[1]} C${px},${py} ${px},${py} ${b[0]},${b[1]}`; }
  addLead(a, b, color) { this.sel = null; const id = this.sim.addLead(a, b, color); this.render(); this.hooks.changed(); return id; }
  removeLead(id) { this.sim.removeLead(id); this.render(); this.hooks.changed(); }
  setProbe(ch, sock) { if (this.sim.probes[ch] !== sock) delete this.probeBend[ch]; this.sim.setProbe(ch, sock); this.render(); this.hooks.changed(); }
  clearAll() { this.probeBend = {}; this.probeColor = {}; this.sim.leads = []; for (const k in this.sim.probes) this.sim.probes[k] = null; this.sim.rebuild(); this.render(); this.hooks.changed(); }

  curve(a, b, heavy) {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
    const sag = Math.min(heavy ? 220 : 150, (heavy ? 40 : 22) + d * (heavy ? 0.33 : 0.28));
    return `M${a[0]},${a[1]} C${a[0] + dx * 0.15},${a[1] + sag} ${b[0] - dx * 0.15},${b[1] + sag} ${b[0]},${b[1]}`;
  }

  render() {
    this.wireG.innerHTML = ''; this.plugG.innerHTML = ''; this.probeG.innerHTML = '';
    if (this.sel && !(this.sel.startsWith('probe:') ? this.sim.probes[this.sel.slice(6)] : this.sim.leads.some(l => l.id === this.sel))) this.sel = null;
    this.layer.classList.toggle('hasSel', !!this.sel);
    const stack = {};
    const plug = (sock, color, dark, tag, owner) => {
      const [x, y] = this.pos(sock); const n = stack[sock] = (stack[sock] || 0) + 1; const off = (n - 1) * -3.5;
      const g = el('g', { transform: `translate(${x},${y + off})`, class: 'plug' }, this.plugG);
      g.setAttribute('data-socket', sock); if (owner) { g.setAttribute('data-lead-of', owner); if (owner === this.sel) g.classList.add('sel'); }
      el('circle', { r: 15, class: 'plugGlow' }, g); el('circle', { r: 10.5, fill: dark }, g); el('circle', { r: 8.5, fill: color }, g); el('circle', { r: 4, fill: dark, opacity: .6 }, g);
      if (tag) el('circle', { r: 11.5, fill: 'none', stroke: tag, 'stroke-width': 2.5 }, g);
      return g;
    };
    for (const l of this.sim.leads) {
      const a = this.pos(l.a), b = this.pos(l.b), c = LEAD_COLORS[l.color], dk = DARK[l.color];
      const g = el('g', { class: 'lead' + (l.id === this.sel ? ' sel' : ''), 'data-lead': l.id }, this.wireG);
      const d = l.bend ? this.through(a, b, l.bend) : this.curve(a, b);
      el('path', { d, fill: 'none', 'stroke-width': 18, 'stroke-linecap': 'round', class: 'leadGlow' }, g);
      el('path', { d, fill: 'none', stroke: dk, 'stroke-width': 8, 'stroke-linecap': 'round', class: 'leadOut' }, g);
      el('path', { d, fill: 'none', stroke: c, 'stroke-width': 5.6, 'stroke-linecap': 'round' }, g);
      el('path', { d, fill: 'none', stroke: 'rgba(255,255,255,.28)', 'stroke-width': 1.6, transform: 'translate(-1,-1.5)' }, g);
      el('path', { d, fill: 'none', stroke: 'transparent', 'stroke-width': 16, class: 'leadHit' }, g);
      g.addEventListener('click', e => { if (e.detail > 1 || this.justBent) return; e.stopPropagation(); this.select(this.sel === l.id ? null : l.id); });
      g.addEventListener('dblclick', e => { e.stopPropagation(); this.removeLead(l.id); });
      g.addEventListener('contextmenu', e => { e.preventDefault(); if (performance.now() - (this.longPressT || -1e9) < 1500) return; this.hooks.leadMenu(l, e); });
      g.addEventListener('pointerenter', e => this.hooks.hoverLead(l, e)); g.addEventListener('pointerleave', () => this.hooks.hoverLead(null));
      for (const s of [l.a, l.b]) { const p = plug(s, c, dk, null, l.id); p.addEventListener('dblclick', e => { e.stopPropagation(); this.removeLead(l.id); }); }
    }
    for (const ch in this.sim.probes) {
      const s = this.sim.probes[ch]; if (!s || !PROBE_TAG[ch]) continue; // HOV is the socket tooltip's hidden probe, not a lead
      const a = this.scope.bncPos(ch), b = this.pos(s), pc = LEAD_COLORS[this.probeColor[ch]] ? this.probeColor[ch] : 'black', c = LEAD_COLORS[pc], dk = DARK[pc];
      const pid = 'probe:' + ch;
      const g = el('g', { class: 'lead probe' + (pid === this.sel ? ' sel' : ''), 'data-probe': ch }, this.probeG);
      const d = this.probeBend[ch] ? this.through(a, b, this.probeBend[ch]) : this.curve(a, b, true);
      el('path', { d, fill: 'none', 'stroke-width': 22, 'stroke-linecap': 'round', class: 'leadGlow' }, g);
      el('path', { d, fill: 'none', stroke: pc === 'black' ? '#101214' : dk, 'stroke-width': 10, 'stroke-linecap': 'round', class: 'leadOut' }, g);
      el('path', { d, fill: 'none', stroke: pc === 'black' ? '#3d4248' : c, 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
      el('path', { d, fill: 'none', stroke: 'rgba(255,255,255,.18)', 'stroke-width': 2, transform: 'translate(-1,-2)' }, g);
      el('path', { d, fill: 'none', stroke: 'transparent', 'stroke-width': 16, class: 'leadHit' }, g);
      g.addEventListener('click', e => { if (e.detail > 1 || this.justBent) return; e.stopPropagation(); this.select(this.sel === pid ? null : pid); });
      g.addEventListener('contextmenu', e => { e.preventDefault(); if (performance.now() - (this.longPressT || -1e9) < 1500) return; this.hooks.leadMenu({ probe: ch }, e); });
      g.addEventListener('pointerenter', e => this.hooks.hoverLead({ probe: ch }, e)); g.addEventListener('pointerleave', () => this.hooks.hoverLead(null));
      g.addEventListener('dblclick', e => { e.stopPropagation(); this.setProbe(ch, null); });
      const p = plug(s, pc === 'black' ? '#3d4248' : c, dk, PROBE_TAG[ch], pid); p.addEventListener('dblclick', e => { e.stopPropagation(); this.setProbe(ch, null); });
      // BNC plug at scope
      const g2 = el('g', { transform: `translate(${a[0]},${a[1]})`, 'data-bnc': ch, class: 'bncPlug' }, this.probeG);
      el('circle', { r: 17, fill: 'url(#bncGrad)', stroke: '#555', 'stroke-width': 1.5 }, g2);
      el('circle', { r: 9, fill: '#1c1c1c' }, g2);
      el('circle', { r: 19, fill: 'none', stroke: PROBE_TAG[ch], 'stroke-width': 2 }, g2);
    }
    // the highlighted lead is drawn on top of the others
    const top = this.layer.querySelector('.lead.sel'); if (top) top.parentNode.appendChild(top);
    this.scope.setPlugged(this.sim.probes);
  }
}
