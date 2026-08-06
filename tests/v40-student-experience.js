const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
if (!html.includes('.v4-toolbar>.inp')) throw new Error('v4 toolbars should define a compact desktop input layout');
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', error => {
  if (/window\.scrollTo|Could not load script/.test(String(error && error.message))) return;
  throw error;
});

const dom = new JSDOM(html, { runScripts:'dangerously', resources:'usable', pretendToBeVisual:true, virtualConsole });
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  await wait(250);
  const { document, CWB } = dom.window;
  CWB.go('students');
  await wait(30);
  const studentHtml = document.querySelector('#main')?.innerHTML || '';
  if (!studentHtml.includes('data-student-field-filter')) throw new Error('students view should expose an arbitrary field filter');
  if (!studentHtml.includes('data-student-sort-dir')) throw new Error('students view should expose sort direction control');
  const customHeaders = ['学号', '姓名', '生源地'];
  for (let index = 1; index <= 47; index++) customHeaders.push(`学校自定义字段${index}`);
  const customRow = ['FLEX-001', '灵活字段测试', '新疆'].concat(Array.from({ length:47 }, (_, index) => `值${index + 1}`));
  const flexiblePreview = CWB.importer.previewCSV(`${customHeaders.join(',')}\n${customRow.join(',')}`, 'students');
  if (flexiblePreview.total !== 1 || Object.keys(flexiblePreview.customFields || {}).length < 47) throw new Error('student importer should preserve 50-column custom headers');
  if (flexiblePreview.rows[0].value.origin !== '新疆') throw new Error('student importer should map source-place values');
  document.querySelector('[data-student-tab="photos"]')?.click();
  await wait(30);
  const photoHtml = document.querySelector('#main')?.innerHTML || '';
  if (!photoHtml.includes('v4-photo-placeholder') || !photoHtml.includes('点击上传')) throw new Error('students photo view should show an upload slot for students without photos');

  CWB.go('files');
  await wait(30);
  const fileHtml = document.querySelector('#main')?.innerHTML || '';
  if (!fileHtml.includes('政策文件') || !fileHtml.includes('表单模板')) throw new Error('file library should explain policy and form categories');

  CWB.go('employment');
  await wait(30);
  const employmentHtml = document.querySelector('#main')?.innerHTML || '';
  if ((employmentHtml.match(/data-employment-resource/g) || []).length < 5) throw new Error('employment view should seed at least five official resources');
  if (!employmentHtml.includes('employment-resource-card')) throw new Error('employment view should use readable resource cards');

  dom.window.close();
  console.log('PASS v40-student-experience');
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
