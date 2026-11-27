
'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink, LockKeyhole, ShieldCheck, Tv, X } from 'lucide-react'
import type { TitleRecord } from './title-card'
import type { StreamResult } from './streaming-app'

type ShakaTrack = {
  id: number
  language?: string
  label?: string | null
  active?: boolean
  height?: number
}

type ShakaPlayerInstance = {
  configure: (config: Record<string, unknown>) => boolean
  load: (uri: string, startTime?: number) => Promise<void>
  destroy: () => Promise<void>
  getAudioTracks: () => ShakaTrack[]
  selectAudioTrack: (track: ShakaTrack) => void
  getTextTracks: () => ShakaTrack[]
  selectTextTrack: (track?: ShakaTrack | null) => void
  addEventListener: (type: string, listener: EventListener) => void
  removeEventListener: (type: string, listener: EventListener) => void
}

type ShakaApi = {
  polyfill: {
    installAll: () => void
  }
  Player: {
    new (video: HTMLVideoElement): ShakaPlayerInstance
    isBrowserSupported: () => boolean
  }
}

function getOfficialServiceUrl(source: string | null): string | null {
  if (!source) return null

  try {
    const url = new URL(source)
    if (url.protocol !== 'https:') return null

    const host = url.hostname.toLowerCase()
    const officialHosts = [
      'netflix.com',
      'primevideo.com',
      'amazon.com',
      'disneyplus.com',
      'max.com',
      'hbomax.com',
      'paramountplus.com',
      'globoplay.globo.com',
      'tv.apple.com',
    ]

    return officialHosts.some(
      (domain) => host === domain || host.endsWith('.' + domain),
    ) ? url.toString() : null
  } catch {
    return null
  }
}

function getTrailerEmbedUrl(source: string | null): string | null {
  if (!source) return null

  try {
    const url = new URL(source)
    if (url.protocol !== 'https:') return null

    const host = url.hostname.toLowerCase()

    if (host === 'youtu.be') {
      const id = url.pathname.slice(1)
      return /^[A-Za-z0-9_-]{11}$/.test(id)
        ? `https://www.youtube-nocookie.com/embed/${id}`
        : null
    }

    if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
      const id = url.pathname.startsWith('/embed/')
        ? url.pathname.split('/')[2]
        : url.searchParams.get('v')

      return id && /^[A-Za-z0-9_-]{11}$/.test(id)
        ? `https://www.youtube-nocookie.com/embed/${id}`
        : null
    }

    if (host === 'vimeo.com' || host === 'www.vimeo.com') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id && /^\d+$/.test(id)
        ? `https://player.vimeo.com/video/${id}`
        : null
    }

    return null
  } catch {
    return null
  }
}

function getTrackLabel(track: ShakaTrack, index: number) {
  return track.label || track.language || `Faixa ${index + 1}`
}

