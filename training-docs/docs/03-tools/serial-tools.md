---
title: 串口监视与辅助工具
---

# 串口监视与辅助工具

## 你调试时怎么"看见"单片机内部？

单片机没有屏幕。你在 `main.c` 里写了一大堆控制逻辑，但它到底在干什么？速度是多少？误差有多大？PID 输出有没有超限？

很多人用 `printf` 打印变量值。这个方法有两个致命缺陷：
1. **太慢**：一次 `printf` 可能花几百微秒甚至毫秒。在 20ms 的控制周期里插 3 行 `printf`，控制就乱套了
2. **只能看数字**：一行行数字滚动，你无法直观感受到速度曲线的变化

4WD_Car 用 **VOFA+** 做遥测，用 **Python 脚本**做离线辅助。这一节介绍这些工具。

## VOFA+：给你一个"仪表盘"

[VOFA+](https://www.vofa.plus/) 是一个免费的串口调试与数据可视化工具。它支持多种数据协议，4WD_Car 用的是 **JustFloat** 协议——一种极高效的二进制传输格式。

### JustFloat 协议

原理很简单：要发送 12 个 `float` 数据（比如 4 路速度 + 4 路编码器 + 3 个 IMU 角度 + 1 个状态码），只需要发：

```
<float[0]><float[1]>...<float[11]><tail>
```

每个 `float` 占 4 个字节，加上尾部校验，一共 12 × 4 + 4 = 52 字节。通过蓝牙串口（USART6, 115200 波特率）发出去只要约 4ms——对 20ms 的控制周期几乎没有影响。

相比之下，用 `printf` 打印 12 个浮点数需要发送几百个 ASCII 字符，耗时是 JustFloat 的几十倍。

### 4WD_Car 的 VOFA 配置

在 `bsp_vofa.c` 中，`Vofa_SendFloats()` 函数把 12 个 float 打包成 JustFloat 格式发送：

```c
// 遥测 12 通道
vofa_ch[0]  = (float)spd_a;   // 电机 A 速度
vofa_ch[1]  = (float)spd_b;   // 电机 B 速度
vofa_ch[2]  = (float)spd_c;   // 电机 C 速度
vofa_ch[3]  = (float)spd_d;   // 电机 D 速度
vofa_ch[4]  = pose.x;         // 位姿 X
vofa_ch[5]  = pose.y;         // 位姿 Y
vofa_ch[6]  = pose.heading;   // 航向角
vofa_ch[7]  = pose.conf;      // 置信度
vofa_ch[8]  = (float)target;  // 当前目标点
vofa_ch[9]  = (float)state;   // 状态机状态
vofa_ch[10] = (float)progress; // 进度
vofa_ch[11] = (float)busy;    // 忙标志

Vofa_SendFloats(vofa_ch, 12);
```

在电脑端 VOFA+ 里，选择 JustFloat 协议，你能同时看到 12 条波形曲线——电机加速的过程、转弯时速度差的变化、IMU 航向角的收敛、编码器反馈的跟随……一目了然。

### 混用文本模式

JustFloat 传数据，偶尔也需要传文本——打印调试信息、PID 调参结果。`bsp_vofa.c` 也支持文本发送：

```c
Vofa_SendString("\r\n===== PID Auto-Tune Results =====\r\n");
Vofa_SendString("A: Kp=1.23 Ki=0.45 Kd=0.08\r\n");
```

VOFA+ 能自动区分 JustFloat 和文本混用——数据通道显示波形，文本显示在日志区。

## Python 辅助脚本

有些任务在单片机上根本做不了——比如训练神经网络、批量处理图片、数据可视化。这些交给 Python 脚本，放在 `tools/` 目录。

### 数据采集 capture_data.py

4WD_Car 的 Maxicam Pro 摄像头需要识别数字 1-4。训练模型首先需要数据。`capture_data.py` 连接 Maxicam，循环拍照保存到 `data/dataset/`：

```
data/dataset/
├── 1/  ← 100+ 张数字"1"的图片
├── 2/  ← 100+ 张数字"2"的图片
├── 3/
└── 4/
```

### 模型训练 train_model.py

图片够多了，用 PyTorch 训练一个轻量 CNN 分类器：

```bash
python tools/train_model.py
```

脚本会自动加载 dataset、训练、保存 `.pt` 权重文件。训练过程输出 loss 曲线和准确率——这些单靠 C 代码做不到。

### 模型导出 export_onnx.py

训练好的 `.pt` 文件不能在 Maxicam 上直接用。需要转成 ONNX 再编译为 Maxicam 的 `.maixcam` 格式：

```bash
python tools/export_onnx.py
# 然后用 MaixPy 官方工具转 .maixcam
```

### 整个 Python 工具链的流程

```
capture_data.py → 采集图片 → data/dataset/
train_model.py → 训练 CNN → data/model_weights.pth
export_onnx.py → 导出 ONNX → data/digit_cnn.onnx
官方转换工具   → 编译模型 → data/models/*.maixcam
                                             ↓
                              烧录到 Maxicam Pro 运行
```

### 其他辅助脚本

| 脚本 | 用途 |
|------|------|
| `diagnose.py` | 诊断 Maxicam 的 API 兼容性 |
| `generate_data.py` | 程序化生成训练数据（渲染数字字体） |
| `label_data.py` | 手工标注采集图片 |
| `review_data.py` | 检查标注质量 |
| `api_probe.py` | 探测 Maxicam 上可用的 Python API |

## Maxicam Pro 视觉模块

4WD_Car 使用 Sipeed Maxicam Pro 做视觉处理。关键的架构决策——**视觉和主控是分离的**：

- **Maxicam Pro**：运行 MaixPy（Python 3.11），负责图像采集、色块检测、数字识别
- **STM32F407**：接收视觉结果（通过 USART3），负责电机控制、导航决策

为什么要分开？因为 STM32F407 没有 NPU，跑 CNN 太慢。Maxicam 有专用的 AI 加速器，做图像识别又快又省电。

**"术业有专攻"——让擅长 AI 的芯片做 AI，让擅长实时控制的芯片做控制。**

两者通过 UART 通信（115200 波特率），Maxicam 定时发送识别结果：

```
巡线模式: "L:<left_x>,R:<right_x>,C:<cross_y>\r\n"
数字识别: "N:<digit>,D:<confidence>\r\n"
```

STM32 端的 `bsp_camera.c` 用 `Camera_FeedByte()` 逐字节接收并解析——协议简单可靠。

## 小结

嵌入式调试的核心难题是"看不见单片机内部"。VOFA+ 用高速二进制遥测解决了实时监视的问题；Python 脚本解决了离线处理（数据采集、模型训练）的问题；Maxicam + STM32 的分工解决了"视觉 AI vs 实时控制"的架构问题。**好的工具让人事半功倍，而且让调试从"盲调"变成"看仪表盘开车"。**

---

# 第四篇：通信协议

<!-- @chapter: 第四篇：通信协议 -->