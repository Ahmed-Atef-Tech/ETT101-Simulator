// "What is on this socket?" — names the signal on a socket from the way the kit is wired, the way a lab sheet would:
// a message times a carrier is DSBSC, a message plus DC times a carrier is AM, and so on. It only names a signal when
// the wiring makes it clear; otherwise it says what the module does with its inputs, so it never guesses.
import { SOCKETS } from '../engine/modules.js';

// kinds: car (carrier), msg (message), dc, msgdc (message + DC), dig (digital), bip (bipolar data), am, dsb, ssb, fm,
// fsk, ask, bpsk, dsss, pd (product detector output), rect (rectified), rec (recovered message), noisy, samp, pcm, other
const NAME = {
  car: ['carrier', 'حامل (carrier)'], car200: ['twice the carrier (200 kHz) + DC', 'ضعف تردد الحامل (200kHz) + DC'],
  msg: ['message', 'رسالة (message)'], dc: ['DC voltage', 'جهد مستمر (DC)'], msgdc: ['message + DC', 'رسالة + DC'],
  dig: ['digital data', 'بيانات رقمية'], sq: ['squarewave (digital)', 'موجة مربعة (رقمية)'], bip: ['bipolar data (±2 V)', 'بيانات ثنائية القطبية (±2V)'],
  am: ['AM signal', 'إشارة AM'], dsb: ['DSBSC signal', 'إشارة DSBSC'], ssb: ['SSB signal', 'إشارة SSB'], fm: ['FM signal', 'إشارة FM'],
  fsk: ['FSK signal', 'إشارة FSK'], ask: ['ASK signal', 'إشارة ASK'], bpsk: ['BPSK signal', 'إشارة BPSK'], dsss: ['DSSS signal (spread)', 'إشارة DSSS (مُوسَّعة)'],
  pd: ['product detector output: message + 2fc terms', 'خرج كاشف الضرب: الرسالة + مركّبات عند 2fc'],
  rect: ['rectified signal', 'إشارة بعد التقويم'], rectd: ['rectified signal', 'إشارة بعد التقويم'], qpsk: ['QPSK signal', 'إشارة QPSK'],
  pdd: ['product detector output: data + 2fc terms', 'خرج كاشف الضرب: البيانات + مركّبات عند 2fc'], fskf: ['one FSK tone picked out (like ASK)', 'نغمة FSK واحدة بعد الترشيح (مثل ASK)'],
  saw: ['sawtooth', 'موجة سن المنشار'], fmsq: ['FM signal squared up (comparator)', 'إشارة FM بعد تربيعها (comparator)'], zcd: ['zero-crossing pulses (one per crossing)', 'نبضات عبور الصفر (نبضة عند كل عبور)'], pwm: ['PWM signal', 'إشارة PWM'], rec: ['recovered message', 'الرسالة المسترجعة'], recd: ['recovered data', 'البيانات المسترجعة'],
  noisy: ['signal + noise', 'إشارة + ضوضاء'], noise: ['noise', 'ضوضاء'], samp: ['sampled message', 'رسالة مأخوذ منها عينات'],
  pcm: ['PCM data', 'بيانات PCM'], tone: ['sinewave (VCO)', 'موجة جيبية (VCO)'], other: null,
};
// what each output does with its inputs (shown when the kit's wiring does not name the signal)
const RULE = {
  'adder.OUT': ['−(G·A + g·B)', '−(G·A + g·B)'], 'adder2.OUT': ['NOISE + SIGNAL', 'NOISE + SIGNAL'],
  'mult1.KXY': ['k·X·Y', 'k·X·Y'], 'mult2.KXY': ['k·X·Y', 'k·X·Y'], 'mult3.KXY': ['k·X·Y', 'k·X·Y'],
  'buffer.OUT': ['−GAIN × IN', '−GAIN × IN'], 'phase.OUT': ['IN shifted in phase', 'IN مع إزاحة في الطور'],
  'util.RECT': ['half-wave rectified IN', 'IN بعد تقويم نصف موجي'], 'util.RC': ['IN through a 2.6 kHz low-pass filter', 'IN بعد مرشِّح تمرير منخفض 2.6kHz'],
  'util.DIODE': ['peak (envelope) of IN', 'قمة (غلاف) IN'], 'util.COMP': ['5 V when IN > REF', '5V عندما IN > REF'],
  'tlpf.OUT': ['IN through the tuneable low-pass filter', 'IN بعد المرشِّح المنخفض القابل للضبط'],
  'channel.BPF': ['IN through the 100 kHz band-pass filter', 'IN بعد مرشِّح تمرير النطاق 100kHz'], 'channel.BB': ['IN through the 1.6 kHz low-pass filter', 'IN بعد مرشِّح تمرير منخفض 1.6kHz'],
};
const PLAIN = { 'master.SINE100': 'car', 'master.COS100': 'car', 'master.SINE2': 'msg', 'speech.OUT': 'msg', 'vdc.VDC': 'dc',
  'master.DIG100': 'sq', 'master.DIG8': 'sq', 'master.DIG2': 'sq', 'seq.X': 'dig', 'seq.Y': 'dig', 'seq.SYNC': 'dig', 'exor.OUT': 'dig', 'div.OUT': 'dig',
  'vdc.P5': 'dc', 'tlpf.FC100': 'sq', 'pcmenc.FS': 'dig',
  'seq.LINE': 'bip', 's2p.X1': 'bip', 's2p.X2': 'bip', 'noise.N0': 'noise', 'noise.N6': 'noise', 'noise.N20': 'noise', 'pcmenc.DATA': 'pcm', 'pcmdec.OUT1': 'rec', 'pcmdec.OUT2': 'rec' };

