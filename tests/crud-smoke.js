/**
 * 辅导员工作台 · 全模块增删改冒烟测试
 * 纯本地、零依赖（仅 jsdom）。用法：
 *   node tests/crud-smoke.js
 *
 * 「像真人一样」把每个模块的完整闭环走一遍：
 *   进入模块 → 点「新建」→ 填必填项 → 保存（条数 +1）
 *           → 点第一行「编辑」→ 改一个字段 → 保存（条数不变、改动生效）
 *           → 点「删除」→ 二次确认 → 确定（条数 -1）
 * 顺带验证必填校验：不填必填项点保存，不应该写进库。
 */
const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const NS = 'cwb_v1_';

/* coll / view / 动作前缀 / 主字段（编辑时用来验证改动落库） */
const SPEC = [
  { coll:'tasks',    view:'tasks',    p:'task',     main:'title',        newAct:'task-new' },
  { coll:'students', view:'students', p:'student',  main:'full_name',    newAct:'student-new', editAct:'student-view' },
  { coll:'talks',    view:'talks',    p:'talk',     main:'student_name', newAct:'talk-new' },
  { coll:'stay',     view:'stay',     p:'stay',     main:'student_name', newAct:'stay-new' },
  { coll:'leave',    view:'leave',    p:'leave',    main:'name',         newAct:'leave-new' },
  { coll:'honor',    view:'honor',    p:'honor',    main:'name',         newAct:'honor-new' },
  { coll:'pleave',   view:'pleave',   p:'pleave',   main:'name',         newAct:'pleave-new' },
  { coll:'attend',   view:'attend',   p:'attend',   main:'name',         newAct:'attend-new' },
  { coll:'node',     view:'node',     p:'node',     main:'title',        newAct:'node-new' },
  { coll:'warn',     view:'warn',     p:'warn',     main:'name',         newAct:'warn-new' },
  { coll:'help',     view:'help',     p:'help',     main:'name',         newAct:'help-new' },
  { coll:'grant',    view:'grant',    p:'grant',    main:'name',         newAct:'grant-new' },
  { coll:'focus',    view:'focus',    p:'focus',    main:'name',         newAct:'focus-new' },
  { coll:'psych',    view:'psych',    p:'psych',    main:'name',         newAct:'psych-new' },
  { coll:'graduate', view:'graduate', p:'graduate', main:'name',         newAct:'graduate-new' },
  { coll:'policy',   view:'policy',   p:'policy',   main:'title',        newAct:'policy-new' },
  { coll:'material', view:'material', p:'material', main:'title',        newAct:'material-new' },
  { coll:'comp',     view:'comp',     p:'comp',     main:'name',         newAct:'comp-new' },
  { coll:'tpl',      view:'tpl',      p:'tpl',      main:'title',        newAct:'tpl-new' },
];

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
  w.URL.createObjectURL = () => 'blob:mock';
  w.URL.revokeObjectURL = () => {};
  await sleep(500);

  const out = [];
  let failCount = 0;
  const $ = s => d.querySelector(s);
  const $$ = s => [...d.querySelectorAll(s)];
  const click = el => { if (el) el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true })); };
  const ok = (label, cond) => { if (!cond) failCount++; out.push('  ' + (cond ? '✓' : '✗ FAIL') + ' ' + label); };
  const store = coll => { try { return JSON.parse(w.localStorage.getItem(NS + coll) || '[]'); } catch (e) { return []; } };
  const goView = key => { const el = $$('[data-view]').find(x => x.dataset.view === key); click(el); return !!el; };
  /* 弹层可能是表单（data-ok）、二次确认（data-yes）或详情抽屉（data-edit-stu / data-e） */
  const modal = () => $$('[class*="mask"]').filter(m => m.querySelector('[data-ok],[data-yes],[data-edit-stu],[data-e]')).pop();
  /* 填表：所有文本/日期/数字输入都填上，select 保持默认，chips 点第一个 */
  const fillForm = (mask, token) => {
    $$('[data-k]', mask).forEach(el => {
      if (el.tagName === 'SELECT') return;
      if (el.type === 'checkbox') return;
      if (el.type === 'date') { el.value = '2026-08-04'; return; }
      if (el.type === 'number') { el.value = '1'; return; }
      el.value = token;
    });
    const chip = mask.querySelector('[data-chips] .chip');
    if (chip) click(chip);
  };
  const $$in = (sel, root) => [...root.querySelectorAll(sel)];

  /* 重点学生档案要先过隐私锁 */
  goView('focus'); await sleep(80);
  if ($('#focus-pass')) {
    $('#focus-pass').value = '1234';
    if ($('#focus-pass2')) $('#focus-pass2').value = '1234';
    click($$('[data-act="focus-set-pass"]')[0] || $$('[data-act="focus-unlock"]')[0]);
    await sleep(80);
  }

  for (const m of SPEC) {
    out.push(`=== ${m.coll} ===`);
    if (!goView(m.view)) { ok('能进入视图', false); continue; }
    await sleep(70);

    /* ---- 必填校验：直接点保存不应写库 ---- */
    const base = store(m.coll).length;
    click($$(`[data-act="${m.newAct}"]`)[0]);
    await sleep(60);
    let mk = modal();
    ok('点「新建」弹出表单', !!mk);
    if (!mk) continue;
    click(mk.querySelector('[data-ok]'));
    await sleep(60);
    ok('必填项为空时不写库', store(m.coll).length === base);

    /* ---- 新建 ---- */
    mk = modal() || mk;
    const token = 'CRUD测试_' + m.coll;
    fillForm(mk, token);
    click(mk.querySelector('[data-ok]'));
    await sleep(90);
    const afterNew = store(m.coll).length;
    ok(`新建成功（${base} → ${afterNew}）`, afterNew === base + 1);
    const created = store(m.coll).find(x => String(x[m.main] || '') === token);
    ok('新建的记录能按主字段查到', !!created);
    if (!created) continue;

    /* ---- 编辑 ---- */
    await sleep(40);
    const editAct = m.editAct || (m.p + '-edit');
    const editBtn = $$(`[data-act="${editAct}"][data-id="${created.id}"]`)[0] || $$(`[data-act="${editAct}"]`)[0];
    click(editBtn);
    await sleep(80);
    let em = modal();
    ok('点「编辑」弹出表单', !!em);
    if (em) {
      /* 学生档案是先弹详情抽屉，再点里面的「编辑档案」 */
      if (!em.querySelector('[data-k]')) {
        const inner = $$in('[data-edit-stu],[data-e],[data-act$="-edit"]', em)[0];
        click(inner); await sleep(100); em = modal();
        ok('详情抽屉里的「编辑」能打开表单', !!(em && em.querySelector('[data-k]')));
      }
      const mainInput = em && em.querySelector(`[data-k="${m.main}"]`);
      ok('编辑表单里能取到主字段输入框', !!mainInput);
      if (mainInput) {
        mainInput.value = token + '_改';
        click(em.querySelector('[data-ok]'));
        await sleep(90);
        const list = store(m.coll);
        ok(`编辑后条数不变（${afterNew}）`, list.length === afterNew);
        ok('编辑内容已落库', list.some(x => String(x[m.main] || '') === token + '_改'));
      }
    }

    /* ---- 删除 ---- */
    await sleep(40);
    const cur = store(m.coll).find(x => String(x[m.main] || '').startsWith(token));
    const delBtn = cur && ($$(`[data-act="${m.p}-del"][data-id="${cur.id}"]`)[0]);
    ok('列表里能找到该记录的「删除」按钮', !!delBtn);
    if (delBtn) {
      const n0 = store(m.coll).length;
      click(delBtn); await sleep(70);
      const cm = modal();
      ok('删除有二次确认', !!(cm && cm.querySelector('[data-yes]')));
      if (cm && cm.querySelector('[data-yes]')) {
        click(cm.querySelector('[data-yes]'));
        await sleep(90);
        ok(`确认后删除成功（${n0} → ${store(m.coll).length}）`, store(m.coll).length === n0 - 1);
      }
    }
  }

  /* ---------- 收尾：全量视图复渲染 ---------- */
  out.push('=== 收尾：全量视图复渲染 ===');
  let renderFail = 0;
  const views = [...new Set($$('[data-view]').map(x => x.dataset.view).filter(Boolean))];
  for (const v of views) {
    goView(v); await sleep(25);
    const h = $('#main') ? $('#main').innerHTML : '';
    if (!h || h.length < 40) { renderFail++; out.push('  ✗ FAIL 视图 ' + v + ' 渲染为空'); }
  }
  ok(`${views.length} 个视图仍正常渲染`, renderFail === 0);

  out.push('=== 运行期错误 ===');
  ok('无未捕获错误（' + errors.length + ' 条）', errors.length === 0);
  errors.slice(0, 8).forEach(e => out.push('  · ' + String(e).slice(0, 220)));

  console.log(out.join('\n'));
  console.log('\n' + (failCount === 0 ? '✅ PASS：全模块增删改闭环通过' : `❌ FAIL：共 ${failCount} 项未通过`));
  process.exit(failCount === 0 ? 0 : 1);
})();
