const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'index.html');
const xlsxSource = path.join(root, 'vendor', 'xlsx.full.min.js');
const argon2Source = path.join(root, 'vendor', 'argon2-bundled.min.js');
const jszipSource = path.join(root, 'vendor', 'jszip.min.js');
const echartsSource = path.join(root, 'vendor', 'echarts.min.js');
const v4RuntimeSource = path.join(root, 'src', 'core', 'v4-runtime.js');
const importWorkerSource = path.join(root, 'src', 'core', 'import-worker.js');
const target = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, 'output', '辅导员工作台.html');

fs.mkdirSync(path.dirname(target), { recursive:true });
const html = fs.readFileSync(source, 'utf8');
const xlsx = fs.readFileSync(xlsxSource, 'utf8');
const argon2 = fs.readFileSync(argon2Source, 'utf8');
const jszip = fs.readFileSync(jszipSource, 'utf8');
const echarts = fs.readFileSync(echartsSource, 'utf8');
const v4Runtime = fs.readFileSync(v4RuntimeSource, 'utf8');
const importWorker = fs.readFileSync(importWorkerSource, 'utf8').replace('/*__XLSX_SOURCE__*/', xlsx);
const portable = html.replace(/<script defer src="vendor\/xlsx\.full\.min\.js" data-offline-xlsx><\/script>/,
  () => `<script data-offline-xlsx>\n${xlsx}\n</script>`)
  .replace(/<script defer src="vendor\/argon2-bundled\.min\.js" data-offline-argon2><\/script>/,
    () => `<script data-offline-argon2>\n${argon2}\n</script>`)
  .replace(/<script defer src="vendor\/jszip\.min\.js" data-offline-jszip><\/script>/,
    () => `<script data-offline-jszip>\n${jszip}\n</script>`)
  .replace(/<script defer src="vendor\/echarts\.min\.js" data-offline-echarts><\/script>/,
    () => `<script data-offline-echarts>\n${echarts}\n</script>`)
  .replace(/<script defer src="src\/core\/v4-runtime\.js" data-v4-runtime><\/script>/,
    () => `<script data-v4-runtime>\n${v4Runtime}\n</script>`)
  .replace(/<script type="text\/plain" id="cwb-import-worker-source" data-cwb-import-worker><\/script>/,
    () => `<script type="text/plain" id="cwb-import-worker-source" data-cwb-import-worker>${importWorker.replace(/<\//g, '<\\/')}</script>`);
if (portable === html) throw new Error('Offline Excel placeholder was not found in index.html');
if (portable.includes('src/core/v4-runtime.js')) throw new Error('v4 runtime was not inlined');
if (portable.includes('vendor/argon2-bundled.min.js')) throw new Error('Argon2 runtime was not inlined');
if (portable.includes('vendor/jszip.min.js')) throw new Error('JSZip runtime was not inlined');
if (portable.includes('vendor/echarts.min.js')) throw new Error('ECharts runtime was not inlined');
if (!portable.includes('data-cwb-import-worker')) throw new Error('Import worker was not embedded');
fs.writeFileSync(target, portable, 'utf8');
console.log(`Release file created: ${target}`);
