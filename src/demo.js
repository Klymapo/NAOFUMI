import { createState, reduce } from './domain.js';
export function createDemo() {
  let s = createState();
  const run = (type, data, extra = {}) => {
    s = reduce(s, {
      type,
      data,
      ...extra
    });
  };
  const date = days => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };
  [{
    title: 'Dar claridad a un inventario',
    description: 'Una pequeña librería busca ordenar sus existencias y simplificar el registro de entradas. Este es un encargo ficticio para explorar la interfaz.',
    category: 'Datos y Excel',
    source: 'Ejemplo de ingreso manual',
    budget: '2400',
    currency: 'MXN',
    publishedAt: date(-1),
    deadline: date(5),
    requirements: 'Excel · Organización de datos · Documentación',
    notes: 'Confirmar número de productos y formato de los archivos.'
  }, {
    title: 'Un manual que sí se entienda',
    description: 'Reorganizar un manual de bienvenida en una guía breve y fácil de consultar. Datos ficticios; no es una oferta real.',
    category: 'Redacción y edición',
    source: 'Ejemplo de comunidad',
    budget: '180',
    currency: 'USD',
    publishedAt: date(-2),
    requirements: 'Redacción · Edición · Síntesis'
  }, {
    title: 'Menos tareas repetitivas',
    description: 'Explorar una automatización del registro semanal de pedidos. Ejemplo sin acceso a un negocio real.',
    category: 'Automatización',
    source: 'Ejemplo de referencia',
    requirements: 'Automatización · Mapeo de procesos'
  }, {
    title: 'Investigar para decidir mejor',
    description: 'Organizar fuentes públicas en un informe comparativo. Escenario ficticio de investigación.',
    category: 'Investigación',
    source: 'Ejemplo de tablón',
    budget: '3200',
    currency: 'MXN',
    publishedAt: date(-3),
    requirements: 'Investigación · Fuentes · Documentación'
  }].forEach(d => run('opportunity.add', d));
  s.opportunities[0].saved = true;
  s.opportunities[3].saved = true;
  run('prospect.add', {
    title: 'Una panadería, muchas conversaciones',
    signal: 'En este ejemplo, los pedidos llegan por distintos chats.',
    hypothesis: 'Un registro común podría ayudar a visualizar los pedidos. Falta confirmar si existe un problema.',
    nextStep: 'Preguntar cómo se organizan hoy, solo con autorización.',
    category: 'Comercio local'
  });
  run('prospect.add', {
    title: 'Conocimiento que merece orden',
    signal: 'Un equipo ficticio tiene instrucciones repartidas entre documentos.',
    hypothesis: 'Una guía breve podría facilitar el ingreso de nuevas personas.',
    nextStep: 'Validar qué información cuesta encontrar.',
    category: 'Documentación'
  });
  run('proposal.add', {
    title: 'Guía de bienvenida',
    body: 'Hola. Propongo organizar el material en una guía clara de cinco secciones.\n\nAlcance por confirmar: materiales, extensión y una ronda de revisión.\n\nEste texto es un ejemplo y no se ha enviado.'
  });
  run('work.add', {
    title: 'Guía para un pequeño equipo',
    scope: 'Ejemplo: guía de cinco páginas, estructura y una ronda de revisión.',
    amount: '1800',
    currency: 'MXN',
    deadline: date(3)
  });
  run('work.status', {}, {
    id: s.works[0].id,
    status: 'in_progress'
  });
  run('action.add', {
    title: 'Aclarar el alcance de la guía',
    due: date(0),
    route: `#/work/${s.works[0].id}`
  });
  run('action.add', {
    title: 'Revisar las condiciones del inventario',
    due: date(1),
    route: `#/opportunity/${s.opportunities[3].id}`
  });
  s.notifications = [{
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    archivedAt: null,
    title: 'Tu gremio, listo para explorar',
    body: 'Estás en Ejemplos. Cambia a Mi espacio cuando quieras empezar con tus datos.',
    route: '#/settings',
    read: false
  }];
  return s;
}
