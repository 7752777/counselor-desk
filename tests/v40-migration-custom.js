const assert = require('node:assert/strict');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

(async () => {
  const dom = await JSDOM.fromFile(path.join(__dirname, '..', 'output', 'v4-preview.html'), { runScripts:'dangerously', resources:'usable', url:'https://c.local/', virtualConsole:new VirtualConsole(), pretendToBeVisual:true });
  await new Promise(resolve => setTimeout(resolve, 500));
  const cwb = dom.window.CWB;
  cwb.db.custom = { v4_files:[{ id:'old-file', title:'旧文件' }], v4_positions:[{ id:'old-position', name:'班长' }] };
  cwb.bridge.applyPackage({ package:'counselor-desk', package_version:7, custom:{ v4_files:[{ id:'new-file', title:'新文件' }], v4_positions:[{ id:'old-position', name:'班长（更新）' }] } }, 'merge');
  assert.equal(cwb.db.custom.v4_files.length, 2);
  assert.ok(cwb.db.custom.v4_files.some(file => file.id === 'new-file'));
  assert.equal(cwb.db.custom.v4_positions[0].name, '班长（更新）');
  for (let version = 1; version <= 6; version++) {
    cwb.bridge.applyPackage({ package:'counselor-desk', package_version:version, students:[{ id:`legacy-${version}`, student_number:`LEGACY-${version}`, full_name:`兼容${version}`, unknown_column:'preserve' }] }, 'merge');
    const migrated = cwb.db.students.find(item => item.student_number === `LEGACY-${version}`);
    assert.ok(migrated, `v${version} package should import`);
    assert.equal(migrated.custom_fields.unknown_column, 'preserve', `v${version} unknown field should be retained`);
  }
  dom.window.close();
  console.log('PASS v40-migration-custom');
})().catch(error => { console.error(error.stack || error.message); process.exit(1); });
