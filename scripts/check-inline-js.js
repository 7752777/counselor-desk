const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);

if (!match) {
  console.error('No inline <script> tag found');
  process.exit(1);
}

try {
  new Function(match[1]);
  console.log(`Inline JavaScript syntax OK (${match[1].length} chars)`);
} catch (error) {
  console.error(`Inline JavaScript syntax error: ${error.message}`);
  process.exit(1);
}
