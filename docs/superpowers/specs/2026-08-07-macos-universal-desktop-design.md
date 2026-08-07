# macOS Universal 桌面版设计

## 目标

在 v4.0.0 现有 Electron 桌面端基础上，增加一个同时支持 Intel 和 Apple Silicon 的 macOS 通用包。普通用户下载 `.dmg` 后拖入“应用程序”即可使用，也提供 `.zip` 作为备用分发格式；业务数据、加密附件保险库和网页端数据结构保持不变。

## 范围

包含：

- electron-builder 的 macOS `dmg` 与 `zip` 目标；
- `universal` 架构构建脚本，产物命名包含 `mac-universal`；
- GitHub Actions macOS runner 构建并上传 unsigned 构建产物；
- README、使用手册、安装说明和验收报告中的 macOS 启动、数据路径、签名边界说明；
- macOS 运行时静态检查、Electron 主进程/预加载测试和 macOS runner 实际打包验证。

不包含：

- 引入新的业务模块或改变 Windows/网页端数据格式；
- 在仓库中提交 Apple Developer 证书、私钥、notarization 密钥或真实用户数据；
- 在没有证书的情况下宣称“已签名”或“已公证”的正式发行包。

## 方案

electron-builder 配置增加：

- `mac.category: public.app-category.education`；
- `mac.target: [dmg, zip]`；
- `mac.artifactName: counselor-desk-${version}-mac-${arch}.${ext}`；
- 通用架构由 `pnpm run desktop:build:mac` 传入 `--mac --universal --publish never`，避免 Windows 构建机误报 macOS 包已完成，也避免 CI 环境误触发发布；
- 代码签名自动发现默认关闭，只有 CI 明确注入证书变量时才进入签名/公证流程。

GitHub Actions 使用 `macos-15-intel` runner，同时下载 x64 与 arm64 Electron 运行时并生成 universal 包。每次推送到 `master` 或手动触发时上传构建 artifact；标签发布仍由维护者在签名门禁通过后选择是否发布到 Release。

## 数据与安全

macOS 继续使用 `app.getPath('userData')` 作为 SQLite 数据库和加密附件保险库根目录；渲染层只通过既有 preload 白名单访问文件系统。由于 macOS 未签名应用可能被 Gatekeeper 拦截，文档必须明确“开发/验证包未签名”，并给出从 Release 下载、打开系统安全设置和核对 SHA-256 的操作边界。

## 验收标准

1. `electron-builder.yml` 能被 electron-builder 解析，macOS 目标与产物命名明确。
2. `pnpm run desktop:build:mac` 在 macOS runner 成功生成一个 `dmg` 和一个 `zip`，二进制架构同时包含 `x86_64` 与 `arm64`。
3. 构建产物可启动 `辅导员工作台`，首次引导、示例数据、政策智库、模板库和保险库路径提示可加载。
4. Windows 现有安装版、便携版和完整回归套件不受影响。
5. 文档不写死构建机绝对路径，不把 unsigned 构建描述为正式签名发行版。
