#!/usr/bin/env bash
# 미리보기 PDF. 제출본은 라이너 스콜라의 [내보내기]로 만든다.
set -e
cd "$(dirname "$0")"
pandoc paper_liner.md -f markdown-implicit_figures -t html5 -s -c liner.css -o paper_liner.html
CHROME=$(ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome | head -1)
"$CHROME" --headless --no-sandbox --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$(pwd)/paper_liner_preview.pdf" "file://$(pwd)/paper_liner.html" 2>/dev/null
ls -l paper_liner_preview.pdf
