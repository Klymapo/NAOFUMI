import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/opt/codex/cua_node/lib/node_modules/playwright/index.mjs');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage();
const findings=[];
try {
 for(const width of [360,430,1440]){
  await page.setViewportSize({width,height:900});
  for(const route of ['home','board','explore','missions','profile','settings','sources','states','help']){
   await page.goto(`http://127.0.0.1:4173/#/${route}`);await page.locator('main h1').waitFor();
   const result=await page.evaluate(()=>{
    const visible=el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden';};
    const rgb=v=>(v.match(/[\d.]+/g)||[]).map(Number);
    const blend=(fg,bg)=>fg.slice(0,3).map((n,i)=>n*(fg[3]??1)+bg[i]*(1-(fg[3]??1)));
    const lum=c=>c.map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((a,n,i)=>a+n*[.2126,.7152,.0722][i],0);
    const output=[];
    for(const el of document.querySelectorAll('body *')){
     if(!visible(el)||!['BUTTON','A','SPAN','P','LABEL','STRONG','SMALL','H1','H2','H3','SUMMARY'].includes(el.tagName)||!Array.from(el.childNodes).some(n=>n.nodeType===3&&n.textContent.trim()))continue;
     const css=getComputedStyle(el);if(css.color==='transparent')continue;
     let bg=[255,255,255];const ancestors=[];for(let p=el;p;p=p.parentElement)ancestors.push(p);
     for(const p of ancestors.reverse())bg=blend(rgb(getComputedStyle(p).backgroundColor),bg);
     const fg=blend(rgb(css.color),bg),a=lum(fg),b=lum(bg),contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
     const minimum=parseFloat(css.fontSize)>=24||(parseFloat(css.fontSize)>=18.66&&parseInt(css.fontWeight)>=700)?3:4.5;
     if(contrast+.01<minimum)output.push({kind:'contrast',selector:`${el.tagName.toLowerCase()}.${el.className}`,text:el.textContent.trim().slice(0,70),ratio:Math.round(contrast*100)/100,minimum});
    }
    for(const b of document.querySelectorAll('button'))if(visible(b)){const r=b.getBoundingClientRect();if(r.width<43.5||r.height<43.5)output.push({kind:'target',text:b.textContent.trim()||b.getAttribute('aria-label'),width:r.width,height:r.height});}
    if(document.documentElement.scrollWidth>innerWidth)output.push({kind:'overflow',width:document.documentElement.scrollWidth});
    return output;
   });
   findings.push(...result.map(f=>({route,width,...f})));
  }
 }
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/accessibility.json',JSON.stringify(findings,null,2));
 console.log(JSON.stringify(findings.slice(0,25),null,2));
 assert.equal(findings.length,0,`${findings.length} comprobaciones de contraste, controles o desbordamiento requieren revisión`);
 console.log('PASS: contraste de texto con fondos sólidos, botones de 44px y ausencia de desbordamiento en 9 pantallas a 360/430/1440px. No sustituye una auditoría WCAG completa.');
} finally {await browser.close();}
