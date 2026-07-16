---
title: 自定义工程模板结构
---

# 自定义工程模板结构

## 为什么需要自己的模板？

CubeMX 生成的工程结构适合"裸机学习"——一个 `main.c` 从头写到尾。但到了比赛阶段，你的程序会越来越复杂：控制电机、读取传感器、无线通信、显示数据……所有代码都塞在 `main.c` 里会变成几千行的"意大利面条"，改一个参数要翻半天。

**一个好的工程结构，让代码各归其位，找什么文件都知道去哪找。**

本文推荐的工程结构基于真实的 2WD 小车项目整理而成，遵循"关注点分离"原则。

## 推荐的工程结构

```
2WD_Car/
├── Libraries/              ← 供应商库文件（CMSIS + HAL），不要碰
│   ├── CMSIS/
│   └── STM32F1xx_HAL_Driver/
├── User/                   ← ★ 你的代码都在这里
│   ├── main.c              ← 程序入口
│   ├── main.h
│   ├── bsp/                ← 板级支持包，每个硬件模块一个 .c/.h
│   │   ├── bsp_led.c       ← LED 控制
│   │   ├── bsp_led.h
│   │   ├── bsp_motor.c     ← 电机控制
│   │   ├── bsp_motor.h
│   │   ├── bsp_uart.c      ← UART 通信
│   │   ├── bsp_uart.h
│   │   ├── bsp_encoder.c   ← 编码器读取
│   │   ├── bsp_encoder.h
│   │   ├── bsp_oled.c      ← OLED 显示
│   │   └── bsp_oled.h
│   └── app/                ← 应用层逻辑
│       ├── app_chassis.c   ← 底盘控制算法
│       ├── app_chassis.h
│       ├── app_remote.c    ← 遥控指令处理
│       └── app_remote.h
├── Doc/                    ← 文档资料
│   ├── pinmap.md           ← 引脚分配表
│   ├── protocol.md         ← 通信协议说明
│   └── buglog.md           ← 调试记录（踩坑笔记）
├── scripts/                ← Python 等辅助脚本
│   ├── data_parser.py      ← 串口数据解析
│   └── plot_telemetry.py   ← 遥测数据绘图
├── MDK-ARM/                ← Keil5 工程文件
│   └── Project.uvprojx     ← 双击打开 Keil5
├── .vscode/                ← VS Code 配置（AI 编程用）
├── .clang-format           ← 代码格式化规则
└── README.md               ← 项目说明
```

## 各目录的职责

### User/ —— 你全部的工作区

`User/` 是整个工程中**唯一由你编写和维护**的目录。它下面又分两层：

#### bsp/ —— 板级支持包（Board Support Package）

BSP 层是对**硬件外设**的封装。每一个 `.c` / `.h` 匹配对对应一个硬件模块。

为什么要分成一个个独立的模块？

- **职责清晰**：想改 LED 的行为，打开 `bsp_led.c`——不用在一万行里搜索 `LED`。
- **可复用**：下次做新项目，直接把 `bsp_uart.c` 复制过去就能用。
- **方便协作**：队友负责电机 (`bsp_motor.c`)，你负责通信 (`bsp_uart.c`)，互不冲突。

一个典型的 BSP 模块对长这样：

**bsp_led.h**（头文件——声明"这个模块能干什么"）：
```c
#ifndef __BSP_LED_H__
#define __BSP_LED_H__

#include "main.h"

void BSP_LED_Init(void);           // 初始化 LED 对应的 GPIO
void BSP_LED_On(void);             // 点亮 LED
void BSP_LED_Off(void);            // 熄灭 LED
void BSP_LED_Toggle(void);         // 翻转 LED 状态

#endif
```

**bsp_led.c**（源文件——实现"怎么干"）：
```c
#include "bsp_led.h"

void BSP_LED_Init(void)
{
    // 假设 LED 接在 PC13
    // 注意：GPIO 的初始化通常在 CubeMX 里完成
    // 这里可以加一些额外的初始化逻辑
}

void BSP_LED_On(void)
{
    HAL_GPIO_WritePin(GPIOC, GPIO_PIN_13, GPIO_PIN_RESET);
    // 假设低电平点亮 LED（取决于电路设计）
}

void BSP_LED_Off(void)
{
    HAL_GPIO_WritePin(GPIOC, GPIO_PIN_13, GPIO_PIN_SET);
}

void BSP_LED_Toggle(void)
{
    HAL_GPIO_TogglePin(GPIOC, GPIO_PIN_13);
}
```

