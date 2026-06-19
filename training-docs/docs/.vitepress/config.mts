import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '电赛入门指南',
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
        text: '第一篇：硬件基础',
        items: [
          { text: '1.1 CPU 架构', link: '/01-hardware/cpu-arch' },
          { text: '1.2 RAM 与 ROM', link: '/01-hardware/ram-rom' },
          { text: '1.3 GPIO 与外设', link: '/01-hardware/gpio' },
          { text: '1.4 引脚电气数据', link: '/01-hardware/electrical' },
          { text: '1.5 最小系统板', link: '/01-hardware/minimum-board' },
        ]
      },
      {
        text: '第二篇：电脑如何连接单片机',
        items: [
          { text: '2.1 USB 转串口芯片', link: '/02-connection/usb-uart' },
          { text: '2.2 虚拟 COM 口', link: '/02-connection/virtual-com' },
          { text: '2.3 USB 供电', link: '/02-connection/power' },
        ]
      },
      {
        text: '第三篇：开发工具与工程结构',
        items: [
          { text: '3.1 开发工具全景', link: '/03-tools/overview' },
          { text: '3.2 STM32CubeMX', link: '/03-tools/cubemx' },
          { text: '3.3 CubeMX 工程结构', link: '/03-tools/cubemx-structure' },
          { text: '3.4 自定义工程模板', link: '/03-tools/custom-template' },
        ]
      },
      {
        text: '第四篇：通信协议',
        items: [
          { text: '4.1 UART 串口通信', link: '/04-protocols/uart' },
          { text: '4.2 I2C 通信', link: '/04-protocols/i2c' },
          { text: '4.3 SPI 通信', link: '/04-protocols/spi' },
          { text: '4.4 三种协议对比', link: '/04-protocols/comparison' },
        ]
      },
      {
        text: '第五篇：单片机内部机制',
        items: [
          { text: '5.1 单片机如何运行', link: '/05-internals/how-mcu-runs' },
          { text: '5.2 数据如何流动', link: '/05-internals/data-flow' },
          { text: '5.3 中断', link: '/05-internals/interrupts' },
          { text: '5.4 DMA', link: '/05-internals/dma' },
        ]
      },
      {
        text: '第六篇：RTOS 与 Linux',
        items: [
          { text: '6.1 为什么需要操作系统', link: '/06-rtos-linux/why-os' },
          { text: '6.2 FreeRTOS', link: '/06-rtos-linux/freertos' },
          { text: '6.3 RT-Thread', link: '/06-rtos-linux/rtthread' },
          { text: '6.4 Linux 简介', link: '/06-rtos-linux/linux' },
        ]
      },
      {
        text: '第七篇：编程实践',
        items: [
          { text: '7.1 模块化编程', link: '/07-programming/modular' },
          { text: '7.2 分层架构', link: '/07-programming/layering' },
          { text: '7.3 调试方法', link: '/07-programming/debugging' },
          { text: '7.4 编译链', link: '/07-programming/toolchain' },
        ]
      },
      {
        text: '第八篇：AI 编程',
        items: [
          { text: '8.1 VS Code 环境', link: '/08-ai/vscode' },
          { text: '8.2 Claude Code + DS V4', link: '/08-ai/claude-code' },
          { text: '8.3 Git 团队协作', link: '/08-ai/git' },
          { text: '8.4 AI 基础知识', link: '/08-ai/ai-basics' },
          { text: '8.5 与 AI 正确聊天', link: '/08-ai/prompting' },
          { text: '8.6 Skills 与多模态', link: '/08-ai/skills' },
        ]
      },
      {
        text: '第九篇：PCB 设计',
        items: [
          { text: '9.1 PCB 设计流程', link: '/09-pcb/overview' },
          { text: '9.2 电源设计', link: '/09-pcb/power' },
          { text: '9.3 USB 协议基础', link: '/09-pcb/usb' },
          { text: '9.4 布局布线', link: '/09-pcb/layout' },
          { text: '9.5 高速信号与信号完整性', link: '/09-pcb/high-speed' },
          { text: '9.6 常用连接器', link: '/09-pcb/connectors' },
          { text: '9.7 隔离', link: '/09-pcb/isolation' },
        ]
      },
      {
        text: '第十篇：机械结构',
        items: [
          { text: '10.1 SW 与 Blender', link: '/10-mechanical/sw-blender' },
          { text: '10.2 亚克力板', link: '/10-mechanical/acrylic' },
        ]
      },
      {
        text: '第十一篇：项目方案设计',
        items: [
          { text: '11.1 车体方案选择', link: '/11-project-design/chassis' },
          { text: '11.2 电机扭矩估算', link: '/11-project-design/torque' },
          { text: '11.3 传感器与主控选型', link: '/11-project-design/selection' },
          { text: '11.4 分板还是合板', link: '/11-project-design/split-board' },
          { text: '11.5 成本与时间权衡', link: '/11-project-design/cost-time' },
        ]
      },
      {
        text: '第十二篇：常见模块与实战',
        items: [
          { text: '12.1 TB6612FNG 电机驱动', link: '/12-modules/tb6612' },
          { text: '12.2 编码器', link: '/12-modules/encoder' },
          { text: '12.3 8路灰度传感器', link: '/12-modules/grayscale' },
          { text: '12.4 JY61P 陀螺仪', link: '/12-modules/jy61p' },
          { text: '12.5 MaixCAM Pro', link: '/12-modules/maxicam' },
          { text: '12.6 无线串口与烧录', link: '/12-modules/wireless' },
          { text: '12.7 实战：从点灯到巡线', link: '/12-modules/practical' },
        ]
      },
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
