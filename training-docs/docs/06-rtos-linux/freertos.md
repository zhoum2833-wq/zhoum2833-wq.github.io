---
title: FreeRTOS — 单片机上最流行的实时操作系统
---

# FreeRTOS — 单片机上最流行的实时操作系统

FreeRTOS 是目前使用最广泛的嵌入式实时操作系统。它开源、免费、轻量（最小只需要几 KB ROM 和几百字节 RAM），几乎所有主流单片机都支持。用 STM32CubeMX 勾选一个选项就能集成，非常方便。

## 核心概念一：任务（Task）

一个任务就是一个**拥有自己栈空间的无限循环函数**。你写任务的方式和写裸机 `while(1)` 很像——区别是你可以同时跑多个任务。

```c
// 任务1：每 500ms 翻转 LED1
void Task_LED1(void *argument) {
    while (1) {
        HAL_GPIO_TogglePin(GPIOC, GPIO_PIN_13);
        vTaskDelay(500);  // 休眠 500ms，让出 CPU 给其他任务
    }
}

// 任务2：每 300ms 翻转 LED2
void Task_LED2(void *argument) {
    while (1) {
        HAL_GPIO_TogglePin(GPIOC, GPIO_PIN_14);
        vTaskDelay(300);  // 休眠 300ms
    }
}
```

这两个任务**看上去同时运行**——LED1 每 500ms 闪一次，LED2 每 300ms 闪一次。实际上 CPU 在它们之间快速切换：LED1 任务调用 `vTaskDelay()` 时，调度器立刻切换到 LED2 任务。两个任务谁也不会阻塞谁。

::: tip
`vTaskDelay(500)` 和 `HAL_Delay(500)` 的区别：`HAL_Delay()` 让 CPU 在原地空转 500ms，什么事都不做——这叫**忙等**。`vTaskDelay()` 把当前任务挂起 500ms，CPU 在这期间去执行其他任务——这叫**睡眠**。前者浪费 CPU，后者充分利用 CPU。
:::

## 核心概念二：调度器（Scheduler）

调度器是 FreeRTOS 的核心——它决定"下一个该跑哪个任务"。它采用的是**抢占式优先级调度**：

- 每个任务有一个优先级（数字越大优先级越高）
- 高优先级任务**随时可以抢占**低优先级任务
- 同优先级任务**时间片轮转**（每人跑一小段时间，轮流）

```
时间轴示例（三个任务，优先级 A > B > C）：
    A: ████               ████
    B:      ██      ████
    C:         ████
    
解释：
· 任务 A 就绪时，立刻抢占 B 和 C
· 任务 A 休眠时，B 执行
· 没有 A 和 B 时，C 执行
```

创建任务的典型代码：

```c
// 在 main() 中创建任务
TaskHandle_t LED1_Handle;
xTaskCreate(
    Task_LED1,          // 任务函数
    "LED1",             // 任务名字（调试用）
    128,                // 栈大小（字）
    NULL,               // 参数（不需要传 NULL）
    2,                  // 优先级
    &LED1_Handle        // 任务句柄（可选）
);

TaskHandle_t LED2_Handle;
xTaskCreate(Task_LED2, "LED2", 128, NULL, 1, &LED2_Handle);

// 启动调度器 —— 这之后 main() 不再往下执行！
vTaskStartScheduler();

// 下面的代码永远不会执行到
while (1) {}
```

## 核心概念三：队列（Queue）

队列是任务之间**安全传递数据**的通道。想象一条传送带——任务 A 把数据放上去，任务 B 从另一头取下来。

```c
// 创建一个能装 10 个 float 的队列
QueueHandle_t xQueue = xQueueCreate(10, sizeof(float));

// 任务 A：发送数据
void Task_Sensor(void *argument) {
    float temperature;
    while (1) {
        temperature = read_temperature();         // 读温度传感器
        xQueueSend(xQueue, &temperature, 0);      // 放入队列
        vTaskDelay(100);                           // 100ms 读一次
    }
}

// 任务 B：接收并处理数据
void Task_Display(void *argument) {
    float value;
    while (1) {
        // 等待队列里有数据（阻塞等待，期间 CPU 跑别的任务）
        if (xQueueReceive(xQueue, &value, portMAX_DELAY) == pdTRUE) {
            // 收到数据，显示在屏幕上
            display_temperature(value);
        }
    }
}
```

