const assert = require('node:assert/strict');

async function loadCore() {
  return import('../src/core/v4-core.mts');
}

(async () => {
  const core = await loadCore();

  const student = core.normalizeStudentV40({
    student_number: '20240001',
    full_name: '张明',
    photo_ids: ['photo-1'],
    custom_fields: { scholarship: '国家奖学金' },
  });
  assert.equal(student.schema_version, 7);
  assert.equal(student.student_number, '20240001');
  assert.deepEqual(student.photo_ids, ['photo-1']);
  assert.equal(student.custom_fields.scholarship, '国家奖学金');

  assert.equal(core.mapStudentHeader('身份证号码'), 'id_card');
  assert.equal(core.mapStudentHeader('家长联系电话'), 'parent_phone');
  assert.equal(core.mapStudentHeader('自定义资助等级'), 'custom_fields自定义资助等级');

  const chunks = [...core.chunkRows(Array.from({ length: 1201 }, (_, i) => ({ i })), 500)];
  assert.deepEqual(chunks.map(chunk => chunk.length), [500, 500, 201]);

  const job = core.createImportJob({ fileHash: 'sha256:test', totalRows: 1201, chunkSize: 500 });
  assert.equal(job.status, 'pending');
  const checkpoint = core.advanceImportJob(job, 500);
  assert.equal(checkpoint.lastRow, 500);
  assert.equal(checkpoint.status, 'running');
  assert.equal(core.advanceImportJob(checkpoint, 701).status, 'completed');

  globalThis.argon2 = globalThis.argon2 || {
    ArgonType: { Argon2id: 2 },
    hash: async ({ pass, salt }) => ({ hash: new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${pass}:${Buffer.from(salt).toString('base64')}`))) }),
  };
  const envelope = await core.encryptBackup({ students: [student] }, 'correct horse battery staple');
  assert.equal(envelope.format, 'cwbk');
  assert.equal(envelope.version, 7);
  assert.deepEqual(await core.decryptBackup(envelope, 'correct horse battery staple'), { students: [student] });
  await assert.rejects(() => core.decryptBackup(envelope, 'wrong password'), /BACKUP_PASSWORD_INVALID/);

  const party = core.normalizePartyCase({ student_number: '20240001', stage: 'party_applicant' });
  assert.equal(party.schema_version, 7);
  assert.equal(party.stage, 'party_applicant');
  assert.ok(Array.isArray(party.steps));
  assert.ok(party.steps.some(step => step.key === 'initial_talk'));

  console.log('PASS v40-core');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
