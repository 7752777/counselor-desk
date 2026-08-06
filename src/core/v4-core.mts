/**
 * Shared v4 data contracts. This module intentionally has no DOM dependency so
 * the Electron renderer and the single-file web build can use the same rules.
 */

export const V4_SCHEMA_VERSION = 7;

const STUDENT_FIELDS: Record<string, string[]> = {
  student_number: ['学号', '学生学号', '学籍号', 'student number', 'student_number'],
  full_name: ['姓名', '学生姓名', '真实姓名', 'full name', 'name'],
  gender: ['性别', 'gender'],
  class_name: ['班级', '行政班', '班级名称', 'class', 'class_name'],
  major_name: ['专业', '专业名称', 'major', 'major_name'],
  grade: ['年级', '入学年份', 'grade'],
  college_name: ['学院', '院系', 'college', 'college_name'],
  counselor_name: ['辅导员', '辅导员姓名', 'counselor', 'counselor_name'],
  enrollment_status: ['学籍状态', '学生状态', '在校状态', 'enrollment status'],
  politics: ['政治面貌', '政治身份', 'politics'],
  phone: ['手机号', '手机号码', '联系电话', '本人电话', 'phone'],
  dorm: ['宿舍', '宿舍号', '寝室', 'dorm'],
  birthday: ['出生日期', '生日', 'birthday'],
  hometown: ['生源地', '籍贯', '户籍地', 'hometown'],
  home_addr: ['家庭住址', '家庭地址', '住址', 'home address', 'home_addr'],
  parent_name: ['家长姓名', '父母姓名', '监护人姓名', 'parent name'],
  parent_phone: ['家长电话', '家长联系电话', '监护人电话', 'parent phone'],
  nation: ['民族', 'nation'],
  id_card: ['身份证', '身份证号', '身份证号码', '证件号码', 'id card', 'id_card'],
  email: ['邮箱', '电子邮箱', 'email'],
  qq: ['QQ', 'qq'],
  edu_years: ['学制', '修业年限', 'edu years'],
  dorm_building: ['楼栋', '宿舍楼', '公寓楼', 'building'],
  dorm_room: ['房间号', '寝室号', 'room'],
  academic_score: ['学业成绩', '平均分', '绩点', '成绩', 'academic score'],
  credits: ['学分', '已修学分', 'credits'],
  class_rank: ['班级排名', '班排名', 'class rank'],
  enrollment_date: ['入学日期', '入学时间', 'enrollment date'],
  graduation_date: ['毕业日期', '预计毕业', 'graduation date'],
  emergency_contact: ['紧急联系人', '应急联系人', 'emergency contact'],
  emergency_phone: ['紧急联系电话', '应急电话', 'emergency phone'],
  note: ['备注', '说明', 'note'],
};

const CANONICAL_KEYS = new Map<string, string>();
for (const [field, aliases] of Object.entries(STUDENT_FIELDS)) {
  for (const alias of aliases) CANONICAL_KEYS.set(normalizeHeader(alias), field);
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_\-()（）【】\[\]：:·.]/g, '');
}

export type StudentV40 = {
  id: string;
  schema_version: number;
  student_number: string;
  full_name: string;
  photo_ids: string[];
  custom_fields: Record<string, unknown>;
  custom_field_meta: Record<string, { type: string; sensitive: boolean }>;
  [key: string]: unknown;
};

export function normalizeStudentV40(input: Record<string, unknown> = {}): StudentV40 {
  const now = new Date().toISOString();
  const known = new Set(Object.keys(STUDENT_FIELDS));
  const custom = { ...(input.custom_fields as Record<string, unknown> || {}) };
  const customMeta = { ...(input.custom_field_meta as Record<string, { type: string; sensitive: boolean }> || {}) };
  for (const [key, value] of Object.entries(input)) {
    if (!known.has(key) && !['id', 'schema_version', 'photo_ids', 'custom_fields', 'custom_field_meta', 'created_at', 'updated_at'].includes(key)) {
      custom[key] = value;
      customMeta[key] = customMeta[key] || { type: Array.isArray(value) ? 'array' : typeof value, sensitive: /身份证|证件|电话|手机|地址|心理|政治|照片/i.test(key) };
    }
  }
  return {
    ...input,
    id: String(input.id || `stu_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`),
    schema_version: V4_SCHEMA_VERSION,
    student_number: String(input.student_number || '').trim(),
    full_name: String(input.full_name || input.name || '').trim(),
    photo_ids: Array.isArray(input.photo_ids) ? input.photo_ids.map(String) : [],
    custom_fields: custom,
    custom_field_meta: customMeta,
    created_at: input.created_at || now,
    updated_at: input.updated_at || now,
  } as StudentV40;
}

