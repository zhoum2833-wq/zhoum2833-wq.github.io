---
title: 自定义工程模板 — 以 4WD_Car 为例
---

# 自定义工程模板 — 以 4WD_Car 为例

## 为什么需要自己的模板？

最简单的嵌入式程序可以塞在一个 `main.c` 里。但当你开始写一个"真正的项目"——控制四个电机、读取四个编码器、IMU 姿态解算、摄像头视觉识别、PID 闭环控制、导航状态机——所有代码都倒进 `main.c` 会变成几千行的"意大利面条"。

**一个好的工程结构，让代码各归其位，找什么文件都知道去哪找。**

本文以真实的 **4WD_Car** 四轮小车项目为例，拆解它的工程结构。这个项目目前有 20+ 源文件、10+ BSP 模块、5 个 APP 模块、Python 辅助工具链、机器学习数据集，是一个你在比赛中会遇到的实际规模。

## 完整的目录树

```
4WD_Car/
├── Libraries/                          ← ST 官方 HAL 库 + CMSIS，不要碰
│   ├── CMSIS/                          ← ARM Cortex-M 内核标准接口
│   │   ├── Device/ST/STM32F4xx/        ← startup + system + 头文件
│   │   └── Include/                    ← CMSIS-Core 头文件
│   └── STM32F4xx_HAL_Driver/           ← HAL 驱动（Src + Inc）
├── Project/                            ← Keil5 工程
│   ├── 4WD_Car.uvprojx                 ← ★ 双击打开工程
│   ├── 4WD_Car.uvoptx                  ← 工程选项
│   └── DebugConfig/                    ← 调试器配置
├── User/                               ← ★ 你全部的工作区
│   ├── main.c                          ← 程序入口 + 时钟配置 + 主循环
│   ├── main.h                          ← 公共头文件
│   ├── stm32f4xx_it.c/h                ← 异常处理 + SysTick ISR
│   ├── stm32f4xx_hal_conf.h            ← HAL 模块使能配置
│   ├── system_stm32f4xx.c              ← CMSIS 系统初始化
│   ├── bsp/                            ← BSP 板级支持包（硬件封装层）
│   │   ├── bsp_systick.c/h             ← 自定义时基（TIM2, 1kHz）
│   │   ├── bsp_buzzer_led.c/h          ← 蜂鸣器 + LED
│   │   ├── bsp_motor.c/h               ← 四路电机驱动（TIM3 PWM）
│   │   ├── bsp_encoder.c/h             ← 四路编码器读取
│   │   ├── bsp_uart.c/h                ← 调试串口（USART1）
│   │   ├── bsp_vofa.c/h                ← 无线遥测（USART6, VOFA+）
│   │   ├── bsp_imu.c/h                 ← JY61P 姿态传感器（USART2）
│   │   └── bsp_camera.c/h              ← 摄像头/视觉模块（USART3）
│   └── app/                            ← APP 应用逻辑层（业务逻辑）
│       ├── app_pid.c/h                 ← 四轮独立增量式 PID 速度闭环
│       ├── app_pid_tune.c/h            ← PID 自动调参
│       ├── app_motion.c/h              ← 运动原语（直行/转弯/弧线）
│       ├── app_navigator.c/h           ← 导航状态机 + 位姿估计
│       └── app_explore.c/h             ← 探索导航（场地巡点）
├── tools/                              ← Python 辅助脚本
│   ├── capture_data.py                 ← 采集数字图片数据集
│   ├── train_model.py                  ← 训练 CNN 数字识别模型
│   ├── export_onnx.py                  ← PyTorch 模型 → ONNX 导出
│   └── ...                             ← 更多工具脚本
├── data/                               ← 数据集与模型
│   ├── dataset/                        ← 数字图片（1-4 四类）
│   ├── train/                          ← 训练用 numpy 数据
│   ├── val/                            ← 验证集
│   └── models/                         ← 训练好的模型文件
├── docs/                               ← 项目文档
├── tests/                              ← 单元测试
├── README.md                           ← 项目说明
└── CLAUDE.md                           ← AI 编程的项目说明书
```

一眼看去文件很多，但你的活动范围基本只有 **`User/` 一个目录**。Libraries 是供应商代码不能动，Project 是 Keil5 管的，你写了代码往 Keil5 里加就行。

## 三层架构

4WD_Car 遵循严格的 **3 层架构**，调用层级自上而下，**禁止越级**：

```
main.c (入口 + 时钟 + 主循环)
  └─ APP 层 (User/app/)         ← 业务逻辑，只调 BSP，不碰 HAL
      └─ BSP 层 (User/bsp/)     ← 板级支持，自管 RCC/GPIO/外设/NVIC
```

::: tip 一句话记住三层分工
**BSP 层管硬件怎么动，APP 层管什么时候动，main.c 管整体调度。**
:::

**三条铁律**：
1. **APP 层不碰 HAL**：只 `#include` BSP 头文件，不直接操作寄存器或 HAL 函数
2. **BSP 模块自治**：每个 BSP 模块的 `Init()` 自行完成 RCC/GPIO/外设/NVIC 全部初始化
3. **不越级调用**：APP 不直接调 HAL，更不直接写寄存器

