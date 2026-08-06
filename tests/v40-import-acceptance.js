const assert = require('node:assert/strict');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

(async () => {
  const dom = await JSDOM.fromFile(path.join(__dirname, '..', 'output', 'v4-preview.html'), { runScripts:'dangerously', resources:'usable', url:'https://c.local/', virtualConsole:new VirtualConsole(), pretendToBeVisual:true });
  await new Promise(resolve => setTimeout(resolve, 500));
  const importer = dom.window.CWB.importer;
  const sizes = [0, 1, 100, 5000, 10000];
  for (const size of sizes) {
    const progress = []; const rows = Array.from({ length:size }, (_, index) => ({ student_number:`ACCEPT-${size}-${index}`, full_name:`验收${index}`, class_name:'验收班', custom_fields:Object.fromEntries(Array.from({ length:100 }, (_, column) => [`列${column}`, `值${column}`])) }));
    const task = importer.start({ collection:'students', rows, chunkSize:500, onProgress:item => progress.push({ ...item, at:Date.now() }) });
    const result = await task;
    assert.equal(result.status, 'completed');
    if (size) assert.equal(progress.at(-1).status, 'completed');
  }
  dom.window.close();
  console.log('PASS v40-import-acceptance');
})().catch(error => { console.error(error.stack || error.message); process.exit(1); });
