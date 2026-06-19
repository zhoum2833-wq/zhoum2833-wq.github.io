---
title: 模块化 — 一个外设一个模块
---

# 模块化 — 一个外设一个模块

模块化编程就是把程序拆成独立的"零件"。每个零件（模块）只负责一件事，有自己的 `.c`（实现）和 `.h`（接口）文件。就像乐高积木——你不需要知道每块积木怎么造出来的，你只需要知道怎么把它们拼在一起。

## 为什么需要模块化

假设你把所有代码都写在 `main.c` 里——2000 行，什么都有。三个月后你想修改 LED 的控制逻辑，你翻到第 563 行，修改了一处，但漏了第 1208 行的另一处。Bug 诞生。

模块化的解决方案：所有 LED 相关的代码都在 `bsp_led.c` 里。想改 LED？打开这个文件就够了。想用 LED？`#include "bsp_led.h"` 就行，其他代码完全不动。

```c
// main.c —— 使用 LED 模块，简洁明了
#include "bsp_led.h"

int main(void) {
    BSP_LED_Init();                    // 初始化所有 LED
    BSP_LED_On(BSP_LED_RED);           // 点亮红色 LED
    HAL_Delay(500);
    BSP_LED_Off(BSP_LED_RED);          // 熄灭红色 LED
}
```

## 一个文件对 = 一个功能

```
项目文件结构：
bsp/
├── bsp_led.h          LED 模块的接口（声明）
├── bsp_led.c          LED 模块的实现（代码）
├── bsp_motor.h        电机模块的接口
├── bsp_motor.c        电机模块的实现
├── bsp_encoder.h      编码器模块的接口
└── bsp_encoder.c      编码器模块的实现
```

每个模块的 `.h` 文件就是它的**说明书**——告诉外面的人"我能做什么"。`.c` 文件是**内部构造**——怎么做的不需要外面的人知道。

## 实战示例：LED 模块

先看头文件——对外接口：

```c
// bsp_led.h —— 接口声明
#ifndef __BSP_LED_H__
#define __BSP_LED_H__

#include "stm32f1xx_hal.h"

// 定义 LED 编号（枚举让代码可读）
typedef enum {
    BSP_LED_RED = 0,
    BSP_LED_GREEN,
    BSP_LED_BLUE,
    BSP_LED_COUNT    // LED 总数
} BSP_LED_Type;

// 公开函数 —— 外面只能调这些
void BSP_LED_Init(void);
void BSP_LED_On(BSP_LED_Type led);
void BSP_LED_Off(BSP_LED_Type led);
void BSP_LED_Toggle(BSP_LED_Type led);

#endif
```

再看 `.c` 文件——内部实现：

```c
// bsp_led.c —— 实现
#include "bsp_led.h"

// 静态数组：存每个 LED 对应的 GPIO 口和引脚（外部看不到！）
static struct {
    GPIO_TypeDef *port;
    uint16_t pin;
} led_table[BSP_LED_COUNT] = {
    {GPIOC, GPIO_PIN_13},  // 红色 LED → PC13
    {GPIOC, GPIO_PIN_14},  // 绿色 LED → PC14
    {GPIOC, GPIO_PIN_15},  // 蓝色 LED → PC15
};

void BSP_LED_Init(void) {
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    __HAL_RCC_GPIOC_CLK_ENABLE();

    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;

    for (int i = 0; i < BSP_LED_COUNT; i++) {
        GPIO_InitStruct.Pin = led_table[i].pin;
        HAL_GPIO_Init(led_table[i].port, &GPIO_InitStruct);
    }

    // 初始化后全部熄灭
    for (int i = 0; i < BSP_LED_COUNT; i++) {
        BSP_LED_Off(i);
    }
}

void BSP_LED_On(BSP_LED_Type led) {
    HAL_GPIO_WritePin(led_table[led].port, led_table[led].pin, GPIO_PIN_RESET);
}

void BSP_LED_Off(BSP_LED_Type led) {
    HAL_GPIO_WritePin(led_table[led].port, led_table[led].pin, GPIO_PIN_SET);
}

void BSP_LED_Toggle(BSP_LED_Type led) {
    HAL_GPIO_TogglePin(led_table[led].port, led_table[led].pin);
}
```

::: tip
**`static` 关键字的作用**：上面的 `led_table` 数组用 `static` 修饰，意味着它只在 `bsp_led.c` 内部可见，外部代码无法访问。这叫**封装**——把实现细节藏起来，只暴露安全的接口。
:::

## 好的模块长什么样

| 特征 | 好 | 不好 |
|------|-----|------|
| 接口函数 | 3~10 个，职责明确 | 几十个，什么都往外面扔 |
| 依赖 | 只依赖 HAL 库 | 依赖其他业务模块 |
| 命名 | `bsp_led_init()` 一看就懂 | `init1()` 不知道初始化什么 |
| 文件大小 | 100~300 行 | 1000+ 行 |
| 头文件保护 | 有 `#ifndef` 防护 | 没有，重复包含报错 |
| 内部变量 | `static` 隐藏 | 全局变量满天飞 |

## 竞赛小车项目的模块划分

一个好用的模块结构：

```
bsp/                    ← 硬件抽象层
├── bsp_led.c/h         LED
├── bsp_motor.c/h       电机（PWM + 方向引脚）
├── bsp_encoder.c/h     编码器（速度反馈）
├── bsp_ir.c/h          红外巡线传感器
├── bsp_uart.c/h        串口通信
├── bsp_imu.c/h         姿态传感器
└── bsp_buzzer.c/h      蜂鸣器

app/                    ← 应用层（下一章讲）
├── app_chassis.c/h     底盘控制
├── app_line_follow.c/h 巡线算法
└── app_balance.c/h     平衡控制
```

## 接口设计原则

一个好的模块接口应该让使用者**不需要看 .c 文件**就能用。看几个例子：

```c
// 好的接口：语义清晰
void BSP_Motor_SetSpeed(uint8_t motor_id, int16_t speed);
// "给 motor_id 这个电机设 speed 这个速度" —— 一句话说清楚

// 不好的接口：内部细节暴露
void BSP_Motor_Set_TIM3_CCR2(uint16_t value);
// 使用者需要知道用了定时器 3 的通道 2 —— 这是内部实现！
// 换个电机引脚就要改所有调用者的代码
```

典型的模块生命周期：

```
Init()         使用前调用一次，配置硬件
  │
  ▼
SetXXX()       运行中反复调用，控制硬件行为
ReadXXX()      运行中反复调用，读取硬件状态
  │
  ▼
Stop()         必要时停止，安全关闭
```

::: warning
**避免模块间的交叉依赖**。`bsp_motor.c` 不应该 `#include "bsp_led.h"`。如果电机模块需要指示状态，让它返回状态值，由上一层的代码决定要不要亮 LED。保持 BSP 模块之间的独立性。
:::

## 小结

模块化编程的核心思想：**一个文件对负责一个功能，对外提供清晰的接口，对内隐藏实现细节**。使用模块的人只管"调用什么函数能达到什么效果"，不用管"函数里面怎么写"。好的模块化是大型项目不被自身复杂度压垮的唯一秘诀。
