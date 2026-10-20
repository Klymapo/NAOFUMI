export const collections = ['opportunities', 'prospects', 'proposals', 'works', 'actions', 'notifications', 'audit'];
export const categories = ['Datos y Excel', 'Automatización', 'Investigación', 'Redacción y edición', 'Narrativa y guion', 'Gestión de proyectos', 'Diseño y documentación'];
export const currencies = ['MXN', 'USD', 'EUR'];
export const workStates = {
  agreed: 'Acordado',
  in_progress: 'En curso',
  delivered: 'Entregado',
  in_review: 'En revisión',
  finished: 'Terminado',
  cancelled: 'Cancelado'
};
export const proposalStates = {
  draft: 'Borrador',
  sent: 'Enviada fuera de la app',
  conversation: 'En conversación',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  withdrawn: 'Retirada'
};
const stamp = () => new Date().toISOString();
const uid = () => globalThis.crypto.randomUUID();
export function text(value, max = 4000) {
  const s = String(value ?? '').trim();
  if (s.length > max) throw new Error(`Usa como máximo ${max} caracteres.`);
  return s;
}
const required = (v, max = 200) => {
  const s = text(v, max);
  if (!s) throw new Error('Completa los campos obligatorios.');
  return s;
};
export function safeURL(value) {
  const s = text(value, 2048);
  if (!s) return '';
  let u;
  try {
    u = new URL(s);
  } catch {
    throw new Error('Escribe un enlace completo que empiece por https:// o http://.');
  }
  if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password) throw new Error('El enlace debe ser HTTP o HTTPS y no incluir credenciales.');
  return u.href;
}
export function moneyInput(value) {
  if (value === null || value === undefined || value === '') return null;
  const s = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) throw new Error('El importe debe ser positivo, con hasta dos decimales.');
  const amount = Math.round(Number(s) * 100);
  if (!Number.isSafeInteger(amount) || amount > 100000000000) throw new Error('El importe excede el límite permitido.');
  return amount;
}
function integerInput(v) {
  if (v === '' || v == null) return null;
  if (!/^\d+$/.test(String(v))) throw new Error('Los connects deben ser un número entero.');
  const n = Number(v);
  if (!Number.isSafeInteger(n) || n > 1000000) throw new Error('Cantidad fuera de rango.');
  return n;
}
function currency(v) {
  if (!currencies.includes(v)) throw new Error('Selecciona MXN, USD o EUR.');
  return v;
}
function dateInput(value) {
  if (!value) return null;
  const s = String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || new Date(`${s}T12:00:00Z`).toISOString().slice(0, 10) !== s) throw new Error('Selecciona una fecha válida.');
  return s;
}
const base = () => ({
  id: uid(),
  createdAt: stamp(),
  archivedAt: null
});
export function createState() {
  return {
    version: 1,
    opportunities: [],
    prospects: [],
    proposals: [],
    works: [],
    actions: [],
    notifications: [],
    audit: [],
    profile: {
      name: '',
      bio: '',
      services: '',
      languages: '',
      availability: '',
      skills: [],
      connects: null
    },
    preferences: {
      density: 'comfortable',
      reduceMotion: false,
      internalNotifications: true
    }
  };
}
function find(s, col, id) {
  const r = s[col]?.find(x => x.id === id);
  if (!r) throw new Error('No encontramos este registro. Regresa a la lista.');
  return r;
}
const active = r => !r.archivedAt;
function opportunityData(d) {
  return {
    title: required(d.title),
    description: text(d.description),
    category: text(d.category || categories[0], 100),
    source: text(d.source || 'Ingreso manual', 100),
    url: safeURL(d.url),
    budget: moneyInput(d.budget),
    currency: currency(d.currency || 'MXN'),
    connects: integerInput(d.connects),
    publishedAt: dateInput(d.publishedAt),
    deadline: dateInput(d.deadline),
    notes: text(d.notes),
    requirements: text(d.requirements),
    opening: 'unconfirmed',
    status: 'review'
  };
}
function notify(s, title, body, route) {
  if (s.preferences.internalNotifications) s.notifications.unshift({
    ...base(),
    title,
    body,
    route,
    read: false
  });
}
export function reduce(state, command) {
  const s = structuredClone(state),
    d = command.data || {},
    id = command.id;
  switch (command.type) {
    case 'opportunity.add':
      {
        const o = {
          ...base(),
          ...opportunityData(d),
          saved: false
        };
        s.opportunities.unshift(o);
        notify(s, 'Encargo añadido', 'Falta revisar la fecha, apertura y condiciones.', `#/opportunity/${o.id}`);
        break;
      }
    case 'opportunity.edit':
      {
        const o = find(s, 'opportunities', id);
        Object.assign(o, opportunityData(d));
        break;
      }
    case 'opportunity.save':
      {
        const o = find(s, 'opportunities', id);
        o.saved = !o.saved;
        break;
      }
    case 'opportunity.note':
      find(s, 'opportunities', id).notes = text(d.notes);
      break;
    case 'prospect.add':
      s.prospects.unshift({
        ...base(),
        title: required(d.title),
        signal: required(d.signal, 4000),
        hypothesis: required(d.hypothesis, 4000),
        nextStep: text(d.nextStep),
        category: text(d.category || 'Servicios', 100),
        url: safeURL(d.url),
        status: 'hypothesis',
        validation: '',
        interestConfirmed: false
      });
      break;
    case 'prospect.validate':
      {
        const p = find(s, 'prospects', id);
        p.validations ??= [];
        p.validations.push({createdAt:stamp(),validation:required(d.validation,4000),interestConfirmed:d.interestConfirmed===true});
        p.validation = required(d.validation, 4000);
        p.status = 'validating';
        p.interestConfirmed = d.interestConfirmed === true;
        break;
      }
    case 'prospect.edit': {
      const p = find(s,'prospects',id);
      p.revisions ??= [];
      p.revisions.push({createdAt:stamp(),title:p.title,signal:p.signal,hypothesis:p.hypothesis,nextStep:p.nextStep,category:p.category,url:p.url});
      if(p.validation && !p.validations?.length) p.validations=[{createdAt:stamp(),validation:p.validation,interestConfirmed:p.interestConfirmed}];
      Object.assign(p,{title:required(d.title),signal:required(d.signal,4000),hypothesis:required(d.hypothesis,4000),nextStep:text(d.nextStep),category:text(d.category||'Servicios',100),url:safeURL(d.url),status:'hypothesis',validation:'',interestConfirmed:false});
      break;
    }
    case 'proposal.add':
      {
        if (d.opportunityId) find(s, 'opportunities', d.opportunityId);
        s.proposals.unshift({
          ...base(),
          title: required(d.title),
          opportunityId: d.opportunityId || null,
          status: 'draft',
          versions: [{
            number: 1,
            body: required(d.body, 20000),
            createdAt: stamp()
          }],
          activities: []
        });
        break;
      }
    case 'proposal.version':
      {
        const p = find(s, 'proposals', id);
        p.versions.push({
          number: p.versions.length + 1,
          body: required(d.body, 20000),
          createdAt: stamp()
        });
        break;
      }
    case 'proposal.status':
      {
        const p = find(s, 'proposals', id),
          to = command.status;
        const transitions = {
          draft: ['sent', 'withdrawn'],
          sent: ['conversation', 'accepted', 'rejected', 'withdrawn'],
          conversation: ['accepted', 'rejected', 'withdrawn'],
          accepted: [],
          rejected: [],
          withdrawn: []
        };
        if (!transitions[p.status]?.includes(to)) throw new Error('Esta transición no está disponible.');
        if (d.confirmed !== true) throw new Error('Confirma que esta acción ya ocurrió fuera de NAOFUMI.');
        p.activities.push({
          from: p.status,
          to,
          note: required(d.note, 4000),
          createdAt: stamp(),
          version: p.versions.length
        });
        p.status = to;
        break;
      }
    case 'work.add':
      {
        const amount = moneyInput(d.amount);
        s.works.unshift({
          ...base(),
          title: required(d.title),
          status: 'agreed',
          currency: currency(d.currency || 'MXN'),
          amount,
          deadline: dateInput(d.deadline),
          agreements: [{
            number: 1,
            scope: required(d.scope, 4000),
            amount,
            createdAt: stamp()
          }],
          deliverables: [],
          payments: [],
          accepted: false
        });
        break;
      }
    case 'work.agreement':
      {
        const w = find(s, 'works', id),
          amount = moneyInput(d.amount);
        if (w.payments.length && (amount === null || amount < w.payments.reduce((a, p) => a + p.amount, 0))) throw new Error('El acuerdo no puede quedar por debajo de los cobros registrados.');
        w.agreements.push({
          number: w.agreements.length + 1,
          scope: required(d.scope, 4000),
          amount,
          createdAt: stamp()
        });
        w.amount = amount;
        break;
      }
    case 'work.status':
      {
        const w = find(s, 'works', id),
          to = command.status;
        const transitions = {
          agreed: ['in_progress', 'cancelled'],
          in_progress: ['delivered', 'cancelled'],
          delivered: ['in_review', 'finished', 'cancelled'],
          in_review: ['in_progress', 'finished', 'cancelled'],
          finished: [],
          cancelled: []
        };
        if (!transitions[w.status]?.includes(to)) throw new Error('Esta transición no está disponible.');
        if (to === 'delivered' && !w.deliverables.length) throw new Error('Registra al menos un entregable antes de marcar la entrega.');
        if (to === 'finished' && d.accepted !== true) throw new Error('Confirma que el cliente aceptó la entrega.');
        w.status = to;
        if (to === 'finished') w.accepted = true;
        break;
      }
    case 'deliverable.add':
      find(s, 'works', id).deliverables.push({
        ...base(),
        title: required(d.title),
        reference: required(d.reference, 2048)
      });
      break;
    case 'payment.add':
      {
        const w = find(s, 'works', id),
          amount = moneyInput(d.amount);
        if (w.amount === null) throw new Error('Completa primero el importe del acuerdo.');
        if (currency(d.currency) !== w.currency) throw new Error('La moneda debe coincidir con el acuerdo.');
        if (!amount) throw new Error('Registra un importe mayor que cero.');
        if (amount + w.payments.reduce((a, p) => a + p.amount, 0) > w.amount) throw new Error('El cobro supera el saldo pendiente. Revisa el acuerdo.');
        w.payments.push({
          ...base(),
          amount,
          currency: w.currency,
          note: text(d.note) || 'Declarado manualmente',
          date: dateInput(d.date) || stamp().slice(0, 10)
        });
        break;
      }
    case 'action.add':
      s.actions.unshift({
        ...base(),
        title: required(d.title),
        due: dateInput(d.due),
        entityId: d.entityId || null,
        route: text(d.route || '#/missions', 200),
        done: false
      });
      break;
    case 'action.toggle':
      {
        const a = find(s, 'actions', id);
        a.done = !a.done;
        break;
      }
    case 'action.edit': {
      const action=find(s,'actions',id);
      action.revisions ??= [];
      action.revisions.push({createdAt:stamp(),title:action.title,due:action.due});
      action.title=required(d.title);action.due=dateInput(d.due);break;
    }
    case 'profile.save':
      s.profile = {
        ...s.profile,
        name: text(d.name, 100),
        bio: text(d.bio),
        services: text(d.services),
        languages: text(d.languages, 200),
        availability: text(d.availability, 100),
        connects: integerInput(d.connects)
      };
      break;
    case 'skill.add':
      s.profile.skills.push({
        ...base(),
        name: required(d.name),
        evidence: text(d.evidence),
        status: 'declared'
      });
      break;
    case 'skill.edit': {
      const skill=s.profile.skills.find(x=>x.id===id);
      if(!skill)throw new Error('Capacidad no encontrada.');
      skill.revisions ??= [];
      skill.revisions.push({createdAt:stamp(),name:skill.name,evidence:skill.evidence});
      skill.name=required(d.name);skill.evidence=text(d.evidence);break;
    }
    case 'preferences.save':
      if (!['comfortable', 'compact'].includes(d.density)) throw new Error('Densidad inválida.');
      s.preferences = {
        density: d.density,
        reduceMotion: d.reduceMotion === true,
        internalNotifications: d.internalNotifications === true
      };
      break;
    case 'notification.read':
      find(s, 'notifications', id).read = true;
      break;
    case 'notifications.read':
      s.notifications.forEach(n => n.read = true);
      break;
    case 'archive':
    case 'restore':
      {
        if (!['opportunities', 'prospects', 'proposals', 'works', 'actions'].includes(command.collection)) throw new Error('Este registro no puede archivarse.');
        find(s, command.collection, id).archivedAt = command.type === 'archive' ? stamp() : null;
        break;
      }
    default:
      throw new Error('Operación local desconocida.');
  }
  s.audit.unshift({
    id: uid(),
    createdAt: stamp(),
    type: command.type,
    entityId: id || null
  });
  return validateState(s);
}
export function totals(s) {
  const result = {};
  for (const w of s.works) {
    const received = w.payments.reduce((a, p) => a + p.amount, 0);
    const r = result[w.currency] ??= {
      agreed: 0,
      received: 0,
      pending: 0,
      unknown: 0
    };
    r.received += received;
    if (w.amount === null) r.unknown++;else {
      r.agreed += w.amount;
      r.pending += w.amount - received;
    }
  }
  return result;
}
const isString = (v, max = 20000) => typeof v === 'string' && v.length <= max;
const isAmount = v => v === null || Number.isSafeInteger(v) && v >= 0 && v <= 100000000000;
const isRecord = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const isId = v => isString(v, 100) && /^[a-zA-Z0-9_-]+$/.test(v);
const isTimestamp = v => isString(v, 30) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
const isDate = v => v === null || typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(`${v}T12:00:00Z`)) && new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v;
const isList = v => Array.isArray(v) && v.length <= 10000;
const isBase = v => isRecord(v) && isId(v.id) && isTimestamp(v.createdAt) && (v.archivedAt === null || isTimestamp(v.archivedAt));
const isRoute = v => isString(v, 200) && /^#\/[a-z]+(?:\/[a-zA-Z0-9_-]+)?$/.test(v);
const nonempty = (v, max = 200) => isString(v, max) && Boolean(v.trim());
const hasURL = v => {
  if (!isString(v, 2048)) return false;
  try { safeURL(v); return true; } catch { return false; }
};
const profileIsEmpty = p => ['name','bio','services','languages','availability'].every(k => !p[k]) && p.skills.length === 0 && p.connects === null;
export function validateState(s) {
  const fail = () => { throw new Error('El archivo o los datos locales no tienen un formato válido de NAOFUMI. No se modificó nada.'); };
  if (!isRecord(s) || s.version !== 1 || collections.some(k => !isList(s[k])) || !isRecord(s.profile) || !isList(s.profile.skills) || !isRecord(s.preferences)) fail();
  for (const col of collections) {
    const ids = new Set();
    for (const r of s[col]) {
      if (!isRecord(r) || !isId(r.id) || ids.has(r.id) || !isTimestamp(r.createdAt) || col !== 'audit' && !isBase(r)) fail();
      ids.add(r.id);
    }
  }
  for (const o of s.opportunities) {
    if (!nonempty(o.title) || !isString(o.description,4000) || !isString(o.category,100) || !isString(o.source,100) || !isString(o.notes,4000) || !isString(o.requirements,4000) || !isAmount(o.budget) || !currencies.includes(o.currency) || !['review','closed','valid'].includes(o.status) || !['unconfirmed','open','closed'].includes(o.opening) || typeof o.saved !== 'boolean' || !(o.connects === null || Number.isSafeInteger(o.connects) && o.connects >= 0 && o.connects <= 1000000) || !hasURL(o.url) || !isDate(o.publishedAt) || !isDate(o.deadline)) fail();
  }
  for (const p of s.prospects) {
    if (!nonempty(p.title) || !nonempty(p.signal,4000) || !nonempty(p.hypothesis,4000) || !isString(p.nextStep,4000) || !isString(p.category,100) || !isString(p.validation,4000) || !['hypothesis','validating'].includes(p.status) || typeof p.interestConfirmed !== 'boolean' || !hasURL(p.url)) fail();
    if (p.revisions !== undefined && (!isList(p.revisions) || p.revisions.some(v => !isRecord(v) || !isTimestamp(v.createdAt) || !isString(v.title,200) || !isString(v.signal,4000) || !isString(v.hypothesis,4000) || !isString(v.nextStep,4000) || !isString(v.category,100) || !hasURL(v.url)))) fail();
    if (p.validations !== undefined && (!isList(p.validations) || p.validations.some(v => !isRecord(v) || !isTimestamp(v.createdAt) || !isString(v.validation,4000) || typeof v.interestConfirmed !== 'boolean'))) fail();
  }
  for (const p of s.proposals) {
    if (!nonempty(p.title) || !Object.hasOwn(proposalStates,p.status) || !isList(p.versions) || !p.versions.length || p.versions.some((v,i) => !isRecord(v) || v.number !== i + 1 || !nonempty(v.body,20000) || !isTimestamp(v.createdAt)) || !isList(p.activities)) fail();
    if (!(p.opportunityId === null || isId(p.opportunityId) && s.opportunities.some(o => o.id === p.opportunityId))) fail();
    if (p.activities.some(a => !isRecord(a) || !Object.hasOwn(proposalStates,a.from) || !Object.hasOwn(proposalStates,a.to) || !isString(a.note,4000) || !isTimestamp(a.createdAt) || !Number.isInteger(a.version) || a.version < 1 || a.version > p.versions.length)) fail();
  }
  for (const w of s.works) {
    if (!nonempty(w.title) || !Object.hasOwn(workStates,w.status) || !isAmount(w.amount) || !currencies.includes(w.currency) || !isDate(w.deadline) || typeof w.accepted !== 'boolean' || !isList(w.agreements) || !w.agreements.length || !isList(w.deliverables) || !isList(w.payments)) fail();
    if (w.agreements.some((a,i) => !isRecord(a) || a.number !== i + 1 || !nonempty(a.scope,4000) || !isAmount(a.amount) || !isTimestamp(a.createdAt)) || w.amount !== w.agreements.at(-1).amount) fail();
    if (w.deliverables.some(d => !isBase(d) || !nonempty(d.title) || !nonempty(d.reference,2048))) fail();
    if (w.payments.some(p => !isBase(p) || !Number.isSafeInteger(p.amount) || p.amount <= 0 || p.amount > 100000000000 || p.currency !== w.currency || !isString(p.note,4000) || !isDate(p.date) || p.date === null)) fail();
    if (w.payments.reduce((a,p) => a + p.amount,0) > (w.amount ?? 0)) fail();
    if (['delivered','in_review','finished'].includes(w.status) && !w.deliverables.length || w.status === 'finished' && !w.accepted) fail();
  }
  for (const a of s.actions) {
    if (!nonempty(a.title) || typeof a.done !== 'boolean' || !isRoute(a.route) || !isDate(a.due) || !(a.entityId === null || isId(a.entityId))) fail();
    if (a.revisions !== undefined && (!isList(a.revisions) || a.revisions.some(v => !isRecord(v) || !isTimestamp(v.createdAt) || !nonempty(v.title) || !isDate(v.due)))) fail();
  }
  for (const n of s.notifications) if (!nonempty(n.title) || !isString(n.body,4000) || !isRoute(n.route) || typeof n.read !== 'boolean') fail();
  for (const e of s.audit) if (!nonempty(e.type,100) || !(e.entityId === null || isId(e.entityId))) fail();
  for (const key of ['name','bio','services','languages','availability']) if (!isString(s.profile[key],4000)) fail();
  if (!(s.profile.connects === null || Number.isSafeInteger(s.profile.connects) && s.profile.connects >= 0 && s.profile.connects <= 1000000)) fail();
  for (const skill of s.profile.skills) {
    if (!isBase(skill) || !nonempty(skill.name) || !isString(skill.evidence,4000) || skill.status !== 'declared') fail();
    if (skill.revisions !== undefined && (!isList(skill.revisions) || skill.revisions.some(v => !isRecord(v) || !isTimestamp(v.createdAt) || !nonempty(v.name) || !isString(v.evidence,4000)))) fail();
  }
  if (!['comfortable','compact'].includes(s.preferences.density) || typeof s.preferences.reduceMotion !== 'boolean' || typeof s.preferences.internalNotifications !== 'boolean') fail();
  return s;
}
export function mergeBackup(current,incoming) {
  validateState(current);validateState(incoming);
  const s = structuredClone(current);
  const emptyTarget = collections.every(k => s[k].length === 0) && profileIsEmpty(s.profile);
  const incomingProfileEmpty = profileIsEmpty(incoming.profile);
  if (!profileIsEmpty(s.profile) && !incomingProfileEmpty && JSON.stringify(s.profile) !== JSON.stringify(incoming.profile)) throw new Error('El perfil del respaldo difiere del actual. Conservamos el perfil y no importamos nada; revisa las versiones o usa un navegador vacío.');
  for (const col of collections) {
    for (const row of incoming[col]) {
      const existing = s[col].find(x => x.id === row.id);
      if (existing && JSON.stringify(existing) !== JSON.stringify(row)) throw new Error('Hay versiones distintas del mismo registro. Conservamos tus datos; importa en un navegador vacío o revisa el respaldo.');
      if (!existing) s[col].push(structuredClone(row));
    }
  }
  if (profileIsEmpty(s.profile) && !incomingProfileEmpty) s.profile = structuredClone(incoming.profile);
  if (emptyTarget) s.preferences = structuredClone(incoming.preferences);
  return validateState(s);
}
export { active };
