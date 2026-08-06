const assert = require('node:assert/strict');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

(async () => {
  const dom = await JSDOM.fromFile(path.join(__dirname, '..', 'output', 'v4-preview.html'), { runScripts:'dangerously', resources:'usable', url:'https://c.local/', virtualConsole:new VirtualConsole(), pretendToBeVisual:true });
  await new Promise(resolve => setTimeout(resolve, 500));
  const backup = dom.window.CWB.backup;
  assert.equal((await backup.configureSchedule({ frequency:'daily' })).retain, 7);
  assert.equal((await backup.configureSchedule({ frequency:'weekly' })).retain, 8);
  assert.equal((await backup.configureSchedule({ frequency:'monthly' })).retain, 12);
  assert.equal((await backup.configureSchedule({ frequency:'daily', retain:0 })).retain, 1);
  assert.equal((await backup.configureSchedule({ frequency:'daily', retain:999 })).retain, 100);
  const webSchedule = await backup.configureSchedule({ frequency:'daily', enabled:true, folder:'C:\\should-not-write' });
  assert.equal(webSchedule.enabled, false);
  assert.equal(webSchedule.folder, '');
  assert.equal(webSchedule.web_manual_only, true);
  const due = await backup.runDueJobs(new Date().toISOString());
  assert.equal(due.due, false);
  assert.equal(due.reason, 'web_manual_only');
  dom.window.close();
  console.log('PASS v40-backup-schedule');
})().catch(error => { console.error(error.stack || error.message); process.exit(1); });
