# Counselor Desk 公开开源发布设计

## 目标

将当前 `counselor-desk` 单文件辅导员工作台整理成可公开维护、可复现验证、可直接访问的 GitHub 开源仓库，并补齐当前已经明确存在的发布收尾项。

## 范围

本次包含：

- 修复 README 中指向缺失文件、占位仓库和占位联系方式的内容；
- 保持 `index.html` 单文件、零运行时依赖、双击即可使用的交付方式；
- 增加最小 Node 测试工程入口，使四套现有测试可以在干净环境中按统一命令运行；
- 完善 CI，使依赖安装、四套测试和内联 JS 语法检查能在 GitHub Actions 中复现；
- 核对公开仓库不包含真实学生数据、备份文件和私密演示地址；
- 配置 GitHub Pages 所需的静态发布工作流或仓库设置，并在发布后验证首页可访问。

本次不包含：

- 将单文件应用拆分为 Vite/React 等构建工程；
- 引入后端、账号体系、云端数据库或默认数据上传；
- 新增与公开发布无关的大型业务模块；
- 直接提交任何真实学生信息、导出文件或个人密钥。

## 方案

应用继续以 `index.html` 为唯一运行入口。测试使用 Node.js + jsdom，依赖写入开发依赖并由 npm 脚本统一编排；运行时不加载 npm 包。GitHub Actions 使用锁定的 Node 版本，通过 `npm ci` 安装测试依赖，然后依次执行四套测试和内联 JS 语法检查。

README 保留中文主文档，删除或改写当前仓库中不存在的英文文档引用；涉及仓库地址的徽章、克隆命令、Star/Issue/Discussion 链接统一使用 `counselor-desk` 的真实 GitHub 路径。无法确认的维护者邮箱不伪造，改为 GitHub Issues/Security Advisories 作为公开渠道。在线演示链接只在确认可长期访问时保留，否则改为 GitHub Pages 地址。

GitHub Pages 直接发布仓库静态文件，页面只读取浏览器本地 `localStorage`。Excel 导入的 SheetJS CDN 仍按需加载；README 和安全说明明确区分“应用本身离线可用”和“Excel 导入需要网络或改用 CSV”。

## 关键数据流

```text
修改 index.html / docs
        |
        v
npm test -> regression -> import-loop -> crud-smoke -> student-import
        |
        v
语法检查 + 公开内容检查
        |
        v
Git commit -> GitHub public repository -> GitHub Pages
```

本地业务数据只存在浏览器 `localStorage`，不会进入 git、CI 或 Pages。CI 只加载仓库文件和测试依赖，不执行用户数据导入。

## 错误处理

- `npm ci` 失败时 CI 立即失败，避免出现“测试徽章为绿但没有真正执行测试”的假象；
- 任一测试失败时工作流失败，并保留后续日志用于定位；
- Excel CDN 加载失败继续提示用户使用 CSV，不改变离线 CSV/JSON 工作流；
- 发布前用扫描检查真实备份扩展名、占位 URL、缺失本地链接和敏感凭据模式；
- Pages 发布失败不回滚源码提交，先修复工作流或仓库设置后重新部署。

## 验收标准

1. README 中所有本地链接都能在仓库中找到目标文件，所有仓库链接指向真实公开仓库路径。
2. `npm test` 可以在干净 Node 环境执行四套测试并通过。
3. HTML 内联 JS 语法检查通过，工作区无真实学生数据或备份文件。
4. 浏览器打开首页后，首页渲染正常；可切换模块、创建或编辑任务、导出 JSON、导入 JSON，且数据仍只在本机保存。
5. 桌面和移动尺寸下首页无明显溢出、遮挡或空白错误页。
6. GitHub 公开仓库包含源码、文档、许可证、贡献指南、安全策略和 CI；GitHub Pages 能打开应用首页。

## 发布顺序

1. 添加设计文档并提交。
2. 添加测试工程入口、修正文档和 CI/Pages 配置。
3. 运行静态扫描、四套测试、语法检查和浏览器冒烟验证。
4. 提交实现变更。
5. 在目标 GitHub 账号下创建 `counselor-desk` 公开仓库并推送。
6. 开启 Pages，验证公开地址和 CI 状态。

