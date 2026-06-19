---
title: 分层 — BSP 层 vs App 层
---

# 分层 — BSP 层 vs App 层

上一章讲了模块化（水平拆分），这一章讲分层（垂直拆分）。模块化回答"这个功能归哪个文件管"，分层回答"谁可以指挥谁"。

## 为什么分层

想象一个没有分层的小车程序：

```c
// main.c —— 所有逻辑混在一起
while (1) {
    // 直接操作寄存器控制电机
    TIM3->CCR2 = 500;   // 左电机占空比
    TIM3->CCR1 = 480;   // 右电机占空比

    // 直接读 GPIO 判断按键
    if ((GPIOB->IDR & GPIO_PIN_0) == 0) {
        TIM3->CCR2 = 0;
        TIM3->CCR1 = 0;
    }
}
```

这段代码的问题是：**业务逻辑和硬件操作搅在一起**。"让车以 30cm/s 前进"是这个程序的目的（业务逻辑），但代码里写的是"往定时器 3 的 CCR2 寄存器写 500"（硬件操作）。两者绑定在一起——换了 MCU 型号、换了电机驱动板，全部代码都要重写。

## 分层的解决方案

把代码分成两层：

```
┌──────────────────────────────────────┐
│  App 层（Application / 应用层）       │
│  业务逻辑，完全不碰硬件寄存器          │
│  例如：car_go_forward(30);           │
│        emergency_stop();             │
├──────────────────────────────────────┤
│  BSP 层（Board Support Package）     │
│  硬件驱动，直接操作寄存器              │
│  例如：TIM3->CCR2 = pwm_value;       │
│        GPIOB->BSRR = GPIO_PIN_0;     │
├──────────────────────────────────────┤
│  HAL 层（厂商库）                     │
│  STM32 HAL / MSPM0 DriverLib        │
│  例如：HAL_GPIO_WritePin(...)        │
├──────────────────────────────────────┤
│  硬件（寄存器、引脚、总线）            │
└──────────────────────────────────────┘
```

**核心规则**：上层可以调用下层，下层**绝不**调用上层。App 调 BSP，BSP 调 HAL。反过来不行。

## 实物代码对比

### BSP 层 — 操作硬件

```c
// bsp_motor.c —— BSP 层：知道电机用了哪个定时器、哪个通道
#include "bsp_motor.h"

// 这些是硬件细节，藏在 BSP 层内部
#define LEFT_MOTOR_TIM      (&htim3)
#define LEFT_MOTOR_CHANNEL  TIM_CHANNEL_2
#define RIGHT_MOTOR_TIM     (&htim3)
#define RIGHT_MOTOR_CHANNEL TIM_CHANNEL_1

void BSP_Motor_SetSpeed(uint8_t motor_id, int16_t speed) {
    // 把速度值（-1000~1000）映射到 PWM 比较值
    uint16_t pwm_value = __HAL_ABS(speed);
    if (motor_id == MOTOR_LEFT) {
        __HAL_TIM_SET_COMPARE(LEFT_MOTOR_TIM, LEFT_MOTOR_CHANNEL, pwm_value);
        // 设置方向引脚
        HAL_GPIO_WritePin(GPIOB, GPIO_PIN_12,
            speed >= 0 ? GPIO_PIN_RESET : GPIO_PIN_SET);
    } else if (motor_id == MOTOR_RIGHT) {
        __HAL_TIM_SET_COMPARE(RIGHT_MOTOR_TIM, RIGHT_MOTOR_CHANNEL, pwm_value);
        HAL_GPIO_WritePin(GPIOB, GPIO_PIN_13,
            speed >= 0 ? GPIO_PIN_RESET : GPIO_PIN_SET);
    }
}
```

`BSP_Motor_SetSpeed()` 的调用者不需要知道电机用了 `TIM3`、引脚是 `PB12/PB13`。它只需要说"左电机，速度 500"。

### App 层 — 表达意图

