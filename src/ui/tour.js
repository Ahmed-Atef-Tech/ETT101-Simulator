// First-run welcome guide: a spotlight on each part of the screen, a drawn arrow from the card to it, and small cartoon
// drawings (wiring a lead, probing, Ctrl + mouse wheel). Skip closes it; Settings can show it again.
import { t, getLang, trb } from './i18n.js';

const A = (en, ar) => ({ en, ar });
// a lead being pulled from one socket to another by the mouse pointer: the lead draws in behind the plug, then a click
const LOOP = '3.2s', KT = '0;0.62;1';
function dragArt({ bg, from, to, path, end, color, dark, width }) {
  const motion = `<animateMotion dur="${LOOP}" repeatCount="indefinite" path="${path}" keyPoints="0;1;1" keyTimes="${KT}" calcMode="linear"/>`;
  return `<svg viewBox="0 0 320 120" class="tArt" aria-hidden="true">${bg}${from}${to}
    <path d="${path}" fill="none" stroke="${dark}" stroke-width="${width + 2.5}" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100" data-final="0"><animate attributeName="stroke-dashoffset" values="100;0;0" keyTimes="${KT}" dur="${LOOP}" repeatCount="indefinite"/></path>
    <path d="${path}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100" data-final="0"><animate attributeName="stroke-dashoffset" values="100;0;0" keyTimes="${KT}" dur="${LOOP}" repeatCount="indefinite"/></path>
    <circle cx="${end[0]}" cy="${end[1]}" r="10" fill="none" stroke="#f2c21b" stroke-width="3" opacity="0"><animate attributeName="r" values="10;10;22" keyTimes="0;0.64;0.9" dur="${LOOP}" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;1;0" keyTimes="0;0.63;0.66;0.9" dur="${LOOP}" repeatCount="indefinite"/></circle>
    <g data-end="${end[0]} ${end[1]}"><circle r="9" fill="${color}" stroke="${dark}" stroke-width="3"/>${motion}</g>
    <g data-end="${end[0]} ${end[1]}"><g transform="translate(3 3)"><path d="M0 0 l0 24 l6.5 -5.5 l4.5 10 l4.5 -2 l-4.5 -10 l8.5 -0.5 z" fill="#fff" stroke="#111" stroke-width="2" stroke-linejoin="round"/></g>${motion}</g>
  </svg>`;
}

