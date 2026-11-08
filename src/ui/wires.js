// Patch leads (2 mm stackable) and oscilloscope leads (BNC -> 2 mm).
import { el } from './svg.js';
import { SOCKET_POS } from './layout.js';

export const LEAD_COLORS = { red: '#d3261f', black: '#1a1a1a', yellow: '#f2c21b', blue: '#1f5fd1', green: '#1f9a45' };
const DARK = { red: '#7c120e', black: '#000', yellow: '#94720a', blue: '#0e3274', green: '#0d5023' };
const PROBE_TAG = { CH1: '#f2d21b', CH2: '#35d0f0', EXT: '#c8c8c8' };

export class Wires {
  constructor(svg, layer, sim, scope, hooks) {
    this.svg = svg; this.layer = layer; this.sim = sim; this.scope = scope; this.hooks = hooks;
    this.color = 'red'; this.paths = new Map(); this.probeEls = {};
    this.tmp = null; this.sel = null; // sel: the highlighted lead id, or 'probe:CH1'
    this.wireG = el('g', {}, layer); this.probeG = el('g', {}, layer); this.plugG = el('g', {}, layer); this.dragG = el('g', {}, layer);
    svg.addEventListener('pointerdown', e => this.down(e));
    window.addEventListener('pointermove', e => this.move(e));
    window.addEventListener('pointerup', e => this.up(e));
  }
  toSvg(e) { const p = this.svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(this.svg.getScreenCTM().inverse()); }
  sockAt(e) {
    const t = document.elementFromPoint(e.clientX, e.clientY); if (!t) return null;
    const s = t.closest('[data-socket]'); if (s) return { sock: s.getAttribute('data-socket') };
    const b = t.closest('[data-bnc]'); if (b) return { bnc: b.getAttribute('data-bnc') };
    return null;
  }
  pos(sock) { return SOCKET_POS[sock]; }

  // ---------- creating leads by dragging ----------
  down(e) {
    if (e.button !== 0) return;
    const hit = this.sockAt(e); if (!hit) return;
    e.preventDefault();
    const pl = e.target.closest && e.target.closest('[data-lead-of]');
    this.downAt = { x: e.clientX, y: e.clientY, lead: pl ? pl.getAttribute('data-lead-of') : null };
    const p0 = hit.sock ? this.pos(hit.sock) : this.scope.bncPos(hit.bnc);
    this.tmp = { from: hit, p0, path: el('path', { class: 'leadTmp', 'pointer-events': 'none', fill: 'none', stroke: hit.bnc ? '#222' : LEAD_COLORS[this.color], 'stroke-width': hit.bnc ? 8 : 6.5, 'stroke-linecap': 'round', opacity: .85 }, this.dragG) };
    this.svg.classList.add('dragging');
  }
  move(e) {
    if (!this.tmp) return; const p = this.toSvg(e); this.tmp.path.setAttribute('d', this.curve(this.tmp.p0, [p.x, p.y], !!this.tmp.from.bnc));
    const hit = this.sockAt(e); this.hooks.hoverTarget(hit && hit.sock);
  }
  up(e) {
    if (!this.tmp) return;
    const from = this.tmp.from, hit = this.sockAt(e);
    this.tmp.path.remove(); this.tmp = null; this.svg.classList.remove('dragging'); this.hooks.hoverTarget(null);
    if (!hit) return;
    const d = this.downAt; if (d && d.lead && from.sock && hit.sock === from.sock && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 4) { this.select(this.sel === d.lead ? null : d.lead); return; }
    if (from.sock && hit.sock && from.sock !== hit.sock) { this.addLead(from.sock, hit.sock, this.color); this.hooks.plugged(); }
    else if (from.bnc && hit.sock) { this.setProbe(from.bnc, hit.sock); this.hooks.plugged(); }
    else if (from.sock && hit.bnc) { this.setProbe(hit.bnc, from.sock); this.hooks.plugged(); }
  }