## BSP 层详解

BSP（Board Support Package，板级支持包）是对**硬件外设**的封装。每一个 `.c` / `.h` 配对对应一个硬件模块。

为什么要分成一个个独立的模块？

- **职责清晰**：电机有 bug？打开 `bsp_motor.c`，不用在一万行里搜索 `motor`
- **可复用**：下次做新项目，直接把 `bsp_uart.c` 复制过去就能用
- **方便协作**：队友负责电机（`bsp_motor.c`），你负责 IMU（`bsp_imu.c`），互不冲突
- **方便 AI 理解**：每个文件职责单一，AI 读一个模块就能理解所有相关代码

### BSP 模块标准模板

每个 BSP 模块有一套固定格式。以 `bsp_motor.h` 为例——这是 4WD_Car 中真实存在的电机驱动模块：

```c
// bsp_motor.h
#ifndef __BSP_MOTOR_H
#define __BSP_MOTOR_H

#include "main.h"

/* ===== 引脚宏定义 ===== */
// TB6612 #1 左侧 — A (左后) + B (左前)
#define AIN1_Pin        GPIO_PIN_0
#define AIN1_GPIO_Port  GPIOC

// PWM — TIM3 四通道
#define PWMA_Pin        GPIO_PIN_0       // PB0, TIM3_CH3, A(左后)
#define PWMA_GPIO_Port  GPIOB

/* ===== extern 外设句柄 ===== */
extern TIM_HandleTypeDef htim3;

/* ===== API 声明 ===== */
void BSP_MOTOR_Init(void);
void BSP_MOTOR_SetSpeed(int16_t mot_a, int16_t mot_b,
                        int16_t mot_c, int16_t mot_d);
void BSP_MOTOR_Stop(void);
void BSP_MOTOR_Brake(void);

#endif
```

模块的 `.c` 文件则完成"怎么干"——BSP 模块编写规范：

- **`Init()` 自治**：在 Init 中自行完成 RCC 时钟使能、GPIO 配置、外设配置、NVIC 中断配置
- **命名统一**：初始化函数 `BSP_XXX_Init()`、外设句柄 `hxxx`（如 `htim3`、`huart6`）
- **ISR 归属**：哪个模块用到的中断，ISR 就写在该模块的 `.c` 里。比如定时器中断在 `bsp_systick.c`，串口中断在各自的 `bsp_xxx.c`

### 4WD_Car 的 BSP 模块一览

| 模块 | 文件 | 功能 |
|------|------|------|
| Systick | `bsp_systick.c/h` | 自定义 1kHz 时基（TIM2），`g_sysTick` 供全工程使用 |
| LED/Buzzer | `bsp_buzzer_led.c/h` | LED 指示 + 蜂鸣器提示音 |
| Motor | `bsp_motor.c/h` | 四路电机 PWM 驱动（2×TB6612, TIM3） |
| Encoder | `bsp_encoder.c/h` | 四路编码器速度反馈（TIM + EXTI） |
| UART | `bsp_uart.c/h` | USART1 调试串口 |
| VOFA | `bsp_vofa.c/h` | USART6 无线遥测（JustFloat + 文本格式） |
| IMU | `bsp_imu.c/h` | JY61P 姿态传感器（USART2，解算欧拉角） |
| Camera | `bsp_camera.c/h` | 视觉模块通信（USART3，巡线 + 数字识别） |

每个模块的文件都很短——大多数 100-300 行。短文件 = 好看懂 + 好改 + AI 好理解。

## APP 层详解

APP 层**不直接操作硬件**，它只调用 BSP 层提供的函数来实现业务逻辑。

以 `app_pid.h` 为例——这是四轮独立 PID 速度闭环控制模块：

```c
// app_pid.h
#ifndef __APP_PID_H
#define __APP_PID_H

#include "main.h"

/* PID 参数 */
typedef struct {
    float Kp;
    float Ki;
    float Kd;
    int32_t integral_limit;
    int16_t output_max;
} PID_Param_t;

/* PID 单路状态 */
typedef struct {
    PID_Param_t param;
    int32_t     target;        // 目标速度
    int32_t     actual;        // 实际速度（反馈）
    int32_t     error;         // 当前误差
    int32_t     last_error;    // 上次误差
    int32_t     integral;      // 积分累加
    int16_t     output;        // PWM 输出
    int32_t     last_enc;      // 上次编码器值
} PID_Ch_t;

/* API */
void APP_PID_Init(void);
void APP_PID_Update(void);                    // 每控制周期调用一次
void APP_PID_SetTarget(int32_t a, int32_t b,
                       int32_t c, int32_t d);  // 设置四轮目标速度
void APP_PID_GetSpeed(int32_t *a, int32_t *b,
                      int32_t *c, int32_t *d); // 读取当前速度

#endif
```