export function signalKind(sim, sock, depth = 0) {
  if (depth > 12) return 'other';
  const n = sim.netOf(sock); if (!n || n.gnd || n.drivers.length !== 1) return n && n.gnd ? 'dc' : 'other';
  const out = n.drivers[0], [mod] = SOCKETS[out];
  if (PLAIN[out]) return PLAIN[out];
  const k = s => { const m = sim.netOf(s); if (!(m && (m.drivers.length || m.gnd))) return null; const v = signalKind(sim, s, depth + 1); return v === 'tone' ? 'msg' : v; }; // a VCO sinewave used as a message is a message
  const pick = (...ss) => { for (const s of ss) { const v = k(s); if (v) return v; } return null; };
  const set = (a, b) => [a, b].filter(Boolean).sort().join('+');
  const ANALOG = { am: 1, dsb: 1, ssb: 1 }, DATA = { bpsk: 1, ask: 1, qpsk: 1, fskf: 1 }, DIG = { dig: 1, sq: 1 };
  const lpf = i => { // what a low-pass filter makes of its input
    if (i === 'pd' || i === 'rect') return 'rec'; if (i === 'pdd' || i === 'rectd') return 'recd'; if (i === 'fsk') return 'fskf';
    if (i === 'samp' || i === 'zcd') return 'rec'; if (['msg', 'msgdc', 'rec', 'recd', 'dc', 'noisy', 'noise'].includes(i)) return i; if (i === 'pwm') return 'rec'; return 'other'; };
  switch (out) {
    case 'vco.SINE': { // a squarewave message is FM in the book ("frequency modulating a squarewave"); data is FSK
      const i = k('vco.IN'); if (i === 'msg' || i === 'msgdc' || i === 'sq') return 'fm'; if (i === 'dig' || i === 'bip') return 'fsk'; return sim.mods.vco.p.HI ? 'car' : 'tone'; }
    case 'vco.DIG': return 'dig';
    case 'adder.OUT': case 'adder2.OUT': {
      const a = out === 'adder.OUT' ? k('adder.A') : k('adder2.SIGNAL'), b = out === 'adder.OUT' ? k('adder.B') : k('adder2.NOISE'), s = set(a, b);
      if (s === 'noise') return 'noise'; if ((a === 'noise') !== (b === 'noise') && (a || b)) return 'noisy';
      if (s === 'dc+msg') return 'msgdc'; if (s === 'msg' || s === 'msg+msg') return 'msg'; if (s === 'dc' || s === 'dc+dc') return 'dc';
      if (s === 'dsb+dsb') return 'ssb'; if (s === 'car+dsb') return 'am'; if (s === 'bpsk+bpsk') return 'qpsk';
      if (s === 'car+dsss' || s === 'dsss+fm') return 'noisy'; // DSSS plus a jamming sinewave
      if (!b && a) return a; if (!a && b) return b; return 'other'; }
    case 'mult1.KXY': case 'mult2.KXY': case 'mult3.KXY': {
      const x = pick(`${mod}.XDC`, `${mod}.XAC`), y = pick(`${mod}.YDC`, `${mod}.YAC`); if (!x || !y) return 'other';
      const s = set(x, y), other = x === 'car' ? y : y === 'car' ? x : null;
      if (s === 'car+msg') return 'dsb'; if (s === 'car+msgdc') return 'am'; if (s === 'car+dig' || s === 'car+sq') return 'ask'; if (s === 'bip+car') return 'bpsk';
      if (s === 'car+car') return 'car200'; if (other && ANALOG[other]) return 'pd'; if (other && DATA[other]) return 'pdd';
      if (s === 'bip+msg' || s === 'dig+msg') return 'dsss'; // message times a pseudo-random sequence: spread
      if (s === 'bip+dsss' || s === 'dig+dsss') { // times the same sequence again: back to the message (another sequence leaves noise)
        const drv = q => { const m = sim.netOf(q); return m && m.drivers[0]; }, fam = d => (d === 'seq.LINE' ? 'seq.X' : d);
        const ins = [`${mod}.XDC`, `${mod}.XAC`, `${mod}.YDC`, `${mod}.YAC`].filter(q => SOCKETS[q] && drv(q));
        const spread = ins.map(drv).find(d => signalKind(sim, d, depth + 1) === 'dsss'), pn = ins.map(drv).find(d => d !== spread);
        const [sm] = SOCKETS[spread]; const pn0 = [`${sm}.XDC`, `${sm}.XAC`, `${sm}.YDC`, `${sm}.YAC`].filter(q => SOCKETS[q] && drv(q)).map(drv).find(d => ['dig', 'bip'].includes(signalKind(sim, d, depth + 1)));
        return fam(pn) === fam(pn0) ? 'msg' : 'other'; }
      return 'other'; }
    case 'buffer.OUT': return k('buffer.IN') || 'other';
    case 'phase.OUT': return k('phase.IN') || 'other';
    case 'channel.BPF': return k('channel.BPF_IN') || 'other';
    case 'util.RECT': { const i = k('util.RECT_IN'); return i === 'am' || i === 'msg' ? 'rect' : DATA[i] ? 'rectd' : 'other'; }
    case 'util.DIODE': { const i = k('util.DIODE_IN'); if (i === 'am' || i === 'rect') return 'rec'; if (DATA[i] || i === 'rectd') return 'recd'; if (DIG[i]) return 'saw'; return 'other'; }
    case 'util.RC': return lpf(k('util.RC_IN'));
    case 'tlpf.OUT': return lpf(k('tlpf.IN'));
    case 'channel.BB': return lpf(k('channel.BB_IN'));
    case 'tpg.Q1': case 'tpg.Q2': return k('tpg.CLK') === 'fmsq' ? 'zcd' : 'dig';
    case 'util.COMP': { const i = k('util.CIN'), r = k('util.REF'), s = set(i, r);
      if (i === 'fm') return 'fmsq';
      if (i === 'saw' || r === 'saw') return 'pwm'; // a sawtooth against the message: pulse width modulation
      return i === 'rec' || i === 'recd' || i === 'pd' || i === 'pdd' ? 'recd' : s === 'msg' ? 'sq' : 'dig'; }
    case 'das.SH': return 'samp';
    case 'das.OUT': { const c = pick('das.C1', 'das.C2'); return c === 'dig' ? 'ask' : 'samp'; } // switched by data: ASK; by a squarewave clock: sampling
  }
  return 'other';
}

// one or two lines for the socket tip: the signal's name (when the wiring makes it clear) and what the module does
export function describeSignal(sim, sock, lang) {
  const n = sim.netOf(sock); if (!n || n.gnd || n.drivers.length !== 1) return null;
  const out = n.drivers[0], kind = signalKind(sim, sock), name = NAME[kind], rule = RULE[out], L = lang === 'ar' ? 1 : 0;
  const lines = [];
  if (name) lines.push(name[L]);
  if (rule && out !== sock) lines.push((L ? 'من ' : 'from ') + rule[L]);
  else if (rule) lines.push('= ' + rule[L]);
  return lines.length ? { kind, lines } : null;
}
