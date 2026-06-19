---
title: JY61P 陀螺仪
---

# JY61P 陀螺仪

## 它是什么

JY61P 是一款 **6 轴姿态传感器模块**。这里的"6 轴"是指它内部集成了两种传感器：

| 传感器 | 数量 | 测量什么 | 单位 |
|--------|------|---------|------|
| 加速度计 | 3 轴（X, Y, Z） | 线性加速度（含重力方向） | g（1g = 9.8 m/s²） |
| 陀螺仪 | 3 轴（X, Y, Z） | 角速度（旋转快慢） | °/s（度/秒） |

把它想象成你的**内耳（前庭系统）**——它能感知朝向、倾斜和旋转。人闭着眼睛走路不会倒，靠的就是内耳。小车转弯要精确，靠的就是陀螺仪。

## 为什么要用 JY61P

普通的陀螺仪芯片（如 MPU6050）只输出原始的角速度和加速度数据。要得到角度，你需要自己写复杂的姿态解算算法（互补滤波、卡尔曼滤波）。而 **JY61P 内置了姿态解算**——它直接输出**欧拉角**（滚转角、俯仰角、偏航角），你直接读就行。

::: tip 欧拉角是什么
欧拉角是用三个数字描述三维空间中物体的朝向：
- **滚转角（Roll）：** 左右倾斜（小车翻了吗？）
- **俯仰角（Pitch）：** 前后倾斜（上坡还是下坡？）
- **偏航角（Yaw）：** 水平旋转（转弯了多少度？）← 竞赛中最常用的
:::

## 硬件连接

JY61P 使用 UART（串口）通信，4 根线：

| JY61P 引脚 | 接 MCU | 说明 |
|-----------|--------|------|
| VCC | 3.3V 或 5V | 供电 |
| GND | GND | 地 |
| TX | MCU 的 RX | JY61P 发送 → MCU 接收 |
| RX | MCU 的 TX | （可选）MCU 发送 → JY61P 接收 |

### 通信参数

- **波特率：** 115200 bps（比常见的 9600 快很多，因为数据量大）
- **数据位：** 8
- **停止位：** 1
- **校验位：** 无

```c
// UART 初始化（以 MSPM0 为例）
// 波特率 = 115200, 8N1
DL_UART_Main_init(UART_INST, 115200);
```

## 数据包格式

JY61P 会自动持续发送数据包——不需要 MCU 先请求，它自己一直发。每个数据包的格式：

```
数据包格式（加速度包，0x51）：
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│ 0x55 │ 0x51 │ AxL  │ AxH  │ AyL  │ AyH  │ AzL  │ AzH  │ TL   │ TH   │ SUM  │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
  帧头   包类型  加速度 X    加速度 Y    加速度 Z    温度       校验和

数据包格式（角速度包，0x52）：
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│ 0x55 │ 0x52 │ wxL  │ wxH  │ wyL  │ wyH  │ wzL  │ wzH  │ TL   │ TH   │ SUM  │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

数据包格式（角度包，0x53）：
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│ 0x55 │ 0x53 │ RollL│ RollH│PitchL│PitchH│ YawL │ YawH │ TL   │ TH   │ SUM  │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
```

每个包 11 字节。数据的低位在前（小端序）。校验和 = 除了帧头 0x55 外所有字节累加和的低 8 位。

## 数据解析代码

