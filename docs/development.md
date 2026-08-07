# 开发与构建

本页是开发者、贡献者和需要构建安装包的维护者的命令参考。普通用户不需要执行这些命令，请先看[开始使用](./getting-started.md)。

## 环境

- Node.js 20 或更高版本
- pnpm 11.9.0（仓库使用 `packageManager` 固定版本）
- Windows 桌面构建需要 Windows 环境；macOS universal 构建需要 macOS runner 或 GitHub Actions

```powershell
pnpm install --frozen-lockfile
```

## 本地运行

```powershell
pnpm run web:dev       # http://127.0.0.1:4173
pnpm run desktop:dev   # Electron 桌面开发模式
```

网页开发服务器只服务静态文件；桌面开发模式会启用 Electron IPC、SQLite 和本地附件保险库。真实用户数据不应放入仓库目录。

## 检查与测试

```powershell
pnpm run lint
pnpm run check:public
pnpm test
```

`pnpm test` 包含 v3.9 回归、v4.0 核心/运行时、导入导出、浏览器性能、IndexedDB 迁移、Electron/SQLite、附件、备份和文件资料库测试。提交前还应运行 `git diff --check`。

## 构建

```powershell
pnpm run build:release       # 单 HTML 网页发布包
pnpm run desktop:build       # Windows NSIS + portable
pnpm run desktop:build:mac   # macOS universal DMG + ZIP
```

所有桌面产物写入仓库相对目录 `output/desktop/`，该目录被 `.gitignore` 忽略。`desktop:build:mac` 已显式使用 `--publish never`，避免未配置发布 token 时把本地构建误当成 GitHub Release 发布。

## macOS CI 验收

`.github/workflows/desktop-macos.yml` 在 `macos-15-intel` runner 上执行依赖安装、静态检查和 unsigned universal 构建，然后：

1. 检查 DMG/ZIP 文件名是否包含 `mac-universal`。
2. 解压 ZIP 并找到 `.app`。
3. 使用 `lipo -info` 确认二进制同时包含 `x86_64` 与 `arm64`。
4. 使用 `plutil` 确认 Bundle ID 为 `cn.counselordesk.workbench`。
5. 上传 DMG/ZIP artifact；失败时保留构建日志和 GitHub Check 诊断。

当前公开验证运行见[macOS workflow run #6](https://github.com/7752777/counselor-desk/actions/runs/31145152289)。它是 unsigned 验证包，不等于已经完成 Apple Developer 签名与公证。

## 代码边界

- `index.html`：单文件网页 UI 与业务逻辑。
- `src/core/v4-runtime.js`：v4 存储、导入、备份和运行时能力。
- `desktop/main.cjs`：Electron 生命周期、窗口、IPC 和路径。
- `desktop/preload.cjs`：最小 allowlist IPC bridge。
- `desktop/sqlite-store.cjs`：SQLite 数据仓储和附件元数据。
- `tests/`：回归、业务、浏览器和桌面表面测试。
- `docs/`：用户、开发、数据、验收和发布说明。