export function mapStudentHeader(header: unknown): string {
  const raw = String(header ?? '').trim();
  const normalized = normalizeHeader(raw);
  const exact = CANONICAL_KEYS.get(normalized);
  if (exact) return exact;
  if (normalized.includes('家长') && normalized.includes('电话')) return 'parent_phone';
  if (normalized.includes('身份证')) return 'id_card';
  if (normalized.includes('手机号') || normalized.includes('手机')) return 'phone';
  if (normalized.includes('学号')) return 'student_number';
  if (normalized.includes('姓名')) return 'full_name';
  if (!raw) return '';
  return `custom_fields${raw}`;
}

export function chunkRows<T>(rows: readonly T[], chunkSize = 500): T[][] {
  const size = Math.max(1, Math.floor(chunkSize));
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) chunks.push(rows.slice(index, index + size));
  return chunks;
}

export type ImportJob = {
  id: string;
  schema_version: number;
  fileHash: string;
  totalRows: number;
  chunkSize: number;
  lastRow: number;
  status: 'pending' | 'running' | 'completed' | 'cancelled' | 'failed';
  updatedAt: string;
};

export function createImportJob(input: { fileHash: string; totalRows: number; chunkSize?: number }): ImportJob {
  return {
    id: `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    schema_version: V4_SCHEMA_VERSION,
    fileHash: input.fileHash,
    totalRows: Math.max(0, Math.floor(input.totalRows)),
    chunkSize: Math.max(1, Math.floor(input.chunkSize || 500)),
    lastRow: 0,
    status: input.totalRows === 0 ? 'completed' : 'pending',
    updatedAt: new Date().toISOString(),
  };
}

export function advanceImportJob(job: ImportJob, processedRows: number): ImportJob {
  const lastRow = Math.min(job.totalRows, Math.max(job.lastRow, job.lastRow + Math.max(0, Math.floor(processedRows))));
  return {
    ...job,
    lastRow,
    status: lastRow >= job.totalRows ? 'completed' : 'running',
    updatedAt: new Date().toISOString(),
  };
}

async function getWebCrypto(): Promise<Crypto> {
  if (globalThis.crypto?.subtle) return globalThis.crypto;
  const nodeCrypto = await import('node:crypto');
  return nodeCrypto.webcrypto as unknown as Crypto;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

export type BackupEnvelope = {
  format: 'cwbk';
  version: 7;
  kdf: 'argon2id' | 'pbkdf2-sha256';
  time?: number;
  memory?: number;
  parallelism?: number;
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
  integrity: string;
  created_at: string;
  compatibility?: boolean;
};

async function deriveBackupKey(password: string, salt: Uint8Array, parameters: Partial<BackupEnvelope>): Promise<CryptoKey> {
  const cryptoApi = await getWebCrypto();
  const argon2Api = (globalThis as typeof globalThis & { argon2?: { hash: Function; ArgonType: { Argon2id: number } } }).argon2;
  if (parameters.kdf === 'argon2id') {
    if (!argon2Api) throw new Error('ARGON2_UNAVAILABLE');
    const result = await argon2Api.hash({ pass: password, salt, time: parameters.time || 3, mem: parameters.memory || 65536, parallelism: parameters.parallelism || 1, hashLen: 32, type: argon2Api.ArgonType.Argon2id });
    const material = await cryptoApi.subtle.importKey('raw', result.hash, 'HKDF', false, ['deriveKey']);
    return cryptoApi.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt, info: new TextEncoder().encode('CWB v7 backup AES-256-GCM') }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  const iterations = Number(parameters.iterations) || 240000;
  const material = await cryptoApi.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return cryptoApi.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptBackup(data: unknown, password: string): Promise<BackupEnvelope> {
  if (typeof password !== 'string' || password.length < 8) throw new Error('BACKUP_PASSWORD_TOO_SHORT');
  const cryptoApi = await getWebCrypto();
  const salt = cryptoApi.getRandomValues(new Uint8Array(16));
  const iv = cryptoApi.getRandomValues(new Uint8Array(12));
  const argon2Api = (globalThis as typeof globalThis & { argon2?: unknown }).argon2;
  if (!argon2Api) throw new Error('ARGON2_UNAVAILABLE');
  const parameters: Partial<BackupEnvelope> = { kdf: 'argon2id', time: 3, memory: 65536, parallelism: 1 };
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const key = await deriveBackupKey(password, salt, parameters);
  const encrypted = new Uint8Array(await cryptoApi.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext));
  const integrityBuffer = await cryptoApi.subtle.digest('SHA-256', encrypted);
  return {
    format: 'cwbk', version: 7, ...parameters, iterations: Number(parameters.iterations || 0),
    salt: bytesToBase64(salt), iv: bytesToBase64(iv), ciphertext: bytesToBase64(encrypted),
    integrity: bytesToBase64(new Uint8Array(integrityBuffer)), created_at: new Date().toISOString(),
  };
}

export async function decryptBackup<T = unknown>(envelope: BackupEnvelope, password: string): Promise<T> {
  if (!envelope || envelope.format !== 'cwbk' || envelope.version !== 7) throw new Error('BACKUP_FORMAT_UNSUPPORTED');
  if (envelope.kdf !== 'argon2id' && !(envelope.kdf === 'pbkdf2-sha256' && envelope.compatibility === true)) throw new Error('ARGON2_REQUIRED_FOR_V7');
  const cryptoApi = await getWebCrypto();
  const ciphertext = base64ToBytes(envelope.ciphertext);
  const expectedHash = bytesToBase64(new Uint8Array(await cryptoApi.subtle.digest('SHA-256', ciphertext)));
  if (expectedHash !== envelope.integrity) throw new Error('BACKUP_INTEGRITY_FAILED');
  try {
    const key = await deriveBackupKey(password, base64ToBytes(envelope.salt), envelope);
    const plaintext = await cryptoApi.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(envelope.iv) }, key, ciphertext);
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch (error) {
    throw new Error('BACKUP_PASSWORD_INVALID', { cause: error });
  }
}

const PARTY_STEP_TEMPLATES = [
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

export type PartyCaseV40 = {
  id: string;
  schema_version: number;
  student_number: string;
  stage: string;
  rule_version: string;
  custom_steps?: Array<Record<string, unknown>>;
  steps: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
};

export function normalizePartyCase(input: Record<string, unknown> = {}): PartyCaseV40 {
  const now = new Date().toISOString();
  const existing = new Map(((input.steps as Array<Record<string, unknown>>) || []).map(step => [step.key, step]));
  const customSteps = ((input.custom_steps as Array<Record<string, unknown>>) || []).map((step, index) => ({
    key: String(step.key || `school_step_${index + 1}`),
    stage: String(step.stage || 'school_extra'),
    label: String(step.label || '').trim(),
    required: false,
    custom: true,
  })).filter(step => step.label);
  const steps = PARTY_STEP_TEMPLATES.concat(customSteps).map(template => ({
    ...template,
    status: existing.get(template.key)?.status || 'pending',
    completed_at: existing.get(template.key)?.completed_at || '',
    material_ids: existing.get(template.key)?.material_ids || [],
  }));
  return {
    ...input,
    id: String(input.id || `party_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
    schema_version: V4_SCHEMA_VERSION,
    student_number: String(input.student_number || ''),
    stage: String(input.stage || 'party_applicant'),
    rule_version: String(input.rule_version || '2026-05-11'),
    custom_steps: customSteps,
    steps,
    created_at: input.created_at || now,
    updated_at: input.updated_at || now,
  } as PartyCaseV40;
}

