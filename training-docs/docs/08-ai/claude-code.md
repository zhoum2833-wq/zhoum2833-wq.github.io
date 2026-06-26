---
title: Claude Code + DeepSeek V4 Pro
---

# Claude Code + DeepSeek V4 Pro

Claude Code 是 Anthropic 公司开发的 AI 编程助手。它以 **VS Code 插件**的形式运行，直接嵌在编辑器侧边栏里——能读代码、写代码、执行终端命令。你的 Claude Code 使用的是 DeepSeek V4 Pro 作为后端模型。

## 核心概念

Claude Code 就像一个**嵌在编辑器里的 AI 搭档**。你对它说"帮我写一个读取陀螺仪数据的函数"，它会：

1. 读取项目中相关的文件（理解你的代码风格和接口）
2. 生成代码
3. 等你审核
4. 你确认后，它把代码写入文件

::: tip 关键区别
Claude Code 不是简单的代码补全。它能理解你的整个项目，写出上下文一致的代码，而不仅仅是猜你下一行要写什么。
:::

## DeepSeek V4 Pro

这是驱动 Claude Code 的后端 AI 模型。它的核心参数：

| 参数 | 数值 |
|------|------|
| 上下文窗口 | 1,000,000 token（约 150 万字，一本书的量） |
| 中文能力 | 母语级别 |
| 代码能力 | 国际一流 |

上下文窗口就是 AI 的"短期记忆"。1M token 的窗口意味着它可以一次性"看到"整个项目的代码，而不是看一页忘一页。这在大项目中非常有用。

## 常用命令

Claude Code 使用斜杠命令来控制行为：

```bash
/init           # 让 Claude Code 了解你的项目（生成 CLAUDE.md）
/model          # 切换 AI 模型
/effort 或 /max # 控制思考深度（high = 更深思熟虑但更贵更慢）
/clear          # 清空当前对话
/help           # 查看所有可用命令
```

`/init` 是你在新项目中首先要做的事情。Claude Code 会扫描你的项目结构，生成一个 `CLAUDE.md` 文件来记录项目的基本信息。之后每次对话，它都会先读这个文件来理解上下文。

## 费用控制

使用 AI 服务是按 token（处理文本量）计费的。想省钱，记住两条：

1. **缓存命中**：如果你连续两轮对话的上下文相同，这部分不重复计费。所以不要每次都让 AI 重新读取整个项目。
2. **精准提问**：描述清楚你的需求，有的放矢。模糊的提问会导致 AI 反复猜测和修改，反而更费 token。

::: warning
不要用 `/effort max` 来处理简单的语法问题。就像杀鸡用牛刀——既慢又贵。简单问题用默认模式即可。
:::

## 在 VS Code 中使用 Claude Code

Claude Code 插件安装后，点击左侧的 Claude Code 图标即可打开对话面板。你可以把它拖到右侧、底部，或者保持侧边栏——怎么顺手怎么来。

在对话面板中，你不仅能用自然语言聊天，还能直接拖入文件、图片（需要 deepseek-vision skill 支持）让 AI 分析。AI 生成的代码会以 diff 形式展示，你逐段审核确认后才写入文件，不会悄无声息地改你的代码。

::: tip 建议配置
在 settings.json 中加上这两行，体验更好：
```json
"claudeCode.preferredLocation": "panel",      // 在底部面板打开，不占侧边栏位置
"claudeCode.disableLoginPrompt": true,        // 跳过 Anthropic 登录（你用的是 DeepSeek，不需要登录）
```
:::

## 典型工作流

```
1. 你用自然语言描述需求：
   "我要写一个 OLED 显示驱动，用 I2C 通信，芯片是 SSD1306"

2. Claude Code 读取项目 → 理解现有代码风格和 I2C 接口

3. 生成 bsp_oled.c 和 bsp_oled.h

4. 你逐段审查代码 → 提出修改意见 → Claude Code 修改

5. 确认无误 → Claude Code 写入文件
```

::: tip 效率建议
与其让 AI 猜，不如用一句话说清楚。比如不说"帮我写个驱动"，而是说"帮我写一个基于 TI DriverLib 的 SSD1306 OLED 驱动，I2C 地址 0x3C，需要 display_char 和 display_string 两个函数"。
:::

## 小结

Claude Code + DeepSeek V4 Pro 是当前性价比最高的 AI 编程组合。Claude Code 负责理解你的工程上下文和编排任务，DeepSeek 负责执行——写好提示词、善用 Skills、保持会话聚焦，你能用在校生的预算获得接近专业开发者的效率。