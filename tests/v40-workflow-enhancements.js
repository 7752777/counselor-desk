const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', error => { if (!/window\.scrollTo|Could not load script/.test(String(error && error.message))) throw error; });

(async () => {
  const dom = new JSDOM(html, { runScripts:'dangerously', resources:'usable', url:'https://c.local/', pretendToBeVisual:true, virtualConsole });
  await new Promise(resolve => setTimeout(resolve, 450));
  const { CWB, document } = dom.window;
  assert.ok(CWB.testData, 'test data snapshot API should be public');
  assert.equal(typeof CWB.testData.createSnapshot, 'function');
  assert.equal(typeof CWB.testData.restoreSnapshot, 'function');
  assert.equal(typeof CWB.testData.clearWorkspace, 'function');
  assert.ok(CWB.sync && typeof CWB.sync.createPhonePackage === 'function', 'phone exchange API should be explicit');
  assert.ok(CWB.sync && typeof CWB.sync.applyPhonePackage === 'function');

  const preview = CWB.importer.previewCSV('学号,姓名,培养层次,年级\nG-001,研究生甲,研究生,2024级', 'students');
  assert.equal(preview.rows[0].value.student_level, 'graduate');
  assert.match(document.body.textContent, /本科.*研究生|培养层次/, 'student level should be visible in the UI contract');

  const marker = { id:'snapshot-marker', student_number:'SNAP-001', full_name:'快照测试', student_level:'graduate' };
  CWB.db.students.push(CWB.norm.student(marker));
  const snapshot = await CWB.testData.createSnapshot('样例 A 原始状态');
  assert.ok(snapshot.id && snapshot.name && snapshot.counts.students >= 1);
  await CWB.testData.clearWorkspace({ includeSettings:false });
  assert.equal(CWB.db.students.some(item => item.student_number === 'SNAP-001'), false);
  await CWB.testData.restoreSnapshot(snapshot.id);
  assert.equal(CWB.db.students.some(item => item.student_number === 'SNAP-001'), true);

  CWB.go('backup');
  await new Promise(resolve => setTimeout(resolve, 40));
  const bridgeText = document.querySelector('#main')?.textContent || '';
  assert.match(bridgeText, /手机工作包|手机协同/);
  CWB.go('report');
  await new Promise(resolve => setTimeout(resolve, 40));
  assert.ok(document.querySelector('.chart-panel-body'), 'chart panels should use balanced layout');
  assert.ok(document.querySelector('.report-period-kpi'), 'report period should not clip long labels');
  CWB.go('warn');
  await new Promise(resolve => setTimeout(resolve, 40));
  assert.ok(document.querySelector('.chart-panel-body'), 'warning chart should use balanced layout');
  CWB.go('policy');
  await new Promise(resolve => setTimeout(resolve, 40));
  assert.ok(document.querySelector('[data-policy-open]') || document.querySelector('.policy-resource-card'), 'policy resources should expose open actions');
  CWB.go('learning');
  await new Promise(resolve => setTimeout(resolve, 40));
  assert.ok(document.querySelector('.learning-kpi-grid'), 'learning KPIs should share one layout');

  dom.window.close();
  console.log('PASS v40-workflow-enhancements');
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
