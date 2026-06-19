const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, TableOfContents, LevelFormat
} = require('docx');

// Read all markdown files in order
const docsDir = path.join(__dirname, 'docs');
const chapterDirs = [
  '00-intro', '01-hardware', '02-connection', '03-tools', '04-protocols',
  '05-internals', '06-rtos-linux', '07-programming', '08-ai', '09-pcb',
  '10-mechanical', '11-project-design', '12-modules'
];

const CHAPTER_NAMES = {
  '00-intro': '第〇篇：认识单片机',
  '01-hardware': '第一篇：硬件基础',
  '02-connection': '第二篇：电脑如何连接单片机',
  '03-tools': '第三篇：开发工具与工程结构',
  '04-protocols': '第四篇：通信协议',
  '05-internals': '第五篇：单片机内部机制',
  '06-rtos-linux': '第六篇：RTOS 与 Linux',
  '07-programming': '第七篇：编程实践',
  '08-ai': '第八篇：AI 编程',
  '09-pcb': '第九篇：PCB 设计',
  '10-mechanical': '第十篇：机械结构',
  '11-project-design': '第十一篇：项目方案设计',
  '12-modules': '第十二篇：常见模块与实战',
};

function readAllFiles() {
  const allContent = [];
  for (const dir of chapterDirs) {
    const dirPath = path.join(docsDir, dir);
    if (!fs.existsSync(dirPath)) continue;
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md')).sort();
    if (files.length === 0) continue;

    allContent.push({ type: 'chapter-title', text: CHAPTER_NAMES[dir], file: dir });

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      allContent.push({ type: 'file', text: content, file: filePath });
    }
  }
  return allContent;
}

// Parse a single markdown file into blocks
function parseMarkdown(text) {
  const lines = text.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: 'code', lang, content: codeLines.join('\n') });
      continue;
    }

    // Table
    if (line.includes('|') && line.trim().startsWith('|')) {
      const tableRows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
        const cells = lines[i].split('|').filter(c => c.trim() !== '');
        tableRows.push(cells.map(c => c.trim()));
        i++;
      }
      // Filter out separator rows (e.g., |---|---|)
      const filteredRows = tableRows.filter(row => !row.every(c => /^[-:]+$/.test(c)));
      if (filteredRows.length > 0) {
        blocks.push({ type: 'table', rows: filteredRows });
      }
      continue;
    }

    // Callout (::: tip/warning/danger)
    if (/^:::\s*(tip|warning|danger|info)/.test(line.trim())) {
      const calloutType = line.trim().match(/^:::\s*(tip|warning|danger|info)/)[1];
      const calloutLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(':::')) {
        calloutLines.push(lines[i]);
        i++;
      }
      i++; // skip closing :::
      blocks.push({ type: 'callout', calloutType, content: calloutLines.join('\n') });
      continue;
    }

    // Heading
    if (/^#{1,6}\s/.test(line)) {
      const match = line.match(/^(#{1,6})\s+(.+)/);
      blocks.push({ type: 'heading', level: match[1].length, text: match[2] });
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Normal paragraph - collect until empty line or special block
    const paraLines = [];
    while (i < lines.length && lines[i].trim() !== ''
           && !lines[i].trim().startsWith('```')
           && !(lines[i].includes('|') && lines[i].trim().startsWith('|'))
           && !/^:::\s*(tip|warning|danger|info)/.test(lines[i].trim())
           && !/^#{1,6}\s/.test(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', content: paraLines.join('\n') });
    }
  }
  return blocks;
}

// Parse inline markdown in text (bold, code, links)
function parseInline(text) {
  if (!text) return [];
  const runs = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Bold
    let match = remaining.match(/^\*\*(.+?)\*\*/);
    if (match) {
      runs.push(new TextRun({ text: match[1], bold: true }));
      remaining = remaining.slice(match[0].length);
      continue;
    }
    // Inline code
    match = remaining.match(/^`([^`]+)`/);
    if (match) {
      runs.push(new TextRun({ text: match[1], font: "Consolas", size: 20, shading: { fill: "E8E8E8", type: ShadingType.CLEAR } }));
      remaining = remaining.slice(match[0].length);
      continue;
    }
    // Link [text](url)
    match = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (match) {
      runs.push(new TextRun({ text: match[1], color: "0066CC", underline: {} }));
      remaining = remaining.slice(match[0].length);
      continue;
    }
    // Plain text
    const nextSpecial = remaining.search(/`|\*\*|\[/);
    if (nextSpecial === -1) {
      runs.push(new TextRun({ text: remaining }));
      remaining = '';
    } else {
      runs.push(new TextRun({ text: remaining.slice(0, nextSpecial) }));
      remaining = remaining.slice(nextSpecial);
    }
  }
  return runs.filter(r => r && r.options && r.options.text && r.options.text.length > 0);
}

