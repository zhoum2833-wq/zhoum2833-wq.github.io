import { defineConfig } from 'vitepress'

    export default defineConfig({
      title: '嵌入式与电赛入门与进阶',
      description: '从零开始学习嵌入式开发，备战电子设计竞赛',
      lang: 'zh-CN',
      base: '/training/',

      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
          { text: '开始学习', link: '/01-hardware/cpu-arch' },
        ],

        sidebar: [
          {
            text: '第一篇：初识单片机',
            items: [
                  { text: '什么是单片机', link: '/01-hardware/whatisdpj' },
          { text: '单片机是怎么运行的', link: '/01-hardware/how_dpj_work' },
          { text: 'RAM 与 ROM（Flash）', link: '/01-hardware/ram-rom' },
          { text: 'ADC 与 DAC', link: '/01-hardware/adc-dac' },
          { text: '定时器与 PWM', link: '/01-hardware/timer-pwm' },
          { text: '常用传感器选型概览', link: '/01-hardware/sensors-overview' },
          { text: 'GPIO 与片内外设', link: '/01-hardware/gpio' },
          { text: '引脚电气数据', link: '/01-hardware/electrical' },
          { text: '最小系统', link: '/01-hardware/minimum-board' }
            ]
          },
      {
            text: '第二篇：电脑如何连接单片机',
            items: [
                  { text: 'USB 转串口芯片', link: '/02-connection/usb-uart' },
          { text: '为什么虚拟出 COM 口', link: '/02-connection/virtual-com' },
          { text: 'USB 到底供了多少电', link: '/02-connection/power' },
          { text: '调试器（DAP-Link / ST-Link / J-Link）', link: '/02-connection/debugger' }
            ]
          },
      {
            text: '第三篇：开发工具与工程结构',
            items: [
                  { text: '开发工具全景', link: '/03-tools/overview' },
          { text: 'STM32CubeMX 是什么', link: '/03-tools/cubemx' },
          { text: 'CubeMX 生成的工程结构拆解', link: '/03-tools/cubemx-structure' },
          { text: '自定义工程模板结构', link: '/03-tools/custom-template' }
            ]
          },
      {
            text: '第四篇：通信协议',
            items: [
                  { text: 'UART —— 最基础的串口通信', link: '/04-protocols/uart' },
          { text: 'I2C —— 两线制主从通信', link: '/04-protocols/i2c' },
          { text: 'SPI —— 高速全双工通信', link: '/04-protocols/spi' },
          { text: 'UART vs I2C vs SPI —— 三种协议对比', link: '/04-protocols/comparison' },
          { text: 'CAN 总线', link: '/04-protocols/can' }
            ]
          },
      {
            text: '第五篇：单片机内部机制',
            items: [
                  { text: '单片机是如何运作的', link: '/05-internals/how-mcu-runs' },
          { text: '数据是如何流动的', link: '/05-internals/data-flow' },
          { text: '中断 — 别让 CPU 傻等', link: '/05-internals/interrupts' },
          { text: 'DMA — 让数据自己搬家', link: '/05-internals/dma' }
            ]
          },
      {
            text: '第六篇：RTOS 与 Linux',
            items: [
                  { text: '为什么需要操作系统', link: '/06-rtos-linux/why-os' },
          { text: 'FreeRTOS — 单片机上最流行的实时操作系统', link: '/06-rtos-linux/freertos' },
          { text: 'RT-Thread — 国产实时操作系统', link: '/06-rtos-linux/rtthread' },
          { text: 'Linux — 当单片机不够用了', link: '/06-rtos-linux/linux' }
            ]
          },
      {
            text: '第七篇：编程实践',
            items: [
                  { text: '模块化 — 一个外设一个模块', link: '/07-programming/modular' },
          { text: '分层 — BSP 层 vs App 层', link: '/07-programming/layering' },
          { text: '调试三件套', link: '/07-programming/debugging' },
          { text: '编译链 — 从 .c 到 .hex', link: '/07-programming/toolchain' },
          { text: 'PID 控制入门', link: '/07-programming/pid' },
          { text: '状态机设计', link: '/07-programming/state-machine' },
          { text: '滤波器入门', link: '/07-programming/filters' }
            ]
          },
      {
            text: '第八篇：AI 编程',
            items: [
                  { text: 'VS Code 下载与安装', link: '/08-ai/vscode-install' },
          { text: 'VS Code — 你的 AI 编程环境', link: '/08-ai/vscode' },
          { text: 'Claude Code 插件 + DeepSeek V4 环境配置', link: '/08-ai/claude-code-setup' },
          { text: 'Claude Code + DeepSeek V4 Pro', link: '/08-ai/claude-code' },
          { text: 'AI 基础知识', link: '/08-ai/ai-basics' },
          { text: '怎么和 AI 正确聊天', link: '/08-ai/prompting' },
          { text: 'Skills 与多模态', link: '/08-ai/skills' },
          { text: 'Git 团队协作', link: '/08-ai/git' }
            ]
          },
      {
            text: '第九篇：PCB 设计',
            items: [
                  { text: 'PCB 设计全流程概览', link: '/09-pcb/overview' },
          { text: '电源设计 — LDO 与 DC-DC', link: '/09-pcb/power' },
          { text: 'USB 协议基础', link: '/09-pcb/usb' },
          { text: 'PCB 布局布线基础', link: '/09-pcb/layout' },
          { text: '高速信号与信号完整性', link: '/09-pcb/high-speed' },
          { text: '常用连接器', link: '/09-pcb/connectors' },
          { text: '隔离的作用与目的', link: '/09-pcb/isolation' },
          { text: '焊接与调试', link: '/09-pcb/soldering' }
            ]
          },
      {
            text: '第十篇：机械结构',
            items: [
                  { text: 'SolidWorks vs Blender', link: '/10-mechanical/sw-blender' },
          { text: '亚克力板', link: '/10-mechanical/acrylic' }
            ]
          },
      {
            text: '第十一篇：项目方案设计',
            items: [
                  { text: '车体方案选择', link: '/11-project-design/chassis' },
          { text: '电机扭矩估算', link: '/11-project-design/torque' },
          { text: '传感器与主控选型', link: '/11-project-design/selection' },
          { text: '分板还是合板？', link: '/11-project-design/split-board' },
          { text: '成本与时间权衡', link: '/11-project-design/cost-time' }
            ]
          },
      {
            text: '第十二篇：常见模块与实战',
            items: [
                  { text: 'TB6612FNG — 两路电机驱动', link: '/12-modules/tb6612' },
          { text: '编码器 — 测速与里程', link: '/12-modules/encoder' },
          { text: '8 路灰度传感器', link: '/12-modules/grayscale' },
          { text: 'JY61P 陀螺仪', link: '/12-modules/jy61p' },
          { text: 'MaixCAM Pro — 视觉模块', link: '/12-modules/maxicam' },
          { text: '无线串口调试与无线烧录', link: '/12-modules/wireless' },
          { text: '实战路线图：从点灯到巡线小车', link: '/12-modules/practical' }
            ]
          },
      {
            text: '第十三篇：电机与驱动',
            items: [
                  { text: '直流有刷电机 vs 无刷电机', link: '/13-motors/dc-motor' },
          { text: '步进电机原理与驱动', link: '/13-motors/stepper' },
          { text: '舵机原理与使用', link: '/13-motors/servo' },
          { text: '电机选型与供电计算', link: '/13-motors/selection' }
            ]
          },
      {
            text: '第十四篇：显示与交互',
            items: [
                  { text: 'OLED 屏（I2C/SPI）', link: '/14-display/oled' },
          { text: 'TFT 屏', link: '/14-display/tft' },
          { text: '按键矩阵与编码器旋钮', link: '/14-display/input' }
            ]
          },
      {
            text: '第十五篇：电源管理',
            items: [
                  { text: '电池选型', link: '/15-power/battery' },
          { text: '电压转换方案', link: '/15-power/conversion' },
          { text: '功率预算与续航估算', link: '/15-power/budget' },
          { text: '保护电路', link: '/15-power/protection' }
            ]
          }
        ],

        socialLinks: [
          { icon: 'github', link: 'https://github.com' }
        ],

        search: {
          provider: 'local'
        },

        outline: {
          level: [2, 3],
          label: '本页目录'
        },

        docFooter: {
          prev: '上一篇',
          next: '下一篇'
        },

        lastUpdated: {
          text: '最后更新于'
        }
      },

      markdown: {
        lineNumbers: true,
        container: {
          tipLabel: '提示',
          warningLabel: '注意',
          dangerLabel: '警告',
          infoLabel: '信息',
          detailsLabel: '详情'
        }
      }
    })
    