---
title: Claude Code + DeepSeek V4 环境配置
---

# Claude Code + DeepSeek V4 环境配置

这篇文章带你从零开始，把 Claude Code 和 DeepSeek V4 Pro 的环境搭好。整个过程大约需要 20 分钟。

## 前置条件：Node.js

Claude Code 基于 Node.js 运行。先检查你电脑上有没有装：

```bash
node -v
```

如果输出 `v18.x.x` 或更高版本（`v20.x.x`、`v22.x.x`），跳过本节，直接去「安装 Claude Code CLI」。

如果提示"不是内部或外部命令"，说明没装，按下面的步骤来。

### 安装 Node.js

1. 打开 [nodejs.org](https://nodejs.org/)
2. 下载 **LTS 版本**（长期支持版，带绿色 "LTS" 标记）——不要下最新的 Current 版，稳定性不如 LTS
3. 运行下载的 `.msi` 安装文件
4. 安装选项全部默认即可。有一页会提示 "Automatically install the necessary tools"——勾上，它会用 Chocolatey 自动装好 C++ 编译工具链
5. 安装完成后，**关闭所有终端窗口重新打开**，否则 PATH 不会生效

验证安装：

```bash
node -v   # 应输出 v20.x.x 或 v22.x.x
npm -v    # 应输出 10.x.x 或更高
```

::: tip 为什么需要 Node.js？
Claude Code 是一个 Node.js 命令行工具。`npm` 是 Node 的包管理器——你用它来安装和更新 Claude Code，就像手机上的应用商店。
:::

## 安装 Claude Code CLI

在终端中运行：

```bash
npm install -g @anthropic-ai/claude-code
```

`-g` 表示全局安装，安装后在任何目录都能使用 `claude` 命令。

等待安装完成。国内网络可能需要一两分钟，如果很慢，参考文末「常见问题」中的镜像配置。

验证安装：

```bash
claude --version
```

看到版本号（如 `v1.x.x`）就说明安装成功。

## 获取 DeepSeek API Key

Claude Code 本身是"外壳"，它需要一个后端 AI 模型来思考和生成代码。DeepSeek V4 Pro 就是这个"大脑"。你需要一个 API Key 来访问它。

### 1. 注册 DeepSeek 账号

打开 [platform.deepseek.com](https://platform.deepseek.com/)，用手机号或邮箱注册。流程很简单，一两分钟搞定。

### 2. 充值

DeepSeek API 按使用量收费，但价格非常便宜。百万 token 的输出只需几块钱。首次建议充值 10-20 元，个人使用够用很久。

进入「费用中心」→「充值」，支持微信和支付宝。

### 3. 创建 API Key

进入「API Keys」页面 →「创建新的 API Key」→ 起个名字（如 `claude-code`）→ 创建。

创建后会显示一串字母数字组成的 Key。**立刻复制保存到安全的地方**，这个窗口关闭后就再也看不到了——只能重新创建。

::: danger API Key = 你的数字钱包
- 不要分享给任何人
- 不要截图发社交媒体（大量泄露案例都来自截图）
- 不要写在代码里上传到 GitHub
- 一旦怀疑泄露，马上去 DeepSeek 控制台删掉旧 Key 重新创建
:::

## 配置环境变量

现在要告诉 Claude Code 两件事：用什么 Key、连哪个后端。这通过环境变量配置。

### 方法一：永久设置（推荐，配一次永久生效）

**Windows 11：**

1. 按 `Win` 键，搜索「编辑系统环境变量」→ 打开
2. 点击「环境变量」按钮
3. 在**「用户变量」**区域（不是系统变量），点击「新建」，添加两个变量：

| 变量名 | 变量值 |
|--------|--------|
| `ANTHROPIC_API_KEY` | 粘贴你的 DeepSeek API Key |
| `ANTHROPIC_BASE_URL` | `https://api.deepseek.com` |

4. 确定保存，**关闭所有终端窗口重新打开**使配置生效

**macOS / Linux：**

编辑 `~/.bashrc`（或 `~/.zshrc`，取决于你用的 shell），在末尾添加：

```bash
export ANTHROPIC_API_KEY="你的DeepSeek API Key"
export ANTHROPIC_BASE_URL="https://api.deepseek.com"
```

保存后运行 `source ~/.bashrc`（或 `source ~/.zshrc`）使配置生效。

### 方法二：临时设置（仅当前终端窗口有效）

```bash
# Windows (Git Bash / cmd)
set ANTHROPIC_API_KEY=你的DeepSeek API Key
set ANTHROPIC_BASE_URL=https://api.deepseek.com

# macOS / Linux
export ANTHROPIC_API_KEY="你的DeepSeek API Key"
export ANTHROPIC_BASE_URL="https://api.deepseek.com"
```

关掉终端就失效，适合临时测试或不想留 Key 在系统中的情况。

## 验证 Claude Code 连接

打开新的终端窗口，输入：

```bash
claude
```

首次启动会进行短暂初始化。如果你看到 Claude Code 的欢迎界面，并可以正常对话，说明配置成功。

试着输入：

> 你好，你现在用什么模型？

如果它回答使用了 DeepSeek 模型，一切就绪。

## 常见问题

### npm 安装报错 "EACCES" 或权限不足

**Windows**：用管理员身份打开终端（右键开始菜单 →「终端(管理员)」），重新执行安装命令。

**macOS / Linux**：不要用 `sudo npm install -g`——这会引发更多权限问题。推荐先装 `nvm` 来管理 Node.js：

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
# 重启终端，然后安装 Node.js
nvm install --lts
nvm use --lts
# 再装 Claude Code
npm install -g @anthropic-ai/claude-code
```

### 国内 npm 安装很慢

把 npm 源换成淘宝镜像：

```bash
npm config set registry https://registry.npmmirror.com
```

安装完 Claude Code 后可以换回官方源：

```bash
npm config set registry https://registry.npmjs.org
```

### 终端找不到 `claude` 命令

npm 全局安装的目录没有被加到系统 PATH 中：

1. 运行 `npm config get prefix` 查看全局安装路径
2. 把输出的路径添加到系统 PATH 环境变量中
3. 重启终端

### Claude Code 连接失败 / 超时

- 确认 `ANTHROPIC_API_KEY` 设置正确：终端输入 `echo %ANTHROPIC_API_KEY%`（Windows cmd）或 `echo $ANTHROPIC_API_KEY`（Git Bash / macOS / Linux）检查
- 确认 `ANTHROPIC_BASE_URL` 是 `https://api.deepseek.com`（注意是 `https` 不是 `http`，末尾没有 `/v1` 等后缀）
- 如果用的是公司或学校网络，可能需要配置 HTTP 代理

## 下一步

环境搭好了。接下来了解 Claude Code 的核心概念、常用命令和典型工作流——见下一章「Claude Code + DeepSeek V4 Pro」。
