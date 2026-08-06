/** Real-browser import performance gate. Measures progress cadence and event-loop stalls. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/wby/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

function browserExecutable() {
  return [process.env.CHROME_BIN, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
    .filter(Boolean).find(file => fs.existsSync(file));
}

(async () => {
  const executablePath = browserExecutable();
  if (!executablePath) { console.log('SKIP v40-performance-browser: Chrome/Edge executable not found'); return; }
  const browser = await chromium.launch({ headless:true, executablePath });
  const page = await browser.newPage();
  await page.goto(`file://${path.resolve('output/v4-preview.html').replace(/\\/g, '/')}`);
  await page.waitForFunction(() => document.documentElement.dataset.v4Ready === 'true');
  const result = await page.evaluate(async () => {
    const progress = [];
    const eventGaps = [];
    let lastTick = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      eventGaps.push(now - lastTick);
      lastTick = now;
    }, 10);
    const rows = Array.from({ length:10000 }, (_, index) => ({
      student_number:`PERF-${index}`,
      full_name:`性能测试${index}`,
      class_name:`性能测试班${index % 20}`,
      dorm:`${index % 100 + 1}-${index % 6 + 1}`,
      custom_fields:{ source:'browser-performance-gate' },
    }));
    const started = performance.now();
    const result = await window.CWB.importer.start({ collection:'students', rows, chunkSize:500, fileHash:'browser-performance-gate-v1', onProgress:item => progress.push({ status:item.status, processed:item.processed, at:performance.now() }) });
    const elapsed = performance.now() - started;
    clearInterval(timer);
    const progressGaps = progress.slice(1).map((item, index) => item.at - progress[index].at);
    const maxEventLoopGap = Math.max(0, ...eventGaps);
    return {
      status:result.status,
      elapsed,
      progressCount:progress.length,
      maxProgressGap:Math.max(0, ...progressGaps),
      maxEventLoopGap,
      maxEventLoopAt:eventGaps.indexOf(maxEventLoopGap),
      progressAt:progress.map(item => Math.round(item.at - started)),
      processed:progress.at(-1)?.processed || 0,
    };
  });
  await page.reload({ waitUntil:'domcontentloaded', timeout:60000 });
  await page.waitForFunction(() => document.documentElement.dataset.v4Ready === 'true');
  const persisted = await page.evaluate(async () => { const rows = await window.CWB.repositories.students.list(); return { count:rows.length, first:rows.find(row => row.student_number === 'PERF-0')?.student_number }; });
  assert.equal(persisted.count, 10005);
  assert.equal(persisted.first, 'PERF-0');
  await browser.close();
  console.log(`v40 performance sample: ${JSON.stringify(result)}`);
  assert.equal(result.status, 'completed');
  assert.equal(result.processed, 10000);
  assert.ok(result.progressCount >= 2, `expected progress callbacks, got ${result.progressCount}`);
  assert.ok(result.maxProgressGap <= 500, `progress gap ${result.maxProgressGap.toFixed(1)}ms exceeds 500ms`);
  assert.ok(result.maxEventLoopGap <= 200, `event-loop stall ${result.maxEventLoopGap.toFixed(1)}ms exceeds 200ms`);
  console.log(`PASS v40-performance-browser (${JSON.stringify(result)})`);
})().catch(error => { console.error(error.stack || error.message); process.exit(1); });
