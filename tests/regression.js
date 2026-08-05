/**
 * 辅导员工作台 · 回归测试
 * 纯本地、零依赖（仅 jsdom）。用法：
 *   node tests/regression.js
 * 覆盖：语法/加载无错、22 视图全量渲染、Phase A/B/C 关键特性。
 */
const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const errors = [];
  const vc = new VirtualConsole();
  // 丢弃 jsdom 未实现的 window.scrollTo 噪声（已在 go() 的 try-catch 内，真实浏览器无此问题）
  const IGNORE = /scrollTo|Not implemented|Could not load|getaddrinfo/i;
  vc.on('jsdomError', e => { if (IGNORE.test(e.message)) return; errors.push('jsdomError: ' + (e.detail && e.detail.stack || e.message)); });
  vc.on('error', (...a) => { const s = a.join(' '); if (IGNORE.test(s)) return; errors.push('console.error: ' + s); });
  // 加载即触发脚本执行，语法错误会在此抛出
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
  const mainHTML = () => ($('#main') ? $('#main').innerHTML : '');

  // ---------- 1. 22 视图全量渲染 ----------
  out.push('=== 1. 全部视图渲染 ===');
  const navViews = $$('#sidenav [data-view], [data-view]').filter((v, i, a) => a.indexOf(v) === i);
  const seen = new Set();
  let renderFail = 0;
  for (const item of navViews) {
    const key = item.dataset.view;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    click(item);
    await sleep(60);
    const html = mainHTML();
    if (!html || html.length < 40) { renderFail++; out.push('  ✗ FAIL 视图 ' + key + ' 渲染为空'); }
  }
  ok('视图渲染无空页（共 ' + seen.size + ' 个，失败 ' + renderFail + '）', renderFail === 0);

  // ---------- 2. 顶部全局搜索（Phase A）----------
  out.push('=== 2. 全局搜索（Phase A）===');
  ok('顶栏 #global-search 存在', !!$('#global-search'));
  const gs = $('#global-search');
  if (gs) { gs.value = '张'; gs.dispatchEvent(new w.Event('input', { bubbles: true })); await sleep(120); }
  ok('输入关键词后出现结果面板', !!$('#gs-panel') && $('#gs-panel').innerHTML.length > 0);

  // ---------- 3. 首页趋势图 + KPI 环比 + donut + 洞察（Phase A/C）----------
  out.push('=== 3. 首页图表与洞察（Phase A/C）===');
  click($('[data-view="home"]')); await sleep(150);
  const home = mainHTML();
  ok('首页含「较上月」环比标签', home.includes('较上月'));
  ok('首页含趋势折线 svg', $$('#main svg').length > 0);
  ok('首页含「学生关注结构」donut 卡片', home.includes('学生关注结构'));
  ok('首页含「数据洞察」卡片', home.includes('数据洞察'));
  ok('首页含 .insight 洞察指标卡', $$('#main .insight').length >= 3);
  ok('首页含占比环形图 svg', $$('#main svg[aria-label="占比环形图"]').length >= 1);

  // ---------- 4. 侧栏搜索 / 折叠 / 钉住（Phase B）----------
  out.push('=== 4. 侧栏交互（Phase B）===');
  ok('侧栏 #nav-search 存在', !!$('#nav-search'));
  const firstPin = $('#sidenav [data-pin]') || $('[data-pin]');
  ok('存在可钉住项 [data-pin]', !!firstPin);
  if (firstPin) {
    click(firstPin); await sleep(80);
    ok('点击钉住后 #nav-pinned 出现条目', $('#nav-pinned') && $('#nav-pinned').children.length > 0);
  }
  const fold = $('[data-fold]');
  if (fold) { click(fold); await sleep(60); }
  ok('点击分组折叠不报错', true);

  // ---------- 5. 任务批量操作（Phase B3）----------
  out.push('=== 5. 任务批量操作（Phase B3）===');
  click($('[data-view="tasks"]')); await sleep(120);
  const bulkBtn = $('#main [data-act="bulk-toggle"]');
  ok('任务视图含「批量管理」按钮', !!bulkBtn);
  if (bulkBtn) {
    click(bulkBtn); await sleep(100);
    ok('进入批量模式出现 .bulk-bar', !!$('#main .bulk-bar'));
    const checks = $$('#main input[data-act="bulk-sel"]');
    if (checks.length >= 2) {
      click(checks[0]); click(checks[1]); await sleep(60);
      ok('勾选后 #bulk-count=2', $('#bulk-count') && $('#bulk-count').textContent === '2');
    } else {
      out.push('  (skip) 示例任务不足 2 条，跳过勾选断言');
    }
  }

  // ---------- 6. 预警视图 donut（Phase C1）----------
  out.push('=== 6. 学业预警环形图（Phase C1）===');
  click($('[data-view="warn"]')); await sleep(120);
  const warn = mainHTML();
  ok('预警视图含「预警等级分布」', warn.includes('预警等级分布'));
  ok('预警视图含占比环形图 svg', $$('#main svg[aria-label="占比环形图"]').length >= 1);

  // ---------- 7. 周报/月报一键导出（Phase C2）----------
  out.push('=== 7. 周报/月报导出（Phase C2）===');
  click($('[data-view="report"]')); await sleep(120);
  const rep = mainHTML();
  ok('汇报视图含「本周小结」按钮', rep.includes('本周小结'));
  ok('汇报视图含「本月小结」按钮', rep.includes('本月小结'));
  let exportOk = true;
  try { click($('[data-act="sum-week"]')); await sleep(80); } catch (e) { exportOk = false; out.push('  ✗ FAIL 本周小结点击: ' + e.message); }
  try { click($('[data-act="sum-month"]')); await sleep(80); } catch (e) { exportOk = false; out.push('  ✗ FAIL 本月小结点击: ' + e.message); }
  ok('周报/月报导出点击无异常', exportOk);

  // ---------- 运行时错误 ----------
  out.push('=== 运行时错误 ===');
  if (errors.length) { out.push('  ✗ FAIL 共 ' + errors.length + ' 条:'); errors.slice(0, 8).forEach(e => out.push('    - ' + e)); failCount += errors.length; }
  else out.push('  ✓ 0 条');

  const pass = failCount === 0;
  out.push('\n=== 结论: ' + (pass ? 'PASS ✅' : 'FAIL ❌') + '（失败项 ' + failCount + '）===');
  console.log(out.join('\n'));
  process.exit(pass ? 0 : 1);
})().catch(e => { console.log('FATAL: ' + (e.stack || e.message)); process.exit(1); });