注意 `app_pid.h` 里没有出现任何 GPIO、TIM、UART 之类的硬件概念。它只关心"目标速度"和"实际速度"——这些速度从哪来的？`APP_PID_Update()` 内部调用了 `bsp_encoder` 获取实际速度、调用了 `bsp_motor` 输出 PWM。但 APP 层调用者不需要知道这些细节。

### 调用层级图

```
main.c
  ├── app_explore       ← 探索导航（状态机）
  │   └── app_navigator ← 室内导航
  │       └── app_motion ← 运动原语（直行/转弯/弧线）
  │           └── app_pid ← 四轮 PID 速度闭环
  │               ├── bsp_motor     ← PWM 输出
  │               └── bsp_encoder   ← 速度反馈
  └── 直接 BSP:
      ├── bsp_systick    ← 全局时基
      ├── bsp_buzzer_led ← 状态指示
      ├── bsp_vofa       ← 无线遥测
      ├── bsp_imu        ← 姿态数据
      └── bsp_camera     ← 视觉数据
```

数据自下而上流动：硬件 → BSP → APP → main 决策 → APP → BSP → 硬件。

## main.c 应该很"瘦"

有了 BSP 和 APP 两层封装后，`main.c` 只负责"总调度"：

```c
int main(void)
{
    /* 1. 系统初始化 */
    HAL_Init();
    SystemClock_Config();

    /* 2. BSP 初始化（注意顺序！） */
    BSP_BUZZER_LED_Init();    // LED 可最早
    BSP_VOFA_Init();          // 调试输出尽早
    BSP_IMU_Init();           // 传感器
    BSP_MOTOR_Init();         // 电机
    BSP_ENCODER_Init();       // 编码器（依赖定时器）
    BSP_CAMERA_Init();        // 摄像头

    /* 3. APP 初始化 */
    APP_PID_Init();
    MOTION_Init();
    EXPLORE_Init();

    /* 4. 主循环 */
    while (1) {
        EXPLORE_Update();     // 导航状态机
        MOTION_Update();      // 速度规划
        APP_PID_Update();     // PID 闭环
        // ... 遥测发送 ...
        HAL_Delay(20);        // 20ms 控制周期
    }
}
```

::: tip 初始化顺序有讲究
**依赖关系决定初始化顺序**。时基（Systick）必须最早，调试输出（UART/VOFA）尽早，然后传感器 → 执行器 → APP 层。时序乱了会导致外设不工作或跑飞。
:::

## 不只是 C 代码

4WD_Car 项目里除了嵌入式 C 代码，还有：

### tools/ — Python 辅助脚本

有些活不适合在单片机上做，用 Python 高效得多：

| 脚本 | 用途 |
|------|------|
| `capture_data.py` | 从 Maxicam 摄像头采集数字 1-4 的图片 |
| `train_model.py` | 用 PyTorch 训练 CNN 数字识别模型 |
| `export_onnx.py` | 把 PyTorch 模型导出为 ONNX 格式 |
| `generate_data.py` | 程序化生成训练数据 |
| `label_data.py` | 手工标注采集的数据 |

### data/ — 数据集与模型

`data/dataset/` 里有 4 个子文件夹（1/2/3/4），每个放对应的数字图片。`data/models/` 里是训练后导出的 `.maixcam` 模型文件，烧录到 Maxicam Pro 视觉模块上运行。

### 文档

每个项目至少要维护两个文档：
- **`README.md`**：项目概述、硬件信息、快速开始、引脚分配表
- **`CLAUDE.md`**：给 AI 看的项目说明书——架构、代码风格、命名规范、注意事项。写好了 CLAUDE.md，AI 就能像一个熟悉项目的队友一样跟你协作

## 引脚分配表

4WD_Car 项目维护了一张清晰的引脚映射表：

| 功能 | 引脚 | 外设 | AF |
|------|------|------|-----|
| LED | PA8 | GPIO | — |
| Buzzer | PC5 | GPIO | — |
| Motor PWM A/B/C/D | PA6/PA7/PB0/PB1 | TIM3 CH1-4 | AF2 |
| Motor Dir | PB12-15, PC0-3 | GPIO | — |
| Encoder E1 | PA0/PA1 | TIM5 | AF2 |
| Encoder E2 | PB8/PB9 | EXTI | — |
| Encoder E3 | PD12/PD13 | TIM4 | AF2 |
| Encoder E4 | PA8/PE11 | TIM1 | AF2 |
| UART1 (调试) | PA9/PA10 | USART1 | AF7 |
| IMU (JY61P) | PA2/PA3 | USART2 | AF7 |
| Camera | PB10/PB11 | USART3 | AF7 |
| VOFA (无线) | PC6/PC7 | USART6 | AF7 |
| SWD (调试) | PA13/PA14 | — | — |

这张表极其有用——改硬件接线时不需要翻遍每个 BSP 文件找引脚定义，一眼看清全貌。

## 小结

一个好的工程结构 = 代码各归其位 = 少出 bug + 好找问题 + 方便协作 + AI 友好。记住三层分工：**BSP 封装硬件，APP 组织逻辑，main 总调度。** 不要把所有东西都倒在 main.c 里。