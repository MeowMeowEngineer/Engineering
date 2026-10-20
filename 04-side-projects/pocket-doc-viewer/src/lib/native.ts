// 안드로이드 앱(Capacitor)으로 실행될 때만 쓰는 기능.
// - 다른 앱의 '열기'·'공유'로 넘어온 파일 받기 (OpenedFilePlugin.java)
// - 하드웨어 뒤로 가기 버튼
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import { App } from '@capacitor/app'

interface OpenedFilePlugin {
  getLaunchUri(): Promise<{ uri: string | null }>
  read(opts: { uri: string }): Promise<{ name: string; data: string }>
  addListener(event: 'opened', cb: (e: { uri: string }) => void): Promise<PluginListenerHandle>
}

const OpenedFile = registerPlugin<OpenedFilePlugin>('OpenedFile')

export const isNative = () => Capacitor.isNativePlatform()

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export interface NativeHooks {
  onFile: (name: string, bytes: Uint8Array) => void
  onError: (message: string) => void
  /** 뒤로 가기를 앱이 처리했으면 true. false면 앱을 닫는다 */
  onBack: () => boolean
}

export async function initNative(hooks: NativeHooks): Promise<() => void> {
  if (!isNative()) return () => {}
  const read = async (uri: string) => {
    try {
      const { name, data } = await OpenedFile.read({ uri })
      hooks.onFile(name || '문서', base64ToBytes(data))
    } catch (e) {
      hooks.onError(e instanceof Error ? e.message : String(e))
    }
  }
  const handles = await Promise.all([
    OpenedFile.addListener('opened', (e) => void read(e.uri)),
    App.addListener('backButton', () => {
      if (!hooks.onBack()) void App.exitApp()
    }),
  ])
  const { uri } = await OpenedFile.getLaunchUri()
  if (uri) void read(uri)
  return () => handles.forEach((h) => void h.remove())
}
