const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('C:/Users/wby/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const executablePath = process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN) ? process.env.CHROME_BIN : 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  if (!fs.existsSync(executablePath)) { console.log('SKIP v40-portable-attachments: Chrome not found'); return; }
  const browser = await chromium.launch({ headless:true, executablePath });
  const page = await browser.newPage();
  await page.goto(`file://${path.resolve('output/v4-preview.html').replace(/\\/g, '/')}`, { waitUntil:'domcontentloaded', timeout:60000 });
  await page.waitForFunction(() => document.documentElement.dataset.v4Ready === 'true');
  await page.evaluate(async () => {
    await window.CWB.attachments.add({ id:'portable-attachment', name:'portable.txt', student_id:'portable-student', blob:new Blob(['portable-content'], { type:'text/plain' }) });
  });
  const html = await page.evaluate(async () => (await window.CWB.buildPortableHtml()).html);
  const match = html.match(/window\.__CWB_EMBED__=([\s\S]*?)<\/script>/);
  assert.ok(match, 'portable HTML must contain embedded data');
  const data = JSON.parse(match[1]);
  assert.ok(Array.isArray(data.attachments));
  assert.equal(data.attachments.length, 1);
  assert.equal(data.attachments[0].data_base64, Buffer.from('portable-content').toString('base64'));
  await browser.close();
  console.log('PASS v40-portable-attachments');
})().catch(error => { console.error(error.stack || error.message); process.exit(1); });
