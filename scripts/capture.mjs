import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/opt/codex/cua_node/lib/node_modules/playwright/index.mjs');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
await mkdir('artifacts',{recursive:true});
try {
  const desktop=await browser.newPage({viewport:{width:1440,height:1000}});
  await desktop.goto('http://127.0.0.1:4173/#/home');
  await desktop.locator('main h1').waitFor();
  await desktop.screenshot({path:'artifacts/preview-desktop.png',fullPage:true});
  await desktop.goto('http://127.0.0.1:4173/#/board');
  await desktop.locator('main h1').waitFor();
  await desktop.screenshot({path:'artifacts/preview-tablon.png',fullPage:true});
  const mobile=await browser.newPage({viewport:{width:390,height:844}});
  await mobile.goto('http://127.0.0.1:4173/#/home');
  await mobile.locator('main h1').waitFor();
  await mobile.screenshot({path:'artifacts/preview-mobile.png',fullPage:true});
  await mobile.goto('http://127.0.0.1:4173/#/explore');
  await mobile.locator('main h1').waitFor();
  await mobile.screenshot({path:'artifacts/preview-explorar.png',fullPage:true});
  console.log('Capturas limpias generadas con escenarios ficticios, sin datos personales.');
} finally {await browser.close();}
