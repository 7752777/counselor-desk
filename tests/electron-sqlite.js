const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createSqliteStore } = require('../desktop/sqlite-store.cjs');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cwb-v4-sqlite-'));
const file = path.join(dir, 'records.sqlite');
const store = createSqliteStore(file, () => 'test-vault-key');
if (!store) {
  console.log('SKIP electron-sqlite: node:sqlite unavailable');
  process.exit(0);
}
const first = store.put('records_students', { id: 'stu-1', schema_version: 7, student_number: '20240001', full_name: '张明' });
assert.equal(first.id, 'stu-1');
assert.equal(store.get('records_students', 'stu-1').full_name, '张明');
assert.equal(store.list('records_students').length, 1);
assert.equal(store.count('records_students'), 1);
assert.equal(store.delete('records_students', 'stu-1'), true);
assert.equal(store.count('records_students'), 0);
store.close();
fs.rmSync(dir, { recursive: true, force: true });
console.log('PASS electron-sqlite');
