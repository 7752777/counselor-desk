const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');

assert.match(html, /data-student-tab=/, 'students view should expose internal tabs');
assert.match(html, /\['ledger',\s*'photos',\s*'analysis'\]/, 'students view should define ledger, photo and analysis tabs');
assert.match(html, /function resolveLegacyV4Route\(/, 'legacy V4 routes should resolve to parent modules');
assert.match(html, /data-parent-view="students"/, 'photo route should be a students compatibility alias');
assert.doesNotMatch(html, /group\.dataset\.group\s*=\s*['"]v4\.0['"]/, 'standalone V4 nav group must not be created');
assert.doesNotMatch(html, /data-v4-nav-item/, 'standalone V4 nav item markers must be removed');
assert.match(html, /data-v4-analysis-chart/, 'student analysis should own chart drilldown targets');
assert.match(html, /desktopRepositoryReady/, 'desktop boot should expose an awaited repository readiness barrier');
assert.match(html, /desktopBusiness[\s\S]{0,180}key !== 'settings'/, 'desktop business saves should bypass localStorage');
assert.match(html, /localStorage.*compatibility/i, 'desktop storage boundary should document localStorage compatibility only');
assert.match(html, /\.v4-photo\{[^}]*aspect-ratio:/i, 'photo cards should use an explicit stable aspect ratio');

console.log('PASS v40-integration-layout');
