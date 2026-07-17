import { defineConfig } from 'vitepress'

    export default defineConfig({
      title: '嵌入式与电赛入门与进阶',
      description: '从零开始学习嵌入式开发，备战电子设计竞赛',
      lang: 'zh-CN',
      base: '/training/',

      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
          { text: '开始学习', link: '/01-hardware/whatisdpj' },
        ],

        sidebar: [
          {
            text: '第一篇：初识单片机',
            items: [
                  { text: '什么是单片机', link: '/01-hardware/whatisdpj' },
          { text: '单片机是怎么运行的', link: '/01-hardware/how_dpj_work' },
          { text: 'RAM 与 ROM（Flash）', link: '/01-hardware/ram-rom' },
          { text: '定时器与 PWM', link: '/01-hardware/timer-pwm' },
          { text: 'GPIO 与片内外设', link: '/01-hardware/gpio' },
          { text: 'ADC 与 DAC', link: '/01-hardware/adc-dac' },
          { text: '引脚电气数据', link: '/01-hardware/electrical' },
          { text: '最小系统', link: '/01-hardware/minimum-board' }
            ]
          },
      {
            text: '第二篇：电脑如何连接单片机',
            items: [
                  { text: 'USB 转串口芯片(有线)', link: '/02-connection/usb-uart' },
          { text: '无线串口调试器', link: '/02-connection/no_xian_uart' },
          { text: '什么是调试器', link: '/02-connection/debugger' }
            ]
          },
      {
            text: '第三篇：开发软件与工程结构',
            items: [
                  { text: '软件开发选择', link: '/03-tools/project' },
          { text: 'AI 辅助嵌入式开发', link: '/03-tools/ai-tools' }
            ]
          },
      {
            text: '第四篇：通信协议',
            items: [
                  { text: 'UART —— 最基础的串口通信', link: '/04-protocols/uart' },
          { text: 'I2C —— 两线制主从通信', link: '/04-protocols/i2c' },
          { text: 'SPI —— 高速全双工通信', link: '/04-protocols/spi' },
          { text: 'UART vs I2C vs SPI —— 三种协议对比', link: '/04-protocols/comparison' }
            ]
          },
      {
            text: '第五篇：RTOS 与 Linux',
            items: [
                  { text: '为什么需要操作系统', link: '/06-rtos-linux/why-os' },
          { text: 'FreeRTOS — 单片机上最流行的实时操作系统', link: '/06-rtos-linux/freertos' },
          { text: 'Linux', link: '/06-rtos-linux/linux' }
            ]
          },
      {
            text: '第六篇：常见模块与实战',
            items: [
                  { text: 'JY61P 陀螺仪', link: '/12-modules/jy61p' },
          { text: 'MaixCAM Pro — 视觉模块', link: '/12-modules/maxicam' }
            ]
          },
      {
            text: '第七篇：PCB 设计',
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
            text: '第八篇：项目方案设计',
            items: [
                  { text: '车体方案选择', link: '/11-project-design/chassis' },
          { text: '电机扭矩估算', link: '/11-project-design/torque' },
          { text: '传感器与主控选型', link: '/11-project-design/selection' },
          { text: '分板还是合板？', link: '/11-project-design/split-board' },
          { text: '成本与时间权衡', link: '/11-project-design/cost-time' }
            ]
          },
      {
            text: '第九篇：机械结构',
            items: [
                  { text: 'SolidWorks vs Blender', link: '/10-mechanical/sw-blender' },
          { text: '亚克力板', link: '/10-mechanical/acrylic' }
            ]
          },
      {
            text: '第十篇：电机与驱动',
            items: [
                  { text: '直流有刷电机 vs 无刷电机', link: '/13-motors/dc-motor' },
          { text: '步进电机原理与驱动', link: '/13-motors/stepper' },
          { text: '舵机原理与使用', link: '/13-motors/servo' },
          { text: '电机选型与供电计算', link: '/13-motors/selection' }
            ]
          },
      {
            text: '第十一篇：显示与交互',
            items: [
                  { text: 'OLED 屏（I2C/SPI）', link: '/14-display/oled' },
          { text: 'TFT 屏', link: '/14-display/tft' },
          { text: '按键矩阵与编码器旋钮', link: '/14-display/input' }
            ]
          },
      {
            text: '第十二篇：电源管理',
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
    