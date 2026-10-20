// pdf.js가 실행 중에 읽는 파일(한글 등 CJK 글꼴용 CMap, 표준 글꼴, 이미지 디코더 wasm)을 public/pdfjs로 복사한다.
// 인터넷 없이도 한글 PDF가 깨지지 않게 하려면 앱 안에 들어 있어야 한다.
import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'node_modules', 'pdfjs-dist')
const dest = join(root, 'public', 'pdfjs')
rmSync(dest, { recursive: true, force: true })
mkdirSync(dest, { recursive: true })
for (const dir of ['cmaps', 'standard_fonts', 'wasm', 'iccs']) {
  cpSync(join(src, dir), join(dest, dir), { recursive: true })
}
console.log('pdf.js assets copied to public/pdfjs')
