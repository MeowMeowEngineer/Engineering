// 휴대폰 화면 크기로 앱을 열어 형식별 화면을 찍고, 콘솔 오류가 없는지 확인한다.
// 사용: npm run build && npx vite preview --port 4173 &  node scripts/screenshots.mjs [추가파일...]
import { chromium } from 'playwright'
import { existsSync } from 'node:fs'
import { basename, join } from 'node:path'

const URL = process.env.APP_URL ?? 'http://localhost:4173/'
const OUT = join(import.meta.dirname, '..', 'docs', 'screenshots')
const executablePath = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined

const browser = await chromium.launch({ executablePath })
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'ko-KR',
})
const errors = []
const page = await context.newPage()
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`))

await page.goto(URL)
await page.waitForSelector('text=문서 열기')
await page.screenshot({ path: join(OUT, 'home.png') })

const SAMPLES = [
  ['PDF', 'pdf', '.pdf-page canvas'],
  ['Word', 'docx', 'section.docx'],
  ['Excel', 'xlsx', '.sheet-table'],
  ['PPT', 'pptx', '.slide'],
  ['한글', 'hwpx', '.hwpx-page'],
]
for (const [button, shot, selector] of SAMPLES) {
  await page.click(`.sample:has-text("${button}")`)
  await page.waitForSelector(selector, { timeout: 15000 })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: join(OUT, `${shot}.png`) })
  await page.click('[aria-label="닫기"]')
  await page.waitForSelector('text=문서 열기')
}

// 저장소에 넣지 않는 외부 문서(예: .hwp)를 인자로 넘겨 확인
for (const file of process.argv.slice(2)) {
  await page.setInputFiles('input[type=file]', file)
  await page.waitForSelector('.toolbar', { timeout: 15000 })
  await page.waitForTimeout(2500)
  const msg = await page.$('.viewer-message')
  console.log(basename(file), msg ? `메시지: ${(await msg.innerText()).replace(/\s+/g, ' ')}` : '표시됨')
  await page.screenshot({ path: join(OUT, `extra-${basename(file)}.png`) })
  await page.click('[aria-label="닫기"]')
  await page.waitForSelector('text=문서 열기')
}

await browser.close()
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log('screenshots saved to', OUT)
