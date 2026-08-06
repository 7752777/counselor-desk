# Windows 正式发布：代码签名配置

## 这道门禁解决什么问题？

代码签名不是让程序“才能运行”的开关，而是给安装包加上可验证的发布者身份。

没有签名的 `.exe`、`.msi` 或便携包仍然可以用于本机测试，但 Windows SmartScreen 可能显示“未知发布者”并要求用户额外确认。只有签名验证结果为 `Valid` 的构建，才可以作为正式公开安装包发布。

证书文件和密码属于发布机秘密，不能提交到仓库、截图或 Issue。仓库只保留构建配置和检查脚本。

## 配置步骤

### 1. 申请并安全保存证书

从可信的代码签名证书颁发机构购买适用于组织发布的 Windows 代码签名证书，并导出为 `.p12` 或 `.pfx` 文件。证书应保存到只有发布账号可读的目录，例如：

```text
C:\secure\counselor-desk-code-signing.p12
```

如果暂时没有证书，不需要为了开发测试购买。此时只生成内部验证包，不标记为正式公开发布版。

### 2. 在发布终端设置临时环境变量

PowerShell 示例：

```powershell
$env:CSC_LINK = 'C:\secure\counselor-desk-code-signing.p12'
$env:CSC_KEY_PASSWORD = '证书密码'
pnpm run desktop:build
```

`CSC_KEY_PASSWORD` 只在当前终端会话中使用。不要把真实密码写入 `package.json`、`.env`、脚本或 CI 日志。

如果证书存放在 CI 的密钥库中，应由 CI 注入 `CSC_LINK` 和 `CSC_KEY_PASSWORD`，并限制构建任务的读取权限。

### 3. 检查构建产物

```powershell
pnpm exec electron-builder --config electron-builder.yml
pnpm exec node scripts/check-release-signing.js output/desktop
```

检查脚本会逐个验证安装包的 Authenticode 签名。出现以下任一情况都不能发布：

- 找不到安装包；
- 签名缺失；
- 证书过期或证书链不受信任；
- Authenticode 状态不是 `Valid`。

也可以在 Windows 资源管理器中打开文件属性 → 数字签名，查看签名者和摘要信息。

## 当前仓库状态

当前仓库没有内置正式证书，签名门禁会有意失败。这是安全设计，不是功能故障：开发和验收可以使用未签名包，公开发行前再由发布者配置自己的证书和密钥保管流程。

签名通过后，还应同步完成：

1. 使用脱敏副本演练安装、升级、卸载和回滚；
2. 保存构建版本、证书指纹和校验哈希；
3. 在发布页明确 Windows 版本、签名状态、隐私边界和备份恢复方式。
