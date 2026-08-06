<div align="center">

<img src="./assets/logo.svg" width="108" alt="辅导员工作台 Logo" />

# 辅导员工作台 · Counselor Desk

**给高校辅导员的一张本地数字工作桌**

把学生台账、谈心谈话、重点关注、工作留痕、资料库和备份，收进一个打开就能接着工作的地方。

[![Version](https://img.shields.io/badge/version-4.0.0-0b3a82?style=for-the-badge)](./CHANGELOG.md)
[![Windows](https://img.shields.io/badge/Windows-10%2F11-2563eb?style=for-the-badge&logo=windows)](./docs/v4-migration-and-backup.md)
[![Web](https://img.shields.io/badge/单文件-Web-0ea5e9?style=for-the-badge&logo=html5&logoColor=white)](./index.html)
[![离线优先](https://img.shields.io/badge/离线优先-本地数据-0f766e?style=for-the-badge)](./docs/v4-privacy.md)
[![Tests](https://img.shields.io/badge/测试-回归门禁通过-16a34a?style=for-the-badge)](./docs/v4-acceptance-report.md)
[![License](https://img.shields.io/badge/license-MIT-7c3aed?style=for-the-badge)](./LICENSE)

<br />

[立即体验网页版](./index.html) · [Windows 桌面版说明](./docs/v4-migration-and-backup.md) · [使用手册](./docs/辅导员工作台使用手册.md) · [提交建议](https://github.com/7752777/counselor-desk/issues) · [给项目 Star](https://github.com/7752777/counselor-desk)

</div>

<p align="center">
  <img src="./assets/hero-v4.png" alt="辅导员工作台 v4.0" width="100%" />
</p>

> 这不是要替代学校正式业务系统的“大平台”。它更像辅导员自己的工作桌：今天要回访谁、哪张表要交、哪条记录还没补、下次换电脑如何带走数据，都能在同一个本地工作台里找到答案。

## 先看它能帮你做什么

| 场景 | 打开工作台后可以直接做什么 |
| --- | --- |
| 学生名单 | 上传 10 列或 100 列 Excel/CSV，先预览和确认，再分段写入；未知表头不会被悄悄丢掉。 |
| 学生台账 | 在表格、卡片、照片花名册之间切换，按学号、培养层次、班级、生源地、宿舍、成绩或自定义字段筛选排序。 |
| 日常跟进 | 记录谈心谈话、重点关注、学业预警、请假、考勤、帮扶和工作节点，月底可生成可编辑的小结。 |
| 文件资料 | 把假期去向表、德育考核表、政策文件、讲话稿和安全提示放进分类资料库，统一命名、检索、下载和版本回退。 |
| 数据安全 | 桌面版使用本地数据库和附件保险库；备份、恢复、迁移、删除和敏感操作都有明确提示。 |

## 为什么它让人安心

- **数据先留在自己手里。** 默认不要求账号，不建立云端学生数据库，不自动把学生信息上传到第三方。
- **导入前先看清楚。** 字段识别、未知列、自定义字段、重复学号、敏感字段和错误行都会在确认前展示。
- **照片只是归档，不是人脸识别。** 只按学号或唯一姓名匹配，不采集人脸特征，不生成生物特征向量。
- **数据可以带走，也可以回退。** 支持 v7 交换包、加密备份、便携 HTML 和测试数据快照；换电脑或做样例测试都有退路。
- **手机可以协同，但不伪装成实时同步。** 在没有账号和云服务的版本里，使用“桌面导出手机工作包 → 手机修改 → 导出回传包 → 桌面合并/覆盖”的文件交换流程，数据流向清清楚楚。

## 30 秒开始使用

### 直接打开网页版

1. 下载仓库中的 [`index.html`](./index.html)。
2. 用 Chrome、Edge 或 Firefox 打开，首次启动选择“体验示例”或“正式初始化”。
3. 先用一份脱敏样表走完“预览 → 校验 → 导入”，确认无误后再导入真实名单。
4. 第一次正式使用后，到“平台联动 → 备份迁移”导出一份备份。

### 使用 Windows 桌面版

桌面版是照片、附件、本地保险库和定时备份的完整形态；网页版适合双击即用、移动查看和轻量离线场景。构建命令、迁移步骤和备份恢复指南集中放在 [`docs/`](./docs/) 中，普通使用不需要阅读这些技术文档。

## v4.0 的几个亮点

### 灵活导入

标准字段覆盖身份、联系、家庭、学籍、宿舍、生源、学业等信息；表头按稳定编码、学校预设、精确别名、模糊匹配和人工确认逐级识别。默认 500 行一段，支持进度、取消、断点恢复和原子提交。

### 学生照片与三种视图

支持文件夹、ZIP、批量文件和单人补传。照片花名册会为没有照片的学生保留清晰的上传位置；原图、缩略图和内容哈希分开管理，重复照片不会重复占用空间。

### 资料库与就业资源

表单模板、政策文件、讲话稿、通知和学习资料可以按目录、标签、来源和适用场景整理。就业页内置经过审核的官方资源目录，支持地区/行业筛选、手工维护和签名清单导入。

### 测试快照

你可以把样例 A 保存为“原始状态”，清空工作区导入样例 B，测试结束后点击恢复即可回到原始状态。快照不会删除，适合验收、演示和反复试导入。

## 桌面版与网页版

| 形态 | 适合场景 | 数据方式 |
| --- | --- | --- |
| **Windows 桌面版** | 日常主工作台、照片附件、加密保险库、自动备份 | Electron + SQLite + 本地附件保险库 |
| **单 HTML 网页版** | 双击即用、移动查看、轻量离线 | IndexedDB；仅支持手动加密备份 |

两端复用同一套无框架 TypeScript 业务核心。当前版本明确不包含账号、云同步、远程审批系统或自动联网抓取就业内容；这些能力若未来建设，会单独设计权限、加密和冲突处理。

## 截图

<p align="center">
  <img src="./assets/manual/01-home.png" width="48%" alt="首页与待办" />
  <img src="./assets/manual/02-students.png" width="48%" alt="学生台账" />
</p>
<p align="center">
  <img src="./assets/manual/05-backup.png" width="48%" alt="备份迁移" />
  <img src="./assets/manual/06-report.png" width="48%" alt="工作留痕" />
</p>

截图均使用示例或脱敏数据，不包含真实学生信息。

## 参与与反馈

欢迎辅导员老师提交脱敏样表、分享真实工作场景，或提出更顺手的交互建议。提交 Issue 时请说明浏览器/Windows 版本、文件类型、可脱敏复现步骤和预期结果，请勿上传身份证号、家庭住址、家长电话或真实照片。

- [使用手册](./docs/辅导员工作台使用手册.md)
- [隐私说明](./docs/v4-privacy.md)
- [迁移与备份指南](./docs/v4-migration-and-backup.md)
- [贡献指南](./CONTRIBUTING.md)
- [安全问题反馈](./SECURITY.md)
- [更新日志](./CHANGELOG.md)

## 开发者入口

```powershell
pnpm install --frozen-lockfile
pnpm test
pnpm run lint
pnpm run check:public
```

架构决策、v7 数据格式、Electron 发布和维护者检查项都放在 [`docs/`](./docs/)；面向普通用户的首页不把构建细节和发布流程混在一起。

<div align="center">

**如果它帮你少漏掉一次回访、少重复整理一张表，欢迎给项目点一个 Star。**

</div>
