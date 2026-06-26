---
title: CubeMX 生成的工程结构拆解
---

# CubeMX 生成的工程结构拆解

## 打开文件夹的那一刻

CubeMX 点击 GENERATE CODE 之后，目标文件夹里会生成一堆文件和子文件夹。如果你是新手，第一反应可能是："这么多文件，我该动哪个？"

本文帮你逐层拆解工程结构，明确告诉你：**哪些是你的地盘，哪些是禁区**。

## 完整的目录树

以下是一个典型 STM32F103 CubeMX 项目生成后的目录结构（省略了一些不太重要的文件）：

```
MyProject/
├── Core/
│   ├── Inc/
│   │   ├── main.h              ← 主头文件
│   │   ├── stm32f1xx_it.h      ← 中断服务函数声明
│   │   └── stm32f1xx_hal_conf.h ← HAL 库配置文件
│   ├── Src/
│   │   ├── main.c              ← ★ 程序入口，你最常编辑的文件
│   │   ├── stm32f1xx_it.c      ← 中断服务函数实现
│   │   ├── system_stm32f1xx.c  ← 系统初始化（时钟设置等）
│   │   └── stm32f1xx_hal_msp.c ← 外设底层初始化（MSP = MCU Support Package）
│   └── Startup/
│       └── startup_stm32f103c8tx.s ← 启动文件（汇编语言写的）
├── Drivers/
│   ├── CMSIS/
│   │   └── ...                 ← ARM Cortex-M 内核标准接口
│   └── STM32F1xx_HAL_Driver/
│       ├── Inc/
│       │   ├── stm32f1xx_hal.h
│       │   ├── stm32f1xx_hal_uart.h
│       │   ├── stm32f1xx_hal_gpio.h
│       │   └── ...             ← 各外设 HAL 库头文件
│       └── Src/
│           ├── stm32f1xx_hal_uart.c
│           ├── stm32f1xx_hal_gpio.c
│           └── ...             ← 各外设 HAL 库源代码
├── .ioc                        ← CubeMX 工程文件（双击重新打开配置界面）
├── MDK-ARM/                    ← Keil5 工程文件夹（含 .uvprojx）
└── Drivers/CMSIS/              ← ARM 内核标准接口（与 ST 无关）
```

## Core/ —— 你的代码王国

`Core/` 目录里是你**可以自由编辑**的文件。CubeMX 每次重新生成代码时，只会修改有特殊标记的区域，不会覆盖你写的代码——前提是你把代码写在了正确的地方。

### Core/Src/main.c —— 最重要的文件

这是整个程序的**入口点**。打开它，你会看到这样的结构：

```c
/* USER CODE BEGIN Header */
// ... 文件头部注释
/* USER CODE END Header */

/* Includes */
#include "main.h"

/* USER CODE BEGIN 0 */
// 这里写你自己的全局变量和函数声明
/* USER CODE END 0 */

int main(void)
{
  /* USER CODE BEGIN 1 */
  // 这里写初始化之前的代码（很少用）
  /* USER CODE END 1 */

  HAL_Init();
  SystemClock_Config();
  MX_GPIO_Init();
  MX_USART1_UART_Init();

  /* USER CODE BEGIN 2 */
  // ★ 这里写你自己的初始化代码！
  // 比如：初始化 LED、发一句"Hello World"
  char msg[] = "System started!\r\n";
  HAL_UART_Transmit(&huart1, (uint8_t*)msg, strlen(msg), 100);
  /* USER CODE END 2 */

  while (1)
  {
    /* USER CODE BEGIN 3 */
    // ★ 这里写你的主循环代码！
    // 程序会一直在这里循环执行
    HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);
    HAL_Delay(500);
    /* USER CODE END 3 */
  }
}
```

注意这些特殊的注释标记：`/* USER CODE BEGIN 0 */` 和 `/* USER CODE END 0 */`。**只有这些标记之间的代码，CubeMX 重新生成时才会保留！**

