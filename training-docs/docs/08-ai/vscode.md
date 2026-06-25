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

## 调试依赖链：Cortex-Debug 不是"一个插件就够"

很多人装完 Cortex-Debug 插件，按 F5 直接报错，就以为"这插件不好用"。其实 Cortex-Debug 只是冰山最上面的一角——它下面还有一整条依赖链。五样东西，缺一不可：

```
VS Code 界面（你操作的）
    ↓
Cortex-Debug 插件（在 VS Code 里画断点、变量面板）
    ↓
arm-none-eabi-gdb（GDB 客户端，解析调试指令）
    ↓
GDB Server / OpenOCD / pyOCD（翻译官，把 GDB 指令转成硬件信号）
    ↓
调试器硬件（STlink / DAPLink / JLink，通过 USB 连接电脑）
    ↓
单片机（目标芯片，通过 SWD 两线连接）
```

| 组件 | 是什么 | 怎么装 |
|------|--------|--------|
| **Cortex-Debug 插件** | VS Code 里的"调试面板"，你把断点点在哪行、想看哪个变量，它负责画界面 | VS Code 扩展商店搜索 `Cortex-Debug`（marus25） |
| **ARM 编译链** | 包含 `arm-none-eabi-gcc`（编译）和 **`arm-none-eabi-gdb`**（调试用的 GDB 客户端） | [ARM 官网](https://developer.arm.com/downloads/-/arm-gnu-toolchain-downloads) 下载 Windows `.exe` 安装包，安装时**勾选「Add to PATH」** |
| **GDB Server / OpenOCD / pyOCD** | 翻译官——GDB 说的是一套通用协议，STlink/DAPLink 各有各的"方言"，翻译官在中间做转换 | STlink → STM32CubeIDE 自带的 `ST-LINK_gdbserver` / DAPLink → `pip install pyocd` 或装 OpenOCD |
| **调试器硬件** | STlink、DAPLink、JLink 实体，一端 USB 插电脑、一端 SWD 连单片机 | 开发板自带或淘宝 ~15-20 元 |
| **单片机** | 你写的代码跑在它上面 | 开发板上的主芯片 |

**被漏掉最多的就是 `arm-none-eabi-gdb`。** 很多人以为装了 OpenOCD 就齐了，结果 F5 报 "Failed to start GDB"——因为 GDB 客户端根本不在系统里。

装完编译链后，打开终端验证：

```bash
arm-none-eabi-gdb --version
# 必须输出版本号，如 GNU gdb ... 12.1 ...
# 如果提示"不是内部命令"，说明没装或没加 PATH
```

::: warning 这个报错最常见
**"Failed to launch GDB: arm-none-eabi-gdb not found"**

→ 三个可能：① 没装 ARM 编译链 ② 装了但没勾「Add to PATH」③ 装了也勾了但没重启终端。去系统环境变量里确认 `arm-none-eabi-gdb.exe` 所在目录在 PATH 里，然后**关掉所有终端重新打开**。
:::

下面按步骤把这条路走通。

### 第一步：确认调试器被电脑识别

先把调试器用 USB 线连上电脑，然后验证系统是否认到了它。

**Windows**：按 `Win+X` →「设备管理器」→ 展开「通用串行总线设备」或「端口」，你应该能看到：

- STlink → 显示 **ST-Link Debug** 或 **STM32 STLink**
- DAPLink → 显示 **DAPLink** 或 **CMSIS-DAP** 或某个串口设备

如果显示黄色感叹号，说明驱动没装好——去调试器官网下载驱动。

### 第二步：确认你用的是哪种调试器

这一点必须搞清楚，因为后续配置不一样。判断方法——看你开发板的 USB 口旁边那颗小芯片上的丝印：

- 印着 `STM32F103C8T6` 或 `STM32F103CBT6` → 大概率是 **DAPLink**（国产开发板最常见）
- 印着 `STM32F103C8T6` 且板上有 STlink 标识 → **STlink**（ST 官方开发板）
- USB 口旁边只有一个 LDO 没有额外芯片 → 板载 STlink 集成在主板 MCU 里（如 STM32 Nucleo 系列）

不确定的话，直接问淘宝卖家「这板子板载的调试器是 STlink 还是 DAPLink」。

### 第三步：装好对应的 GDB Server

Cortex-Debug 不直接操作调试器，而是通过一个中间程序——**GDB Server**——来跟调试器通信。

**用 STlink：安装 ST-LINK GDB Server**

- 方法一（省事）：装 [STM32CubeIDE](https://www.st.com/en/development-tools/stm32cubeide.html)（免费），安装包自带 `ST-LINK_gdbserver.exe`
- 方法二（轻量）：只装 [STM32 ST-LINK Utility](https://www.st.com/en/development-tools/stsw-link004.html)，同样包含 GDB Server

装完后记下 `ST-LINK_gdbserver.exe` 的路径，默认在：
```
C:\ST\STM32CubeIDE_1.x.x\STM32CubeIDE\plugins\com.st.stm32cube.ide.mcu.externaltools.stlink-gdb-server.win32_*\tools\bin\
```

**用 DAPLink：安装 pyOCD**

在终端执行：

```bash
pip install pyocd
```

验证安装：

```bash
pyocd list --targets   # 列出支持的芯片型号
pyocd list             # 列出当前连接的 DAPLink 调试器
```

看到你的调试器出现在列表里，说明一切正常。

::: tip 怎么选 GDB Server？
- STM32 + STlink → 用 ST-LINK GDB Server（最稳定，ST 亲儿子）
- 非 STM32 芯片 + DAPLink → 用 pyOCD（ARM 亲儿子，芯片支持最广）
- STM32 + DAPLink → 两种都行，pyOCD 配置更简单
:::

### 第四步：创建 launch.json

在 VS Code 中：

1. 点击左侧「运行和调试」图标（虫子 + 播放按钮）
2. 点击「创建 launch.json 文件」
3. 选择 **Cortex Debug**
4. VS Code 会生成一个模板，把它改成下面这样：

**STlink 配置：**

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug (STlink)",
            "type": "cortex-debug",
            "cwd": "${workspaceRoot}",
            "executable": "./build/firmware.elf",
            "request": "launch",
            "servertype": "stlink",
            "device": "STM32G431CB",
            "svdFile": "./STM32G431.svd",
            "runToEntryPoint": "main"
        }
    ]
}
```

**DAPLink 配置：**

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug (DAPLink)",
            "type": "cortex-debug",
            "cwd": "${workspaceRoot}",
            "executable": "./build/firmware.elf",
            "request": "launch",
            "servertype": "pyocd",
            "device": "STM32G431CB",
            "svdFile": "./STM32G431.svd",
            "runToEntryPoint": "main"
        }
    ]
}
```

