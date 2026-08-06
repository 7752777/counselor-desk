const assert = require('node:assert/strict');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

(async () => {
  const dom = await JSDOM.fromFile(path.join(__dirname, '..', 'output', 'v4-preview.html'), { runScripts:'dangerously', resources:'usable', url:'https://c.local/', virtualConsole:new VirtualConsole(), pretendToBeVisual:true });
  await new Promise(resolve => setTimeout(resolve, 500));
  const { window } = dom;
  window.CWB.db.custom.v4_files = [{ id:'file-history', title:'当前文件', version:2, versions:[{ version:1, name:'旧文件', content:'old' }, { version:2, name:'当前文件', content:'new' }] }];
  window.CWB.go('files');
  const rollback = window.document.querySelector('[data-act="v4-file-rollback"]');
  assert.ok(rollback, 'versioned file should expose rollback action');
  rollback.click();
  const select = window.document.querySelector('[data-v4-file-rollback-select]');
  assert.ok(select);
  select.value = '1';
  window.document.querySelector('[data-v4-file-rollback-go]').click();
  await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(window.CWB.db.custom.v4_files[0].version, 1);
  assert.equal(window.CWB.db.custom.v4_files[0].title, '旧文件');
  dom.window.close();
  console.log('PASS v40-files');
})().catch(error => { console.error(error.stack || error.message); process.exit(1); });
