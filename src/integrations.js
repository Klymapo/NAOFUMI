/**
 * Frontera de integración futura. Este módulo NO contiene transporte HTTP,
 * claves, URLs operativas, autenticación simulada ni un interruptor de activación.
 * El molde utiliza exclusivamente store.js. Ver docs/INTEGRACIONES.md.
 *
 * @typedef {Object} EvidenceSnapshot
 * @property {'checked'|'estimated'|'unknown'} dateStatus
 * @property {'open'|'closed'|'unconfirmed'} opening
 * @property {'original'|'partial'|'inaccessible'} access
 * @property {string|null} publishedAt
 * @property {string|null} checkedAt
 * @property {string|null} validUntil
 * @property {string[]} evidenceIds
 *
 * @typedef {Object} SourceObservation
 * @property {string} sourceId
 * @property {string|null} originalId
 * @property {string} originalUrl
 * @property {string} title
 * @property {EvidenceSnapshot} evidence
 * @property {string} observedAt
 * @property {string|null} nextCursor
 */
export class ConnectionsDisabledError extends Error {
  constructor() {
    super('Las conexiones externas están desactivadas en este molde local.');
    this.name = 'ConnectionsDisabledError';
    this.code = 'CONNECTIONS_DISABLED';
  }
}
const unavailable = async () => {
  throw new ConnectionsDisabledError();
};
export const remoteGateway = Object.freeze({
  enabled: false,
  discover: unavailable,
  getDetail: unavailable,
  revalidate: unavailable,
  authenticate: unavailable
});
