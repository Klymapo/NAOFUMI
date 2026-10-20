import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, reduce, validateState, totals, mergeBackup } from '../src/domain.js';
import { createStore } from '../src/store.js';
test('ingreso manual desconocido nunca verifica ni inventa presupuesto', () => {
  const state = reduce(createState(), {
    type: 'opportunity.add',
    data: {
      title: 'Organizar registros',
      category: 'Datos'
    }
  });
  assert.equal(state.opportunities[0].status, 'review');
  assert.equal(state.opportunities[0].budget, null);
  assert.equal(state.opportunities[0].publishedAt, null);
  assert.equal(state.opportunities[0].opening, 'unconfirmed');
});
test('archivo conserva y restauración devuelve el expediente sin verificarlo', () => {
  let s = reduce(createState(), {
    type: 'opportunity.add',
    data: {
      title: 'Documentación'
    }
  });
  const id = s.opportunities[0].id;
  s = reduce(s, {
    type: 'archive',
    collection: 'opportunities',
    id
  });
  assert.ok(s.opportunities[0].archivedAt);
  s = reduce(s, {
    type: 'restore',
    collection: 'opportunities',
    id
  });
  assert.equal(s.opportunities[0].archivedAt, null);
  assert.equal(s.opportunities[0].status, 'review');
});
test('rechaza título vacío, URL ejecutable e importe inválido', () => {
  for (const data of [{
    title: ' '
  }, {
    title: 'x',
    url: 'javascript:alert(1)'
  }, {
    title: 'x',
    budget: '-2'
  }, {
    title: 'x',
    budget: '12.345'
  }]) {
    assert.throws(() => reduce(createState(), {
      type: 'opportunity.add',
      data
    }));
  }
});
test('cobros reales independientes del estado de trabajo y separados por moneda', () => {
  let s = createState();
  s = reduce(s, {
    type: 'work.add',
    data: {
      title: 'Manual',
      amount: '100',
      currency: 'MXN',
      scope: 'Cinco páginas'
    }
  });
  const id = s.works[0].id;
  s = reduce(s, {
    type: 'work.status',
    id,
    status: 'in_progress'
  });
  assert.throws(() => reduce(s, {
    type: 'work.status',
    id,
    status: 'delivered'
  }));
  s = reduce(s, {
    type: 'deliverable.add',
    id,
    data: {
      title: 'Manual',
      reference: 'archivo-local.pdf'
    }
  });
  s = reduce(s, {
    type: 'work.status',
    id,
    status: 'delivered'
  });
  assert.equal(totals(s).MXN.received, 0);
  assert.throws(() => reduce(s, {
    type: 'payment.add',
    id,
    data: {
      amount: '20',
      currency: 'USD'
    }
  }));
  s = reduce(s, {
    type: 'payment.add',
    id,
    data: {
      amount: '20',
      currency: 'MXN'
    }
  });
  assert.equal(totals(s).MXN.received, 2000);
  assert.equal(totals(s).MXN.pending, 8000);
});
test('editar propuesta crea versión y nunca envía', () => {
  let s = reduce(createState(), {
    type: 'proposal.add',
    data: {
      title: 'Propuesta',
      body: 'Alcance inicial'
    }
  });
  s = reduce(s, {
    type: 'proposal.version',
    id: s.proposals[0].id,
    data: {
      body: 'Alcance revisado'
    }
  });
  assert.equal(s.proposals[0].versions.length, 2);
  assert.equal(s.proposals[0].status, 'draft');
});
test('datos importados inválidos no se aceptan', () => {
  assert.throws(() => validateState({
    version: 1,
    opportunities: []
  }));
  const s = createState();
  s.opportunities.push({
    id: 'x',
    title: '<script>'
  });
  assert.throws(() => validateState(s));
});
const memory = () => {
  const m = new Map();
  return {
    getItem: k => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, v)
  };
};
test('espacio personal y ejemplos no se mezclan y persisten al recargar', () => {
  const storage = memory(),
    store = createStore(storage);
  store.switchSpace('personal');
  store.dispatch({
    type: 'opportunity.add',
    data: {
      title: 'Solo mía'
    }
  });
  store.switchSpace('demo');
  assert.ok(!store.getState().opportunities.some(x => x.title === 'Solo mía'));
  const reopened = createStore(storage);
  reopened.switchSpace('personal');
  assert.equal(reopened.getState().opportunities[0].title, 'Solo mía');
});
test('cuota de almacenamiento no confirma cambios ni pierde datos previos', () => {
  const storage = memory(),
    store = createStore(storage);
  store.switchSpace('personal');
  storage.setItem = () => {
    throw new Error('QuotaExceededError');
  };
  assert.throws(() => store.dispatch({
    type: 'opportunity.add',
    data: {
      title: 'No guardada'
    }
  }));
  assert.equal(store.getState().opportunities.length, 0);
});
test('una pestaña desactualizada no sobrescribe registros de otra pestaña', () => {
  const storage = memory(),
    a = createStore(storage);
  a.switchSpace('personal');
  const b = createStore(storage);
  b.switchSpace('personal');
  a.dispatch({
    type: 'opportunity.add',
    data: {
      title: 'Cambio en A'
    }
  });
  assert.throws(() => b.dispatch({
    type: 'opportunity.add',
    data: {
      title: 'Cambio en B'
    }
  }), /otra pestaña/);
  const fresh = createStore(storage);
  fresh.switchSpace('personal');
  assert.deepEqual(fresh.getState().opportunities.map(o => o.title), ['Cambio en A']);
});
test('importación vacía e inválida conserva estado; copia válida es idempotente', () => {
  const store = createStore(memory());
  store.switchSpace('personal');
  store.dispatch({
    type: 'opportunity.add',
    data: {
      title: 'Original'
    }
  });
  assert.throws(() => store.import('null'));
  assert.equal(store.getState().opportunities.length, 1);
  const copy = store.export();
  store.import(copy);
  store.import(copy);
  assert.equal(store.getState().opportunities.length, 1);
});

