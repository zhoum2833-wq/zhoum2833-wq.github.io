---
title: SPI —— 高速全双工通信
---

# SPI —— 高速全双工通信

## 什么是 SPI？

**SPI**（Serial Peripheral Interface，串行外设接口）是 Motorola 公司发明的一种高速串行通信协议。和 I2C 不同，SPI 的核心理念是一个字——**快**。

SPI 用**四根线**（至少）实现通信：

| 信号线 | 全称 | 方向 | 作用 |
|--------|------|------|------|
| **SCK** | Serial Clock | 主机 → 从机 | 时钟线，主机提供节拍 |
| **MOSI** | Master Out Slave In | 主机 → 从机 | 主机发送数据给从机 |
| **MISO** | Master In Slave Out | 从机 → 主机 | 从机发送数据给主机 |
| **NSS / CS** | Slave Select / Chip Select | 主机 → 从机 | 片选信号，"现在轮到你了！" |

::: tip 改名字了
近年来很多厂商把 MOSI 改叫 COPI（Controller Out Peripheral In），MISO 改叫 CIPO。这是为了避开"Master/Slave"术语，用"Controller/Peripheral"替代。你可能会在新数据手册上看到这些新名字——它们是同一个东西。
:::

## 全双工：同时说话和听话

SPI 和 I2C、UART 最大的区别是**全双工**（Full Duplex）：

- **UART**：全双工（两根独立的 TX 和 RX 线，可以同时收发）。  
- **I2C**：半双工（只有一根数据线 SDA，说话和听话只能轮流来）。  
- **SPI**：全双工（两根独立的数据线 MOSI 和 MISO，可以同时收发）。

可以这样理解：I2C 是 walkie-talkie（对讲机），你说完一句等对方回应；SPI 是电话，你可以同时说和听。

全双工的优势：在同一个时钟周期内，主机通过 MOSI 发一个 bit 给从机，同时通过 MISO 从从机收一个 bit。效率翻倍。

## 片选信号：多从机的解决方案

I2C 用地址来区分不同的从机。SPI 不用地址，而是用**片选信号**（Chip Select，CS）：每个从机独占一根 CS 线。

```
MCU (主机)
 ├── SCK  ──────────────────────┬────────────┬────────────
 ├── MOSI ──────────────────────┬────────────┬────────────
 ├── MISO ──────────────────────┬────────────┬────────────
 │                              │            │
 ├── CS1 ──────────────── 从机1（SPI Flash）
 ├── CS2 ──────────────── 从机2（SPI LCD）
 └── CS3 ──────────────── 从机3（SPI ADC）
```

通信过程：当主机要和从机 1 通信时，把 CS1 拉低（从高电平变成低电平），然后开始在 SCK/MOSI/MISO 上传输数据。其他从机看到自己的 CS 线保持高电平，就完全忽略总线上的数据。

**CS 信号是低电平有效**（Active Low）——空闲时是高电平，选中设备时拉低。在数据手册上通常记作 `NSS`（前面的 N 表示 Not，即"反逻辑"）或 `CS` 上面加一条横线。

## SPI 的四种模式（CPOL 和 CPHA）

SPI 有一个让新手头疼的概念：**时钟极性和相位**，组合出 4 种工作模式。

- **CPOL**（Clock Polarity，时钟极性）：空闲时 SCK 是什么电平？0 = 低电平，1 = 高电平。
- **CPHA**（Clock Phase，时钟相位）：在 SCK 的第几个边沿采样数据？0 = 第一个边沿，1 = 第二个边沿。

四种模式：

| 模式 | CPOL | CPHA | 空闲时 SCK | 采样边沿 |
|------|------|------|-----------|---------|
| Mode 0 | 0 | 0 | 低 | 上升沿（第一个边沿） |
| Mode 1 | 0 | 1 | 低 | 下降沿（第二个边沿） |
| Mode 2 | 1 | 0 | 高 | 下降沿（第一个边沿） |
| Mode 3 | 1 | 1 | 高 | 上升沿（第二个边沿） |

::: tip 99% 的情况用 Mode 0 或 Mode 3
**Mode 0**（CPOL=0, CPHA=0）是最常用的。**Mode 3**（CPOL=1, CPHA=1）也挺常见。如果你不确定设备用哪种模式，查它的数据手册里 SPI 时序图，看 SCK 空闲时是高是低、数据在哪个边沿采样。
:::

比如说你有一个 SPI LED 显示屏（u8g2 库驱动的那种），它大概率要求 Mode 0。一个 SPI Flash 存储器，可能是 Mode 0 或 Mode 3。

## SPI 的数据传输时序（Mode 0）

下面是一次完整的 SPI 字节传输（Mode 0）的时序图：