// ---------------------------------------------------------------- drawings (inline SVG, theme colours of the app)
const ART = {
  welcome: `<svg viewBox="0 0 320 120" class="tArt" aria-hidden="true">
    <rect x="14" y="18" width="150" height="92" rx="8" fill="#16191c"/><rect x="22" y="26" width="134" height="76" rx="3" fill="none" stroke="#3a4046"/>
    ${[0, 1, 2, 3].map(i => `<circle cx="${42 + i * 32}" cy="48" r="6" fill="#f2c21b" stroke="#7a5d00" stroke-width="2"/><circle cx="${42 + i * 32}" cy="80" r="6" fill="#d9d9d9" stroke="#666" stroke-width="2"/>`).join('')}
    <path d="M42 48 C 60 100, 90 100, 106 80" fill="none" stroke="#d3261f" stroke-width="4" stroke-linecap="round"/>
    <rect x="178" y="22" width="130" height="84" rx="10" fill="#e9e5dc" stroke="#9c978d" stroke-width="2"/><rect x="188" y="32" width="78" height="52" rx="3" fill="#1d5fc9"/><rect x="192" y="36" width="70" height="44" fill="#000"/>
    <path class="tWave" d="M192 58 q 9 -18 17.5 0 t 17.5 0 t 17.5 0 t 17.5 0" fill="none" stroke="#f6e51d" stroke-width="2.5"/>
    <circle cx="284" cy="44" r="8" fill="#cfcac1" stroke="#8c877f"/><circle cx="284" cy="72" r="8" fill="#cfcac1" stroke="#8c877f"/><rect x="272" y="90" width="24" height="8" rx="2" fill="#58e070"/>
  </svg>`,
  drag: dragArt({ bg: '<rect x="10" y="10" width="300" height="100" rx="10" fill="#16191c"/>',
    from: '<circle cx="70" cy="52" r="13" fill="#f2c21b" stroke="#7a5d00" stroke-width="3"/><circle cx="70" cy="52" r="5" fill="#2b2b2b"/><text x="70" y="28" fill="#cfd5d8" font-size="13" text-anchor="middle" font-family="sans-serif">1</text>',
    to: '<circle cx="240" cy="70" r="13" fill="#d9d9d9" stroke="#666" stroke-width="3"/><circle cx="240" cy="70" r="5" fill="#2b2b2b"/><text x="240" y="46" fill="#cfd5d8" font-size="13" text-anchor="middle" font-family="sans-serif">2</text>',
    path: 'M70 52 C 110 120, 190 120, 240 70', end: [240, 70], color: '#d3261f', dark: '#7c120e', width: 6 }),
  probe: dragArt({ bg: '<rect x="10" y="12" width="130" height="96" rx="10" fill="#e9e5dc" stroke="#9c978d" stroke-width="2"/><rect x="180" y="24" width="128" height="80" rx="8" fill="#16191c"/>',
    from: '<circle cx="75" cy="64" r="22" fill="#cfcac1" stroke="#6b6b6b" stroke-width="3"/><circle cx="75" cy="64" r="13" fill="#3a3a3a" stroke="#f6e51d" stroke-width="3"/><circle cx="75" cy="64" r="3.5" fill="#d4b45a"/><text x="75" y="32" font-size="13" font-weight="700" text-anchor="middle" fill="#2a2a2a" font-family="sans-serif">CH1</text>',
    to: '<circle cx="250" cy="64" r="12" fill="#f2c21b" stroke="#7a5d00" stroke-width="3"/><circle cx="250" cy="64" r="4.5" fill="#2b2b2b"/>',
    path: 'M75 64 C 120 130, 200 130, 250 64', end: [250, 64], color: '#3d4248', dark: '#101214', width: 7 }),
  zoom: `<svg viewBox="0 0 320 130" class="tArt" aria-hidden="true">
    <g class="tKey"><rect x="18" y="44" width="92" height="60" rx="12" fill="#bfc4c7"/><rect x="18" y="38" width="92" height="58" rx="12" fill="#f4f4f1" stroke="#9aa3a7" stroke-width="2"/>
      <text x="64" y="75" font-size="22" font-weight="800" text-anchor="middle" fill="#1e2427" font-family="sans-serif">Ctrl</text></g>
    <text x="134" y="80" font-size="34" font-weight="800" text-anchor="middle" fill="#5b6266" font-family="sans-serif">+</text>
    <g transform="translate(172 10)">
      <path d="M45 6 C 15 6, 4 30, 4 58 L4 82 C4 104, 20 116, 45 116 C 70 116, 86 104, 86 82 L86 58 C 86 30, 75 6, 45 6 Z" fill="#fff" stroke="#1e2427" stroke-width="3"/>
      <path d="M4 52 L86 52 M45 6 L45 52" stroke="#1e2427" stroke-width="2.5"/>
      <rect x="38" y="20" width="14" height="24" rx="7" fill="#f2c21b" stroke="#1e2427" stroke-width="2.5" class="tWheel"/>
      <path class="tUp" d="M45 -2 l-7 8 h14 z" fill="#1f9a45"/><path class="tDown" d="M45 66 l-7 -8 h14 z" fill="#d3261f"/>
      <circle cx="30" cy="80" r="2.5" fill="#1e2427"/><circle cx="60" cy="80" r="2.5" fill="#1e2427"/><path d="M33 92 q 12 9 24 0" fill="none" stroke="#1e2427" stroke-width="2.5" stroke-linecap="round"/>
    </g>
    <g transform="translate(276 20)" font-family="sans-serif" font-weight="800" text-anchor="middle"><circle cx="16" cy="16" r="13" fill="none" stroke="#1f9a45" stroke-width="3"/><text x="16" y="22" font-size="18" fill="#1f9a45">+</text>
      <circle cx="16" cy="74" r="13" fill="none" stroke="#d3261f" stroke-width="3"/><text x="16" y="80" font-size="18" fill="#d3261f">−</text></g>
  </svg>`,
};