**关键字段说明：**

| 字段 | 含义 | 怎么填 |
| ------ | ------ | -------- |
| `executable` | 你要调试的固件路径 | 填你 `make` 后生成的 `.elf` 文件路径（不是 `.hex` 也不是 `.bin`——`.elf` 包含调试信息） |
| `device` | 芯片型号 | 填你单片机精确型号，如 `STM32F407VG`、`MSPM0G3507`。运行 `pyocd list --targets \| grep STM32` 可查支持的型号列表 |
| `svdFile` | 外设寄存器描述 | 从芯片厂商官网下载对应型号的 `.svd` 文件，放到项目根目录。没有它也能调试，但只能看 CPU 寄存器，看不到 GPIO、TIM 等外设寄存器 |
| `runToEntryPoint` | 停在 main 函数 | 设为 `"main"`，启动调试后自动停到 main 第一行——不用手动找入口 |

### 第五步：启动调试

1. 确认单片机已上电、调试器 USB 已连接
2. 按 `F5`（或点击左上角绿色播放按钮）
3. 首次启动会稍慢——Cortex-Debug 在启动 GDB Server + 连接芯片 + 烧录固件
4. 程序停在 `main()` 第一行，现在你可以：
   - `F10` — 单步跳过（执行当前行，不进入函数内部）
   - `F11` — 单步进入（进入当前行的函数内部）
   - `F5` — 继续运行到下一个断点
   - 左侧面板查看变量值和寄存器

### 常见问题

**F5 后报 "Failed to launch GDB Server"？**

→ ST-LINK GDB Server 没装，或没在 PATH 里。把 `ST-LINK_gdbserver.exe` 所在目录加到系统 PATH 环境变量。

**pyOCD 连不上 DAPLink？**

```bash
pyocd list
```

如果没列出调试器，检查 USB 线——有些 Micro USB 线只供电不传数据，换根数据线试试。

**调试时看不到 GPIO / TIM 寄存器的值？**

→ 没有配置 `svdFile`。去芯片厂商官网搜「你的芯片型号 + SVD」下载，放到项目目录，在 launch.json 里写好路径。

**断点设了但不停？**

→ 编译时可能没开调试信息。检查 Makefile 或编译选项里有没有 `-g` 参数（GCC/GDB 用 `-g` 生成调试符号）。没有 `-g` 编译出来的固件可以烧录但不能调试。

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