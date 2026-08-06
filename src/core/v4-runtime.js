(function installV4Runtime(global) {
  'use strict';

  const V4_SCHEMA_VERSION = 7;
  const memoryStores = new Map();
  const indexedDbConnections = new Map();
  const DEFAULT_DB_STORES = Object.freeze([
    'records_students', 'records_tasks', 'records_talks', 'records_stay', 'records_leave', 'records_honor',
    'records_pleave', 'records_attend', 'records_node', 'records_warn', 'records_help', 'records_grant',
    'records_focus', 'records_psych', 'records_graduate', 'records_policy', 'records_material', 'records_comp',
    'records_tpl', 'records_learning_materials', 'records_learning_notes', 'records_learning_sessions',
    'records_custom_v4_positions', 'records_custom_v4_party_cases', 'records_custom_v4_files',
    'records_custom_v4_employment_resources', 'attachments', 'import_jobs', 'audit_log', 'meta',
  ]);

  function clone(value) {
    if (value == null) return value;
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  async function gzipText(value) {
    if (typeof global.CompressionStream !== 'function' || typeof global.Response !== 'function') return null;
    const stream = new global.CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    await writer.write(new TextEncoder().encode(value));
    await writer.close();
    return new Uint8Array(await new global.Response(stream.readable).arrayBuffer());
  }

  async function getCrypto() {
    if (global.crypto && global.crypto.subtle) return global.crypto;
    throw new Error('WEB_CRYPTO_UNAVAILABLE');
  }

  function encodeBase64(bytes) {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return global.btoa(binary);
  }

  function decodeBase64(value) {
    const binary = global.atob(value);
    return Uint8Array.from(binary, char => char.charCodeAt(0));
  }

  async function deriveBackupKey(password, salt, parameters) {
    const cryptoApi = await getCrypto();
    const argon2Api = global.argon2;
    if (parameters && parameters.kdf === 'argon2id') {
      if (!argon2Api || typeof argon2Api.hash !== 'function') throw new Error('ARGON2_UNAVAILABLE');
      const result = await argon2Api.hash({
        pass: password,
        salt,
        time: parameters.time || 3,
        mem: parameters.memory || 65536,
        parallelism: parameters.parallelism || 1,
        hashLen: 32,
        type: argon2Api.ArgonType.Argon2id,
      });
      const material = await cryptoApi.subtle.importKey('raw', result.hash, 'HKDF', false, ['deriveKey']);
      return cryptoApi.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt, info: new TextEncoder().encode('CWB v7 backup AES-256-GCM') }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    }
    const iterations = Number(parameters && parameters.iterations) || 240000;
    const material = await cryptoApi.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return cryptoApi.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  async function encryptBackup(data, password) {
    if (typeof password !== 'string' || password.length < 8) throw new Error('BACKUP_PASSWORD_TOO_SHORT');
    const cryptoApi = await getCrypto();
    if (!global.argon2 || typeof global.argon2.hash !== 'function') throw new Error('ARGON2_UNAVAILABLE');
    const salt = cryptoApi.getRandomValues(new Uint8Array(16));
    const iv = cryptoApi.getRandomValues(new Uint8Array(12));
    // v7 never silently downgrades: PBKDF2 is accepted only by the explicit
    // compatibility path in decryptBackup for legacy envelopes.
    const parameters = { kdf: 'argon2id', time: 3, memory: 65536, parallelism: 1 };
    const ciphertext = new Uint8Array(await cryptoApi.subtle.encrypt({ name: 'AES-GCM', iv }, await deriveBackupKey(password, salt, parameters), new TextEncoder().encode(JSON.stringify(data))));
    const integrity = new Uint8Array(await cryptoApi.subtle.digest('SHA-256', ciphertext));
    return { format: 'cwbk', version: 7, ...parameters, salt: encodeBase64(salt), iv: encodeBase64(iv), ciphertext: encodeBase64(ciphertext), integrity: encodeBase64(integrity), created_at: new Date().toISOString() };
  }

  async function decryptBackup(envelope, password) {
    if (!envelope || envelope.format !== 'cwbk' || envelope.version !== 7) throw new Error('BACKUP_FORMAT_UNSUPPORTED');
    if (envelope.kdf !== 'argon2id' && !(envelope.kdf === 'pbkdf2-sha256' && envelope.compatibility === true)) throw new Error('ARGON2_REQUIRED_FOR_V7');
    const cryptoApi = await getCrypto();
    const ciphertext = decodeBase64(envelope.ciphertext);
    const integrity = encodeBase64(new Uint8Array(await cryptoApi.subtle.digest('SHA-256', ciphertext)));
    if (integrity !== envelope.integrity) throw new Error('BACKUP_INTEGRITY_FAILED');
    try {
      const plaintext = await cryptoApi.subtle.decrypt({ name: 'AES-GCM', iv: decodeBase64(envelope.iv) }, await deriveBackupKey(password, decodeBase64(envelope.salt), envelope), ciphertext);
      return JSON.parse(new TextDecoder().decode(plaintext));
    } catch (error) {
      throw new Error('BACKUP_PASSWORD_INVALID', { cause: error });
    }
  }

  function createMemoryRepository(name) {
    const records = memoryStores.get(name) || new Map();
    memoryStores.set(name, records);
    return {
      async get(id) { return clone(records.get(String(id))); },
      async list() { return [...records.values()].map(clone); },
      async put(record) {
        const input = clone(record);
        const now = new Date().toISOString();
        const value = { ...input, schema_version: Number(input && input.schema_version || V4_SCHEMA_VERSION), created_at: input && input.created_at || now, updated_at: input && input.updated_at || now };
        if (!value || !value.id) throw new Error('REPOSITORY_ID_REQUIRED');
        records.set(String(value.id), value);
        return clone(value);
      },
      async putMany(items) {
        if (!Array.isArray(items)) throw new Error('REPOSITORY_RECORDS_INVALID');
        const values = items.map(record => {
          const input = clone(record); const now = new Date().toISOString();
          const value = { ...input, schema_version: Number(input && input.schema_version || V4_SCHEMA_VERSION), created_at: input && input.created_at || now, updated_at: input && input.updated_at || now };
          if (!value.id) throw new Error('REPOSITORY_ID_REQUIRED');
          records.set(String(value.id), value); return value;
        });
        return values;
      },
      async replaceManyAtomic(items) {
        if (!Array.isArray(items)) throw new Error('REPOSITORY_RECORDS_INVALID');
        records.clear();
        for (const value of items) { if (!value || !value.id) throw new Error('REPOSITORY_ID_REQUIRED'); records.set(String(value.id), clone(value)); }
        return items;
      },
      async deleteWherePrefix(prefix) {
        const needle = String(prefix || '');
        for (const id of [...records.keys()]) if (id.startsWith(needle)) records.delete(id);
        return true;
      },
      async delete(id) { return records.delete(String(id)); },
      async clear() { records.clear(); },
      async count() { return records.size; },
    };
  }

  function createIndexedDbRepository(name, dbName) {
    const databaseName = dbName || 'counselor_desk_v4';
    const stores = dbName ? [name] : DEFAULT_DB_STORES;
    let databasePromise = indexedDbConnections.get(databaseName);
    const open = () => {
      if (databasePromise) return databasePromise;
      databasePromise = new Promise((resolve, reject) => {
        const legacySources = [];
        const request = global.indexedDB.open(databaseName, 2);
        request.onupgradeneeded = () => {
          const database = request.result;
          stores.forEach(storeName => {
            if (!database.objectStoreNames.contains(storeName)) database.createObjectStore(storeName, { keyPath: 'id' });
          });
          const legacyMap = { students:'records_students', tasks:'records_tasks', talks:'records_talks', stay:'records_stay', leave:'records_leave', honor:'records_honor', pleave:'records_pleave', attend:'records_attend', node:'records_node', warn:'records_warn', help:'records_help', grant:'records_grant', focus:'records_focus', psych:'records_psych', graduate:'records_graduate', policy:'records_policy', material:'records_material', comp:'records_comp', tpl:'records_tpl' };
          Object.entries(legacyMap).forEach(([legacy, target]) => { if (database.objectStoreNames.contains(legacy) && database.objectStoreNames.contains(target)) legacySources.push([legacy, target]); });
        };
        request.onsuccess = () => {
          const database = request.result;
          if (!legacySources.length) { resolve(database); return; }
          try {
            const names = [...new Set(legacySources.map(pair => pair[0]))];
            const rowsByStore = new Map();
            const readTransaction = database.transaction(names, 'readonly');
            legacySources.forEach(([legacy]) => { const read = readTransaction.objectStore(legacy).getAll(); read.onsuccess = event => rowsByStore.set(legacy, event.target.result || []); });
            readTransaction.oncomplete = () => {
              const writeNames = [...new Set(legacySources.map(pair => pair[1]))];
              const writeTransaction = database.transaction(writeNames, 'readwrite');
              legacySources.forEach(([legacy, target]) => (rowsByStore.get(legacy) || []).forEach(record => { try { writeTransaction.objectStore(target).put(record); } catch (_) {} }));
              writeTransaction.oncomplete = () => resolve(database);
              writeTransaction.onerror = () => resolve(database);
            };
            readTransaction.onerror = () => resolve(database);
          } catch (_) { resolve(database); }
        };
        request.onerror = () => reject(request.error || new Error('INDEXEDDB_OPEN_FAILED'));
        request.onblocked = () => reject(new Error('INDEXEDDB_UPGRADE_BLOCKED'));
      });
      indexedDbConnections.set(databaseName, databasePromise);
      return databasePromise;
    };
    const transaction = async (mode, action) => {
      const db = await open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(name, mode);
        const store = tx.objectStore(name);
        let request;
        try { request = action(store); } catch (error) { reject(error); return; }
        tx.oncomplete = () => resolve(request && 'result' in request ? clone(request.result) : undefined);
        tx.onerror = () => reject(tx.error || new Error('INDEXEDDB_TRANSACTION_FAILED'));
      });
    };
    return {
      get: id => transaction('readonly', store => store.get(String(id))),
      list: () => transaction('readonly', store => store.getAll()),
      put: record => {
        const input = clone(record); const now = new Date().toISOString();
        const value = { ...input, schema_version: Number(input && input.schema_version || V4_SCHEMA_VERSION), created_at: input && input.created_at || now, updated_at: input && input.updated_at || now };
        if (!value.id) return Promise.reject(new Error('REPOSITORY_ID_REQUIRED'));
        return transaction('readwrite', store => store.put(value)).then(() => clone(value));
      },
      putMany: (records, options) => {
        if (!Array.isArray(records)) return Promise.reject(new Error('REPOSITORY_RECORDS_INVALID'));
        const values = records.map(record => {
          const input = record; const now = new Date().toISOString();
          const value = { ...input, schema_version: Number(input && input.schema_version || V4_SCHEMA_VERSION), created_at: input && input.created_at || now, updated_at: input && input.updated_at || now };
          if (!value.id) throw new Error('REPOSITORY_ID_REQUIRED');
          return value;
        });
        return (async () => {
          const db = await open();
          const batches = options && options.atomic === true ? [values] : Array.from({ length:Math.ceil(values.length / 100) }, (_, index) => values.slice(index * 100, index * 100 + 100));
          for (const batch of batches) {
            await new Promise((resolve, reject) => {
              const tx = db.transaction(name, 'readwrite'); const objectStore = tx.objectStore(name);
              try { batch.forEach(value => objectStore.put(value)); } catch (error) { reject(error); return; }
              tx.oncomplete = resolve; tx.onerror = () => reject(tx.error || new Error('REPOSITORY_TRANSACTION_FAILED'));
            });
            if (batches.length > 1) await new Promise(resolve => setTimeout(resolve, 0));
          }
          return values;
        })();
      },
      replaceManyAtomic: records => {
        if (!Array.isArray(records)) return Promise.reject(new Error('REPOSITORY_RECORDS_INVALID'));
        const values = records.map(record => { const input = record; const now = new Date().toISOString(); const value = { ...input, schema_version:Number(input && input.schema_version || V4_SCHEMA_VERSION), created_at:input && input.created_at || now, updated_at:input && input.updated_at || now }; if (!value.id) throw new Error('REPOSITORY_ID_REQUIRED'); return value; });
        return (async () => {
          const db = await open();
          const chunkSize = 250;
          const chunks = Array.from({ length:Math.ceil(values.length / chunkSize) }, (_, index) => values.slice(index * chunkSize, index * chunkSize + chunkSize));
          const chunkPayloads = await Promise.all(chunks.map(async chunk => {
            const json = JSON.stringify(chunk);
            const compressed = await gzipText(json);
            return compressed ? { records_gzip:compressed } : { records_json:json };
          }));
          await new Promise((resolve, reject) => {
            const tx = db.transaction(name, 'readwrite'); const objectStore = tx.objectStore(name);
            try {
              objectStore.clear();
              const now = new Date().toISOString();
              objectStore.put({ id:'__cwb_bulk_students__', schema_version:V4_SCHEMA_VERSION, created_at:now, updated_at:now, chunk_count:chunks.length });
              chunkPayloads.forEach((payload, index) => objectStore.put({ id:`__cwb_bulk_students__:${index}`, schema_version:V4_SCHEMA_VERSION, created_at:now, updated_at:now, ...payload }));
            } catch (error) { reject(error); return; }
            tx.oncomplete = resolve; tx.onerror = () => reject(tx.error || new Error('REPOSITORY_TRANSACTION_FAILED'));
          });
          return values;
        })();
      },
      deleteWherePrefix: prefix => (async () => {
        const db = await open(); const needle = String(prefix || '');
        await new Promise((resolve, reject) => {
          const tx = db.transaction(name, 'readwrite'); const objectStore = tx.objectStore(name); const request = objectStore.openCursor();
          request.onsuccess = event => { const cursor = event.target.result; if (!cursor) { resolve(); return; } if (String(cursor.key).startsWith(needle)) cursor.delete(); cursor.continue(); };
          request.onerror = () => reject(request.error || new Error('REPOSITORY_CURSOR_FAILED')); tx.onerror = () => reject(tx.error || new Error('REPOSITORY_TRANSACTION_FAILED'));
        });
        return true;
      })(),
      delete: id => transaction('readwrite', store => store.delete(String(id))).then(() => true),
      clear: () => transaction('readwrite', store => store.clear()),
      count: () => transaction('readonly', store => store.count()),
    };
  }

  function createRepository(name, options) {
    if (!options || options.memory !== true) {
      if (global.indexedDB) return createIndexedDbRepository(name, options && options.dbName);
    }
    return createMemoryRepository(name);
  }

  function createChunkedImportController(options) {
    const rows = Array.isArray(options.rows) ? options.rows : [];
    const chunkSize = Math.max(1, Number(options.chunkSize) || 500);
    const onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => {};
    const onChunk = typeof options.onChunk === 'function' ? options.onChunk : async () => {};
    const seed = options.checkpoint && typeof options.checkpoint === 'object' ? options.checkpoint : {};
    if (seed.fileHash && options.fileHash && String(seed.fileHash) !== String(options.fileHash)) throw new Error('IMPORT_FILE_CHANGED');
    let checkpoint = {
      schema_version: V4_SCHEMA_VERSION,
      processed: 0,
      total: rows.length,
      status: rows.length ? 'pending' : 'completed',
      fileHash: String(options.fileHash || ''),
      sheetName: String(options.sheetName || ''),
      headerRow: Number(options.headerRow || 1),
      mappingVersion: String(options.mappingVersion || 'v4'),
      ...seed,
    };
    checkpoint.total = rows.length;
    checkpoint.fileHash = String(options.fileHash || checkpoint.fileHash || '');
    checkpoint.sheetName = String(options.sheetName || checkpoint.sheetName || '');
    checkpoint.headerRow = Number(options.headerRow || checkpoint.headerRow || 1);
    checkpoint.mappingVersion = String(options.mappingVersion || checkpoint.mappingVersion || 'v4');
    checkpoint.processed = Math.min(rows.length, Math.max(0, Number(checkpoint.processed) || 0));
    let cancelled = false;
    async function run() {
      if (checkpoint.status === 'completed') {
        onProgress({ processed: checkpoint.processed, total: checkpoint.total, status: 'completed' });
        return { imported: checkpoint.processed, status: 'completed', checkpoint: { ...checkpoint } };
      }
      checkpoint.status = 'running';
      for (let start = checkpoint.processed; start < rows.length; start += chunkSize) {
        if (cancelled) {
          checkpoint.status = 'cancelled';
          onProgress({ processed: checkpoint.processed, total: checkpoint.total, status: 'cancelled' });
          return { imported: checkpoint.processed, status: 'cancelled', checkpoint: { ...checkpoint } };
        }
        const chunk = rows.slice(start, start + chunkSize);
        await onChunk(chunk, { start, end: start + chunk.length });
        checkpoint.processed = start + chunk.length;
        onProgress({ processed: checkpoint.processed, total: checkpoint.total, status: checkpoint.processed >= rows.length ? 'completed' : 'running' });
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      checkpoint.status = 'completed';
      return { imported: checkpoint.processed, status: checkpoint.status, checkpoint: { ...checkpoint } };
    }
    return {
      run,
      cancel() { cancelled = true; },
      getCheckpoint() { return { ...checkpoint }; },
      resume() { cancelled = false; return run(); },
    };
  }

  function normalizePhotoName(value) {
    return String(value || '').split(/[\\/]/).pop().replace(/\.[^.]+$/, '').replace(/[\s_-]+/g, '').toLowerCase();
  }

  function matchPhotoFilename(filename, students) {
    const base = normalizePhotoName(filename);
    const list = Array.isArray(students) ? students : [];
    const originalBase = String(filename || '').split(/[\\/]/).pop().replace(/\.[^.]+$/, '');
    const numberMatches = list.filter(student => {
      const number = String(student.student_number || '').trim(); if (!number) return false;
      const escaped = number.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return base === number.toLowerCase() || new RegExp(`(^|[^0-9])${escaped}([^0-9]|$)`, 'i').test(originalBase);
    });
    if (numberMatches.length === 1) return { status: 'matched', reason: 'student_number', student: numberMatches[0] };
    if (numberMatches.length > 1) return { status: 'ambiguous', reason: 'student_number', candidates: numberMatches };
    const byName = list.filter(student => {
      const name = normalizePhotoName(student.full_name || student.name);
      return name && base.includes(name);
    });
    if (byName.length === 1) return { status: 'matched', reason: 'unique_name', student: byName[0] };
    if (byName.length > 1) return { status: 'ambiguous', candidates: byName };
    return { status: 'unmatched', candidates: [] };
  }

  function partyChecklist(ruleVersion, customSteps) {
    const mandatory = [
      { key: 'application', stage: 'party_applicant', label: '提交入党申请书', required: true },
      { key: 'initial_talk', stage: 'party_applicant', label: '党组织首轮谈话', required: true, dueDays: 30 },
      { key: 'recommendation', stage: 'activist', label: '党员推荐或群团组织推优', required: true },
      { key: 'filing', stage: 'activist', label: '上级党委备案与培养联系人', required: true },
      { key: 'education_review', stage: 'activist', label: '一年以上培养教育和考察', required: true, minDays: 365 },
      { key: 'development_publicity', stage: 'development_object', label: '发展对象公示', required: true, minWorkdays: 5 },
      { key: 'political_review', stage: 'development_object', label: '政治审查', required: true },
      { key: 'pre_review', stage: 'preparatory', label: '基层党委预审', required: true },
      { key: 'party_meeting', stage: 'preparatory', label: '支部党员大会讨论表决', required: true },
      { key: 'approval', stage: 'preparatory', label: '党委审批与备案', required: true, dueMonths: 3 },
      { key: 'probation_review', stage: 'probation', label: '预备期教育考察', required: true, dueDays: 365 },
      { key: 'regularization', stage: 'probation', label: '转正申请、支部大会与党委审批', required: true },
    ];
    const extras = Array.isArray(customSteps) ? customSteps.map((step, index) => ({
      key: String(step && step.key || `school_step_${index + 1}`),
      stage: String(step && step.stage || 'school_extra'),
      label: String(step && step.label || '').trim(),
      required: false,
      custom: true,
    })).filter(step => step.label) : [];
    return mandatory.concat(extras).map(step => ({ ...step, rule_version: ruleVersion || '2026-05-11' }));
  }

  function validatePartyTransition(item, step, operatedAt) {
    const value = item || {};
    const current = step || {};
    const errors = [];
    const parse = input => { const date = new Date(input); return Number.isNaN(date.getTime()) ? null : date; };
    const daysBetween = (from, to) => { const a = parse(from); const b = parse(to); return a && b ? Math.floor((b.getTime() - a.getTime()) / 86400000) : null; };
    const ageAt = (birth, at) => { const b = parse(birth); const a = parse(at) || new Date(); if (!b) return null; let age = a.getUTCFullYear() - b.getUTCFullYear(); if (a.getUTCMonth() < b.getUTCMonth() || (a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() < b.getUTCDate())) age--; return age; };
    if (current.key === 'application' && !value.birth_date) errors.push('缺少出生日期，无法核验申请入党时是否年满十八岁');
    if (value.birth_date && ageAt(value.birth_date, value.application_at || operatedAt) != null && ageAt(value.birth_date, value.application_at || operatedAt) < 18) errors.push('申请入党时须年满十八岁');
    const checklist = partyChecklist(value.rule_version || current.rule_version, value.custom_steps);
    const index = checklist.findIndex(candidate => candidate.key === current.key);
    const completed = new Set((Array.isArray(value.steps) ? value.steps : []).filter(candidate => candidate.status === 'done').map(candidate => candidate.key));
    checklist.slice(0, Math.max(0, index)).filter(candidate => candidate.required && !completed.has(candidate.key)).forEach(candidate => errors.push(`前置节点未完成：${candidate.label}`));
    if (current.key === 'initial_talk' && !value.application_at) errors.push('缺少申请日期，无法核验首轮谈话时限');
    if (current.key === 'initial_talk' && value.application_at) { const gap = daysBetween(value.application_at, operatedAt); if (gap != null && (gap < 0 || gap > 30)) errors.push('首轮谈话应在申请后一个月内完成'); }
    if (current.key === 'education_review' && !value.activist_at) errors.push('缺少确定积极分子日期，无法核验一年培养考察时限');
    if (current.key === 'education_review' && value.activist_at) { const gap = daysBetween(value.activist_at, operatedAt); if (gap != null && gap < 365) errors.push('积极分子培养考察不得少于一年'); }
    if (current.key === 'development_publicity' && value.publicity_start && value.publicity_end) {
      const start = parse(value.publicity_start); const end = parse(value.publicity_end); let workdays = 0;
      if (start && end) for (let date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6) workdays++;
      if (workdays < 5) errors.push('发展对象公示不得少于五个工作日');
    } else if (current.key === 'development_publicity') errors.push('缺少公示起止日期，无法核验不少于五个工作日');
    if (current.key === 'regularization' && !value.probation_at) errors.push('缺少接收预备党员日期，无法核验预备期一年');
    if (current.key === 'regularization' && value.probation_at) { const gap = daysBetween(value.probation_at, operatedAt); if (gap != null && gap < 365) errors.push('预备期应满一年后再办理转正'); }
    const materials = value.materials && value.materials[current.key];
    if (current.required && materials === false) errors.push(`材料未完整：${current.label}`);
    return { ok: errors.length === 0, errors, rule_version: value.rule_version || current.rule_version || '2026-05-11' };
  }

  function validateEmploymentResource(resource) {
    const value = resource || {};
    const url = String(value.url || '').trim();
    if (!/^https?:\/\//i.test(url)) throw new Error('EMPLOYMENT_URL_MUST_BE_HTTPS_OR_HTTP');
    return {
      id: String(value.id || `employment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
      title: String(value.title || '').trim(), region: String(value.region || '全国').trim(),
      industry: String(value.industry || '综合').trim(), organizer: String(value.organizer || '').trim(),
      url, verified_at: String(value.verified_at || '').trim(),
      status: value.status === '失效' || value.status === '待核验' ? value.status : '有效',
      schema_version: V4_SCHEMA_VERSION,
    };
  }

  function canonicalEmploymentManifest(manifest) {
    return JSON.stringify({ manifest_version: manifest.manifest_version, resources: manifest.resources, key_id: manifest.key_id, algorithm: manifest.algorithm, public_key: manifest.public_key, created_at: manifest.created_at });
  }
  function validateEmploymentManifest(manifest) {
    if (!manifest || Number(manifest.manifest_version) !== 1 || !Array.isArray(manifest.resources)) throw new Error('EMPLOYMENT_MANIFEST_INVALID');
    if (!manifest.key_id || !manifest.algorithm || !manifest.signature || manifest.public_key == null) throw new Error('EMPLOYMENT_MANIFEST_SIGNATURE_MISSING');
    return manifest.resources.map(validateEmploymentResource);
  }
  async function signEmploymentManifest(manifest, privateKey) {
    const cryptoApi = await getCrypto();
    if (manifest.algorithm === 'ECDSA-P256-SHA256') {
      if (!privateKey) throw new Error('EMPLOYMENT_PRIVATE_KEY_REQUIRED');
      const jwk = typeof privateKey === 'string' ? JSON.parse(privateKey) : privateKey;
      const key = await cryptoApi.subtle.importKey('jwk', jwk, { name:'ECDSA', namedCurve:'P-256' }, false, ['sign']);
      const signature = await cryptoApi.subtle.sign({ name:'ECDSA', hash:'SHA-256' }, key, new TextEncoder().encode(canonicalEmploymentManifest(manifest)));
      return encodeBase64(new Uint8Array(signature));
    }
    throw new Error('EMPLOYMENT_MANIFEST_ALGORITHM_UNSUPPORTED');
  }
  async function verifyEmploymentManifest(manifest) {
    validateEmploymentManifest(manifest);
    const cryptoApi = await getCrypto();
    if (manifest.algorithm === 'ECDSA-P256-SHA256') {
      let jwk; try { jwk = typeof manifest.public_key === 'string' ? JSON.parse(manifest.public_key) : manifest.public_key; } catch (_) { throw new Error('EMPLOYMENT_MANIFEST_PUBLIC_KEY_INVALID'); }
      let key; try { key = await cryptoApi.subtle.importKey('jwk', jwk, { name:'ECDSA', namedCurve:'P-256' }, false, ['verify']); } catch (_) { throw new Error('EMPLOYMENT_MANIFEST_PUBLIC_KEY_INVALID'); }
      let signature; try { signature = decodeBase64(manifest.signature); } catch (_) { throw new Error('EMPLOYMENT_MANIFEST_SIGNATURE_INVALID'); }
      const valid = await cryptoApi.subtle.verify({ name:'ECDSA', hash:'SHA-256' }, key, signature, new TextEncoder().encode(canonicalEmploymentManifest(manifest)));
      if (!valid) throw new Error('EMPLOYMENT_MANIFEST_SIGNATURE_INVALID');
    } else throw new Error('EMPLOYMENT_MANIFEST_ALGORITHM_UNSUPPORTED');
    return true;
  }
  async function createEmploymentManifest(resources) {
    const cryptoApi = await getCrypto();
    const keyPair = await cryptoApi.subtle.generateKey({ name:'ECDSA', namedCurve:'P-256' }, true, ['sign', 'verify']);
    const publicJwk = await cryptoApi.subtle.exportKey('jwk', keyPair.publicKey);
    const privateJwk = await cryptoApi.subtle.exportKey('jwk', keyPair.privateKey);
    const manifest = { manifest_version:1, resources:(resources || []).map(validateEmploymentResource), key_id:`local-${Date.now()}`, algorithm:'ECDSA-P256-SHA256', public_key:JSON.stringify(publicJwk), signature:'', created_at:new Date().toISOString() };
    manifest.signature = await signEmploymentManifest(manifest, privateJwk);
    return manifest;
  }

  function createAttachmentRepository(options) {
    const repo = options && options.repository ? options.repository : createRepository('attachments', options);
    const now = () => new Date().toISOString();
    async function digestBlob(blob) {
      try {
        if (global.crypto && global.crypto.subtle) {
          const bytes = await blob.arrayBuffer();
          const hash = await global.crypto.subtle.digest('SHA-256', bytes);
          return Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, '0')).join('');
        }
      } catch (_) {}
      return `${blob.type || 'application/octet-stream'}:${blob.size}`;
    }
    async function createThumbnail(blob, settings) {
      const source = blob instanceof Blob ? blob : new Blob([blob]);
      const options = Object.assign({ width: 320, height: 240, quality: .82, type: 'image/jpeg' }, settings || {});
      if (!/^image\//i.test(source.type) || typeof global.createImageBitmap !== 'function' || typeof global.OffscreenCanvas !== 'function') return source;
      try {
        const bitmap = await global.createImageBitmap(source);
        const scale = Math.min(options.width / bitmap.width, options.height / bitmap.height, 1);
        const canvas = new global.OffscreenCanvas(Math.max(1, Math.round(bitmap.width * scale)), Math.max(1, Math.round(bitmap.height * scale)));
        const context = canvas.getContext('2d');
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        if (typeof bitmap.close === 'function') bitmap.close();
        return canvas.convertToBlob({ type: options.type, quality: options.quality });
      } catch (_) { return source; }
    }
    return {
      ...repo,
      async add(input) {
        const blob = input.blob instanceof Blob ? input.blob : new Blob([input.blob], { type: input.mimeType || 'application/octet-stream' });
        const createdAt = input.created_at || now();
        const contentHash = input.content_hash || await digestBlob(blob);
        if (!input.allowDuplicate) {
          const duplicate = (await repo.list()).find(item => item.content_hash && item.content_hash === contentHash);
          if (duplicate) return clone(duplicate);
        }
        const id = String(input.id || `attachment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
        const record = { ...input, id, blob, size: blob.size, mimeType: blob.type || input.mimeType || '', content_hash: contentHash, schema_version: V4_SCHEMA_VERSION, created_at: createdAt, updated_at: input.updated_at || createdAt };
        if (/^image\//i.test(record.mimeType)) {
          const thumbnail = input.thumbnail instanceof Blob ? input.thumbnail : await createThumbnail(blob);
          if (thumbnail && thumbnail.size && thumbnail !== blob) {
            const thumbnailId = String(input.thumbnail_id || `${id}::thumbnail`);
            await repo.put({ id:thumbnailId, parent_id:id, is_thumbnail:true, name:`${record.name || id} thumbnail`, blob:thumbnail, size:thumbnail.size, mimeType:thumbnail.type || 'image/jpeg', content_hash:await digestBlob(thumbnail), schema_version:V4_SCHEMA_VERSION, created_at:createdAt, updated_at:createdAt });
            record.thumbnail_id = thumbnailId;
          }
        }
        return repo.put(record);
      },
      async batchImport(files, options) {
        const opts = Object.assign({ maxFileBytes: 50 * 1024 * 1024, maxBatchBytes: 500 * 1024 * 1024 }, options || {});
        const results = []; let total = 0;
        for (const file of Array.from(files || [])) {
          const blob = file instanceof Blob ? file : file && file.blob;
          if (!blob) continue;
          if (blob.size > opts.maxFileBytes || total + blob.size > opts.maxBatchBytes) throw new Error('ATTACHMENT_BATCH_LIMIT');
          total += blob.size;
          const record = await this.add({ id: file.id, student_id: file.student_id, name: file.name || '附件', blob, mimeType: blob.type || file.mimeType, allowDuplicate: opts.allowDuplicate });
          results.push(record);
          if (typeof opts.onProgress === 'function') opts.onProgress({ processed: results.length, total: Array.from(files || []).length, record });
        }
        return results;
      },
      createThumbnail,
      async findDuplicate(value) {
        const hash = typeof value === 'string' ? value : value && value.content_hash;
        if (!hash) return null;
        return (await repo.list()).find(item => item.content_hash === hash) || null;
      },
      async download(id, filename) {
        const record = await repo.get(id);
        if (!record) throw new Error('ATTACHMENT_NOT_FOUND');
        if (typeof document === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) return record.blob;
        const url = URL.createObjectURL(record.blob);
        const link = document.createElement('a'); link.href = url; link.download = filename || record.name || 'attachment'; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return true;
      },
      async findForStudent(studentId) {
        return (await repo.list()).filter(item => item.student_id === studentId);
      },
    };
  }

  global.CWB_V4 = Object.freeze({
    schemaVersion: V4_SCHEMA_VERSION,
    createRepository,
    createMemoryRepository,
    createAttachmentRepository,
    createChunkedImportController,
    matchPhotoFilename,
    partyChecklist,
    validatePartyTransition,
    validateEmploymentResource,
    validateEmploymentManifest,
    signEmploymentManifest,
    verifyEmploymentManifest,
    createEmploymentManifest,
    encryptBackup,
    decryptBackup,
  });
  if (typeof global.dispatchEvent === 'function' && typeof global.Event === 'function') {
    global.queueMicrotask ? global.queueMicrotask(() => global.dispatchEvent(new global.Event('cwb:v4-ready'))) : global.setTimeout(() => global.dispatchEvent(new global.Event('cwb:v4-ready')), 0);
  }
})(typeof window !== 'undefined' ? window : globalThis);
