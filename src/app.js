import { createStore } from './store.js';
import { h, icon, button, iconButton, date, notice, empty } from './ui.js';
import { home } from './views/home.js';
import { board } from './views/board.js';
import { explore } from './views/explore.js';
import { missions } from './views/missions.js';
import { opportunityDetail, proposalDetail, workDetail } from './views/detail.js';
import { profile, settings, sources, states, archive, help } from './views/settings.js';
import { formFor } from './forms.js';
import { menu } from './views/menu.js';
import { decodeImport } from './importar.js';
import { loadNegocios, negocio, toProspect, setClave } from './negocios.js';
import { loadRadar, radarOffer, toOpportunity, radarAge, animateGauges } from './radar.js';
const APP_VERSION = 'V0.5';
const root = document.querySelector('#app'),
  dialog = document.querySelector('#dialog');
const ui = {
  query: '',
  category: '',
  sort: 'recent',
  boardTab: 'radar',
  exploreTab: 'dia',
  missionTab: 'works',
  detailTab: 'summary',
  previewState: 'ready',
  radarSource: ''
};
const UI_KEY = 'naofumi.ui.v1';
try { const saved = JSON.parse(localStorage.getItem(UI_KEY) || '{}'); for (const k of ['boardTab', 'exploreTab', 'missionTab']) if (typeof saved[k] === 'string') ui[k] = saved[k]; } catch {}
function saveTabs() { try { localStorage.setItem(UI_KEY, JSON.stringify({ boardTab: ui.boardTab, exploreTab: ui.exploreTab, missionTab: ui.missionTab })); } catch {} }
if (!['radar', 'saved', 'archived'].includes(ui.boardTab)) ui.boardTab = 'radar';
if (!['dia', 'mine', 'archived'].includes(ui.exploreTab)) ui.exploreTab = 'dia';
let store,
  opener,
  modalDirty = false,
  mainDirty = false,
  renderedLocation = '',
  currentHash = location.hash || '#/home';