test('respaldo rechaza HTML en versiones y fechas internas inválidas', () => {
  const original = reduce(createState(), {type:'work.add',data:{title:'Guía',scope:'Cinco páginas',amount:'100'}});
  for (const mutate of [
    s => s.works[0].agreements[0].number = '<img src=x onerror=alert(1)>',
    s => s.works[0].agreements[0].createdAt = 'not-a-date',
    s => s.works[0].createdAt = 'not-a-date',
    s => s.works[0].payments.push({amount:1,currency:'MXN',note:'Recibo',date:'not-a-date'}),
  ]) {
    const state = structuredClone(original);mutate(state);
    assert.throws(() => validateState(state));
  }
});
test('importación conserva perfil existente sin nombre y rechaza perfil distinto', () => {
  const current = createState();current.profile.bio='Mi experiencia';current.profile.services='Documentación';
  const merged=mergeBackup(current,createState());
  assert.equal(merged.profile.bio,'Mi experiencia');
  assert.equal(merged.profile.services,'Documentación');
  const incoming=createState();incoming.profile.services='Otro catálogo';
  assert.throws(()=>mergeBackup(current,incoming),/perfil/i);
});
test('corregir capacidades, señales y acciones conserva versiones anteriores', () => {
  let s=reduce(createState(),{type:'skill.add',data:{name:'Edición',evidence:'Primer ejemplo'}});
  const skillId=s.profile.skills[0].id;
  s=reduce(s,{type:'skill.edit',id:skillId,data:{name:'Edición técnica',evidence:'Ejemplo ampliado'}});
  assert.equal(s.profile.skills[0].revisions[0].name,'Edición');
  s=reduce(s,{type:'prospect.add',data:{title:'Señal',signal:'Hecho observado',hypothesis:'Suposición'}});
  const prospectId=s.prospects[0].id;
  s=reduce(s,{type:'prospect.edit',id:prospectId,data:{title:'Señal ampliada',signal:'Hecho con contexto',hypothesis:'Hipótesis más precisa'}});
  assert.equal(s.prospects[0].revisions[0].title,'Señal');
  s=reduce(s,{type:'action.add',data:{title:'Preguntar alcance'}});
  const actionId=s.actions[0].id;
  s=reduce(s,{type:'action.edit',id:actionId,data:{title:'Confirmar alcance por escrito',due:'2026-10-21'}});
  assert.equal(s.actions[0].revisions[0].title,'Preguntar alcance');
  assert.equal(s.actions[0].due,'2026-10-21');
});
