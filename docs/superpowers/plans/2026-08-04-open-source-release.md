# Counselor Desk 公开开源发布 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Counselor Desk 整理为可复现测试、可公开维护并可通过 GitHub Pages 访问的公开仓库，同时保持单文件离线应用定位。

**Architecture:** `index.html` 继续是唯一运行入口，不引入前端构建工具或运行时服务。Node.js + jsdom 只作为开发测试依赖；GitHub Actions 通过 npm scripts 执行测试和语法检查，使用 pnpm lockfile 保证依赖一致，Pages 直接发布仓库静态文件。

**Tech Stack:** HTML/CSS/JavaScript、Node.js 22、npm、jsdom、GitHub Actions、GitHub Pages。

---

## 文件地图

- Create: `package.json`，声明项目元数据、Node 版本、jsdom 开发依赖和统一 npm scripts。
- Create: `pnpm-lock.yaml`，锁定测试依赖，供 CI 使用 `pnpm install --frozen-lockfile`。
- Create: `scripts/check-inline-js.js`，复用现有 CI 内联 JS 语法检查逻辑。
- Create: `scripts/check-public-surface.js`，检查公开发布时的失效本地链接、占位配置和敏感备份文件。
- Modify: `tests/regression.js`、`tests/import-loop.js`、`tests/crud-smoke.js`、`tests/student-import.js`，使用仓库声明的 `jsdom`，移除机器专属绝对路径。
- Modify: `README.md`，修复仓库链接、CI/Pages 地址、缺失英文文档引用、截图占位文案和测试安装说明。
- Modify: `CONTRIBUTING.md`、`SECURITY.md`，删除占位邮箱，补充公开仓库和 Excel CDN 的准确说明。
- Modify: `.github/workflows/tests.yml`、`.github/workflows/lint.yml`，通过锁定依赖执行统一脚本。
- Create: `.github/workflows/pages.yml`，使用官方 Pages artifact/deploy actions 发布静态站点。
- Modify: `.gitignore`，补充通用本地数据导出文件模式，防止测试或用户备份误提交。

### Task 1: 建立可复现的测试入口

**Files:**
- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Modify: `tests/regression.js`
- Modify: `tests/import-loop.js`
- Modify: `tests/crud-smoke.js`
- Modify: `tests/student-import.js`

- [ ] **Step 1: 添加项目 manifest 和 npm scripts**

创建 `package.json`，内容固定为：

```json
{
  "name": "counselor-desk",
  "version": "3.8.0",
  "private": true,
  "description": "A local-first, single-file counselor workspace for higher education.",
  "license": "MIT",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "test": "npm run test:regression && npm run test:import-loop && npm run test:crud-smoke && npm run test:student-import",
    "test:regression": "node tests/regression.js",
    "test:import-loop": "node tests/import-loop.js",
    "test:crud-smoke": "node tests/crud-smoke.js",
    "test:student-import": "node tests/student-import.js",
    "lint": "node scripts/check-inline-js.js",
    "check:public": "node scripts/check-public-surface.js"
  },
  "devDependencies": {
    "jsdom": "^26.1.0"
  }
}
```

- [ ] **Step 2: 让四套测试从项目依赖加载 jsdom**

在四个测试文件中移除机器专属路径，统一使用项目依赖：

```js
const { JSDOM, VirtualConsole } = require('jsdom');
```

保持其余测试逻辑和断言不变，避免公开仓库依赖本机目录结构。

- [ ] **Step 3: 生成并检查锁文件**

在仓库根目录运行：

```powershell
pnpm install --lockfile-only --ignore-scripts
```

预期生成 `pnpm-lock.yaml`，且不改变 `package.json` 中的版本范围。检查：

```powershell
Select-String -Path pnpm-lock.yaml -Pattern 'jsdom','specifier: \^26.1.0'
git diff --check
```

- [ ] **Step 4: 使用锁定依赖运行四套测试**