```c
// ==================== jy61p.h ====================
#ifndef JY61P_H
#define JY61P_H

#include <stdint.h>

typedef struct {
    float roll;     // 滚转角（度）
    float pitch;    // 俯仰角（度）
    float yaw;      // 偏航角（度）
    float wx, wy, wz; // 角速度（度/秒）
    float ax, ay, az; // 加速度（g）
} jy61p_data_t;

void jy61p_init(void);
void jy61p_parse_byte(uint8_t byte);
void jy61p_get_data(jy61p_data_t *data);
float jy61p_get_yaw(void);  // 最常用：直接获取偏航角

#endif

// ==================== jy61p.c ====================
#include "jy61p.h"
#include <string.h>

#define JY61P_BUF_SIZE  11

static uint8_t  rx_buf[JY61P_BUF_SIZE];
static uint8_t  rx_index = 0;
static jy61p_data_t g_imu_data = {0};

void jy61p_init(void) {
    // UART 已在配置工具中初始化（115200, 8N1）
    rx_index = 0;
    memset(&g_imu_data, 0, sizeof(g_imu_data));
}

// 这个函数在 UART 接收中断中调用，每次收到一个字节就调用一次
void jy61p_parse_byte(uint8_t byte) {
    rx_buf[rx_index] = byte;
    rx_index++;
    
    // 还没收到帧头就不处理
    if (rx_index == 1 && rx_buf[0] != 0x55) {
        rx_index = 0; // 不是帧头，重置
        return;
    }
    
    // 还没收满一个包（11 字节）就继续等
    if (rx_index < 11) {
        return;
    }
    
    // 收满 11 字节，校验
    rx_index = 0;
    
    // 计算校验和
    uint8_t sum = 0;
    for (int i = 0; i < 10; i++) {
        sum += rx_buf[i];
    }
    if (sum != rx_buf[10]) {
        return; // 校验失败，丢弃
    }
    
    // 根据包类型解析数据
    switch (rx_buf[1]) {
        case 0x51: // 加速度包
            g_imu_data.ax = (int16_t)((rx_buf[3] << 8) | rx_buf[2]) / 32768.0f * 16.0f;
            g_imu_data.ay = (int16_t)((rx_buf[5] << 8) | rx_buf[4]) / 32768.0f * 16.0f;
            g_imu_data.az = (int16_t)((rx_buf[7] << 8) | rx_buf[6]) / 32768.0f * 16.0f;
            break;
        case 0x52: // 角速度包
            g_imu_data.wx = (int16_t)((rx_buf[3] << 8) | rx_buf[2]) / 32768.0f * 2000.0f;
            g_imu_data.wy = (int16_t)((rx_buf[5] << 8) | rx_buf[4]) / 32768.0f * 2000.0f;
            g_imu_data.wz = (int16_t)((rx_buf[7] << 8) | rx_buf[6]) / 32768.0f * 2000.0f;
            break;
        case 0x53: // 角度包（竞赛中最常用）
            g_imu_data.roll  = (int16_t)((rx_buf[3] << 8) | rx_buf[2]) / 32768.0f * 180.0f;
            g_imu_data.pitch = (int16_t)((rx_buf[5] << 8) | rx_buf[4]) / 32768.0f * 180.0f;
            g_imu_data.yaw   = (int16_t)((rx_buf[7] << 8) | rx_buf[6]) / 32768.0f * 180.0f;
            break;
    }
}

void jy61p_get_data(jy61p_data_t *data) {
    *data = g_imu_data;
}

float jy61p_get_yaw(void) {
    return g_imu_data.yaw;
}

// ==================== 在 UART 中断中使用 ====================
// UART 接收中断回调
void UART_IRQHandler(void) {
    uint8_t byte = DL_UART_Main_receiveData(UART_INST);
    jy61p_parse_byte(byte);
}
```

## 用偏航角实现精确转弯

```c
// 让车精确右转 90 度
void turn_right_90_degrees(void) {
    float start_yaw = jy61p_get_yaw();  // 读取起始角度
    float target_yaw = start_yaw + 90.0f;
    
    // 处理角度回绕（Yaw 范围是 -180 到 +180）
    if (target_yaw > 180.0f) {
        target_yaw -= 360.0f;
    }
    
    // 原地右转
    motor_a_forward(50);   // 左轮前进
    motor_b_reverse(50);   // 右轮后退 → 原地右转
    
    float current_yaw;
    do {
        current_yaw = jy61p_get_yaw();
        // 小延时防止 CPU 跑冒烟
        delay_ms(5);
    } while (current_yaw < target_yaw); // 还没转到目标角度，继续转
    
    motor_stop(); // 转到位，停车
}
```

## 陀螺仪的两个重要特性

### 1. 上电稳定时间

JY61P 上电后需要 **2-5 秒** 进行自我校准。在这期间数据是不准的。代码中需要等待：

```c
void jy61p_wait_stable(void) {
    printf("等待陀螺仪稳定...\r\n");
    delay_ms(3000);  // 上电后等 3 秒
    printf("陀螺仪就绪！\r\n");
}
```

### 2. 漂移（Drift）

这是所有陀螺仪都有的问题：短时间（几秒到几十秒）精度很好，但长时间（几分钟）会慢慢"漂移"——角度读数会悄悄地偏掉。

| 特性 | 陀螺仪 | 编码器 |
|------|--------|--------|
| 短期精度 | 高 | 中 |
| 长期精度 | 低（漂移） | 高（不漂移） |
| 测什么 | 角速度 → 积分 = 角度 | 轮子转了多少圈 |

::: tip 陀螺仪和编码器互补
在竞赛中，通常用 **编码器 + 陀螺仪结合** 来测角度。短时间用陀螺仪（响应快），长时间用编码器校准（左轮和右轮的里程差可以算出转弯角度），互补滤波得到可靠的姿态估计。
:::

## 常见问题排查

| 现象 | 可能原因 | 解决方法 |
|------|---------|---------|
| 读到全是 0 | 波特率不对 | 确认是 115200 |
| 数据乱跳 | 接线松动 | 检查 TX/RX/GND 是否接触良好 |
| 角度一直偏 | 上电时车在晃动 | 上电后保持静止 5 秒 |
| Yaw 角一直往一个方向飘 | 正常漂移 | 用编码器辅助校准 |

---

> **JY61P 让姿态测量变得简单——别人需要写几百行滤波代码，你只需要读串口就行。但别忘了给它 5 秒的稳定时间。**
