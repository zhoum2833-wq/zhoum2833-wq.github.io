"""Split the single 电赛入门指南.md back into docs/ chapter files for VitePress."""
import os, re, json

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC  = os.path.join(ROOT, '电赛入门指南.md')
DOCS = os.path.join(ROOT, 'docs')


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

    # The preamble before the first --- goes into index.md
    raw_preamble = parts[0].strip()
    sep_idx = raw_preamble.find('\n---\n')
    preamble = raw_preamble[:sep_idx].strip() if sep_idx != -1 else raw_preamble.split('\n#')[0].strip()
    index_path = os.path.join(DOCS, 'index.md')
    os.makedirs(os.path.dirname(index_path), exist_ok=True)

    # Build index.md with proper frontmatter
    index_content = f"""---
layout: home

hero:
  name: "电赛入门指南"
  text: "从零开始学嵌入式"
  tagline: 写给零基础队友的单片机入门教程 · 2026 江苏省电子设计竞赛
  actions:
    - theme: brand
      text: 开始学习
      link: /01-hardware/cpu-arch
    - theme: alt
      text: 章节概览
      link: /01-hardware/cpu-arch

---

{preamble}
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
