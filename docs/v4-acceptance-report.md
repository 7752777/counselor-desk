# v4.0 全量验收记录（当前工作区）

## 已通过

- IndexedDB v2 统一建库：业务仓储、附件、导入任务、导入暂存区、审计日志和元数据均可 CRUD；学生大批量提交使用压缩分块原子记录，重载后可恢复展开。
- 导入门禁：0/1/100/5000/10000 行、100 列自定义字段、断点/取消/文件哈希检查点、敏感字段确认和原子提交均有自动化覆盖。
- 真实 Chrome：10,000 行导入进度最大间隔约 119ms，事件循环最大间隙约 129ms（门槛分别为 500ms 和 200ms）；重载后记录数和首条记录校验通过。
- 照片/附件：批量、单人补传、匹配队列、缩略图、内容哈希去重、下载/删除、加密备份恢复和便携 HTML 附件内置均有浏览器测试。
- 备份：Argon2id + AES-256-GCM、完整性校验、错误口令拒绝、损坏文件拒绝、附件哈希与失败回滚均通过；旧 PBKDF2 仅在兼容标记下恢复。
- 党建、班团、文件库、就业签名清单、ECharts 图表、三视图、首页任务入口、Electron IPC 白名单和 SQLite 加密仓储均通过对应测试。
- 就业资源清单仅接受 ECDSA-P256-SHA256 签名；纯摘要算法会被拒绝，避免把可重算摘要误当作来源认证。
- 静态检查、公开 API 检查、29 视图回归、依赖生产审计均通过。
- 本轮桌面构建使用仓库相对产物目录 `output/desktop/`；为避开构建机 C 盘空间限制，验证时将该被忽略目录临时映射到另一块本地磁盘，绝对路径不属于公开配置。当前安装包 `counselor-desk-4.0.0-x64.exe` SHA-256 为 `CD0C74309C5CDA033237379299F9FD972582CDC8CD0A06740F3E97E7E48269A5`，便携包 `counselor-desk-4.0.0-portable.exe` SHA-256 为 `4FA51F5EF2A3B68CD8E4E35F834E7332A899362AB734B4BDBC1EC6229DE92DDF`。
- NSIS 安装包在临时目录静默安装返回 `ExitCode=0`，安装目录包含 77 个文件；安装后的主程序和便携版均以全新用户数据目录启动成功，标题、首次使用引导、示例数据和资料库模块均可加载。分类文件库显示的保险库路径与启动时指定的用户数据目录一致。

## 未满足正式公开发布门禁

- 已使用隐私保护运行器 `scripts/real-import-pilot.js` 对本机真实表格进行内存脱敏后浏览器试跑。Downloads 子集为 15 个去重样本、5 个成功、33.333%，15 个格式指纹；跨三个工作目录子集为 38 个去重样本、17 个成功、44.737%，35 个格式指纹。该结果明确不是 99.7% 运营指标，且格式指纹不等于学校/系统数量，因此仍保持 `not_ready`。
- 试跑报告只保存文件哈希、格式指纹、行列数和状态，不保存文件名、表头或原始单元格值；正式运营指标仍需人工登记不少于 100 份脱敏表格及不少于 20 个可核验学校/系统来源。
- 针对用户提供的 `学生基本信息大表.xls`：原始预览识别为 99 行、100 列，自动映射发现重复性别列、学籍状态枚举不在当前标准值、身份证号校验失败，因此 99 行均被拦截；按导入向导将冲突/不兼容列转为自定义字段后，99/99 行预览通过并完成分段提交，未把原始文件写入仓库。

- 当前工作区没有组织代码签名证书。Windows 安装包和便携包虽已构建并启动冒烟通过，但 `Get-AuthenticodeSignature` 状态为 `NotSigned`；`scripts/check-release-signing.js` 会刻意阻断正式发布。
- 本次验证机器为 Windows 10 Home，`HyperVisorPresent=False`，且未检测到可用的 Hyper-V、VirtualBox、QEMU 或 WSL；因此本记录包含宿主机干净用户数据测试，不声称已经完成虚拟机测试。
- macOS universal 构建由 `.github/workflows/desktop-macos.yml` 在 `macos-14` runner 执行；本地 Windows 环境不能直接生成或启动 `.dmg`，以 workflow 的 DMG/ZIP 架构检查作为 macOS 构建证据。
- 99.7% 导入成功率仍是运营指标，不在脱敏样本不少于 100 份、覆盖不少于 20 种格式并保存追溯报告前对外宣称。
- 已提供 `scripts/import-operations-report.js`：它对脱敏样本清单计算样本数、格式数、成功率和源清单 SHA-256；条件不足时以非零状态退出，测试夹具不作为真实运营证据。
- 发布文档已补齐：[迁移与备份说明](v4-migration-and-backup.md)、[隐私说明](v4-privacy.md)、[党建规则版本说明](v4-party-rules.md) 和 [签名发布流程](v4-release-signing.md)。

## 可复现命令

```powershell
node scripts/build-release.js output/v4-preview.html
node tests/v40-performance-browser.js
node tests/v40-backup-attachments.js
node tests/v40-portable-attachments.js
node tests/v40-browser-storage.js
node tests/release-checks.js
node scripts/check-release-signing.js output/desktop
node scripts/import-operations-report.js --input <脱敏样本清单.json> --output <导入运营报告.json>
# 真实文件试跑（只输出哈希与汇总，不保存原始值）
node scripts/real-import-pilot.js --root <脱敏文件目录> --output <试跑报告.json>
```

签名证书配置和发布流程见 [v4-release-signing.md](v4-release-signing.md)。

## 2026-08-07 桌面安装链路复验

- 安装配置：NSIS `oneClick=true`、`perMachine=false`、`runAfterFinish=true`，创建桌面和开始菜单快捷方式，卸载时保留用户数据。
- 安装验证：`counselor-desk-4.0.0-x64.exe /S /D=<临时目录>` 返回 `0`；安装后的 `辅导员工作台.exe` 通过 Chrome DevTools 协议加载页面。
- 便携验证：`counselor-desk-4.0.0-portable.exe` 在全新 `--user-data-dir=<临时目录>` 下加载页面，页面标题为“辅导员工作台”，首页包含首次引导、示例数据、政策智库和模板库入口。
- 路径验证：进入“模板库 → 分类文件库”后，界面显示“桌面版已启用加密附件保险库”及实际保险库路径；文档不再写死旧构建机的 `...final*` 临时目录。
# v4.0 归位与桌面链路复验补充

## 2026-08-06 本轮复验

- 独立 V4.0 导航项：0；旧入口 `photos/org/party/files/employment/backup` 均可进入父板块标签。
- 浏览器实际检查：学生台账三标签、照片管理入口、数据分析图表下钻均通过。
- 响应式尺寸检查：1366×768、1920×1080、390×844、320×568 均无文档横向溢出，且没有残留 V4 导航标记。
- 10000 行导入：进度最大间隔约 105ms，主线程事件循环最大间隔约 110ms，满足 500ms/200ms 门槛。
- 用户提供的 `学生基本信息大表.xls` 已通过脱敏试点脚本读取（99 行、100 列）；报告仅保存哈希和聚合统计，未把原始文件写入仓库。该单样本不能证明 99.7% 运营指标。
- Electron 主进程、预加载层和 SQLite 存储通过语法检查并完成启动存活验证。

## 发布阻断项

- Windows 正式代码签名证书尚未配置，未签名安装包不得作为正式公开发布物。
- 真实运营成功率仍缺少不少于 100 份脱敏表格、20 种来源格式及人工来源登记。
