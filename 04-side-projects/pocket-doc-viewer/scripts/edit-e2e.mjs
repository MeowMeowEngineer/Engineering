// 실제 앱 화면에서 형식별로 [편집 → 고치기 → 완료 → 저장]을 해 보고, 내려받은 파일을 out 폴더에 남긴다.
// 남긴 파일은 LibreOffice·python-hwpx 등으로 호환성을 검사한다.
// 사용: npx vite preview --port 4173 &  node scripts/edit-e2e.mjs <out폴더> [실제 hwpx 서식 파일]
import { chromium } from 'playwright'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const URL = process.env.APP_URL ?? 'http://localhost:4173/'
const OUT = process.argv[2] ?? 'edit-out'
const FORM = process.argv[3]
const SHOTS = join(import.meta.dirname, '..', 'docs', 'screenshots')
mkdirSync(OUT, { recursive: true })
const executablePath = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined

const browser = await chromium.launch({ executablePath })
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'ko-KR',
  acceptDownloads: true,
})
// 휴대폰 크롬처럼 파일 저장 창이 없는 환경으로 맞춘다 (다운로드로 저장)
await context.addInitScript(() => {
  delete window.showSaveFilePicker
})
const errors = []
const page = await context.newPage()
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => m.type() === 'error' && !/sw\.js|404/.test(m.text()) && errors.push(`console: ${m.text()}`))
await page.goto(URL)

async function openSample(label) {
  await page.click(`.sample:has-text("${label}")`)
  await page.waitForSelector('.toolbar')
}

async function finishAndSave(file, shot) {
  await page.click('.toolbar .text-btn:has-text("완료")')
  await page.waitForSelector('.toolbar small:has-text("저장 필요")', { timeout: 20000 })
  await page.click('.toolbar .text-btn.primary:has-text("저장")')
  await page.waitForSelector('#save-name')
  if (shot) await page.screenshot({ path: join(SHOTS, shot) })
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('button:has-text("기기에 저장")')])
  await dl.saveAs(join(OUT, file))
  await page.waitForSelector('.toast')
  await page.click('[aria-label="닫기"]')
  await page.waitForSelector('text=문서 열기')
  console.log('saved', file)
}

async function editText(contains, value) {
  const el = page.locator('.editable', { hasText: contains }).first()
  await el.scrollIntoViewIfNeeded()
  await el.click()
  await el.fill(value)
}

// 한글 HWPX
await openSample('한글')
await page.click('.toolbar .text-btn:has-text("편집")')
await page.waitForSelector('.is-editing .editable')
await editText('HWPX 샘플', '앱에서 고친 제목')
await editText('부산', '부산광역시')
await page.screenshot({ path: join(SHOTS, 'edit-hwpx.png') })
await finishAndSave('ui.hwpx')

// Word
await openSample('Word')
await page.click('.toolbar .text-btn:has-text("편집")')
await page.waitForSelector('.docx-edit .editable')
await editText('Word(.docx)', '워드 문서')
await editText('광고와 회원가입', '광고 없이 무료로 씁니다.')
await page.screenshot({ path: join(SHOTS, 'edit-docx.png') })
await finishAndSave('ui.docx')

// PowerPoint
await openSample('PPT')
await page.click('.toolbar .text-btn:has-text("편집")')
await editText('포켓 문서 뷰어', '휴대폰에서 고친 발표')
await finishAndSave('ui.pptx')

// Excel: B4 칸에 숫자, F4 칸에 수식
await openSample('Excel')
await page.click('.toolbar .text-btn:has-text("편집")')
await page.waitForSelector('.formula-bar')
const cell = (r, c) => page.locator(`.sheet-table tbody tr:nth-child(${r}) td:nth-of-type(${c})`)
await cell(4, 2).click()
await page.fill('#cell-input', '777')
await page.click('.formula-bar button:has-text("입력")')
await cell(4, 6).click()
await page.fill('#cell-input', '=SUM(B4:E4)')
await page.click('.formula-bar button:has-text("입력")')
await cell(4, 1).click()
await page.screenshot({ path: join(SHOTS, 'edit-xlsx.png') })
await finishAndSave('ui.xlsx')

// PDF: 펜으로 긋기, 글자 넣기, 2쪽 회전
await openSample('PDF')
await page.click('.toolbar .text-btn:has-text("편집")')
await page.waitForSelector('.pdf-toolbar')
await page.click('.pdf-toolbar .chip:has-text("펜")')
const svg = page.locator('.pdf-ink').first()
const box = await svg.boundingBox()
await page.mouse.move(box.x + 40, box.y + 150)
await page.mouse.down()
for (let i = 1; i <= 10; i++) await page.mouse.move(box.x + 40 + i * 25, box.y + 150 + (i % 2) * 15)
await page.mouse.up()
await page.click('.pdf-toolbar .chip:has-text("형광펜")')
await page.mouse.move(box.x + 40, box.y + 200)
await page.mouse.down()
await page.mouse.move(box.x + 300, box.y + 200, { steps: 8 })
await page.mouse.up()
await page.click('.pdf-toolbar .chip:has-text("글자")')
await svg.click({ position: { x: 60, y: 240 } })
await page.fill('.pdf-text-draft textarea', '확인했습니다 ✔')
await page.click('.pdf-text-draft button:has-text("넣기")')
await page.locator('.pdf-page-tools').nth(1).locator('button:has-text("회전")').click()
await page.screenshot({ path: join(SHOTS, 'edit-pdf.png') })
await finishAndSave('ui.pdf')

// 실제 공공기관 서식(HWPX): 빈 칸 채우기
if (FORM) {
  await page.setInputFiles('input[type=file]', FORM)
  await page.waitForSelector('.hwpx-page')
  await page.click('.toolbar .text-btn:has-text("편집")')
  const empty = page.locator('.hwpx-table .editable:empty').nth(3)
  await empty.scrollIntoViewIfNeeded()
  await empty.click()
  await empty.fill('포켓 문서 뷰어로 입력')
  await editText('연구개발계획서', '연구개발계획서(수정)')
  await page.screenshot({ path: join(SHOTS, 'edit-hwpx-form.png') })
  await finishAndSave('ui-form.hwpx', 'save-sheet.png')
}

await browser.close()
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log('edit e2e ok')
