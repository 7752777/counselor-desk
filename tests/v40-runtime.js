const assert = require('node:assert/strict');
const fs = require('node:fs');
const { webcrypto } = require('node:crypto');
const { TextEncoder, TextDecoder } = require('node:util');
const { JSDOM } = require('jsdom');

(async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only', url: 'https://c.local/' });
  Object.defineProperty(dom.window, 'crypto', { value: webcrypto });
  Object.defineProperty(dom.window, 'TextEncoder', { value: TextEncoder });
  Object.defineProperty(dom.window, 'TextDecoder', { value: TextDecoder });
  dom.window.argon2 = { ArgonType:{ Argon2id:2 }, hash: async ({ pass, salt }) => ({ hash:new Uint8Array(await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(`${pass}:${Buffer.from(salt).toString('base64')}`))) }) };
  const runtime = fs.readFileSync('src/core/v4-runtime.js', 'utf8');
  dom.window.eval(runtime);
  const api = dom.window.CWB_V4;
  assert.ok(api, 'v4 runtime should expose CWB_V4');

  const repo = api.createMemoryRepository('students');
  await repo.put({ id: 's1', student_number: '20240001', full_name: '张明' });
  assert.equal((await repo.list()).length, 1);
  assert.equal((await repo.get('s1')).full_name, '张明');

  const progress = [];
  const controller = api.createChunkedImportController({
    rows: Array.from({ length: 1201 }, (_, index) => ({ index })),
    chunkSize: 500,
    onProgress: event => progress.push(event),
  });
  const result = await controller.run();
  assert.equal(result.imported, 1201);
  assert.equal(result.status, 'completed');
  assert.equal(progress.at(-1).processed, 1201);
  assert.equal(progress.at(-1).total, 1201);
  assert.equal(progress.at(-1).status, 'completed');

  const matches = api.matchPhotoFilename('20240001_张明_证件照.jpg', [
    { id: 's1', student_number: '20240001', full_name: '张明' },
  ]);
  assert.equal(matches.status, 'matched');
  assert.equal(matches.student.id, 's1');

  assert.equal(api.partyChecklist('2026-05-11').some(step => step.key === 'initial_talk'), true);
  const envelope = await api.encryptBackup({ students: [{ id: 's1' }] }, 'correct horse battery staple');
  assert.equal(envelope.format, 'cwbk');
  const restored = await api.decryptBackup(envelope, 'correct horse battery staple');
  assert.equal(restored.students[0].id, 's1');
  await assert.rejects(() => api.decryptBackup(envelope, 'wrong password'), /BACKUP_PASSWORD_INVALID/);
  const legacySalt = webcrypto.getRandomValues(new Uint8Array(16)); const legacyIv = webcrypto.getRandomValues(new Uint8Array(12));
  const legacyMaterial = await webcrypto.subtle.importKey('raw', new TextEncoder().encode('correct horse battery staple'), 'PBKDF2', false, ['deriveKey']);
  const legacyKey = await webcrypto.subtle.deriveKey({ name:'PBKDF2', salt:legacySalt, iterations:240000, hash:'SHA-256' }, legacyMaterial, { name:'AES-GCM', length:256 }, false, ['encrypt']);
  const legacyCiphertext = new Uint8Array(await webcrypto.subtle.encrypt({ name:'AES-GCM', iv:legacyIv }, legacyKey, new TextEncoder().encode(JSON.stringify({ students:[{ id:'legacy' }] }))));
  const legacyHash = new Uint8Array(await webcrypto.subtle.digest('SHA-256', legacyCiphertext));
  const b64 = bytes => Buffer.from(bytes).toString('base64');
  const legacyEnvelope = { format:'cwbk', version:7, kdf:'pbkdf2-sha256', compatibility:true, iterations:240000, salt:b64(legacySalt), iv:b64(legacyIv), ciphertext:b64(legacyCiphertext), integrity:b64(legacyHash) };
  assert.equal((await api.decryptBackup(legacyEnvelope, 'correct horse battery staple')).students[0].id, 'legacy');
  console.log('PASS v40-runtime');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
