---
title: "Hello World · 博客上线"
date: 2024-01-15
lastmod: 2024-01-15
author: "zhoum2833"
description: "第一篇博客，介绍这个技术笔记网站的搭建思路和写作计划。"
tags: ["Hugo", "GitHub Pages", "博客"]
categories: ["技术杂谈"]
showToc: true
TocOpen: true
draft: false
---

## 为什么写博客

作为一个嵌入式软件工程师，在工作和学习过程中总会踩到各种各样的坑。有的坑 Google 一搜就有答案，有的坑则需要反复试错才能爬出来。

写博客的目的很简单：

1. **记录踩坑经验** — 下次遇到同样的问题，不再重新搜索
2. **整理知识体系** — 写作是最好的思考方式
3. **分享给同行** — 也许某个陌生人正因为你的文章解决了问题

## 技术栈选择

| 组件 | 选择 | 原因 |
|------|------|------|
| 框架 | Hugo | Go 编写，构建速度极快 |
| 主题 | PaperMod | 简洁、暗黑模式、响应式 |
| 托管 | GitHub Pages | 免费、HTTPS、CDN |
| 部署 | GitHub Actions | 自动构建、无需服务器 |
| 评论 | giscus | 基于 GitHub Discussions |

## 代码高亮测试

```c
// STM32 GPIO 初始化示例
#include "stm32f4xx_hal.h"

void GPIO_Init(void) {
    __HAL_RCC_GPIOA_CLK_ENABLE();

    GPIO_InitTypeDef gpio = {
        .Pin = GPIO_PIN_5,
        .Mode = GPIO_MODE_OUTPUT_PP,
        .Pull = GPIO_NOPULL,
        .Speed = GPIO_SPEED_FREQ_LOW
    };
    HAL_GPIO_Init(GPIOA, &gpio);
}
```

```python
# 一个简单的状态机实现
from enum import Enum, auto

class State(Enum):
    IDLE = auto()
    RUNNING = auto()
    ERROR = auto()
    RECOVERY = auto()

class StateMachine:
    transitions = {
        State.IDLE:     [State.RUNNING],
        State.RUNNING:  [State.IDLE, State.ERROR],
        State.ERROR:    [State.RECOVERY],
        State.RECOVERY: [State.IDLE],
    }

    def __init__(self):
        self.state = State.IDLE

    def transition(self, target: State) -> bool:
        if target in self.transitions[self.state]:
            print(f"{self.state.name} -> {target.name}")
            self.state = target
            return True
        return False
```

## 数学公式 (KaTeX)

Hugo 可以通过短代码支持数学公式：

$$
\sum_{k=0}^{n} k = \frac{n(n+1)}{2}
$$

## 写作计划

今后的文章会围绕以下主题：

- **嵌入式 C/C++ 编程** — HAL 库、FreeRTOS、驱动开发
- **工具链与调试** — OpenOCD、GDB、Logic Analyzer
- **Python 工具脚本** — 自动化测试、数据处理
- **Rust 学习笔记** — 从嵌入式 C 到 Rust 的转型记录
- **读书笔记** — 技术书籍的要点摘录

---

> 种一棵树最好的时间是十年前，其次是现在。
>
> The best time to plant a tree was 10 years ago. The second best time is now.
