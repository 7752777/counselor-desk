<div align="center">

<img src="./assets/logo.svg" width="96" alt="辅导员工作台 Logo" />

# 辅导员工作台 · Counselor Desk

### 给高校辅导员的一张本地数字工作桌

把学生台账、谈心谈话、重点关注、工作留痕、资料库、就业资源和备份迁移，收进一个打开就能继续工作的地方。

[![Version](https://img.shields.io/badge/version-4.0.0-0b3a82?style=for-the-badge)](./CHANGELOG.md)
[![Windows](https://img.shields.io/badge/Windows-10%2F11-2563eb?style=for-the-badge&logo=windows)](./docs/v4-migration-and-backup.md)
[![Single HTML](https://img.shields.io/badge/Single--HTML-Offline-0ea5e9?style=for-the-badge&logo=html5&logoColor=white)](./index.html)
[![Local first](https://img.shields.io/badge/Local--first-Your%20data%20stays%20with%20you-0f766e?style=for-the-badge)](./docs/v4-privacy.md)
[![Tests](https://img.shields.io/badge/tests-regression%20gate%20passing-16a34a?style=for-the-badge)](./docs/v4-acceptance-report.md)
[![License](https://img.shields.io/badge/license-MIT-7c3aed?style=for-the-badge)](./LICENSE)

<br />

[立即体验网页版](./index.html) · [Windows 使用指南](./docs/v4-migration-and-backup.md) · [使用手册](./使用说明.md) · [提交建议](https://github.com/7752777/counselor-desk/issues) · [给项目点 Star](https://github.com/7752777/counselor-desk)

</div>

<p align="center">
  <img src="./assets/github-hero-v4.png" alt="辅导员工作台 v4.0 本地工作桌" width="100%" />
</p>

> 这不是要替代学校正式业务系统的“大平台”。它更像辅导员自己的工作桌：今天要回访谁、哪张表要交、哪条记录还没补、下次换电脑如何带走数据，都能在一个本地窗口里找到答案。

## 为什么一线辅导员需要它？

很多日常工作并不难，难的是它们被拆散在 Excel、群文件、浏览器收藏夹、聊天记录和临时文件夹里：

- 一份学校导出的学生表，字段名称和顺序每次都不一样，导入前还要手工改表头。
- 假期去向表、德育考核表、住宿异动表和安全通知散落在不同文件夹，想找时只能重新翻。
- 学生照片、学号、宿舍和谈话记录无法放在同一个清晰的学生档案里。
- 换电脑、做演示、测试新表格时，既想清空工作区，又不想丢掉原始状态。

辅导员工作台 v4.0 就是围绕这些“小而高频”的堵点做的本地化整理工具：少切窗口，少重复录入，少担心数据去哪儿。

## 打开后，能直接做什么？

| 场景 | 你可以直接完成的事情 |
| --- | --- |
| 学生台账 | 导入 10 列或 100 列 Excel/CSV；未知表头保留为自定义字段；表格、卡片、照片花名册三种视图随时切换。 |
| 灵活筛选 | 按学号、培养层次、班级、生源地、宿舍、成绩或任意导入字段筛选、排序和查看明细。 |
| 照片管理 | 文件夹、ZIP、批量文件和单人补传；按学号或唯一姓名归档；重名和无匹配照片进入人工确认队列。 |
| 文件资料库 | 上传假期去向表、德育考核表、政策文件、校长讲话稿和安全提示；自动分类、规范命名、搜索、下载、版本回退。 |
| 就业资源 | 离线保存经核验的官方就业平台，按地区和行业筛选，不自动抓取第三方页面。 |
| 工作留痕 | 谈心谈话、学业预警、重点学生、班团组织、党员发展和工作节点集中维护。 |
| 换机与备份 | 一键导出换机包；手机手工导入修改后回传；桌面端合并或覆盖前自动生成回退快照。 |

## 这次 v4.0 解决了哪些关键难题？

### 1. 表头不再绑死

字段识别遵循“稳定编码 → 学校预设 → 精确别名 → 规范化匹配 → 人工确认”。导入的标准字段和未知字段都会进入学生档案；表格视图会按实际数据动态生成列，不会再出现“上传了 100 个字段，最后只剩 7 个字段可看”的落差。

### 2. 文件不再散落

分类文件库将文件按“表单模板、政策文件、讲话稿、学工通知、工作材料、其他”归档。系统根据文件名和场景自动分类并生成规范标题；桌面版原文件写入加密附件保险库，资料目录和附件一起进入备份包。

### 3. 照片只做归档，不做人脸识别

照片通过学号精确匹配或唯一姓名匹配归档，不采集人脸特征、不生成生物特征向量。照片、缩略图和内容哈希分开管理，重复文件不会反复占用空间。

### 4. 数据始终可带走

桌面版使用 SQLite 和加密附件保险库；单 HTML 网页版使用 IndexedDB。v7 交换包、加密备份、便携 HTML 和测试数据快照共同覆盖“换电脑、换设备、做演示、反复试导入”这些真实场景。

## 截图一览

<p align="center">
  <img src="./assets/manual/01-home.png" width="48%" alt="首页与待办" />
  <img src="./assets/manual/02-students.png" width="48%" alt="学生台账" />
</p>
<p align="center">
  <img src="./assets/manual/05-backup.png" width="48%" alt="备份与换机" />
  <img src="./assets/manual/06-report.png" width="48%" alt="工作留痕与分析" />
</p>
<p align="center">
  <img src="./assets/screenshots/import-preview.png" width="48%" alt="导入预览" />
  <img src="./assets/screenshots/data-center.png" width="48%" alt="数据中心" />
</p>

截图均使用示例或脱敏数据，不包含真实学生信息。

## 版本故事：从 v1.0 到 v4.0

| 版本 | 这一步真正改变了什么 |
| --- | --- |
| **v1.0** | 把学生台账、CSV 导入导出和本地存储放进一个可双击运行的页面。 |
| **v2.0** | 建立统一视觉、移动端导航和高频专项模块，工作台开始像一个完整工具。 |
| **v3.0** | 补齐 19 个业务集合、数据闭环、报告汇总和更成熟的交互体验。 |
| **v3.8** | 强化学生大表导入、字段匹配、缺值处理和回归测试，形成稳定的网页版基线。 |
| **v4.0** | 升级为 Windows 桌面版 + 单 HTML 网页版双形态，接入 SQLite、加密附件保险库、动态字段、资料库、就业资源、换机包和测试快照。 |

## 30 秒开始使用

1. 直接打开仓库里的 [`index.html`](./index.html)。
2. 首次启动选择“体验示例”或“正式初始化”。
3. 在“学生台账”导入脱敏样表，先看预览、字段映射和错误提示，再确认写入。
4. 在“模板库 → 分类文件库”上传假期去向表、德育考核表或政策资料；系统会自动分类和规范命名。
5. 正式使用前，在“平台联动 → 备份迁移”生成一份加密备份或换机包。

## Windows 桌面版与网页版

| 形态 | 适合场景 | 数据方式 |
| --- | --- | --- |
| **Windows 桌面版** | 日常主工作台、照片附件、加密保险库、本地备份 | Electron + SQLite + 加密附件保险库 |
| **单 HTML 网页版** | 双击即用、移动查看、轻量离线场景 | IndexedDB；支持手动加密备份 |

两端复用同一套无框架业务核心。当前版本不包含账号、云同步、服务器学生数据库、远程审批或自动联网抓取就业内容。

## 隐私与安全边界

- 默认不要求账号，不把学生档案上传到项目服务器。
- 桌面版照片和附件使用本机加密保险库存储。
- 身份证件、政治面貌、心理健康、照片和备份操作会触发更明确的确认与审计。
- 本项目不做人脸相似匹配；照片入口只依据学号、唯一姓名或已归档关系定位。

详细说明：[`隐私说明`](./docs/v4-privacy.md) · [`迁移与备份指南`](./docs/v4-migration-and-backup.md) · [`验收报告`](./docs/v4-acceptance-report.md)

## 参与项目

欢迎提交脱敏后的表格格式、真实工作场景和更顺手的交互建议。提交 Issue 时请说明浏览器或 Windows 版本、文件类型、可脱敏复现步骤和期望结果，不要上传身份证号、家庭住址、家长电话或真实照片。

```powershell
pnpm install --frozen-lockfile
pnpm test
pnpm run lint
pnpm run check:public
```

<div align="center">

如果它帮你少翻一次群文件、少重复整理一张表，欢迎给项目点一颗 Star。

</div>
