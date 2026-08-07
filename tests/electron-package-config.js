const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const config = fs.readFileSync(path.resolve(__dirname, '..', 'electron-builder.yml'), 'utf8');

assert.match(config, /^productName: 辅导员工作台$/m, 'The installed product name must remain Chinese');
assert.match(config, /^executableName: counselor-desk$/m, 'The Windows executable must use an ASCII-safe file name for installation');
assert.match(config, /^  shortcutName: 辅导员工作台$/m, 'The desktop shortcut must remain Chinese for ordinary users');
assert.match(config, /^    - msi$/m, 'Windows release builds must use the verified MSI target');
assert.doesNotMatch(config, /^    - nsis$/m, 'Windows release builds must not use the failed NSIS installer target');
assert.doesNotMatch(config, /^    - portable$/m, 'Windows release builds must not use the failed portable target');

console.log('PASS electron-package-config');
