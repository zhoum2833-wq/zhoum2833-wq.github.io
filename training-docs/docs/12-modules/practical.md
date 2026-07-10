---
title: 实战路线图：从点灯到巡线小车
---

# 实战路线图：从点灯到巡线小车

## 这篇文章是什么

你读了很多理论知识——GPIO、PWM、UART、I2C、PID……但你可能在想：**"我到底该怎么开始？"**

这篇文章就是你的答案。它按照从易到难的顺序，列出了 **12 个步骤**，每一步你都会学到新概念、用到新硬件、写出新代码。当你完成全部 12 步时，你就拥有了一辆完整的、能巡线、能精确转弯的竞赛小车。

## 这个路线图的设计哲学

1. **一次只加一个新东西。** 每步只引入一个新技术，不会让你同时面对五个陌生概念。
2. **每一步都能看到东西在动。** 光、电机转、屏幕亮——有反馈才有成就感。
3. **前面每一步都在为后面的闭环铺路。** 点灯学会了 GPIO → 驱动电机也是 GPIO；串口学会了通信 → 陀螺仪也是串口。

---

## 第 1 步：点亮 LED（GPIO 输出）

**学到的概念：** GPIO（通用输入输出）是什么、高电平、低电平、推挽输出、限流电阻

**需要的硬件：** MCU 开发板 ×1、LED 灯珠 ×1、220Ω 电阻 ×1、面包板

**为什么这步重要：** GPIO 是所有硬件控制的入口——点灯就是"GPIO 输出高电平"。后续你控制电机方向、拉高 STBY 使能、选通多路选择器，本质上都是在做同一件事：**让某个 MCU 引脚输出高电平或低电平**。

```c
#include "ti_msp_dl_config.h"

int main(void) {
    SYSCFG_DL_init();  // 系统初始化
    
    while (1) {
        DL_GPIO_setPins(LED_PORT, LED_PIN);   // 亮
        delay_ms(500);
        DL_GPIO_clearPins(LED_PORT, LED_PIN); // 灭
        delay_ms(500);
    }
}
```

::: tip "Hello World" 的变体
看完闪烁后，尝试修改延时时间让它闪得更快或更慢。然后尝试用两个 LED 交替亮灭。这能帮你建立"软件控制硬件"的直觉。
:::

---

## 第 2 步：按键控制（GPIO 输入 + 上下拉）

**学到的概念：** GPIO 输入模式、上拉电阻、下拉电阻、消抖

**需要的硬件：** 按键 ×1、10kΩ 电阻 ×1（或利用 MCU 内部上拉）

**核心代码：**

```c
// 读取按键状态（按下 = 低电平，因为接了上拉电阻）
if (DL_GPIO_readPins(BUTTON_PORT, BUTTON_PIN) == 0) {
    delay_ms(20);  // 消抖：等 20ms 再确认
    if (DL_GPIO_readPins(BUTTON_PORT, BUTTON_PIN) == 0) {
        // 按键真的被按下了
        DL_GPIO_togglePins(LED_PORT, LED_PIN);  // 切换 LED
        while (DL_GPIO_readPins(BUTTON_PORT, BUTTON_PIN) == 0);  // 等松开
    }
}
```

::: warning 按键抖动
机械按键按下时不是干净的高低跳变——它会抖动几十微秒。如果不消抖（等 20ms 再读），一次按键可能被你代码读到 5 次。"消抖"这个操作在编码器、限位开关等所有机械触点场景都要用。
:::

---

## 第 3 步：串口打印（UART + printf）

**学到的概念：** UART（通用异步收发传输器）、波特率、数据帧格式（起始位、数据位、停止位）、printf 重定向

**需要的硬件：** USB 转串口模块 ×1（或直接用板载调试器）

**核心代码：**

```c
#include <stdio.h>

// 重定向 printf 到 UART
int fputc(int ch, FILE *f) {
    DL_UART_Main_transmitDataBlocking(DEBUG_UART_INST, (uint8_t)ch);
    return ch;
}

int main(void) {
    SYSCFG_DL_init();
    
    printf("系统启动成功！\r\n");
    printf("这是一个数字：%d\r\n", 42);
    printf("这是一个浮点数：%.2f\r\n", 3.14159);
    
    while (1) {
        // 现在你可以"看到"程序内部的变量了！
    }
}
```

::: tip 串口是你最重要的调试工具
没有串口打印，你就像一个蒙着眼睛的医生在做手术。有了 serial print，你可以随时看到变量的值、程序运行到哪一步。**这是嵌入式开发的"超能力"——在本课程之后的所有步骤中，始终用 printf 来观察代码行为。**
:::

