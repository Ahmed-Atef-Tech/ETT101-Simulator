// Two reading panels: the ready-made experiments (one click loads the wiring and the scope settings)
// and the model reference (SPEC.md, rendered in the app).
import SETUPS from 'virtual:setups';
import specMd from '../../SPEC.md';
import { marked } from 'marked';
import { BOOKS, GROUPS } from './catalog.js';
import { t, getLang, bidi } from './i18n.js';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const X_ICON = '<svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" stroke-width="1.6"><path d="M2 2l8 8M10 2l-8 8"/></svg>';
const TABS = ['t1', 't2', 'x'];
const num = x => `<span dir="ltr" class="num">${esc(x)}</span>`;
const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } } };

export function pageText(book, pg) {
  const ar = getLang() === 'ar';
  if (typeof pg === 'number') return { word: ar ? 'ص' : 'p.', n: String(pg), pdf: pg + BOOKS[book].pdfOff };
  return { word: pg.label ? (ar ? 'ص' : 'p.') : '', n: pg.label || '', pdf: pg.pdf };
}

export function initLibrary({ restore, toast, hasWork, openGuide, onLoaded }) {
  const lib = $('#lib'), ref = $('#refp');
  let tab = TABS.includes(store.get('ett.libTab')) ? store.get('ett.libTab') : 't1', query = '';

  // ---------------- experiments ----------------
  function itemHtml(g, it) {
    const ar = getLang() === 'ar', p = pageText(g.book, it.pg);
    const part = it.part ? `${t('libPart')} ${it.part}` : '';
    const WORDS = { 'Figs.': 'أشكال', 'Fig.': 'شكل', 'Steps': 'خطوات', 'Step': 'خطوة' };
    const m = it.where && it.where.match(/^(\S+)\s+(.+)$/);
    const where = m ? `${esc(ar ? WORDS[m[1]] || m[1] : m[1])} ${num(m[2])}` : '';
    return `<li><button class="lrow" data-f="${esc(it.f)}">
      <span class="lpart">${esc(part)}</span>
      <span class="lname">${bidi(esc(ar ? it.ar : it.en))}${where ? `<span class="lwhere">${where}</span>` : ''}</span>
      <span class="lpage">${p.n ? `<b>${p.word} ${num(p.n)}</b>` : ''}<span>PDF ${num(p.pdf)}</span></span>
      <span class="lgo">${t('libLoad')}</span></button></li>`;
  }
  function groupHtml(g, items) {
    const ar = getLang() === 'ar';
    const gn = g.n ? `<span class="gnum">${t('libExp')} ${g.n}</span>` : '';
    const range = g.pages ? `<span class="grange">${ar ? 'صفحات' : 'pp.'} ${num(g.pages)}</span>` : '';
    const sheet = g.guide ? `<button class="gsheet" data-g="${g.guide}">${t('libSheet')}</button>` : '';
    const emona = g.emona ? `<span class="gemona"><bdi>Emona ${esc(g.emona)}</bdi></span>` : '';
    return `<section class="lgrp"><h3>${gn}<span class="gname">${bidi(esc(ar ? g.ar : g.en))}</span>${range}${sheet}</h3>
      ${emona || g.adapted ? `<div class="gmeta">${emona}${g.adapted ? `<span class="gadapt">${t('libAdapted')}</span>` : ''}</div>` : ''}
      <ul>${items.map(it => itemHtml(g, it)).join('')}</ul></section>`;
  }
  function renderList() {
    const q = query.trim().toLowerCase();
    const match = (g, it) => !q || [g.en, g.ar, it.en, it.ar, it.f, g.emona || '', 'exp ' + (g.n || ''), it.part].join(' ').toLowerCase().includes(q);
    const groups = GROUPS.filter(g => q || g.tab === tab).map(g => [g, g.items.filter(it => match(g, it))]).filter(([, items]) => items.length);
    const books = [...new Set(groups.map(([g]) => g.book))];
    const note = q ? '' : `<p class="lnote"><b>${esc(BOOKS[books[0] || 't1'][getLang()])}</b><br>${tab === 'x' ? t('libEmonaNote') : t('libBookNote')}</p>`;
    $('#libList').innerHTML = note + (groups.length ? groups.map(([g, items]) => (q ? `<div class="lbook">${esc(BOOKS[g.book][getLang()])}</div>` : '') + groupHtml(g, items)).join('') : `<p class="lnone">${t('libNone')}</p>`);
    lib.querySelectorAll('.ltab').forEach(b => { b.classList.toggle('on', !q && b.dataset.tab === tab); b.setAttribute('aria-selected', !q && b.dataset.tab === tab ? 'true' : 'false'); });
  }
  function renderLib() {
    lib.innerHTML = `<div class="sheetHead"><h2>${t('libTitle')}</h2><button class="x" id="libX" aria-label="${t('close')}">${X_ICON}</button></div>
      <div class="ltools"><div class="seg" role="tablist">${TABS.map(k => `<button class="ltab" role="tab" data-tab="${k}">${t('libTab_' + k)}</button>`).join('')}</div>
        <label class="lsearch"><span>${t('libSearch')}</span><input id="libQ" type="search" value="${esc(query)}" autocomplete="off" spellcheck="false"></label></div>
      <div id="libList"></div>`;
    renderList();
    $('#libX').onclick = closeLib;
    lib.querySelectorAll('.ltab').forEach(b => b.onclick = () => { tab = b.dataset.tab; store.set('ett.libTab', tab); query = ''; $('#libQ').value = ''; renderList(); $('#libList').scrollTop = 0; });
    $('#libQ').oninput = e => { query = e.target.value; renderList(); };
  }
  lib.addEventListener('click', e => {
    const s = e.target.closest('.gsheet'); if (s) { closeLib(); openGuide(s.dataset.g); return; }
    const r = e.target.closest('.lrow'); if (!r) return;
    const f = r.dataset.f, setup = SETUPS[f]; if (!setup) return;
    if (hasWork() && !confirm(t('libReplace'))) return;
    const g = GROUPS.find(g => g.items.some(it => it.f === f)), it = g.items.find(it => it.f === f), p = pageText(g.book, it.pg);
    restore(JSON.parse(JSON.stringify(setup)));
    if (onLoaded) onLoaded({ f, en: it.en, page: p.n ? `p. ${p.n}` : `PDF ${p.pdf}` });
    closeLib();
    toast(`${getLang() === 'ar' ? it.ar : it.en}  ·  ${p.n ? `${p.word} ${p.n}` : `PDF ${p.pdf}`}`);
  });
  function openLib() { closeRef(); renderLib(); lib.classList.add('open'); setTimeout(() => $('#libQ') && $('#libQ').focus(), 30); }
  function closeLib() { lib.classList.remove('open'); }

  // ---------------- reference ----------------
  let refHtml = null;
  function renderRef() {
    if (!refHtml) {
      refHtml = marked.parse(specMd, { gfm: true });
      // wrap tables so wide ones scroll inside the panel instead of stretching it
      refHtml = refHtml.replace(/<table>/g, '<div class="tscroll"><table>').replace(/<\/table>/g, '</table></div>');
    }
    const div = document.createElement('div'); div.innerHTML = refHtml;
    const heads = [...div.querySelectorAll('h2, h3')]; heads.forEach((h, i) => h.id = 'ref-' + i);
    const toc = heads.map((h, i) => `<li class="${h.tagName === 'H3' ? 'sub' : ''}"><a href="#ref-${i}" data-to="ref-${i}">${esc(h.textContent)}</a></li>`).join('');
    ref.innerHTML = `<div class="sheetHead"><h2>${t('refTitle')}</h2><button class="x" id="refX" aria-label="${t('close')}">${X_ICON}</button></div>
      <p class="rintro">${t('refIntro')}</p>
      <div class="rbody"><nav class="rtoc" dir="ltr"><ul>${toc}</ul></nav><article class="rdoc" dir="ltr" lang="en">${div.innerHTML}</article></div>`;
    $('#refX').onclick = closeRef;
    ref.querySelectorAll('[data-to]').forEach(a => a.onclick = e => { e.preventDefault(); const h = ref.querySelector('#' + a.dataset.to); if (h) h.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
  }
  function openRef() { closeLib(); renderRef(); ref.classList.add('open'); }
  function closeRef() { ref.classList.remove('open'); }

  return {
    toggleLib: () => lib.classList.contains('open') ? closeLib() : openLib(),
    toggleRef: () => ref.classList.contains('open') ? closeRef() : openRef(),
    close: () => { closeLib(); closeRef(); },
    relabel: () => { if (lib.classList.contains('open')) renderLib(); if (ref.classList.contains('open')) renderRef(); },
  };
}
