'use client'

import { useEffect, type RefObject } from 'react'
import { getMediaSourceKind } from './media-source'

type HlsInstance = {
  loadSource: (url: string) => void
  attachMedia: (media: HTMLVideoElement) => void
  on: (event: string, callback: (_event: string, data: { fatal?: boolean }) => void) => void
  destroy: () => void
}
type HlsApi = {
  new (config?: { enableWorker?: boolean }): HlsInstance
  isSupported: () => boolean
  Events: { ERROR: string }
}
type DashPlayer = {
  initialize: (element: HTMLVideoElement, source: string, autoplay: boolean) => void
  on: (event: string, callback: () => void) => void
  reset: () => void
}
type DashApi = { MediaPlayer: () => { create: () => DashPlayer } }
type MediaWindow = Window & { Hls?: HlsApi; dashjs?: DashApi }

function loadLibrary(id: string, src: string): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>(`script[data-ib-library="${id}"]`)
  if (existing?.dataset.loaded === 'true') return Promise.resolve()

  return new Promise((resolve, reject) => {
    const script = existing ?? document.createElement('script')
    const handleLoad = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    const handleError = () => reject(new Error(`Não foi possível carregar ${id}.`))

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })
    if (!existing) {
      script.src = src
      script.async = true
      script.dataset.ibLibrary = id
      document.head.appendChild(script)
    }
  })
}

export function useUniversalMediaSource(
  videoRef: RefObject<HTMLVideoElement | null>,
  source: string | null,
  setMessage: (message: string) => void,
  enabled = true,
) {
  useEffect(() => {
    const video = videoRef.current
    if (!enabled || !video || !source) return

    let cancelled = false
    let hls: HlsInstance | null = null
    let dash: DashPlayer | null = null
    let parsedSource: URL
    try {
      parsedSource = new URL(source)
    } catch {
      setMessage('Endereço de vídeo inválido.')
      return
    }
    if (parsedSource.protocol !== 'https:') {
      setMessage('Por segurança, o player aceita endereços HTTPS de vídeo.')
      return
    }
    const kind = getMediaSourceKind(source)

    const setSafeMessage = (message: string) => {
      if (!cancelled) setMessage(message)
    }

    const startNative = () => {
      if (cancelled) return
      video.src = source
      video.load()
      setSafeMessage('')
    }

    video.onerror = () => {
      setSafeMessage('Não foi possível reproduzir este endereço. Ele precisa apontar para um arquivo de vídeo ou manifesto compatível, e o servidor deve permitir acesso ao IBStreaming.')
    }

    if (kind === 'native') {
      startNative()
    } else if (kind === 'hls' && video.canPlayType('application/vnd.apple.mpegurl')) {
      startNative()
    } else if (kind === 'hls') {
      void loadLibrary('hls', 'https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js')
        .then(() => {
          if (cancelled) return
          const Hls = (window as MediaWindow).Hls
          if (!Hls?.isSupported()) {
            setSafeMessage('Este navegador não oferece suporte a HLS. Tente uma versão MP4 ou WebM desta mídia.')
            return
          }
          hls = new Hls({ enableWorker: true })
          hls.loadSource(source)
          hls.attachMedia(video)
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) setSafeMessage('Falha na transmissão HLS. Verifique a URL, os segmentos e as permissões CORS do servidor.')
          })
          setSafeMessage('Carregando transmissão HLS…')
        })
        .catch(() => setSafeMessage('Não foi possível carregar o mecanismo HLS.'))
    } else {
      void loadLibrary('dash', 'https://cdn.jsdelivr.net/npm/dashjs@4.7.4/dist/dash.all.min.js')
        .then(() => {
          if (cancelled) return
          const dashjs = (window as MediaWindow).dashjs
          if (!dashjs) {
            setSafeMessage('Não foi possível iniciar o mecanismo MPEG-DASH.')
            return
          }
          dash = dashjs.MediaPlayer().create()
          dash.on('error', () => setSafeMessage('Falha ao carregar o vídeo MPEG-DASH. Verifique o manifesto, os segmentos e as permissões CORS.'))
          dash.initialize(video, source, true)
          setSafeMessage('Carregando transmissão MPEG-DASH…')
        })
        .catch(() => setSafeMessage('Não foi possível carregar o mecanismo MPEG-DASH.'))
    }

    return () => {
      cancelled = true
      video.pause()
      video.onerror = null
      video.removeAttribute('src')
      video.load()
      hls?.destroy()
      dash?.reset()
    }
  }, [enabled, source, setMessage, videoRef])
}
