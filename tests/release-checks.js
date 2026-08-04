const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function run(script) {
  return spawnSync(process.execPath, [path.join(root, script)], {
    cwd: root,
    encoding: 'utf8'
  });
}

const inline = run('scripts/check-inline-js.js');
assert.equal(inline.status, 0, inline.stderr || inline.stdout);
assert.match(inline.stdout, /Inline JavaScript syntax OK/);

const publicSurface = run('scripts/check-public-surface.js');
assert.equal(publicSurface.status, 0, publicSurface.stderr || publicSurface.stdout);
assert.match(publicSurface.stdout, /Public surface check passed/);

console.log('PASS release-checks');
