import test from 'node:test';
import assert from 'node:assert/strict';
import { remoteGateway, ConnectionsDisabledError } from '../src/integrations.js';
test('todos los puertos remotos rechazan sin realizar solicitudes', async () => {
  let calls = 0;
  const old = globalThis.fetch;
  globalThis.fetch = () => {
    calls++;
    throw new Error('No permitido');
  };
  try {
    for (const method of ['discover', 'getDetail', 'revalidate', 'authenticate']) await assert.rejects(() => remoteGateway[method]({}), ConnectionsDisabledError);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = old;
  }
});
test('el modo remoto no puede habilitarse desde preferencias', () => {
  assert.equal(remoteGateway.enabled, false);
  assert.equal(Object.isFrozen(remoteGateway), true);
  assert.throws(() => {
    remoteGateway.enabled = true;
  });
});
