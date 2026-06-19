"""Generate PDF from the already-built docx file."""
import os, sys

DOCX = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'output', '电赛入门指南.docx'))
PDF  = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'output', '电赛入门指南.pdf'))


def convert_libreoffice():
    """Convert using LibreOffice (cross-platform, works in CI)."""
    import subprocess
    result = subprocess.run(
        ['libreoffice', '--headless', '--convert-to', 'pdf', '--outdir',
         os.path.dirname(PDF), DOCX],
        capture_output=True, text=True, timeout=120
    )
    if result.returncode != 0:
        raise RuntimeError(f"LibreOffice failed: {result.stderr}")


def convert_docx2pdf():
    """Convert using docx2pdf (Windows, requires Word)."""
    from docx2pdf import convert
    convert(DOCX, PDF)


def main():
    if not os.path.exists(DOCX):
        print(f"ERROR: {DOCX} not found, run generate-docx-simple.py first")
        sys.exit(1)

    os.makedirs(os.path.dirname(PDF), exist_ok=True)
    print(f"Converting {DOCX} -> {PDF}...")

    # Try docx2pdf first (best quality on Windows), fall back to LibreOffice
    try:
        convert_docx2pdf()
    except Exception as e1:
        print(f"  docx2pdf failed: {e1}")
        try:
            print("  Trying LibreOffice...")
            convert_libreoffice()
        except Exception as e2:
            print(f"  LibreOffice also failed: {e2}")
            print("  Please install Word or LibreOffice to generate PDF")
            sys.exit(1)

    size = os.path.getsize(PDF) / 1024 / 1024
    print(f"Done! {PDF} ({size:.1f} MB)")


if __name__ == '__main__':
    main()
