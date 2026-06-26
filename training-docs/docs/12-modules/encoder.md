---
title: 编码器 — 测速与里程
---

# 编码器 — 测速与里程

## 编码器是什么

编码器（Encoder）是一个能告诉你"电机转了多少圈"的传感器。日常类比：自行车上的码表——轮子每转一圈，传感器就计数一次，从而算出速度和距离。编码器就是电机的"码表"。

## 霍尔编码器的原理

竞赛小车常用的是**霍尔编码器**。它由两部分组成：

1. **磁铁盘：** 装在电机转轴上，上面分布着 N 对磁极（N→S→N→S 交替排列）
2. **霍尔传感器：** 固定不动，当磁极交替经过时，传感器输出高低电平的方波

```
磁铁盘旋转 →
  N  S  N  S  N  S
  ↓  ↓  ↓  ↓  ↓  ↓
霍尔传感器 →
  输出：高 低 高 低 高 低  ← 这就是"脉冲"
```

一个"脉冲" = 一个完整的高低电平周期。**PPR**（Pulses Per Revolution）= 磁铁盘每转一圈输出的脉冲数。

## 我们的编码器参数

竞赛标准配置的编码器：

- **电机端 PPR：** 13（磁铁盘每转一圈 13 个脉冲）
- **减速比：** 20:1（电机转 20 圈，输出轴转 1 圈）
- **输出轴 PPR：** 13 × 20 = 260 脉冲/圈（输出轴每转一圈）

### 正交编码与 4× 解码

编码器有 A、B 两路输出信号，相位差 90 度（像一个在前一个在后）：

```
A 相：┌─┐  ┌─┐  ┌─┐  ┌─┐
      └─┘  └─┘  └─┘  └─┘
B 相：  ┌─┐  ┌─┐  ┌─┐  ┌─┐
        └─┘  └─┘  └─┘  └─┘
```

MCU 的定时器可以同时看 A 和 B 的上升沿和下降沿——每个脉冲周期能检测到 4 个事件（这叫**4× 解码**）。

```
输出轴每圈计数 = 260 × 4 = 1040 个计数
```

这意味着每毫米能检测到的移动精度非常高。

## 硬件连接

编码器有 4 根线：

| 线色 | 信号 | 接哪里 |
|------|------|--------|
| 红 | VCC (3.3V 或 5V) | MCU 电源输出 |
| 黑 | GND | MCU 地 |
| 黄 | A 相输出 | 定时器的通道 1（如 TIM4_CH1） |
| 绿 | B 相输出 | 定时器的通道 2（如 TIM4_CH2） |

## 定时器的编码器模式

**这是最关键的部分。** MCU 的通用定时器（如 STM32 的 TIM2-TIM5，MSPM0 的通用定时器）有一个"编码器模式"——它可以**自动**对 A、B 两相脉冲进行 4× 解码计数，不需要 CPU 参与。

### 编码器模式做了什么

- 每当 A 相或 B 相有跳变 → 定时器的计数器自动 +1 或 -1
- 正转时计数器增加，反转时计数器减少
- CPU 不需要在中断里计数——直接读定时器的计数值就行

### 速度计算

```c
// 每 10ms 读一次编码器，计算速度
#define ENCODER_COUNTS_PER_METER  5200.0f  // 根据轮子周长计算

float calculate_speed(int32_t count_diff, float time_delta_s) {
    // count_diff: 这次读到的计数值 - 上次读到的计数值
    // time_delta_s: 两次读取的时间间隔（秒）
    
    float distance = (float)count_diff / ENCODER_COUNTS_PER_METER; // 米
    float speed = distance / time_delta_s; // 米/秒
    return speed;
}
```

### ENCODER_COUNTS_PER_METER 怎么算

```
轮子周长 = π × 直径
         = 3.1416 × 0.065m  (直径 6.5cm)
         = 0.2042m

输出轴每圈计数（4× 解码后） = 1040

每米计数数 = 1040 / 0.2042 ≈ 5093

加上一些余量，实际用 5200 左右
```

## 代码示例

