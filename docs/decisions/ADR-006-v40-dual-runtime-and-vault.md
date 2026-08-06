# ADR-006：v4.0 双运行时与本地保险库

## Status

Accepted

## Date

2026-08-06

## Context

v3.9 是单 HTML、本地 `localStorage` 应用。v4.0 需要保存照片和文件、处理大批量导入、执行加密备份，并继续保留双击 HTML 的低门槛使用方式。浏览器无法可靠地在页面关闭后写入用户指定文件夹，也不适合把大附件继续堆进 `localStorage`。

## Decision

- 共享业务规则放在无 DOM 的 v4 核心运行时中；网页端使用 IndexedDB/内存降级，桌面端由 Electron 提供文件和保险库能力。
- Electron 主进程启用 `contextIsolation`、沙箱和关闭 `nodeIntegration`，渲染层只通过预加载白名单接口访问文件系统。
- Electron 结构化记录使用 Node `node:sqlite` 的 WAL 数据库，记录载荷在入库前用保险库密钥 AES-256-GCM 加密；浏览器端使用 IndexedDB。
- 桌面附件使用应用密钥进行 AES-256-GCM 加密；备份使用版本化 `.cwbk` JSON 容器和用户口令 Argon2id + HKDF + AES-256-GCM（兼容读取早期 PBKDF2 v7 包）。
- 旧 v3.9 JSON、便携 HTML 与交换包继续可导入；v4 交换包版本为 7。

## Alternatives Considered

### 继续只使用 localStorage

实现成本最低，但照片、附件和 5000+ 行分段导入会受到容量和主线程阻塞限制，无法完成可靠的指定文件夹备份。

### Tauri

安装包更小，但需要引入 Rust 工具链和另一套原生插件维护面；当前项目以 JavaScript 单文件为主，Electron 的预加载安全模型更容易复用现有渲染层。

## Consequences

- 需要同时维护网页版和 Windows 桌面版的能力差异说明。
- 桌面版可提供加密附件、原子备份和本地目录权限；网页端只承诺手动加密备份。
- `CWB.store` 保留兼容适配，新代码应使用异步仓储和 `CWB_V4` 能力。