// ---------------------------------------------------------------- steps
const STEPS = [
  { art: 'welcome', title: A('Welcome to the Telecoms-Trainer 101 simulator', 'مرحباً بك في محاكي Telecoms-Trainer 101'),
    text: A('On the left is the Emona ETT-101 kit, on the right a UTD2102CEL-style oscilloscope. Wire the kit, turn the knobs and watch the signals, as in the lab. This short guide shows you around.',
      'على اليسار جهاز Emona ETT-101، وعلى اليمين راسم إشارة على نمط UTD2102CEL. صِل الأسلاك وأدِر المقابض وشاهد الإشارات كما في المعمل. هذا الدليل القصير يعرّفك بالبرنامج.') },
  { target: '#board', view: 'kit', art: 'drag', title: A('Wire the kit', 'توصيل الأسلاك'),
    text: A('Drag from one socket to another to plug in a lead. Double-click a lead to remove it, right-click it to change its colour. Turn a knob by dragging around it or with the mouse wheel.',
      'اسحب من مقبس إلى مقبس آخر لتوصيل سلك. انقر على السلك مرتين لإزالته، وانقر بالزر الأيمن لتغيير لونه. أدِر المقبض بالسحب حوله أو بعجلة الفأرة.') },
  { target: '#scope', view: 'scope', art: 'probe', title: A('The oscilloscope', 'راسم الإشارة'),
    text: A('Drag from the CH1 or CH2 socket to any socket on the kit to see that signal. The keys and knobs work like the real scope; AUTO sets everything up for you.',
      'اسحب من مقبس CH1 أو CH2 إلى أي مقبس على الجهاز لترى إشارته. الأزرار والمقابض تعمل مثل الجهاز الحقيقي، والزر AUTO يضبط كل شيء تلقائياً.') },
  { art: 'zoom', title: A('Zoom in and out', 'التكبير والتصغير'),
    text: A('Hold Ctrl and turn the mouse wheel: up zooms in, down zooms out, right where the pointer is. Drag an empty part of the bench to move around.',
      'اضغط Ctrl مع تدوير عجلة الفأرة: للأعلى للتكبير، وللأسفل للتصغير، عند مكان المؤشر تماماً. واسحب في مكان فارغ لتتحرك في المساحة.') },
  { target: '#btnFull', title: A('Back to the middle', 'العودة إلى المنتصف'),
    text: A('Lost after zooming? This button brings the kit and the scope back to the middle of the screen.', 'هل ابتعدت بعد التكبير؟ هذا الزر يعيد الجهاز وراسم الإشارة إلى منتصف الشاشة.') },
  { target: '.tray', title: A('Kit, Both or Scope', 'الجهاز أو كلاهما أو راسم الإشارة'),
    text: A('Show the kit, both, or only the scope. The keys 1, 2 and 3 do the same.', 'اعرض الجهاز أو كليهما أو راسم الإشارة فقط. والمفاتيح 1 و 2 و 3 تفعل الشيء نفسه.') },
  { target: '#btnLib', title: A('Ready-made experiments', 'تجارب جاهزة'),
    text: A('Every experiment of the lab books, with its page number. One click wires the kit and sets the scope.', 'كل تجارب كتب المعمل مع رقم الصفحة. بنقرة واحدة تُوصَّل الأسلاك ويُضبط راسم الإشارة.') },
  { target: '#btnGuide', title: A('Lab sheets', 'أوراق التجارب'),
    text: A('Step-by-step sheets that follow the book. Each step ticks off the connections as you make them.', 'أوراق خطوة بخطوة تتبع الكتاب. وتُعلَّم التوصيلات في كل خطوة عندما تنفّذها.') },
  { target: '#tGuide', title: A('Guidance', 'الإرشادات'),
    text: A('Shows the i buttons, socket names with live readings and knob values. Turn it off to practise like the lab exam.', 'تُظهر أزرار المعلومات وأسماء المقابس مع قراءاتها وقيم المقابض. أوقفها لتتدرّب كما في امتحان المعمل.') },
  { target: '#btnBug', title: A('Problems and suggestions', 'المشكلات والاقتراحات'),
    text: A('Found something wrong, or have an idea for a new feature? Send it to the developer on WhatsApp from here.', 'هل وجدت خطأً أو لديك فكرة لميزة جديدة؟ أرسلها إلى المطوّر عبر واتساب من هنا.') },
  { target: '#btnSettings', title: A('Settings', 'الإعدادات'),
    text: A('Language, sound, saving and opening your wiring, help, and this guide if you want to see it again.', 'اللغة والصوت وحفظ التوصيلات وفتحها والمساعدة، وهذا الدليل إذا أردت أن تراه مرة أخرى.') },
];

