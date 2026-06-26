---
title: 8 路灰度传感器
---

# 8 路灰度传感器

## 它是怎么"看"到线的

灰度传感器是竞赛小车最常用的巡线传感器。它的原理非常简单：

```
        红外 LED（发光）
           │
           ▼
    ═══════════════════  ← 地面
    白色区域：反射强     黑色线：反射弱（被吸收）
           │                    │
           ▼                    ▼
    光电三极管收到多      光电三极管收到少
           │                    │
           ▼                    ▼
       输出电压高           输出电压低
       → "白色"             → "黑色"
```

用日常经验理解：穿着黑衣服在太阳下会更热，因为黑色吸收了更多光线。灰度传感器就是用这个原理——黑色吸收红外光，反射少，传感器输出低电压。

## 硬件结构

### 8 路传感器排列

8 个传感器一字排开，间距约 12mm（和赛道黑线宽度匹配）：

```
传感器编号:  0    1    2    3    4    5    6    7
            ○    ○    ○    ○    ○    ○    ○    ○
                     车头方向 →
                     中线 ↕ (传感器 3 和 4 之间)
```

黑线宽度通常在 20-30mm。理想情况下，黑线会同时覆盖 2-3 个传感器。

### 3-to-8 多路选择器

::: tip 为什么需要多路选择器
8 个传感器需要 8 个 ADC 引脚来读——但 MCU 的 ADC 通道可能不够。用一片 **74HC4051**（3-to-8 模拟多路选择器），只需要 3 个 GPIO 选择通道 + 1 个 ADC 输入 = 只用 4 个 MCU 引脚就读到了全部 8 路！
:::

```
         74HC4051 多路选择器
         ┌─────────────┐
AD0 ─────│ S0       Y0 │──── 传感器 0
AD1 ─────│ S1       Y1 │──── 传感器 1
AD2 ─────│ S2       Y2 │──── 传感器 2
         │           ...│
   ┌─────│ Z        Y7 │──── 传感器 7
   │     └─────────────┘
   ▼
ADC 引脚（读电压）
```

**AD0-AD2 三根地址线**相当于一个"选择器"——000 选传感器 0，001 选传感器 1，……，111 选传感器 7。

## 读取灰度值

### 基本读取流程

```c
// 读取指定通道的灰度值
uint16_t grayscale_read_channel(uint8_t channel) {
    // 1. 设置地址线（AD0, AD1, AD2）
    DL_GPIO_writePins(AD0_PORT, AD0_PIN, (channel & 0x01) ? 1 : 0);
    DL_GPIO_writePins(AD1_PORT, AD1_PIN, (channel & 0x02) ? 1 : 0);
    DL_GPIO_writePins(AD2_PORT, AD2_PIN, (channel & 0x04) ? 1 : 0);
    
    // 2. 等待信号稳定（>1μs，实际用 10μs 更保险）
    delay_us(10);
    
    // 3. 读 ADC
    return ADC_read();
}
```

::: warning 等待时间很重要
切换通道后，多路选择器和 ADC 都需要时间稳定。如果不等就直接读，读到的是上一个通道的残留值。10μs 是一个安全的值。
:::

### 读取全部 8 路

```c
// 一次读取全部 8 路灰度值，存入数组
void grayscale_read_all(uint16_t values[8]) {
    for (uint8_t i = 0; i < 8; i++) {
        values[i] = grayscale_read_channel(i);
    }
}
```

## 从灰度值到黑线位置

### 阈值判断

首先需要设定一个"黑/白分界线"——阈值。高于阈值 = 白色，低于阈值 = 黑色。

```c
// 灰度值越高 = 越白，越低 = 越黑
// 阈值一般取 "白值" 和 "黑值" 的中间值
// 比如：白值 3000，黑值 500 → 阈值 = 1750

#define GRAYSCALE_THRESHOLD 1750  // 根据实际情况调整！

// 判断每个传感器是否在黑线上
uint8_t is_black[8];
for (int i = 0; i < 8; i++) {
    is_black[i] = (values[i] < GRAYSCALE_THRESHOLD) ? 1 : 0;
}
```

### 计算黑线位置：加权平均法

**这是最常用的巡线算法。** 给每个传感器一个"位置权重"，落在黑线上的传感器按权重取平均：

