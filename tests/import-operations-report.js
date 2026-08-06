const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const node = process.execPath;
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cwb-import-report-'));
const input = path.join(temp, 'manifest.json');
const output = path.join(temp, 'report.json');
const samples = Array.from({ length: 100 }, (_, index) => ({
  sample_id: `fixture-${index + 1}`,
  school_format: `format-${(index % 20) + 1}`,
  status: 'success',
  rows: index === 0 ? 5000 : 100,
}));
fs.writeFileSync(input, JSON.stringify({ manifest_version: 1, samples }), 'utf8');

const result = spawnSync(node, [path.join(root, 'scripts/import-operations-report.js'), '--input', input, '--output', output], { cwd: root, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr || result.stdout);
const report = JSON.parse(fs.readFileSync(output, 'utf8'));
assert.equal(report.status, 'qualified');
assert.equal(report.sample_count, 100);
assert.equal(report.format_count, 20);
assert.equal(report.success_rate_percent, 100);
assert.match(report.source_manifest_sha256, /^[a-f0-9]{64}$/);
assert.equal(report.criteria.min_samples, 100);
assert.equal(report.criteria.min_formats, 20);
assert.equal(report.criteria.target_success_rate_percent, 99.7);

const insufficientInput = path.join(temp, 'insufficient.json');
const insufficientOutput = path.join(temp, 'insufficient-report.json');
fs.writeFileSync(insufficientInput, JSON.stringify({ samples: [{ sample_id: 'only-one', school_format: 'format-1', status: 'success' }] }), 'utf8');
const insufficient = spawnSync(node, [path.join(root, 'scripts/import-operations-report.js'), '--input', insufficientInput, '--output', insufficientOutput], { cwd: root, encoding: 'utf8' });
assert.equal(insufficient.status, 2);
assert.equal(JSON.parse(fs.readFileSync(insufficientOutput, 'utf8')).status, 'not_ready');
console.log('PASS import-operations-report');