const nav = [['home', 'Hoy', 'home'], ['board', 'Ofertas', 'board'], ['explore', 'Negocios', 'compass'], ['missions', 'Misiones', 'briefcase']];
const mobileNav = [...nav, ['menu', 'Menú', 'menu']];
const MENU_KEYS = ['menu', 'profile', 'settings', 'sources', 'help', 'archive', 'states'];
const extra = [['profile', 'Mi perfil', 'user'], ['sources', 'Fuentes', 'layers'], ['settings', 'Mi espacio', 'settings']];
function route() {
  const [key = 'home', id] = location.hash.replace(/^#\/?/, '').split('/');
  return {
    key: key || 'home',
    id
  };
}
function navItem([key, label, i], active, mobile = false) {
  return `<a href="#/${key}" class="nav-item ${active === key ? 'active' : ''}" ${active === key ? 'aria-current="page"' : ''}>${icon(i)}<span>${label}</span>${active === key && !mobile ? '<span class="nav-dot"></span>' : ''}</a>`;
}
function render({
  preserve = false
} = {}) {
  if (!store) return;
  const locationKey = `${store.getSpace()}:${location.hash || '#/home'}`;
  const drafts = mainDirty && renderedLocation === locationKey ? [...root.querySelectorAll('main form[data-form]')].map(form => ({
    name: form.dataset.form,
    id: form.dataset.id || '',
    fields: [...form.elements].filter(el => el.name).map(el => ({ name: el.name, value: el.value, checked: el.checked }))
  })) : [];
  const s = store.getState(),
    demo = store.getSpace() === 'demo',
    {
      key,
      id
    } = route();
  const focus = preserve ? {
    id: document.activeElement.id,
    start: document.activeElement.selectionStart,
    end: document.activeElement.selectionEnd,
    scroll: window.scrollY
  } : null;
  const active = key === 'opportunity' ? 'board' : ['proposal', 'work'].includes(key) ? 'missions' : key;
  const mobileActive = MENU_KEYS.includes(key) ? 'menu' : active;
  let content;
  try {
    switch (key) {
      case 'home':
        content = home(s, demo);
        break;
      case 'board':
        content = board(s, demo, ui);
        break;
      case 'explore':
        content = explore(s, demo, ui);
        break;
      case 'missions':
        content = missions(s, demo, ui);
        break;
      case 'opportunity':
        content = opportunityDetail(s, id, demo, ui);
        break;
      case 'proposal':
        content = proposalDetail(s, id, demo);
        break;
      case 'work':
        content = workDetail(s, id, demo);
        break;
      case 'profile':
        content = profile(s, demo);
        break;
      case 'settings':
        content = settings(s, demo);
        break;
      case 'sources':
        content = sources();
        break;
      case 'states':
        content = states(ui);
        break;
      case 'archive':
        content = archive(s);
        break;
      case 'help':
        content = help();
        break;
      case 'menu':
        content = menu(demo, APP_VERSION);
        break;
      default:
        content = empty('Este camino no existe', 'Vuelve al inicio para continuar.', 'go-home', 'Volver a Hoy', 'compass');
    }
  } catch (e) {
    content = empty('No pudimos mostrar esta pantalla', 'Tus datos se conservan. Vuelve al inicio o exporta una copia desde Mi espacio.', 'go-home', 'Volver al inicio', 'alert');
    console.error(e);
  }
  const unread = s.notifications.filter(n => !n.read).length;
  root.innerHTML = `<aside class="sidebar"><a class="brand" href="#/home"><img src="./assets/mark.svg" alt="" width="43" height="43"><span>NAOFUMI<small>TU GREMIO PERSONAL</small></span></a><span class="nav-label">EL CAMINO</span><nav aria-label="Navegación principal">${nav.map(x => navItem(x, active)).join('')}</nav><div class="sidebar-rule"></div><span class="nav-label">TU CAMPAMENTO</span><nav aria-label="Tu espacio">${extra.map(x => navItem(x, active)).join('')}</nav><div class="sidebar-bottom"><div class="local-card">${icon('leaf')}<strong>A tu ritmo.<br>A tu manera.</strong><p>Un paso pequeño también<br>es avanzar.</p><span>✦</span></div><a href="#/help" class="nav-item">${icon('help')}<span>Guía del gremio</span></a><div class="sidebar-version">NAOFUMI <span>${APP_VERSION}</span></div></div></aside><div class="app-body"><header class="topbar"><a class="mobile-brand" href="#/home"><img src="./assets/mark.svg" alt="" width="32" height="32"><strong>NAOFUMI</strong></a><span class="breadcrumb">Tu campamento <span>/</span> ${h([...mobileNav, ...extra, ['help', 'Guía'], ['archive', 'Archivo']].find(x => x[0] === active)?.[1] || 'Expediente')}</span><div class="topbar-actions"><button class="workspace-indicator ${demo ? 'demo' : ''}" data-action="spaces">${icon(demo ? 'eye' : 'lock')}<span>${demo ? 'Ejemplos' : 'Mi espacio'}</span></button>${iconButton('Actualizar la app', 'app-update', 'refresh')}${iconButton('Buscar en mi espacio', 'search', 'search')}${iconButton('Notificaciones', 'notifications', 'bell', `${unread ? 'data-count="' + unread + '"' : ''}`)}<a class="avatar" href="#/profile" aria-label="Abrir mi perfil">${h(s.profile.name ? s.profile.name.slice(0, 1).toUpperCase() : 'A')}</a></div></header>${demo ? `<div class="mode-strip demo-strip"><span class="local-dot"></span><span>Estás viendo ejemplos ficticios.</span><button data-action="space-personal">Volver a Mi espacio ${icon('arrow')}</button></div>` : ''}<main id="main" class="main-content">${content}<footer class="page-footer"><span>✦ &nbsp; NAOFUMI</span><span>Oportunidades claras. Decisiones tuyas.</span></footer></main><nav class="bottom-nav" aria-label="Navegación móvil">${mobileNav.map(x => navItem(x, mobileActive, true)).join('')}</nav></div>`;
  document.documentElement.dataset.density = s.preferences.density;
  root.querySelector('#main').tabIndex = -1;
  for (const draft of drafts) {
    const form = [...root.querySelectorAll('main form[data-form]')].find(el => el.dataset.form === draft.name && (el.dataset.id || '') === draft.id);
    if (form) for (const field of draft.fields) {
      const el = form.elements.namedItem(field.name);
      if (el) { el.value = field.value; if (el.type === 'checkbox') el.checked = field.checked; }
    }
  }
  renderedLocation = locationKey;
  document.documentElement.dataset.motion = s.preferences.reduceMotion ? 'reduced' : 'normal';
  document.title = `${[...mobileNav, ...extra].find(x => x[0] === active)?.[1] || 'Expediente'} · NAOFUMI`;
  if (focus?.id) {
    const el = document.getElementById(focus.id);
    if (el) {
      el.focus({
        preventScroll: true
      });
      try {
        el.setSelectionRange(focus.start, focus.end);
      } catch {}
    }
    window.scrollTo(0, focus.scroll);
  }
  animateGauges(root);
}
function handleImport() {
  const m = location.hash.match(/^#\/importar\/([A-Za-z0-9_-]+)$/);
  if (!m) return false;
  try {
    const data = decodeImport(m[1]);
    if (store.getSpace() !== 'personal') store.switchSpace('personal');
    const s = store.getState();
    const dup = s.prospects.some(p => !p.archivedAt && p.title === data.title);
    if (!dup) store.dispatch({ type: 'prospect.add', data });
    history.replaceState(null, '', '#/explore');
    currentHash = '#/explore';
    render();
    toast(dup ? 'Ese negocio ya estaba en Explorar.' : 'Negocio agregado a Explorar en Mi espacio.');
  } catch (e) {
    history.replaceState(null, '', '#/explore');
    currentHash = '#/explore';
    render();
    toast(`No se pudo importar: ${e.message}`, { error: true });
  }
  return true;
}
async function updateApp() {
  toast('Buscando la versión más reciente…');
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    await reg?.update();
    if (window.caches) for (const k of await caches.keys()) await caches.delete(k);
  } catch {}
  // Tus datos viven en este navegador (localStorage) y no se tocan al actualizar.
  setTimeout(() => location.reload(), 400);
}
function hideSplash() {
  const el = document.querySelector('#splash');
  if (!el) return;
  const wait = Math.max(0, 900 - performance.now());
  setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 450); }, wait);
}
function toast(message, {
  action,
  label = 'Deshacer',
  error = false
} = {}) {
  for (const old of document.querySelectorAll('.toast:not([data-undo])')) old.remove();
  const el = document.createElement('div');
  if (action) el.dataset.undo = 'true';
  el.className = `toast ${error ? 'toast-error' : ''}`;
  el.setAttribute('role', error ? 'alert' : 'status');
  el.innerHTML = `${icon(error ? 'alert' : 'check')}<span>${h(message)}</span>${action ? `<button class="toast-action">${h(label)}</button>` : ''}<button class="toast-close" aria-label="Cerrar aviso">${icon('close')}</button>`;
  document.querySelector('#toasts').append(el);
  el.querySelector('.toast-close').onclick = () => el.remove();
  if (action) el.querySelector('.toast-action').onclick = () => {
    action();
    el.remove();
  };else setTimeout(() => el.remove(), 7000);
}
function openDialog(title, body, {
  subtitle = '',
  wide = false
} = {}) {
  opener = document.activeElement;
  modalDirty = false;
  dialog.className = wide ? 'wide-dialog' : '';
  dialog.innerHTML = `<div class="dialog-heading"><div><p class="eyebrow tiny">NAOFUMI · TU ESPACIO LOCAL</p><h2 id="dialog-title">${h(title)}</h2>${subtitle ? `<p>${h(subtitle)}</p>` : ''}</div>${iconButton('Cerrar panel', 'close-dialog', 'close')}</div><div class="dialog-body">${body}</div>`;
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('input:not([type="hidden"]),textarea,button')?.focus();
}
function closeDialog(force = false) {
  if (!force && modalDirty && !confirm('Hay cambios sin guardar. ¿Quieres cerrar sin guardarlos?')) return false;
  modalDirty = false;
  const wasOpen = dialog.open;
  dialog.close();
  dialog.innerHTML = '';
  if (wasOpen && opener?.isConnected) opener.focus({
    preventScroll: true
  });
  return true;
}
function showForm(action, data) {
  const f = formFor(action, store.getState(), data);
  if (!f) return;
  openDialog(f.title, `<form data-form="${h(f.form)}" ${f.id ? `data-id="${h(f.id)}"` : ''}>${f.body}<div class="form-error" role="alert" tabindex="-1"></div><div class="dialog-footer"><button type="button" class="btn secondary" data-action="close-dialog">${f.noSubmit ? 'Cerrar' : 'Cancelar'}</button>${!f.noSubmit ? `<button type="submit" class="btn primary">${icon('check')}${h(f.submit)}</button>` : ''}</div></form>`, {
    subtitle: f.subtitle,
    wide: ['new-opportunity', 'edit-opportunity'].includes(action)
  });
}
function download(contents, name, type = 'application/json') {
  const blob = new Blob([contents], {
    type
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function dispatch(command, message = 'Guardado en este navegador.') {
  try {
    store.dispatch(command);
    toast(message);
    return true;
  } catch (e) {
    toast(e.message, {
      error: true
    });
    return false;
  }
}
function showNotifications() {
  const s = store.getState();
  openDialog('Notificaciones', `${notice('Avisos internos. No se envían correos ni notificaciones al dispositivo.')}<div class="notification-list">${s.notifications.map(n => `<button class="notification ${n.read ? 'read' : ''}" data-action="read-notification" data-id="${h(n.id)}"><span class="notification-icon">${icon(n.read ? 'check' : 'bell')}</span><span><strong>${h(n.title)}</strong><p>${h(n.body)}</p><small>${date(n.createdAt)} · ${n.read ? 'Leída' : 'Sin leer'}</small></span>${icon('chevron')}</button>`).join('') || empty('Todo tranquilo por aquí', 'Cuando guardes un encargo, aparecerá un aviso interno.')}</div>${s.notifications.some(n => !n.read) ? button('Marcar todas como leídas', 'read-all', 'check', 'secondary') : ''}`, {
    subtitle: 'Lo importante, sin ruido.'
  });
}
function globalSearch(q = '') {
  const s = store.getState();
  const groups = [['opportunities', 'Encargo', 'opportunity'], ['proposals', 'Propuesta', 'proposal'], ['works', 'Trabajo', 'work']];
  const rows = groups.flatMap(([col, label, path]) => s[col].filter(x => !x.archivedAt && x.title.toLocaleLowerCase('es').includes(q.toLocaleLowerCase('es'))).map(x => ({
    title: x.title,
    label,
    url: `#/${path}/${x.id}`
  }))).slice(0, 12);
  document.querySelector('#search-results').innerHTML = rows.length ? rows.map(x => `<a class="search-result" href="${h(x.url)}"><span>${icon('file')}<strong>${h(x.title)}</strong></span><small>${x.label}</small>${icon('arrow')}</a>`).join('') : '<p class="search-no-results">Sin coincidencias en este espacio.</p>';
}
document.addEventListener('click', async event => {
  const anchor = event.target.closest('a');
  if (anchor?.classList.contains('skip-link')) {
    event.preventDefault();
    const main = document.querySelector('#main');
    main?.focus();
    main?.scrollIntoView({block:'start'});
    return;
  }
  if (anchor && dialog.open) {
    if (!closeDialog()) {
      event.preventDefault();
      return;
    }
  }
  const el = event.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action,
    id = el.dataset.id;
  if (a === 'submit') return;
  if (a === 'detail-tab' && mainDirty) {
    if (!confirm('Hay notas sin guardar. ¿Quieres cambiar de pestaña sin guardarlas?')) return;
    mainDirty = false;
  }
  if (el.closest('form') && el.type === 'submit') event.preventDefault();
  try {
    switch (a) {
      case 'close-dialog':
        closeDialog();
        break;
      case 'go-home':
        location.hash = '/home';
        break;
      case 'radar-import': {
        const offer = radarOffer(id);
        if (!offer) throw new Error('Esta oferta ya no está en el radar. Recarga la página.');
        dispatch({ type: 'opportunity.add', data: toOpportunity(offer) }, 'Guardada en Ofertas › Guardadas. Revisa la fuente antes de postular.');
        break;
      }
      case 'negocio-add': {
        const n = negocio(id);
        if (!n) throw new Error('Ese negocio ya no está en la lista. Actualiza.');
        if (store.getSpace() !== 'personal') { store.switchSpace('personal'); toast('Cambié a Mi espacio para guardar datos reales.'); }
        dispatch({ type: 'prospect.add', data: toProspect(n) }, 'Agregado a tus hipótesis en Explorar.');
        break;
      }
      case 'negocios-reload':
        loadNegocios(() => render({ preserve: true }));
        render({ preserve: true });
        break;
      case 'negocios-clave-guardar': {
        const v = document.querySelector('#negocios-clave')?.value || '';
        if (v.length < 12) throw new Error('La contraseña debe tener al menos 12 caracteres, igual que en GitHub.');
        if (!setClave(v)) throw new Error('Este navegador no permite guardar la contraseña.');
        toast('Contraseña guardada en este dispositivo. Abriendo los negocios…');
        loadNegocios(() => render({ preserve: true }));
        location.hash = '/explore';
        break;
      }
      case 'negocios-clave-olvidar':
        setClave('');
        loadNegocios(() => render());
        toast('Contraseña borrada de este dispositivo.');
        render();
        break;
      case 'app-update':
        await updateApp();
        break;
      case 'radar-reload':
        loadRadar(() => { render({ preserve: true }); toast('Radar actualizado.'); });
        render({ preserve: true });
        break;
      case 'go-board':
        location.hash = '/board';
        break;
      case 'go-missions':
        location.hash = '/missions';
        break;
      case 'save':
        dispatch({
          type: 'opportunity.save',
          id
        }, 'Lista de guardadas actualizada.');
        break;
      case 'board-tab':
        ui.boardTab = el.dataset.tab;
        saveTabs();
        render();
        break;
      case 'explore-tab':
        ui.exploreTab = el.dataset.tab;
        saveTabs();
        render();
        break;
      case 'mission-tab':
        ui.missionTab = el.dataset.tab;
        saveTabs();
        render();
        break;
      case 'detail-tab':
        ui.detailTab = el.dataset.tab;
        render();
        break;
      case 'clear-filters':
        ui.query = '';
        ui.category = '';
        render();
        break;
      case 'preview-state':
        ui.previewState = el.dataset.state;
        render();
        break;
      case 'preview-retry':
        ui.previewState = 'ready';
        render();
        toast('Ejemplo resuelto. No se realizó ninguna conexión.');
        break;
      case 'toggle-action':
        dispatch({
          type: 'action.toggle',
          id
        }, 'Siguiente paso actualizado.');
        break;
      case 'archive':
        store.dispatch({
          type: 'archive',
          id,
          collection: el.dataset.collection
        });
        toast('Archivado. Conservamos el contenido.', {
          action: () => dispatch({
            type: 'restore',
            id,
            collection: el.dataset.collection
          }, 'Registro restaurado.')
        });
        break;
      case 'restore':
        dispatch({
          type: 'restore',
          id,
          collection: el.dataset.collection
        }, 'Registro restaurado.');
        break;
      case 'spaces':
        openDialog('Elige tu espacio', `<p>Los datos de cada espacio se conservan por separado.</p><div class="space-dialog">${button('Explorar ejemplos', 'space-demo', 'eye', 'secondary')}${button('Usar mi espacio', 'space-personal', 'lock')}</div>`);
        break;
      case 'space-demo':
      case 'space-personal':
        if ((modalDirty || mainDirty) && !confirm('Hay cambios sin guardar. ¿Quieres cambiar de espacio?')) break;
        store.switchSpace(a === 'space-demo' ? 'demo' : 'personal');
        mainDirty = false;
        closeDialog(true);
        location.hash = '/home';
        render();
        toast(a === 'space-demo' ? 'Estás en Ejemplos. Todos los escenarios son ficticios.' : 'Mi espacio está listo para tus datos.');
        break;
      case 'notifications':
        showNotifications();
        break;
      case 'read-notification':
        {
          const n = store.getState().notifications.find(x => x.id === id);
          store.dispatch({
            type: 'notification.read',
            id
          });
          closeDialog(true);
          location.hash = n.route;
          break;
        }
      case 'read-all':
        store.dispatch({
          type: 'notifications.read'
        });
        showNotifications();
        break;
      case 'search':
        openDialog('Encuentra tu próximo paso', `<label class="search-field modal-search">${icon('search')}<input id="global-search" type="search" aria-label="Buscar en todos los expedientes" placeholder="Busca un encargo, propuesta o trabajo…"></label><div id="search-results"></div><p class="small muted-text">Solo se busca en este espacio. Ctrl/Cmd + K para abrir.</p>`);
        globalSearch();
        document.querySelector('#global-search').focus();
        break;
      case 'export':
        download(store.export(), `NAOFUMI_${store.getSpace()}_${new Date().toISOString().slice(0, 10)}.json`);
        toast('Copia preparada para descargar.');
        break;
      case 'import':
        document.querySelector('#import-file').click();
        break;
      case 'copy-source':
        {
          const url = store.getState().opportunities.find(x => x.id === id)?.url;
          if (url) {
            try {
              await navigator.clipboard.writeText(url);
              toast('Enlace copiado. No se abrió ninguna conexión.');
            } catch {
              openDialog('Copia el enlace', `<label class="field"><span>Referencia guardada</span><input value="${h(url)}" readonly></label>`);
              dialog.querySelector('input').select();
            }
          }
          break;
        }
      default:
        showForm(a, el.dataset);
    }
  } catch (e) {
    toast(e.message, {
      error: true
    });
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'board-search') {
    ui.query = e.target.value;
    render({
      preserve: true
    });
    return;
  }
  if (e.target.id === 'global-search') {
    globalSearch(e.target.value);
    return;
  }
  if (e.target.closest('form')) {
    if (e.target.closest('dialog')) modalDirty = true;else mainDirty = true;
  }
});
document.addEventListener('change', async e => {
  if (e.target.id === 'category-filter') {
    ui.category = e.target.value;
    render({
      preserve: true
    });
  }
  if (e.target.id === 'radar-source') {
    ui.radarSource = e.target.value;
    render({
      preserve: true
    });
  }
  if (e.target.id === 'sort-filter') {
    ui.sort = e.target.value;
    render({
      preserve: true
    });
  }
  if (e.target.id === 'import-file' && e.target.files[0]) {
    try {
      const file = e.target.files[0];
      if (file.size > 3500000) throw new Error('El respaldo supera 3.5 MB. No se importó.');
      store.import(await file.text());
      toast('Copia incorporada sin reemplazar tus registros.');
    } catch (err) {
      toast(err.message, {
        error: true
      });
    }
    e.target.value = '';
  }
});
const formCommands = {
  'opportunity-add': 'opportunity.add',
  'opportunity-edit': 'opportunity.edit',
  'opportunity-note': 'opportunity.note',
  'prospect-add': 'prospect.add',
  'prospect-edit': 'prospect.edit',
  'prospect-validate': 'prospect.validate',
  'proposal-add': 'proposal.add',
  'proposal-version': 'proposal.version',
  'proposal-status': 'proposal.status',
  'work-add': 'work.add',
  'work-agreement': 'work.agreement',
  'work-status': 'work.status',
  'deliverable-add': 'deliverable.add',
  'payment-add': 'payment.add',
  'action-add': 'action.add',
  'action-edit': 'action.edit',
  'profile': 'profile.save',
  'skill-add': 'skill.add',
  'skill-edit': 'skill.edit',
  'preferences': 'preferences.save'
};
document.addEventListener('submit', e => {
  const form = e.target;
  if (!form.dataset.form) return;
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  for (const el of form.querySelectorAll('input[type="checkbox"]')) data[el.name] = el.checked;
  try {
    const type = formCommands[form.dataset.form];
    const fromModal = Boolean(form.closest('dialog'));
    store.dispatch({
      type,
      data,
      id: form.dataset.id,
      status: data.status
    });
    if (!fromModal) mainDirty = false;
    modalDirty = false;
    closeDialog(true);
    if (type === 'opportunity.add') location.hash = `/opportunity/${store.getState().opportunities[0].id}`;
    if (type === 'proposal.add') location.hash = `/proposal/${store.getState().proposals[0].id}`;
    if (type === 'work.add') location.hash = `/work/${store.getState().works[0].id}`;
    toast('Guardado localmente. Nada se ha enviado.');
  } catch (error) {
    const box = form.querySelector('.form-error');
    if (box) {
      box.innerHTML = `${icon('alert')}<span>${h(error.message)}</span>`;
      box.focus();
    } else toast(error.message, {
      error: true
    });
  }
});
dialog.addEventListener('cancel', e => {
  e.preventDefault();
  closeDialog();
});
dialog.addEventListener('click', e => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog();
  }
});
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (dialog.open && !closeDialog()) return;
    document.querySelector('[data-action="search"]')?.click();
  }
  const tab = e.target.closest('[role="tab"]');
  if (tab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
    e.preventDefault();
    const tabs = [...tab.parentElement.querySelectorAll('[role="tab"]')],
      idx = tabs.indexOf(tab),
      next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (idx + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    const action = tabs[next].dataset.action,
      value = tabs[next].dataset.tab;
    tabs[next].click();
    document.querySelector(`[data-action="${action}"][data-tab="${value}"]`)?.focus();
  }
});
window.addEventListener('hashchange', () => {
  if (handleImport()) return;
  if (mainDirty && !confirm('Hay cambios sin guardar. ¿Quieres salir de esta pantalla?')) {
    history.replaceState(null, '', currentHash);
    return;
  }
  mainDirty = false;
  currentHash = location.hash;
  ui.detailTab = 'summary';
  if (dialog.open) closeDialog(true);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced';
  if (document.startViewTransition && !still) document.startViewTransition(() => render());
  else render();
  window.scrollTo(0, 0);
  document.querySelector('main h1')?.focus({
    preventScroll: true
  });
});
window.addEventListener('beforeunload', e => {
  if (mainDirty || modalDirty) {
    e.preventDefault();
    e.returnValue = '';
  }
});
window.addEventListener('storage', e => {
  if (e.key?.startsWith('naofumi.local.v1.')) toast('Este espacio cambió en otra pestaña. Recarga antes de seguir editando.', {
    error: true
  });
});
try {
  store = createStore(localStorage);
  store.subscribe(() => render());
  if (!handleImport()) render();
  hideSplash();
  loadRadar(() => render({ preserve: true }));
  loadNegocios(() => render({ preserve: true }));
  let swReg = null;
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('./sw.js').then(reg => { swReg = reg; }).catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController) toast('Hay una versión nueva de NAOFUMI.', { action: () => location.reload(), label: 'Recargar' });
    });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    swReg?.update().catch(() => {});
    if (radarAge() > 36e5) { loadRadar(() => render({ preserve: true })); loadNegocios(() => render({ preserve: true })); }
  });
} catch (error) {
  hideSplash();
  root.innerHTML = `<main class="boot recovery"><img src="./assets/mark.svg" width="64" height="64" alt=""><h1>No pudimos abrir tu espacio</h1><p>${h(error.message)}</p><p>No hemos borrado ni reemplazado los datos. Puedes descargar el contenido original para revisarlo.</p><button id="recover-raw" class="btn primary">Descargar datos originales</button></main>`;
  document.querySelector('#recover-raw').onclick = () => {
    try {
      download(JSON.stringify({
        demo: localStorage.getItem('naofumi.local.v1.demo'),
        personal: localStorage.getItem('naofumi.local.v1.personal')
      }), 'NAOFUMI_RECUPERACION.json');
    } catch {
      toast('El navegador impide leer el almacenamiento. Revisa sus permisos.', {
        error: true
      });
    }
  };
}
