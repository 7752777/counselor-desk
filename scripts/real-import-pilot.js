#!/usr/bin/env node
'use strict';

/*
 * Privacy-preserving import pilot. It reads spreadsheets in memory, replaces
 * cell values with deterministic synthetic values, and only writes hashes and
 * aggregate outcomes to the report. It is deliberately separate from the
 * release gate: a directory is not evidence of a distinct school/system.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('C:/Users/wby/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const xlsx = require('xlsx');

const EXTENSIONS = new Set(['.csv', '.xls', '.xlsx']);
const MAX_FILE_BYTES = 128 * 1024 * 1024;
const MAX_SHEETS_TO_INSPECT = 8;

function parseArgs(argv) {
  const roots = [];
  const directFiles = [];
  let output = '';
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--root' && argv[i + 1]) roots.push(path.resolve(argv[++i]));
    else if (argv[i] === '--file' && argv[i + 1]) directFiles.push(path.resolve(argv[++i]));
    else if (argv[i] === '--output' && argv[i + 1]) output = path.resolve(argv[++i]);
  }
  if ((!roots.length && !directFiles.length) || !output) throw new Error('Usage: node scripts/real-import-pilot.js --root <dir> [--root <dir>...] [--file <file>...] --output <report.json>');
  return { roots, directFiles, output };
}

function walk(dir, result = []) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return result; }
  for (const entry of entries) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'output', 'tmp', '.git'].includes(entry.name)) walk(file, result);
    } else if (EXTENSIONS.has(path.extname(entry.name).toLowerCase())) result.push(file);
  }
  return result;
}

function digest(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function norm(value) { return String(value ?? '').trim().toLowerCase().replace(/[\s_\-（）()\[\]【】]/g, ''); }
function formatFingerprint(headers, sheetNames, width) {
  return digest(JSON.stringify({ headers: headers.map(norm), sheets: sheetNames.slice(0, MAX_SHEETS_TO_INSPECT), width })).slice(0, 20);
}

function headerScore(header) {
  const value = norm(header);
  if (!value) return 0;
  let score = 0;
  if (/学号|student(number|no|id)?|xh/.test(value)) score += 5;
  if (/姓名|name|xm/.test(value)) score += 4;
  if (/班级|行政班|class|bj/.test(value)) score += 2;
  if (/身份证|证件号|idcard|身份证件/.test(value)) score += 2;
  if (/手机|电话|phone|tel|联系方式/.test(value)) score += 1;
  return score;
}

function findHeader(rows) {
  let best = { index: 0, score: -1, width: 0 };
  for (let i = 0; i < Math.min(rows.length, 30); i += 1) {
    const row = Array.isArray(rows[i]) ? rows[i] : [];
    const score = row.reduce((sum, cell) => sum + headerScore(cell), 0);
    const width = row.filter(cell => String(cell ?? '').trim()).length;
    if (score > best.score || (score === best.score && width > best.width)) best = { index: i, score, width };
  }
  return best;
}

function category(header) {
  const value = norm(header);
  if (/学号|student(number|no|id)?|xh/.test(value)) return 'student_number';
  if (/姓名|name|xm/.test(value)) return 'full_name';
  if (/身份证|证件号|idcard/.test(value)) return 'id_card';
  if (/手机|电话|phone|tel|联系方式/.test(value)) return 'phone';
  if (/性别|gender|sex/.test(value)) return 'gender';
  if (/日期|时间|date|birth|生日/.test(value)) return 'date';
  if (/成绩|分数|score|grade|绩点|gpa/.test(value)) return 'number';
  return 'text';
}

function syntheticCell(kind, fileHash, rowIndex, columnIndex) {
  const seed = `${fileHash}:${rowIndex}:${columnIndex}`;
  if (kind === 'student_number') return `PILOT-${fileHash.slice(0, 10)}-${String(rowIndex).padStart(5, '0')}`;
  if (kind === 'full_name') return `脱敏学生${rowIndex}`;
  if (kind === 'id_card') return `1101012000${String((rowIndex % 12) + 1).padStart(2, '0')}${String((rowIndex % 28) + 1).padStart(2, '0')}00${String(rowIndex % 1000).padStart(3, '0')}0`;
  if (kind === 'phone') return `138${String((rowIndex * 7919 + columnIndex * 31) % 100000000).padStart(8, '0')}`;
  if (kind === 'gender') return rowIndex % 2 ? '女' : '男';
  if (kind === 'date') return `202${rowIndex % 6}-0${(rowIndex % 9) + 1}-0${(rowIndex % 9) + 1}`;
  if (kind === 'number') return String((rowIndex * 17 + columnIndex) % 101);
  return `脱敏-${digest(seed).slice(0, 12)}`;
}

function buildSample(file) {
  const stat = fs.statSync(file);
  if (stat.size > MAX_FILE_BYTES) return { fileHash: digest(`${file}:${stat.size}:${stat.mtimeMs}`), ext: path.extname(file).toLowerCase(), status: 'failed', error_code: 'PILOT_FILE_TOO_LARGE' };
  const bytes = fs.readFileSync(file);
  const fileHash = digest(bytes);
  let workbook;
  try { workbook = xlsx.read(bytes, { type: 'buffer', cellDates: false, raw: false, codepage: 65001 }); }
  catch (error) { return { fileHash, ext: path.extname(file).toLowerCase(), status: 'failed', error_code: 'PILOT_PARSE_FAILED', error_detail: String(error.message || error).slice(0, 160) }; }
  const sheetNames = (workbook.SheetNames || []).slice(0, MAX_SHEETS_TO_INSPECT);
  const sheet = workbook.Sheets[sheetNames[0]];
  const rows = sheet ? xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false }) : [];
  const headerInfo = findHeader(rows);
  const originalHeaders = (rows[headerInfo.index] || []).map((value, index) => String(value ?? '').trim() || `custom_${index + 1}`);
  const looksLikeStudent = originalHeaders.some(value => headerScore(value) >= 4);
  if (!looksLikeStudent) return { fileHash, ext: path.extname(file).toLowerCase(), status: 'skipped', reason: 'NO_STUDENT_ID_OR_NAME_HEADER', rows: 0, columns: originalHeaders.length, format: formatFingerprint(originalHeaders, sheetNames, originalHeaders.length) };
  const header = originalHeaders.slice(0, 300);
  const dataRows = rows.slice(headerInfo.index + 1).filter(row => Array.isArray(row) && row.some(value => String(value ?? '').trim())).slice(0, 10000);
  const sanitized = [header, ...dataRows.map((_, rowIndex) => header.map((name, columnIndex) => syntheticCell(category(name), fileHash, rowIndex + 1, columnIndex)))];
  return { fileHash, ext: path.extname(file).toLowerCase(), status: 'ready', rows: dataRows.length, columns: header.length, format: formatFingerprint(header, sheetNames, header.length), csv: xlsx.utils.sheet_to_csv(xlsx.utils.aoa_to_sheet(sanitized)) };
}

async function main() {
  const { roots, directFiles, output } = parseArgs(process.argv);
  const files = [...roots.flatMap(root => walk(root)), ...directFiles.filter(file => EXTENSIONS.has(path.extname(file).toLowerCase()))];
  const seen = new Set();
  const samples = [];
  for (const file of files) {
    let sample;
    try { sample = buildSample(file); } catch (error) { sample = { fileHash: digest(file), ext: path.extname(file).toLowerCase(), status: 'failed', error_code: 'PILOT_READ_FAILED', error_detail: String(error.message || error).slice(0, 160) }; }
    if (seen.has(sample.fileHash)) continue;
    seen.add(sample.fileHash);
    if (sample.csv) sample._csv = sample.csv;
    sample._sourceFile = file;
    delete sample.csv;
    samples.push({ ...sample, source_group: roots.find(root => file.startsWith(root)) ? digest(roots.find(root => file.startsWith(root))).slice(0, 12) : 'unknown' });
  }

  const executablePath = [process.env.CHROME_BIN, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean).find(fs.existsSync);
  if (!executablePath) throw new Error('PILOT_BROWSER_NOT_FOUND');
  const browser = await chromium.launch({ headless: true, executablePath });

  for (const sample of samples.filter(item => item.status === 'ready')) {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(`file://${path.resolve('output/v4-preview.html').replace(/\\/g, '/')}`);
      await page.waitForFunction(() => document.documentElement.dataset.v4Ready === 'true');
      const result = await page.evaluate(async payload => {
        const preview = window.CWB.importer.previewCSV(payload.csv, 'students', { fileHash: payload.fileHash });
        if (!preview || preview.errors?.length) return { status: 'failed', error_code: 'PILOT_PREVIEW_FAILED', error_count: preview?.errors?.length || 0 };
        const committed = await window.CWB.importer.commitPreviewAsync(preview.id, { confirmSensitive: true, chunkSize: 500, skipInvalid: true, conflictPolicy: 'skip' });
        return committed && committed.ok ? { status: 'success', added: committed.added || 0, skipped: committed.skipped || 0 } : { status: 'failed', error_code: committed?.error || 'PILOT_COMMIT_FAILED' };
      }, { csv: sample._csv, fileHash: sample.fileHash });
      sample.status = result.status;
      if (result.added != null) sample.added = result.added;
      if (result.skipped != null) sample.skipped = result.skipped;
      if (result.error_code) sample.error_code = String(result.error_code).slice(0, 120);
    } catch (error) { sample.status = 'failed'; sample.error_code = 'PILOT_BROWSER_FLOW_FAILED'; sample.error_detail = String(error.message || error).slice(0, 160); }
    finally { await context.close(); }
  }
  await browser.close();
  const eligible = samples.filter(sample => sample.status === 'success' || sample.status === 'failed');
  const successful = samples.filter(sample => sample.status === 'success').length;
  const formats = [...new Set(eligible.map(sample => sample.format).filter(Boolean))].sort();
  const report = {
    report_version: 1,
    generated_at: new Date().toISOString(),
    privacy: { raw_values_stored: false, raw_headers_stored: false, file_names_stored: false, source_hashes_only: true },
    sample_count: eligible.length,
    success_count: successful,
    failure_count: eligible.length - successful,
    success_rate_percent: eligible.length ? Number(((successful / eligible.length) * 100).toFixed(3)) : 0,
    format_count: formats.length,
    distinct_source_groups: [...new Set(samples.map(sample => sample.source_group))].length,
    skipped_non_student_files: samples.filter(sample => sample.status === 'skipped').length,
    parse_or_size_failures: samples.filter(sample => sample.status === 'failed' && !sample.error_code?.startsWith('PILOT_BROWSER')).length,
    criteria: { min_samples: 100, min_formats: 20, min_verified_schools_or_systems: 20, target_success_rate_percent: 99.7 },
    status: 'not_ready',
    reasons: ['format_count is a content fingerprint count, not proof of 20 distinct schools or systems', 'a human-reviewed sample provenance register is required before this can qualify as an operational metric'],
    samples: samples.map(({ csv, _csv, _sourceFile, ...sample }) => sample),
  };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const temp = `${output}.tmp-${process.pid}`;
  fs.writeFileSync(temp, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.renameSync(temp, output);
  console.log(JSON.stringify({ ...report, samples: undefined }, null, 2));
}

main().catch(error => { console.error(error.stack || error.message || error); process.exit(1); });
