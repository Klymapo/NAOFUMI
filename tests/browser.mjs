import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const modulePath = process.env.PLAYWRIGHT_MODULE || '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
const {
  chromium
} = await import(modulePath);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox']
});
const page = await browser.newPage({
  viewport: {
    width: 1440,
    height: 1000
  }
});
const errors = [],
  external = [];
page.on('pageerror', e => errors.push(e.message));
page.on('request', r => {
  if (!r.url().startsWith('http://127.0.0.1:4173') && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) external.push(r.url());
});
await mkdir('artifacts', {
  recursive: true
});
try {
  await page.goto('http://127.0.0.1:4173');
  await page.getByRole('heading', {
    level: 1,
    name: 'Tu próxima aventura empieza aquí.'
  }).waitFor();
  await page.screenshot({
    path: 'artifacts/hoy-desktop.png',
    fullPage: true
  });
  await page.getByRole('link', {
    name: 'Tablón',
    exact: true
  }).first().click();
  await page.getByRole('heading', {
    level: 1,
    name: 'Tablón de encargos'
  }).waitFor();
  await page.getByRole('button', {
    name: 'Añadir encargo',
    exact: true
  }).first().click();
  await page.getByLabel('Título del encargo').fill('Prueba local persistente');
  await page.getByRole('dialog').getByRole('button', {
    name: 'Guardar encargo',
    exact: true
  }).click();
  await page.getByRole('heading', {
    name: 'Prueba local persistente'
  }).waitFor();
  await page.reload();
  await page.getByRole('heading', {
    name: 'Prueba local persistente'
  }).waitFor();
  await page.getByRole('button', {
    name: 'Archivar',
    exact: true
  }).click();
  await page.getByRole('button', {
    name: 'Deshacer',
    exact: true
  }).click();
  await page.getByRole('heading', {
    name: 'Prueba local persistente'
  }).waitFor();
  await page.goto('http://127.0.0.1:4173/#/settings');
  await page.getByRole('button', {
    name: 'Usar mi espacio',
    exact: true
  }).click();
  assert.equal(await page.locator('.opportunity-card').count(), 0);
  for (const width of [360, 430]) {
    await page.setViewportSize({
      width,
      height: 900
    });
    for (const route of ['home', 'board', 'explore', 'missions', 'profile', 'settings', 'sources', 'states']) {
      await page.goto(`http://127.0.0.1:4173/#/${route}`);
      await page.locator('main h1').waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `overflow ${route} ${width}`);
    }
  }
  await page.goto('http://127.0.0.1:4173/#/settings');
  await page.getByRole('button', {
    name: 'Explorar ejemplos',
    exact: true
  }).click();
  await page.goto('http://127.0.0.1:4173/#/home');
  await page.screenshot({
    path: 'artifacts/hoy-mobile.png',
    fullPage: true
  });
  await page.getByRole('button', {
    name: 'Notificaciones',
    exact: true
  }).click();
  assert.equal(await page.locator('dialog[open]').count(), 1);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog[open]').count(), 0);
  assert.deepEqual(external, []);
  assert.deepEqual(errors, []);
  console.log('PASS navegador: navegación, ingreso, persistencia, archivo/deshacer, separación, modales, 360/430px y cero solicitudes externas.');
} finally {
  await browser.close();
}
