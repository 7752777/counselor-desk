/**
 * v3.9 nationwide-readiness hardening contract.
 * Guards branding, first-use accuracy, student import retention,
 * safe 4 MB background input, and the human-readable release filename.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { JSDOM, VirtualConsole } = require('jsdom');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'index.html');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => { if (!/scrollTo|Not implemented|Could not load/i.test(error.message)) errors.push(error.message); });
  vc.on('error', (...args) => errors.push(args.join(' ')));
  const dom = await JSDOM.fromFile(file, {
    runScripts: 'dangerously', resources: 'usable', url: 'https://c.local/',
    virtualConsole: vc, pretendToBeVisual: true,
  });
  const w = dom.window;
  await sleep(450);
  const d = w.document;

  assert.equal(d.title, '辅导员工作台', 'browser title should use the public product name');
  const icon = d.querySelector('link[rel="icon"]');
  assert.ok(icon && /app-icon\.svg|data:image\/svg\+xml/.test(icon.getAttribute('href') || ''), 'app favicon should be configured');
  assert.doesNotMatch(d.querySelector('#brand-sub').textContent, /低空学院/, 'public branding must not be tied to one college');

  assert.equal(d.querySelectorAll('[data-onboarding] .onboarding-steps .done').length, 0,
    'demo records must not mark first-use initialization steps complete');

  const extended = {
    student_number: '20260001', full_name: '测试学生', birthday: '2008-03-01',
    hometown: '河北省石家庄市', home_addr: '示例地址', parent_name: '示例家长',
    parent_phone: '13800000000', edu_years: '4', nation: '汉族',
    id_card: '110101200803010000', email: 'student@example.edu.cn', qq: '12345678',
  };
  const normalized = w.CWB.norm.student(w.CWB.stuNormalizeRow(extended));
  for (const [key, value] of Object.entries(extended)) {
    const expected = key === 'edu_years' ? 4 : value;
    assert.equal(normalized[key], expected, `student normalization should retain imported field ${key}`);
  }
  assert.deepEqual(Array.from(w.CWB.csvTextToObjects('错误列A,错误列B\n1,2')), [],
    'unrecognized student headers must stop instead of falling back to positional import');

  assert.equal(w.CWB.theme.maxBackgroundBytes, 4 * 1024 * 1024, 'background input limit should be 4 MB');
  assert.doesNotThrow(() => w.CWB.theme.validateBackgroundFile({ type:'image/jpeg', size:4 * 1024 * 1024 }));
  assert.doesNotThrow(() => w.CWB.theme.validateBackgroundFile({ name:'校园背景.PNG', type:'', size:1024 }),
    'recognized image extensions should work when a browser omits MIME type');
  assert.throws(() => w.CWB.theme.validateBackgroundFile({ type:'image/jpeg', size:4 * 1024 * 1024 + 1 }), /4MB/);
  assert.throws(() => w.CWB.theme.validateBackgroundFile({ type:'text/plain', size:10 }), /图片/);
  const originalHealth = w.CWB.storage.health;
  w.CWB.storage.health = () => ({ used:4_500_000, capacity:5_000_000, ratio:.9, level:'critical' });
  await assert.rejects(
    w.CWB.theme.prepareBackgroundFile({ type:'image/jpeg', size:100, name:'small.jpg' }),
    /存储空间不足/
  );
  w.CWB.storage.health = originalHealth;

  d.querySelector('#btn-settings').click();
  await sleep(10);
  assert.match(d.querySelector('#settings-background').parentElement.textContent, /4MB/, 'settings should explain the 4 MB input limit');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cwb-release-'));
  const releaseFile = path.join(tempDir, '辅导员工作台.html');
  try {
    const build = spawnSync(process.execPath, [path.join(root, 'scripts', 'build-release.js'), releaseFile], {
      cwd: root, encoding: 'utf8'
    });
    assert.equal(build.status, 0, build.stderr || build.stdout || 'release builder failed');
    const release = fs.readFileSync(releaseFile, 'utf8');
    assert.ok(release.length > fs.readFileSync(file, 'utf8').length + 600000, 'release should embed the offline Excel runtime');
    assert.ok(!release.includes('<script defer src="vendor/xlsx.full.min.js"'), 'release should not depend on adjacent runtime files');
  } finally {
    fs.rmSync(tempDir, { recursive:true, force:true });
  }

  assert.deepEqual(errors, [], 'runtime errors should stay empty');
  dom.window.close();
  console.log('PASS v39-hardening');
})().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});
