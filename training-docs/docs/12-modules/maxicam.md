---
title: MaixCAM Pro — 视觉模块
---

# MaixCAM Pro — 视觉模块

## 它是什么

MaixCAM Pro 是一块小型视觉处理模块，搭载了 **K210 芯片**——这是一颗专为 AI 视觉任务设计的处理器。把它接在小车上，车就有了"眼睛"。

**核心规格：**

| 参数 | 数值 | 说明 |
|------|------|------|
| 芯片 | K210 | RISC-V 双核 64 位 |
| 主频 | 400 MHz | 可超频到 800 MHz |
| KPU | 神经网络加速器 | 0.8 TOPS（专门跑 AI 模型） |
| RAM | 8 MB | 够跑中等规模模型 |
| 摄像头 | OV2640 (200 万像素) | 可拍照、可录视频 |
| 屏幕 | 2.4 寸 TFT LCD | 调试用（车跑起来不看） |

## 它不是干什么的

::: warning MaixCAM Pro 不做什么
- **不输出原始图像给 MCU。** 如果你想让 MCU 处理摄像头图像，MaixCAM 不合适——它自己处理图像，只把结果发给 MCU。
- **不替代 MCU。** MaixCAM 和 MCU 各司其职：MaixCAM 负责"看"，MCU 负责"控制"。
:::

## 它和 MCU 的分工

把 MCU 想象成司机，MaixCAM 想象成副驾驶：

```
MaixCAM（副驾驶，K210）：
  "前面有一个红色标记，在左侧 20cm 处"
  "黑线位置：车偏右了 5cm"
  "前方检测到停止线"

MCU（司机，STM32/MSPM0）：
  收到 "偏右了 5cm" → 计算左转纠正 → 控制电机
  收到 "红色标记" → 状态切换 → 执行对应任务
```

## 通信方式

MaixCAM 通过 **UART（串口）** 和 MCU 通信。它用文本格式发送结果：

```
数据格式（MaixCAM → MCU）：
L:120,R:80,C:1\r\n

含义：
L:120  → 黑线在画面左侧 120 像素处
R:80   → 黑线在画面右侧 80 像素处  
C:1    → 颜色标记类型 = 1（如 1=红色, 2=蓝色, 3=绿色）
\r\n   → 回车换行（包结束标志）
```

这是一个简单的文本协议——每条数据以 `\r\n` 结尾，内容用逗号分隔，字段用冒号分隔。MCU 解析这些文本就行。

## MCU 端的解析代码

```c
// ==================== maxicam.h ====================
#ifndef MAXICAM_H
#define MAXICAM_H

#include <stdint.h>

typedef struct {
    int16_t left_line;      // 左边线位置（像素），-1 = 没看到
    int16_t right_line;     // 右边线位置（像素），-1 = 没看到
    int16_t center_line;    // 中线位置（像素），-1 = 没看到
    uint8_t color_id;       // 颜色标记类型（0 = 无）
    int16_t color_x;        // 颜色标记的 X 坐标
    int16_t color_y;        // 颜色标记的 Y 坐标
} maxicam_data_t;

void maxicam_init(void);
void maxicam_parse_char(char c);
void maxicam_get_data(maxicam_data_t *data);

#endif

// ==================== maxicam.c ====================
#include "maxicam.h"
#include <string.h>
#include <stdio.h>

#define MAXICAM_BUF_SIZE    64

static char rx_buf[MAXICAM_BUF_SIZE];
static uint8_t rx_len = 0;
static maxicam_data_t g_cam_data = {0};

void maxicam_init(void) {
    // UART 初始化（波特率根据 K210 端脚本设置，通常 115200 或 921600）
    rx_len = 0;
    memset(&g_cam_data, 0, sizeof(g_cam_data));
}

// 在 UART 接收中断中逐个字符调用
void maxicam_parse_char(char c) {
    if (c == '\n') {
        // 收到一行的结束符
        if (rx_len > 0 && rx_buf[rx_len - 1] == '\r') {
            rx_buf[rx_len - 1] = '\0'; // 去掉 \r
        }
        rx_buf[rx_len] = '\0';
        
        // 解析 "L:120,R:80,C:1" 格式
        int l, r, c;
        if (sscanf(rx_buf, "L:%d,R:%d,C:%d", &l, &r, &c) == 3) {
            g_cam_data.left_line  = l;
            g_cam_data.right_line = r;
            g_cam_data.color_id   = c;
            g_cam_data.center_line = (l + r) / 2;
        }
        
        rx_len = 0; // 重置缓冲
    } else {
        // 普通字符，存入缓冲
        if (rx_len < MAXICAM_BUF_SIZE - 1) {
            rx_buf[rx_len++] = c;
        }
    }
}

void maxicam_get_data(maxicam_data_t *data) {
    *data = g_cam_data;
}

// ==================== 使用示例 ====================
void vision_line_following(void) {
    maxicam_data_t cam;
    int base_speed = 60;
    float Kp = 0.2f;
    int screen_center = 160; // 假设画面宽度 320，中点是 160
    
    while (1) {
        maxicam_get_data(&cam);
        
        if (cam.center_line > 0) {
            // 计算偏差
            int error = screen_center - cam.center_line;
            int correction = (int)(Kp * error);
            
            int left  = base_speed - correction;
            int right = base_speed + correction;
            
            // 限幅
            if (left  > 100) left  = 100;
            if (left  < -100) left  = -100;
            if (right > 100) right = 100;
            if (right < -100) right = -100;
            
            motor_a_set_speed(left);
            motor_b_set_speed(right);
        } else {
            // 没有看到线，停车或进入搜索模式
            car_stop();
        }
        
        delay_ms(20);
    }
}
```

