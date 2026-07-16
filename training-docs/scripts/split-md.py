"""Split the single 电赛入门指南.md back into docs/ chapter files for VitePress."""
import os, re, json

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC  = os.path.join(ROOT, '电赛入门指南.md')
DOCS = os.path.join(ROOT, 'docs')


def md2html(text):
    """Minimal markdown to HTML — handles headings and paragraphs only."""
    lines = text.strip().split('\n')
    result = []
    buf = []
    for line in lines:
        m = re.match(r'^(#{1,6})\s+(.+)', line)
        if m:
            if buf:
                result.append('<p>' + '<br>'.join(buf) + '</p>')
                buf = []
            level = len(m.group(1))
            result.append(f'<h{level}>{m.group(2)}</h{level}>')
        elif line.strip() == '':
            if buf:
                result.append('<p>' + '<br>'.join(buf) + '</p>')
                buf = []
        else:
            buf.append(line)
    if buf:
        result.append('<p>' + '<br>'.join(buf) + '</p>')
    return '\n'.join(result)


def main():
    if not os.path.exists(SRC):
        print(f"ERROR: {SRC} not found")
        return

    with open(SRC, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by <!-- @split: path --> markers
    pattern = re.compile(r'<!-- @split: (.+?) -->\n', re.MULTILINE)
    parts = pattern.split(content)

    # parts[0] = everything before first marker (title, chapter headings, TOC)
    # parts[1] = path1, parts[2] = content1, parts[3] = path2, parts[4] = content2, ...
    if len(parts) < 2:
        print("ERROR: No @split markers found in source file")
        return

    # The preamble before the first --- is the homepage configuration
    # Format:
    #   # Title
    #   > subtitle
    #   (optional markdown content, e.g. 留言 section)
    raw_preamble = parts[0].strip()
    # Strip trailing --- separator (may or may not have newlines around it)
    preamble = re.sub(r'\n---\s*$', '', raw_preamble).strip()

    # Parse preamble: extract H1, blockquote, and remaining content
    title_match = re.search(r'^#\s+(.+)', preamble, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else '嵌入式与电赛入门与进阶'

    subtitle_match = re.search(r'^>\s*(.+)', preamble, re.MULTILINE)
    subtitle = subtitle_match.group(1).strip() if subtitle_match else '写给零基础队友的单片机入门教程'

    # Content = everything after H1 and blockquote
    # Remove H1 line and blockquote line(s) from preamble
    content = preamble
    if title_match:
        content = content.replace(title_match.group(0), '', 1)
    if subtitle_match:
        content = content.replace(subtitle_match.group(0), '', 1)
    content = content.strip()

    index_path = os.path.join(DOCS, 'index.md')
    os.makedirs(os.path.dirname(index_path), exist_ok=True)

    # Build index.md — title/subtitle from source, content section, buttons at bottom
    content_html = ''
    if content:
        content_rendered = md2html(content)
        content_html = f'\n<div class="home-content">\n{content_rendered}\n</div>'

    index_content = f"""---
layout: page
sidebar: false

---
<style>
.home-container {{
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 4rem 2rem 2rem;
}}
.home-top {{
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
}}
.home-title {{
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}}
.home-subtitle {{
  color: var(--vp-c-text-2);
  font-size: 1.1rem;
  margin-bottom: 0;
}}
.home-content {{
  text-align: center;
  color: var(--vp-c-text-2);
  max-width: 600px;
  margin: 0 auto 1.5rem;
}}
.home-content p {{
  margin: 0.5rem 0;
}}
.home-actions {{
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}}
.btn-brand {{
  display: inline-block;
  border-radius: 20px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  background: var(--vp-c-brand-1);
  color: #fff;
  text-decoration: none;
  transition: background 0.2s;
}}
.btn-brand:hover {{ background: var(--vp-c-brand-2); text-decoration: none; color: #fff; }}
.btn-alt {{
  display: inline-block;
  border-radius: 20px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  text-decoration: none;
  transition: all 0.2s;
}}
.btn-alt:hover {{ border-color: var(--vp-c-brand-2); color: var(--vp-c-brand-2); text-decoration: none; }}
</style>

<div class="home-container">
  <div class="home-top">
    <h1 class="home-title">{title}</h1>
    <p class="home-subtitle">{subtitle}</p>
  </div>{content_html}
  <div class="home-actions">
    <a class="btn-brand" href="/01-hardware/cpu-arch">开始学习</a>
    <a class="btn-alt" href="/01-hardware/cpu-arch">章节概览</a>
  </div>
</div>
"""
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(index_content)
    print(f"  index.md")

    # Extract articles
    count = 0
    current_dir = None
    for i in range(1, len(parts), 2):
        path = parts[i]
        body = parts[i + 1].strip()

        # path format: "01-hardware/cpu-arch.md"
        match = re.match(r'^([^/]+)/(.+)$', path)
        if not match:
            print(f"  WARN: invalid path {path}")
            continue

        ch_dir, filename = match.group(1), match.group(2)

        # Create directory if needed
        full_dir = os.path.join(DOCS, ch_dir)
        if current_dir != full_dir:
            os.makedirs(full_dir, exist_ok=True)
            current_dir = full_dir

        # Find the first heading to extract title for frontmatter check
        first_heading = re.search(r'^#\s+(.+)', body, re.MULTILINE)
        title = first_heading.group(1).strip() if first_heading else filename.replace('.md', '')

        # Remove trailing --- separators
        body = re.sub(r'\n---\s*$', '', body)

        # Ensure proper frontmatter (minimal)
        if not body.startswith('---'):
            body = f'---\ntitle: {title}\n---\n\n{body}'

        filepath = os.path.join(full_dir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(body)

        count += 1

    print(f"  {count} files written to docs/")

    # --- 清理孤儿文件 ---
    # 收集本次生成的所有文件路径
    expected = set()
    for i in range(1, len(parts), 2):
        path = parts[i]
        expected.add(path)

    # 遍历 docs/ 下所有 .md 文件，删除不在预期列表中的
    orphan_count = 0
    for root, dirs, files in os.walk(DOCS):
        for f in files:
            if not f.endswith('.md'):
                continue
            rel = os.path.relpath(os.path.join(root, f), DOCS).replace('\\', '/')
            if rel in expected or rel == 'index.md':
                continue
            orphan = os.path.join(root, f)
            print(f"  [clean] removing orphan: {rel}")
            os.remove(orphan)
            orphan_count += 1

    if orphan_count > 0:
        print(f"  {orphan_count} orphan file(s) removed")
    # ---


if __name__ == '__main__':
    main()
