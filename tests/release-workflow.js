const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflowPath = path.resolve(__dirname, '..', '.github', 'workflows', 'desktop-release.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

assert.match(workflow, /tags:\s*\[\s*['"]v\*['"]\s*\]/, 'Release workflow must run for version tags');
assert.match(workflow, /runs-on:\s*windows-latest/, 'Release workflow must build Windows installers');
assert.match(workflow, /runs-on:\s*macos-15-intel/, 'Release workflow must build the macOS universal package');
assert.match(workflow, /pnpm run desktop:build:win/, 'Release workflow must build Windows artifacts');
assert.match(workflow, /pnpm run desktop:build:mac/, 'Release workflow must build macOS artifacts');
assert.match(workflow, /gh release create/, 'Release workflow must publish a GitHub Release');
assert.match(workflow, /gh release upload/, 'Platform build jobs must upload assets directly to the GitHub Release');
assert.doesNotMatch(workflow, /actions\/upload-artifact@v4/, 'Release publishing must not depend on the unavailable Actions artifact upload service');
assert.doesNotMatch(workflow, /actions\/download-artifact@v4/, 'Release publishing must not depend on the unavailable Actions artifact download service');
assert.match(workflow, /node -p "require\('\.\/package\.json'\)\.version"/, 'Release workflow must derive artifact names from package.json');
assert.match(workflow, /辅导员工作台-v\$version-Windows-安装版\.msi/, 'Release workflow must expose a versioned Chinese Windows MSI installer name');
assert.doesNotMatch(workflow, /Windows-便携版/, 'Release workflow must not publish the unverified NSIS portable target');
assert.match(workflow, /辅导员工作台-v\$\{version\}-macOS-安装版\.dmg/, 'Release workflow must expose a versioned Chinese macOS DMG name');
assert.match(workflow, /Windows-SHA256校验和\.txt/, 'Release workflow must publish a Windows checksum manifest');
assert.match(workflow, /macOS-SHA256校验和\.txt/, 'Release workflow must publish a macOS checksum manifest');

console.log('PASS release-workflow');
