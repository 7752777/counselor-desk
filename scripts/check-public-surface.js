const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const required = ['index.html', 'README.md', 'LICENSE', 'CONTRIBUTING.md', 'SECURITY.md'];
const publicDocs = ['README.md', 'CONTRIBUTING.md', 'SECURITY.md'];
const forbiddenText = [
  'README_EN.md',
  '<your-username>',
  '<original-username>',
  '<maintainer-email>',
  'dweeedon/counselor-desk',
  'ea40c80e38ef48478bb12a2376e142ea.sh2.agentos-app.net'
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing required file: ${file}`);
}

for (const file of publicDocs) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  for (const text of forbiddenText) {
    if (content.includes(text)) throw new Error(`${file} contains release placeholder: ${text}`);
  }
}

const found = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const relative = path.relative(root, full);
    if (relative === '.git' || relative.startsWith(`.git${path.sep}`)) continue;
    if (relative === 'node_modules' || relative.startsWith(`node_modules${path.sep}`)) continue;
    if (relative === path.join('docs', 'superpowers') || relative.startsWith(`${path.join('docs', 'superpowers')}${path.sep}`)) continue;
    if (entry.isDirectory()) walk(full);
    else if (/\.(backup\.json|bak|dump)$/i.test(entry.name)) found.push(relative);
  }
}
walk(root);
if (found.length) throw new Error(`Sensitive backup-like files found: ${found.join(', ')}`);

const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const localLinkPattern = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const missingLinks = [];
for (const match of readme.matchAll(localLinkPattern)) {
  const target = match[1];
  if (/^(?:[a-z]+:|#|\/\/)/i.test(target)) continue;
  const cleanTarget = decodeURIComponent(target.split('#')[0].split('?')[0]);
  if (!cleanTarget) continue;
  const resolved = path.resolve(root, cleanTarget);
  if (!resolved.startsWith(`${root}${path.sep}`) && resolved !== root) {
    missingLinks.push(target);
    continue;
  }
  if (!fs.existsSync(resolved)) missingLinks.push(target);
}
if (missingLinks.length) throw new Error(`Missing README local links: ${missingLinks.join(', ')}`);

console.log('Public surface check passed');