## MaixCAM 端的程序

K210 运行自己的程序（MicroPython 或 C），和 MCU 的代码是**完全独立的**。你需要单独烧录到 K210 上。

```python
# MaixCAM 端的 MicroPython 示例（仅供参考，理解原理即可）
# 这个程序跑在 K210 上，不是跑在 MCU 上！

import sensor, image, time
from fpioa_manager import fm
from machine import UART

# 初始化摄像头
sensor.reset()
sensor.set_pixformat(sensor.RGB565)
sensor.set_framesize(sensor.QVGA)  # 320×240

# 初始化串口（连接 MCU）
fm.register(6, fm.fpioa.UART1_TX, force=True)
fm.register(7, fm.fpioa.UART1_RX, force=True)
uart = UART(UART.UART1, 115200)

while True:
    img = sensor.snapshot()
    
    # 找黑线（简化示例）
    lines = img.find_lines(threshold=1000, theta_margin=25, rho_margin=25)
    
    left_x = -1
    right_x = -1
    color_id = 0
    
    # 寻找红色标记
    blobs = img.find_blobs([(0, 50, 20, 80, -20, 40)], pixels_threshold=200)
    if blobs:
        color_id = 1  # 检测到红色
    
    # 发送给 MCU
    uart.write("L:%d,R:%d,C:%d\r\n" % (left_x, right_x, color_id))
    time.sleep_ms(20)
```

## MaixCAM 适合做什么

| 任务 | 适合度 | 说明 |
|------|--------|------|
| 道路边界检测 | ✅ 很好 | 视野广，能看远 |
| 十字路口识别 | ✅ 很好 | 灰度看不到全貌 |
| 颜色标记识别 | ✅ 很好 | 彩色摄像头天然优势 |
| 简单分类（形状等） | ✅ 好 | KPU 可以做轻量级分类 |
| 精确距离测量 | ⚠️ 一般 | 单目摄像头缺乏深度信息 |
| 替代灰度巡线 | ⚠️ 不推荐 | 灰度更简单更可靠 |

## 常见问题

::: warning 通信延迟
MaixCAM 处理一帧 + 发送数据需要 20-50ms。如果你的控制循环是 5ms（200Hz），摄像头数据每 4-10 个控制周期才更新一次。**不要用摄像头数据做高频闭环控制，它适合做"战略级"的感知（检测路口、识别标记）。**
:::

| 问题 | 原因 | 解决 |
|------|------|------|
| MCU 收不到数据 | 波特率不匹配 | 检查两端波特率一致 |
| 数据格式乱 | 文本解析有 bug | 用串口助手先看 K210 发的原始文本 |
| 画面卡顿 | K210 处理太慢 | 降低分辨率（QVGA 够用） |
| 通信断断续续 | 线太长 | 串口线 < 30cm，或降低波特率 |

---

## 小结

MaixCAM 让小车有了"眼睛"，但它解决的是"看到什么"的问题，不是"怎么走"的问题。控制决策始终在 MCU 端，摄像头数据适合做战略级感知——检测路口、识别标记——而不是高频闭环控制。

> **MaixCAM 让小车有了"眼睛"，但记住：它解决的是"看到什么"的问题，不是"怎么走"的问题。控制决策始终在 MCU 端。**
