# 贡献指南 · CONTRIBUTING

感谢你考虑为 **辅导员工作台（Counselor Desk）** 贡献！🎉

本指南会告诉你如何参与这个项目——提 Issue、提 PR、加模块、报告 Bug。

---

## 📋 目录

- [行为准则](#行为准则)
- [我能帮上什么忙？](#我能帮上什么忙)
- [报告 Bug](#报告-bug)
- [提出新功能建议](#提出新功能建议)
- [提交代码](#提交代码)
- [开发流程](#开发流程)
- [代码风格](#代码风格)
- [添加新模块](#添加新模块)
- [提交信息规范](#提交信息规范)

---

## 🤝 行为准则

### 我们的承诺

为了营造一个开放友好的环境，我们承诺：无论年龄、体型、残疾、种族、性别认同、经验水平、教育背景、社会地位、国籍、个人外貌或宗教信仰如何，所有贡献者都享有平等的参与机会。

### 我们的标准

**积极行为**：
- 使用欢迎和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

**不可接受的行为**：
- 使用性化语言或图像
- 挑衅、侮辱/贬损评论、人身攻击或政治攻击
- 公开或私下骚扰
- 未经明确许可发布他人的私人信息
- 在专业环境中可能被合理认为不合适的其他行为

---

## 💡 我能帮上什么忙？

### 🐛 修 Bug
查看 [Issues](../../issues?q=is%3Aissue+is%3Aopen+label%3Abug) 里 `bug` 标签的条目。任何人都可以领取并修复。

### ✨ 加新功能
查看 [Issues](../../issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement) 里 `enhancement` 标签的条目。也可以先开 Issue 讨论再实现。

### 📚 改进文档
- 修正错别字 / 翻译
- 补充使用场景 / 截图
- 完善开发者文档

### 🎨 优化视觉
- 新增配色方案
- 改进暗色模式
- 改进无障碍体验

### 🧪 增加测试
- 边界情况
- 性能测试
- 跨浏览器兼容性

### 🌐 本地化
- 翻译文档（英文、日文等）
- 多语言界面（如有需要）

---

## 🐛 报告 Bug

提交 Bug 前请先：
1. 在 [Issues](../../issues) 里搜索，确认没有重复
2. 确认你用的是最新版本

### Bug 报告模板

```markdown
## Bug 描述
简要描述 Bug

## 复现步骤
1. 打开 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

## 预期行为
应该发生什么

## 实际行为
实际发生什么

## 截图
（如果有）

## 环境
- 浏览器：[例如 Chrome 120.0]
- 操作系统：[例如 Windows 11]
- 应用版本：[例如 v3.8.0]

## 附加信息
其他相关内容
```

> ⚠️ **请勿在 Issue 中提交含真实学生信息的导出文件或截图。**

---

## ✨ 提出新功能建议

我们欢迎任何功能建议，但请先思考：

1. **这个功能是否符合"高频日常"的定位？** 工作台不是重型系统，不做"用一次就不用了"的功能
2. **这个功能是否已经在其他模块里覆盖了？** 避免重复
3. **这个功能是否能用现有 `window.CWB` 扩展点实现？** 不必改核心代码

### 功能建议模板

```markdown
## 功能描述
简要描述功能

## 解决的问题
解决谁的什么问题？

## 替代方案
考虑过哪些替代方案？为什么选这个？

## 优先级
- [ ] 高（阻塞日常使用）
- [ ] 中（重要但不阻塞）
- [ ] 低（锦上添花）

## 附加信息
其他相关内容
```

---

## 🔧 提交代码

### Fork & Clone

```bash
# 1. Fork 仓库（点击 GitHub 上的 Fork 按钮）

# 2. 在 Fork 页面复制 Clone 地址并执行
git clone https://github.com/7752777/counselor-desk.git
cd counselor-desk

# 3. 添加上游仓库
git remote add upstream https://github.com/7752777/counselor-desk.git
```

### 创建分支

```bash
# 拉取最新代码
git fetch upstream
git checkout master
git rebase upstream/master

# 创建特性分支
git checkout -b feature/your-feature-name

# 或修复分支
git checkout -b fix/issue-number-description
```

### 编写代码

- 遵循现有代码风格
- 添加必要的注释
- 如果是 bug 修复，先写一个能复现的测试
- 如果是新功能，补充对应文档

### 本地验证

```bash
# 安装锁定的测试依赖并运行全部检查
pnpm install --frozen-lockfile
pnpm test                         # 4 套测试应全部通过
pnpm run lint                     # 内联 JavaScript 语法检查
pnpm run check:public             # 公开发布面检查
```

### 提交

```bash
git add .
git commit -m "feat: 添加某某功能"
git push origin feature/your-feature-name
```

### 提 PR

在 GitHub 上点 "New Pull Request"，按模板填写：
- 标题：简明扼要
- 描述：改动动机 + 改动内容 + 截图（如有）
- 关联的 Issue：`Closes #123` 或 `Refs #456`
- 测试清单：勾选你跑过的测试

---

## 💻 开发流程

### 单文件架构

整个应用都在 `index.html` 一个文件里——HTML 模板 + CSS 变量 + JS 业务逻辑。这意味着：

✅ **优点**：
- 改动一处即生效，无需构建
- 双击就能打开测试
- 部署极其简单（拷文件就行）

⚠️ **挑战**：
- 5,968+ 行代码需要分段阅读
- 改 CSS 时注意浅 / 深双主题兼容性
- 改 JS 时注意不要破坏 IIFE 闭包

### 推荐开发工具

- **VSCode**：内置 HTML/CSS/JS 语法高亮
- **Live Server 插件**：改动 `index.html` 自动刷新浏览器
- **浏览器 DevTools**：F12 打开，看 Console 调试

### 调试小技巧

在浏览器控制台里：

```javascript
// 查看完整数据
CWB.db

// 清空所有数据（危险！）
localStorage.clear()

// 查看当前模块列表
CWB.modules.list

// 触发某个视图
CWB.go('students')

// 看 CWB 暴露了哪些 API
Object.keys(CWB)
```

---

## 🎨 代码风格

### JavaScript

- 2 空格缩进
- 单引号字符串
- 函数名小驼峰（`stuHeaderToField`）
- 常量大写下划线（`STU_SYNONYMS`）
- 函数必须有简短注释说明用途

### CSS

- CSS 变量优先，禁止硬编码颜色/字体大小
- 浅色 / 深色双主题兼容（用 `[data-theme="dark"]`）
- 组件名小写连字符（`.kpi-card`）
- 避免 !important

### 注释

- 中文注释（项目面向中国辅导员）
- 函数顶部说明用途、参数、返回值
- 关键逻辑行内注释

---

## 🧩 添加新模块

最常见的需求。**不必改核心代码**，通过 `window.CWB.modules.register()` 即可：

```javascript
// 在浏览器控制台测试
CWB.modules.register({
  key: 'dorm-check',                    // 唯一标识
  name: '宿舍检查',                      // 显示名
  duty: 'daily',                        // 归属九大职责
  icon: 'home',                         // 图标
  group: '日常事务',                      // 侧栏分组
  render: () => `
    <div style="padding:24px">
      <h2>宿舍检查记录</h2>
      <!-- 你的模块 UI -->
    </div>
  `,
  onMount: () => {
    // 模块挂载时的初始化逻辑
  }
})
```

更复杂的模块可以：
1. 在 `index.html` 里用 `CWB.schema.dorm_check = { ... }` 定义字段
2. 在 `CWB.store` 封装读写方法
3. 在 `CWB.norm` 加归一化函数
4. 注册到 `CWB.modules`

详见 [**《二次开发指南》**](./docs/二次开发指南.md)。

---

## 📝 提交信息规范

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

| Type | 用途 |
| --- | --- |
| `feat` | 新功能 |
| `fix` | 修复 Bug |
| `docs` | 仅文档变更 |
| `style` | 不影响代码含义的变更（空格、格式化等） |
| `refactor` | 既不修复 Bug 也不添加功能的代码变更 |
| `perf` | 性能优化 |
| `test` | 添加或修正测试 |
| `chore` | 构建过程或辅助工具的变更 |

### 示例

```bash
git commit -m "feat(import): 支持 xls/xlsx 学生大表直传"
git commit -m "fix(synonyms): 补全「父亲电话」同义词"
git commit -m "docs(readme): 重新组织为开源门面风格"
git commit -m "test(import): 新增 student-import.js 测试"
```

---

## ❓ 还有问题？

- 📖 阅读 [**《二次开发指南》**](./docs/二次开发指南.md)
- 📖 阅读 [**《数据格式与联动约定》**](./docs/数据格式与联动约定.md)
- 💬 在 [Discussions](../../discussions) 里提问
- 🔐 安全问题请通过 [GitHub Security Advisories](../../security/advisories/new) 私密报告

---

再次感谢你的贡献！🙏
