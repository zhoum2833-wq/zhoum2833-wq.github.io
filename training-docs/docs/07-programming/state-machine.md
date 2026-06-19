---
title: 状态机设计
---

# 状态机设计

## 问题：if-else 地狱

你的小车需要切换模式——待机、巡线、避障、停车。最简单的写法：

```c
if (mode == 0) {
    // 待机
} else if (mode == 1) {
    // 巡线
} else if (mode == 2) {
    // 避障
} else {
    // 停车
}
```

三个模式还行。到了五个模式、每个模式里还有子状态（"避障"包括"检测障碍→后退→转向→继续"），if-else 会变成一锅粥——改一个状态可能影响另一个，加新状态牵一发动全身。

**状态机就是解决这个问题的。**

## 什么是状态机

三要素：
- **状态（State）**：系统当前在做什么（待机、巡线、避障……）
- **事件（Event）**：触发状态变化的信号（按键按下、检测到障碍、到达终点……）
- **转移（Transition）**：从状态 A 收到事件 E 后跳到状态 B

```
       按键1              检测障碍
待机 ──────→ 巡线 ────────────→ 避障
  ↑            │                  │
  └──── 按键2 ─┘   障碍消除 ──────┘
```

## 代码实现

```c
// 定义所有状态
typedef enum {
    STATE_IDLE,
    STATE_LINE_FOLLOW,
    STATE_AVOID,
    STATE_STOP,
    STATE_COUNT
} State_t;

// 定义所有事件
typedef enum {
    EVT_BTN1_PRESS,
    EVT_BTN2_PRESS,
    EVT_OBSTACLE,
    EVT_OBSTACLE_CLEAR,
    EVT_ARRIVED,
    EVT_COUNT
} Event_t;

State_t current_state = STATE_IDLE;

// 状态转移表
typedef struct {
    State_t next_state;
    void (*on_enter)(void);  // 进入这个状态时做什么
} Transition_t;

// 转移表 [当前状态][事件] = 下一状态
Transition_t fsm[STATE_COUNT][EVT_COUNT] = {0};

void fsm_init(void) {
    // 待机 → 按按键1 → 巡线
    fsm[STATE_IDLE][EVT_BTN1_PRESS] = (Transition_t){STATE_LINE_FOLLOW, line_follow_start};
    // 巡线 → 检测障碍 → 避障
    fsm[STATE_LINE_FOLLOW][EVT_OBSTACLE] = (Transition_t){STATE_AVOID, avoid_start};
    // 避障 → 障碍清除 → 巡线
    fsm[STATE_AVOID][EVT_OBSTACLE_CLEAR] = (Transition_t){STATE_LINE_FOLLOW, line_follow_start};
    // 巡线 → 到达终点 → 停车
    fsm[STATE_LINE_FOLLOW][EVT_ARRIVED] = (Transition_t){STATE_STOP, stop_start};
    // 任意状态 → 按按键2 → 待机
    fsm[STATE_LINE_FOLLOW][EVT_BTN2_PRESS] = (Transition_t){STATE_IDLE, idle_start};
    fsm[STATE_AVOID][EVT_BTN2_PRESS] = (Transition_t){STATE_IDLE, idle_start};
}

void fsm_handle_event(Event_t event) {
    Transition_t t = fsm[current_state][event];
    if (t.next_state != current_state || t.on_enter != NULL) {
        current_state = t.next_state;
        if (t.on_enter) t.on_enter();  // 执行进入动作
    }
}

// 主循环中
void loop(void) {
    // 状态机的"运行"部分——每个状态循环做的事
    switch (current_state) {
        case STATE_LINE_FOLLOW:
            line_follow_loop();   // 巡线 PID
            break;
        case STATE_AVOID:
            avoid_loop();         // 避障逻辑
            break;
        default:
            break;
    }
}
```

## 什么时候用状态机

| 场景 | 要不要用 |
|------|---------|
| 2~3 个简单模式 | 不用，if-else 够用 |
| 4+ 个模式，且模式间有跳转规则 | 用！查表法比 if-else 清晰 |
| 按键处理（短按/长按/双击/组合键） | 状态机是最佳方案 |
| 通信协议（等待帧头→读长度→读数据→CRC 校验） | 标准状态机 |
| 比赛流程（准备→跑第一圈→补给→跑第二圈→结束） | 用状态机管理流程 |

::: tip 一个文件一个状态机
别把所有状态都塞进一个巨大的 fsm[][] 表里。小车行进的状态机和按键的状态机应该是**两个独立的模块**——各自在自己的 .c 文件里，互不干扰。
:::

## 小结

状态机把"谁在什么情况下干什么"这件事从面条代码里解救出来。用一张转移表定义规则、一个 switch 驱动行为，你的代码逻辑会清晰 10 倍。当你的项目有超过 3 个模式需要切换时，别犹豫——上状态机。
