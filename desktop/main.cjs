const { app, BrowserWindow, dialog, ipcMain, safeStorage, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { createSqliteStore } = require('./sqlite-store.cjs');

const APP_VERSION = '4.0.0';
let mainWindow;
let sqliteStore;
let vaultKeyCache;

const ALLOWED_COLLECTIONS = new Set([
  'records_students', 'records_tasks', 'records_talks', 'records_stay', 'records_leave',
  'records_honor', 'records_pleave', 'records_attend', 'records_node', 'records_warn',
  'records_help', 'records_grant', 'records_focus', 'records_psych', 'records_graduate',
  'records_policy', 'records_material', 'records_comp', 'records_tpl',
  'records_learning_materials', 'records_learning_notes', 'records_learning_sessions',
  'records_custom_v4_positions', 'records_custom_v4_party_cases', 'records_custom_v4_files',
  'records_custom_v4_employment_resources', 'attachments', 'import_jobs', 'audit_log', 'meta',
]);
function validateCollection(collection) {
  const value = String(collection || '');
  if (!ALLOWED_COLLECTIONS.has(value)) throw new Error('REPOSITORY_COLLECTION_NOT_ALLOWED');
  return value;
}
function validateRecordId(id) {
  const value = String(id || '');
  if (!value || value.length > 240 || /[\x00-\x1f]/.test(value)) throw new Error('REPOSITORY_ID_INVALID');
  return value;
}
function validateAttachmentId(id) { return validateRecordId(id); }

function userDataPath(...parts) { return path.join(app.getPath('userData'), ...parts); }
async function ensureDir(dir) { await fs.mkdir(dir, { recursive: true }); return dir; }
function safeFileName(value, fallback) {
  const cleaned = String(value || fallback).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\.\.+/g, '_').trim();
  return cleaned || fallback;
}

async function getVaultKey() {
  if (vaultKeyCache) return vaultKeyCache;
  if (!safeStorage.isEncryptionAvailable()) throw new Error('SAFE_STORAGE_UNAVAILABLE');
  const keyPath = userDataPath('vault', 'key.bin');
  await ensureDir(path.dirname(keyPath));
  try {
    const stored = await fs.readFile(keyPath);
    vaultKeyCache = safeStorage.decryptString(stored);
    if (!vaultKeyCache || Buffer.from(vaultKeyCache, 'base64').length !== 32) throw new Error('VAULT_KEY_INVALID');
    return vaultKeyCache;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const raw = crypto.randomBytes(32).toString('base64');
    const encoded = safeStorage.encryptString(raw);
    try {
      await fs.writeFile(keyPath, encoded, { flag: 'wx' });
      vaultKeyCache = raw;
      return raw;
    } catch (writeError) {
      // Multiple IPC requests can initialize the vault concurrently. If a
      // sibling request won the first-create race, load that key instead of
      // surfacing a spurious EEXIST failure to the renderer.
      if (writeError.code !== 'EEXIST') throw writeError;
      const stored = await fs.readFile(keyPath);
      const existing = safeStorage.decryptString(stored);
      if (!existing || Buffer.from(existing, 'base64').length !== 32) throw new Error('VAULT_KEY_INVALID');
      vaultKeyCache = existing;
      return existing;
    }
  }
}
async function writeMainAudit(action, details) {
  if (!sqliteStore) return;
  try { await getVaultKey(); sqliteStore.put('audit_log', { id:`audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`, action, details:details || {}, operator:'desktop-main', operated_at:new Date().toISOString(), schema_version:7 }); } catch (_) {}
}

function encryptBuffer(buffer, keyText) {
  const key = crypto.createHash('sha256').update(keyText).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([Buffer.from('CWB4'), iv, cipher.getAuthTag(), ciphertext]);
}

function decryptBuffer(buffer, keyText) {
  if (buffer.subarray(0, 4).toString() !== 'CWB4') throw new Error('ATTACHMENT_FORMAT_INVALID');
  const key = crypto.createHash('sha256').update(keyText).digest();
  const iv = buffer.subarray(4, 16);
  const tag = buffer.subarray(16, 32);
  const ciphertext = buffer.subarray(32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

async function createWindow() {
  sqliteStore = createSqliteStore(userDataPath('counselor-v4.sqlite'), () => vaultKeyCache || 'uninitialized-vault-key');
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#eef2f8',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // The renderer is a local application surface; never let untrusted content
    // navigate it and inherit the preload/IPC bridge.
    if (!url.startsWith('file://')) event.preventDefault();
  });
  await mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
}

