---
title: Keil5：编译、烧录与调试
---

# Keil5：编译、烧录与调试

## Keil5 是什么？

Keil MDK-ARM（简称 Keil5）是 KEIL 公司（现已被 ARM 收购）推出的 ARM 微控制器集成开发环境（IDE）。它是 STM32 开发中最主流的工具链，也是电赛官方推荐的 IDE。

**Keil5 的核心就三件事：编译、烧录、调试。**

## 工程文件结构

打开 4WD_Car 的 `Project/` 目录，你会看到：

```
Project/
├── 4WD_Car.uvprojx      ← ★ 双击打开 Keil5 工程
├── 4WD_Car.uvoptx        ← 工程选项（窗口布局、断点位置等）
├── DebugConfig/           ← 调试器配置
├── RTE/                   ← Run-Time Environment（运行时环境）
└── 4WD_Car/               ← 编译输出目录
    ├── 4WD_Car.axf        ← 带调试信息的可执行文件
    ├── 4WD_Car.hex        ← ★ 最终烧录用的 Hex 文件
    ├── 4WD_Car.map        ← 内存映射表（变量/函数放哪里）
    └── *.o                ← 每个 .c 文件编译出的目标文件
```

- **`.uvprojx`**：工程文件，记录有哪些源文件、编译选项、链接脚本。双击打开。
- **`.hex`**：最终产物。调试器把这个文件的内容烧进单片机 Flash。
- **`.map`**：记录每个函数、每个全局变量占用了哪个地址、占了多少空间。程序莫名变大时打开看看。

## 编译流程（F7）

Keil5 的编译过程分四步：

1. **预编译**：处理 `#include`、`#define` 等预处理指令
2. **编译**：把每个 `.c` 文件分别翻译成汇编，再汇编成 `.o` 目标文件
3. **链接**：把所有 `.o` 文件 + HAL 库 `.lib` 合并成一个 `.axf` 可执行文件
4. **生成 Hex**：从 `.axf` 提取机器码，生成 `.hex` 烧录文件

在 Keil5 中：
- **F7**（Build）：增量编译——只重新编译修改过的文件
- **Ctrl+F7**（Compile）：只编译当前文件（不链接，用于快速检查语法）

编译完成后看底部的 Build Output 窗口。正常情况下你应该看到 `0 Error(s), 0 Warning(s)`。4WD_Car 完整编译大约需要 15-30 秒。

## 常见编译错误速查

### "Undefined symbol xxx"
某个函数或变量只声明了但没有实现。比如你 `extern` 了一个变量但忘了在 `.c` 里定义。或者忘了把某个 `.c` 文件加入工程。

### "No such file or directory"
`#include` 的头文件找不到。检查 Keil5 的 Include Paths（魔法棒 → C/C++ → Include Paths）是否包含了对应目录。

### "conflicting types for xxx"
函数声明和定义的类型不一致。比如 `.h` 里说参数是 `int`，`.c` 里写成 `float`。

## 烧录（F8）

编译通过后，按 **F8** 下载程序到单片机。Keil5 通过调试器（ST-Link / DAP-Link / J-Link）把 `.hex` 的内容写入 STM32 的 Flash 存储器。

烧录前确认三件事：
1. 调试器通过 SWD 线（三根线：SWCLK、SWDIO、GND）连接到了单片机
2. 单片机已供电
3. Keil5 的调试器设置正确（魔法棒 → Debug → 选择你的调试器）

4WD_Car 使用 STM32F407VGT6，SWD 引脚是 PA13（SWDIO）和 PA14（SWCLK）。

## 在线调试

调试是 Keil5 除了编译之外最重要的功能。按 **Ctrl+F5** 进入调试模式。

### 断点（Breakpoint）

在代码行号左侧点击，会出现一个红色圆点。程序运行到这行就自动停下来——比 `printf` 高效一百倍。

调试 4WD_Car 的 PID 控制时：在 `APP_PID_Update()` 里打断点，暂停后可以看到当前速度、目标速度、PWM 输出，快速定位是"算错了"还是"执行错了"。

### 单步执行

- **F10**（Step Over）：执行当前行，遇到函数不进入
- **F11**（Step Into）：执行当前行，遇到函数跳进去
- **Ctrl+F11**（Step Out）：跳出当前函数

### 变量监视（Watch Window）

右键变量名 → "Add to Watch"，你能实时看到这个变量的当前值，不需要任何 `printf`。4WD_Car 调试时最常监视的变量：电机速度、编码器计数、PID 误差。

### 外设寄存器查看

菜单 View → System Viewer → 选择外设（如 TIM3、USART1）。你能直接看到外设寄存器的值——计数器当前值、状态标志位、中断使能位。比翻手册查寄存器地址快得多。

## printf 调试 vs VOFA 遥测

很多新手习惯在代码里插 `printf` 来观察变量值。这个方法有致命缺陷——`printf` 很慢！一次 `printf` 可能需要几百微秒甚至毫秒，在实时控制循环（比如 4WD_Car 的控制周期是 20ms）里频繁 `printf` 会导致控制完全乱掉。

4WD_Car 不用 `printf` 来调试。它用 **VOFA+ 遥测**：把数据打包成 JustFloat 二进制格式通过串口发出去，开销极小。电脑端 VOFA+ 接收后实时渲染成波形图。下一节会详细介绍。

## 小结

Keil5 就是用这三件事撑起整个嵌入式开发：**F7 编译 → F8 烧录 → Ctrl+F5 调试**。不要怕 Keil5 界面上密密麻麻的按钮——你日常用的就这三个快捷键。遇到编译报错先看 Build Output 的第一条错误，通常修好第一条，后面的一串也跟着好了。