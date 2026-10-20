import { h, icon, badge, button, pageHead, notice, empty, opportunityCard } from '../ui.js';
import { categories, active } from '../domain.js';
import { radarSection } from '../radar.js';
export function board(s, demo, ui) {
  let rows = s.opportunities.filter(o => ui.boardTab === 'archived' ? o.archivedAt : active(o));
  if (ui.category) rows = rows.filter(o => o.category === ui.category);
  if (ui.query) rows = rows.filter(o => `${o.title} ${o.description} ${o.category}`.toLocaleLowerCase('es').includes(ui.query.toLocaleLowerCase('es')));
  if (ui.sort === 'title') rows.sort((a, b) => a.title.localeCompare(b.title, 'es'));
  return `${pageHead('ENCUENTRA TU SIGUIENTE MISIÓN', 'Ofertas', 'El radar busca cada mañana. Lo que te interesa lo guardas aquí.', button('Añadir encargo', 'new-opportunity', 'plus', 'secondary'))}
 <div class="tabs" role="tablist" aria-label="Vistas del tablón">${[['radar', 'Radar'], ['saved', 'Guardadas'], ['archived', 'Archivo']].map(([v, l]) => `<button role="tab" aria-selected="${ui.boardTab === v}" data-action="board-tab" data-tab="${v}">${l}${v === 'saved' ? `<span>${s.opportunities.filter(active).length}</span>` : ''}</button>`).join('')}</div>
${ui.boardTab === 'radar' ? radarSection(s, ui) : `
 <div class="toolbar"><label class="search-field">${icon('search')}<input id="board-search" type="search" placeholder="Buscar por título o habilidad…" value="${h(ui.query)}" aria-label="Buscar encargos"></label><label class="filter-select">${icon('filter')}<select id="category-filter" aria-label="Filtrar categoría"><option value="">Todas las áreas</option>${categories.map(c => `<option ${ui.category === c ? 'selected' : ''}>${h(c)}</option>`).join('')}</select></label><select id="sort-filter" aria-label="Ordenar encargos"><option value="recent">Más recientes</option><option value="title" ${ui.sort === 'title' ? 'selected' : ''}>Por título</option></select></div>
 <div class="list-caption"><span>${rows.length} ${rows.length === 1 ? 'encargo' : 'encargos'}${demo ? ' de ejemplo' : ''}</span><span>${icon('lock')}Guardadas · solo en este dispositivo</span></div>
 ${ui.boardTab === 'saved' ? notice('Añadir un encargo no confirma su vigencia. Revisa la fecha, las condiciones y el costo antes de decidir.') : ''}
 ${rows.length ? `<div class="card-grid">${rows.map(o => ui.boardTab === 'archived' ? `<div>${opportunityCard(o, demo)}<div class="archive-bar">${button('Restaurar', 'restore', 'refresh', 'secondary', `data-id="${h(o.id)}" data-collection="opportunities"`)}</div></div>` : opportunityCard(o, demo)).join('')}</div>` : empty(ui.query || ui.category ? 'No encontramos coincidencias' : ui.boardTab === 'saved' ? 'Un lugar para tus favoritas' : ui.boardTab === 'archived' ? 'El archivo está vacío' : 'Aún no guardas ofertas', ui.query || ui.category ? 'Prueba otra palabra o vuelve a todas las áreas.' : 'Toca «Guardar» en una oferta del Radar o añade una a mano.', ui.query || ui.category ? 'clear-filters' : 'new-opportunity', ui.query || ui.category ? 'Limpiar filtros' : 'Añadir encargo')}`}`;
}
