/** v4 import preview user-flow contract. */
const assert = require('node:assert/strict');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const file = path.join(__dirname, '..', 'index.html');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => { if (!/scrollTo|Not implemented|Could not load/i.test(error.message)) errors.push(error.message); });
  const html = require('node:fs').readFileSync(file, 'utf8').replace('<script defer src="src/core/v4-runtime.js" data-v4-runtime></script>', () => `<script>${require('node:fs').readFileSync(path.join(__dirname, '..', 'src/core/v4-runtime.js'), 'utf8')}</script>`);
  const dom = new JSDOM(html, { runScripts:'dangerously', resources:'usable', url:'https://c.local/', virtualConsole:vc, pretendToBeVisual:true });
  const w = dom.window;
  await sleep(700);
  const d = w.document;
  const before = w.CWB.db.material.length;

  w.CWB.openImportPreview(w.CWB.importer.previewCSV('title,category,content\nPreviewTest,Notice,Body', 'material'));
  await sleep(20);
  const modal = d.querySelector('#modal-root .modal');
  assert.ok(modal, 'preview must open a modal before writing');
  assert.ok(modal.querySelector('[data-import-confirm]'), 'preview must expose confirm control');
  assert.equal(w.CWB.db.material.length, before, 'opening preview must not write data');
  modal.querySelector('[data-import-confirm]').click();
  await sleep(40);
  assert.equal(w.CWB.db.material.length, before + 1, 'only the confirm action may commit previewed rows');

  d.querySelector('[data-view="bridge"]').click();
  await sleep(30);
  assert.ok(d.querySelector('#main .banner'), 'data center must show storage health');
  const undoButton = d.querySelector('[data-act="import-undo"]');
  assert.ok(undoButton, 'a successful import must remain undoable from the data center after refresh/navigation');
  undoButton.click();
  await sleep(10);
  d.querySelector('#modal-root [data-yes]').click();
  await sleep(30);
  assert.equal(w.CWB.db.material.length, before, 'persistent undo control must restore the previous collection snapshot');

  w.CWB.openImportPreview(w.CWB.importer.previewCSV('student_number,full_name,id_card\n0999,Sensitive,110101200001010011', 'students'));
  await sleep(20);
  const sensitiveModal = d.querySelector('#modal-root .modal');
  const confirm = sensitiveModal.querySelector('[data-import-confirm]');
  assert.equal(confirm.disabled, true, 'sensitive preview must start with commit disabled');
  sensitiveModal.querySelector('[data-sensitive-confirm]').click();
  assert.equal(confirm.disabled, false, 'explicit sensitive acknowledgement enables commit');

  assert.deepEqual(errors, []);
  dom.window.close();
  console.log('PASS import-ui');
})().catch(error => { console.error(error.stack || error.message); process.exit(1); });
