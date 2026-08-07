# 文档中心

这里是 Counselor Desk v4.0 的公开文档入口。仓库同时提供单 HTML 网页版、Windows 桌面版和 macOS universal 桌面版；先按使用目的选择入口，不需要从源码中猜启动方式。

## 先从这里开始

| 你要做什么 | 推荐文档 | 内容 |
| --- | --- | --- |
| 第一次使用产品 | [开始使用](./getting-started.md) | Web、Windows、macOS 下载与启动 |
| 学习业务功能 | [用户指南](./user-guide.md) | 学生台账、任务、谈话、文件资料库、备份 |
| 开发或构建项目 | [开发与构建](./development.md) | pnpm、测试、网页发布、Windows/macOS 构建 |
| 查数据与迁移规则 | [数据与迁移参考](./data-contract.md) | 字段、导入导出、备份、手机文件交换 |
| 从 0 用 AI 复现项目 | [提示词归档](./prompt-archive.md) | 10 份按顺序执行的 `.txt` 提示词 |

## 按文档类型查找

### 教程与操作指南

- [开始使用](./getting-started.md)
- [用户指南](./user-guide.md)
- [Windows / macOS 桌面版安装与数据路径](./v4-desktop-installation.md)
- [迁移与备份说明](./v4-migration-and-backup.md)

### 参考与解释

- [数据与迁移参考](./data-contract.md)
- [数据格式与联动约定](./数据格式与联动约定.md)
- [隐私说明](./v4-privacy.md)
- [党建规则版本说明](./v4-party-rules.md)
- [桌面版发布签名流程](./v4-release-signing.md)
- [v4.0 验收报告](./v4-acceptance-report.md)

### 开发与贡献

- [开发与构建](./development.md)
- [二次开发指南](./二次开发指南.md)
- [贡献指南](../CONTRIBUTING.md)
- [架构决策记录](./decisions/)
- [设计与实施计划](./superpowers/)

### 视觉资料

- [公开项目首页](../README.md#功能界面一览)
- [功能截图](../assets/screenshots/)
- [使用手册截图](../assets/manual/)

## 文件命名约定

- 新增自动化、配置和提示词文件使用小写 ASCII 文件名；需要排序的内容使用两位数字前缀。
- 中文文档保留原有入口，避免历史链接失效；新文档优先从本页和 README 的英文 canonical 路径进入。
- `output/`、`tmp/`、`test-results/`、桌面安装包、数据库和附件属于生成物或用户数据，不提交到公开库。
- 文档中的 `output/desktop/` 是开发者构建产物目录，不是用户数据库或附件保险库路径。

## 版本边界

当前公开版本为 v4.0.0。macOS universal 构建由 GitHub Actions 的 macOS runner 完成；当前公开构建未配置 Apple Developer 签名与公证。验收记录中的未完成事项和签名发布前置条件必须与代码事实保持一致。
