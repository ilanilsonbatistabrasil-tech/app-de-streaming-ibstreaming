'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink, LockKeyhole, ShieldCheck, Tv, X } from 'lucide-react'
import type { TitleRecord } from './title-card'
import type { StreamResult } from './streaming-app'

type HlsInstance = { loadSource: (url: string) => void; attachMedia: (media: HTMLVideoElement) => void; destroy: () => void }
type HlsConstructor = { new (config?: { enableWorker?: boolean }): HlsInstance; isSupported: () => boolean }
type WindowWithHls = Window & { Hls?: HlsConstructor }

function getOfficialServiceUrl(source: string | null): string | null {
  if (!source) return null
  try {
    const url = new URL(source)
    if (url.protocol !== 'https:') return null
    const host = url.hostname.toLowerCase()
    const officialHosts = ['netflix.com', 'primevideo.com', 'amazon.com', 'disneyplus.com', 'max.com', 'hbomax.com', 'paramountplus.com', 'globoplay.globo.com', 'tv.apple.com']
    return officialHosts.some((domain) => host === domain || host.endsWith('.' + domain)) ? url.toString() : null
  } catch { return null }
}

function getTrailerEmbedUrl(source: string | null): string | null {
  if (!source) return null
  try {
    const url = new URL(source)
    if (url.protocol !== 'https:') return null
    const host = url.hostname.toLowerCase()
    if (host === 'youtu.be') {
      const id = url.pathname.slice(1)
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
    if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com') {
      const id = url.pathname.startsWith('/embed/') ? url.pathname.split('/')[2] : url.searchParams.get('v')
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
    if (host === 'vimeo.com' || host === 'www.vimeo.com') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null
    }
    return null
  } catch { return null }
}

