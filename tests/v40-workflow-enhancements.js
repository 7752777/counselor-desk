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
  assert.ok(CWB.sync && typeof CWB.sync.previewPhonePackage === 'function', 'phone return should expose a diff preview');
  CWB.db.students = [
    CWB.norm.student({ id:'undergraduate-2024', student_number:'2024-001', full_name:'本科生甲', grade:'2024级', student_level:'undergraduate' }),
    CWB.norm.student({ id:'graduate-2024', student_number:'2024-001', full_name:'研究生甲', grade:'2024级', student_level:'graduate' }),
  ];
  const phonePackage = await CWB.sync.createPhonePackage();
  assert.equal(phonePackage.type, 'phone_exchange');
  assert.equal(phonePackage.sync_mode, 'manual_file_exchange');
  phonePackage.students = [
    CWB.norm.student({ id:'undergraduate-2024', student_number:'2024-001', full_name:'本科生甲（手机更新）', grade:'2024级', student_level:'undergraduate' }),
    CWB.norm.student({ id:'new-phone-student', student_number:'2024-002', full_name:'手机新增学生', grade:'2024级', student_level:'graduate' }),
  ];
  const phoneDiff = CWB.sync.previewPhonePackage(phonePackage);
  assert.equal(phoneDiff.collections.students.added, 1);
  assert.equal(phoneDiff.collections.students.updated, 1);
  assert.equal(phoneDiff.collections.students.deleted, 1);
  assert.equal(phoneDiff.collections.students.unchanged, 0);
  await CWB.sync.applyPhonePackage(phonePackage, 'merge');
  assert.equal(CWB.db.students.find(item => item.id === 'undergraduate-2024').full_name, '本科生甲（手机更新）');
  assert.ok(CWB.db.students.some(item => item.id === 'graduate-2024'), 'merge should keep records absent from a phone package');
  assert.ok(CWB.db.students.some(item => item.id === 'new-phone-student'), 'merge should add phone-created records');

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

  CWB.db.students.push(CWB.norm.student({ id:'dynamic-columns', student_number:'DYN-001', full_name:'动态字段测试', custom_fields:Object.fromEntries(Array.from({ length:50 }, (_, index) => [`学校字段${index + 1}`, `值${index + 1}`])) }));
  CWB.go('students');
  await new Promise(resolve => setTimeout(resolve, 40));
  assert.ok((document.querySelectorAll('.student-dynamic-table thead th').length || 0) >= 50, 'student table should render imported custom columns');

  CWB.go('graduate');
  await new Promise(resolve => setTimeout(resolve, 40));
  assert.ok(document.querySelector('.graduate-kpis'), 'graduate KPI cards should share a stable layout');
  assert.ok(document.querySelector('[data-workspace-parent="graduate"][data-workspace-tab="employment"]'), 'graduate page should expose employment resources tab');
  document.querySelector('[data-workspace-parent="graduate"][data-workspace-tab="employment"]')?.click();
  await new Promise(resolve => setTimeout(resolve, 40));
  assert.ok(document.querySelectorAll('[data-employment-resource]').length >= 5, 'employment resources should be visible from graduate page');

  CWB.go('tpl');
  await new Promise(resolve => setTimeout(resolve, 40));
  assert.ok(document.querySelector('[data-workspace-parent="tpl"][data-workspace-tab="files"]'), 'template workspace should expose the classified file library tab');
  document.querySelector('[data-workspace-parent="tpl"][data-workspace-tab="files"]')?.click();
  await new Promise(resolve => setTimeout(resolve, 40));
  assert.ok(document.querySelector('[data-act="v4-file-upload"]'), 'classified file library should expose upload action');
  assert.ok(document.querySelector('[data-v4-vault-root]'), 'classified file library should show local archive status');
  assert.match(document.querySelector('[data-v4-file-category]')?.textContent || '', /表单模板|政策文件|讲话稿/);

  CWB.go('backup');
  await new Promise(resolve => setTimeout(resolve, 40));
  const bridgeText = document.querySelector('#main')?.textContent || '';
  assert.match(bridgeText, /手机与换机协同|换机包/);
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
  assert.ok(document.querySelector('[data-act="policy-attach"]'), 'policy resources should expose local attachment action');
  CWB.go('learning');
  await new Promise(resolve => setTimeout(resolve, 40));
  assert.ok(document.querySelector('.learning-kpi-grid'), 'learning KPIs should share one layout');

  dom.window.close();
  console.log('PASS v40-workflow-enhancements');
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