```c
// app_chassis.c —— App 层：只描述"车该干什么"，不描述"怎么干"
#include "bsp_motor.h"
#include "bsp_encoder.h"

// 让车以指定速度前进
void App_Chassis_Move(int16_t left_speed, int16_t right_speed) {
    BSP_Motor_SetSpeed(MOTOR_LEFT, left_speed);
    BSP_Motor_SetSpeed(MOTOR_RIGHT, right_speed);
}

// 让车走直线（基于编码器闭环）
void App_Chassis_GoStraight(int16_t target_speed, uint32_t duration_ms) {
    uint32_t start = HAL_GetTick();

    while (HAL_GetTick() - start < duration_ms) {
        // 读编码器获取实际速度
        int16_t actual_left = BSP_Encoder_GetSpeed(ENCODER_LEFT);
        int16_t actual_right = BSP_Encoder_GetSpeed(ENCODER_RIGHT);

        // 简单的 PI 校正（App 层的逻辑）
        int16_t left_out = target_speed + (target_speed - actual_left) * 2;
        int16_t right_out = target_speed + (target_speed - actual_right) * 2;

        // 调用 BSP 层输出
        App_Chassis_Move(left_out, right_out);
        HAL_Delay(5);
    }

    // 时间到，停车
    App_Chassis_Move(0, 0);
}
```

观察 `App_Chassis_GoStraight`：它用了 `BSP_Motor_SetSpeed` 和 `BSP_Encoder_GetSpeed`，但丝毫不涉及定时器编号、引脚号、PWM 通道。它表达的是**意图**（"直走 30cm/s，持续 2 秒"），而不是**操作**（"往 CCR2 写 600"）。

## 分层带来的好处

| 好处 | 说明 |
|------|------|
| 换 MCU 只需重写 BSP | 从 STM32F103 换成 MSPM0G3507，App 层一行不改，只重写 BSP 层 |
| 换电机驱动板只需改一个文件 | 驱动板换了，只改 `bsp_motor.c`，所有调用者不受影响 |
| 更容易调试 | 怀疑电机驱动有问题？只查 `bsp_motor.c` 就够了 |
| 更容易分工 | 一个人写 BSP 层（懂硬件），一个人写 App 层（懂算法） |
| 代码可复用 | `app_chassis.c` 可以几乎原样搬到下一个项目 |

## 你项目的真实结构

查看 2WD_Car 项目，你会发现它已经有了这个分层：

```
2WD_Car/
├── bsp/                    ← BSP 层
│   ├── bsp_motor.c/h       电机驱动
│   ├── bsp_encoder.c/h     编码器读数
│   ├── bsp_ir.c/h          红外传感器
│   ├── bsp_uart.c/h        串口通信
│   └── bsp_imu.c/h         姿态传感器
│
├── app/                    ← App 层
│   ├── app_chassis.c/h     底盘运动控制
│   ├── app_line_follow.c/h 巡线逻辑
│   └── app_balance.c/h     平衡控制
│
└── main.c                  ← 入口：初始化 BSP 和 App，然后启动
```

`main.c` 的角色是**组装**——它初始化所有模块，创建任务（如果用 RTOS），然后放手让模块自己运行：

```c
int main(void) {
    HAL_Init();
    SystemClock_Config();

    // 初始化 BSP 层
    BSP_LED_Init();
    BSP_Motor_Init();
    BSP_Encoder_Init();
    BSP_IR_Init();
    BSP_UART_Init();

    // 初始化 App 层
    App_Chassis_Init();
    App_LineFollow_Init();

    // 开始运行
    while (1) {
        App_LineFollow_Run();   // App 层不碰寄存器
    }
}
```

## 调用链示意图

```
main()
  │
  ├──▶ App_LineFollow_Run()             ← 业务："巡线"
  │       │
  │       ├──▶ BSP_IR_Read(sensor_values) ← BSP："读传感器"
  │       │       └──▶ HAL_ADC_GetValue() ← HAL 库
  │       │
  │       ├──▶ 计算偏差、PID（App 层逻辑）
  │       │
  │       └──▶ BSP_Motor_SetSpeed()      ← BSP："驱动电机"
  │               └──▶ __HAL_TIM_SET_COMPARE() ← HAL 库
  │
  └──▶ （循环）
```

::: danger
**绝对不要让 BSP 层调用 App 层函数！** 分层的方向是严格单向的——只能上打下，不能下打上。如果电机模块需要通知上层"我过流了"，用回调函数（函数指针）或者 RTOS 队列/信号量，而不是直接 `#include "app_xxx.h"`。
:::

## 小结

分层的本质是**隔离变化**。硬件会变（换 MCU、换驱动板），但业务逻辑相对稳定。通过 BSP 层把硬件细节封装起来，App 层只表达业务意图，换硬件时改动量最小。你已经在 2WD_Car 项目中实践了这个结构——理解它的设计意图，以后写任何嵌入式项目都能保持代码的清晰和可维护性。