---

## 第 4 步：呼吸灯（定时器 + PWM）

**学到的概念：** 定时器（Timer）、PWM（脉冲宽度调制）、占空比（Duty Cycle）、频率

**需要的硬件：** 和步骤 1 一样（LED + 电阻）

**核心代码：**

```c
// 呼吸灯：占空比从 0% 慢慢变到 100%，再慢慢变回 0%
int duty = 0;
int direction = 1;

while (1) {
    set_pwm_duty(duty);  // 设置占空比 = duty%
    duty += direction;
    if (duty >= 100) direction = -1;
    if (duty <= 0)   direction = +1;
    delay_ms(10);  // 控制呼吸速度
}
```

**PWM 的直观理解：** 如果你用开关来回拨动控制灯的亮度——"开"的时间比例越大，灯越亮。PWM 就是这个"快速开关"——频率高到人眼看不出来闪烁（>50Hz），只能感知到平均亮度。

---

## 第 5 步：读取电位器（ADC）

**学到的概念：** ADC（模数转换器）、分辨率（12 位 = 0-4095）、参考电压、采样时间

**需要的硬件：** 电位器（旋转可调电阻）×1

**核心代码：**

```c
uint16_t adc_value;

// 读取 ADC 值
adc_value = DL_ADC12_getConversionResult(ADC_INST);

// 计算电压（假设 3.3V 参考电压）
float voltage = (float)adc_value / 4095.0f * 3.3f;

printf("ADC 原始值: %d, 电压: %.2fV\r\n", adc_value, voltage);
```

**和后面内容的关系：** 灰度的光电三极管输出也是模拟电压 → 也是通过 ADC 读取。电池电压检测也是 ADC。输入本质都是"一个变化的电压值"。

---

## 第 6 步：OLED 显示（I2C 通信）

**学到的概念：** I2C 总线（SCL + SDA）、设备地址（7 位地址）、主机/从机模式

**需要的硬件：** 0.96 寸 OLED 显示屏（SSD1306 驱动，I2C 接口）×1

```c
// I2C 通信模型（伪代码）
void OLED_show_text(char *str) {
    I2C_start();                    // 起始信号
    I2C_send_byte(OLED_ADDR << 1);  // 发设备地址 + 写位
    I2C_send_byte(0x00);            // 命令模式
    // ... 发送显示数据 ...
    I2C_stop();                     // 停止信号
}
```

::: tip OLED 的价值
在赛车抬头显示器上——车速、角度、当前状态——全显示在小屏幕上。不用电脑也能看到数据，这对现场调试非常重要。
:::

---

## 第 7 步：控制舵机（PWM + 占空比映射）

**学到的概念：** 舵机控制协议（500-2500μs 脉冲宽度对应 0-180°）、占空比到角度的映射

**需要的硬件：** SG90 舵机 ×1

```c
// 舵机角度到 PWM 占空比的映射
// SG90: 0.5ms = 0°, 1.5ms = 90°, 2.5ms = 180°
// 50Hz 周期 = 20ms
void servo_set_angle(uint8_t angle) {
    // angle: 0-180 度
    // 脉冲宽度 = 500 + (angle / 180) * 2000 微秒
    uint16_t pulse_us = 500 + (uint32_t)angle * 2000 / 180;
    
    // 占空比 = 脉冲宽度 / 周期
    uint16_t duty = (uint32_t)pulse_us * 1000 / 20000;  // 0-1000 对应 0-100%
    set_pwm_duty(duty);
}
```

---

## 第 8 步：驱动直流电机（PWM + GPIO 方向控制）

**学到的概念：** H 桥原理、死区时间、TB6612 真值表

**需要的硬件：** TB6612 电机驱动模块 ×1、TT 直流电机 ×2、电池（7.4V 锂电池）

```c
// 回顾你在第 1 步学会的 GPIO 和第 4 步学会的 PWM
// 电机控制 = GPIO（方向）+ PWM（速度）
void motor_control_example(void) {
    // 前进 2 秒
    motor_a_forward(60);
    motor_b_forward(60);
    delay_ms(2000);
    
    // 刹车 0.5 秒（死区时间）
    motor_a_brake();
    motor_b_brake();
    delay_ms(500);
    
    // 后退 2 秒
    motor_a_reverse(60);
    motor_b_reverse(60);
    delay_ms(2000);
    
    // 滑行停止
    motor_a_coast();
    motor_b_coast();
}
```

::: danger 首次上电：车轮离地！
第一次测试电机时，**把车架起来让轮子悬空**。如果代码写反了，车不会冲出去撞坏东西。
:::

