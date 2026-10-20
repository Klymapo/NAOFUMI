// Radar diario: lee ./data/ofertas.json (mismo origen, generado por GitHub Actions).
// Es solo lectura: nada entra a tu espacio hasta que pulsas «Llevar al tablón».
import { h, icon, badge, button, notice } from './ui.js';

let feed = null;
let status = 'idle';
let error = '';
let loadedAt = 0;
const animated = new Set();

const SAFE = /^https:\/\/[^\s"'<>]+$/i;
const safeLink = u => (SAFE.test(String(u || '')) ? String(u) : '');

export function loadRadar(onDone) {
  status = 'loading';
  fetch('./data/ofertas.json', { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(d => {
      if (!d || !Array.isArray(d.ofertas) || !Array.isArray(d.fuentes)) throw new Error('El archivo del radar no tiene el formato esperado.');
      feed = d; status = 'ready'; error = ''; loadedAt = Date.now();
    })
    .catch(e => { status = feed ? 'ready' : 'error'; error = e.message || 'Error desconocido'; })
    .finally(() => onDone?.());
}

export const radarAge = () => (loadedAt ? Date.now() - loadedAt : Infinity);

// Llena cada medidor una sola vez, de 0 a su valor (respeta «reducir movimiento»).
export function animateGauges(root = document) {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced';
  for (const m of root.querySelectorAll('meter[data-id]')) {
    const target = Number(m.getAttribute('value')) || 0;
    if (still || animated.has(m.dataset.id)) continue;
    animated.add(m.dataset.id);
    const t0 = performance.now();
    m.value = 0;
    const step = now => {
      const k = Math.min(1, (now - t0) / 700);
      m.value = target * (1 - Math.pow(1 - k, 3));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}

export const radarOffer = id => feed?.ofertas.find(o => o.id === id) || null;

function ago(iso) {
  const hrs = (Date.now() - new Date(iso).getTime()) / 36e5;
  if (!Number.isFinite(hrs)) return 'fecha desconocida';
  if (hrs < 1) return 'hace menos de 1 h';
  if (hrs < 48) return `hace ${Math.round(hrs)} h`;
  return `hace ${Math.round(hrs / 24)} días`;
}

function budgetText(b) {
  if (!b) return 'Sin publicar';
  const fmt = n => (n == null ? '' : Number(n).toLocaleString('es-MX', { maximumFractionDigits: 0 }));
  const range = [b.min, b.max].filter(v => v != null).map(fmt).join('–');
  const per = b.periodo ? ` / ${b.periodo}` : '';
  const usd = b.moneda !== 'USD' && (b.usd_min || b.usd_max) ? ` (≈ US$${fmt(b.usd_max || b.usd_min)})` : '';
  return `${b.moneda} ${range}${per}${usd}`;
}

export function toOpportunity(o) {
  const b = o.presupuesto;
  const known = b && ['MXN', 'USD', 'EUR'].includes(b.moneda);
  const amount = known ? (b.max ?? b.min) : (b?.usd_max ?? b?.usd_min ?? null);
  return {
    title: o.titulo.slice(0, 160),
    description: o.descripcion || '',
    category: o.categoria_app,
    source: `Radar · ${o.fuente_nombre}`.slice(0, 100),
    url: safeLink(o.url),
    budget: amount == null ? '' : String(Math.round(amount * 100) / 100),
    currency: known ? b.moneda : 'USD',
    connects: '',
    publishedAt: (o.publicado || '').slice(0, 10),
    deadline: '',
    requirements: '',
    notes: [
      `Encontrada por el radar de NAOFUMI el ${(o.descubierto || '').slice(0, 10)} · conveniencia ${o.puntaje}/100 (${o.conveniencia?.dictamen || 'sin dictamen'}).`,
      `Motivos: ${o.motivos.join('; ')}.`,
      `Presupuesto según la fuente: ${budgetText(b)}.`,
      `Fuente: ${o.fuente_nombre}. Revisa la publicación original antes de postular.`
    ].join('\n')
  };
}

const TONE = { 'Conviene': 'good', 'Revisar': 'mid', 'No conviene': 'low' };

function gauge(o) {
  const c = o.conveniencia;
  if (!c) return `<ul class="radar-reasons">${o.motivos.map(m => `<li>${h(m)}</li>`).join('')}</ul>`;
  const rows = c.factores.map(f => `<li><span>${h(f.nombre)}</span><strong>${f.puntos > 0 && !f.max ? '+' : ''}${h(String(f.puntos))}${f.max ? ` / ${f.max}` : ''}</strong>${f.detalle && f.detalle !== f.nombre ? `<small>${h(f.detalle)}</small>` : ''}</li>`).join('');
  return `<div class="radar-gauge ${TONE[c.dictamen] || ''}">
    <div class="gauge-head"><span>¿Conviene postular?</span><strong>${h(c.dictamen)} · ${h(String(c.valor))}/100</strong></div>
    <meter data-id="${h(o.id)}" min="0" max="100" low="45" high="70" optimum="100" value="${Number(c.valor) || 0}" aria-label="Conveniencia ${h(String(c.valor))} de 100: ${h(c.dictamen)}"></meter>
    <details><summary>¿Por qué?</summary><ul class="gauge-factors">${rows}</ul><p class="radar-meta">Mide qué tanto te conviene invertir tiempo y pujas. No es la probabilidad de ganar el proyecto.</p></details>
  </div>`;
}

function card(o, imported) {
  const link = safeLink(o.url);
  return `<article class="opportunity-card radar-card">
  <div class="card-top"><span class="category-icon">${icon('compass')}</span><div><span class="category">${h(o.categoria_app)}</span><span class="source">${h(o.fuente_nombre)} · ${h(ago(o.publicado))}</span></div></div>
  <h3>${link ? `<a href="${h(link)}" target="_blank" rel="noopener noreferrer">${h(o.titulo)}</a>` : h(o.titulo)}</h3>
  <p class="card-description">${h((o.descripcion || '').slice(0, 220))}</p>
  <div class="card-tags">${o.nueva ? badge('Nueva', 'amber', 'spark') : ''}${o.lineas.map(l => badge(l, 'neutral')).join('')}</div>
  ${gauge(o)}
  <div class="card-data"><div><span>Presupuesto</span><strong>${h(budgetText(o.presupuesto))}</strong></div><div><span>Empresa</span><strong>${h(o.empresa || 'No indicada')}</strong></div></div>
  <div class="radar-actions">${imported ? badge('Ya está en tu tablón', 'neutral', 'check') : button('Llevar al tablón', 'radar-import', 'plus', 'primary', `data-id="${h(o.id)}"`)}${link ? `<a class="btn secondary" href="${h(link)}" target="_blank" rel="noopener noreferrer">${icon('link')}<span>Ver fuente</span></a>` : ''}</div>
</article>`;
}

export function radarSection(s, ui = {}) {
  if (!feed && (status === 'idle' || status === 'loading')) return `<section class="radar" aria-busy="true"><p class="radar-meta">Cargando el radar…</p></section>`;
  if (status === 'error') return `<section class="radar">${notice(`No se pudo leer el radar (${error}). Tus datos no se ven afectados.`, 'warning', 'Radar no disponible')}${button('Reintentar', 'radar-reload', 'refresh', 'secondary')}</section>`;
  const urls = new Set(s.opportunities.map(o => o.url).filter(Boolean));
  const ok = feed.fuentes.filter(f => f.estado === 'ok').length;
  const failed = feed.fuentes.filter(f => f.estado !== 'ok');
  const names = [...new Set(feed.ofertas.map(o => o.fuente_nombre))].sort((a, b) => a.localeCompare(b, 'es'));
  const pick = names.includes(ui.radarSource) ? ui.radarSource : '';
  const all = pick ? feed.ofertas.filter(o => o.fuente_nombre === pick) : feed.ofertas;
  const rows = all.slice(0, 12);
  const counts = n => feed.ofertas.filter(o => o.fuente_nombre === n).length;
  const filter = `<label class="filter-select radar-filter">${icon('filter')}<select id="radar-source" aria-label="Filtrar el radar por fuente"><option value="">Todas las fuentes (${feed.ofertas.length})</option>${names.map(n => `<option value="${h(n)}" ${n === pick ? 'selected' : ''}>${h(n)} (${counts(n)})</option>`).join('')}</select></label>`;
  return `<section class="radar" aria-labelledby="radar-title">
  <div class="radar-head"><div><h2 id="radar-title">${icon('compass')} Radar diario</h2><p class="radar-meta">${status === 'loading' ? 'Actualizando…' : `Búsqueda de ${h(ago(feed.generado))}`} · ${feed.ofertas.length} de ${feed.total_revisadas} ofertas pasaron los filtros · fuentes ${ok}/${feed.fuentes.length}</p></div>${button(status === 'loading' ? 'Actualizando' : 'Actualizar', 'radar-reload', 'refresh', 'secondary', status === 'loading' ? 'disabled aria-busy="true"' : '')}</div>
  ${names.length > 1 ? filter : ''}
  ${failed.length ? notice(`Sin respuesta hoy: ${failed.map(f => f.fuente).join(', ')}. Una fuente caída no significa cero oportunidades.`, 'warning') : ''}
  ${rows.length ? `<div class="card-grid">${rows.map(o => card(o, urls.has(safeLink(o.url)))).join('')}</div>` : notice('Hoy ninguna oferta pasó los filtros. Revisa Explorar o vuelve mañana.', 'info', 'Sin ofertas nuevas')}
  ${all.length > rows.length ? `<p class="radar-meta">Mostrando ${rows.length} de ${all.length}. Las demás son menos convenientes.</p>` : ''}
  <p class="radar-meta">${h(feed.aviso)}</p>
</section>`;
}
