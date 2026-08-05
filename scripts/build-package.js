const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const target = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, 'output', '辅导员工作台-v3.9.0');
fs.mkdirSync(target, { recursive:true });

const htmlTarget = path.join(target, '辅导员工作台.html');
const build = spawnSync(process.execPath, [path.join(root, 'scripts', 'build-release.js'), htmlTarget], {
  cwd:root, encoding:'utf8', stdio:'inherit',
});
if (build.status !== 0) process.exit(build.status || 1);

const copies = [
  ['README.md', 'README.md'],
  ['LICENSE', 'LICENSE'],
  ['vendor/xlsx.LICENSE', 'THIRD-PARTY-LICENSE-SheetJS.txt'],
  ['docs/辅导员工作台使用手册.md', '使用手册.md'],
  ['docs/数据格式与联动约定.md', '字段字典与数据约定.md'],
  ['docs/测试报告-v3.9.md', '测试报告.md'],
];
for (const [from, to] of copies) {
  const source = path.join(root, from);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(target, to));
}
const sampleSource = path.join(root, 'samples', 'import-compat');
const sampleTarget = path.join(target, '脱敏兼容样表');
fs.mkdirSync(sampleTarget, { recursive:true });
for (const entry of fs.readdirSync(sampleSource, { withFileTypes:true })) {
  if (entry.isFile()) fs.copyFileSync(path.join(sampleSource, entry.name), path.join(sampleTarget, entry.name));
}
const sampleCount = fs.readdirSync(sampleTarget).filter(name => /\.(csv|xls|xlsx)$/i.test(name)).length;
if (sampleCount < 10) throw new Error(`Release package requires at least 10 compatibility samples; found ${sampleCount}`);
console.log(`Release package created: ${target}`);
