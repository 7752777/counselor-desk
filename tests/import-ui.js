/** v3.9 import preview user-flow contract. */
const assert = require('node:assert/strict');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const file = path.join(__dirname, '..', 'index.html');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => { if (!/scrollTo|Not implemented|Could not load/i.test(error.message)) errors.push(error.message); });
  const dom = await JSDOM.fromFile(file, { runScripts:'dangerously', resources:'usable', url:'https://c.local/', virtualConsole:vc, pretendToBeVisual:true });
  const w = dom.window;
  await sleep(500);
  const d = w.document;
  const before = w.CWB.db.material.length;

  w.CWB.openImportPreview(w.CWB.importer.previewCSV('标题,分类,内容\n预览测试,通知,正文', 'material'));
  await sleep(20);
  const modal = d.querySelector('#modal-root .modal');
  assert.ok(modal, 'preview must open a modal before writing');
  assert.match(modal.textContent, /导入预览/);
  assert.match(modal.textContent, /新增\s*1/);
  assert.equal(w.CWB.db.material.length, before, 'opening preview must not write data');
  modal.querySelector('[data-import-confirm]').click();
  await sleep(20);
  assert.equal(w.CWB.db.material.length, before + 1, 'only the confirm action may commit previewed rows');

  d.querySelector('[data-view="bridge"]').click();
  await sleep(20);
  assert.match(d.querySelector('#main').textContent, /本地存储健康/,
    'data center must show storage health instead of only raw byte usage');
  const undoButton = d.querySelector('[data-act="import-undo"]');
  assert.ok(undoButton, 'a successful import must remain undoable from the data center after refresh/navigation');
  undoButton.click();
  await sleep(10);
  d.querySelector('#modal-root [data-yes]').click();
  await sleep(20);
  assert.equal(w.CWB.db.material.length, before, 'persistent undo control must restore the previous collection snapshot');

  w.CWB.openImportPreview(w.CWB.importer.previewCSV('学号,姓名,身份证号\n0999,敏感测试,110101200001010011', 'students'));
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
