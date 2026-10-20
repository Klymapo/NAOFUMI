// Negocios del día: archivo cifrado en el repo público, descifrado aquí con tu contraseña.
// La contraseña solo vive en este navegador y solo sirve para abrir este archivo.
import { h, icon, badge, button, notice } from './ui.js';

const URL_FEED = 'https://raw.githubusercontent.com/Klymapo/NAOFUMI/main/data/negocios.enc.json';
const KEY = 'naofumi.negocios.clave';
let data = null, status = 'idle', error = '';

export function getClave() { try { return localStorage.getItem(KEY) || ''; } catch { return ''; } }
export function setClave(v) { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); return true; } catch { return false; } }

const bytes = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

async function descifrar(sobre, clave) {
  if (sobre?.v !== 1 || sobre.alg !== 'AES-256-GCM') throw new Error('Formato de archivo desconocido.');
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(clave), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: bytes(sobre.salt), iterations: sobre.iter },
    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  try {
    const plano = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(sobre.iv) }, key, bytes(sobre.ct));
    return JSON.parse(new TextDecoder().decode(plano));
  } catch {
    throw Object.assign(new Error('La contraseña no coincide con la que guardaste en GitHub.'), { clave: true });
  }
}

export function loadNegocios(onDone) {
  const clave = getClave();
  if (!clave) { status = 'sin-clave'; data = null; onDone?.(); return; }
  if (!crypto?.subtle) { status = 'error'; error = 'Este navegador no permite descifrar (requiere HTTPS).'; onDone?.(); return; }
  status = data ? 'actualizando' : 'cargando';
  fetch(URL_FEED, { cache: 'no-cache' })
    .then(r => { if (r.status === 404) throw Object.assign(new Error('vacio'), { vacio: true }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(sobre => descifrar(sobre, clave))
    .then(d => { if (!Array.isArray(d?.negocios)) throw new Error('El archivo no trae negocios.'); data = d; status = 'listo'; error = ''; })
    .catch(e => { status = e.vacio ? 'vacio' : e.clave ? 'clave-mal' : 'error'; error = e.message; if (e.clave) data = null; })
    .finally(() => onDone?.());
}

export const negocio = id => data?.negocios.find(n => n.id === id) || null;

const tel = t => String(t || '').replace(/[^\d+]/g, '').slice(0, 15);
const mail = m => (/^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/i.test(m || '') ? m : '');
const web = w => { const s = String(w || '').trim(); if (!s) return ''; const u = /^https?:\/\//i.test(s) ? s : `http://${s}`; return /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : ''; };

export function toProspect(n) {
  return {
    title: `${n.nombre} · ${n.giro}`.slice(0, 160),
    category: n.giro,
    signal: `${n.actividad}. ${n.colonia}, ${n.ubicacion}. Tamaño: ${n.tamano}. Contacto público: ${n.telefono || '—'} · ${n.correo || '—'} · ${n.web || 'sin web'}. Señales: ${(n.senales || []).join('; ') || 'ninguna destacada'}. Fuente: INEGI, DENUE (Id ${n.id}).`,
    hypothesis: `${n.hipotesis} Servicio posible: ${n.servicio}.`,
    nextStep: n.validar
  };
}

function card(n, ya) {
  const t = tel(n.telefono), m = mail(n.correo), w = web(n.web);
  return `<article class="negocio-card">
  <div class="negocio-top"><span class="category">${h(n.giro)}</span><span class="source">${h(n.tamano)} · ${h(n.colonia)}</span></div>
  <h3>${h(n.nombre)}</h3>
  <p class="card-description">${h(n.actividad)}</p>
  <div class="card-tags">${(n.senales || []).map(s => badge(s, 'neutral')).join('')}</div>
  <p class="negocio-hip"><strong>Hipótesis:</strong> ${h(n.hipotesis)}</p>
  <p class="negocio-hip"><strong>Qué validar:</strong> ${h(n.validar)}</p>
  <div class="negocio-contacto">${t ? `<a class="btn secondary" href="tel:${h(t)}">${icon('user')}<span>Llamar</span></a>` : ''}${m ? `<a class="btn secondary" href="mailto:${h(m)}">${icon('file')}<span>Correo</span></a>` : ''}${w ? `<a class="btn secondary" href="${h(w)}" target="_blank" rel="noopener noreferrer">${icon('link')}<span>Web</span></a>` : ''}</div>
  <div class="radar-actions">${ya ? badge('Ya está en tus hipótesis', 'neutral', 'check') : button('Agregar a mis hipótesis', 'negocio-add', 'plus', 'primary', `data-id="${h(n.id)}"`)}</div>
</article>`;
}

export function negociosSection(s) {
  const head = `<div class="radar-head"><div><h2 id="negocios-title">${icon('compass')} Negocios del día</h2><p class="radar-meta">Fuente: INEGI, DENUE · hipótesis por validar, no necesidades confirmadas</p></div>${status === 'listo' || status === 'actualizando' ? button(status === 'actualizando' ? 'Actualizando' : 'Actualizar', 'negocios-reload', 'refresh', 'secondary', status === 'actualizando' ? 'disabled' : '') : ''}</div>`;
  const wrap = body => `<section class="radar negocios" aria-labelledby="negocios-title">${head}${body}</section>`;
  if (status === 'idle' || status === 'cargando') return wrap(`<div class="card-grid">${'<div class="skeleton-card"><span class="sk sk-line short"></span><span class="sk sk-title"></span><span class="sk sk-line"></span><span class="sk sk-bar"></span></div>'.repeat(2)}</div>`);
  if (status === 'sin-clave') return wrap(`${notice('Escribe en Mi espacio la contraseña que guardaste en GitHub como NEGOCIOS_CLAVE para ver aquí los negocios de cada día.', 'info', 'Falta tu contraseña')}<a class="btn primary" href="#/settings">${icon('settings')}<span>Ir a Mi espacio</span></a>`);
  if (status === 'clave-mal') return wrap(`${notice(error, 'warning', 'No se pudieron abrir los negocios')}<a class="btn secondary" href="#/settings">${icon('settings')}<span>Revisar contraseña</span></a>`);
  if (status === 'vacio') return wrap(notice('Todavía no hay negocios publicados. Aparecerán después de la corrida de las 07:17 una vez que estén los secrets NEGOCIOS_CLAVE y NAOFUMI_PUBLICO.', 'info', 'Aún sin negocios'));
  if (status === 'error' && !data) return wrap(`${notice(`No se pudo leer el archivo (${error}). Tus datos no se ven afectados.`, 'warning')}${button('Reintentar', 'negocios-reload', 'refresh', 'secondary')}`);
  const titulos = new Set(s.prospects.filter(p => !p.archivedAt).map(p => p.title));
  const porFecha = {};
  for (const n of data.negocios) (porFecha[n.fecha] ||= []).push(n);
  const fechas = Object.keys(porFecha).sort().reverse();
  const fmt = f => { const s = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${f}T12:00:00Z`)); return s.charAt(0).toUpperCase() + s.slice(1); };
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());
  return wrap(fechas.map((f, i) => `<details class="negocios-dia" ${i === 0 ? 'open' : ''}><summary>${h(f === hoy ? `Hoy · ${fmt(f)}` : fmt(f))} <span>${porFecha[f].length}</span></summary><div class="card-grid">${porFecha[f].map(n => card(n, titulos.has(toProspect(n).title))).join('')}</div></details>`).join(''));
}
