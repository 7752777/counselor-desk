const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('C:/Users/wby/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

function browserExecutable() { return [process.env.CHROME_BIN, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean).find(file => fs.existsSync(file)); }

(async () => {
  const executablePath = browserExecutable();
  if (!executablePath) { console.log('SKIP v40-idb-migration-browser: Chrome/Edge executable not found'); return; }
  const html = fs.readFileSync(path.resolve('output/v4-preview.html'));
  const server = http.createServer((req, res) => { res.writeHead(200, { 'content-type':'text/html; charset=utf-8' }); res.end(req.url === '/seed' ? '<!doctype html><title>seed</title>' : html); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const browser = await chromium.launch({ headless:true, executablePath });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', message => { if (message.type() === 'debug' || message.type() === 'error') console.log('browser', message.type(), message.text()); });
  const url = `http://127.0.0.1:${port}/`;
  await page.goto(`${url}seed`, { waitUntil:'domcontentloaded' });
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('counselor_desk_v4', 1);
      request.onupgradeneeded = () => { const db = request.result; if (!db.objectStoreNames.contains('students')) db.createObjectStore('students', { keyPath:'id' }); if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath:'id' }); };
      request.onsuccess = () => { const db = request.result; const tx = db.transaction('students', 'readwrite'); tx.objectStore('students').put({ id:'legacy-student', student_number:'LEGACY-001', full_name:'迁移测试学生' }); tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error); };
      request.onerror = () => reject(request.error);
    });
  });
  await page.goto(url, { waitUntil:'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.v4Ready === 'true');
  const result = await page.evaluate(async () => { const rows = await window.CWB.repositories.students.list(); const meta = window.CWB.repositories.meta && await window.CWB.repositories.meta.get('migration_v4_latest'); const raw = await new Promise((resolve, reject) => { const req = indexedDB.open('counselor_desk_v4'); req.onsuccess = () => { const db = req.result; const tx = db.transaction(['students','records_students'], 'readonly'); const out = {}; tx.objectStore('students').getAll().onsuccess = e => { out.legacy = e.target.result; }; tx.objectStore('records_students').getAll().onsuccess = e => { out.target = e.target.result; }; tx.oncomplete = () => { db.close(); resolve(out); }; tx.onerror = () => reject(tx.error); }; req.onerror = () => reject(req.error); }); return { found:rows.some(row => row.student_number === 'LEGACY-001'), raw, migrationStatus:meta && meta.status }; });
  console.log('migration sample', result);
  assert.equal(result.found, true);
  assert.ok(!result.migrationStatus || result.migrationStatus === 'completed');
  await context.close(); await browser.close(); await new Promise(resolve => server.close(resolve));
  console.log('PASS v40-idb-migration-browser');
})().catch(error => { console.error(error.stack || error.message); process.exit(1); });
