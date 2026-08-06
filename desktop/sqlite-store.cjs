const crypto = require('node:crypto');

function encodeRecord(record, keyText) {
  const plain = Buffer.from(JSON.stringify(record), 'utf8');
  const key = crypto.createHash('sha256').update(String(keyText)).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([Buffer.from('CWBSQL1'), iv, cipher.getAuthTag(), ciphertext]);
}

function decodeRecord(payload, keyText) {
  const buffer = Buffer.from(payload);
  if (buffer.subarray(0, 7).toString() !== 'CWBSQL1') throw new Error('SQLITE_RECORD_FORMAT_INVALID');
  const key = crypto.createHash('sha256').update(String(keyText)).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, buffer.subarray(7, 19));
  decipher.setAuthTag(buffer.subarray(19, 35));
  return JSON.parse(Buffer.concat([decipher.update(buffer.subarray(35)), decipher.final()]).toString('utf8'));
}

function createSqliteStore(dbPath, getKey) {
  let DatabaseSync;
  try { ({ DatabaseSync } = require('node:sqlite')); } catch (_) { return null; }
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS records (
      collection TEXT NOT NULL,
      record_id TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      payload BLOB NOT NULL,
      PRIMARY KEY (collection, record_id)
    );
    CREATE INDEX IF NOT EXISTS idx_records_collection_updated ON records(collection, updated_at);
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      collection TEXT NOT NULL,
      record_id TEXT,
      at TEXT NOT NULL
    );`);
  const putStatement = db.prepare('INSERT INTO records(collection, record_id, updated_at, payload) VALUES(?, ?, ?, ?) ON CONFLICT(collection, record_id) DO UPDATE SET updated_at=excluded.updated_at, payload=excluded.payload');
  const listStatement = db.prepare('SELECT payload FROM records WHERE collection=? ORDER BY updated_at, record_id');
  const getStatement = db.prepare('SELECT payload FROM records WHERE collection=? AND record_id=?');
  const deleteStatement = db.prepare('DELETE FROM records WHERE collection=? AND record_id=?');
  const countStatement = db.prepare('SELECT COUNT(*) AS count FROM records WHERE collection=?');
  const auditStatement = db.prepare('INSERT INTO audit_log(action, collection, record_id, at) VALUES(?, ?, ?, ?)');
  const now = () => new Date().toISOString();
  const key = () => getKey();
  return {
    put(collection, record) {
      if (!record || !record.id) throw new Error('REPOSITORY_ID_REQUIRED');
      const createdAt = record.created_at || now();
      const value = { ...record, schema_version: Number(record.schema_version || 7), created_at: createdAt, updated_at: record.updated_at || now() };
      putStatement.run(String(collection), String(value.id), value.updated_at, encodeRecord(value, key()));
      auditStatement.run('put', String(collection), String(value.id), now());
      return value;
    },
    putMany(collection, records) {
      if (!Array.isArray(records)) throw new Error('REPOSITORY_RECORDS_INVALID');
      const values = records.map(record => {
        if (!record || !record.id) throw new Error('REPOSITORY_ID_REQUIRED');
        const createdAt = record.created_at || now();
        return { ...record, schema_version: Number(record.schema_version || 7), created_at: createdAt, updated_at: record.updated_at || now() };
      });
      db.exec('BEGIN');
      try {
        for (const value of values) {
          putStatement.run(String(collection), String(value.id), value.updated_at, encodeRecord(value, key()));
          auditStatement.run('put', String(collection), String(value.id), now());
        }
        db.exec('COMMIT');
        return values;
      } catch (error) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        throw error;
      }
    },
    replaceManyAtomic(collection, records) {
      if (!Array.isArray(records)) throw new Error('REPOSITORY_RECORDS_INVALID');
      const values = records.map(record => {
        if (!record || !record.id) throw new Error('REPOSITORY_ID_REQUIRED');
        const createdAt = record.created_at || now();
        return { ...record, schema_version: Number(record.schema_version || 7), created_at: createdAt, updated_at: record.updated_at || now() };
      });
      db.exec('BEGIN');
      try {
        db.prepare('DELETE FROM records WHERE collection=?').run(String(collection));
        const bulk = { id:'__cwb_bulk_students__', schema_version:7, created_at:now(), updated_at:now(), chunk_count:Math.ceil(values.length / 250) };
        putStatement.run(String(collection), bulk.id, bulk.updated_at, encodeRecord(bulk, key()));
        for (let index = 0; index < values.length; index += 250) {
          const chunk = { id:`__cwb_bulk_students__:${index / 250}`, schema_version:7, created_at:bulk.created_at, updated_at:bulk.updated_at, records_json:JSON.stringify(values.slice(index, index + 250)) };
          putStatement.run(String(collection), chunk.id, chunk.updated_at, encodeRecord(chunk, key()));
        }
        auditStatement.run('replace-many', String(collection), bulk.id, now());
        db.exec('COMMIT');
        return values;
      } catch (error) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        throw error;
      }
    },
    list(collection) { return listStatement.all(String(collection)).map(row => decodeRecord(row.payload, key())); },
    get(collection, id) { const row = getStatement.get(String(collection), String(id)); return row ? decodeRecord(row.payload, key()) : null; },
    delete(collection, id) { const result = deleteStatement.run(String(collection), String(id)); if (result.changes) auditStatement.run('delete', String(collection), String(id), now()); return Boolean(result.changes); },
    count(collection) { return Number(countStatement.get(String(collection)).count || 0); },
    close() { db.close(); },
  };
}

module.exports = { createSqliteStore };