ipcMain.handle('desktop:choose-backup-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory', 'createDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('desktop:save-backup', async (_event, envelope, requestedFolder) => {
  if (!envelope || envelope.format !== 'cwbk' || Number(envelope.version) !== 7 || typeof envelope.ciphertext !== 'string' || typeof envelope.integrity !== 'string') throw new Error('BACKUP_ENVELOPE_INVALID');
  const folder = requestedFolder || (await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory', 'createDirectory'] })).filePaths[0];
  if (!folder) return { saved: false, reason: 'cancelled' };
  const resolved = path.resolve(folder);
  await ensureDir(resolved);
  const filename = safeFileName(`辅导员工作台-v${APP_VERSION}-${new Date().toISOString().replace(/[:.]/g, '-')}.cwbk`, 'backup.cwbk');
  const temp = path.join(resolved, `.${filename}.tmp`);
  const target = path.join(resolved, filename);
  const serialized = JSON.stringify(envelope);
  if (Buffer.byteLength(serialized, 'utf8') > 1024 * 1024 * 1024) throw new Error('BACKUP_FILE_TOO_LARGE');
  await fs.writeFile(temp, serialized, { encoding: 'utf8', flag: 'wx' });
  const handle = await fs.open(temp, 'r+');
  try { await handle.sync(); } finally { await handle.close(); }
  await fs.rename(temp, target);
  await writeMainAudit('backup_saved', { path:target });
  return { saved: true, path: target };
});

ipcMain.handle('desktop:open-backup', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters: [{ name: 'CWB encrypted backup', extensions: ['cwbk', 'json'] }] });
  if (result.canceled) return null;
  const filePath = result.filePaths[0];
  const stat = await fs.stat(filePath);
  if (!stat.isFile() || stat.size > 1024 * 1024 * 1024) throw new Error('BACKUP_FILE_TOO_LARGE');
  let text;
  try { text = await fs.readFile(filePath, 'utf8'); } catch (_) { throw new Error('BACKUP_FILE_READ_FAILED'); }
  try { return JSON.parse(text); } catch (_) { throw new Error('BACKUP_FILE_INVALID'); }
});

ipcMain.handle('desktop:get-vault-status', async () => ({ available: safeStorage.isEncryptionAvailable(), root: userDataPath('vault') }));
ipcMain.handle('desktop:set-backup-secret', async (_event, secret) => {
  if (!secret || String(secret).length < 8 || !safeStorage.isEncryptionAvailable()) return false;
  const file = userDataPath('vault', 'backup-secret.bin');
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, safeStorage.encryptString(String(secret)), { flag: 'w' });
  return true;
});
ipcMain.handle('desktop:get-backup-secret', async () => {
  if (!safeStorage.isEncryptionAvailable()) return null;
  try { return safeStorage.decryptString(await fs.readFile(userDataPath('vault', 'backup-secret.bin'))); } catch (_) { return null; }
});
ipcMain.handle('desktop:prune-backups', async (_event, folder, retain) => {
  if (!folder || typeof folder !== 'string') return 0;
  const resolved = path.resolve(folder);
  const keep = Math.max(1, Math.min(100, Number(retain) || 8));
  const entries = (await fs.readdir(resolved, { withFileTypes: true })).filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.cwbk')).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries.slice(0, Math.max(0, entries.length - keep))) await fs.rm(path.join(resolved, entry.name), { force: true });
  return Math.min(entries.length, keep);
});

