---
title: DMA — 让数据自己搬家
---

# DMA — 让数据自己搬家

## 生活类比：快递员 vs 亲自搬

你在家工作，需要从仓库（外设）搬 1000 箱货物（数据）到办公室（RAM）。没有快递员时，你必须亲自一趟一趟搬——每趟只能搬一箱，仓库到办公室来回 1000 次。有快递员（DMA）时，你只需要告诉快递员："从仓库搬 1000 箱到办公室，搬完了叫我。"然后你继续工作，等快递员通知你。

DMA（Direct Memory Access，直接存储器访问）就是单片机里的这个"快递员"——它专门负责搬运数据，让 CPU 腾出手来做更重要的事。

## 有无 DMA 的数据路径对比

### 没有 DMA（CPU 亲自搬）

```
UART 数据寄存器（1 字节）
        │
        ▼
    [CPU 读]
        │
        ▼
    [CPU 写]
        │
        ▼
   RAM 数组（1000 字节）

每 1 个字节 → CPU 中断 1 次 → CPU 做 1 次搬运
共 1000 次 CPU 中断
```

### 有 DMA（快递员搬）

```
UART 数据寄存器（1 字节）
        │
        ▼
      [DMA]  ← 你设置好源地址、目标地址、搬运次数
        │
        ▼
   RAM 数组（1000 字节）

DMA 自动搬 1000 字节，全部搬完后通知 CPU 1 次
CPU 全程空闲，可以做计算
```

::: tip
**省下了什么？** 没有 DMA 时，1000 字节的数据接收需要 CPU 进出中断 1000 次——每次进中断都要保存和恢复现场，开销巨大。有了 DMA，这些开销全部省掉，CPU 可以专注做姿态解算、PID 控制等重要计算。
:::

## DMA 是怎么工作的

配置 DMA 就是告诉它三件事：

1. **从哪搬**（源地址）——比如 UART 数据寄存器 `&USART1->DR`
2. **搬到哪**（目标地址）——比如你的接收数组 `&rx_buffer[0]`
3. **搬多少**（传输次数）——比如 1000 次

然后 DMA 就在后台默默工作，每搬完一个数据，传输计数减一。计数归零时，DMA 可以触发一个中断通知 CPU："搬完了！"

```c
// DMA 初始化示例：ADC 连续采样 + DMA 搬运到数组
#define ADC_BUFFER_SIZE 100
uint16_t adc_buffer[ADC_BUFFER_SIZE];  // DMA 会把 ADC 数据搬到这里

void ADC_DMA_Init(void) {
    // 1. 使能 DMA 时钟
    __HAL_RCC_DMA1_CLK_ENABLE();

    // 2. 配置 DMA 句柄
    DMA_HandleTypeDef hdma_adc;
    hdma_adc.Instance = DMA1_Channel1;           // 使用 DMA1 通道1
    hdma_adc.Init.Direction = DMA_PERIPH_TO_MEMORY; // 方向：外设 → 内存
    hdma_adc.Init.PeriphInc = DMA_PINC_DISABLE;  // 外设地址不变
    hdma_adc.Init.MemInc = DMA_MINC_ENABLE;      // 内存地址自增
    hdma_adc.Init.PeriphDataAlignment = DMA_PDATAALIGN_HALFWORD;
    hdma_adc.Init.MemDataAlignment = DMA_MDATAALIGN_HALFWORD;
    hdma_adc.Init.Mode = DMA_CIRCULAR;           // 循环模式！
    hdma_adc.Init.Priority = DMA_PRIORITY_HIGH;
    HAL_DMA_Init(&hdma_adc);

    // 3. 关联 DMA 到 ADC
    __HAL_LINKDMA(&hadc1, DMA_Handle, hdma_adc);

    // 4. 启动 ADC + DMA
    HAL_ADC_Start_DMA(&hadc1, (uint32_t*)adc_buffer, ADC_BUFFER_SIZE);
}
```

这段代码的效果：ADC 每完成一次转换，DMA 就自动把结果搬到 `adc_buffer` 数组的下一个位置。搬完 100 个数据后，DMA 自动回到数组开头继续搬（循环模式）。CPU 在整个过程中零参与——它只需要在需要的时候去读 `adc_buffer` 里的最新数据。

## DMA 请求来源

不同的外设可以触发不同的 DMA 传输：

| DMA 请求来源 | 典型应用 |
|-------------|----------|
| ADC 转换完成 | 高速连续采样（如电流检测） |
| UART 收到数据 | 大批量数据接收（如 GPS 模块） |
| UART 发送完成 | 大批量数据发送（如遥测数据上传） |
| 定时器溢出 | 周期性触发搬运 |
| SPI 收发完成 | 传感器数据批量读取 |

## 常见陷阱：数据一致性问题

::: danger
**DMA 和 CPU 同时访问同一块内存时，可能读到"半新半旧"的数据。**

比如：DMA 正在把 ADC 的新数据写入 `adc_buffer[5]`，写入只完成了一半（假设是 16 位数据，DMA 才写了高 8 位）。此时 CPU 来读 `adc_buffer[5]`，读到的是一个不完整、无效的值——高 8 位是新的，低 8 位是旧的。

**解决方案**：
1. 使用**双缓冲**：DMA 往缓冲区 A 写，CPU 读缓冲区 B；写完交换。
2. 只在 DMA 传输完成中断里处理数据（此时 DMA 已经停止写那个位置）。
3. 使用 `__DSB()` 等内存屏障指令确保数据写入完成后再读。

```c
// 双缓冲示例
uint16_t adc_buf_a[100];
uint16_t adc_buf_b[100];
uint16_t *dma_buf = adc_buf_a;    // DMA 正在写这块
uint16_t *cpu_buf = adc_buf_b;    // CPU 正在处理这块
// DMA 传输完成中断里交换两个指针
```

## 循环模式 vs 普通模式

| 模式 | 行为 | 适用场景 |
|------|------|----------|
| 普通模式 | 搬完设定次数后停止 | 一次性的数据接收 |
| 循环模式 | 搬完从头再来，永不停止 | ADC 连续采样、波形采集 |

## 小结

DMA 是单片机的"数据搬运快递员"。配置源地址、目标地址、搬运次数后，它自动工作，搬运完成通知 CPU。ADC 连续采样和 UART 大批量数据收发是 DMA 最经典的应用场景。注意数据一致性问题——DMA 和 CPU 不能同时写同一块内存。
