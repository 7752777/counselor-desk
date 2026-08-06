/** Real-browser v4 storage contract. Requires Chrome/Edge on Windows. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/wby/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

function browserExecutable() {
  const candidates = [
    process.env.CHROME_BIN,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].filter(Boolean);
  return candidates.find(file => fs.existsSync(file));
}

(async () => {
  const executablePath = browserExecutable();
  if (!executablePath) {
    console.log('SKIP v40-browser-storage: Chrome/Edge executable not found');
    return;
  }
  const browser = await chromium.launch({ headless: true, executablePath });
  const page = await browser.newPage();
  await page.goto(`file://${path.resolve('output/v4-preview.html').replace(/\\/g, '/')}`);
  await page.waitForTimeout(1800);
  const result = await page.evaluate(async () => {
    const repoResults = {};
    for (const [name, repository] of Object.entries(window.CWB.repositories || {})) {
      try {
        const id = `browser_probe_${name}`;
        await repository.put({ id, title: 'browser probe', schema_version: 7, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        repoResults[name] = await repository.count();
        await repository.delete(id);
      } catch (error) {
        repoResults[name] = `${error.name}:${error.message}`;
      }
    }
    let backup = { ok: false };
    try {
      const envelope = await window.CWB.backup.export('browser-test-password');
      backup = { ok: true, version: envelope.version };
    } catch (error) {
      backup = { ok: false, error: `${error.name}:${error.message}` };
    }
    const attachmentChecks = {};
    try {
      const first = await window.CWB.attachments.add({ id:'browser-attachment-one', name:'probe.txt', blob:new Blob(['same-content'], { type:'text/plain' }), student_id:'browser-student' });
      const duplicate = await window.CWB.attachments.add({ id:'browser-attachment-two', name:'duplicate.txt', blob:new Blob(['same-content'], { type:'text/plain' }), student_id:'browser-student' });
      const thumb = await window.CWB.attachments.createThumbnail(first.blob);
      const found = await window.CWB.attachments.findDuplicate(first.content_hash);
      const downloaded = await window.CWB.attachments.download(first.id, 'probe.txt');
      attachmentChecks.deduped = duplicate.id === first.id;
      attachmentChecks.thumbnailId = !first.thumbnail_id || typeof first.thumbnail_id === 'string';
      attachmentChecks.thumbnail = thumb && thumb.size === first.size;
      attachmentChecks.found = found && found.id === first.id;
      attachmentChecks.downloaded = downloaded === true;
      await window.CWB.attachments.delete(first.id);
    } catch (error) { attachmentChecks.error = `${error.name}:${error.message}`; }
    return {
      ready: document.documentElement.dataset.v4Ready === 'true',
      chartsReady: !!window.echarts && !!document.querySelector('#v4-trend-chart') && !!document.querySelector('#v4-donut-chart'),
      repoResults,
      attachmentMethods: ['batchImport', 'createThumbnail', 'findDuplicate', 'download', 'delete', 'list', 'get'].filter(name => typeof window.CWB.attachments?.[name] === 'function'),
      attachmentChecks,
      backup,
    };
  });
  await browser.close();
  assert.equal(result.ready, true);
  assert.equal(result.chartsReady, true);
  for (const [name, value] of Object.entries(result.repoResults)) {
    assert.equal(typeof value, 'number', `${name} repository failed: ${value}`);
  }
  assert.deepEqual(result.attachmentMethods, ['batchImport', 'createThumbnail', 'findDuplicate', 'download', 'delete', 'list', 'get']);
  assert.deepEqual(result.attachmentChecks, { deduped:true, thumbnailId:true, thumbnail:true, found:true, downloaded:true });
  assert.deepEqual(result.backup, { ok: true, version: 7 });
  console.log('PASS v40-browser-storage');
})().catch(error => { console.error(error.stack || error.message); process.exit(1); });
