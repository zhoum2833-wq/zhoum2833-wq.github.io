---
title: 调试器（DAP-Link / ST-Link / J-Link）
---

# 调试器（DAP-Link / ST-Link / J-Link）

你已经写好了 C 代码、编译出了 .hex 文件，接下来怎么把它"灌"进单片机？答案就是**调试器**——它不仅能烧录，还能让你在代码运行时"看到"单片机内部的状态。

## 调试器不只是"烧录"

烧录只是调试器最基本的功能。它的完整能力是**在线调试**（Debugging）：

- 下载程序到 Flash（烧录）
- 单步执行代码（一条一条跑）
- 设置断点（运行到某一行自动停下）
- 查看变量的实时值（不用 printf！）
- 查看寄存器和内存

## SWD 协议：只要两根线

现代的 ARM Cortex-M 单片机（STM32 全系列）使用 **SWD**（Serial Wire Debug）协议，只需要两根信号线：

```
调试器                       单片机
──────                      ──────
SWCLK ───────────────────→ SWCLK  （时钟）
SWDIO ───────────────────→ SWDIO  （数据，双向）
GND   ───────────────────→ GND    （共地！必须接）
      可选：
3.3V  ───────────────────→ 3.3V   （给板子供电，可选）
RESET ───────────────────→ NRST   （硬件复位，通常不接）
```

::: danger 永远记得接 GND
两个设备的 GND 必须连通！很多新手只接 SWCLK 和 SWDIO，忘了 GND，调试器连不上——因为信号没有共同的参考电平。
:::

## 三种调试器对比

| | ST-Link | DAP-Link | J-Link |
|------|---------|----------|--------|
| 生产商 | ST 官方 | ARM 开源 | Segger |
| 价格 | ¥8~30（克隆版） | ¥10~40 | ¥80~8000（正版） |
| 速度 | 快 | 中等 | 极快 |
| 支持芯片 | 仅 STM32 | 所有 Cortex-M | 几乎所有 ARM |
| 虚拟串口 | 有（V2.1 及以上） | 有 | 有（部分型号） |
| 推荐人群 | **STM32 用户首选** | 多平台、开源爱好者 | 专业开发、量产 |

## 到底买哪个？

```
你用的是 STM32？ ──是──→ 买 ST-Link V2（¥10 包邮）
  │
  否（GD32 / MM32 / MSPM0 等）
  │
  └──→ 买DAP-Link（通用型，¥15~30）
```

::: tip 避坑指南
- **ST-Link 克隆版**（¥10 左右）足够电赛使用。官方 ST-Link/V3 要 ¥200+，没必要。
- **J-Link OB**（板载版，¥30~50）性能不错，但克隆 J-Link 在某些新版 Keil/IAR 上会被封。
- **DAP-Link** 最大的好处是开源 + 跨平台——CMSIS-DAP 协议在 Windows/Linux/Mac 上都原生支持。
:::

## 在 CubeMX / IDE 里使用

无论你用 Keil、IAR、CubeIDE 还是 VS Code + Cortex-Debug 插件，配置步骤都一样：

1. 调试器通过 USB 连接电脑（Windows 上可能需要装驱动——ST-Link 要装 STSW-LINK009）
2. 调试器的 SWCLK / SWDIO / GND 三条线接到单片机
3. IDE 里选择调试器类型（ST-Link / CMSIS-DAP / J-Link）
4. 点击 Debug / 下载

::: tip SWD 引脚被占用怎么办
CubeMX 默认把 SWD 引脚（PA13=SWDIO, PA14=SWCLK）配置为调试口。如果你在 CubeMX 的 SYS 里把 Debug 设为 "No Debug"，这两个引脚就变成普通 GPIO 了——**烧完这次就再也连不上了！** 除非用 RESET 脚配合 BOOT0 进入系统 Bootloader 擦除。**新手千万别关 SWD。**
:::

## 常见连接问题

| 现象 | 原因 | 解决 |
|------|------|------|
| "No target connected" | 线接错了/没接 GND | 检查 SWCLK/SWDIO/GND 三根线 |
| "Target voltage not detected" | 调试器检测不到板子电压 | 检查板子是否上电，或者调试器的 VCC 检测脚是否接了 |
| 能下载不能调试 | SWD 频率太高 | 降低 SWD 频率（从 4MHz 降到 1MHz） |
| 之前能连，突然不能连了 | 程序把 SWD 引脚关了 / 芯片进了低功耗 | 按住 RESET + 点击下载 + 松开 RESET |
| "Cannot access memory" | 芯片被锁了（读保护 RDP Level 1） | STM32CubeProgrammer 里解除读保护（会擦除整个芯片） |

## 小结

调试器是你和单片机之间的翻译官。ST-Link（¥10）是 STM32 用户的最佳选择，DAP-Link（¥15~30）是跨平台的通用方案。接三根线（SWCLK/SWDIO/GND），设好 IDE，点 Debug 就能单步看代码。**永远不要关 SWD 引脚**，永远记得接 GND。

---

# 第三篇：开发工具与工程结构