---

## 第 9 步：测量速度（编码器 + 定时器正交解码）

**学到的概念：** 正交编码、4× 解码、速度闭环的概念、定时器的编码器模式

**需要的硬件：** 霍尔编码器（集成在电机尾部）×2

**核心代码：**

```c
// 每 10ms 调用一次
void speed_update(void) {
    int32_t count_now = DL_TimerG_getCounterValue(ENCODER_TIMER);
    int32_t count_diff = count_now - g_last_count;
    g_last_count = count_now;
    
    // 速度 = 距离 / 时间
    g_speed = (float)count_diff / COUNTS_PER_METER / 0.01f;
    
    printf("速度: %.2f m/s, 里程: %.3f m\r\n", g_speed, g_distance);
}
```

**里程碑：** 现在你能**精确知道**车跑了多远、跑多快——这是闭环控制的基础。

---

## 第 10 步：巡线（灰度传感器 + P 控制器 + 电机 = 闭环）

**学到的概念：** 闭环控制、反馈、误差、P 控制器、加权平均法

**需要的硬件：** 8 路灰度传感器模块 ×1

**核心代码：**

```c
// 这是整个路线图的核心——闭环巡线
void line_following_loop(void) {
    uint16_t gray[8];
    float Kp = 0.05f;      // P 系数
    int base_speed = 60;   // 基础速度
    
    while (1) {
        // 1. 读传感器（步骤 5 的 ADC）
        grayscale_read_all(gray);
        
        // 2. 计算黑线位置（加权平均）
        float line_pos = calculate_line_position(gray);
        
        // 3. 计算误差
        float error = 0.0f - line_pos;
        
        // 4. P 控制：修正 = Kp × 误差
        float correction = Kp * error;
        
        // 5. 控制电机（步骤 8 的电机驱动）
        motor_a_set_speed(base_speed + (int)correction);
        motor_b_set_speed(base_speed - (int)correction);
        
        delay_ms(10); // 100Hz 控制频率
    }
}
```

**闭环的魔力：** 把这个循环跑起来——车自己沿着黑线走，不需要你干预。它的工作方式是：偏离→检测→纠正→偏离→检测→纠正……每秒钟 100 次的"看-算-调"循环。

---

## 第 11 步：精确转弯（陀螺仪 + PID）

**学到的概念：** PID 控制器（比例 + 积分 + 微分）、陀螺仪角度反馈、角度闭环

**需要的硬件：** JY61P 陀螺仪模块 ×1

```c
// 用 PID 控制精确转弯到目标角度
float pid_angle_control(float target_angle, float current_angle) {
    static float integral = 0;
    static float last_error = 0;
    
    float Kp = 2.0f, Ki = 0.01f, Kd = 0.5f;
    
    // 计算角度误差（处理 -180 到 +180 的环绕）
    float error = target_angle - current_angle;
    if (error > 180.0f)  error -= 360.0f;
    if (error < -180.0f) error += 360.0f;
    
    // PID 三项
    integral += error;
    float derivative = error - last_error;
    last_error = error;
    
    // 输出 = P + I + D
    float output = Kp * error + Ki * integral + Kd * derivative;
    
    // 限幅
    if (output > 100.0f)  output = 100.0f;
    if (output < -100.0f) output = -100.0f;
    
    return output;
}

// 精确右转 90 度
void turn_right_90_exact(void) {
    float target = jy61p_get_yaw() + 90.0f;
    if (target > 180.0f) target -= 360.0f;
    
    while (1) {
        float current = jy61p_get_yaw();
        float output = pid_angle_control(target, current);
        
        // output > 0 → 右转，output < 0 → 左转
        motor_a_set_speed((int)output);
        motor_b_set_speed(-(int)output);
        
        // 误差小于 2 度，认为到位
        float error = target - current;
        if (error < 0) error = -error;
        if (error < 2.0f) break;
        
        delay_ms(5);
    }
    car_stop();
}
```

::: tip 从 P 到 PID
- **P（比例）：** 你当前偏离了多远？偏离越大，纠正力度越大。
- **I（积分）：** 你过去累计偏了多久？如果 P 不够把你拉回来，I 会累积误差直到把你拉回来。
- **D（微分）：** 你现在偏的速度是多快？如果你正在快速偏离，D 会"提前刹车"防止冲过头。

P 能跑起来，PI 能跑准，PID 能跑稳。
:::

---

## 第 12 步：完整小车（状态机 + 多传感器 + 遥测 = 竞赛就绪）

**学到的概念：** 有限状态机（FSM）、多传感器融合、系统集成