// Callout colors
const CALLOUT_COLORS = {
  tip: { bg: "D5F5E3", border: "27AE60", label: "💡 提示" },
  warning: { bg: "FDEBD0", border: "E67E22", label: "⚠️ 注意" },
  danger: { bg: "FADBD8", border: "E74C3C", label: "🚫 警告" },
  info: { bg: "D6EAF8", border: "2980B9", label: "ℹ️ 信息" },
};

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function createDocxElements(blocks) {
  const elements = [];

  for (const block of blocks) {
    if (block.type === 'heading') {
      const level = Math.min(block.level, 3);
      const headingMap = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
      };
      elements.push(new Paragraph({
        heading: headingMap[level],
        children: [new TextRun({ text: block.text })],
      }));
    } else if (block.type === 'paragraph') {
      const runs = parseInline(block.content);
      if (runs.length > 0) {
        elements.push(new Paragraph({
          children: runs,
          spacing: { after: 120, line: 360 },
        }));
      }
    } else if (block.type === 'code') {
      const codeLines = block.content.split('\n');
      codeLines.forEach(line => {
        elements.push(new Paragraph({
          children: [new TextRun({ text: line || ' ', font: "Consolas", size: 18 })],
          shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
          spacing: { before: 0, after: 0, line: 280 },
          indent: { left: 360 },
        }));
      });
      // Add a small gap after code block
      elements.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
    } else if (block.type === 'table') {
      const headerRow = block.rows[0];
      const dataRows = block.rows.length > 1 ? block.rows.slice(1) : [];
      const colWidth = Math.floor(9026 / headerRow.length); // A4 content width

      elements.push(new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: headerRow.map(() => colWidth),
        rows: [
          new TableRow({
            children: headerRow.map(cell =>
              new TableCell({
                borders,
                width: { size: colWidth, type: WidthType.DXA },
                shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
                margins: { top: 60, bottom: 60, left: 100, right: 100 },
                children: [new Paragraph({
                  children: [new TextRun({ text: cell, bold: true, size: 20 })]
                })]
              })
            )
          }),
          ...dataRows.map(row =>
            new TableRow({
              children: row.map(cell =>
                new TableCell({
                  borders,
                  width: { size: colWidth, type: WidthType.DXA },
                  margins: { top: 60, bottom: 60, left: 100, right: 100 },
                  children: [new Paragraph({
                    children: parseInline(cell),
                    spacing: { after: 0 },
                  })]
                })
              )
            })
          )
        ]
      }));
      elements.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
    } else if (block.type === 'callout') {
      const colors = CALLOUT_COLORS[block.calloutType] || CALLOUT_COLORS.info;
      const calloutLines = block.content.split('\n');

      // Label line
      elements.push(new Paragraph({
        children: [new TextRun({ text: colors.label, bold: true, size: 20 })],
        shading: { fill: colors.bg, type: ShadingType.CLEAR },
        border: { left: { style: BorderStyle.SINGLE, size: 8, color: colors.border } },
        spacing: { before: 160, after: 0 },
        indent: { left: 200 },
      }));
      // Content lines
      calloutLines.forEach(line => {
        if (line.trim()) {
          elements.push(new Paragraph({
            children: parseInline(line),
            shading: { fill: colors.bg, type: ShadingType.CLEAR },
            border: { left: { style: BorderStyle.SINGLE, size: 8, color: colors.border } },
            spacing: { before: 0, after: 0 },
            indent: { left: 200 },
          }));
        }
      });
      elements.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
    }
  }
  return elements;
}

async function main() {
  console.log("Reading markdown files...");
  const allContent = readAllFiles();

  const docElements = [];
  let firstFile = true;

  for (const item of allContent) {
    if (item.type === 'chapter-title') {
      // Add page break before each chapter (except first)
      if (!firstFile) {
        docElements.push(new Paragraph({ children: [new PageBreak()] }));
      }
      firstFile = false;

      docElements.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: item.text, size: 36 })],
        spacing: { before: 360, after: 240 },
        alignment: AlignmentType.CENTER,
      }));
    } else {
      const blocks = parseMarkdown(item.text);
      const elements = createDocxElements(blocks);
      docElements.push(...elements);
    }
  }

  // Create document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Microsoft YaHei", size: 22 }
        }
      },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, font: "Microsoft YaHei" },
          paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 }
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: "Microsoft YaHei" },
          paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 }
        },
        {
          id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: "Microsoft YaHei" },
          paragraph: { spacing: { before: 120, after: 120 }, outlineLevel: 2 }
        },
      ]
    },
    sections: [
      // Cover page
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
          }
        },
        children: [
          new Paragraph({ spacing: { before: 4800 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "电赛入门指南", size: 56, bold: true, font: "Microsoft YaHei" })],
          }),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "从零开始学嵌入式", size: 36, color: "555555" })],
          }),
          new Paragraph({ spacing: { before: 400 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "2026 江苏省电子设计竞赛备赛教程", size: 26, color: "777777" })],
          }),
          new Paragraph({ spacing: { before: 600 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "适用平台：MSPM0G3507 / STM32F103", size: 22, color: "999999" })],
          }),
        ]
      },
      // TOC page
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
          }
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: "电赛入门指南", size: 18, color: "999999" })],
            })]
          })
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "第 ", size: 18 }), new TextRun({ children: [PageNumber.CURRENT], size: 18 }), new TextRun({ text: " 页", size: 18 })],
            })]
          })
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "目录" })],
          }),
          new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-3" }),
        ]
      },
      // Main content
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
          }
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: "电赛入门指南", size: 18, color: "999999" })],
            })]
          })
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "第 ", size: 18 }), new TextRun({ children: [PageNumber.CURRENT], size: 18 }), new TextRun({ text: " 页", size: 18 })],
            })]
          })
        },
        children: docElements,
      }
    ]
  });

  const outputPath = path.join(__dirname, '..', '电赛入门指南.docx');
  console.log(`Generating Word document to ${outputPath}...`);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Done! File saved to ${outputPath}`);
  console.log(`File size: ${(buffer.length / 1024 / 1024).toFixed(1)} MB`);
}

main().catch(console.error);
