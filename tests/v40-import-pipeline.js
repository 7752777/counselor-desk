/** Student preview-to-import pipeline must use chunked, resumable commit. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

(async () => {
  const vc = new VirtualConsole();
  const dom = await JSDOM.fromFile(path.join(__dirname, '..', 'output', 'v4-preview.html'), { runScripts: 'dangerously', resources: 'usable', url: 'https://c.local/', virtualConsole: vc, pretendToBeVisual: true });
  await new Promise(resolve => setTimeout(resolve, 500));
  const cwb = dom.window.CWB;
  const rows = ['学号,姓名,班级'];
  for (let i = 0; i < 1200; i++) rows.push(`PIPE-${i},导入学生${i},测试班${i % 10}`);
  const preview = cwb.importer.previewCSV(rows.join('\n'), 'students');
  const progress = [];
  const result = await cwb.importer.commitPreviewAsync(preview.id, { confirmSensitive: true, chunkSize: 500, onProgress: item => progress.push(item) });
  assert.equal(result.ok, true, result.error || 'chunked preview commit failed');
  assert.equal(result.added, 1200);
  assert.ok(progress.some(item => item.status === 'running'));
  assert.equal(progress.at(-1).status, 'completed');
  assert.equal(cwb.db.students.filter(student => String(student.student_number).startsWith('PIPE-')).length, 1200);
  assert.ok((await cwb.importer.getHistoryAsync()).some(item => item.id === result.runId));
  assert.equal(dom.window.localStorage.getItem('cwb_v1_import_history'), null, 'v4 import history must not use localStorage');
  assert.equal(typeof cwb.importer.listJobs, 'function');
  assert.equal(typeof cwb.importer.discardJob, 'function');
  let cancelId = '';
  const cancelled = cwb.importer.start({ collection:'students', rows:Array.from({ length: 1200 }, (_, index) => ({ student_number:`CANCEL-${index}`, full_name:'取消测试' })), chunkSize:1, onProgress(item) { if (item.status === 'running' && item.processed >= 1) cwb.importer.cancel(cancelId); } });
  cancelId = cancelled.id;
  const cancelledResult = await cancelled;
  assert.equal(cancelledResult.status, 'cancelled');
  const jobs = await cwb.importer.listJobs();
  assert.ok(jobs.some(job => job.id === cancelled.id && job.status === 'cancelled'));
  assert.equal(await cwb.importer.discardJob(cancelled.id), true);
  assert.ok(!(await cwb.importer.listJobs()).some(job => job.id === cancelled.id));

  // Manual mapping must be able to demote duplicate/invalid source columns to custom fields.
  const manual = cwb.importer.previewCSV(
    'student_number,full_name,gender,gender,enrollment_status,id_card\nMANUAL-1,Manual Student,\u7537,\u7537,raw-status,not-a-valid-id',
    'students',
    { mappingByIndex:['student_number','full_name','gender','','',''] },
  );
  assert.equal(manual.valid, 1);
  assert.equal(manual.rows[0].errors.length, 0);
  const manualCommit = await cwb.importer.commitPreviewAsync(manual.id, { confirmSensitive:true, chunkSize:500 });
  assert.equal(manualCommit.ok, true);
  assert.equal((await cwb.repositories.students.list()).filter(student => student.student_number === 'MANUAL-1').length, 1);
  dom.window.close();
  console.log('PASS v40-import-pipeline');
})().catch(error => { console.error(error.stack || error.message); process.exit(1); });
