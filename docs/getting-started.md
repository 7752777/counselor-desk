# 开始使用

这页只解决一个问题：普通用户如何打开 Counselor Desk。开发者命令请看[开发与构建](./development.md)，完整业务操作请看[用户指南](./user-guide.md)。

## 三种运行形态

| 形态 | 下载/入口 | 适合场景 | 数据位置 |
| --- | --- | --- | --- |
| 单 HTML 网页版 | 直接打开发布包中的 `辅导员工作台.html`，或仓库内的 `index.html` | 零安装、离线查看、临时手机录入 | 浏览器 IndexedDB |
| Windows 桌面版 | [体验版下载页](https://github.com/7752777/counselor-desk/releases)中的 `辅导员工作台-v4.0.0-Windows-安装版.msi` | 日常固定办公、SQLite 与附件保险库 | 当前 Windows 用户的 Electron 数据目录 |
| macOS 桌面版 | [体验版下载页](https://github.com/7752777/counselor-desk/releases)中的 `辅导员工作台-v4.0.0-macOS-安装版.dmg` 或“macOS-压缩包” | Intel 与 Apple Silicon Mac | 当前 macOS 用户的 Electron 数据目录 |

## Windows

1. 从 [GitHub 体验版下载页](https://github.com/7752777/counselor-desk/releases)下载 `辅导员工作台-v4.0.0-Windows-安装版.msi`。
2. 双击安装。安装器按当前用户安装，不要求管理员权限，会创建桌面/开始菜单入口并在结束后启动。
3. 不想安装时使用 `辅导员工作台-v4.0.0-网页离线版.html`；网页版本的数据保存在当前浏览器，不会写入 MSI 安装目录。
4. 首次启动选择“体验示例”“正式初始化”或“从备份恢复”。

完整安装、卸载和数据路径说明见[桌面版安装与数据路径](./v4-desktop-installation.md)。当前公开 Windows 包未配置组织代码签名，正式发布前应核对 SHA-256 并完成签名。

## macOS

1. 从 [GitHub 体验版下载页](https://github.com/7752777/counselor-desk/releases) 下载 `辅导员工作台-v4.0.0-macOS-安装版.dmg`。
2. 打开 DMG，将“辅导员工作台”拖到“应用程序”。ZIP 版本解压后执行相同操作。
3. Intel 和 Apple Silicon 共用一个 universal 包，不需要选择架构。
4. 当前公开包未签名/公证。若 Gatekeeper 阻止首次打开，请确认来源后在“系统设置 → 隐私与安全性”中允许本次启动。

构建、架构校验和签名边界见[桌面版安装与数据路径](./v4-desktop-installation.md)与[v4.0 验收报告](./v4-acceptance-report.md)。

## 网页版

直接双击发布包中的 `辅导员工作台.html` 即可。它不需要 Node.js、pnpm、Electron 或账号。仓库开发预览使用 `pnpm run web:dev`，不要把开发目录的 `output/` 当成用户数据目录。

## 第一次使用建议

1. 先使用示例数据熟悉首页、学生台账和文件资料库。
2. 导入真实表格前，先查看字段映射和错误预览；不要直接覆盖现有数据。
3. 在“备份与迁移”中生成加密备份，换电脑时连同附件一起迁移。
4. 上传学校表单、政策文件或讲话稿后，在“分类文件库”中确认规范名称、分类和实际保险库路径。
