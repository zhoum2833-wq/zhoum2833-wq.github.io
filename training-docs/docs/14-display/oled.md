---
title: OLED 屏（I2C/SPI）
---

# OLED 屏（I2C/SPI）

## 为什么需要屏幕

串口打印在电脑上看没问题，但你不能每次都开着电脑看数据。在比赛现场——或者你的小车在跑的时候——有一块小屏幕实时显示**传感器值、电池电压、当前状态**，调试效率直接翻倍。

## 0.96 寸 SSD1306 OLED

这是嵌入式世界里最常见的显示屏，99% 的电赛选手第一块屏幕就是它。

| 参数 | 值 |
|------|-----|
| 尺寸 | 0.96 英寸 |
| 分辨率 | 128×64 像素 |
| 颜色 | 单色（蓝/白/黄蓝双色） |
| 驱动芯片 | SSD1306 |
| 接口 | I2C 或 SPI |
| 工作电压 | 3.3V |
| 价格 | ¥5~10 |

## I2C vs SPI 版本

| | I2C 版本 | SPI 版本 |
|------|---------|----------|
| 引脚数 | 4 根（VCC GND SCL SDA） | 7 根 |
| 刷新速度 | 较慢 | 快 |
| 占用 MCU 资源 | 少 | 多 |
| 推荐 | ✅ 引脚紧张时首选 | 需要高频刷新时用 |

::: tip 新手推荐
买 **I2C 版本的 SSD1306 模块**（蓝色小方块，4 个引脚）。引脚少、接线简单。I2C 地址默认 0x3C，扫描 I2C 设备时看到它就对了。
:::

## 接线

```
STM32                SSD1306 (I2C)
───────              ──────────
3.3V  ───────────── VCC
GND   ───────────── GND
PB6(SCL) ────────── SCL
PB7(SDA) ────────── SDA
```

## 代码示例（STM32 HAL + u8g2）

```c
// 初始化 I2C（CubeMX 配置好 I2C1）
// 使用 u8g2 库（最流行的单色屏图形库）

#include "u8g2.h"

u8g2_t u8g2;

// 初始化函数（回调送数据到 I2C）
uint8_t u8x8_byte_hw_i2c(u8x8_t *u8x8, uint8_t msg, uint8_t arg_int, void *arg_ptr) {
    switch (msg) {
        case U8X8_MSG_BYTE_SEND:
            HAL_I2C_Master_Transmit(&hi2c1, 0x3C << 1, arg_ptr, arg_int, 100);
            break;
        case U8X8_MSG_BYTE_INIT:
        case U8X8_MSG_BYTE_SET_DC:
        case U8X8_MSG_BYTE_START_TRANSFER:
        case U8X8_MSG_BYTE_END_TRANSFER:
            break;
    }
    return 0;
}

// 在 main() 中
u8g2_Setup_ssd1306_i2c_128x64_noname_f(&u8g2, U8G2_R0, u8x8_byte_hw_i2c, NULL);
u8g2_InitDisplay(&u8g2);
u8g2_SetPowerSave(&u8g2, 0);  // 唤醒屏幕

// 画东西
u8g2_ClearBuffer(&u8g2);
u8g2_SetFont(&u8g2, u8g2_font_6x10_tf);
u8g2_DrawStr(&u8g2, 0, 10, "Hello 电赛!");
u8g2_DrawStr(&u8g2, 0, 30, "Speed: 100");
u8g2_SendBuffer(&u8g2);  // 一次性刷新到屏幕
```

## OLED 在电赛里的典型用法

- **显示实时数据**：速度、位置、传感器值
- **显示系统状态**：当前模式（巡线/避障/停车）
- **参数调试界面**：按键翻页，修改 PID 参数
- **错误提示**：陀螺仪初始化失败？电机堵转？屏幕上直接显示

::: tip
屏幕刷新不要放 while(1) 里每循环一次刷一次——那会严重拖慢主循环。建议用定时器中断，每 100ms 刷新一次屏幕。
:::

## 小结

一块 5 块钱的 OLED 屏，加上 u8g2 库，15 行代码就能让你的小车"开口说话"。I2C 版本接线最少，推荐作为你的第一块显示屏。