export const studentFieldAliases = Object.freeze(STUDENT_FIELDS);

export type EmploymentResource = {
  id: string;
  title: string;
  region: string;
  industry: string;
  organizer: string;
  url: string;
  verified_at: string;
  status: '有效' | '待核验' | '失效';
};

export type EmploymentResourceProvider = {
  list(): Promise<EmploymentResource[]>;
  add(resource: EmploymentResource): Promise<EmploymentResource>;
  remove(id: string): Promise<boolean>;
  importManifest(manifest: { manifest_version: number; resources: EmploymentResource[]; key_id: string; algorithm: string; public_key: string; signature: string; created_at: string }): Promise<number>;
  exportManifest(): Promise<{ manifest_version: number; resources: EmploymentResource[]; key_id: string; algorithm: string; public_key: string; signature: string; created_at: string }>;
};

export function validateEmploymentResource(resource: Partial<EmploymentResource>): EmploymentResource {
  const url = String(resource.url || '').trim();
  if (!/^https?:\/\//i.test(url)) throw new Error('EMPLOYMENT_URL_MUST_BE_HTTPS_OR_HTTP');
  return {
    id: String(resource.id || `employment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
    title: String(resource.title || '').trim(),
    region: String(resource.region || '全国').trim(),
    industry: String(resource.industry || '综合').trim(),
    organizer: String(resource.organizer || '').trim(),
    url,
    verified_at: String(resource.verified_at || '').trim(),
    status: resource.status === '失效' || resource.status === '待核验' ? resource.status : '有效',
  };
}