ipcMain.handle('desktop:repository-list', async (_event, collection) => {
  if (!sqliteStore) return null;
  collection = validateCollection(collection);
  await getVaultKey();
  return sqliteStore.list(collection);
});
ipcMain.handle('desktop:repository-get', async (_event, collection, id) => {
  if (!sqliteStore) return null;
  collection = validateCollection(collection); id = validateRecordId(id);
  await getVaultKey();
  return sqliteStore.get(collection, id);
});
ipcMain.handle('desktop:repository-put', async (_event, collection, record) => {
  if (!sqliteStore) return null;
  collection = validateCollection(collection);
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('REPOSITORY_RECORD_INVALID');
  if (JSON.stringify(record).length > 2 * 1024 * 1024) throw new Error('REPOSITORY_RECORD_TOO_LARGE');
  await getVaultKey();
  return sqliteStore.put(collection, record);
});
ipcMain.handle('desktop:repository-put-many', async (_event, collection, records) => {
  if (!sqliteStore) return [];
  collection = validateCollection(collection);
  if (!Array.isArray(records) || records.length > 20000) throw new Error('REPOSITORY_RECORDS_INVALID');
  if (JSON.stringify(records).length > 20 * 1024 * 1024) throw new Error('REPOSITORY_BATCH_TOO_LARGE');
  for (const record of records) { if (!record || typeof record !== 'object' || Array.isArray(record) || !record.id) throw new Error('REPOSITORY_RECORD_INVALID'); if (JSON.stringify(record).length > 2 * 1024 * 1024) throw new Error('REPOSITORY_RECORD_TOO_LARGE'); }
  await getVaultKey();
  return sqliteStore.putMany(collection, records);
});
ipcMain.handle('desktop:repository-replace-many-atomic', async (_event, collection, records) => {
  if (!sqliteStore) return [];
  collection = validateCollection(collection);
  if (!Array.isArray(records) || records.length > 20000) throw new Error('REPOSITORY_RECORDS_INVALID');
  if (JSON.stringify(records).length > 20 * 1024 * 1024) throw new Error('REPOSITORY_BATCH_TOO_LARGE');
  for (const record of records) if (!record || typeof record !== 'object' || Array.isArray(record) || !record.id || JSON.stringify(record).length > 2 * 1024 * 1024) throw new Error('REPOSITORY_RECORD_INVALID');
  await getVaultKey();
  return sqliteStore.replaceManyAtomic(collection, records);
});
ipcMain.handle('desktop:repository-delete', async (_event, collection, id) => {
  if (!sqliteStore) return false;
  collection = validateCollection(collection); id = validateRecordId(id);
  await getVaultKey();
  return sqliteStore.delete(collection, id);
});
ipcMain.handle('desktop:repository-count', async (_event, collection) => {
  if (!sqliteStore) return 0;
  collection = validateCollection(collection);
  await getVaultKey();
  return sqliteStore.count(collection);
});

ipcMain.handle('desktop:write-attachment', async (_event, input) => {
  if (!input || !input.id || !input.bytes) throw new Error('ATTACHMENT_INPUT_INVALID');
  input.id = validateAttachmentId(input.id);
  const key = await getVaultKey();
  const dir = await ensureDir(userDataPath('vault', 'attachments'));
  const target = path.join(dir, safeFileName(input.id, 'attachment.bin') + '.bin');
  const bytes = Buffer.from(input.bytes);
  if (bytes.length > 50 * 1024 * 1024) throw new Error('ATTACHMENT_SIZE_LIMIT');
  await fs.writeFile(target, encryptBuffer(bytes, key), { flag: 'w' });
  await writeMainAudit('attachment_write', { id:input.id, size:bytes.length });
  return { id: input.id, path: target, size: bytes.length, mimeType: input.mimeType || 'application/octet-stream' };
});

ipcMain.handle('desktop:read-attachment', async (_event, id) => {
  id = validateAttachmentId(id);
  const key = await getVaultKey();
  const target = path.join(userDataPath('vault', 'attachments'), safeFileName(id, 'attachment.bin') + '.bin');
  const encrypted = await fs.readFile(target);
  return decryptBuffer(encrypted, key);
});
ipcMain.handle('desktop:delete-attachment', async (_event, id) => {
  id = validateAttachmentId(id);
  const target = path.join(userDataPath('vault', 'attachments'), safeFileName(id, 'attachment.bin') + '.bin');
  try { await fs.rm(target, { force: true }); await writeMainAudit('attachment_delete', { id }); return true; } catch (_) { return false; }
});

ipcMain.handle('desktop:open-external', async (_event, url) => {
  const parsed = new URL(String(url));
  if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('EXTERNAL_URL_INVALID');
  await shell.openExternal(parsed.toString());
  return true;
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (sqliteStore) sqliteStore.close(); if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
