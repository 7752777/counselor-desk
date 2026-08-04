/**
 * 辅导员工作台 · 导入 / 导出闭环测试
 * 纯本地、零依赖（仅 jsdom）。用法：
 *   node tests/import-loop.js
 *
 * 全程「像真人一样」用 DOM 操作驱动，不碰任何内部变量：
 *   进入模块 → 点「模板」→ 点「导出 CSV」→ 点「导入 CSV」→ 选文件 → 校验 localStorage。
 *
 * 每个业务模块都要过的 6 关：
 *   1) 工具栏「模板 / 导入 CSV / 导出 CSV」三个按钮齐全；
 *   2) 「模板」产出的表头 == 本文件里独立写死的表头规格（防止导出与导入两边跑偏）；
 *   3) 「导出」的表头和行数与库内一致；
 *   4) 导出的文件原样导回 → 条数不变（按主键去重，只更新不重复新增）；
 *   5) 改掉主键字段后导回 → 条数 +1（确实能新增）；
 *   6) 表头乱填导回 → 不抛异常、不误写数据。
 * 最后再做一次枚举 / 布尔 / 数字往返保真检查 + 全量视图复渲染。
 */
const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');
const fs = require('fs');
const file = path.join(__dirname, '..', 'index.html');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const NS = 'cwb_v1_';

/* 表头规格：独立于源码手写一份，用来交叉验证导出/模板/导入三方一致 */
const SPEC = [
  { coll:'tasks', view:'tasks', act:'task-export', label:'工作任务',
    head:['任务名称','职责分类','来源','涉及班级','截止日期','优先级','状态','备注','平台任务号'] },
  { coll:'talks', view:'talks', act:'talk-export', label:'谈心谈话',
    head:['日期','学号','姓名','方式','主题分类','谈话内容','问题研判','处理措施','需跟进','跟进日期','跟进完成'] },
  { coll:'stay', view:'stay', act:'stay-export', label:'校外住宿',
    head:['姓名','学号','年级专业','学生类型','申请理由','走读开始','走读结束','紧急联系人','紧急联系人电话','审批情况','备注'] },
  { coll:'leave', view:'leave', act:'leave-export', label:'假期去向',
    head:['姓名','学号','专业班级','家庭所在省市区','离校时间','返校时间','宿舍','本人手机号','是否延迟离校','留校缘由','指导老师','家长知情同意书','特殊情况备注'] },
  { coll:'honor', view:'honor', act:'honor-export', label:'评优榜样',
    head:['姓名','学号','申请类型','政治面貌','专业','班级','综合成绩专业排名','德育素质考核等级','入学来获奖学金情况','社会工作情况','其他获奖情况'] },
  { coll:'pleave', view:'pleave', act:'pleave-export', label:'请销假',
    head:['姓名','学号','班级','请假开始','请假结束','类型','事由','审批人','审批状态','是否销假','登记日期','备注'] },
  { coll:'attend', view:'attend', act:'attend-export', label:'考勤台账',
    head:['姓名','学号','班级','日期','缺勤类型','时长/节次','记录人','备注'] },
  { coll:'node', view:'node', act:'node-export', label:'工作节点',
    head:['工作标题','分类','截止日期','提前提醒天数','状态','周期','工作小结','附件','完成日期'] },
  { coll:'warn', view:'warn', act:'warn-export', label:'学业预警',
    head:['姓名','学号','班级','预警类型','等级','关联课程','干预措施','回访记录','是否解决','解决日期','备注'] },
  { coll:'help', view:'help', act:'help-export', label:'学业帮扶',
    head:['姓名','学号','班级','帮扶类型','帮扶人','周期','帮扶措施','效果记录','状态','备注'] },
  { coll:'grant', view:'grant', act:'grant-export', label:'奖助勤补',
    head:['姓名','学号','班级','项目类型','金额(元)','批次/年度','发放状态','备注'] },
  { coll:'focus', view:'focus', act:'focus-export', label:'重点学生档案',
    head:['姓名','学号','班级','关注类别','关注级别','关注原因','干预措施','跟进记录','负责老师','管理状态','更新日期','备注'] },
  { coll:'psych', view:'psych', act:'psych-export', label:'心理摸排',
    head:['姓名','学号','班级','摸排日期','使用量表','得分','评估结果','关注事项','干预建议','处理人','状态','备注'] },
  { coll:'graduate', view:'graduate', act:'graduate-export', label:'毕业生档案',
    head:['姓名','学号','班级','专业','毕业年份','就业状态','就业单位','岗位/方向','就业地点','薪酬区间','是否签约','更新日期','备注'] },
  { coll:'policy', view:'policy', act:'policy-export', label:'政策智库',
    head:['标题','分类','发布单位','发布日期','文号','关键词','摘要','链接','收藏','备注'] },
  { coll:'material', view:'material', act:'material-export', label:'工作素材',
    head:['标题','分类','来源','标签','内容','备注'] },
  { coll:'comp', view:'comp', act:'comp-export', label:'科创竞赛',
    head:['赛事名称','类别','主办单位','截止日期','参赛学生','获奖情况','备注'] },
  { coll:'tpl', view:'tpl', act:'tpl-export', label:'模板库',
    head:['标题','类型','适用场景','模板正文','备注'] },
];

