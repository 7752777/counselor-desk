<div align="center">

<img src="./assets/logo.svg" width="96" alt="辅导员工作台 Logo" />

# 辅导员工作台 · Counselor Desk

### 给高校辅导员的一张本地数字工作桌

**v4.0.0 · Windows 桌面版 + 单 HTML 网页版**

每天要跟进的学生、要提交的表、要补录的谈话和要找的政策文件，不必再分散在 Excel、群文件和聊天记录里来回翻。打开辅导员工作台，就能从今天最急的事情继续做下去。

它把学生台账、谈心谈话、重点关注、工作留痕、资料库、就业资源和备份迁移放在一起，既能处理一条学生记录，也能接住一整张学校大表；既能在电脑上长期使用，也能用手机临时查看和回传。

[![Version](https://img.shields.io/badge/version-4.0.0-0b3a82?style=for-the-badge)](./CHANGELOG.md)
[![Windows](https://img.shields.io/badge/Windows-10%2F11-2563eb?style=for-the-badge&logo=windows)](./docs/v4-migration-and-backup.md)
[![Web](https://img.shields.io/badge/Web-Single%20HTML-0ea5e9?style=for-the-badge&logo=html5&logoColor=white)](./index.html)
[![Mobile exchange](https://img.shields.io/badge/Mobile-File%20Exchange-0891b2?style=for-the-badge&logo=android&logoColor=white)](./docs/v4-migration-and-backup.md)
[![Local first](https://img.shields.io/badge/Local--first-Data%20stays%20with%20you-0f766e?style=for-the-badge)](./docs/v4-privacy.md)
[![Tests](https://img.shields.io/badge/tests-regression%20gate-16a34a?style=for-the-badge)](./docs/v4-acceptance-report.md)
[![License](https://img.shields.io/badge/license-MIT-7c3aed?style=for-the-badge)](./LICENSE)

<br />

[在线体验网页版](https://7752777.github.io/counselor-desk/) · [仓库入口](./index.html) · [启动与使用手册](./docs/辅导员工作台使用手册.md) · [迁移与备份](./docs/v4-migration-and-backup.md) · [提交建议](https://github.com/7752777/counselor-desk/issues) · [给项目点 Star](https://github.com/7752777/counselor-desk)

</div>

<p align="center">
  <img src="./assets/github-hero-v4.png" alt="辅导员工作台 v4.0 本地工作桌" width="100%" />
</p>

> 这不是要替代学校正式业务系统的“大平台”。它更像辅导员自己的工作桌：今天要回访谁、哪张表要交、哪条记录还没补、下次换电脑如何带走数据，都能在一个本地窗口里找到答案。

## 启动方式

当前公开版本是 **v4.0.0**，同时提供 Windows 桌面版和单 HTML 网页版。两端共用业务数据结构，但数据默认留在当前设备，不需要账号或云服务。

| 你要做什么 | 怎么启动 | 适合场景 |
| --- | --- | --- |
| 使用网页版 | 双击发布包里的 `辅导员工作台.html`；仓库内直接打开 [`index.html`](./index.html) | 零安装、离线使用、手机临时查看或录入 |
| 开发预览网页版 | `pnpm install --frozen-lockfile` 后运行 `pnpm run web:dev`，打开 `http://127.0.0.1:4173` | 调试网页、检查静态资源和浏览器行为 |
| 开发预览桌面版 | `pnpm install --frozen-lockfile` 后运行 `pnpm run desktop:dev` | Windows 本地数据库、附件保险库和桌面 IPC 联调 |
| 构建 Windows 安装包 | 运行 `pnpm run desktop:build` | 生成安装版和便携版，文件位于 `output/desktop/` |
| 构建完整网页发布包 | 运行 `pnpm run build:release` | 生成内嵌运行时的 `output/辅导员工作台.html` |

普通用户不需要安装 Node.js、pnpm 或 Electron；下载发布包后，按第一行双击 HTML，或运行 Windows 安装包即可。开发者命令和测试入口见[贡献指南](./CONTRIBUTING.md)。

## 先把每天最费时间的事理顺

很多日常工作并不难，真正让人疲惫的是资料总在不同地方，做完一遍还要重复整理：

- 学校每次导出的学生表头都不一样，导入前还得先手工改列名、删空列、担心漏字段。
- 假期去向表、德育考核表、宿舍异动表、校长讲话稿和安全提示散落在不同文件夹，急用时总想不起放在哪里。
- 学号、照片、宿舍、谈话记录、预警和重点关注分开维护，跟进一个学生要反复切换页面。
- 想在手机上临时改几条数据，或清空工作区做演示，又担心误删原来的记录。

辅导员工作台 v4.0 就是围绕这些高频堵点做的：少切窗口，少重复录入，数据始终能导出、回退和带走；学校要求统一口径的表单和材料，也能在自己的资料平台里按类别集中管理。

## 打开之后，很多事情就能顺着做下去

不用先搭系统，也不用先学一套复杂流程。打开后可以直接从学生、任务、表格或资料中的任意一个入口开始。

| 工作场景 | 直接可用的能力 |
| --- | --- |
| 学生台账 | 导入 Excel/CSV；未知表头保留为自定义字段；表格、卡片、照片花名册三种视图切换。 |
| 培养层次 | 本科与研究生同时管理；同一学号、同一年份也按培养层次分别识别，不会互相覆盖。 |
| 灵活筛选 | 按学号、姓名、班级、培养层次、生源地、宿舍、成绩或任意导入字段筛选和排序。 |
| 照片管理 | 文件夹、ZIP、批量文件和单人补传；按学号或唯一姓名归档；无法确认的照片进入人工队列。 |
| 工作留痕 | 谈心谈话、学业预警、重点学生、班团组织、党员发展和工作节点集中维护。 |
| 文件资料库 | 归档通知、表单、政策文件、讲话稿和工作材料；支持搜索、下载、版本回退和本地附件。 |
| 政策知识库 | 记录来源、文号、关键词和摘要；网页链接可直接打开，也可以上传本地 PDF、Word、表格等文件。 |
| 就业资源 | 离线保存经核验的官方就业平台，按地区和行业筛选，不自动抓取第三方页面。 |
| 换机与备份 | 导出换机包；手机端打开网页后增删改；桌面端预览差异，再选择合并或覆盖。 |

## 它帮你省下的，不只是几次点击

| 以前最容易卡住的地方 | v4.0 的处理方式 | 最后得到的结果 |
| --- | --- | --- |
| 学校大表每次列名不同，导入前要手工整理 | 先预览、识别和映射；未知字段保留为自定义字段，不静默丢失 | 大表可以直接导入，导入前后都看得见、查得回 |
| 表单模板、政策文件和讲话稿散落在电脑里 | 在文件资料库里按表单、政策、通知、讲话稿等类型归档，支持搜索、下载和版本回退 | 需要哪份材料时，从工作台直接找到并导出 |
| 学生档案、谈话记录、预警和任务彼此割裂 | 用学号、学生和工作事项把台账、跟进、提醒和留痕串起来 | 今天该处理谁、下一步做什么，一眼能看清 |
| 手机临时修改后，不敢直接覆盖电脑数据 | 手机用文件交换，桌面端先看差异，再合并或覆盖，并自动留回退快照 | 外出也能补录，回到电脑仍然有审阅和退路 |
| 换电脑或清缓存时担心资料丢失 | 网页端导出备份，桌面端连同数据库、照片和附件一起迁移 | 数据掌握在自己手里，换设备也能继续工作 |

## 手机可以参与工作，但不需要云账号

手机往返采用“文件交换”方式，适合临时外出、走访和现场补录。它不是云端实时同步：数据包由你自己保存、传递和导入，桌面端始终是可控的主工作区。

1. 桌面端进入“备份与迁移”，导出手机工作包。
2. 把 JSON 文件传到手机，手机浏览器打开仓库里的 `index.html`，导入后即可查看、增加、修改和删除记录。
3. 手机端导出回传包，再传回桌面电脑。
4. 桌面端先看新增、更新、删除数量，再选择“合并并同步”或“覆盖并同步”；操作前会自动保存回退快照。

详细步骤见[迁移与备份说明](./docs/v4-migration-and-backup.md)。

## 样例 A/B：放心试导入，也能完整还原

需要演示或测试新表格时，可以把当前工作区保存为“样例 A”，然后清空工作区导入“样例 B”。测试结束后，从快照恢复样例 A，学生、工作记录、文件目录和本地附件一起回到原状态。

这条流程适合：

- 试验新的 Excel 表头和字段映射；
- 给同事演示一个干净的工作区；
- 验证手机回传包的合并、覆盖和删除行为；
- 更换电脑前先做一次可验证的迁移演练。

## v4.0 的关键改进

- **动态字段**：标准字段、学校自定义字段和未知字段都会进入档案，表格列按实际数据生成。
- **数据可带走**：网页版使用浏览器本地存储；Windows 桌面版可把数据库、文件目录和附件一起备份。
- **照片只做归档**：按学号或唯一姓名匹配，不采集人脸特征，不生成生物特征向量。
- **手机回传可审阅**：先看差异再写入，合并保留桌面端其他记录，覆盖才会镜像手机端删除。
- **工作数据有退路**：清空、恢复、覆盖和迁移前都可以生成快照，便于反复试验。

## 功能界面一览

下面的截图统一使用日间主题，每个界面单独放大展示，方便直接看清表格、提醒、导入预览和备份操作。截图均使用示例或脱敏数据，不包含真实学生信息。

<p align="center">
  <img src="./assets/screenshots/onboarding.png" width="100%" alt="首次使用引导与首页待办" />
</p>

<p align="center">
  <img src="./assets/screenshots/dashboard.png" width="100%" alt="首页今日要处理与学生工作提醒" />
</p>

<p align="center">
  <img src="./assets/screenshots/students.png" width="100%" alt="学生台账与关注等级筛选" />
</p>

<p align="center">
  <img src="./assets/screenshots/calendar.png" width="100%" alt="工作节点与周期提醒" />
</p>

<p align="center">
  <img src="./assets/screenshots/import-preview.png" width="100%" alt="学生大表导入预览与字段识别" />
</p>

<p align="center">
  <img src="./assets/screenshots/data-center.png" width="100%" alt="数据存储、备份与迁移" />
</p>

<p align="center">
  <img src="./assets/screenshots/focus.png" width="100%" alt="重点学生档案与隐私保护锁" />
</p>

## 桌面版与网页版

| 版本 | 适合场景 | 数据方式 |
| --- | --- | --- |
| **Windows 桌面版** | 日常主工作区、照片和本地附件、完整备份迁移 | Electron + SQLite + 本地附件保险库 |
| **单 HTML 网页版** | 双击即用、手机临时查看和录入、轻量离线场景 | 浏览器 IndexedDB + 文件交换包 |

两端复用同一套业务数据结构。当前版本不包含账号体系、云端实时同步、远程审批或自动抓取第三方就业内容；这些边界是为了让数据去向清楚、部署成本可控。

## 隐私边界

- 默认不要求账号，不把学生档案上传到项目服务器。
- 桌面版的照片和其他附件保存在本机附件库；导出、导入和删除操作会给出明确提示。
- 心理健康、政治面貌、照片和备份属于敏感信息，请按学校制度设置电脑权限并妥善保管导出文件。
- 项目不做人脸识别；照片匹配只使用学号、唯一姓名和人工确认。

详见[隐私说明](./docs/v4-privacy.md)和[验收报告](./docs/v4-acceptance-report.md)。

## 版本故事

| 版本 | 重点变化 |
| --- | --- |
| **v1.0** | 学生台账、CSV 导入导出和本地保存，打开文件即可工作。 |
| **v2.0** | 统一视觉、移动端导航和高频业务模块，工作台开始形成完整工具链。 |
| **v3.0** | 补齐 19 个业务模块、数据联动和报表汇总。 |
| **v3.8** | 强化大表导入、字段匹配、缺失值处理和回归测试。 |
| **v4.0** | 双形态运行、动态字段、文件资料库、就业资源、手机文件交换和样例快照。 |

## 第一次使用

1. 直接打开仓库里的 [`index.html`](./index.html)。
2. 首次启动选择“体验示例”或“正式初始化”。
3. 在“学生台账”导入脱敏 Excel/CSV，先看预览和字段映射，再确认写入。
4. 在“文件资料库”或“政策知识库”上传本地材料，网页链接可以直接打开。
5. 正式工作前，在“备份与迁移”生成一份可恢复的快照或备份包。

## 开发者入口

```powershell
pnpm install --frozen-lockfile
pnpm run web:dev       # http://127.0.0.1:4173
pnpm run desktop:dev   # Electron 桌面开发模式
pnpm test
pnpm run lint
pnpm run check:public
```

发布前可运行 `pnpm run build:release` 生成单文件网页包，运行 `pnpm run desktop:build` 生成 Windows 安装包；两者产物分别位于 `output/` 和 `output/desktop/`。

更多数据字段、扩展模块和测试约定见[二次开发指南](./docs/二次开发指南.md)、[数据格式与联动约定](./docs/数据格式与联动约定.md)和[贡献指南](./CONTRIBUTING.md)。

## 参与项目

欢迎提交脱敏后的表格格式、真实工作场景和更顺手的交互建议。提交 Issue 时请说明浏览器或 Windows 版本、文件类型、可脱敏复现步骤和期望结果，不要上传学号、住址、家长电话或真实照片。

<div align="center">

如果它帮你少翻一次群文件、少重复整理一张表，欢迎给项目点一个 Star。

</div>
