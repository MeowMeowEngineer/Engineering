#!/bin/bash
# paper_ieee.md -> ieee/paper_ieee.html -> ieee/paper_ieee.pdf (IEEE 유사 2단, A4)
set -e
cd "$(dirname "$0")/.."
pandoc paper_ieee.md -f markdown-implicit_figures+tex_math_dollars -t html5 -s --mathml \
  --metadata pagetitle="paper_ieee" -c ieee.css -o ieee/paper_ieee.html
sed -i 's#src="fig/#src="../fig/#g; s#src="ieee/#src="#g' ieee/paper_ieee.html
CHROME=$(ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome | head -1)
"$CHROME" --headless --no-sandbox --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$(pwd)/ieee/paper_ieee.pdf" "file://$(pwd)/ieee/paper_ieee.html" 2>/dev/null
ls -l ieee/paper_ieee.pdf