export function PlayerDialog({
  title,
  stream,
  loading,
  message,
  onClose,
  onVerifyPin,
  onSaveProgress,
  initialTime,
  onSavePlaybackTime,
  onClearPlayback,
}: {
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
  const [audioTracks, setAudioTracks] = useState<ShakaTrack[]>([])
  const [textTracks, setTextTracks] = useState<ShakaTrack[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<ShakaPlayerInstance | null>(null)
  const lastSavedAt = useRef(0)
  const restoredTimeRef = useRef(false)

  const playable = stream?.status === 'ok' && Boolean(stream.video_url)
  const requiresPin = stream?.status === 'pin'

  // Links externos só podem aparecer depois da autorização do Supabase.
  const officialUrl = playable
    ? getOfficialServiceUrl(stream?.video_url ?? null)
    : null

  const trailerUrl = playable
    ? getTrailerEmbedUrl(stream?.video_url ?? null)
    : null

  const source = stream?.video_url ?? ''
  const isAdaptiveManifest = /\.(m3u8|mpd)(?:$|[?#])/i.test(source)

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setCheckingPin(true)
    setPinError('')

    try {
      const result = await onVerifyPin(pin)

      if (result.status !== 'ok') {
        setPinError(
          result.status === 'pin'
            ? 'PIN incorreto. Tente novamente.'
            : 'Não foi possível liberar este título.',
        )
        setPin('')
      }
    } catch {
      setPinError('Não foi possível validar o PIN. Tente novamente.')
    } finally {
      setCheckingPin(false)
    }
  }

  async function saveVideoProgress(
    video: HTMLVideoElement,
    force = false,
  ) {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return

    onSavePlaybackTime(video.currentTime)

    const now = Date.now()

    if (!force && now - lastSavedAt.current < 15000) return

    lastSavedAt.current = now

    const percent = video.ended
      ? 100
      : Math.min(
          99,
          Math.floor((video.currentTime / video.duration) * 100),
        )

    await onSaveProgress(percent)
  }

  useEffect(() => {
    const video = videoRef.current

    if (!playable || !video || !source || officialUrl || trailerUrl) {
      return
    }

    let cancelled = false
    let player: ShakaPlayerInstance | null = null

    setPlaybackError('')
    setAudioTracks([])
    setTextTracks([])
    restoredTimeRef.current = false
    lastSavedAt.current = 0

    const refreshTracks: EventListener = () => {
      if (!player) return

      setAudioTracks(player.getAudioTracks())
      setTextTracks(player.getTextTracks())
    }

    const handlePlayerError: EventListener = (event) => {
      const detail = (event as CustomEvent).detail
      const code = detail?.code

      console.error('[IBStreaming Shaka] Erro de reprodução:', detail)

      if (!cancelled) {
        setPlaybackError(
          code
            ? `Falha na reprodução (código ${code}). Confira a fonte, o formato, o DRM e as permissões do servidor.`
            : 'Não foi possível reproduzir este conteúdo. Confira a fonte e as permissões do servidor.',
        )
      }
    }

    async function startPlayback() {
      try {
        if (isAdaptiveManifest) {
          const imported = await import('shaka-player') as unknown as {
            default?: ShakaApi
          } & ShakaApi

          const shaka = imported.default ?? imported

          if (cancelled) return

          shaka.polyfill.installAll()

          if (!shaka.Player.isBrowserSupported()) {
            throw new Error('Navegador incompatível com Shaka Player.')
          }

          player = new shaka.Player(video)
          playerRef.current = player

          player.addEventListener('error', handlePlayerError)
          player.addEventListener('trackschanged', refreshTracks)
          player.addEventListener('variantchanged', refreshTracks)

          // Mantém a adaptação automática de qualidade.
          player.configure({
            streaming: {
              bufferingGoal: 30,
              rebufferingGoal: 2,
            },
          })

          await player.load(
            source,
            initialTime > 0 ? initialTime : undefined,
          )

          if (cancelled) return

          refreshTracks()
          setPlaybackError('')
        } else {
          // MP4 e outras fontes progressivas compatíveis com o navegador.
          video.src = source
          video.load()
        }
      } catch (error) {
        console.error('[IBStreaming Shaka] Falha ao iniciar:', error)

        if (!cancelled) {
          setPlaybackError(
            'Não foi possível iniciar o vídeo. Confira o endereço, o formato, o CORS e as configurações de reprodução.',
          )
        }
      }
    }

    video.onerror = () => {
      if (!cancelled) {
        setPlaybackError(
          'O navegador não conseguiu abrir esta fonte. Confira o endereço, o formato e as permissões CORS.',
        )
      }
    }

    void startPlayback()

    return () => {
      cancelled = true

      video.pause()
      video.onerror = null
      video.removeAttribute('src')
      video.load()

      if (player) {
        if (playerRef.current === player) playerRef.current = null
        player.removeEventListener('error', handlePlayerError)
        player.removeEventListener('trackschanged', refreshTracks)
        player.removeEventListener('variantchanged', refresh  function changeAudioTrack(id: string) {
    const currentPlayer = playerRef.current
    const selected = audioTracks.find((track) => String(track.id) === id)
    if (!currentPlayer || !selected) return

    try {
      currentPlayer.selectAudioTrack(selected)
      setAudioTracks(currentPlayer.getAudioTracks())
    } catch (error) {
      console.error('[IBStreaming] Falha ao selecionar áudio:', error)
      setPlaybackError('Não foi possível alterar a faixa de áudio.')
    }
  }

  function changeTextTrack(id: string) {
    const currentPlayer = playerRef.current
    if (!currentPlayer) return

    const selected = id === ''
      ? null
      : textTracks.find((track) => String(track.id) === id) ?? null

    try {
      currentPlayer.selectTextTrack(selected)
      setTextTracks(currentPlayer.getTextTracks())
    } catch (error) {
      console.error('[IBStreaming] Falha ao selecionar legenda:', error)
      setPlaybackError('Não foi possível alterar a legenda.')
    }
  }(currentPlayer) currentPlayer.selectTextTrack(selected)
    }).catch((error) => {
      console.error('[IBStreaming] Falha ao selecionar legenda:', error)
    })
  }

  const activeAudio = audioTracks.find((track) => track.active)
  const activeText = textTracks.find((track) => track.active)

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-title"
        className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#101315] shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-white/[.08] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[.17em] text-[#e6b85c]">
              IBStreaming Player
            </p>
            <h2
              id="player-title"
              className="mt-1 truncate text-base font-semibold text-white"
            >
              {title.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar player"
            className="grid size-9 shrink-0 place-items-center rounded-full text-white/50 hover:bg-white/[.08] hover:text-white"
          >
            <X size={19} />
          </button>
        </header>

        <div className="bg-black">
          {playable && source && !officialUrl && !trailerUrl ? (
            <video
              ref={videoRef}
              controls
              playsInline
              preload="metadata"
              aria-label={`Reproduzir ${title.title}`}
              className="aspect-video w-full"
              onLoadedMetadata={(event) => {
                const video = event.currentTarget

                if (
                  !isAdaptiveManifest &&
                  !restoredTimeRef.current &&
                  initialTime > 0 &&
                  Number.isFinite(video.duration) &&
                  initialTime < video.duration
                ) {
                  video.currentTime = initialTime
                }

                restoredTimeRef.current = true
              }}
              onTimeUpdate={(event) => {
                void saveVideoProgress(event.currentTarget)
              }}
              onPause={(event) => {
                void saveVideoProgress(event.currentTarget, true)
              }}
              onEnded={(event) => {
                void saveVideoProgress(event.currentTarget, true)
                  .finally(onClearPlayback)
              }}
            />
          ) : officialUrl ? (
            <div className="grid aspect-video place-items-center p-6 text-center">
              <div className="max-w-md">
                <span className="mx-auto grid size-12 place-items-center rounded-full border border-white/10 bg-white/[.05] text-white/70">
                  <ExternalLink size={22} />
                </span>
                <p className="mt-4 text-sm font-semibold text-white">
                  Continue no serviço oficial
                </p>
                <p className="mt-2 text-xs leading-5 text-white/45">
                  Este título usa reprodução protegida pelo provedor. Abra a página oficial e entre na sua conta para assistir.
                </p>
                <a
                  href={officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#e6b85c] px-5 text-xs font-semibold text-[#16130b] hover:bg-[#f0ca76]"
                >
                  Abrir serviço oficial <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ) : trailerUrl ? (
            <div className="aspect-video bg-black">
              <iframe
                src={trailerUrl}
                title={`Trailer de ${title.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          ) : (
            <div className="grid aspect-video place-items-center p-6 text-center">
              {loading ? (
                <div role="status" className="text-sm text-white/60">
                  <span className="mx-auto mb-3 block size-5 animate-spin rounded-full border-2 border-white/20 border-t-[#e6b85c]" />
                  Verificando acesso ao título…
                </div>
              ) : requiresPin ? (
                <div className="w-full max-w-sm">
                  <span className="mx-auto grid size-12 place-items-center rounded-full border border-white/10 bg-white/[.05] text-white/75">
                    <LockKeyhole size={21} />
                  </span>

                  <p className="mt-4 text-sm font-semibold text-white">
                    Digite o PIN do perfil
                  </p>

                  <form onSubmit={verify} className="mt-4 flex gap-2">
                    <label className="sr-only" htmlFor="player-pin">
                      PIN do perfil
                    </label>

                    <input
                      id="player-pin"
                      className="field-dark min-w-0 flex-1"
                      type="password"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={8}
                      value={pin}
                      onChange={(event) => setPin(event.target.value)}
                      placeholder="Digite o PIN"
                    />

                    <button
                      type="submit"
                      disabled={checkingPin || !pin}
                      className="rounded-lg bg-[#e6b85c] px-4 text-xs font-semibold text-[#16130b] disabled:opacity-50"
                    >
                      {checkingPin ? 'Verificando…' : 'Confirmar'}
                    </button>
                  </form>

                  {pinError && (
                    <p role="alert" className="mt-3 text-xs text-[#f0a891]">
                      {pinError}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <span className="mx-auto grid size-12 place-items-center rounded-full border border-white/10 bg-white/[.05] text-white/70">
                    <ShieldCheck size={22} />
                  </span>

                  <p role="status" className="mt-4 text-sm font-medium text-white/80">
                    {playbackError ||
                      message ||
                      (stream?.status === 'ok'
                        ? 'Vídeo ainda não cadastrado'
                        : 'Preparando reprodução…')}
                  </p>

                  {stream?.status !== 'ok' &&
                    stream?.status !== 'sem_video' && (
                      <div className="mt-3 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[.12em] text-white/40">
                        <Tv size={13} />
                        Acesso conferido antes da reprodução
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div>

        {playable && isAdaptiveManifest && (
          <div className="flex flex-wrap gap-4 border-t border-white/[.08] px-5 py-3 sm:px-6">
            {audioTracks.length > 1 && (
              <label className="flex items-center gap-2 text-xs text-white/60">
                Áudio
                <select
                  value={activeAudio ? String(activeAudio.id) : ''}
                  onChange={(event) => changeAudioTrack(event.target.value)}
                  className="max-w-40 rounded-md border border-white/10 bg-[#171b1d] px-2 py-1.5 text-xs text-white"
                >
                  {audioTracks.map((track, index) => (
                    <option key={track.id} value={String(track.id)}>
                      {getTrackLabel(track, index)}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {textTracks.length > 0 && (
              <label className="flex items-center gap-2 text-xs text-white/60">
                Legendas
                <select
                  value={activeText ? String(activeText.id) : ''}
                  onChange={(event) => changeTextTrack(event.target.value)}
                  className="max-w-40 rounded-md border border-white/10 bg-[#171b1d] px-2 py-1.5 text-xs text-white"
                >
                  <option value="">Desativadas</option>
                  {textTracks.map((track, index) => (
                    <option key={track.id} value={String(track.id)}>
                      {getTrackLabel(track, index)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}

        {stream?.credit !== null && stream?.credit !== undefined && (
          <p className="border-t border-white/[.08] px-5 py-3 text-xs text-white/55 sm:px-6">
            Crédito:{' '}
            <span className="font-medium text-white/80">
              {stream.credit}
            </span>
          </p>
        )}
      </section>
    </div>
  )
}