export function PlayerDialog({ title, stream, loading, message, onClose, onVerifyPin, onSaveProgress, initialTime, onSavePlaybackTime, onClearPlayback }: {
  title: TitleRecord
  stream: StreamResult | null
  loading: boolean
  message?: string | null
  onClose: () => void
  onVerifyPin: (pin: string) => Promise<StreamResult>
  onSaveProgress: (percent: number) => Promise<void>
  initialTime: number
  onSavePlaybackTime: (seconds: number) => void
  onClearPlayback: () => void
}) {
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [checkingPin, setCheckingPin] = useState(false)
  const [playbackError, setPlaybackError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastSavedAt = useRef(0)
  const restoredTimeRef = useRef(false)

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCheckingPin(true)
    setPinError('')
    const result = await onVerifyPin(pin)
    setCheckingPin(false)
    if (result.status !== 'ok') {
      setPinError(result.status === 'pin' ? 'PIN incorreto. Tente novamente.' : '')
      setPin('')
    }
  }

  async function saveVideoProgress(video: HTMLVideoElement, force = false) {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return
    onSavePlaybackTime(video.currentTime)
    const now = Date.now()
    if (!force && now - lastSavedAt.current < 15000) return
    lastSavedAt.current = now
    const percent = video.ended ? 100 : Math.min(99, Math.floor((video.currentTime / video.duration) * 100))
    await onSaveProgress(percent)
  }

  const playable = stream?.status === 'ok' && Boolean(stream.video_url)
  const requiresPin = stream?.status === 'pin'
  const officialUrl = getOfficialServiceUrl(stream?.video_url ?? null)
  const trailerUrl = getTrailerEmbedUrl(stream?.video_url ?? null)
  const isHls = Boolean(stream?.video_url && /\.m3u8(?:$|[?#])/i.test(stream.video_url))

  useEffect(() => {
    const video = videoRef.current
    const source = stream?.video_url
    if (!playable || !video || !source || !isHls || officialUrl || trailerUrl) return
    let hls: HlsInstance | null = null
    let script: HTMLScriptElement | null = null
    let cancelled = false
    const start = () => {
      if (cancelled) return
      const Hls = (window as WindowWithHls).Hls
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source
        return
      }
      if (Hls?.isSupported()) {
        hls = new Hls({ enableWorker: true })
        hls.loadSource(source)
        hls.attachMedia(video)
        setPlaybackError('')
      } else {
        setPlaybackError('Este navegador não oferece suporte a HLS. Tente abrir em outro navegador.')
      }
    }
    if ((window as WindowWithHls).Hls) start()
    else {
      script = document.querySelector<HTMLScriptElement>('script[data-ib-hls="true"]')
      if (script) {
        script.addEventListener('load', start, { once: true })
        script.addEventListener('error', () => setPlaybackError('Não foi possível carregar o suporte HLS.'), { once: true })
      } else {
        script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js'
        script.async = true
        script.dataset.ibHls = 'true'
        script.onload = start
        script.onerror = () => setPlaybackError('Não foi possível carregar o suporte HLS.')
        document.head.appendChild(script)
      }
    }
    video.onerror = () => setPlaybackError('Não foi possível reproduzir a fonte. Confira o endereço, o formato e as permissões CORS do servidor.')
    return () => {
      cancelled = true
      video.pause()
      video.removeAttribute('src')
      video.load()
      video.onerror = null
      hls?.destroy()
    }
  }, [playable, stream?.video_url, isHls, officialUrl, trailerUrl])

  return <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="player-title" className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#101315] shadow-2xl">
      <header className="flex items-center justify-between border-b border-white/[.08] px-5 py-4 sm:px-6"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.17em] text-[#e6b85c]">IBStreaming Player</p><h2 id="player-title" className="mt-1 truncate text-base font-semibold text-white">{title.title}</h2></div><button type="button" onClick={onClose} aria-label="Fechar player" className="grid size-9 shrink-0 place-items-center rounded-full text-white/50 hover:bg-white/[.08] hover:text-white"><X size={19} /></button></header>
      <div className="bg-black">
        {playable && stream?.video_url && !officialUrl && !trailerUrl ? <video
          ref={videoRef}
          key={stream.video_url}
          src={isHls ? undefined : stream.video_url}
          controls
          playsInline
          preload="metadata"
          aria-label={`Reproduzir ${title.title}`}
          className="aspect-video w-full"
          onLoadedMetadata={(event) => {
            const video = event.currentTarget
            if (!restoredTimeRef.current && initialTime > 0 && Number.isFinite(video.duration) && initialTime < video.duration) {
              video.currentTime = initialTime
            }
            restoredTimeRef.current = true
          }}
          onTimeUpdate={(event) => { void saveVideoProgress(event.currentTarget) }}
          onPause={(event) => { void saveVideoProgress(event.currentTarget, true) }}
          onEnded={(event) => { void saveVideoProgress(event.currentTarget, true).finally(onClearPlayback) }}
        /> : officialUrl ? <div className="grid aspect-video place-items-center p-6 text-center"><div className="max-w-md"><span className="mx-auto grid size-12 place-items-center rounded-full border border-white/10 bg-white/[.05] text-white/70"><ExternalLink size={22} /></span><p className="mt-4 text-sm font-semibold text-white">Continue no serviço oficial</p><p className="mt-2 text-xs leading-5 text-white/45">Este título usa reprodução protegida pelo provedor. Abra a página oficial e entre na sua conta para assistir.</p><a href={officialUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#e6b85c] px-5 text-xs font-semibold text-[#16130b] hover:bg-[#f0ca76]">Abrir serviço oficial <ExternalLink size={14} /></a></div></div> : trailerUrl ? <div className="aspect-video bg-black"><iframe src={trailerUrl} title={`Trailer de ${title.title}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className="h-full w-full" /></div> : <div className="grid aspect-video place-items-center p-6 text-center">
          {loading ? <div role="status" className="text-sm text-white/60"><span className="mx-auto mb-3 block size-5 animate-spin rounded-full border-2 border-white/20 border-t-[#e6b85c]" />Verificando acesso ao título…</div>
            : requiresPin ? <div className="w-full max-w-sm"><span className="mx-auto grid size-12 place-items-center rounded-full border border-white/10 bg-white/[.05] text-white/75"><LockKeyhole size={21} /></span><p className="mt-4 text-sm font-semibold text-white">Digite o PIN do perfil</p><form onSubmit={verify} className="mt-4 flex gap-2"><label className="sr-only" htmlFor="player-pin">PIN do perfil</label><input id="player-pin" className="field-dark min-w-0 flex-1" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={pin} onChange={(event) => setPin(event.target.value)} placeholder="Digite o PIN" /><button disabled={checkingPin || !pin} className="rounded-lg bg-[#e6b85c] px-4 text-xs font-semibold text-[#16130b] disabled:opacity-50">{checkingPin ? 'Verificando…' : 'Confirmar'}</button></form>{pinError && <p role="alert" className="mt-3 text-xs text-[#f0a891]">{pinError}</p>}</div>
              : <div><span className="mx-auto grid size-12 place-items-center rounded-full border border-white/10 bg-white/[.05] text-white/70"><ShieldCheck size={22} /></span><p role="status" className="mt-4 text-sm font-medium text-white/80">{playbackError || message || (stream?.status === 'ok' ? 'Vídeo ainda não cadastrado' : 'Preparando reprodução…')}</p>{stream?.status !== 'ok' && stream?.status !== 'sem_video' && <div className="mt-3 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[.12em] text-white/40"><Tv size={13} />Acesso conferido antes da reprodução</div>}</div>}
        </div>}
      </div>
      {stream?.credit !== null && stream?.credit !== undefined && <p className="border-t border-white/[.08] px-5 py-3 text-xs text-white/55 sm:px-6">Crédito: <span className="font-medium text-white/80">{stream.credit}</span></p>}
    </section>
  </div>
}
