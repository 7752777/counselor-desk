# v4.0 Windows 签名发布门禁

Windows 安装包和便携包必须使用组织代码签名证书。开发机可以生成未签名构建用于联调，但未通过 Authenticode `Valid` 校验的文件不得标记为正式公开发布。

## 构建

在签名机设置 Electron Builder 变量后构建：

```powershell
$env:CSC_LINK = 'C:\secure\counselor-desk-code-signing.p12'
$env:CSC_KEY_PASSWORD = '<证书密码>'
& "$env:LOCALAPPDATA\Programs\nodejs\node.exe" node_modules\electron-builder\out\cli\cli.js --config electron-builder.yml
```

证书文件和密码不得提交仓库。构建完成后运行：

```powershell
node scripts/check-release-signing.js output/desktop
```

该门禁会逐个检查 `.exe/.msi/.appx` 的 Authenticode 状态，只有 `Valid` 才通过。当前工作区未配置正式证书，因此现有构建产物只能作为内部验证包。
