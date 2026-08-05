<div align="center">

<img src="./assets/logo.svg" width="128" alt="辅导员工作台 Logo"/>

# 辅导员工作台 · Counselor Desk

面向全国高校辅导员的本地优先工作台：学生台账、重点关注、谈心谈话、任务节点、导入导出、备份恢复和学习助手集中在一个轻量页面里。

[![Version](https://img.shields.io/badge/version-3.9.0-0b3a82?style=flat-square)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-12a06b?style=flat-square)](./LICENSE)
[![Offline](https://img.shields.io/badge/works-offline-0bb4c4?style=flat-square)](./docs/辅导员工作台使用手册.md)
[![Tests](https://img.shields.io/badge/tests-11%20suites-12a06b?style=flat-square)](./docs/测试报告-v3.9.md)
[![CI](https://img.shields.io/github/actions/workflow/status/7752777/counselor-desk/tests.yml?style=flat-square&logo=github-actions&logoColor=white&label=CI)](https://github.com/7752777/counselor-desk/actions)

[在线演示](https://7752777.github.io/counselor-desk/) · [下载源入口](./index.html) · [v3.9 发布包说明](./docs/测试报告-v3.9.md) · [提交问题](https://github.com/7752777/counselor-desk/issues)

</div>

---

## 这是什么

辅导员工作台是一个本地运行的静态 Web 应用。它不要求账号、不连接服务器，数据默认只保存在当前浏览器的本地存储中，适合个人日常工作、教学演示、脱敏数据整理和离线环境使用。

v3.9 的重点不是增加更多按钮，而是把公开使用最容易出错的环节做稳：第一次初始化、全国高校常见表格、敏感信息保护、导入失败回滚、数据备份和移动端窄屏显示。

> 重要边界：v3.9 不包含账号体系、云端存储、电脑与手机自动同步或跨设备冲突解决。这些内容保留到 v4.0 进行独立设计。

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

1. 下载 [发布版 HTML](./output/辅导员工作台-v3.9.0/辅导员工作台.html)，或下载仓库中的 `index.html`。
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
output/辅导员工作台-v3.9.0/
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

- 数据默认写入浏览器 `localStorage`，不会自动上传到服务器。
- 启动锁、手动上锁、敏感导出、重点档案、学生删除和清空数据均有二次验证边界。
- 这是一层本地操作保护，不等同于端到端加密或学校正式信息安全系统。
- 请勿把真实身份证号、家庭住址、家长电话上传到公共 Issue、截图、演示站或未经授权的电脑。
- 更换电脑、重装系统或更换浏览器前，请先导出完整 JSON 备份，并在新环境恢复后抽查学生数与敏感字段。

## 测试与质量门槛

当前 v3.9.0 候选构建已通过：

- 11 组自动化测试；
- 23 个页面渲染检查；
- 18 个模块导入/导出及增删改闭环；
- 0、1、100、1,000、5,000 行学生导入压力场景；
- 重复学号、同名学生、前导零、科学计数法、非法日期、乱码、敏感字段和公式文本场景；
- 真实 Chromium 浏览器 1366×768、390×844、320×568 验收；
- 内联 JavaScript、公开接口、发布包完整性和生产依赖安全审计。

复现：

```bash
pnpm test
pnpm run lint
pnpm run check:public
pnpm run test:release
pnpm audit --prod
```

完整结果见 [v3.9 测试报告](./docs/测试报告-v3.9.md)。Edge、Firefox ESR、Safari 16+、WPS 和 LibreOffice 的公开发布前人工冒烟清单也已写入使用手册。

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
- [v3.9 迭代记录](./docs/迭代记录/2026-08-v3.9.md)
- [v3.9 全国高校兼容性加固计划](./docs/迭代记录/2026-08-v3.9-全国高校兼容性加固计划.md)

## 项目结构

```text
counselor-desk/
├── index.html                         # 源码入口
├── vendor/xlsx.full.min.js            # 开发环境离线 Excel 解析器
├── assets/                            # Logo、图标、Banner、公开截图
├── samples/import-compat/             # 脱敏兼容样表
├── scripts/                           # 测试、发布和样表生成脚本
├── tests/                             # 回归、导入安全、UI、压力测试
├── docs/                              # 手册、字段约定、ADR、测试报告
└── output/                            # 本地构建产物，不替代源码入口
```

## 版本路线

- **v3.9**：稳定性、全国高校表格兼容、首次使用、安全锁、导入原子性、撤销、备份和本地学习助手。
- **v4.0**：再设计账号体系、电脑与手机数据同步、PWA/移动端数据携带、跨设备冲突预览和云端数据治理。

## 贡献、问题与许可证

欢迎高校辅导员用脱敏样表反馈字段差异、浏览器兼容问题和使用建议。提交 Issue 时请说明浏览器版本、操作系统、文件类型和可复现步骤，严禁上传真实学生信息。

- [贡献指南](./CONTRIBUTING.md)
- [安全说明](./SECURITY.md)
- [更新日志](./CHANGELOG.md)
- [MIT License](./LICENSE)
