import { Sim } from './engine/sim.js';
import { FS } from './engine/dsp.js';
import { SOCKETS } from './engine/modules.js';
import { el } from './ui/svg.js';
import { Panel, knobReadout } from './ui/panel.js';
import { Scope, fmtV, fmtF, VDIV, TDIV, TD_OLD, migrateMeas, fixMeas } from './ui/scope.js';
import { Wires, LEAD_COLORS } from './ui/wires.js';
import { Audio } from './ui/audio.js';
import { SOCKET_NAME, SOCKET_POS, BLOCKS } from './ui/layout.js';
import { MODULE_INFO, HELP_LINKS, HELP, NOTICE } from './ui/content.js';
import { SHEETS, SECTIONS } from './ui/sheets.js';
import { startTour, tourOpen, endTour } from './ui/tour.js';
import { t, tr, trb, bidi, getLang, setLang } from './ui/i18n.js';
import { initLibrary } from './ui/library.js';

const $ = s => document.querySelector(s);
const sim = new Sim();
const audio = new Audio(sim);
const links = Object.assign({}, HELP_LINKS, (window.ett && window.ett.links) || {});
let training = true;
try { const v = localStorage.getItem('ett.training'); if (v !== null) training = v === '1'; } catch (e) { }
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// =============================================== workbench svg ===============================================
const svg = $('#bench');
const VB = { x: 0, y: -10, w: 2380, h: 1030 };
el('defs', {}, svg).innerHTML = `
<radialGradient id="boardGrad" cx="40%" cy="30%" r="90%"><stop offset="0" stop-color="#1c1c1e"/><stop offset="1" stop-color="#0b0b0c"/></radialGradient>
<radialGradient id="creamGrad" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fbf5e1"/><stop offset=".7" stop-color="#e2d6b2"/><stop offset="1" stop-color="#bfae82"/></radialGradient>
<linearGradient id="potGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4e3a5"/><stop offset=".55" stop-color="#e2c979"/><stop offset="1" stop-color="#b99c4c"/></linearGradient>
<radialGradient id="rotorGrad" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#fbeec0"/><stop offset="1" stop-color="#d7bb6c"/></radialGradient>
<radialGradient id="screwGrad" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#e8e8e8"/><stop offset="1" stop-color="#7c7c7c"/></radialGradient>
<linearGradient id="slideGrad" x1="0" x2="1"><stop offset="0" stop-color="#bdbdbd"/><stop offset="1" stop-color="#8d8d8d"/></linearGradient>
<linearGradient id="thumbGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfcfcf"/></linearGradient>
<radialGradient id="micGrad"><stop offset="0" stop-color="#2d2d2d"/><stop offset="1" stop-color="#5a5a5a"/></radialGradient>
<radialGradient id="bncGrad" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#f4f4f4"/><stop offset=".6" stop-color="#b8b8b8"/><stop offset="1" stop-color="#7a7a7a"/></radialGradient>
<linearGradient id="scopeBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efece6"/><stop offset="1" stop-color="#d9d5cd"/></linearGradient>
<linearGradient id="scopeRight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3e0d9"/><stop offset="1" stop-color="#d2cec6"/></linearGradient>
<linearGradient id="btnGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f6f3"/><stop offset="1" stop-color="#c9c5bd"/></linearGradient>
<linearGradient id="blueBtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6aa8f5"/><stop offset="1" stop-color="#2f62bd"/></linearGradient>
<radialGradient id="knobGrad" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d6d2c9"/></radialGradient>
<radialGradient id="knobTop" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#fbfaf7"/><stop offset="1" stop-color="#e2ded6"/></radialGradient>
<filter id="ledGlow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="shadow" x="-5%" y="-5%" width="110%" height="115%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity=".45"/></filter>`;
const world = el('g', { id: 'world' }, svg);
el('rect', { x: -5000, y: -5000, width: 12000, height: 12000, fill: 'transparent', class: 'mat' }, world);
const benchG = el('g', { filter: 'url(#shadow)' }, world);
const HPX = 1560, HPY = 690; const hpG = el('g', { id: 'hp', transform: `translate(${HPX},${HPY})` }, world);

let dragKnob = false, hoverKnobOn = false; // dragKnob: a knob is being turned with the mouse held down
const hooks = {
  changed: () => { },
  click: () => audio.ensure(),
  info: id => showInfo(id),
  knobTip: (mod, p, e, wheel) => showKnobTip(mod, p, e, wheel),
  hoverKnob: (mod, p, e) => { hoverKnobOn = !!mod; if (mod) { if (training) showTip(`<b dir="ltr">${knobReadout(sim, mod, p)}</b>`, e); } else if (!dragKnob) hideTip(); },
  toggleHeadphones: () => { audio.ensure(); sim.setHeadphones(!sim.headphones); drawHeadphones(); },
  screenshot: cv => saveImage(cv),
  scopeHelp: () => showModal(t('scopeHelp'), HELP[getLang()].scope, links.scope),
  plugged: () => audio.ensure(),
  hoverTarget: () => { },
  hoverLead: (l, e) => { if (l && training) showTip(l.probe ? `<bdi>${l.probe}</bdi> ⟷ <bdi>${SOCKET_NAME[sim.probes[l.probe]] || ''}</bdi><br><span class="dim">${t('probeTip')}</span>` : `<bdi>${SOCKET_NAME[l.a]}</bdi> ⟷ <bdi>${SOCKET_NAME[l.b]}</bdi><br><span class="dim">${t('leadTip')}</span>`, e); else hideTip(); },
  leadMenu: (l, e) => leadMenu(l, e),
};
const panel = new Panel(benchG, sim, hooks);
const scope = new Scope(benchG, sim, hooks);
const wireLayer = el('g', { id: 'wires' }, world);
const ghostLayer = el('g', { id: 'ghost' }, world);
const wires = new Wires(svg, wireLayer, sim, scope, hooks);
// factory settings: every setup is applied on top of these, so nothing is left over from the previous one
const SCOPE_DEFAULT = JSON.stringify(scope.st), MOD_DEFAULT = Object.fromEntries(Object.entries(sim.mods).map(([id, m]) => [id, { ...m.p }]));