::: tip 命名规范：统一前缀
注意所有函数都以 `BSP_LED_` 开头。这样做的好处是当你在其他地方写 `BSP_LED_`，编辑器的自动补全会列出这个模块的所有函数，你不需要记住具体函数名。
:::

#### app/ —— 应用层逻辑

`app/` 层不直接操作硬件，而是调用 `bsp/` 层提供的函数来实现业务逻辑。

比如底盘控制模块 `app_chassis.c`：

```c
#include "app_chassis.h"
#include "bsp_motor.h"
#include "bsp_encoder.h"

void APP_Chassis_MoveForward(uint16_t speed)
{
    BSP_Motor_Left_SetSpeed(speed);
    BSP_Motor_Right_SetSpeed(speed);
}

void APP_Chassis_Stop(void)
{
    BSP_Motor_Left_SetSpeed(0);
    BSP_Motor_Right_SetSpeed(0);
}
```

注意 `app_chassis.c` 没有直接操作 GPIO 或定时器寄存器，它调用的都是 BSP 层提供的函数。这种分层让代码更容易理解和修改。

### Doc/ —— 不要靠脑子记

很多新手把所有信息都记在脑子里，觉得"写文档太麻烦"。结果一个星期后回来看自己的代码："这个引脚接的什么来着？"

至少维护以下三个文档：

- **pinmap.md**：一张表，列出每个 MCU 引脚接了什么。格式很简单：
  ```
  | 引脚 | 功能 | 连接设备 |
  |------|------|----------|
  | PA0  | TIM2_CH1 | 左电机编码器 A 相 |
  | PA1  | TIM2_CH2 | 左电机编码器 B 相 |
  | PA2  | USART2_TX | HC-05 蓝牙模块 RX |
  | PA3  | USART2_RX | HC-05 蓝牙模块 TX |
  ```
- **protocol.md**：如果你定了通信协议（比如蓝牙发什么指令控制小车），写下来。
- **buglog.md**：调试时记录每个诡异问题的现象、原因和解决方法——下次遇到同样的问题不用再查一次。

### scripts/ —— 辅助工具

比赛时你可能需要批量处理数据、画波形图、自动化测试等。这些活用 Python 写个小脚本比在 C 代码里实现方便得多。把这些脚本放在 `scripts/` 目录下统一管理。

### Project/ —— 工程配置

这里放 Keil5 的 `.uvprojx` 工程文件、VS Code 的 `.vscode/` 配置目录等。

## main.c 应该很"瘦"

遵循上面的结构之后，你的 `main.c` 会变得非常干净：

```c
#include "main.h"
#include "bsp_led.h"
#include "bsp_uart.h"
#include "bsp_motor.h"
#include "app_chassis.h"
#include "app_remote.h"

int main(void)
{
    HAL_Init();
    SystemClock_Config();
    MX_GPIO_Init();
    MX_USART1_UART_Init();
    MX_TIM2_Init();  // 电机 PWM

    BSP_LED_Init();
    BSP_Motor_Init();
    APP_Chassis_Init();

    char msg[] = "Car initialized!\r\n";
    BSP_UART_Send((uint8_t*)msg, strlen(msg));

    while (1)
    {
        APP_Remote_Process();    // 处理遥控指令
        APP_Chassis_Update();    // 更新底盘状态
        HAL_Delay(10);           // 10ms 控制周期
    }
}
```

所有细节都封装在对应的模块里，`main.c` 只负责"总调度"。

## 小结

一个良好的工程结构 = 代码各归其位 = 少出 bug + 好找问题 + 方便协作。三个词：**BSP 封装硬件，App 组织逻辑，Doc 记录知识。** 不要把所有东西都倒在 main.c 里。

---
# 第四篇：通信协议

<!-- @chapter: 第四篇：通信协议 -->