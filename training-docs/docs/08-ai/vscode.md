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
2. **Cortex-Debug (marus25)** — ARM Cortex 调试器，支持 STlink、DAPLink、JLink 等调试探针，可在 VS Code 内设断点、查看变量和寄存器。
3. **Claude Code (Anthropic)** — AI 编程助手，在编辑器内用自然语言让 AI 写代码、查 bug、解释逻辑。
4. **Serial Monitor (Microsoft)** — 串口监视器，在 VS Code 底部面板直接查看单片机发来的串口数据，不用额外开串口助手。

## 调试器：STlink 与 DAPLink

在电赛中，你日常接触的调试器就是这两款。它们的功能一样——通过 USB 连接电脑和单片机，实现**下载程序**和**断点调试**。

| 调试器 | 适用芯片 | 参考价格 | 特点 |
|--------|----------|----------|------|
| **STlink** | STM32 全系列（F1/F4/G4/H7 等） | ~20 元 / 开发板自带 | ST 官方调试器，STM32 用户首选 |
| **DAPLink** (CMSIS-DAP) | 几乎所有 Cortex-M 芯片 | ~15 元 / 部分开发板自带 | ARM 开源方案，通用性最强 |

### STlink

STlink 是 ST 公司为 STM32 设计的专用调试器。如果你用的是 STM32 开发板（如 STM32F407、STM32G431），板子上通常已经集成了 STlink——插上 USB 线就能用。

**在 VS Code 中使用 STlink：**

1. 安装 **STM32CubeIDE**（免费，内含 `ST-LINK_gdbserver`）或单独下载 [ST-LINK GDB Server](https://www.st.com/en/development-tools/st-link-server.html)
2. Cortex-Debug 插件通过 GDB Server 连接 STlink
3. 连接方式：SWD（仅需两根线——SWCLK + SWDIO，外加 GND）

### DAPLink

DAPLink（原名 CMSIS-DAP）是 ARM 官方的开源调试器方案。它不像 STlink 只绑定 STM32——DAPLink 几乎兼容所有 Cortex-M 内核的单片机。国产芯片（如 GD32、MM32）和各种 MSPM0 开发板，板载调试器大都是 DAPLink 或其变体。

**在 VS Code 中使用 DAPLink：**

1. 安装 **pyOCD**（终端执行 `pip install pyocd`）或 **OpenOCD**（`scoop install openocd` / 官网下载）
2. Cortex-Debug 插件通过 pyOCD 或 OpenOCD 连接 DAPLink
3. 同样是 SWD 两线连接

::: tip 开发板自带调试器，不用额外买
现在绝大多数开发板都**板载了调试器芯片**。看 USB 口旁边的小芯片——如果是 STM32F103C8T6，它很可能被烧录成了 STlink 或 DAPLink 固件。你直接用 USB 线连上电脑就能下载和调试。
:::

### launch.json 配置示例

Cortex-Debug 插件的调试配置写在工作区的 `.vscode/launch.json` 中。以下是两种调试器的典型配置：

**使用 STlink（搭配 ST-LINK GDB Server）：**

```json
{
    "name": "Debug (STlink)",
    "type": "cortex-debug",
    "request": "launch",
    "servertype": "stlink",
    "cwd": "${workspaceRoot}",
    "executable": "./build/firmware.elf",
    "device": "STM32G431CB",
    "svdFile": "./STM32G431.svd"
}
```

**使用 DAPLink（搭配 pyOCD）：**

```json
{
    "name": "Debug (DAPLink)",
    "type": "cortex-debug",
    "request": "launch",
    "servertype": "pyocd",
    "cwd": "${workspaceRoot}",
    "executable": "./build/firmware.elf",
    "device": "STM32G431CB",
    "svdFile": "./STM32G431.svd"
}
```

`device` 填你的芯片型号，`svdFile` 是外设寄存器描述文件（可从芯片厂商官网下载），有了它才能在调试时直接查看 GPIO、定时器、ADC 等外设寄存器的值。

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