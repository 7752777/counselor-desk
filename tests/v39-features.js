/**
 * Counselor Desk v3.9 feature contract tests.
 * These assertions guard the v3.9 local-first feature contract.
 */
const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');

const file = path.join(__dirname, '..', 'index.html');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => { if (!/scrollTo|Not implemented|Could not load|getaddrinfo/i.test(error.message)) errors.push(error.message); });
  vc.on('error', (...args) => errors.push(args.join(' ')));
  const dom = await JSDOM.fromFile(file, {
    runScripts: 'dangerously', resources: 'usable', url: 'https://c.local/',
    virtualConsole: vc, pretendToBeVisual: true,
  });
  const w = dom.window;
  await sleep(450);
  const d = w.document;
  const failures = [];
  const expect = (label, condition) => { if (!condition) failures.push(label); };

  expect('version is 4.0.0', w.CWB && w.CWB.version === '4.0.0');
  expect('onboarding API exists', !!(w.CWB && w.CWB.onboarding && typeof w.CWB.onboarding.complete === 'function'));
  expect('onboarding card is visible on first-use state', !!d.querySelector('[data-onboarding]'));
  expect('theme API exists', !!(w.CWB && w.CWB.theme && typeof w.CWB.theme.applyPreset === 'function'));
  expect('security API exists', !!(w.CWB && w.CWB.security && typeof w.CWB.security.require === 'function'));
  expect('security idle timer API exists', typeof w.CWB.security.touch === 'function');
  expect('importer preview API exists', !!(w.CWB && w.CWB.importer && typeof w.CWB.importer.previewCSV === 'function'));
  expect('learning collections exist', !!(w.CWB && Array.isArray(w.CWB.db.learning_materials) && Array.isArray(w.CWB.db.learning_notes)));
  expect('learning view is registered', !!d.querySelector('[data-view="learning"]'));
  const capabilities = w.CWB.storage.capabilities();
  expect('browser capability health check exists', capabilities && typeof capabilities.localStorage === 'boolean'
    && typeof capabilities.fileReader === 'boolean' && typeof capabilities.textDecoder === 'boolean');

  w.CWB.theme.applyPreset('ocean', false);
  expect('theme preset updates CSS variables', d.documentElement.style.getPropertyValue('--accent') === '#075985');

  expect('security accepts a 4-digit interface lock', w.CWB.security.configure('1234') === true);
  w.CWB.security.lock();
  expect('security lock blocks the interface', w.CWB.security.isLocked() === true);
  expect('wrong password does not unlock', w.CWB.security.unlock('0000') === false);
  expect('correct password unlocks', w.CWB.security.unlock('1234') === true);
  w.CWB.security.disable();

  w.CWB.onboarding.complete();
  expect('onboarding completion persists', w.CWB.db.settings.onboarding.completed === true);
  w.CWB.onboarding.reset();
  expect('onboarding reset is available', w.CWB.db.settings.onboarding.completed === false);

  w.CWB.go('learning');
  expect('learning view renders local assistant content', /学习助手|学习资料/.test(d.querySelector('#main').textContent));

  const preview = w.CWB.importer && w.CWB.importer.previewCSV('标题,分类,内容\n测试资料,政策,正文');
  expect('import preview reports one row', !!preview && preview.valid === 1 && preview.total === 1);
  const rejected = w.CWB.importer.commitCSV('material', '无关表头A,无关表头B\n1,2');
  expect('invalid import commit is rejected without a stale run id', !!rejected && rejected.valid === 0 && rejected.runId === '');

  if (errors.length || failures.length) {
    console.error(JSON.stringify({ errors, failures }, null, 2));
    process.exit(1);
  }
  dom.window.close();
  console.log('PASS v39-features');
})().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});
