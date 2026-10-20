#!/bin/bash
# paper_draft.md -> build/paper.html -> build/paper.pdf (A4, Noto CJK KR) with the pre-installed Chromium.
set -e
cd "$(dirname "$0")/.."
pandoc paper_draft.md -f markdown-implicit_figures -t html5 -s --metadata pagetitle="paper" -c build/paper.css -o build/paper.html
sed -i 's#src="fig/#src="../fig/#g; s#href="build/paper.css"#href="paper.css"#' build/paper.html
/opt/pw-browsers/chromium-1194/chrome-linux/chrome --headless --no-sandbox --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$(pwd)/build/paper.pdf" "file://$(pwd)/build/paper.html" 2>/dev/null
ls -l build/paper.pdf
