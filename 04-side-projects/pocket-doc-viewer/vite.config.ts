/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// 배포 빌드에만 콘텐츠 보안 정책(CSP)을 넣는다. 개발 서버는 인라인 스크립트를 쓰므로 제외.
// 문서 안에 숨은 스크립트가 있더라도 실행되지 않고, 앱이 외부로 통신할 수 없게 막는다.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "connect-src 'self' data: blob:",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')

function csp(): Plugin {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml: (html) =>
      html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
  }
}

export default defineConfig({
  // GitHub Pages(하위 경로)와 안드로이드 앱 양쪽에서 동작하도록 상대 경로로 빌드
  base: './',
  plugins: [
    react(),
    csp(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'samples/*'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,wasm,bcmap,pfb,ttf,icc}', 'samples/*'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
      manifest: {
        id: './',
        name: '포켓 문서 뷰어',
        short_name: '문서 뷰어',
        description: '워드·엑셀·피피티·PDF·한글 문서를 휴대폰에서 바로 여는 무료 뷰어. 문서는 기기 밖으로 나가지 않습니다.',
        lang: 'ko',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#f3f4f7',
        theme_color: '#2f6fde',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // 설치한 PWA를 파일 탐색기의 '연결 프로그램'으로 쓸 수 있게 한다 (데스크톱 크롬)
        file_handlers: [
          {
            action: './',
            accept: {
              'application/pdf': ['.pdf'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              'application/vnd.ms-excel': ['.xls'],
              'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
              'application/x-hwp': ['.hwp'],
              'application/hwp+zip': ['.hwpx'],
              'text/csv': ['.csv'],
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: 'jsdom',
  },
})