/* 极简 CSV 解析（只用于测试断言，与被测代码互相独立） */
function parseCSV(text) {
  const s = String(text).replace(/^\uFEFF/, '');
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => String(x).trim() !== ''));
}
function toCSV(rows) {
  return '\uFEFF' + rows.map(r => r.map(c => {
    const v = c == null ? '' : String(c);
    return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }).join(',')).join('\r\n');
}

(async () => {
  const errors = [];
  const vc = new VirtualConsole();
  const IGNORE = /scrollTo|Not implemented/i;
  vc.on('jsdomError', e => { if (IGNORE.test(e.message)) return; errors.push('jsdomError: ' + (e.detail && e.detail.stack || e.message)); });
  vc.on('error', (...a) => { const s = a.join(' '); if (IGNORE.test(s)) return; errors.push('console.error: ' + s); });

  const dom = await JSDOM.fromFile(file, {
    runScripts: 'dangerously', resources: 'usable', url: 'https://c.local/',
    virtualConsole: vc, pretendToBeVisual: true,
  });
  const w = dom.window, d = w.document;

  /* 截留导出内容：download() 内部走 URL.createObjectURL(blob) */
  let capBlob = null, capName = '';
  w.URL.createObjectURL = b => { capBlob = b; return 'blob:mock'; };
  w.URL.revokeObjectURL = () => {};
  const origAppend = w.HTMLElement.prototype.appendChild;
  d.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[download]');
    if (a) { capName = a.getAttribute('download') || ''; }
  }, true);
  const grab = async () => {
    if (!capBlob) return '';
    const t = typeof capBlob.text === 'function'
      ? await capBlob.text()
      : await new Promise(res => { const r = new w.FileReader(); r.onload = () => res(r.result); r.readAsText(capBlob, 'utf-8'); });
    return String(t);
  };
  await sleep(500);

  const out = [];
  let failCount = 0;
  const $ = s => d.querySelector(s);
  const $$ = s => [...d.querySelectorAll(s)];
  const click = el => { if (el) el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true })); };
  const ok = (label, cond) => { if (!cond) failCount++; out.push('  ' + (cond ? '✓' : '✗ FAIL') + ' ' + label); };
  const store = coll => { try { return JSON.parse(w.localStorage.getItem(NS + coll) || '[]'); } catch (e) { return []; } };
  const goView = key => { const el = $$('[data-view]').find(x => x.dataset.view === key); click(el); return !!el; };
  /* 像真人一样「选文件」：给隐藏 input 装上文件再触发 change */
  const pickFile = async (inputSel, text) => {
    const inp = $(inputSel);
    const f = new w.File([text], 'test.csv', { type: 'text/csv' });
    Object.defineProperty(inp, 'files', { value: [f], configurable: true, writable: true });
    inp.dispatchEvent(new w.Event('change', { bubbles: true }));
    await sleep(120);
  };

  /* ---------- 0. 装配自检 ---------- */
  out.push('=== 0. 通用导入器装配 ===');
  const src = fs.readFileSync(file, 'utf8');
  ok('隐藏文件输入 #file-gen 存在', !!$('#file-gen'));
  ok('已移除失效的 file-stay / file-leave 悬空输入', !/id="file-(stay|leave)"/.test(src));
  ok('事件分发器把按钮元素透传给动作（支持 data-coll）', /ACTS\[btn\.dataset\.act\]\(btn\.dataset\.id,\s*btn\)/.test(src));
  ok('gen-import 动作已注册', /'gen-import':/.test(src));
  ok('gen-template 动作已注册', /'gen-template':/.test(src));
  ok('IMP 配置表覆盖 18 个模块', (src.match(/norm:norm[A-Z]\w*, label:/g) || []).length === 18);

  /* ---------- 1. 逐模块闭环 ---------- */
  for (const m of SPEC) {
    out.push(`=== ${m.coll} · ${m.label} ===`);
    if (!goView(m.view)) { ok(`能进入「${m.label}」视图`, false); continue; }
    await sleep(70);
    /* 重点学生档案有隐私锁：首次进入是「设置密码」屏，像真人一样先设一个 4 位密码 */
    if (m.coll === 'focus' && $('#focus-pass')) {
      $('#focus-pass').value = '1234';
      if ($('#focus-pass2')) $('#focus-pass2').value = '1234';
      click($$('[data-act="focus-set-pass"]')[0] || $$('[data-act="focus-unlock"]')[0]);
      await sleep(80);
      ok('隐私锁设置后自动解锁进入档案列表', !$('#focus-pass'));
    }
    const html = $('#main') ? $('#main').innerHTML : '';
    ok('工具栏有「导入 CSV」按钮', html.includes(`data-act="gen-import" data-coll="${m.coll}"`));
    ok('工具栏有「模板」按钮', html.includes(`data-act="gen-template" data-coll="${m.coll}"`));
    ok('工具栏有「导出 CSV」按钮', html.includes(`data-act="${m.act}"`));

    /* 模板 */
    capBlob = null;
    click($$(`[data-act="gen-template"][data-coll="${m.coll}"]`)[0]);
    await sleep(30);
    const tplCsv = await grab();
    const tplHead = tplCsv ? parseCSV(tplCsv)[0] : [];
    ok('「模板」表头与规格一致', tplHead.join('|') === m.head.join('|'));

    /* 导出 */
    capBlob = null;
    click($$(`[data-act="${m.act}"]`)[0]);
    await sleep(30);
    const csv = await grab();
    ok('「导出 CSV」产生了内容', !!csv);
    if (!csv) continue;
    const rows = parseCSV(csv);
    ok('「导出」表头与规格一致', rows[0].join('|') === m.head.join('|'));

    const before = store(m.coll).length;
    ok(`导出行数 == 库内条数（${rows.length - 1} / ${before}）`, rows.length - 1 === before);
    if (before === 0) { out.push('  · 该模块暂无数据，跳过导回校验'); continue; }

    /* 原样导回 → 条数不变 */
    click($$(`[data-act="gen-import"][data-coll="${m.coll}"]`)[0]);
    await pickFile('#file-gen', csv);
    const afterSame = store(m.coll).length;
    ok(`原样导回条数不变（${before} → ${afterSame}）`, afterSame === before);

    /* 改主键 → 新增 1 条 */
    const nr = rows[1].slice(); nr[0] = '闭环测试_' + m.coll;
    goView(m.view); await sleep(50);
    click($$(`[data-act="gen-import"][data-coll="${m.coll}"]`)[0]);
    await pickFile('#file-gen', toCSV([rows[0], nr]));
    const afterNew = store(m.coll).length;
    ok(`改主键后新增 1 条（${afterSame} → ${afterNew}）`, afterNew === afterSame + 1);

    /* 乱表头 → 兜底不炸、不误写 */
    goView(m.view); await sleep(50);
    click($$(`[data-act="gen-import"][data-coll="${m.coll}"]`)[0]);
    await pickFile('#file-gen', '无关表头A,无关表头B\r\n1,2\r\n');
    ok('表头无法识别时不误写数据', store(m.coll).length === afterNew);
  }

  /* ---------- 2. 字段类型往返保真 ---------- */
  out.push('=== 2. 枚举 / 布尔 / 数字往返保真 ===');
  const DUTY_KEYS = ['ideology','party','study','daily','psych','net','crisis','career','research'];
  const HONOR_VALS = ['先锋','德育','智育','体育','美育','劳育'];
  const every = (coll, fn) => store(coll).every(fn);
  ok('tasks.duty 仍为内部键（未被中文文案污染）', every('tasks', t => !t.duty || DUTY_KEYS.includes(t.duty)));
  ok('tasks.priority 仍为 P0/P1/P2', every('tasks', t => /^P[012]$/.test(t.priority)));
  ok('tasks.status 仍为 todo/doing/done', every('tasks', t => ['todo','doing','done'].includes(t.status)));
  ok('node.category 仍为内部键', every('node', n => DUTY_KEYS.includes(n.category)));
  ok('node.status / repeat 仍为内部键',
    every('node', n => ['todo','doing','done'].includes(n.status) && ['none','week','month','term','year'].includes(n.repeat)));
  ok('node.remind_days 是数字', every('node', n => typeof n.remind_days === 'number' && !isNaN(n.remind_days)));
  ok('talks.need_follow / done_follow 是布尔',
    every('talks', t => typeof t.need_follow === 'boolean' && typeof t.done_follow === 'boolean'));
  ok('warn.resolved 是布尔', every('warn', x => typeof x.resolved === 'boolean'));
  ok('pleave.cancel 是布尔', every('pleave', x => typeof x.cancel === 'boolean'));
  ok('policy.starred 是布尔', every('policy', x => typeof x.starred === 'boolean'));
  ok('grant.amount 是数字或空', every('grant', x => x.amount === '' || typeof x.amount === 'number'));
  ok('psych.score 是数字或空', every('psych', x => x.score === '' || typeof x.score === 'number'));
  ok('honor.apply_type 仍为内部值', every('honor', x => !x.apply_type || HONOR_VALS.includes(x.apply_type)));
  ok('graduate.graduation_year 是数字', every('graduate', x => typeof x.graduation_year === 'number'));
  ok('policy 备注字段不再被丢弃（normPolicy 含 note）', /note: x\.note \|\| '',\s*\n\s*created_at[\s\S]{0,80}?\n\}\s*\nfunction normMaterial/.test(src) || /starred: !!x\.starred,\s*\n\s*note: x\.note/.test(src));

  /* ---------- 2.5 JSON 备份「导出 → 恢复」闭环 ---------- */
  out.push('=== 2.5 JSON 备份闭环（换电脑场景）===');
  goView('settings'); await sleep(80);
  capBlob = null;
  click($('#btn-export'));
  await sleep(40);
  const bak = await grab();
  ok('顶栏「导出备份」产出 JSON', !!bak && bak.trim().startsWith('{'));
  if (bak) {
    let pkg = null; try { pkg = JSON.parse(bak); } catch (e) { /* noop */ }
    ok('备份是合法 JSON 且带 data 段', !!(pkg && pkg.data));
    const COLLS = ['students','tasks','talks','stay','leave','honor','pleave','attend','node',
      'warn','help','grant','focus','psych','graduate','policy','material','comp','tpl'];
    ok('备份覆盖全部 19 个业务集合', !!pkg && COLLS.every(k => Array.isArray(pkg.data[k])));
    ok('备份含个人设置 settings', !!(pkg && pkg.data && pkg.data.settings && typeof pkg.data.settings === 'object'));

    /* 模拟换了台电脑：清掉本机设置里的辅导员姓名，再用备份恢复，看设置是否回来 */
    const nameBefore = pkg.data.settings.counselor_name || '';
    const snapshot = COLLS.map(k => [k, store(k).length]);
    w.localStorage.setItem(NS + 'settings', JSON.stringify(Object.assign({}, pkg.data.settings, { counselor_name:'' })));
    await pickFile('#file-json', bak);
    /* 弹窗里点「合并导入」 */
    const mergeBtn = $$('[data-mode="merge"]')[0];
    ok('恢复弹窗出现且有「合并导入」按钮', !!mergeBtn);
    if (mergeBtn) {
      click(mergeBtn); await sleep(120);
      ok('合并恢复后各集合条数不减少',
        snapshot.every(([k, n]) => store(k).length >= n));
      const setNow = JSON.parse(w.localStorage.getItem(NS + 'settings') || '{}');
      ok('合并恢复补回了被清空的辅导员姓名', !nameBefore || setNow.counselor_name === nameBefore);
    }
  }

  /* ---------- 3. 导入后全量视图复渲染 ---------- */
  out.push('=== 3. 导入后全量视图复渲染 ===');
  let renderFail = 0;
  const views = [...new Set($$('[data-view]').map(x => x.dataset.view).filter(Boolean))];
  for (const v of views) {
    goView(v); await sleep(30);
    const h = $('#main') ? $('#main').innerHTML : '';
    if (!h || h.length < 40) { renderFail++; out.push('  ✗ FAIL 视图 ' + v + ' 渲染为空'); }
  }
  ok(`导入后 ${views.length} 个视图仍正常渲染`, renderFail === 0);

  /* ---------- 汇总 ---------- */
  out.push('=== 运行期错误 ===');
  ok('无未捕获错误（' + errors.length + ' 条）', errors.length === 0);
  errors.slice(0, 8).forEach(e => out.push('  · ' + String(e).slice(0, 220)));

  console.log(out.join('\n'));
  console.log('\n' + (failCount === 0 ? '✅ PASS：导入/导出闭环全部通过' : `❌ FAIL：共 ${failCount} 项未通过`));
  process.exit(failCount === 0 ? 0 : 1);
})();
