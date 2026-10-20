import { h, field, area, select, check, amountValue, notice } from './ui.js';
import { categories, currencies, workStates, proposalStates } from './domain.js';
export function formFor(action, s, data = {}) {
  const id = data.id,
    o = s.opportunities.find(x => x.id === id),
    p = s.proposals.find(x => x.id === id),
    w = s.works.find(x => x.id === id),
    prospect=s.prospects.find(x=>x.id===id),
    skill=s.profile.skills.find(x=>x.id===id),
    task=s.actions.find(x=>x.id===id);
  switch (action) {
    case 'new-opportunity':
    case 'edit-opportunity':
      {
        const v = o || {};
        return {
          title: o ? 'Editar encargo' : 'Añadir encargo',
          subtitle: 'Guarda lo que sabes. Lo que falta seguirá por revisar.',
          form: o ? 'opportunity-edit' : 'opportunity-add',
          id,
          submit: 'Guardar encargo',
          body: `${field('Título del encargo', 'title', v.title, {
            required: true,
            placeholder: '¿Qué necesita hacerse?'
          })}${area('Descripción', 'description', v.description)}<div class="form-grid">${select('Área de servicio', 'category', categories, v.category)}${field('Fuente', 'source', v.source, {
            placeholder: 'Referencia o ingreso manual',
            max: 100
          })}</div>${field('Enlace de referencia', 'url', v.url, {
            type: 'url',
            max: 2048,
            help: 'Se guarda sin abrirlo ni consultar su contenido.'
          })}<div class="form-grid">${field('Presupuesto publicado', 'budget', amountValue(v.budget), {
            type: 'number',
            help: 'Vacío = desconocido; cero no se presupone.'
          })}${select('Moneda', 'currency', currencies, v.currency || 'MXN')}</div><div class="form-grid">${field('Costo en connects', 'connects', v.connects ?? '', {
            type: 'number'
          })}${field('Fecha de publicación declarada', 'publishedAt', v.publishedAt, {
            type: 'date'
          })}</div>${field('Vencimiento', 'deadline', v.deadline, {
            type: 'date'
          })}${area('Requisitos', 'requirements', v.requirements)}${area('Notas', 'notes', v.notes)}`
        };
      }
    case 'new-prospect':
    case 'edit-prospect':
      return {
        title: prospect ? 'Editar la señal' : 'Registrar una señal',
        subtitle: 'Distingue lo observado de lo que imaginas.',
        form: prospect ? 'prospect-edit' : 'prospect-add',
        id,
        submit: 'Guardar hipótesis',
        body: `${field('Nombre de la posibilidad', 'title', prospect?.title || '', {
          required: true
        })}${field('Tipo de negocio o área', 'category', prospect?.category || '', {
          placeholder: 'Ej. comercio local'
        })}${area('Señal observada', 'signal', prospect?.signal || '', true)}${area('Hipótesis de mejora', 'hypothesis', prospect?.hypothesis || '', true)}${area('Qué necesitas validar', 'nextStep',prospect?.nextStep || '')}${field('Enlace de referencia', 'url', prospect?.url || '', {
          type: 'url',
          max: 2048
        })}`
      };
    case 'validate-prospect':
      return {
        title: 'Registrar validación',
        subtitle: 'Documenta lo que supiste, sin contactar a nadie desde aquí.',
        form: 'prospect-validate',
        id,
        submit: 'Guardar registro',
        body: `${area('Resultado y evidencia de la validación', 'validation', '', true)}${check('El interés en contratar fue expresado explícitamente', 'interestConfirmed')}`
      };
    case 'new-proposal':
      {
        const opportunity = s.opportunities.find(x => x.id === data.opportunity);
        return {
          title: 'Preparar una propuesta',
          subtitle: 'Un borrador local. Nada se enviará.',
          form: 'proposal-add',
          submit: 'Guardar borrador',
          body: `<input type="hidden" name="opportunityId" value="${h(opportunity?.id || '')}">${field('Nombre de la propuesta', 'title', opportunity?.title || '', {
            required: true
          })}${area('Texto de la propuesta', 'body', '', true, 'Incluye alcance, entregables, límites y preguntas pendientes.')}`
        };
      }
    case 'proposal-status':
      {
        const next = {
          draft: ['sent', 'withdrawn'],
          sent: ['conversation', 'accepted', 'rejected', 'withdrawn'],
          conversation: ['accepted', 'rejected', 'withdrawn'],
          accepted: [],
          rejected: [],
          withdrawn: []
        }[p.status];
        return {
          title: 'Registrar un hecho externo',
          form: 'proposal-status',
          id,
          submit: 'Guardar estado',
          body: next.length ? `${notice('Esta acción solo registra lo que ya ocurrió fuera de NAOFUMI. No envía ni retira propuestas.', 'warning')}${select('Nuevo estado', 'status', next.map(v => [v, proposalStates[v]]))}${area('Qué ocurrió y dónde', 'note', '', true)}${check('Confirmo que este hecho ya ocurrió fuera de la app', 'confirmed')}` : `<p>Esta propuesta está en un estado final. Conservamos su historial. Para una negociación nueva, crea otro borrador.</p>`,
          noSubmit: !next.length
        };
      }
    case 'new-work':
      return {
        title: 'Añadir un trabajo acordado',
        subtitle: 'Registra un acuerdo que ya existe. Aceptar una propuesta no implica un cobro.',
        form: 'work-add',
        submit: 'Crear expediente',
        body: `${field('Nombre del trabajo', 'title', '', {
          required: true
        })}${area('Alcance y criterios acordados', 'scope', '', true)}<div class="form-grid">${field('Importe acordado', 'amount', '', {
          type: 'number'
        })}${select('Moneda', 'currency', currencies, 'MXN')}</div>${field('Fecha de entrega', 'deadline', '', {
          type: 'date'
        })}`
      };
    case 'new-agreement':
      return {
        title: 'Registrar cambio de alcance',
        subtitle: 'El acuerdo anterior quedará conservado. Registra solo cambios ya acordados.',
        form: 'work-agreement',
        id,
        submit: 'Guardar nueva versión',
        body: `${area('Nuevo alcance acordado', 'scope', w.agreements.at(-1).scope, true)}${field(`Nuevo importe (${w.currency})`, 'amount', amountValue(w.amount), {
          type: 'number'
        })}`
      };
    case 'work-status':
      {
        const next = {
          agreed: ['in_progress', 'cancelled'],
          in_progress: ['delivered', 'cancelled'],
          delivered: ['in_review', 'finished', 'cancelled'],
          in_review: ['in_progress', 'finished', 'cancelled'],
          finished: [],
          cancelled: []
        }[w.status];
        return {
          title: 'Actualizar trabajo',
          form: 'work-status',
          id,
          submit: 'Guardar estado',
          body: next.length ? `${select('Nuevo estado', 'status', next.map(v => [v, workStates[v]]))}${check('El cliente aceptó la entrega (necesario para terminar)', 'accepted')}${notice('Entregar o terminar no modifica los cobros.')}` : '<p>El trabajo está en un estado final. Sus acuerdos y cobros se conservan.</p>',
          noSubmit: !next.length
        };
      }
    case 'new-deliverable':
      return {
        title: 'Registrar entregable',
        subtitle: 'Guarda una referencia. No se suben archivos a ningún servicio.',
        form: 'deliverable-add',
        id,
        submit: 'Guardar entregable',
        body: `${field('Nombre del entregable', 'title', '', {
          required: true
        })}${field('Referencia del archivo o entrega', 'reference', '', {
          required: true,
          max: 2048,
          placeholder: 'Nombre de archivo o ubicación'
        })}`
      };
    case 'new-payment':
      return {
        title: 'Registrar un cobro recibido',
        subtitle: 'Solo para dinero efectivamente recibido. No procesa pagos.',
        form: 'payment-add',
        id,
        submit: 'Registrar cobro',
        body: `${field('Importe recibido', 'amount', '', {
          type: 'number',
          required: true
        })}${select('Moneda', 'currency', [w.currency], w.currency)}${field('Fecha de recepción', 'date', '', {
          type: 'date',
          required: true
        })}${area('Referencia o nota de recepción', 'note', '', true)}`
      };
    case 'new-action':
    case 'edit-action':
      return {
        title: task ? 'Editar siguiente paso' : 'Un siguiente paso',
        subtitle: 'Una acción concreta para retomar el camino.',
        form: task ? 'action-edit' : 'action-add',
        id,
        submit: 'Guardar acción',
        body: `${field('Qué harás', 'title', task?.title || '', {
          required: true,
          placeholder: 'Ej. confirmar el alcance'
        })}${field('Fecha opcional', 'due', task?.due || '', {
          type: 'date'
        })}<input type="hidden" name="route" value="${h(location.hash || '#/home')}"><input type="hidden" name="entityId" value="${h(data.entity || '')}">`
      };
    case 'new-skill':
    case 'edit-skill':
      return {
        title: skill ? 'Editar capacidad' : 'Añadir una capacidad',
        subtitle: 'La evidencia puede ser un ejemplo, documento o proyecto. No se verifica automáticamente.',
        form: skill ? 'skill-edit' : 'skill-add',
        id,
        submit: 'Guardar capacidad',
        body: `${field('Capacidad', 'name', skill?.name || '', {
          required: true
        })}${area('Evidencia o ejemplo concreto', 'evidence',skill?.evidence || '')}`
      };
    default:
      return null;
  }
}
