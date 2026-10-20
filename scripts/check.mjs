import { readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, {
    withFileTypes: true
  })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(file);else if (/\.(m?js)$/.test(file)) files.push(file);
  }
}
await walk('src');
await walk('scripts');
files.push('server.mjs');
for (const file of files) {
  const run = spawnSync(process.execPath, ['--check', file], {
    encoding: 'utf8'
  });
  if (run.status !== 0) {
    console.error(run.stderr);
    process.exit(1);
  }
}
for (const file of ['index.html', 'styles.css', 'manifest.webmanifest', 'assets/mark.svg', 'assets/journey.svg']) await readFile(file);
const html = await readFile('index.html', 'utf8');
if (/(?:src|href)=["']https?:/i.test(html)) throw new Error('No se admiten recursos externos.');
console.log(`PASS: ${files.length} módulos válidos y recursos locales presentes.`);
