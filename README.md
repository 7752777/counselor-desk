<div align="center">

<img src="./assets/logo.svg" width="128" alt="辅导员工作台 Logo"/>

# 辅导员工作台 · Counselor Desk

面向全国高校辅导员的本地优先工作台：学生台账、重点关注、谈心谈话、任务节点、导入导出、备份恢复和学习助手集中在一个轻量页面里。

[![Version](https://img.shields.io/badge/version-4.0.0-0b3a82?style=flat-square)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-12a06b?style=flat-square)](./LICENSE)
[![Offline](https://img.shields.io/badge/works-offline-0bb4c4?style=flat-square)](./docs/辅导员工作台使用手册.md)
[![Tests](https://img.shields.io/badge/tests-v4.0%20gates-12a06b?style=flat-square)](./docs/v4-acceptance-report.md)
[![CI](https://img.shields.io/github/actions/workflow/status/7752777/counselor-desk/tests.yml?style=flat-square&logo=github-actions&logoColor=white&label=CI)](https://github.com/7752777/counselor-desk/actions)

[在线演示](https://7752777.github.io/counselor-desk/) · [网页版入口](./index.html) · [v4.0 验收记录](./docs/v4-acceptance-report.md) · [提交问题](https://github.com/7752777/counselor-desk/issues)

</div>

---

## 这是什么

辅导员工作台是一张为高校辅导员准备的“数字工作桌面”。它把每天分散在 Excel、群聊、备忘录和多个系统里的学生信息、风险提醒、谈话记录、任务节点和工作留痕，重新收拢到一个打开就能用的页面里。

打开工作台，你可以先看到今天最需要处理的事情：哪些任务已经逾期、哪些重点学生需要回访、哪条心理危机预警还没有解除；完成一次谈话后，可以顺手留下记录；月底需要汇总时，又能直接导出结构化数据或生成工作小结。它不试图替代学校正式业务平台，而是专注于辅导员最频繁、最需要连续记录的日常工作。

这是一个本地优先应用：网页版是单 HTML、双击运行的兼容版本，业务数据和附件索引写入 IndexedDB；Windows 版使用 Electron、加密 SQLite 记录仓储和附件保险库。两端都不要求账号、不建设云同步或服务器端学生数据库；换电脑时通过 v7 备份、交换包或便携 HTML 手动迁移。

### 一线工作场景，打开就能接上

- **今天先做什么？** 首页把逾期任务、心理危机、重点学生回访、请销假和工作节点放在同一张清单里，减少在多个表格之间来回翻找。
- **学生数据怎么进来？** 不管学校导出的是 Excel、WPS、LibreOffice 还是不同编码的 CSV，都可以先识别工作表、表头和字段，再预览、校验、确认后写入。
- **谈过的话不能只停留在记忆里。** 谈心谈话、重点关注、学业帮扶、心理摸排和工作留痕可以关联到学生，形成可回溯的连续记录。
- **月底材料怎么整理？** 任务、谈话、考勤、奖助、就业和工作节点均支持模板、导入、导出和结构化回传，学习助手还可以沉淀政策资料、笔记和摘要。
- **换电脑怎么办？** 数据中心提供完整备份、便携工作台、浏览器能力检查、容量提醒和最近导入撤销，让本机优先不等于数据孤立。

### 为什么适合做成开源项目

辅导员工作台希望把“好用的个人工作方法”变成所有高校都能讨论、修改和复用的公共工具。不同学校的表头、字段和工作习惯并不完全相同，所以项目把导入 schema、字段别名、备份格式和 `window.CWB` 扩展接口公开出来，方便老师和开发者共同适配，而不是把所有人锁在一套不可修改的流程里。

如果它帮你少漏掉一次回访、少重复整理一张表，或者让新入职的辅导员更快熟悉学生工作，欢迎点一个 Star、提交一份脱敏兼容样表，或者在 Issue 里分享你的改进建议。每一个真实场景反馈，都会帮助这个工作台更适合不同地区、不同学校和不同专业的辅导员。

### 它适合谁

- 想把日常学生工作从多个临时表格整理成一套连续记录的辅导员；
- 需要先用示例数据熟悉流程，再逐步导入真实名单的新老师；
- 希望在本地、离线、可备份环境中管理个人工作记录的老师；
- 想为本校字段、台账或流程做二次扩展的高校信息化人员和开发者。

> 重要边界：v4.0 仍不包含账号体系、云同步、服务器端学生数据库、自动联网就业抓取或人脸识别。网页版不承诺指定文件夹定时写入；桌面版自动备份在下次启动时补做漏跑任务。

## v3.9 做了什么

### 对辅导员老师

- 首次启动提供“体验示例 / 正式初始化 / 从备份恢复”三个入口。
- 正式初始化按个人信息、学生名单、首次备份三步完成，关闭页面后进度仍保留。
- 学生台账覆盖重点关注、心理危机、学业预警、谈话回访、宿舍和班级等日常视角。
- 任务、谈话、工作留痕、校外住宿、假期去向、评优、请销假、考勤、工作节点、学业与资助、重点关怀、就业和资料学习模块保持统一交互。
- 学习助手支持资料进度、笔记摘要、本地学习记录和导出，不会自动上传第三方。
- 五套配色、深色模式、本地背景图、背景透明度调节和默认外观恢复均可在设置中完成。

### 对全国高校表格

- CSV 支持 UTF-8、UTF-8 BOM、GBK/GB18030；识别失败时可以手动切换编码并实时预览。
- XLS/XLSX 使用固定打包的 SheetJS 0.20.3 离线解析器，不依赖运行时 CDN。
- Excel 支持多工作表、合并标题行和前 20 行表头扫描，会推荐字段命中率最高的工作表与表头行。
- 字段映射、别名、类型、必填性、敏感级别、枚举和合并规则由统一 `ImportSchema` 驱动。
- 学号始终按文本处理，保留前导零；科学计数法学号、非法日期、无效手机号/邮箱/身份证号不会被静默改成默认值。
- 正式入库要求学号与姓名同时存在；缺少任一项的记录会进入“待确认”，不会直接写入。
- 文件内完全相同行会自动合并；同一学号的不同内容会标记冲突，必须由用户选择。
- 导入采用快照、整批原子提交和失败回滚；刷新页面后仍可撤销最近一次成功导入。
- 普通导出默认排除身份证号、家庭地址、家长电话等敏感字段；敏感导出需要操作锁和主动确认。

### 对公开发布稳定性

- 18 个模块统一支持“下载模板 → 修改 → 预览 → 校验 → 导入 → 刷新 → 撤销 → 再导出”闭环。
- 每条记录包含稳定 `record_id`；有 `record_id` 时优先更新，缺少稳定主键且自然键可能匹配多条记录时不会静默覆盖。
- CSV 导出会转义以 `=、+、-、@` 开头的内容，降低公式注入风险。
- 本地存储健康度在约 70% 和 85% 处分级提醒；浏览器能力、离线 Excel、文件读取和最近撤销记录都能在数据中心查看。
- 背景图上限为 4MB，压缩失败、格式不支持或容量不足时恢复旧背景。
- 发布包附带使用手册、字段字典、SheetJS 许可证、测试报告和 13 份脱敏兼容样表。

## 截图

### 首次使用与今日概览

![首次使用引导](./assets/screenshots/onboarding.png)
![今日概览](./assets/screenshots/dashboard.png)

### 学生台账与安全导入预览

![学生台账](./assets/screenshots/students.png)
![Excel 导入预览](./assets/screenshots/import-preview.png)

### 数据中心与业务模块

![数据存储与备份](./assets/screenshots/data-center.png)
![工作节点](./assets/screenshots/calendar.png)
![重点学生档案](./assets/screenshots/focus.png)
![深色模式](./assets/screenshots/dark.png)

截图均使用内置示例数据，不包含真实学生信息。对外演示或二次传播时请继续使用脱敏数据。

## 30 秒开始使用

### 直接使用

1. 下载 [发布版 HTML](./output/counselor-desk-v4.0.0/辅导员工作台.html)，或下载仓库中的 `index.html`。
2. 用 Chrome、Edge、Firefox ESR 或 Safari 16+ 打开。
3. 首次打开选择“体验示例”“正式初始化”或“从备份恢复”。
4. 正式使用前先导入学生名单，并在数据中心导出第一份 JSON 备份。

### 从源码构建发布包

日常使用不需要 Node.js。只有运行测试、生成发布包或参与开发时才需要 Node.js 20+ 和 pnpm：

```bash
pnpm install --frozen-lockfile
pnpm run build:package
```

生成目录：

```text
output/counselor-desk-v4.0.0/
├── 辅导员工作台.html       # 可直接双击的单文件发布版
├── 使用手册.md
├── 字段字典与数据约定.md
├── 测试报告.md
├── THIRD-PARTY-LICENSE-SheetJS.txt
└── 脱敏兼容样表/            # CSV、XLS、XLSX 共 13 份
```

仓库源入口仍保留为 `index.html`；发布包中的中文文件名是给老师下载和识别的版本。

## 导入工作流

学生初始化和 18 个模块都遵循同一条安全路径：

```text
选择文件
  → 识别编码 / 工作表 / 表头
  → 字段映射与本校预设
  → 逐行校验
  → 预览新增、更新、待确认、冲突、跳过
  → 用户确认
  → 快照
  → 原子写入
  → 可下载导入报告与撤销入口
```

建议首次使用时先下载模板，再拿 1–3 行脱敏数据试导入；确认表头、班级、学号和敏感字段无误后，再导入完整名单。兼容样表位于 [`samples/import-compat`](./samples/import-compat)。

统一接口：

```javascript
const preview = await CWB.importer.previewFile(file, 'students', { encoding: 'auto' });
const run = CWB.importer.commitPreview(preview.id, { confirmSensitive: true });
CWB.importer.undo(run.runId);
CWB.importer.getHistory();
```

旧版 `previewCSV` 和 `commitCSV` 入口继续保留，便于已有扩展逐步迁移。

## 隐私与数据安全

- 网页端业务数据和附件索引写入 IndexedDB；桌面端记录和附件使用本地加密仓储，不会自动上传到服务器。
- 启动锁、手动上锁、敏感导出、重点档案、学生删除、批量删除和清空数据均有二次验证边界。
- 桌面端数据密钥由 Windows `safeStorage` 保护；备份口令无法找回，仍需配合设备账户、磁盘和学校安全制度。
- 请勿把真实身份证号、家庭住址、家长电话上传到公共 Issue、截图、演示站或未经授权的电脑。
- 更换电脑、重装系统或更换浏览器前，请先导出完整 JSON 备份，并在新环境恢复后抽查学生数与敏感字段。

## 测试与质量门槛

当前 v4.0.0 候选构建已通过：

- v3.9 回归与 v4.0 数据底座、迁移、附件、备份、Electron 和业务测试；
- 29 个页面渲染检查；
- 18 个模块导入/导出及增删改闭环；
- 0、1、100、5,000、10,000 行及 100 列学生导入压力场景；
- 重复学号、同名学生、前导零、科学计数法、非法日期、乱码、敏感字段和公式文本场景；
- 真实 Chromium 浏览器 1366×768、390×844、320×568 验收；
- 内联 JavaScript、公开接口、发布包完整性和生产依赖安全审计；正式代码签名和 99.7% 运营指标仍由发布门禁单独校验。

复现：

```bash
pnpm test
pnpm run lint
pnpm run check:public
pnpm run test:release
pnpm audit --prod
```

完整结果见 [v4.0 验收记录](./docs/v4-acceptance-report.md)。Edge、Firefox、移动尺寸、键盘导航、对比度和长文本检查也已纳入 v4.0 清单。

## 开发与扩展

应用以 `window.CWB` 暴露稳定扩展面，适合高校或个人在本地增加字段和模块：

```javascript
CWB.version
CWB.db.students
CWB.importSchemas.students
CWB.importer.previewFile(file, 'students', { encoding: 'auto' })
CWB.modules.register({
  key: 'dorm-check',
  name: '宿舍检查',
  duty: 'daily',
  icon: 'home',
  render: () => '<div>我的自定义模块</div>'
})
```

详细接口、字段、备份结构和兼容约定见：

- [辅导员工作台使用手册](./docs/辅导员工作台使用手册.md)
- [数据格式与联动约定](./docs/数据格式与联动约定.md)
- [二次开发指南](./docs/二次开发指南.md)
- [迁移与备份说明](./docs/v4-migration-and-backup.md)
- [隐私说明](./docs/v4-privacy.md)
- [党建规则版本说明](./docs/v4-party-rules.md)
- [签名发布流程](./docs/v4-release-signing.md)
- [v3.9 迭代记录](./docs/迭代记录/2026-08-v3.9.md)
- [v3.9 全国高校兼容性加固计划](./docs/迭代记录/2026-08-v3.9-全国高校兼容性加固计划.md)

## 项目结构

```text
counselor-desk/
├── index.html                         # 源码入口
├── desktop/                           # Electron 主进程、预加载和 SQLite 仓储
├── src/core/                          # 共享导入、仓储、备份和业务规则核心
├── vendor/                            # 离线 Excel、ZIP、Argon2id、ECharts 资源
├── assets/                            # Logo、图标、Banner、公开截图
├── samples/import-compat/             # 脱敏兼容样表
├── scripts/                           # 测试、发布和样表生成脚本
├── tests/                             # 回归、导入安全、UI、压力测试
├── docs/                              # 手册、字段约定、ADR、测试报告
└── output/                            # 本地构建产物，不替代源码入口
```

## 版本路线

- **v3.9**：稳定性、全国高校表格兼容、首次使用、安全锁、导入原子性、撤销、备份和本地学习助手。
- **v4.0**：双形态本地优先底座、IndexedDB/SQLite、加密附件与备份、分段导入、照片/班团/党建/文件库/就业资源和验收门禁。
- **后续版本**：只在另立项目并完成隐私评估后考虑账号、云同步或人脸识别；当前不承诺这些能力。

## 贡献、问题与许可证

欢迎高校辅导员用脱敏样表反馈字段差异、浏览器兼容问题和使用建议。提交 Issue 时请说明浏览器版本、操作系统、文件类型和可复现步骤，严禁上传真实学生信息。

- [贡献指南](./CONTRIBUTING.md)
- [安全说明](./SECURITY.md)
- [更新日志](./CHANGELOG.md)
- [MIT License](./LICENSE)