::: warning
**为什么用队列而不是全局变量？** 全局变量在多任务环境下非常危险——任务 A 写到一半，任务 B 来读，可能读到不完整的数据。队列内部有保护机制，保证"放进去"和"取出来"的操作是原子的（不可打断的），不会出现数据损坏。
:::

## 核心概念四：信号量（Semaphore）

信号量是一个**同步标志**。经典用法是：一个任务等待信号量（阻塞），另一个任务在条件满足时释放信号量（唤醒等待者）。

```c
SemaphoreHandle_t xSemaphore;

// 任务 A：等待数据准备好
void Task_Process(void *argument) {
    while (1) {
        // 阻塞等待 —— 没信号时挂起，不消耗 CPU
        if (xSemaphoreTake(xSemaphore, portMAX_DELAY) == pdTRUE) {
            // 数据准备好了，开始处理
            process_data();
        }
    }
}

// 任务 B（或中断）：数据准备好了，发信号
void DataReady_Callback(void) {
    // 释放信号量 —— 唤醒等待的任务 A
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;
    xSemaphoreGiveFromISR(xSemaphore, &xHigherPriorityTaskWoken);
}
```

信号量的生活类比：你在餐厅等位（任务 A 阻塞），服务员给你一个震动呼叫器（信号量）。菜准备好了（条件满足），厨房按按钮，你的呼叫器震动（释放信号量），你就知道可以去取餐了（任务 A 被唤醒）。期间你不需要一直站在柜台前等着。

## 竞赛小车实战示例

一个小车系统可以拆成三个任务：

```c
// 任务 1：巡线控制（最高优先级，必须准时执行）
void Task_LineFollow(void *argument) {
    while (1) {
        read_line_sensors();     // 读红外传感器数组
        compute_pid();           // 计算偏差和 PID 输出
        set_motor_speed();       // 输出到电机
        vTaskDelay(1);           // 1ms 一个周期 = 1kHz 控制频率
    }
}

// 任务 2：遥测发送（中优先级）
void Task_Telemetry(void *argument) {
    while (1) {
        send_vofa_frame();       // 打包并发送数据到 Vofa+
        vTaskDelay(10);          // 每 10ms 发一帧
    }
}

// 任务 3：紧急停止检测（最高优先级，安全第一！）
void Task_Emergency(void *argument) {
    while (1) {
        if (emergency_button_pressed()) {
            motor_emergency_stop();  // 立即停电机
            while (1) {
                vTaskDelay(1000);    // 卡在这里，等人工复位
            }
        }
        vTaskDelay(5);  // 每 5ms 检查一次
    }
}
```

三个任务各跑各的，互不干扰。巡线任务每 1ms 执行一次，遥测任务每 10ms 发一帧，紧急停止任务每 5ms 检查一次。切换全由 FreeRTOS 调度器自动完成。

## 与裸机对比

| 特性 | 裸机 | FreeRTOS |
|------|------|----------|
| 多任务 | 手动安排，混乱 | 自动调度，清晰 |
| 延时 | `HAL_Delay()` 忙等 | `vTaskDelay()` 让出 CPU |
| 任务间通信 | 全局变量（不安全） | 队列（安全） |
| 同步 | 标志位 | 信号量、互斥锁 |
| 代码复杂度 | 简单项目低，复杂项目高 | 各项目中等 |
| ROM 占用 | 最小 | 增加 6~12 KB |
| RAM 占用 | 最小 | 增加几 KB |

## 小结

FreeRTOS 的核心只有四个概念：**任务**（独立的执行单元）、**调度器**（决定谁运行）、**队列**（传递数据）、**信号量**（同步事件）。掌握这四个概念，就能用 FreeRTOS 把复杂的小车控制程序写得干净利落。
