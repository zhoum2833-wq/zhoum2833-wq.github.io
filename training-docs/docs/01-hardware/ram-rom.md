---
title: RAM 与 ROM（Flash）
---

# RAM 与 ROM（Flash）

单片机有两种存储器，分工不同。

| | RAM | Flash |
|------|-----|-------|
| 速度 | 极快 | 较慢 |
| 断电 | 数据丢失 | 保留 |
| 容量 | KB 级 | KB~MB 级 |
| 存放 | 变量、栈、堆 | 程序代码、常量 |

Flash 存程序，RAM 存数据。Flash 大但慢，因为程序代码体积大但不常变。RAM 小但快，因为变量频繁读写。

## 编译后的内存布局

C 代码编译后分成几个段：

| 段 | 位置 | 内容 |
|----|------|------|
| `.text` | Flash | 代码指令 |
| `.rodata` | Flash | 常量、字符串 |
| `.data` | RAM | 已初始化全局变量（初值从 Flash 拷过来） |
| `.bss` | RAM | 未初始化全局变量（上电清零） |
| stack/heap | RAM | 局部变量、函数调用、动态分配 |

```c
const int table[] = {1,2,3};  // .rodata → Flash
int count = 0;                 // .data → RAM（初值 0 在 Flash）
int buffer;                    // .bss → RAM（自动清零）

void f(void) {
    int x = 10;                // stack → RAM（函数返回即释放）
}
```

用 `arm-none-eabi-size` 可以查看各段大小。Flash 溢出编译就报错，RAM 溢出只会在运行时崩溃——更难排查。