```c
// 传感器 0-7 的物理位置（以中线为 0，单位 mm）
// 传感器 0 在最左（-42mm），传感器 7 在最右（+42mm）
float sensor_positions[8] = {-42, -30, -18, -6, 6, 18, 30, 42};

float calculate_line_position(uint16_t values[8]) {
    float weighted_sum = 0.0f;
    float total_intensity = 0.0f;
    
    for (int i = 0; i < 8; i++) {
        // 将灰度值转换为"黑的程度"
        // 值越小（越黑）→ 权重越大
        float darkness = 1.0f - (float)values[i] / 4095.0f; // 假设 12 位 ADC
        
        weighted_sum += sensor_positions[i] * darkness;
        total_intensity += darkness;
    }
    
    if (total_intensity < 0.01f) {
        return 0.0f; // 没检测到黑线，默认在中间
    }
    
    return weighted_sum / total_intensity; // 黑线的加权位置
}
```

返回值的含义：
- `0` → 黑线在正中间（完美巡线状态）
- `+20` → 黑线偏右 20mm（车需要右转纠正）
- `-30` → 黑线偏左 30mm（车需要左转纠正）

## P 控制器的巡线应用

有了黑线位置，就可以用 P 控制器驱动机器回到中线上：

```c
void line_following_loop(void) {
    uint16_t gray_values[8];
    float line_pos;        // 黑线位置
    float error;           // 误差
    float correction;      // 修正量
    float Kp = 0.05f;      // P 系数（需要实验调整！）
    int base_speed = 60;   // 基础速度
    
    while (1) {
        // 1. 读灰度
        grayscale_read_all(gray_values);
        
        // 2. 计算黑线位置
        line_pos = calculate_line_position(gray_values);
        
        // 3. 计算误差（目标 = 0，即黑线在中间）
        error = 0.0f - line_pos;
        
        // 4. P 控制：修正量 = Kp × 误差
        correction = Kp * error;
        
        // 5. 驱动电机
        int left_speed  = base_speed + (int)correction;
        int right_speed = base_speed - (int)correction;
        
        // 限制速度范围
        if (left_speed  > 100) left_speed  = 100;
        if (left_speed  < -100) left_speed  = -100;
        if (right_speed > 100) right_speed = 100;
        if (right_speed < -100) right_speed = -100;
        
        motor_a_set_speed(left_speed);
        motor_b_set_speed(right_speed);
        
        delay_ms(10); // 10ms 控制周期
    }
}
```

这就是最基础的**闭环巡线**——传感器检测位置 → 计算误差 → 调整电机 → 小车回到中线上，形成完整的反馈闭环。

## 校准的重要性

::: danger 不校准 = 跑飞
灰度传感器的读数受环境光、地面材质、红外 LED 老化等因素影响。在实验室调好的阈值，拿到赛场上可能完全不对。**一定要在现场校准！**
:::

### 简单的自动校准

```c
// 在校准模式下：把车放在白色区域和黑色区域上各读一遍
void grayscale_calibrate(uint16_t white_ref[8], uint16_t black_ref[8]) {
    printf("请把车放在白色区域，按按键...\r\n");
    wait_button_press();
    grayscale_read_all(white_ref);
    
    printf("请把车放在黑色线上，按按键...\r\n");
    wait_button_press();
    grayscale_read_all(black_ref);
    
    // 阈值 = 中间值
    for (int i = 0; i < 8; i++) {
        threshold[i] = (white_ref[i] + black_ref[i]) / 2;
    }
}
```

## 灰度传感器 vs 其他巡线方案

| 方案 | 分辨率 | 速度 | 成本 | 适合 |
|------|--------|------|------|------|
| 8 路灰度 | 8 点 | 快（~0.1ms） | ~15元 | 简单巡线、十字路口 |
| 16 路灰度 | 16 点 | 快 | ~25元 | 复杂赛道 |
| 线性 CCD | 128 点 | 中（~1ms） | ~40元 | 高精度巡线 |
| 摄像头 | 全画面 | 慢（~10ms） | ~120元 | 复杂视觉任务 |

---

## 小结

8 路灰度传感器是入门巡线的最优选择——8 个光电对管一字排开，哪个看到黑线就能算出偏移量。安装高度 5-15mm，先校准再使用，数据用加权平均或线性插值处理。简单、可靠、够快、够用。
