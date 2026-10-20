import assert from 'node:assert/strict';
const {
  chromium
} = await import(process.env.PLAYWRIGHT_MODULE || '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs');
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox']
});
const page = await browser.newPage({
  viewport: {
    width: 390,
    height: 844
  }
});
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const dialog = () => page.getByRole('dialog');
const submit = async name => dialog().getByRole('button', {
  name,
  exact: true
}).click();
try {
  await page.goto('http://127.0.0.1:4173/#/settings');
  await page.getByRole('button', {
    name: 'Usar mi espacio',
    exact: true
  }).click();
  await page.goto('http://127.0.0.1:4173/#/profile');
  await page.locator('dialog[open], main').getByLabel('Cómo te llamamos').fill('Persona de prueba');
  await page.getByRole('button', {
    name: 'Guardar perfil',
    exact: true
  }).click();
  await page.getByRole('button', {
    name: 'Añadir capacidad',
    exact: true
  }).click();
  await dialog().getByRole('textbox', {
    name: /^Capacidad/
  }).fill('Edición');
  await page.locator('dialog[open], main').getByLabel('Evidencia o ejemplo concreto').fill('Un ejemplo local');
  await submit('Guardar capacidad');
  await page.getByRole('button',{name:'Editar capacidad',exact:true}).click();
  await dialog().getByRole('textbox',{name:/^Capacidad/}).fill('Edición técnica');
  await submit('Guardar capacidad');
  await page.getByText('Edición técnica',{exact:true}).waitFor();
  await page.goto('http://127.0.0.1:4173/#/explore');
  await page.getByRole('button', {
    name: 'Registrar señal',
    exact: true
  }).click();
  await page.locator('dialog[open], main').getByLabel('Nombre de la posibilidad').fill('Observación local');
  await page.locator('dialog[open], main').getByLabel('Señal observada').fill('El proceso está documentado en varios sitios.');
  await page.locator('dialog[open], main').getByLabel('Hipótesis de mejora').fill('Una guía común puede ayudar.');
  await submit('Guardar hipótesis');
  await page.getByRole('button',{name:'Editar señal',exact:true}).click();
  await dialog().getByLabel('Nombre de la posibilidad').fill('Observación ampliada');
  await submit('Guardar hipótesis');
  await page.getByRole('heading',{name:'Observación ampliada',exact:true}).waitFor();
  await page.getByRole('button', {
    name: 'Registrar validación',
    exact: true
  }).click();
  await page.locator('dialog[open], main').getByLabel('Resultado y evidencia de la validación').fill('Todavía falta confirmar el problema.');
  await submit('Guardar registro');
  await page.goto('http://127.0.0.1:4173/#/missions');
  await page.getByRole('tab', {
    name: 'Propuestas',
    exact: true
  }).click();
  await page.getByRole('button', {
    name: 'Crear borrador',
    exact: true
  }).first().click();
  await page.locator('dialog[open], main').getByLabel('Nombre de la propuesta').fill('Propuesta local');
  await page.locator('dialog[open], main').getByLabel('Texto de la propuesta').fill('Primera versión.');
  await submit('Guardar borrador');
  await page.locator('dialog[open], main').getByLabel('Texto de la propuesta').fill('Segunda versión.');
  await page.getByRole('button', {
    name: 'Guardar nueva versión',
    exact: true
  }).click();
  assert.equal(await page.locator('.version-item').count(), 2);
  await page.getByRole('button', {
    name: 'Actualizar estado',
    exact: true
  }).click();
  await page.locator('dialog[open], main').getByLabel('Nuevo estado', {
    exact: true
  }).selectOption('sent');
  await page.locator('dialog[open], main').getByLabel('Qué ocurrió y dónde').fill('Envío de prueba declarado.');
  await submit('Guardar estado');
  await dialog().getByRole('alert').getByText('Confirma que esta acción ya ocurrió fuera de NAOFUMI.').waitFor();
  await page.locator('dialog[open], main').getByLabel('Confirmo que este hecho ya ocurrió fuera de la app').check();
  await submit('Guardar estado');
  await page.goto('http://127.0.0.1:4173/#/missions');
  await page.getByRole('tab', {
    name: 'En curso',
    exact: true
  }).click();
  await page.getByRole('button', {
    name: 'Añadir trabajo',
    exact: true
  }).first().click();
  await page.locator('dialog[open], main').getByLabel('Nombre del trabajo').fill('Trabajo local');
  await page.locator('dialog[open], main').getByLabel('Alcance y criterios acordados').fill('Una guía de cinco páginas.');
  await page.locator('dialog[open], main').getByLabel('Importe acordado').fill('100');
  await submit('Crear expediente');
  await page.getByRole('button', {
    name: 'Cambiar estado',
    exact: true
  }).click();
  await page.locator('dialog[open], main').getByLabel('Nuevo estado').selectOption('in_progress');
  await submit('Guardar estado');
  await page.getByRole('button', {
    name: 'Registrar entregable',
    exact: true
  }).click();
  await page.locator('dialog[open], main').getByLabel('Nombre del entregable').fill('Guía');
  await page.locator('dialog[open], main').getByLabel('Referencia del archivo o entrega').fill('guia.pdf');
  await submit('Guardar entregable');
  await page.getByRole('button', {
    name: 'Cambiar estado',
    exact: true
  }).click();
  await page.locator('dialog[open], main').getByLabel('Nuevo estado').selectOption('delivered');
  await submit('Guardar estado');
  await page.getByRole('button', {
    name: 'Registrar cobro',
    exact: true
  }).click();
  await page.locator('dialog[open], main').getByLabel('Importe recibido').fill('25');
  await page.locator('dialog[open], main').getByLabel('Fecha de recepción').fill('2026-10-19');
  await page.locator('dialog[open], main').getByLabel('Referencia o nota de recepción').fill('Ejemplo de recibo local');
  await submit('Registrar cobro');
  await page.getByText('$75.00 MXN', {
    exact: true
  }).waitFor();
  await page.goto('http://127.0.0.1:4173/#/board');
  await page.getByRole('button', {
    name: 'Añadir encargo',
    exact: true
  }).first().click();
  await page.locator('dialog[open], main').getByLabel('Título del encargo').fill('<img src=x onerror=alert(1)>');
  await submit('Guardar encargo');
  assert.equal(await page.locator('main img[src="x"]').count(), 0);
  await page.getByRole('heading', {
    name: '<img src=x onerror=alert(1)>',
    exact: true
  }).waitFor();
  await page.goto('http://127.0.0.1:4173/#/settings');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('main').getByRole('button', {
    name: 'Exportar copia',
    exact: true
  }).click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /^NAOFUMI_personal_/);
  const restored = await browser.newPage();
  await restored.goto('http://127.0.0.1:4173/#/settings');
  await restored.getByRole('button',{name:'Usar mi espacio',exact:true}).click();
  await restored.goto('http://127.0.0.1:4173/#/settings');
  await restored.locator('#import-file').setInputFiles(await download.path());
  await restored.getByText('Copia incorporada sin reemplazar tus registros.',{exact:true}).waitFor();
  assert.equal(await restored.evaluate(()=>JSON.parse(localStorage.getItem('naofumi.local.v1.personal')).profile.name),'Persona de prueba');
  assert.equal(await restored.evaluate(()=>JSON.parse(localStorage.getItem('naofumi.local.v1.personal')).works[0].payments[0].amount),2500);
  await restored.close();
  await page.goto('http://127.0.0.1:4173/#/states');
  for (const name of ['Carga', 'Vacío', 'Error', 'Acceso', 'Sin internet', 'Fuente caída', 'Cerrada']) await page.getByRole('button', {
    name,
    exact: true
  }).click();
  await page.getByRole('button', {
    name: 'Buscar en mi espacio',
    exact: true
  }).click();
  await page.locator('dialog[open], main').getByLabel('Buscar en todos los expedientes').fill('Trabajo local');
  await page.getByRole('link', {
    name: /Trabajo local/
  }).click();
  await page.getByRole('heading', {
    name: 'Trabajo local',
    exact: true
  }).waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS flujos: perfil, capacidades, exploración, propuestas versionadas, guardas de envío, entregables, cobros, XSS, exportación, estados y búsqueda.');
} finally {
  await browser.close();
}