::: danger 写在标记外面，代码会被覆盖！
如果你把代码写在 `USER CODE BEGIN 2` 和 `USER CODE END 2` 之外，下次用 CubeMX 修改配置并重新生成时，你的代码会被无情地抹掉。这是一个几乎每个新手都犯过的错误。**你的代码只能存在于 USER CODE BEGIN/END 标记之间。**
:::

### Core/Src/stm32f1xx_it.c —— 中断服务函数

单片机在执行主循环时，外设（如串口收到数据、定时器溢出）会发出**中断请求**。CPU 暂停当前的活，跳去执行中断服务函数，处理完再回来继续。

CubeMX 为每个开启中断的外设生成了**空的中断服务函数框架**：

```c
void USART1_IRQHandler(void)
{
  /* USER CODE BEGIN USART1_IRQn 0 */

  /* USER CODE END USART1_IRQn 0 */
  HAL_UART_IRQHandler(&huart1);
  /* USER CODE BEGIN USART1_IRQn 1 */
  // 在这写你自己的中断处理代码
  /* USER CODE END USART1_IRQn 1 */
}
```

`HAL_UART_IRQHandler(&huart1)` 是 HAL 库帮你处理中断底层细节的函数，你不需要修改它。你可以在它之后加上自己的逻辑，比如"收到一帧数据后做个标记"。

### Core/Inc/ —— 头文件

`main.h` 里声明了外设句柄（如 `extern UART_HandleTypeDef huart1;`），你在自己的 `.c` 文件里 `#include "main.h"` 就能使用这些外设。

`stm32f1xx_hal_conf.h` 是 HAL 库的"总开关"——里面通过注释/取消注释来启用或禁用某个外设的 HAL 模块。CubeMX 会根据你的配置自动修改这个文件。

## Drivers/ —— 供应商代码，绝对禁区

`Drivers/` 目录里是**ST 官方的 HAL 库**和 **ARM 官方的 CMSIS 接口**。这些代码经过了大量测试和使用验证，极其稳定。

**原则：永远不要手动修改 Drivers/ 里的任何文件。**

你需要改配置吗？→ 打开 CubeMX，修改配置，重新生成。你需要一个 HAL 函数不知道怎么用吗？→ 打开 STM32 HAL 用户手册或看源码的注释。

修改 `Drivers/` 的后果：
- CubeMX 重新生成时你的修改会被覆盖。
- 改错了可能导致硬件工作异常甚至损坏。
- 你的代码换一台电脑编译可能出错（因为别人用的是原版 HAL 库）。
- 换了新版本的 HAL 库后你的修改可能不兼容。

## .ioc 文件 —— 配置的保存

`.ioc` 文件是 CubeMX 的工程文件。它保存了你在 CubeMX 中对时钟、引脚、外设的所有配置。**双击 `.ioc` 文件就能重新打开 CubeMX 并恢复到上次的配置状态。**

::: tip 习惯性操作
改硬件配置前，先双击 `.ioc` 打开 CubeMX，修改配置，重新 GENERATE CODE。不要手动去改生成的代码来修改硬件配置——那样既麻烦又容易出错。
:::

## 识别规则速查表

| 目录/文件 | 能否修改 | 说明 |
|-----------|---------|------|
| `Core/Src/main.c` | 能（仅标记之间） | 主程序入口和主循环 |
| `Core/Src/stm32f1xx_it.c` | 能（仅标记之间） | 中断服务函数 |
| `Core/Inc/main.h` | 能（仅标记之间） | 主头文件 |
| `Drivers/` 下所有文件 | **绝对不能** | ST 和 ARM 官方代码 |
| `startup_stm32f103c8tx.s` | **绝对不能** | 启动汇编文件 |
| `MDK-ARM/` | Keil5 自己管 | 编译和下载配置 |
| `.ioc` | 用 CubeMX 打开 | 配置文件 |

## 小结

牢记核心规则：**Core/ 是你的地盘，但只在 USER CODE BEGIN/END 之间写字。Drivers/ 是禁区，任何情况都不要手动改。配置变了就打开 CubeMX 重新生成。**

这个分工保证了官网代码和你的个人代码边界清晰，互不干扰。
