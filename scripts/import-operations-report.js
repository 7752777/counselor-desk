#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function usage() {
  console.error('Usage: node scripts/import-operations-report.js --input <脱敏样本清单.json> --output <报告.json>');
}

function args(argv) {
  const result = {};
  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) continue;
    result[key.slice(2)] = argv[index + 1];
    index += 1;
  }
  return result;
}

function readSamples(inputPath) {
  const raw = fs.readFileSync(inputPath);
  const value = JSON.parse(raw.toString('utf8'));
  const samples = Array.isArray(value) ? value : value && value.samples;
  if (!Array.isArray(samples)) throw new Error('SAMPLE_MANIFEST_MUST_CONTAIN_SAMPLES_ARRAY');
  return { raw, samples };
}

function isSuccess(sample) {
  return sample && (sample.status === 'success' || sample.status === 'passed' || sample.ok === true || sample.imported === true);
}

function buildReport(inputPath, raw, samples) {
  const formats = [...new Set(samples.map(sample => String(sample && (sample.school_format || sample.system_format || sample.format) || '').trim()).filter(Boolean))].sort();
  const successCount = samples.filter(isSuccess).length;
  const failureCount = samples.length - successCount;
  const rate = samples.length ? (successCount / samples.length) * 100 : 0;
  const criteria = { min_samples: 100, min_formats: 20, target_success_rate_percent: 99.7 };
  const enoughSamples = samples.length >= criteria.min_samples;
  const enoughFormats = formats.length >= criteria.min_formats;
  const meetsRate = rate >= criteria.target_success_rate_percent;
  const status = enoughSamples && enoughFormats && meetsRate ? 'qualified' : 'not_ready';
  const reasons = [];
  if (!enoughSamples) reasons.push(`样本数不足：${samples.length}/${criteria.min_samples}`);
  if (!enoughFormats) reasons.push(`学校或系统格式不足：${formats.length}/${criteria.min_formats}`);
  if (!meetsRate) reasons.push(`成功率不足：${rate.toFixed(3)}%/${criteria.target_success_rate_percent}%`);
  return {
    report_version: 1,
    generated_at: new Date().toISOString(),
    source_manifest: path.basename(inputPath),
    source_manifest_sha256: crypto.createHash('sha256').update(raw).digest('hex'),
    sample_count: samples.length,
    success_count: successCount,
    failure_count: failureCount,
    success_rate_percent: Number(rate.toFixed(3)),
    format_count: formats.length,
    formats,
    criteria,
    status,
    reasons,
    disclaimer: '仅当 status=qualified 且样本来自真实脱敏试点时，才可用于对外发布导入成功率；脚本样例不构成运营证据。',
  };
}

function atomicWrite(file, value) {
  const absolute = path.resolve(file);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  const temporary = `${absolute}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  fs.renameSync(temporary, absolute);
}

const options = args(process.argv);
if (!options.input || !options.output) {
  usage();
  process.exitCode = 2;
} else {
  try {
    const { raw, samples } = readSamples(options.input);
    const report = buildReport(options.input, raw, samples);
    atomicWrite(options.output, report);
    console.log(JSON.stringify(report, null, 2));
    if (report.status !== 'qualified') process.exitCode = 2;
  } catch (error) {
    console.error(`Import operations report failed: ${error.message || error}`);
    process.exitCode = 1;
  }
}