```
NSS: ‾‾‾\_______________________________________/‾‾‾‾‾
       空闲选中                                  释放

SCK: ____/‾\__/‾\__/‾\__/‾\__/‾\__/‾\__/‾\__/‾\____
        ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑
        │  每个上升沿：主机和从机都采样对方的数据
        │
        第一个边沿：数据被采样

MOSI: ___X__D7_X__D6_X__D5_X__D4_X__D3_X__D2_X__D1_X__D0_X___
          ↑          ↑
          主机每次在下降沿改变数据，上升沿被从机采样

MISO: ___X__D7_X__D6_X__D5_X__D4_X__D3_X__D2_X__D1_X__D0_X___
          ↑          ↑
          从机也在同时发送数据给主机
```

在 Mode 0 下：
- SCK 空闲时是低电平。
- 主机在每个 SCK 的**下降沿**改变 MOSI 上的数据。
- 主机和从机都在 SCK 的**上升沿**采样数据。
- 8 个时钟周期后，双方都收/发了 1 个字节。

注意：MOSI 和 MISO 上同时在进行数据传输——主机在发字节给从机的同时，也在收从机发来的字节。这就是全双工。

## SPI 的实际应用

SPI 因为速度快，常用于需要大量数据传输的场景：

- **SPI OLED/LCD 显示屏**：用 u8g2 等图形库驱动。SPI 的速度让屏幕刷新不卡顿。
- **SD 卡**：读写大文件需要 SPI 的高速能力。
- **高速 ADC（模数转换器）**：采集高速模拟信号（比如音频、振动）。
- **SPI Flash 存储器**：存储大量数据（字体、图片、日志）。
- **SPI LED 驱动芯片**（如 WS2812 的 SPI 模拟方式）。

## STM32 HAL 库中的 SPI 配置

```c
// CubeMX 生成的 SPI 初始化代码（Mode 0 示例）
hspi1.Instance = SPI1;
hspi1.Init.Mode = SPI_MODE_MASTER;              // 主机模式
hspi1.Init.Direction = SPI_DIRECTION_2LINES;    // 双线全双工
hspi1.Init.DataSize = SPI_DATASIZE_8BIT;        // 8 位数据
hspi1.Init.CLKPolarity = SPI_POLARITY_LOW;      // CPOL = 0（空闲低电平）
hspi1.Init.CLKPhase = SPI_PHASE_1EDGE;          // CPHA = 0（第一个边沿采样）
hspi1.Init.NSS = SPI_NSS_SOFT;                  // 软件控制 CS
hspi1.Init.BaudRatePrescaler = SPI_BAUDRATEPRESCALER_16;  // 时钟分频
hspi1.Init.FirstBit = SPI_FIRSTBIT_MSB;         // 高位先发
hspi1.Init.CRCPolynomial = 7;                   // CRC 多项式（一般不用）
if (HAL_SPI_Init(&hspi1) != HAL_OK)
{
    Error_Handler();
}
```

## 代码示例：SPI 收发一个字节

```c
// 通过 SPI 发送一个字节，同时接收一个字节
uint8_t SPI_TransferByte(SPI_HandleTypeDef *hspi, uint8_t tx_data)
{
    uint8_t rx_data;

    // 拉低 CS 选中从机
    HAL_GPIO_WritePin(SPI1_CS_GPIO_Port, SPI1_CS_Pin, GPIO_PIN_RESET);

    // 收发一个字节（阻塞方式）
    HAL_SPI_TransmitReceive(hspi, &tx_data, &rx_data, 1, 100);
    // 参数：句柄, 发送数据指针, 接收数据指针, 数据长度, 超时时间

    // 拉高 CS 释放从机
    HAL_GPIO_WritePin(SPI1_CS_GPIO_Port, SPI1_CS_Pin, GPIO_PIN_SET);

    return rx_data;
}
```

::: warning CS 引脚必须用 GPIO 控制
大部分情况下，CS 引脚不是 SPI 外设自动控制的，而是你**手动用 GPIO 拉低/拉高**。CubeMX 里可以给 CS 引脚配置为 `GPIO_Output`，然后在代码里手动操作。这在 HAL 库里叫 **Software NSS** 模式（`SPI_NSS_SOFT`）。硬件 NSS（外设自动控制）在某些场景下有时序问题，软件控制更灵活。
:::

## SPI 的优缺点总结

| 优点 | 缺点 |
|------|------|
| 速度快（可达几十 MHz） | 引脚多（至少 4 根 + 每个从机多一根 CS） |
| 全双工，同时收发 | 没有标准协议层（不像 I2C 有地址/ACK 机制） |
| 硬件实现简单 | 没有应答确认（发送方不知道收没收到） |
| 没有地址冲突问题 | 不适合太多从机（CS 引脚不够用） |

## 小结

SPI 是速度最快的常用嵌入式通信协议，四根线实现全双工通信。它不用地址，靠 CS 引脚选中从机。需要高速传输的场景请选 SPI。记住四个信号：SCK（时钟节拍）、MOSI（主机发给从机）、MISO（从机发给主机）、CS（叫谁谁应答）。