function drawHeadphones() {
  hpG.innerHTML = '';
  const [jx, jy] = [652, 468], rtl = getLang() === 'ar';
  const label = (txt, x, y) => el('text', { x, y, text: txt, fill: '#93a8ad', 'font-size': 20, 'font-family': rtl ? 'Plex Arabic, sans-serif' : 'Barlow SC, sans-serif', direction: rtl ? 'rtl' : 'ltr', 'text-anchor': 'start' }, hpG);
  if (!sim.headphones) { label(t('hpOff'), rtl ? 640 : 0, 0); return; }
  const g = el('g', {}, hpG);
  const cab = `M${jx - HPX},${jy - HPY} C${jx - HPX},${jy - HPY + 260} -60,160 0,60`;
  el('path', { d: cab, stroke: 'transparent', 'stroke-width': 18, fill: 'none' }, g); el('path', { d: cab, stroke: '#111', 'stroke-width': 6, fill: 'none' }, g);
  el('path', { d: 'M-50,60 v-30 a50,50 0 0 1 100,0 v30', stroke: '#1d1d1d', 'stroke-width': 10, fill: 'none' }, g);
  el('rect', { x: -66, y: 40, width: 30, height: 52, rx: 12, fill: '#2b2b2b' }, g); el('rect', { x: 36, y: 40, width: 30, height: 52, rx: 12, fill: '#2b2b2b' }, g);
  label(audio.muted ? t('hpMuted') : t('hpOn'), rtl ? 640 : 90, 75);
  const pl = el('g', { transform: `translate(${jx - HPX},${jy - HPY})` }, g); el('circle', { r: 9, fill: '#c9c9c9', stroke: '#555', 'stroke-width': 2 }, pl);
  el('circle', { r: 16, fill: 'transparent' }, pl);
  // the plug, cable and headphones all sit over the jack: clicking any of them unplugs
  g.style.cursor = 'pointer'; g.setAttribute('class', 'hpProp');
  g.addEventListener('pointerdown', e => { if (e.button !== 0) return; e.stopPropagation(); hooks.toggleHeadphones(); });
  g.addEventListener('pointerenter', e => { if (training) showTip(t('hpUnplug'), e); });
  g.addEventListener('pointerleave', () => hideTip());
}

