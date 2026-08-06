const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const outputDir = path.resolve(process.argv[2] || path.join(root, 'output', 'desktop'));
const artifacts = fs.existsSync(outputDir) ? fs.readdirSync(outputDir).filter(name => /\.(exe|msi|appx)$/i.test(name)).map(name => path.join(outputDir, name)) : [];
if (!artifacts.length) { console.error(`Release signing gate failed: no Windows installer artifacts in ${outputDir}`); process.exit(1); }
if (process.platform !== 'win32') { console.error('Release signing gate failed: Authenticode verification requires Windows.'); process.exit(1); }
for (const artifact of artifacts) {
  const script = `(Get-AuthenticodeSignature -LiteralPath '${artifact.replace(/'/g, "''")}').Status`;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { encoding:'utf8' });
  const status = String(result.stdout || '').trim();
  if (result.status !== 0 || status !== 'Valid') { console.error(`Release signing gate failed: ${path.basename(artifact)} status=${status || 'unknown'}`); process.exit(1); }
}
console.log(`PASS release-signing (${artifacts.length} artifacts)`);
