// Simulation graph: patch leads -> nets -> evaluation order; runs blocks of samples, feeds scope rings and audio.
import { FS } from './dsp.js';
import { BLK, SOCKETS, createModules } from './modules.js';

const HUM = new Float32Array(96000); for (let i = 0; i < 96000; i++) HUM[i] = 0.03 * Math.sin(2 * Math.PI * i / 96000) + 0.006 * Math.sin(6 * Math.PI * i / 96000);
export const RING_BITS = 22, RING = 1 << RING_BITS, RMASK = RING - 1; // 0.87 s of history per scope channel

const LOOP_BLK = 8;
class MicSource {
  // receives 48 kHz microphone samples, hands out FS-rate samples (linear interpolation)
  constructor() { this.q = new Float32Array(1 << 16); this.w = 0; this.r = 0; this.frac = 0; this.gain = 6; this.prev = 0; }
  push(arr) { for (let i = 0; i < arr.length; i++) { this.q[this.w & 0xffff] = arr[i]; this.w++; } if (this.w - this.r > 24000) this.r = this.w - 4800; }
  pull(dst, n) {
    const step = 48000 / FS;
    for (let i = 0; i < n; i++) {
      if (this.w - this.r < 2) { dst[i] = 0; continue; }
      const a = this.q[this.r & 0xffff], b = this.q[(this.r + 1) & 0xffff];
      dst[i] = this.gain * (a + (b - a) * this.frac);
      this.frac += step; if (this.frac >= 1) { this.frac -= 1; this.r++; }
    }
  }
}

export class Sim {
  constructor() {
    this.t = 0;
    this.mods = createModules(this);
    this.leads = [];                       // {id, a, b, color}
    this.probes = { CH1: null, CH2: null, EXT: null, HOV: null }; // socket ids (HOV = training-mode hover meter)
    this.headphones = false;
    this.zero = new Float64Array(BLK);
    this.rings = { CH1: new Float32Array(RING), CH2: new Float32Array(RING), EXT: new Float32Array(RING), HOV: new Float32Array(1 << 18) };
    this.mic = new MicSource();
    this.aRing = new Float32Array(1 << 16); this.aw = 0; this.ar = 0; this.hpAcc = 0; this.hpN = 0; this.hpDec = FS / 48000;
    this.blank = { CH1: false, CH2: false, EXT: false, HOV: false };
    this.rebuild();
  }

  // a fresh set of modules: knobs at their defaults and every hidden state (filters, latches, loop and bit-pair phases)
  // as at power-on, so a loaded setup never depends on what was on the kit before it
  resetState() { this.mods = createModules(this); this.rebuild(); }

  // ---------------- topology ----------------
  netOf(socket) { return this._net.get(socket); }
  rebuild() {
    const parent = {};
    const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    for (const s in SOCKETS) parent[s] = s;
    for (const l of this.leads) { const ra = find(l.a), rb = find(l.b); if (ra !== rb) parent[ra] = rb; }
    const nets = new Map();
    for (const s in SOCKETS) { const r = find(s); if (!nets.has(r)) nets.set(r, []); nets.get(r).push(s); }
    this._net = new Map();
    const netInfo = [];
    for (const [, members] of nets) {
      const info = { members, drivers: members.filter(s => SOCKETS[s][2] === 'out'), gnd: members.some(s => SOCKETS[s][2] === 'gnd'), buf: null, mixer: null };
      for (const s of members) this._net.set(s, info);
      netInfo.push(info);
    }
    this.nets = netInfo;
    // resolve buffers
    const deps = new Map(); // node -> Set(node)
    const mixers = [];
    for (const n of netInfo) {
      if (n.gnd) { n.buf = this.zero; n.state = n.drivers.length ? 'short' : 'gnd'; }
      else if (n.drivers.length === 1) { const [m, p] = SOCKETS[n.drivers[0]]; n.buf = this.mods[m].out[p]; n.src = m; n.state = 'ok'; }
      else if (n.drivers.length > 1) {
        // two outputs fighting through their 330 ohm output resistors -> average voltage
        const srcs = n.drivers.map(s => this.mods[SOCKETS[s][0]].out[SOCKETS[s][1]]);
        const mix = { id: 'mix' + mixers.length, out: new Float64Array(BLK), srcs, mods: n.drivers.map(s => SOCKETS[s][0]),
          process(len) { const k = 1 / srcs.length; for (let i = 0; i < len; i++) { let v = 0; for (const s of srcs) v += s[i]; this.out[i] = v * k; } } };
        mixers.push(mix); n.buf = mix.out; n.mixer = mix; n.state = 'short';
      } else { n.buf = null; n.state = 'float'; }
    }
    // wire module inputs
    for (const s in SOCKETS) {
      const [m, p, dir] = SOCKETS[s]; if (dir !== 'in') continue;
      const mod = this.mods[m], n = this._net.get(s);
      mod.in[p] = n.buf || this.zero; mod.conn[p] = n.members.length > 1;
    }
    // dependency graph
    const nodeDeps = node => {
      if (node.srcs) return node.mods.map(m => this.mods[m]);
      const out = [];
      for (const s in SOCKETS) { const [m, , dir] = SOCKETS[s]; if (m !== node.id || dir !== 'in') continue; const n = this._net.get(s);
        if (n.mixer) out.push(n.mixer); else if (n.src) out.push(this.mods[n.src]); }
      return out;
    };
    // sinks: scope probes, headphones, LEDs
    const roots = [];
    const addNet = sock => { if (!sock) return; const n = this._net.get(sock); if (n.mixer) roots.push(n.mixer); else if (n.src) roots.push(this.mods[n.src]); };
    for (const k in this.probes) addNet(this.probes[k]);
    if (this.headphones) roots.push(this.mods.buffer);
    if (this.mods.phase.conn.IN) roots.push(this.mods.phase);
    if (this.mods.pcmdec.conn.CLK) roots.push(this.mods.pcmdec);
    // DFS post-order -> evaluation order (cycles are broken: a back edge reads the previous block)
    // A feedback loop (delta modulator, PLL, ...) is broken at one point; that point reads the value computed one
    // sub-block earlier, so loops are run in sub-blocks of LOOP_BLK samples (1.7 us of loop delay instead of 53 us).
    const order = [], state = new Map(); let cyclic = false;
    const visit = node => {
      const st = state.get(node); if (st === 1) { cyclic = true; return; } if (st === 2) return; state.set(node, 1);
      for (const d of nodeDeps(node)) visit(d);
      state.set(node, 2); order.push(node);
    };
    roots.forEach(visit);
    this.order = order; this.cyclic = cyclic;
    this.version = (this.version || 0) + 1;
  }

