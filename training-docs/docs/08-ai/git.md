---
title: Git 团队协作
---

# Git 团队协作

三个人同时写代码，怎么才能不互相覆盖？Git 就是为了解决这个问题的。它像一个**带时间机器的共享文件夹**——每个人都能看到完整的历史记录，谁改了哪一行、什么时候改的，都有据可查。

## Git 下载与安装

先说怎么把 Git 装到你电脑上。

### Windows

1. 打开浏览器，访问 [git-scm.com](https://git-scm.com/)
2. 网站会自动识别你的系统，点击 **Download for Windows**（蓝色按钮）
3. 下载的是一个 `.exe` 安装文件，双击运行
4. 安装过程**一路点 Next 用默认选项即可**。唯一可能让你犹豫的是这几个选项页——选默认就对了：

- **默认编辑器** → 选 **Use Visual Studio Code as Git's default editor**：commit 写说明时用 VS Code 打开，比 Vim 友好
- **调整 PATH 环境** → 默认 **Git from the command line and also from 3rd-party software**：让终端和 VS Code 都能找到 `git`
- **行尾符转换** → 默认 **Checkout Windows-style, commit Unix-style line endings**：跨平台协作不会因换行符出问题
- **终端模拟器** → 默认 **Use MinTTY**：Git Bash 窗口更好看、支持中文

其余页面全部点 Next，最后点 Install。

安装完成后，在桌面空白处**右键**——你会在菜单中看到两项新增：

> **Git Bash Here**
> **Git GUI Here**

验证安装：

```bash
git --version
# 输出类似 → git version 2.47.0.windows.1
```

看到版本号就说明装好了。

::: tip Git Bash = Windows 上的 Linux 终端
Git 安装时会附带 **Git Bash**——一个在 Windows 上运行的 Linux 风格终端，内置支持 `ls`、`grep`、`find`、`ssh`、`make` 等命令。之后在 VS Code 中配置默认终端，就选它。
:::

### macOS

打开终端，输入：

```bash
git --version
```

如果没装，系统会自动提示你安装 Xcode Command Line Tools（包含 Git），点「安装」即可。

或者用 Homebrew：

```bash
brew install git
```

### Linux (Ubuntu / Debian)

```bash
sudo apt update
sudo apt install git
```

## 首次配置：告诉 Git 你是谁

装好 Git 后必须做一件事——设置你的**姓名和邮箱**。你之后的每次提交（commit）都会带上这些信息，队友看到记录就知道是谁改的：

```bash
git config --global user.name "你的姓名"        # 比如 "张三"
git config --global user.email "你的邮箱@qq.com"  # 用你注册 GitHub 的邮箱
```

`--global` 表示全局配置，这台电脑上的所有项目共用。配置存储在 `C:\Users\你的用户名\.gitconfig`（Windows）或 `~/.gitconfig`（macOS/Linux）中，随时可以改。

到此 Git 环境就准备好了。接下来看看它的核心概念和团队协作方式。

## 基本概念

Git 不是网盘。它的核心是"版本"，而非"文件"。每次你执行 `git commit`，就像给当前代码状态拍了一张快照，并且附上一段说明。

| 概念 | 通俗解释 |
|------|----------|
| 仓库（Repository） | 存放代码和所有历史记录的地方 |
| 提交（Commit） | 一次"拍照"，包含所有改动的快照 |
| 分支（Branch） | 代码的"平行宇宙"——在一条线上修改不影响另一条线 |
| 远程（Remote） | 托管在服务器上的仓库（如 GitHub） |
| 合并（Merge） | 把两条分支的改动合到一起 |

## 基本工作流

```bash
# 1. 把远程仓库下载到本地
git clone <仓库地址>

# 2. 创建你的个人分支
git branch my-feature
git checkout my-feature

# 3. 写代码... 然后查看改动
git status

# 4. 把改动加入暂存区并提交
git add bsp_motor.c bsp_motor.h
git commit -m "添加电机驱动初始化函数"

# 5. 推送到远程
git push origin my-feature
```

::: tip
`git status` 是你最常用的命令。每次操作前后都看一下，确保自己在正确的分支上，改动了正确的文件。养成这个习惯能避免 90% 的 Git 事故。
:::

## 分支策略

三人的推荐分工：

```
main  ──────────────────────────────── (稳定版，永远能编译通过)
  └── dev  ────────────────────────── (开发版，合并所有功能)
        ├── personA-sensor  ──────── (A 的传感器代码)
        ├── personB-motor  ───────── (B 的电机代码)
        └── personC-integration  ─── (C 的集成代码)
```

- **main 分支**：只能通过 pull request 合并，必须保证编译通过且基本功能正常
- **dev 分支**：日常合并的目标，可能偶尔出问题，但大体可用
- **个人分支**：随便折腾，坏了也不影响别人

## 三人协作实操

**初期**（学习阶段）：一个人写，两个人看。写的人讲解思路，看的人提出问题。这样可以保证代码质量和学习同步。

**中期**（模块独立）：每个人写自己负责的 BSP 模块（如 bsp_encoder.c、bsp_motor.c、bsp_gyro.c），互不干扰。组长负责审查和合并。

**后期**（集成阶段）：在 dev 分支上合并所有模块。一个人改集成代码，另外两个人负责测试和发现问题。

## .gitignore

不是所有文件都需要上传到 Git。编译产物、IDE 配置、二进制文件都不应该出现在仓库里。`.gitignore` 文件告诉 Git 忽略这些：

```
# 编译产物
*.o
*.elf
*.hex
build/

# IDE 配置
.vscode/
.idea/

# 系统文件
Thumbs.db
.DS_Store
```

## 合并冲突

这是 Git 新手最害怕的场景——但其实没你想的那么可怕。

冲突发生在：两个人同时改了同一个文件的同一行。比如 A 把 LED_PIN 改成了 13，B 把它改成了 14。当 Git 不能自动判断谁对谁错时，它就会标记出来，让你手动选择：

```
<<<<<<< HEAD
#define LED_PIN 13    // A 的版本
=======
#define LED_PIN 14    // B 的版本
>>>>>>> personB-motor
```

你要做的事情很简单：删除标记，保留正确的版本（或者合并两个改动），然后重新 commit。

::: danger 绝对不要做的事
- `git push -f`（强制推送）——会覆盖别人的代码，在团队项目中这是大忌
- 在 main 分支上直接 commit —— 会绕过审查流程
- 提交 .o 或 .elf 文件 —— 污染仓库，且每次都产生大量无用变更
:::

## 关键命令速查

```bash
git status                  # 当前状态
git add <文件>              # 加入暂存区
git commit -m "说明"        # 提交
git push origin <分支名>    # 推送到远程
git pull                    # 从远程拉取最新代码
git branch                  # 查看所有分支
git checkout <分支名>        # 切换分支
git log --oneline           # 查看提交历史
```
