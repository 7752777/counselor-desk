const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');

const file = path.join(__dirname, '..', 'index.html');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const collections = ['students', 'tasks', 'talks', 'stay', 'leave', 'honor', 'pleave', 'attend', 'node', 'warn', 'help', 'grant', 'focus', 'psych', 'graduate', 'policy', 'material', 'comp', 'tpl'];

(async () => {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  virtualConsole.on('error', (...args) => errors.push(args.join(' ')));

  const dom = await JSDOM.fromFile(file, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'https://c.local/',
    virtualConsole,
    pretendToBeVisual: true,
  });
  const w = dom.window;
  await sleep(400);

  const ownStudent = { id: 'user-student-1', full_name: '我的学生', student_number: 'USER-1', _demo: false };
  w.CWB.db.students = [ownStudent];
  collections.slice(1).forEach(collection => { w.CWB.db[collection] = []; });
  w.CWB.db.settings.counselor_name = '我的姓名';

  w.document.querySelector('#btn-settings').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  await sleep(80);
  const restoreButton = w.document.querySelector('#modal-root [data-restore-demo]');
  if (!restoreButton) throw new Error('restore demo button is missing');
  restoreButton.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  await sleep(80);

  const hasDemoStudent = w.CWB.db.students.some(student => student._demo && student.student_number === '2024010101');
  const hasDemoTask = w.CWB.db.tasks.some(task => task._demo);
  const keepsOwnStudent = w.CWB.db.students.some(student => student.id === ownStudent.id && student.full_name === '我的学生');
  const keepsSettings = w.CWB.db.settings.counselor_name === '我的姓名';

  if (errors.length) throw new Error(errors.join('\n'));
  if (!hasDemoStudent || !hasDemoTask || !keepsOwnStudent || !keepsSettings) {
    throw new Error(JSON.stringify({ hasDemoStudent, hasDemoTask, keepsOwnStudent, keepsSettings }));
  }
  dom.window.close();
  console.log('PASS demo-recovery');
})().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});