  // ---------------- leads ----------------
  addLead(a, b, color) { const id = 'L' + Math.random().toString(36).slice(2, 9); this.leads.push({ id, a, b, color }); this.rebuild(); return id; }
  removeLead(id) { this.leads = this.leads.filter(l => l.id !== id); this.rebuild(); }
  setProbe(ch, sock) { this.probes[ch] = sock; this.rebuild(); }
  setHeadphones(on) { this.headphones = on; this.rebuild(); }
  netState(sock) { return this._net.get(sock).state; }

  // ---------------- run ----------------
  run(nSamples) {
    const ord = this.order;
    const pr = {}; for (const k in this.probes) { const s = this.probes[k]; pr[k] = s ? this._net.get(s) : null; }
    const hpBuf = this.headphones ? this.mods.buffer.out.OUT : null;
    let done = 0;
    while (done < nSamples) {
      const n = Math.min(this.cyclic ? LOOP_BLK : BLK, nSamples - done);
      for (let k = 0; k < ord.length; k++) ord[k].process(n);
      // scope channels
      for (const ch in this.rings) {
        const ring = this.rings[ch], net = pr[ch], M = ring.length - 1; let w = this.t;
        if (!net) { if (!this.blank[ch]) { ring.fill(0); this.blank[ch] = true; } continue; }
        this.blank[ch] = false;
        if (net.buf) { const b = net.buf; for (let i = 0; i < n; i++, w++) ring[w & M] = b[i]; }
        else { // floating input: 50 Hz mains hum pick-up, as a real probe on an open socket shows
          let k = (this.t % 96000); for (let i = 0; i < n; i++, w++, k = k === 95999 ? 0 : k + 1) ring[w & M] = HUM[k]; }
      }
      // headphones: 48 kHz decimation (box average = anti-alias)
      if (hpBuf) {
        let acc = this.hpAcc, cnt = this.hpN;
        const R = this.aRing, M = R.length - 1;
        for (let i = 0; i < n; i++) { acc += hpBuf[i]; if (++cnt >= this.hpDec) { R[this.aw & M] = acc / cnt / 4; this.aw++; acc = 0; cnt = 0; } }
        this.hpAcc = acc; this.hpN = cnt;
      }
      this.t += n; done += n;
    }
    if (this.aw - this.ar > 40000) this.ar = this.aw - 9600;
  }

  // read last `len` samples ending at absolute time `end` (exclusive) from a ring into dst
  read(ch, end, len, dst) { const r = this.rings[ch], M = r.length - 1; for (let i = 0; i < len; i++) dst[i] = r[(end - len + i) & M]; return dst; }
  audioQueued() { return this.aw - this.ar; }
  audioPull() { if (this.ar >= this.aw) return 0; const v = this.aRing[this.ar & (this.aRing.length - 1)]; this.ar++; return v; }
}