let root = null, i = 0, onEnd = null, setView = null;
const $ = s => document.querySelector(s);
const reduce = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const tourOpen = () => !!root;
export function tourReframe() { if (!root) return; if (setView) setView(STEPS[i].view || 'both'); place(); } // after a window resize or the start-up fit
export function startTour(done, opts = {}) {
  endTour(false); onEnd = done; i = 0; setView = opts.view || null;
  root = document.createElement('div'); root.id = 'tour'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'tourTitle');
  root.innerHTML = `<svg class="tourDim" aria-hidden="true"><path class="tourHole" fill-rule="evenodd"/></svg><div class="tourRing"></div><svg class="tourArrow" aria-hidden="true"><defs><marker id="tourHead" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#f2c21b"/></marker></defs><path class="tourLine" fill="none" stroke="#f2c21b" stroke-width="3.5" stroke-linecap="round" marker-end="url(#tourHead)"/></svg><div class="tourCard sheet"></div>`;
  document.body.appendChild(root);
  window.addEventListener('keydown', onKey, true); window.addEventListener('resize', place);
  show();
}
export function endTour(finished = true) {
  if (!root) return;
  root.remove(); root = null; window.removeEventListener('keydown', onKey, true); window.removeEventListener('resize', place);
  if (finished && onEnd) onEnd();
}
function onKey(e) {
  if (!root) return;
  const rtl = getLang() === 'ar', fwd = rtl ? 'ArrowLeft' : 'ArrowRight', back = rtl ? 'ArrowRight' : 'ArrowLeft';
  if (e.key === 'Escape') endTour(true);
  else if (e.key === fwd) go(1); else if (e.key === back) go(-1);
  else if (e.key === 'Tab') { const f = [...root.querySelectorAll('button')]; const k = f.indexOf(document.activeElement); e.preventDefault(); f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
  else if (e.key !== 'Enter' && e.key !== ' ') { e.preventDefault(); }
  e.stopPropagation();
}
function go(d) { const n = i + d; if (n < 0) return; if (n >= STEPS.length) { endTour(true); return; } i = n; show(); }
function show() {
  const st = STEPS[i], last = i === STEPS.length - 1, card = root.querySelector('.tourCard');
  card.innerHTML = `${st.art ? ART[st.art] : ''}
    <h2 id="tourTitle">${trb(st.title)}</h2><p>${trb(st.text)}</p>
    <div class="tourFoot"><button type="button" class="tourSkip">${t('tourSkip')}</button><span class="tourDots" aria-label="${i + 1} / ${STEPS.length}">${STEPS.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</span>
      <span class="tourNav">${i ? `<button type="button" class="tourBack">${t('tourBack')}</button>` : ''}<button type="button" class="tourNext primary">${t(last ? 'tourDone' : 'tourNext')}</button></span></div>`;
  card.querySelector('.tourSkip').onclick = () => endTour(true);
  card.querySelector('.tourNext').onclick = () => go(1);
  const b = card.querySelector('.tourBack'); if (b) b.onclick = () => go(-1);
  root.classList.toggle('still', reduce());
  if (reduce()) { // no motion: show the finished drawing
    card.querySelectorAll('animate, animateMotion').forEach(x => x.remove());
    card.querySelectorAll('[data-final]').forEach(x => x.setAttribute('stroke-dashoffset', x.dataset.final));
    card.querySelectorAll('[data-end]').forEach(x => x.setAttribute('transform', `translate(${x.dataset.end.replace(' ', ',')})`));
  }
  if (setView) setView(st.view || 'both'); // each step frames its part of the bench, whatever the zoom was
  place(); requestAnimationFrame(place); card.querySelector('.tourNext').focus({ preventScroll: true });
}
function place() {
  if (!root) return;
  const st = STEPS[i], card = root.querySelector('.tourCard'), hole = root.querySelector('.tourHole'), ring = root.querySelector('.tourRing'), arrow = root.querySelector('.tourLine');
  const W = innerWidth, H = innerHeight, el = st.target && $(st.target), pad = 8;
  const r = el ? el.getBoundingClientRect() : null, vis = r && r.width > 0 && r.height > 0;
  const tr = vis ? { x: Math.max(4, r.left - pad), y: Math.max(4, r.top - pad), r: Math.min(W - 4, r.right + pad), b: Math.min(H - 4, r.bottom + pad) } : null;
  // dimmed screen with a rounded cut-out over the target
  const rr = (x, y, w, h, k) => `M${x + k} ${y} H${x + w - k} A${k} ${k} 0 0 1 ${x + w} ${y + k} V${y + h - k} A${k} ${k} 0 0 1 ${x + w - k} ${y + h} H${x + k} A${k} ${k} 0 0 1 ${x} ${y + h - k} V${y + k} A${k} ${k} 0 0 1 ${x + k} ${y} Z`;
  hole.setAttribute('d', `M0 0 H${W} V${H} H0 Z ` + (tr ? rr(tr.x, tr.y, tr.r - tr.x, tr.b - tr.y, 10) : ''));
  hole.dataset.target = tr ? '1' : '';
  ring.style.display = tr ? '' : 'none'; if (tr) Object.assign(ring.style, { left: tr.x + 'px', top: tr.y + 'px', width: tr.r - tr.x + 'px', height: tr.b - tr.y + 'px' });
  // card: centred when there is no target; otherwise in the largest free space beside the target
  const cw = Math.min(400, W - 32); card.style.width = cw + 'px'; const ch = card.offsetHeight;
  let x, y;
  if (!tr) { x = (W - cw) / 2; y = (H - ch) / 2; }
  else {
    const space = { below: H - tr.b - 8, above: tr.y - 52, right: W - tr.r - 8, left: tr.x - 8 }, MIN = 22;
    const gap = room => Math.min(70, room); // the arrow gets up to 70 px; less when space is tight
    if (space.below >= ch + MIN) { y = tr.b + gap(space.below - ch); x = (tr.x + tr.r) / 2 - cw / 2; }
    else if (space.above >= ch + MIN) { y = tr.y - gap(space.above - ch) - ch; x = (tr.x + tr.r) / 2 - cw / 2; }
    else if (space.left >= cw + MIN) { x = tr.x - gap(space.left - cw) - cw; y = (tr.y + tr.b) / 2 - ch / 2; }
    else if (space.right >= cw + MIN) { x = tr.r + gap(space.right - cw); y = (tr.y + tr.b) / 2 - ch / 2; }
    else { x = (W - cw) / 2; y = H - ch - 16; }
    x = Math.max(16, Math.min(W - cw - 16, x)); y = Math.max(56, Math.min(H - ch - 16, y));
  }
  Object.assign(card.style, { left: x + 'px', top: y + 'px' });
  // a hand-drawn arrow from the card to the target
  if (!tr) { arrow.setAttribute('d', ''); return; }
  const cx = Math.max(x, Math.min(x + cw, (tr.x + tr.r) / 2)), cy = y > tr.b ? y : y + ch < tr.y ? y + ch : y + ch / 2;
  const sx = y > tr.b || y + ch < tr.y ? cx : (x > tr.r ? x : x + cw), sy = cy;
  const tx = Math.max(tr.x + 6, Math.min(tr.r - 6, sx)), ty = sy > tr.b ? tr.b + 6 : sy < tr.y ? tr.y - 6 : (tr.y + tr.b) / 2;
  const tx2 = sx < tr.x ? tr.x - 6 : sx > tr.r ? tr.r + 6 : tx;
  const ex = (sy >= tr.y && sy <= tr.b) ? tx2 : tx, ey = ty, mx = (sx + ex) / 2 + (ey - sy) * 0.25, my = (sy + ey) / 2 - (ex - sx) * 0.25;
  arrow.setAttribute('d', `M${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`);
}
