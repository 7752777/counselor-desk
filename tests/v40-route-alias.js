const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

(async () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace('<script defer src="src/core/v4-runtime.js" data-v4-runtime></script>', `<script>${fs.readFileSync(path.join(root, 'src/core/v4-runtime.js'), 'utf8')}</script>`);
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => { if (!/Could not load script/.test(error.message)) process.stderr.write(`${error.message}\n`); });
  const dom = new JSDOM(html, { runScripts:'dangerously', resources:'usable', url:'https://c.local/', pretendToBeVisual:true, virtualConsole });
  await new Promise(resolve => setTimeout(resolve, 700));
  dom.window.CWB.go('photos');
  assert.equal(dom.window.document.querySelector('[data-student-tab="photos"]')?.getAttribute('aria-selected'), 'true');
  dom.window.CWB.go('org');
  assert.ok(dom.window.document.querySelector('[data-workspace-parent="report"][data-workspace-tab="org"]'));
  dom.window.CWB.go('backup');
  assert.ok(dom.window.document.querySelector('[data-workspace-parent="bridge"][data-workspace-tab="backup"]'));
  dom.window.close();
  console.log('PASS v40-route-alias');
})().catch(error => { console.error(error); process.exitCode = 1; });
