import { icon } from './icons.js';
export { icon };
export const h = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[c]);
export const date = s => s ? new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  timeZone: 'America/Mexico_City'
}).format(new Date(s.length === 10 ? `${s}T12:00:00Z` : s)) : 'Sin fecha';
export const money = (n, c = 'MXN') => n === null || n === undefined ? 'Por confirmar' : `${new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: c,
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 2
}).format(n / 100)} ${c}`;
export const badge = (label, tone = 'neutral', i = '') => `<span class="badge ${tone}">${i ? icon(i) : ''}${h(label)}</span>`;
export const button = (label, action, i = '', kind = 'primary', extra = '') => `<button class="btn ${kind}" data-action="${h(action)}" ${extra}>${i ? icon(i) : ''}<span>${h(label)}</span></button>`;
export const iconButton = (label, action, i, extra = '') => `<button class="icon-btn" data-action="${h(action)}" aria-label="${h(label)}" title="${h(label)}" ${extra}>${icon(i)}</button>`;
export const sectionHead = (title, link = '', label = 'Ver todo') => `<div class="section-head"><h2>${h(title)}</h2>${link ? `<a class="text-link" href="${h(link)}">${h(label)}${icon('arrow')}</a>` : ''}</div>`;
export const pageHead = (eyebrow, title, description, actions = '') => `<header class="page-head"><div><p class="eyebrow">${h(eyebrow)}</p><h1 tabindex="-1">${h(title)}</h1><p class="lede">${h(description)}</p></div><div class="page-actions">${actions}</div></header>`;
export const notice = (message, tone = 'info', title = '') => `<div class="notice ${tone}">${icon(tone === 'warning' ? 'alert' : 'info')}<div>${title ? `<strong>${h(title)}</strong>` : ''}<p>${h(message)}</p></div></div>`;
export const empty = (title, body, action = '', label = '', i = 'board') => `<div class="empty-state"><span class="empty-icon">${icon(i)}</span><h2>${h(title)}</h2><p>${h(body)}</p>${action ? button(label, action, 'plus') : ''}</div>`;
export const amountValue = n => n === null || n === undefined ? '' : n / 100;
let fieldSequence = 0;
export function field(label,name,value='',{type='text',required=false,placeholder='',help='',max=200}={}) {
  const id = `field-${++fieldSequence}`;
  return `<div class="field"><label for="${id}">${h(label)}${required ? ' <span class="required" aria-hidden="true">*</span>' : ''}</label><input id="${id}" name="${h(name)}" type="${h(type)}" value="${h(value)}" ${required?'required':''} maxlength="${max}" placeholder="${h(placeholder)}" ${help?`aria-describedby="${id}-help"`:''} ${type==='number'?`min="0" step="${name==='connects'?'1':'0.01'}"`:''}>${help?`<small id="${id}-help">${h(help)}</small>`:''}</div>`;
}
export function area(label,name,value='',required=false,help='') {
  const id = `field-${++fieldSequence}`;
  return `<div class="field"><label for="${id}">${h(label)}${required?' <span class="required" aria-hidden="true">*</span>':''}</label><textarea id="${id}" name="${h(name)}" rows="4" maxlength="${name==='body'?'20000':'4000'}" ${required?'required':''} ${help?`aria-describedby="${id}-help"`:''}>${h(value)}</textarea>${help?`<small id="${id}-help">${h(help)}</small>`:''}</div>`;
}
export function select(label,name,options,value='') {
  const id = `field-${++fieldSequence}`;
  return `<div class="field"><label for="${id}">${h(label)}</label><select id="${id}" name="${h(name)}">${options.map(o=>{const [v,l]=Array.isArray(o)?o:[o,o];return `<option value="${h(v)}" ${v===value?'selected':''}>${h(l)}</option>`;}).join('')}</select></div>`;
}
export const check = (label, name, value = false) => `<label class="check-field"><input type="checkbox" name="${h(name)}" ${value ? 'checked' : ''}><span>${h(label)}</span></label>`;
export function opportunityCard(o, demo = false) {
  return `<article class="opportunity-card"><div class="card-top"><span class="category-icon ${o.category.includes('Datos') ? 'sage' : o.category.includes('Redacción') ? 'ochre' : o.category.includes('Automatización') ? 'blue' : ''}">${icon(o.category.includes('Datos') ? 'layers' : o.category.includes('Automatización') ? 'spark' : 'file')}</span><div><span class="category">${h(o.category)}</span><span class="source">${h(o.source)}</span></div>${iconButton(o.saved ? 'Quitar de guardadas' : 'Guardar encargo', 'save', 'bookmark', `data-id="${h(o.id)}" aria-pressed="${o.saved}"`)}</div><h3><a href="#/opportunity/${h(o.id)}">${h(o.title)}</a></h3><p class="card-description">${h(o.description || 'Añade contexto para decidir tu siguiente paso.')}</p><div class="card-tags">${badge(o.status === 'closed' ? 'Cerrada' : 'Por revisar', o.status === 'closed' ? 'neutral' : 'amber', o.status === 'closed' ? 'lock' : 'clock')}${demo ? '<span class="example-tag">Ejemplo ficticio</span>' : ''}</div><div class="card-data"><div><span>Presupuesto</span><strong>${money(o.budget, o.currency)}</strong></div><div><span>Postulación</span><strong>${o.connects === null ? 'Sin confirmar' : `${o.connects} connects`}</strong></div></div><div class="card-footer"><span>${icon('calendar')}${o.publishedAt ? `Publicada ${date(o.publishedAt)}` : 'Publicación sin fecha'}</span><a href="#/opportunity/${h(o.id)}" aria-label="Ver ${h(o.title)}">${icon('arrow')}</a></div></article>`;
}
