'use client'

import { useRef, useState } from 'react'
import { getVideoEmbedUrl } from '@/lib/media-source'
import { useUniversalMediaSource } from '@/lib/use-universal-media-source'
import { LockKeyhole, ShieldCheck, Tv, X } from 'lucide-react'
import type { TitleRecord } from './title-card'
import type { StreamResult } from './streaming-app'

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
  const [playbackMessage, setPlaybackMessage] = useState('')
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

  const embedUrl = playable ? getVideoEmbedUrl(stream?.video_url ?? null) : null
  useUniversalMediaSource(videoRef, stream?.video_url ?? null, setPlaybackMessage, playable && !embedUrl)

  return <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="player-title" className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#101315] shadow-2xl">
      <header className="flex items-center justify-between border-b border-white/[.08] px-5 py-4 sm:px-6"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.17em] text-[#e6b85c]">IBStreaming Player</p><h2 id="player-title" className="mt-1 truncate text-base font-semibold text-white">{title.title}</h2></div><button type="button" onClick={onClose} aria-label="Fechar player" className="grid size-9 shrink-0 place-items-center rounded-full text-white/50 hover:bg-white/[.08] hover:text-white"><X size={19} /></button></header>
      <div className="bg-black">
        {playable && stream?.video_url ? (embedUrl ? <iframe
          key={embedUrl}
          src={embedUrl}
          title={`Vídeo incorporado - ${title.title}`}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="aspect-video w-full bg-black"
        /> : <video
          key={stream.video_url}
          ref={videoRef}
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
        />) : <div className="grid aspect-video place-items-center p-6 text-center">
          {loading ? <div role="status" className="text-sm text-white/60"><span className="mx-auto mb-3 block size-5 animate-spin rounded-full border-2 border-white/20 border-t-[#e6b85c]" />Verificando acesso ao título…</div>
            : requiresPin ? <div className="w-full max-w-sm"><span className="mx-auto grid size-12 place-items-center rounded-full border border-white/10 bg-white/[.05] text-white/75"><LockKeyhole size={21} /></span><p className="mt-4 text-sm font-semibold text-white">Digite o PIN do perfil</p><form onSubmit={verify} className="mt-4 flex gap-2"><label className="sr-only" htmlFor="player-pin">PIN do perfil</label><input id="player-pin" className="field-dark min-w-0 flex-1" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={pin} onChange={(event) => setPin(event.target.value)} placeholder="Digite o PIN" /><button disabled={checkingPin || !pin} className="rounded-lg bg-[#e6b85c] px-4 text-xs font-semibold text-[#16130b] disabled:opacity-50">{checkingPin ? 'Verificando…' : 'Confirmar'}</button></form>{pinError && <p role="alert" className="mt-3 text-xs text-[#f0a891]">{pinError}</p>}</div>
              : <div><span className="mx-auto grid size-12 place-items-center rounded-full border border-white/10 bg-white/[.05] text-white/70"><ShieldCheck size={22} /></span><p role="status" className="mt-4 text-sm font-medium text-white/80">{message ?? (stream?.status === 'ok' ? 'Vídeo ainda não cadastrado' : 'Preparando reprodução…')}</p>{stream?.status !== 'ok' && stream?.status !== 'sem_video' && <div className="mt-3 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[.12em] text-white/40"><Tv size={13} />Acesso conferido antes da reprodução</div>}</div>}
        </div>}
      </div>
      {playable && playbackMessage && <p role="status" className="border-t border-white/[.08] px-5 py-3 text-xs text-white/45">{playbackMessage}</p>}
      {stream?.credit !== null && stream?.credit !== undefined && <p className="border-t border-white/[.08] px-5 py-3 text-xs text-white/55 sm:px-6">Crédito: <span className="font-medium text-white/80">{stream.credit}</span></p>}
    </section>
  </div>
}
