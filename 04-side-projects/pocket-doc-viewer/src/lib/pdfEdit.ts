// PDF 수정: 펜·형광펜 필기, 글자 넣기, 쪽 회전·삭제.
// 원본 쪽 내용은 그대로 두고 그 위에 그려 넣으므로(pdf-lib), 어떤 PDF 프로그램에서 열어도 같게 보인다.
// 글자는 한글 글꼴을 PDF에 넣지 않아도 되도록 기기 글꼴로 그린 그림으로 넣는다.

import { degrees, LineCapStyle, PDFDocument, rgb } from 'pdf-lib'

/** 좌표는 모두 PDF 사용자 공간(pt) */
export type PdfMark =
  | { kind: 'ink'; points: [number, number][]; color: string; width: number; opacity: number }
  | { kind: 'text'; x: number; y: number; text: string; sizePt: number; color: string }

export interface PdfEdits {
  /** 쪽 번호(0부터) → 그려 넣을 것들 */
  marks: Map<number, PdfMark[]>
  /** 쪽 번호 → 추가 회전(90의 배수) */
  rotate: Map<number, number>
  /** 지울 쪽 번호 */
  remove: Set<number>
}

export const emptyEdits = (): PdfEdits => ({ marks: new Map(), rotate: new Map(), remove: new Set() })

export function hasEdits(e: PdfEdits): boolean {
  return [...e.marks.values()].some((m) => m.length > 0) || e.rotate.size > 0 || e.remove.size > 0
}

function hex(c: string) {
  const n = parseInt(c.replace('#', ''), 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

const LINE_HEIGHT = 1.3
const TEXT_FONT = '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif'

/** 여러 줄 글자를 투명 배경 PNG로 그린다. 크기는 pt 단위로 돌려준다 */
export async function textToPng(text: string, sizePt: number, color: string): Promise<{ png: Uint8Array; width: number; height: number }> {
  const scale = 4
  const lines = text.split('\n')
  const c = document.createElement('canvas')
  const g = c.getContext('2d')!
  const font = `${sizePt * scale}px ${TEXT_FONT}`
  g.font = font
  const width = Math.max(1, ...lines.map((l) => g.measureText(l).width)) / scale
  const height = lines.length * sizePt * LINE_HEIGHT
  c.width = Math.ceil(width * scale) + 2
  c.height = Math.ceil(height * scale) + 2
  g.font = font
  g.fillStyle = color
  g.textBaseline = 'top'
  lines.forEach((l, i) => g.fillText(l, 1, 1 + i * sizePt * LINE_HEIGHT * scale + sizePt * 0.1 * scale))
  const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('그림 변환 실패'))), 'image/png'))
  return { png: new Uint8Array(await blob.arrayBuffer()), width: c.width / scale, height: c.height / scale }
}

export async function applyPdfEdits(bytes: Uint8Array, edits: PdfEdits): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false })
  const pages = pdf.getPages()

  for (const [index, marks] of edits.marks) {
    const page = pages[index]
    if (!page) continue
    for (const m of marks) {
      if (m.kind === 'ink') {
        if (m.points.length === 0) continue
        const pts = m.points.length === 1 ? [m.points[0], [m.points[0][0] + 0.01, m.points[0][1]] as [number, number]] : m.points
        // drawSvgPath는 y축이 아래로 가는 SVG 좌표를 받으므로 y의 부호를 바꿔 넘긴다
        const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${(-y).toFixed(2)}`).join(' ')
        page.drawSvgPath(d, {
          x: 0,
          y: 0,
          borderColor: hex(m.color),
          borderWidth: m.width,
          borderOpacity: m.opacity,
          borderLineCap: LineCapStyle.Round,
        })
      } else {
        const { png, width, height } = await textToPng(m.text, m.sizePt, m.color)
        const img = await pdf.embedPng(png)
        // (x, y)는 글자 상자의 왼쪽 위
        page.drawImage(img, { x: m.x, y: m.y - height, width, height })
      }
    }
  }

  for (const [index, add] of edits.rotate) {
    const page = pages[index]
    if (page) page.setRotation(degrees((((page.getRotation().angle + add) % 360) + 360) % 360))
  }

  // 뒤에서부터 지워야 앞쪽 번호가 바뀌지 않는다
  for (const index of [...edits.remove].sort((a, b) => b - a)) {
    if (pdf.getPageCount() > 1) pdf.removePage(index)
  }

  return pdf.save({ useObjectStreams: true })
}
