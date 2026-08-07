# 数据与迁移参考

本页是数据规则的导航，不替代字段明细。实现字段、联动键和导入导出约定以[数据格式与联动约定](./数据格式与联动约定.md)为准；备份边界以[迁移与备份说明](./v4-migration-and-backup.md)为准。

## 三层存储

| 运行形态 | 结构化数据 | 文件/附件 | 交换方式 |
| --- | --- | --- | --- |
| Web | IndexedDB v4 repositories | 浏览器能力允许时保存附件元数据/文件 | JSON、CSV、单 HTML |
| Windows 桌面 | Electron IPC → SQLite | Electron userData 下的本地附件保险库 | `.cwbk`、手机 JSON 包 |
| macOS 桌面 | Electron IPC → SQLite | 当前 macOS 用户的 Electron userData 下的附件保险库 | `.cwbk`、手机 JSON 包 |

三种形态共用业务集合和字段语义，但运行时存储实现不同。不要把 `output/desktop/`、安装包目录或仓库中的 `index.html` 当成用户数据库路径。

## 记录契约

业务记录应有稳定 `id`、`created_at`、`updated_at`、`schema_version`。学生优先使用 `student_number` 与 `student_level` 识别；其他集合通常使用稳定 `id`。空值、布尔值、数字、枚举和未知字段必须经过归一化后再写入。

## 导入导出

- 每个业务集合提供 CSV 模板、导入预览和 UTF-8 BOM CSV 导出。
- 学生导入支持常见中文表头同义词、未知字段保留、敏感字段确认、重复学号冲突和分段可恢复提交。
- JSON 备份/手机包必须有版本、范围、时间、校验信息；合并和覆盖是两个明确操作。
- 覆盖操作前生成快照；失败恢复不得破坏当前工作区。

## 文件资料库

政策文件、讲话稿、安全提示、假期去向表、德育考核表和其他学校统一表单属于资料库内容，不属于源码或 `output/`。上传后应有分类、规范名称、原始名称、版本、来源、标签和附件引用；桌面版还应显示实际附件保险库路径。

## 迁移文档

- [迁移与备份说明](./v4-migration-and-backup.md)：换电脑、JSON/.cwbk、手机交换、合并/覆盖。
- [隐私说明](./v4-privacy.md)：本地优先、敏感数据、附件和删除。
- [v4.0 验收报告](./v4-acceptance-report.md)：已验证项、限制和签名发布前置条件。