// =============================================== views: kit / both / scope / free zoom ===============================================
let view = { ...VB }, viewMode = 'both', lastFit = 'both';
try { const v = localStorage.getItem('ett.view'); if (v) viewMode = v; } catch (e) { }
function applyView() { svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`); }
function focusRect(x, y, w, h, pad = 0.02) {
  const r = svg.getBoundingClientRect(), a = r.width / r.height; x -= w * pad; y -= h * pad; w *= 1 + 2 * pad; h *= 1 + 2 * pad;
  let vw = w, vh = h; if (vw / vh < a) vw = vh * a; else vh = vw / a;
  view = { x: x + w / 2 - vw / 2, y: y + h / 2 - vh / 2, w: vw, h: vh }; applyView();
}
const RECTS = { kit: [26, 6, 1192, 996], scope: [scope.X, scope.Y, 1400 * scope.S, 545 * scope.S], both: [VB.x, VB.y, VB.w, VB.h] };
function setView(m) {
  viewMode = m; if (RECTS[m]) lastFit = m; try { localStorage.setItem('ett.view', m); } catch (e) { }
  for (const [id, k] of [['vKit', 'kit'], ['vBoth', 'both'], ['vScope', 'scope']]) $('#' + id).classList.toggle('on', m === k);
  if (RECTS[m]) focusRect(...RECTS[m], m === 'both' ? 0 : 0.015);
}
window.addEventListener('resize', () => { if (RECTS[viewMode]) setView(viewMode); });
function toSvg(e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
function zoomAt(e, k) {
  const p = toSvg(e); const nw = Math.max(250, Math.min(VB.w * 2, view.w * k)), nh = nw * view.h / view.w;
  view.x = p.x - (p.x - view.x) * nw / view.w; view.y = p.y - (p.y - view.y) * nh / view.h; view.w = nw; view.h = nh; applyView();
  if (viewMode !== 'free') setView('free');
}
// Ctrl + wheel (and touchpad pinch) zooms anywhere; capture phase so knobs don't steal it and the page itself never zooms
window.addEventListener('wheel', e => {
  if (!e.ctrlKey) return; e.preventDefault(); e.stopPropagation();
  if (e.target.closest && e.target.closest('#bench')) zoomAt(e, Math.exp(e.deltaY * 0.0018));
}, { passive: false, capture: true });
// plain wheel on the empty bench scrolls the view
svg.addEventListener('wheel', e => {
  if (e.ctrlKey || !e.target.classList.contains('mat')) return; e.preventDefault();
  const r = svg.getBoundingClientRect(), s = view.w / r.width;
  if (e.shiftKey) view.x += e.deltaY * s; else { view.x += e.deltaX * s; view.y += e.deltaY * s; }
  applyView(); if (viewMode !== 'free') setView('free');
}, { passive: false });
// drag the empty bench (left button) or anything with the middle/right button to pan
let pan = null, suppressCtx = false;
svg.addEventListener('pointerdown', e => {
  const onMat = e.target.classList.contains('mat') || e.target === svg;
  if ((e.button === 0 && onMat) || e.button === 1 || e.button === 2) { pan = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false, mat: e.button === 0 && onMat }; if (e.button !== 2) e.preventDefault(); }
});
window.addEventListener('pointermove', e => {
  if (!pan) return; const dx = e.clientX - pan.x, dy = e.clientY - pan.y; if (!pan.moved && Math.hypot(dx, dy) < 4) return;
  if (!pan.moved) { pan.moved = true; svg.classList.add('panning'); if (viewMode !== 'free') setView('free'); }
  const r = svg.getBoundingClientRect(), s = view.w / r.width; view.x = pan.vx - dx * s; view.y = pan.vy - dy * s; applyView();
});
window.addEventListener('pointerup', () => { if (pan && pan.moved) suppressCtx = true; if (pan && pan.mat && !pan.moved && wires.sel) wires.select(null); pan = null; svg.classList.remove('panning'); });
svg.addEventListener('dblclick', e => { if (e.target.classList.contains('mat')) setView('both'); });
svg.addEventListener('contextmenu', e => { if (suppressCtx) { e.preventDefault(); suppressCtx = false; return; } if (!e.target.closest('.lead')) e.preventDefault(); });
// full screen
// Centre button: after zooming or dragging away, bring back the last fitted view (Kit, Both or Scope)
function toggleFull() { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => { }); }
function recentre() { setView(RECTS[viewMode] ? viewMode : lastFit); }
document.addEventListener('fullscreenchange', () => setTimeout(() => { if (RECTS[viewMode]) setView(viewMode); }, 60));

// =============================================== tooltips ===============================================
const tip = $('#tip');
let lastMouse = { clientX: 0, clientY: 0 };
window.addEventListener('pointermove', e => { lastMouse = e; });
function showTip(html, e) {
  tip.innerHTML = html; tip.dir = getLang() === 'ar' ? 'rtl' : 'ltr'; tip.style.display = 'block';
  const x = e.clientX + 16, y = e.clientY + 18; tip.style.left = Math.min(x, innerWidth - tip.offsetWidth - 8) + 'px'; tip.style.top = Math.min(y, innerHeight - tip.offsetHeight - 8) + 'px';
}
function hideTip() { tip.style.display = 'none'; }
function showKnobTip(mod, p, e, wheel) {
  if (!mod) { dragKnob = false; if (!hoverKnobOn) hideTip(); return; } // mouse released: keep the readout only while still over the knob
  if (!training) return; if (!wheel) dragKnob = true; showTip(`<b dir="ltr">${knobReadout(sim, mod, p)}</b>`, e || lastMouse);
}
let hoverSock = null, hoverT = 0, sockTimer = 0; // the readings appear even if the mouse stays still
svg.addEventListener('pointerover', e => {
  const s = e.target.closest && e.target.closest('[data-socket]');
  if (s && training && !wires.tmp && !pan) { const id = s.getAttribute('data-socket'); if (id !== hoverSock) { hoverSock = id; sim.setProbe('HOV', id); hoverT = performance.now(); clearTimeout(sockTimer); sockTimer = setTimeout(() => { if (hoverSock === id) showSockTip(lastMouse); }, 160); } showSockTip(e); }
  else if (!s && hoverSock) { hoverSock = null; sim.setProbe('HOV', null); if (!dragKnob) hideTip(); }
});
svg.addEventListener('pointermove', e => { if (hoverSock) showSockTip(e); });
svg.addEventListener('pointerout', e => { // leaving a socket for something that is not a socket (or for outside the panel)
  if (!hoverSock) return; const to = e.relatedTarget; if (to && to.closest && to.closest('[data-socket]')) return;
  hoverSock = null; sim.setProbe('HOV', null); if (!dragKnob) hideTip();
});
for (const ev of ['pointerleave', 'blur']) (ev === 'blur' ? window : document.documentElement).addEventListener(ev, () => { if (!dragKnob) hideTip(); });
function showSockTip(e) {
  const id = hoverSock; const [, , dir, kind] = SOCKETS[id];
  const dirTxt = dir === 'in' ? t('input') : dir === 'out' ? t('output') : t('ground');
  let meas = '';
  if (performance.now() - hoverT > 120) {
    const st = sim.netState(id);
    if (st === 'float') meas = `<span class="dim">${t('notConnected')}</span>`;
    else {
      const n = 24000, b = sim.read('HOV', sim.t, n, new Float32Array(n)); let mx = -1e9, mn = 1e9, s = 0; for (const v of b) { if (v > mx) mx = v; if (v < mn) mn = v; s += v; }
      let avg = s / n, f = 0;
      if (mx - mn > 0.02) { const mid = (mx + mn) / 2, h = (mx - mn) * 0.1; let stt = b[0] > mid ? 1 : 0, c = 0, a0 = -1, a1 = -1; /* start in the state the window opens in, or a false edge at i = 0 skews f and DC */ for (let i = 0; i < n; i++) { if (!stt && b[i] > mid + h) { stt = 1; if (a0 < 0) a0 = i; else { c++; a1 = i; } } else if (stt && b[i] < mid - h) stt = 0; }
        if (c) { f = c / ((a1 - a0) / FS); let w = 0; for (let i = a0; i < a1; i++) w += b[i]; avg = w / (a1 - a0); } } // DC over whole cycles: a pure sine reads 0 V
      meas = `<span dir="ltr">Vp-p <b>${fmtV(mx - mn)}</b>&nbsp;&nbsp; DC <b>${fmtV(avg)}</b>${f ? `&nbsp;&nbsp; f <b>${fmtF(f)}</b>` : ''}</span>`;
      if (st === 'short') meas += `<br><span class="warn">${t('shorted')}</span>`;
    }
  }
  showTip(`<b><bdi>${SOCKET_NAME[id]}</bdi></b><br><span class="dim">${dirTxt}, ${kind === 'd' ? t('digital') : t('analog')}</span><br>${meas}`, e);
}

// =============================================== lead menu ===============================================
function leadMenu(l, e) {
  closeMenus();
  const m = document.createElement('div'); m.className = 'ctx'; m.style.left = e.clientX + 'px'; m.style.top = e.clientY + 'px';
  const bent = l.probe ? !!wires.probeBend[l.probe] : !!l.bend;
  const cur = l.probe ? (wires.probeColor[l.probe] || 'black') : l.color;
  m.innerHTML = (Object.keys(LEAD_COLORS).map(c => `<button class="plugsw ${c === cur ? 'sel' : ''}" data-c="${c}" title="${t('colors')[c]}" style="background:${LEAD_COLORS[c]}"></button>`).join(''))
    + (bent ? `<button class="rs">${t('resetShape')}</button>` : '') + `<button class="rm">${l.probe ? t('removeProbe') : t('removeLead')}</button>`;
  m.addEventListener('click', ev => {
    const c = ev.target.dataset.c; if (c) { if (l.probe) wires.probeColor[l.probe] = c; else l.color = c; wires.render(); }
    if (ev.target.classList.contains('rs')) wires.resetShape(l);
    if (ev.target.classList.contains('rm')) { if (l.probe) wires.setProbe(l.probe, null); else wires.removeLead(l.id); }
    closeMenus();
  });
  document.body.appendChild(m);
}
function closeMenus() { document.querySelectorAll('.ctx').forEach(x => x.remove()); }
window.addEventListener('pointerdown', e => {
  if (!e.target.closest('.ctx')) closeMenus();
  if (!e.target.closest('#settings') && !e.target.closest('#btnSettings')) $('#settings').classList.remove('open');
});

// =============================================== modal ===============================================
// returns false when the page may not open windows (a sandboxed preview, a popup blocker)
function openLink(url) {
  if (!url) return false;
  if (window.ett && window.ett.openExternal) { window.ett.openExternal(url); return true; }
  let w = null; try { w = window.open(url, '_blank'); } catch (e) { }
  if (w) { try { w.opener = null; } catch (e) { } return true; }
  return false;
}
function showModal(title, html, link) {
  $('#modalTitle').textContent = title; $('#modalBody').innerHTML = html;
  const yt = $('#modalYT'); yt.style.display = link === false ? 'none' : ''; yt.disabled = !link; yt.querySelector('span').textContent = link ? t('watch') : t('videoSoon'); yt.onclick = link ? () => openLink(link) : null;
  $('#modal').classList.add('open');
}
let afterModal = null; // something to show once the open message is closed (the welcome guide after the first-start notice)
const closeModal = () => { const was = $('#modal').classList.contains('open'); $('#modal').classList.remove('open'); if (was && afterModal) { const f = afterModal; afterModal = null; setTimeout(f, 250); } };
$('#modalClose').onclick = closeModal; $('#modalX').onclick = closeModal;
$('#modal').addEventListener('pointerdown', e => { if (e.target.id === 'modal') closeModal(); });
function showInfo(id) {
  const m = MODULE_INFO[id]; if (!m) return; const c = m[getLang()] || m.en;
  const html = `<p class="lead">${bidi(c.d)}</p>${m.eq ? `<pre class="eq">${esc(m.eq)}</pre>` : ''}${c.spec.length ? `<h4>${t('spec')}</h4><ul>${c.spec.map(x => `<li>${bidi(x)}</li>`).join('')}</ul>` : ''}${c.use.length ? `<h4>${t('use')}</h4><ul>${c.use.map(x => `<li>${bidi(x)}</li>`).join('')}</ul>` : ''}`;
  showModal(m.t, html, links[id]);
  const b = BLOCKS[id]; if (b) flash(b);
}
function flash([x1, y1, x2, y2]) { const r = el('rect', { x: x1 + 2, y: y1 + 2, width: x2 - x1 - 4, height: y2 - y1 - 4, fill: 'rgba(242,194,27,.16)', stroke: '#f2c21b', 'stroke-width': 3 }, world); setTimeout(() => r.remove(), 1600); }

// =============================================== lab sheet (experiment guide) ===============================================
let exp = null, stepI = 0, ghost = false;
// every lab sheet (sheets.js), looked up by id
const ALL_SHEETS = SHEETS;
const SHEET_BY_ID = Object.fromEntries(ALL_SHEETS.map(x => [x.id, x]));
const sameNet = (a, b) => sim.netOf(a) === sim.netOf(b);
const probeOk = (ch, s) => sim.probes[ch] && sameNet(sim.probes[ch], s);
const stepDone = st => (st.c || st.p) && (st.c || []).every(([a, b]) => sameNet(a, b)) && Object.entries(st.p || {}).every(([ch, s]) => probeOk(ch, s));
const X_ICON = '<svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" stroke-width="1.6"><path d="M2 2l8 8M10 2l-8 8"/></svg>';
function renderGuide() {
  const g = $('#guide');
  const head = title => `<div class="sheetHead"><h2>${title}</h2><button class="x" id="gClose" aria-label="${t('close')}">${X_ICON}</button></div>`;
  if (!exp) {
    let lastGroup = null;
    const secs = SECTIONS.map(sec => {
      const items = sec.ids.map(id => SHEET_BY_ID[id]).filter(Boolean)
        .map(x => `<li><button data-e="${x.id}"><span>${trb(x.title)}</span>${x.src ? `<span class="src">${trb(x.src)}</span>` : ''}</button></li>`).join('');
      const list = `<ol class="explist">${items}</ol>`;
      if (!sec.group) { lastGroup = null; return `<h3>${trb(sec)}</h3>${list}`; }
      const grp = sec.group.en !== lastGroup ? `<h3>${trb(sec.group)}</h3>` : ''; lastGroup = sec.group.en;
      return `${grp}<h4>${trb(sec)}</h4>${list}`;
    }).join('');
    g.innerHTML = head(t('guideTitle')) + `<div class="sheetList">${secs}</div>`;
    g.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { exp = SHEET_BY_ID[b.dataset.e]; stepI = 0; renderGuide(); });
  } else {
    const st = exp.steps[stepI];
    const checks = [...(st.c || []).map(([a, b]) => [sameNet(a, b), `<bdi>${SOCKET_NAME[a]}</bdi> → <bdi>${SOCKET_NAME[b]}</bdi>`]),
      ...Object.entries(st.p || {}).map(([ch, s]) => [probeOk(ch, s), `<bdi>${ch}</bdi> → <bdi>${SOCKET_NAME[s]}</bdi>`])];
    g.innerHTML = head(t('guideTitle')) + `
      <button class="crumb" id="gBack">${t('back')}</button>
      <div class="expTitle">${trb(exp.title)}${exp.src ? `<span class="src">${trb(exp.src)}</span>` : ''}</div>
      <div class="stepbar">${exp.steps.map((s, i) => `<button data-i="${i}" class="${i === stepI ? 'cur' : ''} ${stepDone(s) ? 'done' : ''}" title="${t('step')} ${i + 1}">${i + 1}</button>`).join('')}</div>
      <div class="stepHead">${trb(st.head)}</div>
      <ol class="acts">${st.acts.map(([n, en, ar]) => `<li class="${n == null ? 'note' : ''}"><span class="n">${n ?? ''}</span><span class="a">${trb({ en, ar })}</span></li>`).join('')}</ol>
      ${st.acts.some(a => a[0] != null) ? `<p class="bookSteps">${t('bookSteps')}</p>` : ''}
      ${checks.length ? `<div class="connHead">${t('connections')}</div><ul class="checks" dir="ltr">${checks.map(([ok, txt]) => `<li class="${ok ? 'ok' : ''}"><span class="box">${ok ? '✓' : ''}</span><span>${txt}</span></li>`).join('')}</ul>` : ''}
      ${st.q ? `<div class="question">${trb(st.q)}<div class="lines"></div></div>` : ''}
      <div class="sheetNav"><button id="gPrev" ${stepI === 0 ? 'disabled' : ''}>${t('prev')}</button>
        <label><input type="checkbox" id="gGhost" ${ghost ? 'checked' : ''}> ${t('showWiring')}</label>
        ${links[exp.id] ? `<button class="video" id="gVideo">${t('watch')}</button>` : ''}
        <button id="gNext" class="primary" ${stepI === exp.steps.length - 1 ? 'disabled' : ''}>${t('next')}</button></div>`;
    $('#gBack').onclick = () => { exp = null; renderGuide(); };
    $('#gPrev').onclick = () => { stepI--; renderGuide(); }; $('#gNext').onclick = () => { stepI++; renderGuide(); };
    $('#gGhost').onchange = e => { ghost = e.target.checked; drawGhost(); };
    if ($('#gVideo')) $('#gVideo').onclick = () => openLink(links[exp.id]);
    g.querySelectorAll('.stepbar button').forEach(b => b.onclick = () => { stepI = +b.dataset.i; renderGuide(); });
  }
  $('#gClose').onclick = () => { g.classList.remove('open'); drawGhost(); };
  drawGhost();
}
function drawGhost() {
  ghostLayer.innerHTML = ''; if (!exp || !ghost || !$('#guide').classList.contains('open')) return;
  const st = exp.steps[stepI];
  for (const [a, b] of st.c || []) { if (sameNet(a, b)) continue; const pa = SOCKET_POS[a], pb = SOCKET_POS[b]; el('path', { d: wires.curve(pa, pb), stroke: '#f2c21b', 'stroke-width': 4, 'stroke-dasharray': '10 7', fill: 'none' }, ghostLayer); for (const p of [pa, pb]) el('circle', { cx: p[0], cy: p[1], r: 15, fill: 'none', stroke: '#f2c21b', 'stroke-width': 3, class: 'ghostRing' }, ghostLayer); }
  for (const [ch, s] of Object.entries(st.p || {})) { if (probeOk(ch, s)) continue; const pa = scope.bncPos(ch), pb = SOCKET_POS[s]; el('path', { d: wires.curve(pa, pb, true), stroke: '#7fd3ff', 'stroke-width': 4, 'stroke-dasharray': '10 7', fill: 'none' }, ghostLayer); el('circle', { cx: pb[0], cy: pb[1], r: 15, fill: 'none', stroke: '#7fd3ff', 'stroke-width': 3, class: 'ghostRing' }, ghostLayer); }
}

// =============================================== rail & settings ===============================================
function fitRail() {
  const r = $('#rail'); r.classList.remove('c1', 'c2', 'c3');
  const fits = () => { const box = r.getBoundingClientRect(), pad = 6; return r.scrollWidth <= r.clientWidth && [...r.children].every(el => { if (el.hidden || el.type === 'file') return true; const b = el.getBoundingClientRect(); return !b.width || (b.left >= box.left + pad - 1 && b.right <= box.right - pad + 1); }); };
  for (const c of ['c1', 'c2', 'c3']) { if (fits()) break; r.classList.add(c); }
}
window.addEventListener('resize', fitRail);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitRail);
function applyTexts() { if (typeof setBugKind === "function" && $("#bugTitle")) setBugKind(bugKind);
  document.querySelectorAll('[data-t]').forEach(n => { n.textContent = t(n.dataset.t); });
  document.querySelectorAll('[data-hint]').forEach(n => { n.title = t(n.dataset.hint); });
  $('#btnFull').title = t('recentre');
  document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('on', b.dataset.lang === getLang()));
  document.querySelectorAll('[data-snd]').forEach(b => b.classList.toggle('on', (b.dataset.snd === '1') === !audio.muted));
  colorsEl.querySelectorAll('.plugsw').forEach(b => b.title = t('colors')[b.dataset.c]);
  $('#tGuide .state').textContent = training ? t('on') : t('off');
  drawHeadphones(); if ($('#guide').classList.contains('open')) renderGuide();
  if (typeof library !== 'undefined') library.relabel();
  fitRail();
}
function setTraining(on) {
  training = on; document.body.classList.toggle('training', on);
  $('#tGuide').setAttribute('aria-checked', on ? 'true' : 'false'); $('#tGuide .state').textContent = on ? t('on') : t('off');
  try { localStorage.setItem('ett.training', on ? '1' : '0'); } catch (e) { }
  if (!on) { $('#guide').classList.remove('open'); hideTip(); drawGhost(); }
}
$('#tGuide').onclick = () => setTraining(!training);
$('#btnGuide').onclick = () => { const g = $('#guide'); g.classList.toggle('open'); if (g.classList.contains('open')) { if (!training) setTraining(true); renderGuide(); } else drawGhost(); };
$('#vKit').onclick = () => setView('kit'); $('#vBoth').onclick = () => setView('both'); $('#vScope').onclick = () => setView('scope');
$('#btnFull').onclick = recentre;
$('#btnSettings').onclick = () => $('#settings').classList.toggle('open');
document.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => { setLang(b.dataset.lang); applyTexts(); });
document.querySelectorAll('[data-snd]').forEach(b => b.onclick = () => { audio.ensure(); audio.muted = b.dataset.snd !== '1'; applyTexts(); });
$('#btnClear').onclick = () => { $('#settings').classList.remove('open'); if (confirm(t('confirmClear'))) wires.clearAll(); };
$('#btnHelp').onclick = () => { $('#settings').classList.remove('open'); showModal(t('help'), HELP[getLang()].app, links._channel); };
$('#btnScopeHelp').onclick = () => { $('#settings').classList.remove('open'); hooks.scopeHelp(); };
// preliminary-version notice: shown once on first start, and any time from the Beta tag or Settings
function showAbout() { showModal(t('about'), NOTICE[getLang()] + `<p class="small">v${APP_VERSION}</p>`, false); }
$('#btnBeta').onclick = showAbout;
$('#btnAbout').onclick = () => { $('#settings').classList.remove('open'); showAbout(); };
const colorsEl = $('#colors');
colorsEl.innerHTML = Object.keys(LEAD_COLORS).map(c => `<button class="plugsw ${c === wires.color ? 'sel' : ''}" data-c="${c}" style="background:${LEAD_COLORS[c]}"></button>`).join('');
colorsEl.onclick = e => { const c = e.target.dataset.c; if (!c) return; wires.color = c; if (wires.sel) wires.select(null); colorsEl.querySelectorAll('.plugsw').forEach(s => s.classList.toggle('sel', s.dataset.c === c)); };

// save / open setups
function snapshot() {
  const mods = {}; for (const id in sim.mods) mods[id] = { ...sim.mods[id].p };
  const pb = {}, pc = {}; for (const k of ['CH1', 'CH2', 'EXT']) { if (wires.probeBend[k] && sim.probes[k]) pb[k] = wires.probeBend[k]; if (wires.probeColor[k] && wires.probeColor[k] !== 'black' && sim.probes[k]) pc[k] = wires.probeColor[k]; }
  return { v: 2, leads: sim.leads.map(({ a, b, color, bend }) => (bend ? { a, b, color, bend } : { a, b, color })), probes: { CH1: sim.probes.CH1, CH2: sim.probes.CH2, EXT: sim.probes.EXT }, probeBend: pb, probeColor: pc, mods, scope: { ...scope.st, ref: { ...scope.st.ref, data: null, on: false } }, headphones: sim.headphones }; // the stored reference wave is not saved
}
function restore(s) {
  const okPt = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);
  sim.leads = []; for (const l of s.leads || []) if (SOCKETS[l.a] && SOCKETS[l.b]) { const n = { id: 'L' + Math.random().toString(36).slice(2, 9), a: l.a, b: l.b, color: LEAD_COLORS[l.color] ? l.color : 'red' }; if (okPt(l.bend)) n.bend = l.bend; sim.leads.push(n); }
  wires.probeBend = {}; wires.probeColor = {}; for (const k of ['CH1', 'CH2', 'EXT']) { const p = (s.probeBend || {})[k]; if (okPt(p)) wires.probeBend[k] = p; const c = (s.probeColor || {})[k]; if (typeof c === 'string' && LEAD_COLORS.hasOwnProperty(c)) wires.probeColor[k] = c; }
  for (const k of ['CH1', 'CH2', 'EXT']) { const v = (s.probes || {})[k]; sim.probes[k] = v && SOCKETS[v] ? v : null; }
  sim.resetState(); for (const id in MOD_DEFAULT) for (const p in MOD_DEFAULT[id]) sim.mods[id].set(p, MOD_DEFAULT[id][p]);
  { const d = JSON.parse(SCOPE_DEFAULT); for (const k in d) scope.st[k] = d[k]; }
  // knobs and switches are 0..1; a file can only set parameters the module really has
  for (const id in s.mods || {}) if (sim.mods[id]) for (const p in s.mods[id]) { const v = +s.mods[id][p]; if (p in sim.mods[id].p && Number.isFinite(v)) sim.mods[id].set(p, Math.max(0, Math.min(1, v))); }
  // v1 files: the V/div list started at 2 mV; v2 adds 1 mV/div in front (UTD2000: 1 mV .. 20 V/div)
  if (s.scope && !(s.v >= 2)) { s = JSON.parse(JSON.stringify(s)); for (const k of ['CH1', 'CH2']) if (s.scope.ch && s.scope.ch[k] && typeof s.scope.ch[k].vd === 'number') s.scope.ch[k].vd += 1; }
  if (s.scope && s.scope.math) delete s.scope.math.fz;
  if (s.scope && typeof s.scope === 'object') {
    // take only known settings of the right type, then keep every list index inside its list
    const merge = (dst, src) => { for (const k in src) { if (!(k in dst)) continue; const a = dst[k], v = src[k];
      if (a && typeof a === 'object' && !Array.isArray(a) && !(a instanceof Float32Array)) { if (v && typeof v === 'object') merge(a, v); }
      else if (a === null || typeof a === typeof v) { if (typeof v !== 'number' || Number.isFinite(v)) dst[k] = v; } } };
    s.scope.meas = migrateMeas(s.scope.meas); // older files list measurements by their old names
    if (!('tdVer' in s.scope)) { for (const k of ['td', 'ztd']) if (typeof s.scope[k] === 'number') s.scope[k] += TD_OLD; } // time/div list grew at the fast end
    const d = scope.st; merge(d, s.scope); fixMeas(d.meas);
    if (!['R', 'F', 'RF'].includes(d.trig.slope)) d.trig.slope = 'R'; d.hold = Math.max(100e-9, Math.min(1.5, d.hold)); d.disp.bright = Math.max(1, Math.min(100, Math.round(d.disp.bright))); d.upage = 0;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)));
    for (const c of ['CH1', 'CH2']) { const ch = d.ch[c]; ch.vd = clamp(ch.vd, 0, VDIV.length - 1); ch.pos = Math.max(-10, Math.min(10, ch.pos)); ch.fine = Math.max(0.4, Math.min(2.5, ch.fine)); ch.probe = clamp(ch.probe, 0, 3); }
    d.td = clamp(d.td, 0, TDIV.length - 1); d.ztd = clamp(d.ztd, 0, d.td);
    d.ref.data = null; d.ref.on = false; // an older autosave may hold the reference as plain numbers
    d.run = true;
  }
  sim.headphones = !!s.headphones; sim.rebuild(); wires.render(); panel.refreshAll(); drawHeadphones();
}
function openGuideFor(id) { exp = SHEET_BY_ID[id] || null; stepI = 0; if (!training) setTraining(true); $('#guide').classList.add('open'); renderGuide(); }
let lastLoaded = null; // the ready-made experiment on the kit, until the wiring changes
const library = initLibrary({ restore, toast, hasWork: () => sim.leads.length > 0 || !!(sim.probes.CH1 || sim.probes.CH2), openGuide: openGuideFor, onLoaded: x => { lastLoaded = { ...x, leads: JSON.stringify(sim.leads.map(l => [l.a, l.b])) }; } });

// ---------- bug report: opens WhatsApp with the report written out ----------
const BUG_PHONE = '201019876314';
const APP_VERSION = (window.ett && window.ett.version) || (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '?');
function deviceText() {
  const ua = navigator.userAgent, os = /Windows/i.test(ua) ? 'Windows' : /Mac OS X/i.test(ua) ? 'Mac' : /Android/i.test(ua) ? 'Android' : /Linux/i.test(ua) ? 'Linux' : 'other';
  return `${os}, ${window.ett ? 'desktop app' : 'browser'}, screen ${screen.width}x${screen.height}`;
}
function setupText() {
  const s = scope.st, v = ch => { const c = s.ch[ch]; return `${c.on ? '' : 'off '}${VDIV[c.vd] >= 1 ? VDIV[c.vd] + ' V' : VDIV[c.vd] * 1000 + ' mV'}/div ${c.cpl}`; };
  const td = TDIV[s.td], tdTxt = td >= 1e-3 ? td * 1e3 + ' ms' : td >= 1e-6 ? +(td * 1e6).toFixed(1) + ' µs' : td * 1e9 + ' ns';
  const same = lastLoaded && lastLoaded.leads === JSON.stringify(sim.leads.map(l => [l.a, l.b]));
  const lines = [
    `Experiment: ${same ? `${lastLoaded.en} (${lastLoaded.f}, ${lastLoaded.page})` : lastLoaded ? `changed from ${lastLoaded.en}` : 'own wiring'}`,
    `Leads (${sim.leads.length}): ${sim.leads.map(l => `${l.a}-${l.b}`).join(', ') || 'none'}`,
    `Probes: CH1 ${sim.probes.CH1 || '-'}, CH2 ${sim.probes.CH2 || '-'}, EXT ${sim.probes.EXT || '-'}`,
    `Scope: CH1 ${v('CH1')}, CH2 ${v('CH2')}, ${tdTxt}/div, trigger ${s.trig.src} ${s.trig.mode} ${s.trig.level.toFixed(2)} V, ${s.run ? 'running' : 'stopped'}${s.math.on ? ', ' + s.math.kind : ''}`,
  ];
  return lines.join('\n');
}
let bugKind = 'bug'; // 'bug' = report a problem, 'idea' = suggest a feature (same button, same WhatsApp route)
function setBugKind(k) {
  bugKind = k; const idea = k === 'idea';
  document.querySelectorAll('.bugKind button').forEach(b => b.classList.toggle('on', b.dataset.kind === k));
  $('#bugTitle').textContent = t(idea ? 'ideaTitle' : 'bugTitle'); $('#bugWhatL').textContent = t(idea ? 'ideaWhat' : 'bugWhat'); $('#bugStepsL').textContent = t(idea ? 'ideaWhy' : 'bugSteps');
  $('#bugAttach').checked = !idea; $('#bugErr').textContent = ''; $('#bugWhat').removeAttribute('aria-invalid');
}
document.querySelectorAll('.bugKind button').forEach(b => b.onclick = () => { setBugKind(b.dataset.kind); $('#bugWhat').focus(); });
function openBug() { setBugKind(bugKind); closeMenus(); $('#settings').classList.remove('open'); $('#bugErr').textContent = ''; $('#bugFallback').classList.remove('show'); $('#bugWhat').removeAttribute('aria-invalid'); $('#bugDlg').classList.add('open'); setTimeout(() => $('#bugWhat').focus(), 30); }
function closeBug() { $('#bugDlg').classList.remove('open'); }
$('#btnBug').onclick = openBug; $('#bugX').onclick = closeBug;
$('#bugDlg').addEventListener('pointerdown', e => { if (e.target.id === 'bugDlg') closeBug(); });
$('#bugWhat').addEventListener('input', () => { if ($('#bugWhat').value.trim()) { $('#bugErr').textContent = ''; $('#bugWhat').removeAttribute('aria-invalid'); } });
$('#bugForm').onsubmit = e => {
  e.preventDefault();
  const what = $('#bugWhat').value.trim(), steps = $('#bugSteps').value.trim();
  const idea = bugKind === 'idea';
  if (!what) { $('#bugErr').textContent = t(idea ? 'ideaEmpty' : 'bugEmpty'); $('#bugWhat').setAttribute('aria-invalid', 'true'); $('#bugWhat').focus(); return; }
  let msg = `${idea ? '💡 Suggestion' : '🐞 Bug report'} — ETT-101 Simulator v${APP_VERSION}\n\n${what}`;
  if (steps) msg += `\n\n${idea ? 'Why it helps' : 'Before it'}: ${steps}`;
  if ($('#bugAttach').checked) msg += `\n\n— Details —\nDevice: ${deviceText()}\nLanguage: ${getLang()}\n${setupText()}`;
  if (msg.length > 3500) msg = msg.slice(0, 3500) + '…';
  const url = `https://wa.me/${BUG_PHONE}?text=${encodeURIComponent(msg)}`;
  if (openLink(url)) { $('#bugWhat').value = ''; $('#bugSteps').value = ''; closeBug(); toast(t(idea ? 'ideaOpened' : 'bugOpened')); return; }
  // could not open a window: keep the form and offer the link and the text instead
  $('#bugLink').href = url; $('#bugCopy').onclick = () => copyText(msg); $('#bugFallback').classList.add('show');
};
function copyText(txt) {
  const done = () => toast(t('bugCopied'));
  const old = () => { const ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { } ta.remove(); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, old); else old();
}
$('#btnLib').onclick = () => library.toggleLib();
$('#btnRef').onclick = () => library.toggleRef();
$('#btnSave').onclick = () => { $('#settings').classList.remove('open'); download(new Blob([JSON.stringify(snapshot(), null, 1)], { type: 'application/json' }), `setup-${stamp()}.ett.json`); toast(t('savedSetup')); };
$('#btnLoad').onclick = () => { $('#settings').classList.remove('open'); $('#fileIn').click(); };
$('#fileIn').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const s = JSON.parse(await f.text()); if (!s.leads) throw 0; restore(s); toast(s.title ? s.title : f.name); } catch (err) { alert(t('badFile')); } e.target.value = ''; };
function stamp() { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
function saveImage(cv) { cv.toBlob(b => download(b, `scope-${stamp()}.png`)); toast(t('savedImage')); }
function toast(msg) { const d = $('#toast'); d.textContent = msg; d.classList.add('show'); clearTimeout(d._t); d._t = setTimeout(() => d.classList.remove('show'), 1800); }
setInterval(() => { try { localStorage.setItem('ett.autosave', JSON.stringify(snapshot())); } catch (e) { } }, 3000);
try { const a = localStorage.getItem('ett.autosave'); if (a) restore(JSON.parse(a)); } catch (e) { }

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeMenus(); $('#settings').classList.remove('open'); library.close(); closeBug(); if (wires.sel) wires.select(null); }
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.ctrlKey || e.altKey || e.metaKey) return;
  if (e.key === '1') setView('kit'); if (e.key === '2') setView('both'); if (e.key === '3') setView('scope');
  if (e.key === 'f' || e.key === 'F') toggleFull();
});
// keep the browser itself from zooming with Ctrl +/-; map them to the bench
window.addEventListener('keydown', e => { if (e.ctrlKey && ['+', '=', '-', '0'].includes(e.key)) { e.preventDefault(); if (e.key === '0') setView('both'); else zoomAt({ clientX: innerWidth / 2, clientY: innerHeight / 2 }, e.key === '-' ? 1.25 : 0.8); } });
document.addEventListener('pointerdown', () => audio.ensure(), { once: true });

