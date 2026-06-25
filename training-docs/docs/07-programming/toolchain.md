---
title: 编译链 — 从 .c 到 .hex
---

# 编译链 — 从 .c 到 .hex

你写了一个 `main.c`，按一下 `make all`，几秒钟后生成了 `firmware.hex`，烧进单片机就能跑了。这中间发生了很多事情。理解这个过程不是必需，但当你遇到编译错误时，知道每个环节在做什么会帮助你快速定位问题。

## 编译的四步舞

把 .c 源文件变成 .hex 固件文件，就像把小麦变成面包——需要经过好几道工序。

### 第一步：预处理（Preprocessor）

预处理器处理所有以 `#` 开头的指令。它做的事情非常机械：

- `#include "bsp_uart.h"` → 把这个头文件的**全部内容**复制粘贴到这里
- `#define LED_PIN 13` → 把代码里所有 `LED_PIN` 替换成 `13`
- `#ifdef DEBUG ... #endif` → 根据条件保留或删除代码段

```c
// 你写的代码
#include "bsp_led.h"
#define DELAY 500

// 预处理后（概念上的结果）
// ... bsp_led.h 的所有内容被粘贴在这里 ...
// 代码中所有 DELAY 被替换为 500
```

### 第二步：编译（Compiler）

编译器 `arm-none-eabi-gcc` 把 C 语言翻译成机器能看懂的指令。这个过程又分两步：

1. **C → 汇编语言**：把 C 语句翻译成人类勉强可读的机器指令助记符
2. **汇编 → 目标代码**：把汇编翻译成纯二进制指令，生成 `.o` 文件（目标文件）

```bash
# 你可以手动执行单步编译
arm-none-eabi-gcc -c main.c -o main.o    # 编译但不链接
```

`.o` 文件里已经是机器码了，但它还不能直接运行——因为 `printf` 等外部函数的地址还不知道。

### 第三步：链接（Linker）

链接器把所有的 `.o` 文件和库文件（如 `libc.a`）合并成一个完整的可执行文件 `.elf`：

- 把 main.o、bsp_uart.o、startup.o……拼在一起
- 解决符号引用（`printf` 实际在库文件的哪个位置？）
- 给每个函数和变量分配最终的内存地址

### 第四步：格式转换（objcopy）

`.elf` 文件包含调试信息、符号表等"附加物"，体积很大。`arm-none-eabi-objcopy` 把它精简成纯机器码的 `.hex` 文件（Intel HEX 格式），这才是烧录到单片机 Flash 里的东西。

```
.c → 预处理 → .i → 编译 → .s → 汇编 → .o → 链接 → .elf → objcopy → .hex → 烧录
```

## 什么是交叉编译？

你写代码用的电脑是 x86 架构（Intel/AMD CPU），而单片机是 ARM Cortex-M 架构。这两者的机器指令**完全不同**。交叉编译就是在 x86 电脑上编译出 ARM 能运行的代码——就像在中文键盘上打英文，键盘和输出的文字属于两套系统。

`arm-none-eabi-gcc` 这个名字本身就说明了这一点：
- `arm` = 目标架构是 ARM
- `none` = 裸机（没有操作系统）
- `eabi` = 嵌入式应用二进制接口

## 常见编译错误

| 错误信息 | 翻译 | 怎么修 |
|----------|------|--------|
| `undefined reference to 'Foo'` | 链接器找不到函数 Foo | 检查是否正确 include 了头文件，或者 .c 文件有没有加入编译 |
| `No such file or directory` | 预处理器的 include 路径不对 | 检查 Makefile 中的 `-I` 路径或 `#include` 中的路径 |
| `expected ';' before '}'` | 少写了分号 | 找到报错的那一行，上一行末尾加分号 |
| `implicit declaration of function` | 函数没有声明就使用了 | 加上 `#include` 对应的头文件 |
| `multiple definition of 'X'` | 变量 X 被重复定义了 | 头文件里定义了变量但没有用 `extern`，或者全局变量定义出现在多个 .c 文件中 |

## Makefile 做了什么

初学者不需要手写 Makefile。你只需要知道：

```bash
make all      # 编译整个项目
make clean    # 删除所有编译产物，下次重新编译
make flash    # 编译并烧录到单片机
```

::: tip 这就是全部
对于入门阶段，"make all 能跑就行"是完全正确的心态。当你的项目变复杂、需要添加新的 .c 文件时，才需要修改 Makefile。在那之前，把这四个步骤当作一个黑盒子。
:::

::: warning
改完代码记得重新 `make all`！很多人盯着终端看了半天，发现没变化——因为编译的是旧代码，新代码根本没被编译。
:::

## 小结

编译链把 .c 变成 .hex 经历了四个阶段：预处理（展开宏和头文件）→ 编译（.c→汇编）→ 汇编（.s→.o）→ 链接（.o→.elf→.hex）。你不需要手写每一步——CubeMX + Makefile 已经自动化了——但理解每个阶段的产物，能帮你在编译报错时快速定位问题。