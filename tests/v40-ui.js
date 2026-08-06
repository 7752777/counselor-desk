const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

(async () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
    .replace('<script defer src="src/core/v4-runtime.js" data-v4-runtime></script>', () => `<script>${fs.readFileSync(path.join(root, 'src/core/v4-runtime.js'), 'utf8')}</script>`);
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => {
    if (!/Could not load script:.*(?:xlsx\.full\.min\.js|argon2-bundled\.min\.js|jszip\.min\.js|echarts\.min\.js)/.test(error.message)) console.error(error);
  });
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'https://c.local/',
    pretendToBeVisual: true,
    virtualConsole,
  });
  await new Promise(resolve => setTimeout(resolve, 700));
  const cwb = dom.window.CWB;
  assert.match(html, /data-act="v4-import-jobs"/, 'home/students should expose pending import task entry');
  assert.match(html, /data-v4-job-file/, 'import task center should offer same-file recovery');
  assert.match(html, /data-import-cancel/, 'import preview should expose cancellation control');
  assert.ok(cwb.repositories, 'repositories API should be public');
  assert.ok(cwb.repositories.students && cwb.repositories.organizations && cwb.repositories.party && cwb.repositories.files && cwb.repositories.resources && cwb.repositories.employmentResources);
  assert.ok(cwb.attachments, 'attachments API should be public');
  for (const method of ['batchImport', 'createThumbnail', 'findDuplicate', 'download', 'delete', 'list', 'get']) assert.equal(typeof cwb.attachments[method], 'function', `attachments.${method} should be public`);
  assert.equal(cwb.store.compatibilityOnly, true);
  assert.equal(dom.window.CWB_V4_IDB_ACTIVE, true);
  assert.equal(typeof cwb.importer.start, 'function');
  assert.equal(typeof cwb.importer.resume, 'function');
  assert.equal(typeof cwb.importer.cancel, 'function');
  assert.equal(typeof cwb.importer.onProgress, 'function');
  assert.equal(typeof cwb.importer.listJobs, 'function');
  assert.equal(typeof cwb.importer.discardJob, 'function');
  assert.equal(typeof cwb.backup.export, 'function');
  assert.equal(typeof cwb.backup.restore, 'function');
  assert.equal(typeof cwb.backup.configureSchedule, 'function');
  assert.equal(typeof cwb.backup.runDueJobs, 'function');
  assert.equal(cwb.bridge.PACKAGE_VERSION, 7);
  assert.equal(cwb.version, '4.0.0');
  const customPreview = cwb.importer.previewCSV('student_number,full_name,Scholarship Level\n__custom_1,Test Student,National', 'students');
  assert.ok(customPreview.customFields && Object.keys(customPreview.customFields).length === 1, 'unknown student columns should become custom fields');
  assert.equal(customPreview.rows[0].value.custom_fields[Object.keys(customPreview.customFields)[0]], 'National');
  const customSensitivePreview = cwb.importer.previewCSV('student_number,full_name,Parent Phone\n__custom_sensitive,Test Student,13800138000', 'students');
  assert.equal(customSensitivePreview.sensitiveFields.length, 1, 'unknown sensitive columns should require acknowledgement');
  cwb.openImportPreview(customSensitivePreview, {});
  assert.match(dom.window.document.querySelector('#modal-root').textContent, /Parent Phone/, 'custom sensitive field should render safely in the acknowledgement banner');
  dom.window.document.querySelector('#modal-root [data-close]').click();
  assert.throws(() => cwb.bridge.applyPackage({ package:'counselor-desk', package_version:8, students:[] }, 'merge'), /高于当前支持/);
  const beforeImport = cwb.db.students.length;
  let runningImport;
  runningImport = cwb.importer.start({ collection:'students', rows:[{ student_number:'__cancel_1', full_name:'取消一' }, { student_number:'__cancel_2', full_name:'取消二' }], chunkSize:1, onProgress(progress) { if (progress.processed >= 1 && progress.status === 'running') cwb.importer.cancel(runningImport); } });
  const cancelled = await runningImport;
  assert.equal(cancelled.status, 'cancelled');
  assert.equal(cwb.db.students.length, beforeImport);
  const cancelledJobs = await cwb.importer.listJobs();
  assert.ok(cancelledJobs.some(job => job.id === runningImport.id), 'cancelled import should persist an IndexedDB checkpoint');
  const resumed = await cwb.importer.resume(runningImport);
  assert.equal(resumed.status, 'completed');
  assert.equal(cwb.db.students.length, beforeImport + 2);
  assert.equal(cwb.store.read(`v4_import_job_${runningImport.id}`, null), null, 'completed import should clear checkpoint');
  console.log('PASS v40-ui');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
