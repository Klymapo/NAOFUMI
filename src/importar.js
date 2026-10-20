// Importa un negocio desde el enlace del Issue privado: #/importar/<base64url de JSON>.
// El fragmento (#...) nunca se envía a ningún servidor; los datos solo pasan por tu navegador.
const MAX = { t: 160, g: 100, s: 4000, h: 4000, n: 4000 };

export function decodeImport(token) {
  const b64 = token.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '==='.slice((b64.length + 3) % 4));
  const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
  if (!data || data.v !== 1) throw new Error('Este enlace no es de NAOFUMI o es de otra versión.');
  const out = {};
  for (const k of Object.keys(MAX)) {
    if (typeof data[k] !== 'string' || !data[k].trim()) throw new Error('Al enlace le faltan datos del negocio.');
    out[k] = data[k].trim().slice(0, MAX[k]);
  }
  return { title: out.t, category: out.g, signal: out.s, hypothesis: out.h, nextStep: out.n };
}
