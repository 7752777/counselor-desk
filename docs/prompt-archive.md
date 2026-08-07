# AI 复现提示词归档

这组提示词面向希望从 0 使用 AI 工具复现 Counselor Desk v4.0 的读者。每个文件都是可独立复制的纯文本提示词，但推荐按顺序执行，并要求 AI 每一步先审计现有文件、列出改动和测试结果。

## 执行顺序

1. [产品骨架与交付边界](./prompts/01-product-foundation.txt)
2. [学生台账与动态字段](./prompts/02-student-ledger-and-dynamic-data.txt)
3. [日常台账与流程联动](./prompts/03-daily-ledgers-and-workflow-links.txt)
4. [风险支持与毕业生档案](./prompts/04-risk-support-and-graduation.txt)
5. [政策文件与表单资料库](./prompts/05-policy-files-and-form-library.txt)
6. [导入导出、备份与存储](./prompts/06-import-export-backup-and-storage.txt)
7. [移动端与手机文件交换](./prompts/07-mobile-and-phone-exchange.txt)
8. [Windows/macOS 桌面端](./prompts/08-windows-and-macos-desktop.txt)
9. [视觉系统、截图与无障碍](./prompts/09-ui-visual-system-and-accessibility.txt)
10. [测试、文档与公开发布](./prompts/10-testing-documentation-and-release.txt)

## 使用规则

- 只使用脱敏数据和示例文件；不要把真实学生信息、身份证号、电话、心理记录或学校内部文件发送给 AI。
- 每一步完成后要求 AI 输出文件树、测试命令、已知限制和下一步前置条件。
- 不要让 AI 删除已完成模块来缩短工作量；若需要改 schema，先写迁移方案和回滚方案。
- 这些提示词描述产品目标和验收标准，不是原仓库的逐行源码复制，也不授予绕过权限或安全边界的许可。

原始中文总览仍保留在[项目反推提示词.md](./项目反推提示词.md)，新项目应优先使用上述 v4.0 分阶段版本。
