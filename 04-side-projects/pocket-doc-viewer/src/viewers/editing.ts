import { createContext } from 'react'

/** 편집 화면인지 여부. 표 안의 표처럼 깊이 들어간 글자까지 내려보내기 위해 context를 쓴다 */
export const EditingContext = createContext(false)
