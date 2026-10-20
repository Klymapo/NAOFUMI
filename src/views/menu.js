import { h, icon, button, pageHead } from '../ui.js';

const item = (href, i, title, sub) => `<a class="menu-item" href="${href}"><span class="menu-icon">${icon(i)}</span><span><strong>${h(title)}</strong><small>${h(sub)}</small></span>${icon('chevron')}</a>`;

export function menu(demo, version) {
  return `${pageHead('TU CAMPAMENTO', 'Menú', 'Todo lo que no está en la barra de abajo.')}
  <nav class="menu-list" aria-label="Menú">
    ${item('#/profile', 'user', 'Mi perfil', 'Servicios, idiomas y disponibilidad')}
    ${item('#/settings', 'settings', 'Mi espacio', 'Contraseña de negocios, copias y actualizar')}
    ${item('#/sources', 'layers', 'Fuentes', 'De dónde salen las ofertas y los negocios')}
    ${item('#/help', 'help', 'Guía del gremio', 'Cómo se usa NAOFUMI')}
  </nav>
  <section class="panel padded menu-extra">
    <h2>${demo ? 'Estás viendo ejemplos ficticios' : 'Ejemplos'}</h2>
    <p>${demo ? 'Nada de lo que ves aquí es real. Tus datos siguen en Mi espacio.' : 'Un espacio aparte con datos inventados para probar la app sin tocar los tuyos.'}</p>
    ${demo ? button('Volver a Mi espacio', 'space-personal', 'arrow') : button('Ver ejemplos ficticios', 'space-demo', 'eye', 'secondary')}
  </section>
  <section class="panel padded menu-extra">
    <h2>NAOFUMI ${h(version)}</h2>
    <p>Descarga la versión más reciente. Tus datos no se borran.</p>
    ${button('Actualizar app', 'app-update', 'refresh', 'secondary')}
  </section>`;
}
