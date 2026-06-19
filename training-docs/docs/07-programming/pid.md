---
title: PID 控制入门
---

# PID 控制入门

## 为什么需要 PID

你的巡线小车看到黑线偏左了，往右打方向盘——打多少？打太大冲出赛道，打太小纠正不过来。PID 就是回答"打多少"这个问题的最经典算法。

从电饭煲保温到火箭姿态控制，PID 无处不在。在电赛里，它的典型用途：
- 巡线小车：灰度传感器 → PID → 电机差速
- 平衡车：陀螺仪角度 → PID → 电机输出
- 温控：温度传感器 → PID → 加热器 PWM
- 速度控制：编码器 → PID → 电机 PWM

## P、I、D 是什么（直觉理解，不列公式）

### P（比例，Proportional）

**"偏差大就用力大"**。偏差 × 一个系数（Kp）= 输出。

小车偏左 5°？打 5°×Kp 的方向。偏左 20°？打 20°×Kp。简单粗暴。

**只有 P 的问题**：永远有稳态误差。就像浴室调水温，只靠"冷了就拧热水"永远对不准——因为你反应和偏差成比例，偏差越小反应越弱，趋近目标时几乎没反应了。

### I（积分，Integral）

**"偏差一直没消掉？加把力"**。I 把过去的偏差累积起来×Ki 加进输出。

水温低了 1°C，P 反应很小，但 1°C 的偏差持续了 30 秒 → I 累加了 30 → 输出变大 → 纠正过来。

**只有 I 的问题**：启动时积分累积过猛（因为初始偏差大）导致超调。需要用积分分离或积分限幅防止"积分饱和"。

### D（微分，Derivative）

**"变化太快了？刹一下"**。D 看偏差的变化率（当前偏差 − 上一次偏差）×Kd，起**阻尼**作用。

小车快速接近中线 → D 察觉到"变好了太快" → 输出提前减小 → 避免冲过头（过冲）。

**D 的问题**：对噪声极其敏感。传感器有毛刺 → 计算出的变化率巨大 → D 项乱跳。所以 D 前一般先滤波。

## 三条直觉

| 项 | 做什么 | 调大了会怎样 | 调小了会怎样 |
|----|--------|-------------|-------------|
| **P** | 快速响应 | 震荡、过冲 | 反应慢、有静差 |
| **I** | 消除静差 | 超调大、来回晃 | 静差消不掉 |
| **D** | 抑制过冲 | 对噪声敏感、电机抖动 | 过冲大 |

## 位置式 PID vs 增量式 PID

```c
// 位置式 PID —— 输出是"你应该在哪个位置"
float PID_Compute(float setpoint, float measured) {
    float err = setpoint - measured;
    integral += err * dt;
    float derivative = (err - prev_err) / dt;
    prev_err = err;
    return Kp * err + Ki * integral + Kd * derivative;
}
```

```c
// 增量式 PID —— 输出是"你应该比上次多多少/少多少"
float PID_ComputeDelta(float setpoint, float measured) {
    float err = setpoint - measured;
    // 输出 = Kp*(e(k)-e(k-1)) + Ki*e(k) + Kd*(e(k)-2*e(k-1)+e(k-2))
    float delta = Kp * (err - prev_err)
                + Ki * err
                + Kd * (err - 2 * prev_err + prev_prev_err);
    prev_prev_err = prev_err;
    prev_err = err;
    return delta;
}
```

| | 位置式 PID | 增量式 PID |
|------|----------|----------|
| 输出 | 绝对值（PWM 占空比） | 变化量（+ΔPWM） |
| 积分饱和 | 容易出现 | 天然防饱和 |
| 无扰切换 | 需要处理 | 天然支持 |
| 适合 | 直接控制 | 需要平滑变化的场合 |

::: tip 电赛推荐
电机控制用**增量式 PID**——天然抗积分饱和，而且即使 PID 计算偶尔出一次错（比如传感器噪声导致错误值），只影响一步的增量，不会让电机突然飞出去。
:::

## 调参口诀（Ziegler-Nichols 的通俗版）

1. **先调 P**：Ki=0, Kd=0。找到让系统**持续震荡的临界 Kp**。取这个值的 0.6 倍作为初始 Kp。
2. **再调 D**：加 D 抑制震荡。加到系统不晃但也不"肉"的程度。
3. **最后调 I**：慢慢加 I 消除静差。加太快 → 超调又来了。
4. 反复微调三轮，基本就稳了。

::: warning 调参心态
PID 参数**没有万能公式**。每辆车的重量、轮子、赛道摩擦系数都不一样。网上抄来的参数只能作为起点，必须现场调。这就是为什么无线串口调试（第十二篇）那么重要——你可以在赛场上看着波形实时调参。
:::

## 巡线小车 PID 示例

```c
// 8 路灰度传感器返回 0~8000 的位置值（0=最左，8000=最右）
// 目标：让位置保持在中线（4000）

float line_position = grayscale_read_position();  // 0~8000
float error = 4000 - line_position;                // 偏差（-4000~+4000）

float pid_output = PID_ComputeDelta(0, error);     // 增量式 PID

// pid_output 是差速量，加到两个轮子上
int left_pwm  = base_speed + pid_output;
int right_pwm = base_speed - pid_output;

// 限幅
left_pwm  = CLAMP(left_pwm,  -MAX_PWM, MAX_PWM);
right_pwm = CLAMP(right_pwm, -MAX_PWM, MAX_PWM);

motor_left_set(left_pwm);
motor_right_set(right_pwm);
```

## 小结

PID 是电赛控制题的"标准答案"。P 快、I 准、D 稳。用增量式 PID 控制电机，按 P→D→I 的顺序调参。PID 不神秘——花半小时了解公式，花三小时上赛道调参，你就能从"乱扭"进化成"丝滑"。
