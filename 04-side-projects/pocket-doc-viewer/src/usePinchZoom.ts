import { useEffect, useRef, type RefObject } from 'react'

const MIN = 0.5
const MAX = 4

/**
 * 두 손가락 확대·축소. 브라우저 자체 확대 대신 문서 배율(zoom)을 바꾸고,
 * 손가락 사이 지점이 화면에서 제자리에 머물도록 스크롤을 맞춘다.
 */
export function usePinchZoom(
  ref: RefObject<HTMLElement | null>,
  zoom: number,
  setZoom: (z: number) => void,
) {
  const zoomRef = useRef(zoom)
  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let start: { dist: number; zoom: number; cx: number; cy: number; sl: number; st: number } | null = null
    let frame = 0

    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return
      const r = el.getBoundingClientRect()
      start = {
        dist: dist(e.touches),
        zoom: zoomRef.current,
        cx: (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left,
        cy: (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top,
        sl: el.scrollLeft,
        st: el.scrollTop,
      }
    }
    const onMove = (e: TouchEvent) => {
      if (!start || e.touches.length !== 2) return
      e.preventDefault()
      const s = start
      const next = Math.min(MAX, Math.max(MIN, (s.zoom * dist(e.touches)) / s.dist))
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const k = next / s.zoom
        setZoom(next)
        requestAnimationFrame(() => {
          el.scrollLeft = (s.sl + s.cx) * k - s.cx
          el.scrollTop = (s.st + s.cy) * k - s.cy
        })
      })
    }
    const onEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) start = null
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [ref, setZoom])
}
