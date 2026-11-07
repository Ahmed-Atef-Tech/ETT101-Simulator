export const NS = 'http://www.w3.org/2000/svg';
export function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) { const v = attrs[k]; if (v === undefined || v === null) continue; if (k === 'text') e.textContent = v; else e.setAttribute(k, v); }
  if (parent) parent.appendChild(e);
  return e;
}
export const pts = a => a.map(p => p.join(',')).join(' ');
