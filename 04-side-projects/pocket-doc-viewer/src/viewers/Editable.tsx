import { useContext, type CSSProperties } from 'react'
import type { TextSlot } from '../lib/zipdoc'
import { EditingContext } from './editing'

/**
 * 편집 화면에서 눌러서 고칠 수 있는 글자 조각.
 * 고친 글자는 바로 원본 XML(slot)에 반영되고, 글자 모양은 원래 조각의 것을 그대로 쓴다.
 */
export function EditableText({
  slot,
  text,
  style,
  className,
}: {
  slot?: TextSlot
  text: string
  style?: CSSProperties
  className?: string
}) {
  const editing = useContext(EditingContext)
  if (!editing || !slot) {
    return (
      <span className={className} style={style}>
        {text}
      </span>
    )
  }
  return (
    <span
      className={`editable${className ? ' ' + className : ''}`}
      style={style}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck={false}
      onInput={(e) => slot.set(e.currentTarget.textContent ?? '')}
      onKeyDown={(e) => {
        // 줄바꿈은 문단 구조를 바꾸므로 받지 않는다 (Enter = 입력 끝)
        if (e.key === 'Enter') {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
    >
      {text}
    </span>
  )
}
