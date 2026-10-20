import { useEffect, useState, type RefObject } from 'react'

export interface ViewerProps {
  bytes: Uint8Array
  name: string
  /** 1 = 화면 폭에 맞춤 */
  zoom: number
  /** 툴바에 보여줄 위치 정보 (예: "3 / 12") */
  onStatus?: (text: string) => void
}

/**
 * 문서가 들어갈 화면 폭을 따라간다 (화면 회전·창 크기 변경 대응).
 * 뷰어 자신은 확대하면 내용만큼 넓어지므로, 폭이 고정된 바깥 스크롤 영역을 잰다.
 */
export function useWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current?.parentElement ?? ref.current
    if (!el) return
    const update = () => setWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return width
}

/** 화면 폭에 맞추는 배율. 양옆 여백을 빼고 계산한다 */
export function fitScale(available: number, natural: number, gutter = 16): number {
  if (!available || !natural) return 1
  return Math.max(0.05, (available - gutter * 2) / natural)
}

/** 문서 안의 링크는 http(s)·mailto만 남기고 새 창으로 연다 (javascript: 링크 차단) */
export function sanitizeLinks(root: HTMLElement) {
  for (const a of Array.from(root.querySelectorAll('a[href]'))) {
    const href = a.getAttribute('href') ?? ''
    if (href.startsWith('#')) continue
    if (/^(https?:|mailto:)/i.test(href.trim())) {
      a.setAttribute('target', '_blank')
      a.setAttribute('rel', 'noopener noreferrer')
    } else {
      a.removeAttribute('href')
    }
  }
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  return String(e)
}

/**
 * 지금 보고 있는 쪽 번호(1부터). 화면 맨 위에 걸친 쪽을 현재 쪽으로 보고, 끝까지 내리면 마지막 쪽으로 본다.
 * 작은 쪽 여러 장이 한 화면에 보여도 번호가 튀지 않는다.
 */
export function useCurrentPage(ref: RefObject<HTMLElement | null>, selector: string, count: number): number {
  const [current, setCurrent] = useState(1)
  useEffect(() => {
    const scroller = ref.current?.parentElement
    if (!scroller || !count) return
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const line = scroller.getBoundingClientRect().top + 40
        const pages = ref.current?.querySelectorAll(selector) ?? []
        if (pages.length && scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2 && scroller.scrollTop > 0) {
          setCurrent(pages.length)
          return
        }
        let idx = 0
        for (let i = 0; i < pages.length; i++) {
          if (pages[i].getBoundingClientRect().bottom > line) {
            idx = i
            break
          }
          idx = i
        }
        setCurrent(idx + 1)
      })
    }
    update()
    scroller.addEventListener('scroll', update, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', update)
    }
  }, [ref, selector, count])
  return current
}
