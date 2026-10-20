import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { isNative } from './lib/native'

// 웹(PWA)으로 쓸 때만 서비스 워커를 등록해 오프라인에서도 열리게 한다.
// 안드로이드 앱은 파일이 이미 앱 안에 들어 있으므로 필요 없다.
if (!isNative() && import.meta.env.PROD) registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
