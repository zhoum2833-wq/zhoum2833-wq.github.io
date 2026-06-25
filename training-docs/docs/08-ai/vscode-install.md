---
title: VS Code 下载与安装
---

# VS Code 下载与安装

VS Code 是你 AI 编程的"驾驶舱"。这篇文章手把手带你把环境搭好。

## 下载 VS Code

打开浏览器，访问 VS Code 官网：

> **https://code.visualstudio.com/**

首页会自动识别你的操作系统。对于 Windows，你会看到两个版本：

| 版本 | 说明 | 推荐 |
|------|------|------|
| **System Installer** | 安装到 `C:\Program Files\`，所有用户都能用 | ✅ 选这个 |
| **User Installer** | 安装到用户目录，不需要管理员权限 | ❌ 部分功能受限 |

点击蓝色的 **Download for Windows** 按钮，下载 `.exe` 安装文件。

::: tip 官网才是唯一可信来源
不要在百度搜索"VS Code 下载"——前几个结果往往不是官网，可能捆绑了乱七八糟的东西。直接在地址栏输入 `code.visualstudio.com` 最安全。
:::

macOS 用户下载 `.zip` 解压拖到 Applications 即可；Linux 用户推荐用系统包管理器安装。

## Windows 安装步骤

双击下载的 `VSCodeSetup-x64-*.exe`，按以下步骤操作：

**1. 许可协议** → 选「我同意」，下一步。

**2. 安装路径** → 保持默认（`C:\Program Files\Microsoft VS Code`）即可，下一步。

**3. 开始菜单文件夹** → 默认，下一步。

**4. 附加任务** — 这是最关键的一步，务必勾选以下选项：

- ✅ **将"通过 Code 打开"操作添加到目录的右键菜单** — 之后在任意文件夹右键就能用 VS Code 打开
- ✅ **将"通过 Code 打开"操作添加到文件的右键菜单**
- ✅ **添加到 PATH（重启后生效）** — 这样终端里输入 `code` 就能启动 VS Code

其他选项保持默认。点击「下一步」→「安装」，等进度条走完。

**5. 安装完成** → 勾选「启动 Visual Studio Code」，点击「完成」。

## 首次启动与中文设置

第一次打开 VS Code，会先让你选配色主题。无所谓选哪个，之后随时可以换（`Ctrl+K Ctrl+T`）。

接下来设置中文界面：

1. 按 `Ctrl+Shift+X` 打开扩展商店
2. 在搜索框输入 **Chinese**
3. 找到 **Chinese (Simplified) (简体中文) Language Pack for Visual Studio Code**（发布者是 Microsoft）
4. 点击 **Install**
5. 安装完成后，右下角弹出提示「Change Language and Restart」→ 点击
6. VS Code 重启后就是中文界面了

## 验证安装

打开终端（`Win+R` → 输入 `cmd` → 回车），输入：

```bash
code --version
```

如果输出类似 `1.xx.x` 的版本号，说明安装成功。

再试一个更实用的——在桌面或任意文件夹空白处**右键**，你应该能在菜单中看到：

> **通过 Code 打开**

点击它，VS Code 会以该文件夹为工作目录启动。这就是你之后打开项目的方式。

## 配置 Git Bash 终端

VS Code 自带终端（快捷键 `` Ctrl+` ``），但 Windows 默认的 PowerShell 和 cmd 不支持 `make` 等嵌入式开发必备命令。你需要装 Git Bash。

如果你还没装 Git，去 [git-scm.com](https://git-scm.com/) 下载 Windows 版安装（安装选项一路默认即可）。Git Bash 会随 Git 一起装好。

安装 Git 后，在 VS Code 中设置默认终端：

1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入 `Terminal: Select Default Profile`，选中
3. 在列表中选择 **Git Bash**
4. 现在按 `` Ctrl+` `` 打开终端，就是 Git Bash 了——支持 `make`、`ls`、`grep` 等 Linux 命令

::: tip 验证终端
在 VS Code 终端里输入 `make --version`。如果没有报"找不到命令"，说明 Git Bash 正常工作。报错也没关系——装好 GNU Arm Embedded Toolchain 之后就有了。
:::

## 下一步

环境搭好了。接下来看看 VS Code 有哪些必装插件、实用操作和快捷键——见下一章「VS Code — 你的 AI 编程环境」。

## 小结

VS Code 是你 AI 编程的"驾驶舱"。安装时注意勾选"添加到 PATH"和"通过 Code 打开"，装完后打开终端验证 `code --version`。中文语言包和 Claude Code 插件是必装的，其他的按需添加。