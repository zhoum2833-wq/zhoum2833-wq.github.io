---
title: VS Code — 你的 AI 编程环境
---

# VS Code — 你的 AI 编程环境

VS Code（Visual Studio Code）是目前最流行的代码编辑器。它不是 IDE（集成开发环境），但通过插件可以变成比任何 IDE 都强大的工具。对你来说，VS Code 最重要的价值不是写代码本身，而是**AI 辅助编程**的生态。

## 为什么选 VS Code？

| 特性 | 说明 |
|------|------|
| 插件生态 | 海量扩展，C/C++、调试器、AI 助手应有尽有 |
| AI 集成 | Claude Code、GitHub Copilot 等 AI 工具优先支持 VS Code |
| 跨平台 | Windows、macOS、Linux 都能用，界面完全一致 |
| 免费 | 一分钱不花 |

## 必装插件

打开 VS Code，点击左侧的扩展图标（四个方块），搜索并安装以下插件：

1. **C/C++ (Microsoft)** — 代码补全、语法高亮、函数跳转。没有它，C 代码就是纯黑色文本。
2. **Cortex-Debug (marus25)** — 配合 JLink 进行断点调试。
3. **Claude Code (Anthropic)** — AI 助手，可以在编辑器内使用 AI 编写代码。
4. **Error Lens** — 把编译错误直接显示在代码行末尾，不用切到终端看错误信息。

## .vscode/settings.json

你的项目目录下已经有一个 `.vscode/settings.json` 文件，它配置了 IntelliSense（智能感知）所需的头文件路径和编译器参数。这样 VS Code 才能正确识别你代码中的 `#include` 和宏定义。

::: tip 不要乱改
这个文件通常是自动生成的。如果你发现代码中出现了红色波浪线但编译没报错，可能是 IntelliSense 路径配置有问题。反之，编译报错但编辑器不报错，也是同样的问题。
:::

## 实用操作

VS Code 的一切操作都可以通过命令面板完成。按下 `Ctrl+Shift+P`，然后输入你想做的事情（中文也可以），就能找到对应的命令。

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+P` | 命令面板（万能入口，找不到按钮就按这个） |
| `Ctrl+`` | 打开/关闭内置终端 |
| `Ctrl+P` | 快速打开文件（输入文件名片段即可） |
| `F5` | 开始调试 |
| `Ctrl+Shift+F` | 全局搜索（在所有文件中搜索文本） |
| `Ctrl+B` | 切换侧边栏 |
| `Ctrl+/` | 注释/取消注释当前行 |

## VS Code 终端 vs IDE 按钮

许多商业 IDE（如 Keil、IAR）把编译、烧录都做成了图形按钮。VS Code 的哲学不同——它让你在终端里敲命令：

```bash
make all      # 编译
make flash    # 烧录
make clean    # 清理
```

刚开始可能觉得"不如按钮方便"，但你很快会发现终端其实更灵活——你可以把多个命令串起来，可以写脚本，可以看完整的输出日志，而且**不管换到什么编辑器，这些命令都一样用**。

::: warning
初次使用 VS Code 的终端时，注意终端类型要和系统匹配。Windows 上建议使用 Git Bash（安装 Git 时附带）作为默认终端，因为 `make` 等命令在 cmd 和 PowerShell 中可能默认找不到。
:::

---

# 第九篇：PCB 设计