运行：

```powershell
pnpm install --frozen-lockfile
pnpm test
```

预期四套测试均输出 `PASS` 并以退出码 0 结束。使用仓库声明的 pnpm 版本执行 npm scripts；GitHub Actions 也使用同一版本的 pnpm。

- [ ] **Step 5: Commit 测试工程入口**

```powershell
git add package.json pnpm-lock.yaml tests/regression.js tests/import-loop.js tests/crud-smoke.js tests/student-import.js
git commit -m "chore: make tests reproducible"
```

### Task 2: 把质量检查脚本化

**Files:**
- Create: `scripts/check-inline-js.js`
- Create: `scripts/check-public-surface.js`
- Modify: `.gitignore`

- [ ] **Step 1: 添加内联 JS 语法检查脚本**

创建 `scripts/check-inline-js.js`，读取仓库根目录 `index.html`，提取第一个 `<script>...</script>`，用 `new Function(js)` 解析；缺少 script 或解析失败时写入 stderr 并退出 1，成功时输出脚本字符数并退出 0。

```js
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);

if (!match) {
  console.error('No inline <script> tag found');
  process.exit(1);
}

try {
  new Function(match[1]);
  console.log(`Inline JavaScript syntax OK (${match[1].length} chars)`);
} catch (error) {
  console.error(`Inline JavaScript syntax error: ${error.message}`);
  process.exit(1);
}
```

- [ ] **Step 2: 添加公开发布面检查**

创建 `scripts/check-public-surface.js`，用 Node 标准库完成以下断言和本地链接解析：

```js
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const required = ['index.html', 'README.md', 'LICENSE', 'CONTRIBUTING.md', 'SECURITY.md'];
const forbiddenText = [
  'README_EN.md',
  '<your-username>',
  '<maintainer-email>',
  'dweeedon/counselor-desk',
  'ea40c80e38ef48478bb12a2376e142ea.sh2.agentos-app.net'
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing required file: ${file}`);
}

const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
for (const text of forbiddenText) {
  if (readme.includes(text)) throw new Error(`README contains release placeholder: ${text}`);
}

const found = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const relative = path.relative(root, full);
    if (relative === '.git' || relative.startsWith(`.git${path.sep}`)) continue;
    if (relative === 'node_modules' || relative.startsWith(`node_modules${path.sep}`)) continue;
    if (relative === path.join('docs', 'superpowers') || relative.startsWith(`${path.join('docs', 'superpowers')}${path.sep}`)) continue;
    if (entry.isDirectory()) walk(full);
    else if (/\.(backup\.json|bak|dump)$/i.test(entry.name)) found.push(relative);
  }
}
walk(root);
if (found.length) throw new Error(`Sensitive backup-like files found: ${found.join(', ')}`);