setLang(getLang()); applyTexts(); setTraining(training); wires.render();
// first start: the beta notice, then the welcome guide (shown once; Settings shows it again)
function runTour() { $('#settings').classList.remove('open'); closeMenus(); library.close(); if (RECTS[viewMode] && viewMode !== 'both') setView('both'); startTour(() => { try { localStorage.setItem('ett.tour', '1'); } catch (e) { } }); }
$('#btnTour').onclick = runTour;
{ let seen = false, toured = false; try { seen = localStorage.getItem('ett.notice') === '1'; toured = localStorage.getItem('ett.tour') === '1'; localStorage.setItem('ett.notice', '1'); } catch (e) { toured = true; }
  if (!seen) { showAbout(); if (!toured) afterModal = runTour; } else if (!toured) setTimeout(runTour, 500); }
requestAnimationFrame(() => setView(viewMode));

// =============================================== main loop ===============================================
let last = performance.now(), frame = 0, guideTick = 0, loadAvg = 0;
function loop(now) {
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (sim.headphones && audio.ctx && audio.ctx.state === 'running') { const q = sim.audioQueued(); dt *= q < 3000 ? 1.15 : q > 9000 ? 0.85 : 1; }
  const t0 = performance.now();
  sim.run(Math.round(dt * FS));
  loadAvg = loadAvg * 0.95 + (performance.now() - t0) * 0.05;
  if (sim.order.includes(sim.mods.speech) && !audio.micOn && !audio.micErr) audio.startMic();
  if (frame++ % 2 === 0) scope.update();
  panel.updateLeds();
  if (++guideTick % 20 === 0 && exp && $('#guide').classList.contains('open') && document.activeElement?.id !== 'gGhost') {
    const h = JSON.stringify([sim.version, sim.probes]); if (h !== renderGuide._h) { renderGuide._h = h; renderGuide(); }
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
window.__sim = sim; window.__perf = () => loadAvg;
window.__app = { sim, wires, scope, panel, restore, snapshot, setView, tour: { start: runTour, open: tourOpen, end: endTour }, sheets: ALL_SHEETS, sections: SECTIONS, setLang: l => { setLang(l); applyTexts(); } };