```c
// ==================== encoder.h ====================
#ifndef ENCODER_H
#define ENCODER_H

#include <stdint.h>

void encoder_init(void);
int32_t encoder_get_count(void);      // 读取累计脉冲计数
void encoder_reset(void);             // 清零计数
float encoder_get_speed(void);        // 获取实时速度（m/s）
float encoder_get_distance(void);     // 获取累计里程（m）
void encoder_update(void);            // 定期调用（如每 10ms）

#endif

// ==================== encoder.c ====================
#include "encoder.h"
#include "ti_msp_dl_config.h"

#define COUNTS_PER_METER    5200.0f   // 根据你的轮子计算
#define UPDATE_INTERVAL_S   0.01f     // 10ms 更新一次

static int32_t g_encoder_count = 0;   // 累计计数
static int32_t g_last_count = 0;      // 上次读数
static float g_speed = 0.0f;          // 当前速度
static float g_distance = 0.0f;       // 累计里程

void encoder_init(void) {
    // 定时器已配置为编码器模式（在 .syscfg 或 CubeMX 中配置）
    // 启用定时器
    DL_TimerG_startCounter(ENCODER_TIMER_INST);
}

int32_t encoder_get_count(void) {
    // 直接读定时器的计数器值
    // 注意：根据定时器位数（16位或32位），可能溢出
    return (int32_t)DL_TimerG_getCounterValue(ENCODER_TIMER_INST);
}

void encoder_reset(void) {
    DL_TimerG_setCounterValue(ENCODER_TIMER_INST, 0);
    g_encoder_count = 0;
    g_last_count = 0;
    g_speed = 0.0f;
    g_distance = 0.0f;
}

void encoder_update(void) {
    // 读当前计数值
    int32_t current_count = encoder_get_count();
    
    // 计算差值（处理定时器溢出）
    int32_t diff = current_count - g_last_count;
    
    // 更新累计
    g_encoder_count += diff;
    g_last_count = current_count;
    
    // 计算速度
    g_speed = (float)diff / COUNTS_PER_METER / UPDATE_INTERVAL_S;
    
    // 计算里程
    g_distance = (float)g_encoder_count / COUNTS_PER_METER;
}

float encoder_get_speed(void) {
    return g_speed;
}

float encoder_get_distance(void) {
    return g_distance;
}

// ==================== 在 main.c 中使用 ====================
// 定时器中断或主循环中每 10ms 调用一次
void TIMER_10MS_IRQHandler(void) {
    encoder_update();
    
    // 现在可以用 encoder_get_speed() 获取实时速度
    float current_speed = encoder_get_speed();
    // 用于 PID 控制……
}
```

## 编码器 vs 不用编码器

| 比较 | 不用编码器（开环） | 用编码器（闭环） |
|------|------------------|-----------------|
| 速度控制 | "我发了 80% 占空比，它大概是 0.8m/s" | "实际速度 0.76m/s，差 0.04，补一点" |
| 里程 | 算不了，只能靠估计 | 精确到毫米 |
| 上坡 | 速度变慢，代码不知道 | 检测到速度下降，自动加大油门 |
| 电池没电 | 越来越慢，代码不知道 | 检测到速度异常，可以报警 |

::: tip 一句话总结编码器的价值
**不用编码器，你的代码在"猜"车在哪里。用编码器，你的代码"知道"车在哪里。**
:::

## 常见问题

### 读数方向反了

正转时计数器减少？交换 A 相和 B 相的接线，或者在软件中取反。

### 读数跳动

- 检查编码器供电是否稳定（3.3V 或 5V）
- 信号线不要太长（< 30cm）
- 如果线长，加 100nF 电容在信号线和地之间

### 定时器溢出

16 位定时器的最大值是 65535，如果车跑很长时间计数器会溢出。代码中需要处理这种"回绕"情况。

---

## 小结

编码器让你知道"轮子转了多少圈"——有了它，小车从盲开变成感知行驶。A/B 相通过正交解码得到方向和圈数，再结合轮子周长算出速度和里程。花点时间把编码器调通，后面的 PID 闭环控制才能做。
