---
title: Claude Code 插件 + DeepSeek V4 环境配置
---

# Claude Code 插件 + DeepSeek V4 环境配置

Claude Code 有**VS Code 插件版**，不需要装 Node.js、不用敲 `npm install`、不用配系统环境变量——在 VS Code 里搜到、装上、填 Key、直接用。这篇文章带你 10 分钟搞定。

## 安装 Claude Code 插件

1. 打开 VS Code，按 `Ctrl+Shift+X` 打开扩展商店
2. 搜索 **Claude Code**（发布者是 Anthropic）
3. 点击 **Install**，等几秒装完
4. 左侧会出现 Claude Code 图标（一个对话框样式的 logo）

::: tip VS Code 插件版 vs CLI 版
VS Code 插件版把 AI 对话面板直接嵌在编辑器里，**不需要终端**。装完插件就能用，不用装 Node.js、不用 npm。本文只讲插件版的配置方式。
:::

## 获取 DeepSeek API Key

Claude Code 本身是"外壳"，它需要一个后端 AI 模型来思考和生成代码。DeepSeek V4 Pro 就是这个"大脑"。你需要一个 API Key 来访问它。

### 1. 注册 DeepSeek 账号

打开 [platform.deepseek.com](https://platform.deepseek.com/)，用手机号或邮箱注册。流程很简单，一两分钟搞定。

### 2. 充值

DeepSeek API 按使用量收费，但价格非常便宜。百万 token 的输出只需几块钱。首次建议充值 10-20 元，个人使用够用很久。

进入「费用中心」→「充值」，支持微信和支付宝。

### 3. 创建 API Key

进入「API Keys」页面 →「创建新的 API Key」→ 起个名字（如 `claude-code`）→ 创建。

创建后会显示一串 `sk-` 开头的 Key。**立刻复制保存到安全的地方**，这个窗口关闭后就再也看不到了——只能重新创建。

::: danger API Key = 你的数字钱包
- 不要分享给任何人
- 不要截图发社交媒体（大量泄露案例都来自截图）
- 不要写在代码里上传到 GitHub
- 一旦怀疑泄露，马上去 DeepSeek 控制台删掉旧 Key 重新创建
:::

## 在 VS Code 中配置

Claude Code 插件的配置写在 VS Code 的 `settings.json` 里，不需要去系统设置里配环境变量。

### 1. 打开 settings.json

按 `Ctrl+Shift+P` → 输入 `Preferences: Open User Settings (JSON)` → 回车。

### 2. 添加 Claude Code 配置

在 JSON 文件中添加以下内容（如果文件中已有其他配置，把 `claudeCode` 相关部分合并进去即可）：

```json
{
    "claudeCode.preferredLocation": "panel",
    "claudeCode.disableLoginPrompt": true,
    "claudeCode.initialPermissionMode": "bypassPermissions",

    "claudeCode.environmentVariables": [
        {
            "name": "ANTHROPIC_AUTH_TOKEN",
            "value": "sk-你的DeepSeek API Key"
        },
        {
            "name": "ANTHROPIC_BASE_URL",
            "value": "https://api.deepseek.com/anthropic"
        },
        {
            "name": "ANTHROPIC_MODEL",
            "value": "deepseek-v4-pro[1m]"
        },
        {
            "name": "ANTHROPIC_SMALL_FAST_MODEL",
            "value": "deepseek-v4-flash"
        },
        {
            "name": "API_TIMEOUT_MS",
            "value": "600000"
        },
        {
            "name": "CLAUDE_CODE_EFFORT_LEVEL",
            "value": "max"
        },
        {
            "name": "ANTHROPIC_DEFAULT_SONNET_MODEL",
            "value": "deepseek-v4-pro"
        },
        {
            "name": "ANTHROPIC_DEFAULT_OPUS_MODEL",
            "value": "deepseek-v4-pro"
        },
        {
            "name": "ANTHROPIC_DEFAULT_HAIKU_MODEL",
            "value": "deepseek-v4-flash"
        }
    ]
}
```

**面板设置：**

| 设置项 | 值 | 作用 |
|--------|-----|------|
| `claudeCode.preferredLocation` | `"panel"` | Claude Code 在底部面板打开，不占侧边栏位置 |
| `claudeCode.disableLoginPrompt` | `true` | 跳过 Anthropic 登录（用 DeepSeek，不需要 Anthropic 账号） |
| `claudeCode.initialPermissionMode` | `"bypassPermissions"` | 跳过每次操作的确认弹窗（AI 直接执行，省得一直点 Allow） |

**环境变量：**

| 变量名 | 值 | 作用 |
|--------|-----|------|
| `ANTHROPIC_AUTH_TOKEN` | `sk-你的Key` | DeepSeek API 密钥 |
| `ANTHROPIC_BASE_URL` | `https://api.deepseek.com/anthropic` | DeepSeek 兼容接口（末尾有 `/anthropic`） |
| `ANTHROPIC_MODEL` | `deepseek-v4-pro[1m]` | 主模型，`[1m]` = 100 万 token 上下文 |
| `ANTHROPIC_SMALL_FAST_MODEL` | `deepseek-v4-flash` | 辅助小模型，处理简单任务更快更省 |
| `API_TIMEOUT_MS` | `600000` | 请求超时 10 分钟，复杂任务不会中途断掉 |
| `CLAUDE_CODE_EFFORT_LEVEL` | `max` | AI 思考深度拉满，代码质量最高 |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | `deepseek-v4-pro` | 选 Sonnet 模型时路由到 DeepSeek |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | `deepseek-v4-pro` | 选 Opus 模型时路由到 DeepSeek |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | `deepseek-v4-flash` | 选 Haiku 模型时路由到 DeepSeek |

::: warning 注意
- 变量名是 **`ANTHROPIC_AUTH_TOKEN`**，不是 `ANTHROPIC_API_KEY`
- 接口地址末尾有 **`/anthropic`**，不是裸的 `api.deepseek.com`
- 三个 `DEFAULT_*_MODEL` 必须配——否则切换到 Sonnet/Opus/Haiku 时会报错，因为没有 Anthropic 原生模型
- 保存 settings.json 后**重启 VS Code** 使配置生效
:::

## 验证配置

1. 重启 VS Code
2. 点击左侧 Claude Code 图标，打开对话面板
3. 输入：

> 你好，你现在用什么模型？

如果它回复使用了 DeepSeek 模型，一切就绪。

## 常见问题

### Claude Code 插件找不到？

确认在扩展商店搜索的是 **Claude Code**（发布者 Anthropic），不是 GitHub Copilot 或其他 AI 插件。

### 连接失败 / 401 Unauthorized？

- 检查 `ANTHROPIC_AUTH_TOKEN` 的值是否完整（`sk-` 开头）
- 检查 `ANTHROPIC_BASE_URL` 末尾是否有 `/anthropic`
- 确认 DeepSeek 账户余额 > 0（余额为 0 时 API 会拒绝请求）
- 公司或学校网络可能需要配置代理

### AI 回复很慢？

- `API_TIMEOUT_MS` 建议至少 `300000`（5 分钟），复杂任务可设 `600000`
- 如果一直超时，检查 `ANTHROPIC_MODEL` 是否填对了（别漏了 `[1m]`）

### 能不能同时用多个 AI 供应商？

可以。`ANTHROPIC_BASE_URL` 和 `ANTHROPIC_AUTH_TOKEN` 可以换成任何兼容 Anthropic API 的服务（如神马、BigModel）。在 `environmentVariables` 数组里改对应的 `value` 就行，不需要重装插件。

## 下一步

配置搞定。接下来了解 Claude Code 的核心概念、常用命令和典型工作流——见下一章「Claude Code + DeepSeek V4 Pro」。