const localLinkPattern = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const missingLinks = [];
for (const match of readme.matchAll(localLinkPattern)) {
  const target = match[1];
  if (/^(?:[a-z]+:|#|\/\/)/i.test(target)) continue;
  const cleanTarget = decodeURIComponent(target.split('#')[0].split('?')[0]);
  if (!cleanTarget) continue;
  const resolved = path.resolve(root, cleanTarget);
  if (!resolved.startsWith(`${root}${path.sep}`) && resolved !== root) {
    missingLinks.push(target);
    continue;
  }
  if (!fs.existsSync(resolved)) missingLinks.push(target);
}
if (missingLinks.length) throw new Error(`Missing README local links: ${missingLinks.join(', ')}`);

console.log('Public surface check passed');
```

The link regex must accept existing Unicode filenames in this repository, ignore external URLs and anchors, and reject paths that escape the repository root.

- [ ] **Step 3: Extend ignore rules for local exports**

Append these patterns to `.gitignore` without removing existing rules:

```gitignore
*.json.bak
*.export.json
*.export.csv
```

- [ ] **Step 4: Run both quality scripts**

```powershell
pnpm run lint
pnpm run check:public
```

Expected: both commands exit 0. The public check must fail before Task 3 because README still contains known release placeholders; this demonstrates that the guard is active.

- [ ] **Step 5: Commit quality checks**

```powershell
git add scripts/check-inline-js.js scripts/check-public-surface.js .gitignore
git commit -m "chore: add release quality checks"
```

### Task 3: 修正文档中的公开发布阻塞项

**Files:**
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`
- Modify: `SECURITY.md`

- [ ] **Step 1: 修复 README 发布链接和状态文案**

在 `README.md` 中完成这些确定性修改：

1. 删除不存在的 `README_EN.md` 链接。
2. 将 CI badge 改为 `https://img.shields.io/github/actions/workflow/status/7752777/counselor-desk/tests.yml?...`。
3. 将在线演示地址改为 `https://7752777.github.io/counselor-desk/`，Star 链接改为 `https://github.com/7752777/counselor-desk/stargazers`。
4. 将 clone 示例改为 `https://github.com/7752777/counselor-desk.git`。
5. 删除“截图待补”说明，保留已有五张截图。
6. 将安装 jsdom 的说明改为 `pnpm install --frozen-lockfile`，测试统一用 `pnpm test`。
7. 新增“GitHub Pages / Excel CDN”说明：应用主流程可离线运行，只有 xls/xlsx 导入会按需请求 SheetJS CDN，离线时使用 CSV。
8. 将项目结构中的 `tests/` 说明更新为“可通过 npm test 执行”，并加入 `scripts/`、`.github/workflows/pages.yml` 和 `package.json`。

- [ ] **Step 2: 移除贡献指南中的邮箱和账号占位**

在 `CONTRIBUTING.md` 中：

1. 将 fork/clone 示例统一指向 `https://github.com/7752777/counselor-desk.git`。
2. 删除需要填写 `<your-username>` 或 `<original-username>` 的 remote 命令，改为“从 GitHub Fork 后使用页面提供的 Clone 地址”。
3. 删除 `<maintainer-email>`，保留 Issues、Discussions 和 Pull Request 作为项目协作入口。
4. 将本地验证命令改为 `pnpm install --frozen-lockfile` 后执行 `pnpm test`、`pnpm run lint`、`pnpm run check:public`。

- [ ] **Step 3: 修正安全策略中的联系方式和 CDN 描述**

在 `SECURITY.md` 中：

1. 删除 `<maintainer-email>` 邮件渠道，只保留 GitHub Security Advisories。
2. 明确说明 `localStorage` 不是加密存储；重点档案密码锁只能限制界面访问，不等同于对浏览器数据的密码学加密。
3. 明确说明 SheetJS CDN 是仅在 Excel 导入时按需加载的可选外部资源，CSV/JSON 和已加载页面的本地数据流不依赖后端。

- [ ] **Step 4: Run release surface check after documentation changes**

```powershell
pnpm run check:public
```

Expected: `Public surface check passed`。

- [ ] **Step 5: Commit public-facing documentation**

```powershell
git add README.md CONTRIBUTING.md SECURITY.md
git commit -m "docs: prepare repository for public release"
```

### Task 4: 固化 GitHub Actions 和 Pages 发布

**Files:**
- Modify: `.github/workflows/tests.yml`
- Modify: `.github/workflows/lint.yml`
- Create: `.github/workflows/pages.yml`

- [ ] **Step 1: 把测试工作流切换到锁定安装**

在 `.github/workflows/tests.yml` 中保留 Node 22 和 push/PR/manual 触发，删除 `npm install --no-save jsdom`，在 Setup Node.js 后加入 pnpm action，并改为：

```yaml
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 11.9.0

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run test suites
        run: pnpm test
```

保留四套测试的可读日志名称，或在 `npm test` 前后用步骤名称标明四套测试；不得再把“无论结果如何都输出 All 4 test suites passed”作为假成功摘要。改为：

```yaml
      - name: Test summary
        if: success()
        run: echo "All test suites passed"
```

- [ ] **Step 2: 让 lint 工作流使用项目脚本**

在 `.github/workflows/lint.yml` 的 Setup Node.js 后加入：

```yaml
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 11.9.0

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Validate inline JavaScript
        run: pnpm run lint

      - name: Validate public release surface
        run: pnpm run check:public
```

保留现有大小检查，确保 CI 同时覆盖语法、公开面和文件大小。

- [ ] **Step 3: 添加 Pages workflow**

创建 `.github/workflows/pages.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: Check workflow YAML and links locally**

运行 `git diff --check`，并用 `pnpm run check:public` 确认 Pages workflow 和 README 中的路径都在仓库中。GitHub Actions 的实际执行留到推送后验证。

- [ ] **Step 5: Commit CI and Pages workflow**

```powershell
git add .github/workflows/tests.yml .github/workflows/lint.yml .github/workflows/pages.yml
git commit -m "ci: add reproducible checks and pages deployment"
```

### Task 5: 完整验证并发布到 GitHub

**Files:**
- No source changes expected; only generated screenshots/logs outside the repository.

- [ ] **Step 1: Run the complete local verification gate**

```powershell
pnpm install --frozen-lockfile
pnpm test
pnpm run lint
pnpm run check:public
git diff --check
git status --short
```

Expected: four test suites, syntax check and public surface check all pass; `git status --short` is empty except for intentionally ignored `node_modules`.

- [ ] **Step 2: Run browser smoke verification**

Use the frontend testing workflow with the exact flow:

```text
index.html -> 首页渲染 -> 切换「工作任务」 -> 新建/编辑任务 -> 导出 JSON -> 重新导入 JSON -> 页面仍显示任务
```

Check desktop and a mobile-sized viewport, no framework error overlay, no relevant console errors, and no obvious overflow or overlap. Capture screenshots outside the repository. If the Browser plugin is unavailable, use the bundled Playwright fallback and record that reason.

- [ ] **Step 3: Verify public repository safety before push**

Run:

```powershell
git ls-files | Select-String -Pattern '\.(backup\.json|bak|dump)$'
git ls-files | Select-String -Pattern '(^|/)(\.env|.*secret.*|.*token.*)$'
git status --short
```

Expected: no matches and a clean worktree.

- [ ] **Step 4: Create the public repository and push**

Use GitHub account `7752777` and repository name `counselor-desk`. Create it as public with no auto-generated README, license, or `.gitignore` because those files already exist locally. Then set and verify the remote:

```powershell
git remote add origin https://github.com/7752777/counselor-desk.git
git push -u origin master
```

If the repository already exists, verify it is empty or belongs to this project before pushing; do not overwrite unrelated remote history.

- [ ] **Step 5: Verify CI and Pages**

Open:

- `https://github.com/7752777/counselor-desk/actions`
- `https://7752777.github.io/counselor-desk/`

Confirm the Tests, Lint and Pages workflows complete successfully, the README badge resolves to the real workflow, and the Pages URL renders `index.html`.

- [ ] **Step 6: Commit or report the release result**

Do not create another source commit after push unless verification identifies a fixable issue. Report the public repository URL, Pages URL, commit IDs, tests run, browser viewport checks, and any external authentication step that required user action.

## Self-review checklist

- Spec coverage: release links, reproducible tests, public-data guard, CI, Pages, browser smoke verification, and publish order each have a task.
- Placeholder scan: this plan contains no `TBD`, `TODO`, `<your-username>`, `<maintainer-email>`, or unspecified “appropriate handling” steps.
- Consistency: scripts named in `package.json` are the same names used by CI and verification steps; GitHub owner is consistently `7752777`; repository name is consistently `counselor-desk`.
