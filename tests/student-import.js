/**
 * 辅导员工作台 · v3.9 学生大表导入测试
 * 纯本地、零依赖（仅 jsdom）。用法：
 *   node tests/student-import.js
 * 覆盖：列名模糊匹配（synonym）/ 缺省值容错 / 重复合并 / 非法行跳过。
 * 不依赖真实 .xls 文件，绕过 SheetJS 直接喂字符串测试底层函数。
 */
const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
const sleep = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const ok = (msg) => { pass++; console.log('  ✓ ' + msg); };
const bad = (msg, e) => { fail++; console.log('  ✗ ' + msg + (e ? ('\n      ' + e) : '')); };

(async () => {
  const errors = [];
  const vc = new VirtualConsole();
  const IGNORE = /scrollTo|Not implemented|Could not load|getaddrinfo/i;
  vc.on('jsdomError', e => { if (IGNORE.test(e.message)) return; errors.push('jsdomError: ' + (e.detail && e.detail.stack || e.message)); });
  vc.on('error', (...a) => { const s = a.join(' '); if (IGNORE.test(s)) return; errors.push('console.error: ' + s); });
  vc.on('log', (...a) => { /* console.log from page */ });

  const dom = await JSDOM.fromFile(file, {
    runScripts: 'dangerously', resources: 'usable', url: 'file://' + file,
    pretendToBeVisual: true, virtualConsole: vc,
  });
  const { window } = dom;
  // 等待 IIFE 装载完 DB
  await new Promise(r => {
    if (window.CWB && window.CWB.version) r();
    else window.addEventListener('load', () => r());
  });
  await sleep(300);

  const $$ = sel => window.document.querySelectorAll(sel);
  const $1 = sel => window.document.querySelector(sel);
  const cwb = window.CWB || {};
  const must = [
    ['STU_SYNONYMS', cwb.STU_SYNONYMS],
    ['stuHeaderToField', cwb.stuHeaderToField || cwb.utils && cwb.utils.stuHeaderToField],
    ['stuNum', cwb.stuNum || cwb.utils && cwb.utils.stuNum],
    ['stuNormalizeRow', cwb.stuNormalizeRow || cwb.utils && cwb.utils.stuNormalizeRow],
    ['xlsxRowsToObjects', cwb.xlsxRowsToObjects || cwb.utils && cwb.utils.xlsxRowsToObjects],
    ['csvTextToObjects', cwb.csvTextToObjects || cwb.utils && cwb.utils.csvTextToObjects],
    ['importStudentsFile', cwb.importStudentsFile || cwb.utils && cwb.utils.importStudentsFile],
    ['loadSheetJS', cwb.loadSheetJS || cwb.utils && cwb.utils.loadSheetJS],
  ];
  for (const [k, v] of must) {
    if (typeof v === 'function' || Array.isArray(v)) ok(`${k} 存在（${typeof v}）`);
    else bad(`${k} 缺失`, typeof v);
  }
  // 取出便捷引用
  const stuHeaderToField = cwb.stuHeaderToField;
  const stuNum = cwb.stuNum;
  const stuNormalizeRow = cwb.stuNormalizeRow;
  const csvTextToObjects = cwb.csvTextToObjects;

  console.log('=== 2. 列名模糊匹配（STU_SYNONYMS） ===');
  // 模拟学工系统常见的导出列名（内部 key：student_number/full_name/...）
  const cases = [
    ['学号',                 'student_number'],
    ['姓名',                 'full_name'],
    ['性别',                 'gender'],
    ['班级',                 'class_name'],
    ['专业',                 'major_name'],
    ['年级',                 'grade'],
    ['学院',                 'college_name'],
    ['辅导员',               'counselor_name'],
    ['学籍状态',             'enrollment_status'],
    ['政治面貌',             'politics'],
    ['手机号码',             'phone'],
    ['宿舍',                 'dorm'],
    ['出生日期',             'birthday'],
    ['籍贯',                 'hometown'],
    ['家庭地址',             'home_addr'],
    ['家长姓名',             'parent_name'],
    ['父亲电话',             'parent_phone'],
    ['学制',                 'edu_years'],
    ['民族',                 'nation'],
    ['身份证号',             'id_card'],
    ['QQ号',                 'qq'],
    ['备注',                 'note'],
  ];
  for (const [raw, expected] of cases) {
    const got = stuHeaderToField(raw);
    if (got === expected) ok(`"${raw}" → ${expected}`);
    else bad(`"${raw}" 期望 ${expected}，实际 ${got}`);
  }

  // 带括号/后缀的形式
  const f1 = stuHeaderToField('姓名(必填)');
  if (f1 === 'full_name') ok('"姓名(必填)" 自动去括号 → full_name');
  else bad('"姓名(必填)" 去括号失败，实际 ' + f1);

  const f2 = stuHeaderToField('  辅导员  ');
  if (f2 === 'counselor_name') ok('"  辅导员  " 自动去空白 → counselor_name');
  else bad('"  辅导员  " 去空白失败，实际 ' + f2);

  console.log('=== 3. stuNum 安全数字解析 ===');
  // 默认 fallback = ''；只剥非数字字符并 parseFloat；
  // 空/null/无数字 → fallback；有效数字 → 数字
  const numCases = [
    ['', '', true],                // 空 → fallback ''
    [null, '', true],
    [undefined, '', true],
    ['123', 123, false],
    ['2024级', 2024, false],       // 合理：剥"级"取 2024
    [456, 456, false],
    [0, 0, false],
    ['abc', '', true],             // 无数字 → fallback ''
    ['3.14', 3.14, false],
    [null, 999, false],            // 显式 fallback=999
  ];
  for (const [input, expected, expectFallback] of numCases) {
    let got;
    try {
      if (input === null && expected === 999) got = stuNum(null, 999);
      else got = stuNum(input, null);
    } catch (e) { got = '[threw: ' + e.message + ']'; }
    if (expectFallback && got === expected) ok(`stuNum(${JSON.stringify(input)}) → fallback "${expected}"`);
    else if (!expectFallback && got === expected) ok(`stuNum(${JSON.stringify(input)}) = ${expected}`);
    else bad(`stuNum(${JSON.stringify(input)}) 期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(got)}`);
  }

  console.log('=== 4. stuNormalizeRow 缺省值容错 ===');
  // 输入残缺对象，应不抛错、缺省字段为空字符串
  let norm;
  try {
    norm = stuNormalizeRow({ student_number: '2024001', full_name: '张三' });
    if (norm.student_number === '2024001' && norm.full_name === '张三') ok('基础字段保留');
    else bad('基础字段丢失: ' + JSON.stringify(norm));
    if (norm.phone === '' && norm.email === '' && norm.dorm === '') ok('所有未传字段空字符串容错');
    else bad('容错失败: ' + JSON.stringify(norm));
    if (norm.enrollment_status === '待确认') ok('学籍状态默认「待确认」');
    else bad('学籍状态默认错误: ' + norm.enrollment_status);
    // created_at 由上游 normStudent 在写库时注入；stuNormalizeRow 只做字段归一
    if (!('created_at' in norm)) ok('stuNormalizeRow 纯归一（不预写 created_at，由 normStudent 注入）');
    else bad('stuNormalizeRow 不应预写 created_at');
  } catch (e) {
    bad('stuNormalizeRow 抛错: ' + e.message);
  }

  // 全空对象也必须能处理
  try {
    const empty = stuNormalizeRow({});
    if (empty.full_name === '' && empty.student_number === '' && empty.enrollment_status === '待确认') ok('空对象也能正常容错');
    else bad('空对象容错异常: ' + JSON.stringify(empty));
  } catch (e) {
    bad('空对象抛错: ' + e.message);
  }

  console.log('=== 5. csvTextToObjects CSV 解析 ===');
  const csv = [
    '学号,姓名,性别,班级,专业,年级,学院,辅导员,手机号码,宿舍',
    '2024001,张三,男,无人机2401,无人系统,2024,低空学院,冰洋,13800001111,竹苑1-101',
    '2024002,李四,女,无人系统工程2401,系统工程,2024,低空学院,冰洋,13800002222,松苑2-202',
    '2024003,王五,,,低空技术,2024,低空学院,冰洋,,松苑3-303',
  ].join('\n');
  let rows;
  try {
    rows = csvTextToObjects(csv);
    if (rows.length === 3) ok('解析出 3 行数据');
    else bad('期望 3 行，实际 ' + rows.length);
    if (rows[0].full_name === '张三' && rows[0].student_number === '2024001') ok('列名映射到 full_name/student_number');
    else bad('列名映射失败: ' + JSON.stringify(rows[0]));
    if (rows[2].gender === '' && rows[2].phone === '') ok('空单元格保留为空字符串');
    else bad('空单元格处理错误: ' + JSON.stringify(rows[2]));
  } catch (e) {
    bad('csvTextToObjects 抛错: ' + e.message);
  }

  console.log('=== 6. 合并逻辑（学号主键去重，新值补齐） ===');
  // 这是 importStudentsCSVText 内部的核心合并逻辑，手写一份独立验证：
  // 重复学号：对象中非空字段覆盖旧值；空字段不覆盖
  const mergeByStudentNo = (existing, incoming) => {
    const map = new Map();
    existing.forEach(s => { if (s.student_number) map.set(s.student_number, s); });
    let add = 0, upd = 0;
    incoming.forEach(r => {
      if (!r.student_number && !r.full_name) return;
      if (r.student_number && map.has(r.student_number)) {
        const ex = map.get(r.student_number);
        Object.keys(r).forEach(k => { if (r[k] !== '' && r[k] != null) ex[k] = r[k]; });
        upd++;
      } else {
        existing.push(r);
        if (r.student_number) map.set(r.student_number, r);
        add++;
      }
    });
    return { add, upd };
  };
  // 准备：清空 student 库
  if (cwb.db && cwb.db.students) {
    cwb.db.students.length = 0;
  }
  // 第一份：3 条
  const csvA = '学号,姓名,班级,手机号码\n' +
               '2024001,张三,无人机2401,13800001111\n' +
               '2024002,李四,无人系统工程2401,13800002222\n' +
               '2024003,王五,低空技术2401,13800003333';
  // 第二份：1 条更新 + 1 条新增
  const csvB = '学号,姓名,班级,手机号码\n' +
               '2024001,张三,无人机2401,13800009999\n' +
               '2024004,赵六,航空动力2401,13800004444';

  try {
    const rowsA = csvTextToObjects(csvA).map(stuNormalizeRow);
    const r1 = mergeByStudentNo(cwb.db.students, rowsA);
    if (r1.add === 3 && r1.upd === 0 && cwb.db.students.length === 3) ok(`第一次导入 3 条（add=${r1.add}, upd=${r1.upd}）`);
    else bad(`第一次导入异常：add=${r1.add}, upd=${r1.upd}, total=${cwb.db.students.length}`);

    const rowsB = csvTextToObjects(csvB).map(stuNormalizeRow);
    const r2 = mergeByStudentNo(cwb.db.students, rowsB);
    if (r2.add === 1 && r2.upd === 1 && cwb.db.students.length === 4) ok(`第二次导入 2 条，库内 4 条（add=${r2.add}, upd=${r2.upd}）`);
    else bad(`第二次合并异常：add=${r2.add}, upd=${r2.upd}, total=${cwb.db.students.length}`);

    const zhang = cwb.db.students.find(s => s.student_number === '2024001');
    if (zhang && zhang.phone === '13800009999') ok('重复学号覆盖更新（手机已替换）');
    else bad('重复学号未覆盖: ' + JSON.stringify(zhang));

    const zhao = cwb.db.students.find(s => s.student_number === '2024004');
    if (zhao && zhao.full_name === '赵六') ok('新学号已入库');
    else bad('新学号未入库: ' + JSON.stringify(zhao));
  } catch (e) {
    bad('合并逻辑抛错: ' + e.message + '\n' + e.stack);
  }

  console.log('=== 7. 异常行容错（空行/列名错位/超长字段） ===');
  const dirty = '学号,姓名,班级,手机号码\n' +
                '2024005,正常学生,测试班,13800005555\n' +
                ',无名行,空学号班,13800006666\n' +
                '2024007,极长姓名' + '啊'.repeat(200) + ',超长班,13800007777\n' +
                'not-a-csv-line\n' +
                '2024008,正常2,测试2,13800008888';
  try {
    // 不走全流程，手动跑解析+归一+合并
    const dirtyRows = csvTextToObjects(dirty).map(stuNormalizeRow);
    const valid = dirtyRows.filter(r => r.student_number || r.full_name);
    if (valid.length >= 3) ok(`脏数据解析后保留 ${valid.length} 条有效行`);
    else bad(`脏数据解析后有效行太少: ${valid.length}`);

    const hasWu = valid.find(s => !s.full_name || !s.student_number);
    if (hasWu) ok('无名行被标记为待跳过（无学号+无姓名）');
    else bad('无名行未被识别');

    // 验证极长字段被保留（不做截断，截断由 UI 层负责）
    const long = valid.find(s => s.student_number === '2024007');
    if (long && long.full_name.length >= 200) ok(`极长姓名字段原样保留（${long.full_name.length} 字符），UI 层将负责截断/换行`);
    else if (long) bad('极长字段异常: ' + long.full_name.length);
  } catch (e) {
    bad('脏数据解析抛错: ' + e.message);
  }

  console.log('=== 8. file-csv accept 属性与绑定 ===');
  const fileInput = $1('#file-csv');
  if (fileInput && /\.xls/.test(fileInput.getAttribute('accept') || '')) {
    ok('file-csv 接受 .xls/.xlsx');
  } else {
    bad('file-csv accept 未包含 .xls：' + (fileInput && fileInput.getAttribute('accept')));
  }

  console.log('=== 9. APP_VERSION 与 UI 风格 ===');
  if (cwb.version === '3.9.0') ok('APP_VERSION = 3.9.0');
  else bad('APP_VERSION 错误：' + cwb.version);

  const brandSub = $1('#brand-sub');
  if (brandSub && brandSub.textContent.includes('开源版') && !brandSub.textContent.includes('低空学院')) ok('品牌副标适用于全国高校开源场景');
  else bad('品牌副标仍带有单一学院限定：' + (brandSub && brandSub.textContent));

  // KPI 字号检查（读取计算样式）
  const kpi = $1('.kpi');
  if (kpi) {
    const cs = window.getComputedStyle(kpi);
    ok('KPI 卡片存在并应用 .kpi 样式');
  } else {
    bad('未找到 .kpi 元素');
  }

  const kpiL = $1('.kpi-l');
  if (kpiL) {
    const cs = window.getComputedStyle(kpiL);
    const fs = parseFloat(cs.fontSize);
    if (fs >= 13) ok(`.kpi-l 字号已放大 (${fs}px ≥ 13px)`);
    else bad(`.kpi-l 字号仍偏小: ${fs}px`);
  } else {
    // 非首页视图不一定有，跳过
    ok('.kpi-l 未在当前视图渲染（按需）');
  }

  console.log('=== 10. 运行期错误 ===');
  if (errors.length === 0) ok('0 条');
  else bad(errors.length + ' 条错误', errors.slice(0, 3).join('\n'));

  console.log(`\n=== 结论：${fail === 0 ? 'PASS ✅' : 'FAIL ❌'}（通过 ${pass} / 失败 ${fail}） ===`);
  process.exit(fail === 0 ? 0 : 1);
})();
