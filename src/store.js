import { createState, reduce, validateState, mergeBackup } from './domain.js';
import { createDemo } from './demo.js';
const PREFIX = 'naofumi.local.v1.';
export function createStore(storage) {
  let space = storage.getItem(PREFIX + 'space') === 'personal' ? 'personal' : 'demo';
  let persistedRaw = storage.getItem(PREFIX + space);
  let state = read(space);
  const listeners = new Set();
  function read(key) {
    const raw = storage.getItem(PREFIX + key);
    if (raw) {
      try {
        return validateState(JSON.parse(raw));
      } catch {
        throw new Error('Los datos guardados no se pudieron abrir. Conservamos el original; descarga una copia para revisarla.');
      }
    }
    return key === 'demo' ? createDemo() : createState();
  }
  function persist(next) {
    const raw = JSON.stringify(next);
    if (storage.getItem(PREFIX + space) !== persistedRaw) throw new Error('Este espacio cambió en otra pestaña. Exporta tus datos o recarga antes de editar; no sobrescribimos los cambios.');
    if (raw.length > 3500000) throw new Error('Este espacio se está llenando. Exporta una copia; no borramos datos automáticamente.');
    try {
      storage.setItem(PREFIX + space, raw);
    } catch {
      throw new Error('No se pudo guardar en este navegador. Puede faltar espacio o estar bloqueado el almacenamiento. Tus cambios anteriores siguen intactos.');
    }
    persistedRaw = raw;
    state = next;
    listeners.forEach(fn => fn());
  }
  return {
    getState: () => structuredClone(state),
    getSpace: () => space,
    dispatch: command => persist(reduce(state, command)),
    switchSpace(next) {
      if (!['demo', 'personal'].includes(next)) throw new Error('Espacio desconocido.');
      const loaded = read(next);
      storage.setItem(PREFIX + 'space', next);
      space = next;
      persistedRaw = storage.getItem(PREFIX + space);
      state = loaded;
      listeners.forEach(fn => fn());
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    export: () => JSON.stringify({
      app: 'NAOFUMI',
      schema: 1,
      space,
      exportedAt: new Date().toISOString(),
      state
    }, null, 2),
    import(raw) {
      if (raw.length > 3500000) throw new Error('El respaldo supera el tamaño permitido.');
      let incoming;
      try {
        incoming = JSON.parse(raw);
      } catch {
        throw new Error('El archivo no es JSON válido.');
      }
      if (!incoming || incoming.app !== 'NAOFUMI' || incoming.schema !== 1 || incoming.space !== space) throw new Error('Este respaldo pertenece a otro espacio o formato. Cambia al espacio correspondiente.');
      persist(mergeBackup(state, incoming.state));
    }
  };
}