  select(id) { this.sel = id; this.render(); }
  addLead(a, b, color) { const id = this.sim.addLead(a, b, color); this.render(); this.hooks.changed(); return id; }
  removeLead(id) { this.sim.removeLead(id); this.render(); this.hooks.changed(); }
  setProbe(ch, sock) { this.sim.setProbe(ch, sock); this.render(); this.hooks.changed(); }
  clearAll() { this.sim.leads = []; for (const k in this.sim.probes) this.sim.probes[k] = null; this.sim.rebuild(); this.render(); this.hooks.changed(); }

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
      const d = this.curve(a, b);
      el('path', { d, fill: 'none', 'stroke-width': 18, 'stroke-linecap': 'round', class: 'leadGlow' }, g);
      el('path', { d, fill: 'none', stroke: dk, 'stroke-width': 8, 'stroke-linecap': 'round', class: 'leadOut' }, g);
      el('path', { d, fill: 'none', stroke: c, 'stroke-width': 5.6, 'stroke-linecap': 'round' }, g);
      el('path', { d, fill: 'none', stroke: 'rgba(255,255,255,.28)', 'stroke-width': 1.6, transform: 'translate(-1,-1.5)' }, g);
      el('path', { d, fill: 'none', stroke: 'transparent', 'stroke-width': 16, class: 'leadHit' }, g);
      g.addEventListener('click', e => { if (e.detail > 1) return; e.stopPropagation(); this.select(this.sel === l.id ? null : l.id); });
      g.addEventListener('dblclick', e => { e.stopPropagation(); this.removeLead(l.id); });
      g.addEventListener('contextmenu', e => { e.preventDefault(); this.hooks.leadMenu(l, e); });
      g.addEventListener('pointerenter', e => this.hooks.hoverLead(l, e)); g.addEventListener('pointerleave', () => this.hooks.hoverLead(null));
      for (const s of [l.a, l.b]) { const p = plug(s, c, dk, null, l.id); p.addEventListener('dblclick', e => { e.stopPropagation(); this.removeLead(l.id); }); }
    }
    for (const ch in this.sim.probes) {
      const s = this.sim.probes[ch]; if (!s || !PROBE_TAG[ch]) continue; // HOV is the socket tooltip's hidden probe, not a lead
      const a = this.scope.bncPos(ch), b = this.pos(s);
      const pid = 'probe:' + ch;
      const g = el('g', { class: 'lead probe' + (pid === this.sel ? ' sel' : ''), 'data-probe': ch }, this.probeG);
      const d = this.curve(a, b, true);
      el('path', { d, fill: 'none', 'stroke-width': 22, 'stroke-linecap': 'round', class: 'leadGlow' }, g);
      el('path', { d, fill: 'none', stroke: '#050505', 'stroke-width': 10, 'stroke-linecap': 'round' }, g);
      el('path', { d, fill: 'none', stroke: '#2a2a2a', 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
      el('path', { d, fill: 'none', stroke: 'rgba(255,255,255,.18)', 'stroke-width': 2, transform: 'translate(-1,-2)' }, g);
      el('path', { d, fill: 'none', stroke: 'transparent', 'stroke-width': 16, class: 'leadHit' }, g);
      g.addEventListener('click', e => { if (e.detail > 1) return; e.stopPropagation(); this.select(this.sel === pid ? null : pid); });
      g.addEventListener('dblclick', e => { e.stopPropagation(); this.setProbe(ch, null); });
      const p = plug(s, '#2b2b2b', '#000', PROBE_TAG[ch], pid); p.addEventListener('dblclick', e => { e.stopPropagation(); this.setProbe(ch, null); });
      // BNC plug at scope
      const g2 = el('g', { transform: `translate(${a[0]},${a[1]})` }, this.probeG);
      el('circle', { r: 17, fill: 'url(#bncGrad)', stroke: '#555', 'stroke-width': 1.5 }, g2);
      el('circle', { r: 9, fill: '#1c1c1c' }, g2);
      el('circle', { r: 19, fill: 'none', stroke: PROBE_TAG[ch], 'stroke-width': 2 }, g2);
    }
    // the highlighted lead is drawn on top of the others
    const top = this.layer.querySelector('.lead.sel'); if (top) top.parentNode.appendChild(top);
    this.scope.setPlugged(this.sim.probes);
  }
}
