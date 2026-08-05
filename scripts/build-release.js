const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'index.html');
const xlsxSource = path.join(root, 'vendor', 'xlsx.full.min.js');
const target = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, 'output', '辅导员工作台.html');

fs.mkdirSync(path.dirname(target), { recursive:true });
const html = fs.readFileSync(source, 'utf8');
const xlsx = fs.readFileSync(xlsxSource, 'utf8');
const portable = html.replace(/<script defer src="vendor\/xlsx\.full\.min\.js" data-offline-xlsx><\/script>/,
  () => `<script data-offline-xlsx>\n${xlsx}\n</script>`);
if (portable === html) throw new Error('Offline Excel placeholder was not found in index.html');
fs.writeFileSync(target, portable, 'utf8');
console.log(`Release file created: ${target}`);