**需要的硬件：** 前面所有硬件的集合 + 蓝牙 HC-05（无线调试）

**状态机架构：**

```c
// 状态定义
typedef enum {
    STATE_IDLE,         // 空闲（等待开始）
    STATE_LINE_FOLLOW,  // 巡线中
    STATE_TURN_LEFT,    // 左转
    STATE_TURN_RIGHT,   // 右转
    STATE_CROSS_DETECT, // 检测到路口
    STATE_STOP,         // 停止
    STATE_ERROR         // 错误处理
} car_state_t;

// 状态机主循环
void state_machine_loop(void) {
    car_state_t state = STATE_IDLE;
    
    while (1) {
        // 1. 更新所有传感器数据
        grayscale_read_all(gray_values);
        encoder_update();
        maxicam_get_data(&cam_data);
        float yaw = jy61p_get_yaw();
        
        // 2. 发送遥测数据（无线调试）
        debug_telemetry(speed, yaw, state);
        
        // 3. 状态机决策
        switch (state) {
            case STATE_IDLE:
                if (start_button_pressed()) {
                    state = STATE_LINE_FOLLOW;
                }
                break;
                
            case STATE_LINE_FOLLOW:
                line_following_p_control();
                
                // 检测路口
                if (detect_cross(gray_values)) {
                    state = STATE_CROSS_DETECT;
                }
                // 检测停止线
                if (detect_stop_line(cam_data)) {
                    state = STATE_STOP;
                }
                break;
                
            case STATE_TURN_LEFT:
                turn_angle_exact(-90.0f);
                state = STATE_LINE_FOLLOW;
                break;
                
            case STATE_STOP:
                car_stop();
                // 任务完成
                break;
                
            default:
                state = STATE_ERROR;
                break;
        }
        
        delay_ms(10); // 100Hz 主循环
    }
}
```

---

## 完整知识地图

```
你走过的路（每一步建立在前一步之上）：

步骤 1-2:  GPIO 输入/输出
               │
               ├──→ 步骤 8:  电机方向控制
               │
               └──→ 步骤 3:  UART 通信
                              │
                    ┌─────────┼─────────┐
                    │         │         │
              步骤 9:    步骤 10:   步骤 11:
              编码器     灰度传感器  陀螺仪
               │         │         │
               │    ┌────┴────┐    │
               │    │         │    │
               └────┼─── 步骤 12 ──┘
                    │   完整小车
                    │
              步骤 4:  PWM → 步骤 7: 舵机 / 电机速度
              步骤 5:  ADC → 步骤 10: 灰度读取
              步骤 6:  I2C → OLED 显示
```

## 每个步骤的时间预算

| 步骤 | 预估时间 | 难度 | 
|------|---------|------|
| 1. 点灯 | 30 分钟 | ⭐ |
| 2. 按键 | 30 分钟 | ⭐ |
| 3. 串口打印 | 1 小时 | ⭐ |
| 4. 呼吸灯 | 1 小时 | ⭐⭐ |
| 5. ADC 读电位器 | 1 小时 | ⭐⭐ |
| 6. OLED 显示 | 2 小时 | ⭐⭐ |
| 7. 舵机控制 | 1 小时 | ⭐⭐ |
| 8. 驱动电机 | 2 小时 | ⭐⭐⭐ |
| 9. 编码器测速 | 3 小时 | ⭐⭐⭐ |
| 10. 巡线 | 4 小时 | ⭐⭐⭐⭐ |
| 11. 精确转弯 | 4 小时 | ⭐⭐⭐⭐ |
| 12. 完整小车 | 8 小时 | ⭐⭐⭐⭐⭐ |
| **总计** | **约 30 小时** | |

这些时间是保守估计——如果遇到奇怪的 bug（通常是接线问题或配置错误），可能需要额外时间。**预留 50% 的余量。**

## 调试的黄金法则

::: danger 最重要的一条规则
**一次只改一个东西。** 不要同时调整 PID 参数、修改传感器安装位置、更换电池。如果改了三个东西后发现车跑得不对，你根本不知道是哪个改动导致的。
:::

- 用 `printf` 输出关键变量。
- 用无线串口监控小车在跑道上的实时数据。
- 如果某个子系统不确定是否正常，先写一个最小测试程序单独验证。
- 记录每次改动和对应的效果（一个简单的笔记本比记忆力可靠）。

## 小结

12 步路线图从点灯到巡线小车，每一步都是前面知识的实战应用。不要跳步，不要贪快——每一步调通了再进下一步。

---
# 第十三篇：电机与驱动