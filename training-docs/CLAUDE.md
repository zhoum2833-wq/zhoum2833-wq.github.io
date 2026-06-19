# CLAUDE.md

## 唯一源文件

**所有教程内容只维护一个文件：`电赛入门指南.md`（项目根目录）。**

不要直接修改 `docs/` 下的文件——每次运行 `update.bat` 时，`scripts/split-md.py` 会自动把大文件拆回 `docs/` 供 VitePress 使用。

## 编辑后同步

修改 `电赛入门指南.md` 后，双击 `update.bat` 一键完成：

1. 拆分 → `docs/` 各章节目录
2. 重建 VitePress 站点 → `output/site/`
3. 生成 Word 文档 → `output/电赛入门指南.docx`
4. 生成 PDF 文档 → `output/电赛入门指南.pdf`

`output/` 已在 `.gitignore` 中忽略。

## 文档结构

`电赛入门指南.md` 按 `<!-- @split: XX-xxx/filename.md -->` 标记切分文章：

```markdown
# 第〇篇：认识单片机

<!-- @split: 00-intro/evolution.md -->
# 单片机的发展演化
(内容)

<!-- @split: 00-intro/what-is-mcu.md -->
# 什么是单片机
(内容)
```

章节目录对照：

| 目录 | 篇章 |
|------|------|
| `00-intro/` | 第〇篇：认识单片机 |
| `01-hardware/` | 第一篇：硬件基础 |
| `02-connection/` | 第二篇：电脑如何连接单片机 |
| `03-tools/` | 第三篇：开发工具与工程结构 |
| `04-protocols/` | 第四篇：通信协议 |
| `05-internals/` | 第五篇：单片机内部机制 |
| `06-rtos-linux/` | 第六篇：RTOS 与 Linux |
| `07-programming/` | 第七篇：编程实践 |
| `08-ai/` | 第八篇：AI 编程 |
| `09-pcb/` | 第九篇：PCB 设计 |
| `10-mechanical/` | 第十篇：机械结构 |
| `11-project-design/` | 第十一篇：项目方案设计 |
| `12-modules/` | 第十二篇：常见模块与实战 |

## VitePress 配置

`docs/.vitepress/config.mts` 的 `base` 必须保持为 `/training/`，与 GitHub Pages 部署路径一致。

侧边栏链接格式：`/00-intro/what-is-mcu`（对应 `docs/00-intro/what-is-mcu.md`）

新增文章时，需要在 `config.mts` 侧边栏添加对应条目。

## 部署

Push 到 `main` 后 GitHub Actions 自动部署。本地预览用 `npm run docs:dev`。
