'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import Image from 'next/image'
import type { User } from '@supabase/supabase-js'
import { Bookmark, Check, ChevronDown, CircleHelp, Clapperboard, Film, LogOut, Menu, Play, Radio, Search, Shield, Sparkles, UserRound, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthScreen } from './auth-screen'
import { ProfilePicker } from './profile-picker'
import { TitleCard, type TitleRecord } from './title-card'
import { TvGuide } from './tv-guide'
import { AdminPanel } from './admin-panel'
import { PlayerDialog } from './player-dialog'
import { importedBrazilChannels } from '@/lib/brazil-channel-catalog'
import { getVideoEmbedUrl } from '@/lib/media-source'
import { useUniversalMediaSource } from '@/lib/use-universal-media-source'

const supabase = createClient()
type Profile = { id: string; name: string; kids: boolean }
type Account = { id: string; name: string; role: string; plan_id: string }
type SavedRow = { title_id: number; added_at: string }
type ProgressRow = { title_id: number; percent: number; updated_at: string }
type Channel = { id: string; name: string; kids: boolean; stream_url: string | null; category?: string; catalog_group?: string; access_label?: string; logo_url?: string | null }
type Schedule = { channel_id: string; slot: number; program: string }

const officialShortcutChannels: Channel[] = [
  { id: 'ibstreaming-original', name: 'IBSTREAMING', kids: false, stream_url: null, category: 'Canais brasileiros', catalog_group: 'Canais brasileiros', access_label: 'Canal próprio — aguardando fonte de transmissão autorizada' },
  { id: 'official-tv-aparecida', name: 'TV Aparecida', kids: false, stream_url: 'https://www.a12.com/tv/tv-ao-vivo/' },
  { id: 'official-redetv', name: 'RedeTV! Ao Vivo', kids: false, stream_url: 'https://www.redetv.uol.com.br/aovivo' },
  { id: 'official-tv-brasil', name: 'TV Brasil', kids: false, stream_url: 'https://tvbrasil-stream.ebc.com.br/index.m3u8' },
  { id: 'official-canal-gov', name: 'Canal Gov', kids: false, stream_url: 'https://canalgov-stream.ebc.com.br/index.m3u8' },
  { id: 'official-canal-educacao', name: 'Canal Educação', kids: false, stream_url: 'https://canaleducacao-stream.ebc.com.br/index.m3u8' },
  { id: 'official-canal-libras', name: 'Canal Libras', kids: false, stream_url: 'https://canallibras-stream.ebc.com.br/mux_video_ts/index-1.m3u8' },
  { id: 'official-tv-camara', name: 'TV Câmara', kids: false, stream_url: 'https://stream3.camara.gov.br/tv1/manifest.m3u8' },
  { id: 'official-tv-camara-2', name: 'TV Câmara 2', kids: false, stream_url: 'https://stream3.camara.gov.br/tv2/manifest.m3u8' },
  { id: 'official-tv-cultura-fast', name: 'Cultura Fast', kids: false, stream_url: 'https://fpa-gateway.tvcultura.com.br:8181/memfs/606caef0-a290-413d-9f1f-8fcdb3a73831.m3u8' },
  { id: 'official-tve-rs', name: 'TVE RS', kids: false, stream_url: 'https://streaming.procergs.com.br:8443/tve/stve/playlist.m3u8' },
  { id: 'official-tv-ufop', name: 'TV UFOP', kids: false, stream_url: 'https://app.tvufop.com.br/hls/tvufop.m3u8' },
  { id: 'official-canal-uol', name: 'Canal UOL', kids: false, stream_url: 'https://video24.mais.uol.com.br/live/6146.m3u8' },
  { id: 'official-netflix', name: 'Netflix', kids: false, stream_url: 'https://www.netflix.com/br/' },
  { id: 'official-max', name: 'Max (HBO)', kids: false, stream_url: 'https://www.max.com/br/pt' },
  { id: 'official-disney-plus', name: 'Disney+', kids: false, stream_url: 'https://www.disneyplus.com/pt-br' },
  { id: 'official-espn', name: 'ESPN Brasil', kids: false, stream_url: 'https://www.espn.com.br/' },
  { id: 'official-bein', name: 'beIN SPORTS', kids: false, stream_url: 'https://www.beinsports.com/' },
  { id: 'official-globoplay', name: 'Globoplay', kids: false, stream_url: 'https://globoplay.globo.com/' },
  { id: 'official-prime-video', name: 'Prime Video', kids: false, stream_url: 'https://www.primevideo.com/' },
  { id: 'official-paramount-plus', name: 'Paramount+', kids: false, stream_url: 'https://www.paramountplus.com/br/' },
  { id: 'official-apple-tv', name: 'Apple TV', kids: false, stream_url: 'https://tv.apple.com/br' },
  { id: 'official-pluto-tv', name: 'Pluto TV (canais gratuitos)', kids: false, stream_url: 'https://pluto.tv/br/watch/live-tv/' },
  { id: 'official-samsung-tv-plus', name: 'Samsung TV Plus', kids: false, stream_url: 'https://www.samsung.com/br/tvs/smart-tv/samsung-tv-plus/' },
].map((channel) => ({ ...channel, catalog_group: 'Plataformas oficiais', access_label: 'Abrir página oficial do serviço' }))

function normalizeChannelName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function findChannelLogo(name: string, logos: Record<string, string>): string | null {
  const normalized = normalizeChannelName(name)
  if (logos[normalized]) return logos[normalized]

  // As playlists often add quality labels or suffixes to the channel name,
  // allow a conservative prefix match for names long enough to be distinctive.
  if (normalized.length < 6) return null
  const matches = Object.entries(logos)
    .filter(([key]) => key.length >= 6 && (key.startsWith(normalized) || normalized.startsWith(key)))
    .sort((a, b) => Math.abs(a[0].length - normalized.length) - Math.abs(b[0].length - normalized.length))

  if (!matches.length) return null
  if (matches.length > 1 && Math.abs(matches[0][0].length - normalized.length) === Math.abs(matches[1][0].length - normalized.length)) return null
  return matches[0][1]
}
type View = 'inicio' | 'lista' | 'ao-vivo' | 'admin'

export type StreamResult = { status: string; video_url: string | null; credit: number | string | null }

const streamMessages: Record<string, string> = {
  plano: 'Seu plano não inclui este título',
  infantil: 'Indisponível no perfil infantil',
  pin: 'Digite o PIN do perfil',
  indisponivel: 'Indisponível na sua região',
  sem_video: 'Vídeo ainda não cadastrado',
  erro: 'Não foi possível validar o acesso ao vídeo. O player continua aberto; tente novamente.',
}

function SectionHeading({ eyebrow, title, trailing }: { eyebrow: string; title: string; trailing?: React.ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#e6b85c]">{eyebrow}</p><h2 className="mt-1.5 text-xl font-semibold tracking-tight text-white">{title}</h2></div>{trailing}</div>
}

type HlsInstance = {
  loadSource: (url: string) => void
  attachMedia: (media: HTMLVideoElement) => void
  on: (event: string, callback: (_event: string, data: { fatal?: boolean }) => void) => void
  destroy: () => void
}
type HlsConstructor = {
  new (config?: { enableWorker?: boolean }): HlsInstance
  isSupported: () => boolean
  Events: { ERROR: string }
}
type WindowWithHls = Window & { Hls?: HlsConstructor }

function isExternalChannelUrl(source: string | null): boolean {
  if (!source) return false
  try {
    const url = new URL(source)
    if (url.protocol !== 'https:') return false
    const hosts = [
      'www.redetv.uol.com.br', 'redetv.uol.com.br', 'a12.com', 'cultura.uol.com.br',
      'tvbrasil.ebc.com.br', 'canalgov.ebc.com.br', 'canaleducacao.ebc.com.br',
      'www.netflix.com', 'www.max.com', 'www.disneyplus.com', 'pluto.tv', 'www.pluto.tv',
      'www.samsung.com',
      'www.espn.com.br', 'www.beinsports.com', 'globoplay.globo.com',
      'www.primevideo.com', 'www.paramountplus.com', 'tv.apple.com',
    ]
    return hosts.some((host) => url.hostname === host || url.hostname.endsWith('.' + host))
  } catch {
    return false
  }
}

function isOfficialEmbedUrl(source: string | null): boolean {
  if (!source) return false

  try {
    const url = new URL(source)
    if (url.protocol !== 'https:') return false

    const isCameraEmbed =
      (url.hostname === 'www.camara.leg.br' && url.pathname.startsWith('/tv/aovivo/embed')) ||
      (url.hostname === 'www2.camara.leg.br' && url.pathname === '/camaranoticias/tv/embedAoVivo.html')
    const isTvBrasilEmbed =
      url.hostname === 'aovivo.ebc.com.br' && url.pathname === '/embed-tvbrasil.html'
    const isTvSenadoEmbed =
      url.hostname === 'www.youtube.com' && url.pathname.startsWith('/embed/') && url.pathname.slice(7).length === 11 && /^[A-Za-z0-9_-]+$/.test(url.pathname.slice(7))

    const isTvCulturaEmbed =
      url.hostname === 'culturaplay.tvcultura.com.br' && url.pathname === '/channels/14/embed'

    return isCameraEmbed || isTvBrasilEmbed || isTvSenadoEmbed || isTvCulturaEmbed
  } catch {
    return false
  }
}

function LiveChannelPlayer({ channel, onClose }: { channel: Channel; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playerMessage, setPlayerMessage] = useState('Preparando transmissão…')

  const isOfficialEmbed = isOfficialEmbedUrl(channel.stream_url)

  const embedUrl = isOfficialEmbed ? channel.stream_url : getVideoEmbedUrl(channel.stream_url)
  useUniversalMediaSource(videoRef, channel.stream_url, setPlayerMessage, Boolean(channel.stream_url) && !embedUrl)

  return (
    <div>
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={`Vídeo incorporado - ${channel.name}`}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="aspect-video w-full bg-black"
        />
      ) : (
        <video ref={videoRef} controls autoPlay playsInline preload="none" className="aspect-video w-full bg-black" />
      )}
      <p role="status" className="px-5 py-3 text-xs text-white/45">{embedUrl ? 'Reprodução incorporada pelo provedor.' : playerMessage}</p>
      <div className="flex justify-end px-5 pb-4">
        <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white/70 hover:bg-white/[.06]">Fechar</button>
      </div>
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-2xl border border-dashed border-white/10 bg-white/[.015] px-5 py-14 text-center"><CircleHelp size={25} className="mx-auto text-white/25" /><p className="mt-4 text-sm font-medium text-white/70">{title}</p><p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-white/40">{description}</p></div>
}

export function StreamingApp() {
  const [view, setView] = useState<View>('inicio')
  const [channelLogos, setChannelLogos] = useState<Record<string, string>>({})
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileReady, setProfileReady] = useState(false)
  const [streamResult, setStreamResult] = useState<StreamResult | null>(null)
  const [streamLoading, setStreamLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [type, setType] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [noticeTone, setNoticeTone] = useState<'error' | 'success'>('error')
  const [playerTitle, setPlayerTitle] = useState<TitleRecord | null>(null)
  const [playerChannel, setPlayerChannel] = useState<Channel | null>(null)
  const [resumeAtSeconds, setResumeAtSeconds] = useState(0)
  const restoredPlaybackKeyRef = useRef<string | null>(null)
  const { data: user, isLoading: authLoading, error: authError, mutate: refreshUser } = useSWR<User | null>('ibstreaming-user', async () => {
    const { data, error } = await supabase.auth.getUser()
    // Sem sessão é um estado normal para quem ainda não entrou; não deve
    // disparar retries do SWR nem desmontar o formulário de login.
    if (error) {
      if (error.name === 'AuthSessionMissingError' || error.code === 'session_not_found') return null
      throw error
    }
    return data.user
  }, { shouldRetryOnError: false })
  const userId = user?.id
  const playbackStorageKey = userId && profile ? `ibstreaming-playback:${userId}:${profile.id}` : null
  useEffect(() => {
    let active = true
    fetch('/api/playlist/logos', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : {})
      .then((logos: Record<string, string>) => { if (active) setChannelLogos(logos) })
      .catch(() => { if (active) setChannelLogos({}) })
    return () => { active = false }
  }, [])
  useEffect(() => {
    console.info('[IBStreaming login] Estado de autenticação', { loading: authLoading, hasUser: Boolean(user), hasError: Boolean(authError) })
  }, [authLoading, user, authError])
  const { data: account } = useSWR<Account | null>(userId ? ['account', userId] : null, async () => {
    const { data, error } = await supabase.from('accounts').select('id,name,role,plan_id').eq('id', userId).maybeSingle()
    if (error) return null
    return data
  })
  const { data: profiles = [], isLoading: profilesLoading, mutate: refreshProfiles } = useSWR<Profile[]>(userId ? ['profiles', userId] : null, async () => {
    const { data, error } = await supabase.from('profiles').select('id,name,kids').order('created_at')
    if (error) throw error
    return data ?? []
  })
  const { data: catalog = [], isLoading: catalogLoading, error: catalogError } = useSWR<TitleRecord[]>(profile ? ['catalog', profile.id, debouncedQuery, type] : null, async () => {
    const { data, error } = await supabase.rpc('get_catalog', { p_profile: profile!.id, p_region: 'BR', p_q: debouncedQuery || null, p_type: type || null })
    if (error) throw error
    return (data ?? []) as TitleRecord[]
  }, { keepPreviousData: true })
  const { data: savedRows = [], mutate: refreshSaved } = useSWR<SavedRow[]>(profile ? ['saved', profile.id] : null, async () => {
    const { data, error } = await supabase.from('my_list').select('title_id,added_at').eq('profile_id', profile!.id).order('added_at', { ascending: false })
    if (error) throw error
    return data ?? []
  })
  const { data: progressRows = [], mutate: refreshProgress } = useSWR<ProgressRow[]>(profile ? ['progress', profile.id] : null, async () => {
    const { data, error } = await supabase.from('progress').select('title_id,percent,updated_at').eq('profile_id', profile!.id).order('updated_at', { ascending: false })
    if (error) throw error
    return data ?? []
  })
  const { data: channels = [] } = useSWR<Channel[]>(userId ? 'channels' : null, async () => {
    const categorized = await supabase.from('canais').select('id,name:nome,kids:crianças,stream_url,category:categoria').order('nome')
    if (categorized.error && /categoria/i.test(categorized.error.message)) {
      // Compatibilidade temporária até a migration de categorias ser aplicada no Supabase.
      const legacy = await supabase.from('canais').select('id,name:nome,kids:crianças,stream_url').order('nome')
      if (legacy.error) throw legacy.error
      return (legacy.data ?? []) as Channel[]
    }
    if (categorized.error) throw categorized.error
    return (categorized.data ?? []) as Channel[]
  })
  const { data: schedule = [] } = useSWR<Schedule[]>(userId ? 'channel-schedule' : null, async () => {
    const { data, error } = await supabase.from('channel_schedule').select('channel_id,slot,program').order('slot')
    if (error) throw error
    return data ?? []
  })
  const savedIds = useMemo(() => savedRows.map((row) => row.title_id), [savedRows])
  const progressById = useMemo(() => new Map(progressRows.map((row) => [row.title_id, row.percent])), [progressRows])
  const titleMap = useMemo(() => new Map(catalog.map((item) => [item.id, item])), [catalog])
  const savedTitles = useMemo(() => savedIds.map((id) => titleMap.get(id)).filter((item): item is TitleRecord => Boolean(item) && (!profile?.kids || item!.age <= 10)), [savedIds, titleMap, profile?.kids])
  const continueTitles = useMemo(() => progressRows.filter((row) => row.percent > 0 && row.percent < 100).map((row) => titleMap.get(row.title_id)).filter((item): item is TitleRecord => Boolean(item) && (!profile?.kids || item!.age <= 10)), [progressRows, titleMap, profile?.kids])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!userId || profilesLoading) {
      setProfile(null)
      setProfileReady(false)
      return
    }

    const storageKey = `ibstreaming-profile:${userId}`
    const savedProfileId = window.localStorage.getItem(storageKey)
    const savedProfile = profiles.find((item) => item.id === savedProfileId)

    if (savedProfile) {
      setProfile(savedProfile)
    } else {
      setProfile(null)
      if (savedProfileId) window.localStorage.removeItem(storageKey)
    }
    setProfileReady(true)
  }, [userId, profiles, profilesLoading])

  useEffect(() => {
    if (!userId || !profileReady || !profile) return

    const savedView = window.localStorage.getItem(`ibstreaming-view:${userId}:${profile.id}`)
    const validViews: View[] = ['inicio', 'lista', 'ao-vivo', 'admin']
    const canRestore = savedView && validViews.includes(savedView as View) && (savedView !== 'admin' || account?.role === 'admin')
    setView(canRestore ? savedView as View : 'inicio')
  }, [userId, profile, profileReady, account?.role])

  function changeView(nextView: View) {
    setView(nextView)
    if (userId && profile) {
      window.localStorage.setItem(`ibstreaming-view:${userId}:${profile.id}`, nextView)
    }
  }

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      console.info('[IBStreaming login] Evento Supabase Auth:', event)
      window.setTimeout(() => refreshUser(), 0)
    })
    return () => data.subscription.unsubscribe()
  }, [refreshUser])

  function showNotice(message: string, tone: 'error' | 'success' = 'error') {
    setNotice(message)
    setNoticeTone(tone)
    window.setTimeout(() => setNotice(''), 5200)
  }

  async function signOut() {
    if (userId) {
      window.localStorage.removeItem(`ibstreaming-profile:${userId}`)
      if (profile) window.localStorage.removeItem(`ibstreaming-view:${userId}:${profile.id}`)
    }
    await supabase.auth.signOut()
    setProfile(null)
    setView('inicio')
    await refreshUser(null)
  }

  async function toggleSaved(title: TitleRecord) {
    if (!profile) return
    const exists = savedIds.includes(title.id)
    const result = exists
      ? await supabase.from('my_list').delete().eq('profile_id', profile.id).eq('title_id', title.id)
      : await supabase.from('my_list').insert({ profile_id: profile.id, title_id: title.id })
    if (result.error) {
      showNotice('Não foi possível atualizar sua lista. Verifique a sessão do perfil.')
      return
    }
    await refreshSaved()
    showNotice(exists ? 'Removido da sua lista.' : 'Adicionado à sua lista.', 'success')
  }

  async function requestStream(title: TitleRecord, pin: string | null = null): Promise<StreamResult> {
    if (!profile) return { status: 'indisponivel', video_url: null, credit: null }
    const { data, error } = await supabase.rpc('get_stream', {
      p_profile: profile.id,
      p_title: title.id,
      p_region: 'BR',
      p_pin: pin,
    })
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    return {
      status: String(row?.status ?? 'indisponivel'),
      video_url: typeof row?.video_url === 'string' ? row.video_url : null,
      credit: row?.credit ?? null,
    }
  }

  async function playTitle(title: TitleRecord) {
    setPlayerTitle(title)
    setResumeAtSeconds(0)
    if (playbackStorageKey) window.localStorage.setItem(playbackStorageKey, JSON.stringify({ titleId: title.id, title, currentTime: 0 }))
    setStreamResult(null)
    setStreamLoading(true)
    try {
      setStreamResult(await requestStream(title))
    } catch (error) {
      console.error('[IBStreaming player] Falha ao validar o vídeo:', error)
      setStreamResult({ status: 'erro', video_url: null, credit: null })
      showNotice('Não foi possível validar o acesso ao vídeo. O player permanecerá aberto.')
    } finally {
      setStreamLoading(false)
    }
  }

  useEffect(() => {
    if (!playbackStorageKey || !profile || restoredPlaybackKeyRef.current === playbackStorageKey) return

    const raw = window.localStorage.getItem(playbackStorageKey)
    if (!raw) {
      restoredPlaybackKeyRef.current = playbackStorageKey
      return
    }

    try {
      const saved = JSON.parse(raw) as { titleId?: number; currentTime?: number; title?: TitleRecord }
      const savedTitle = saved.title && typeof saved.title.id === 'number' && typeof saved.title.title === 'string'
        ? saved.title
        : catalog.find((item) => item.id === Number(saved.titleId))

      // Registros antigos guardavam apenas o ID. Aguarda o catálogo antes
      // de decidir que o título não existe; registros novos já incluem o título.
      if (!savedTitle && catalogLoading) return
      if (!savedTitle) {
        restoredPlaybackKeyRef.current = playbackStorageKey
        window.localStorage.removeItem(playbackStorageKey)
        return
      }

      restoredPlaybackKeyRef.current = playbackStorageKey
      const savedTime = Number(saved.currentTime)
      setResumeAtSeconds(Number.isFinite(savedTime) && savedTime > 0 ? savedTime : 0)
      setPlayerTitle(savedTitle)
      setStreamResult(null)
      setStreamLoading(true)
      void requestStream(savedTitle).then(setStreamResult).catch((error) => {
        console.error('[IBStreaming player] Falha ao retomar o vídeo:', error)
        setStreamResult({ status: 'erro', video_url: null, credit: null })
        showNotice('Não foi possível validar o acesso para retomar este vídeo. O player permanecerá aberto.')
      }).finally(() => setStreamLoading(false))
    } catch {
      restoredPlaybackKeyRef.current = playbackStorageKey
      window.localStorage.removeItem(playbackStorageKey)
    }
  }, [playbackStorageKey, profile, catalog, catalogLoading])

  function savePlaybackTime(currentTime: number) {
    if (!playbackStorageKey || !playerTitle || !Number.isFinite(currentTime)) return
    window.localStorage.setItem(playbackStorageKey, JSON.stringify({ titleId: playerTitle.id, title: playerTitle, currentTime }))
  }

  function clearPlaybackResume() {
    if (playbackStorageKey) window.localStorage.removeItem(playbackStorageKey)
    setResumeAtSeconds(0)
  }

  async function verifyPin(pin: string) {
    if (!playerTitle) return { status: 'indisponivel', video_url: null, credit: null } as StreamResult
    setStreamLoading(true)
    try {
      const result = await requestStream(playerTitle, pin)
      setStreamResult(result)
      return result
    } catch {
      const result = { status: 'indisponivel', video_url: null, credit: null }
      setStreamResult(result)
      return result
    } finally {
      setStreamLoading(false)
    }
  }

  async function saveProgress(percent: number) {
    if (!profile || !playerTitle) return
    const existing = progressRows.some((row) => row.title_id === playerTitle.id)
    const result = existing
      ? await supabase.from('progress').update({ percent, updated_at: new Date().toISOString() }).eq('profile_id', profile.id).eq('title_id', playerTitle.id)
      : await supabase.from('progress').insert({ profile_id: profile.id, title_id: playerTitle.id, percent })
    if (result.error) {
      showNotice('Não foi possível salvar o progresso deste título.')
      return
    }
    await refreshProgress()
  }

  if (authError) return <AuthScreen onAuthenticated={() => refreshUser()} />
  if (authLoading && user === undefined) return <main className="grid min-h-screen place-items-center bg-[#080a0c]"><div className="flex items-center gap-3 text-sm text-white/55"><span className="size-4 animate-spin rounded-full border-2 border-white/15 border-t-[#e6b85c]" />Preparando sua sessão…</div></main>
  if (!user) return <AuthScreen onAuthenticated={() => refreshUser()} />
  if (!profileReady) return <main className="grid min-h-screen place-items-center bg-[#080a0c]"><div className="flex items-center gap-3 text-sm text-white/55"><span className="size-4 animate-spin rounded-full border-2 border-white/15 border-t-[#e6b85c]" />Carregando seus perfis…</div></main>
  if (!profile) return <ProfilePicker profiles={profiles} onCreated={() => refreshProfiles()} onSelect={(selected) => { window.localStorage.setItem(`ibstreaming-profile:${userId}`, selected.id); setProfile(selected); window.localStorage.setItem(`ibstreaming-view:${userId}:${selected.id}`, 'inicio'); setView('inicio') }} />

  const isAdmin = account?.role === 'admin'
  const existingNames = new Set([...channels, ...officialShortcutChannels].map((channel) => normalizeChannelName(channel.name)))
  const catalogChannels = [
    ...channels,
    ...officialShortcutChannels.filter((shortcut) => !channels.some((channel) => normalizeChannelName(channel.name) === normalizeChannelName(shortcut.name))),
    ...importedBrazilChannels.filter((entry) => !existingNames.has(normalizeChannelName(entry.name))),
  ].map((channel) => ({ ...channel, logo_url: channel.logo_url || findChannelLogo(channel.name, channelLogos) })).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const visibleChannels = profile.kids ? catalogChannels.filter((channel) => channel.kids) : catalogChannels
  const renderCards = (items: TitleRecord[], showProgress = false) => items.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">{items.map((item) => <TitleCard key={item.id} title={item} progress={showProgress ? progressById.get(item.id) : undefined} saved={savedIds.includes(item.id)} onPlay={(selected) => playTitle(selected)} onToggleList={toggleSaved} />)}</div> : null

  const navItems: { key: View; label: string; icon: React.ReactNode }[] = [
    { key: 'inicio', label: 'Explorar', icon: <Clapperboard size={16} /> },
    { key: 'lista', label: 'Minha lista', icon: <Bookmark size={16} /> },
    { key: 'ao-vivo', label: 'Ao vivo', icon: <Radio size={16} /> },
    ...(isAdmin ? [{ key: 'admin' as const, label: 'Admin', icon: <Shield size={16} /> }] : []),
  ]

  return <main className="min-h-screen bg-[#080a0c] text-white">
    <header className="sticky top-0 z-40 border-b border-white/[.06] bg-[#080a0c]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1600px] items-center gap-5 px-4 sm:px-7 lg:px-10">
        <a href="#inicio" onClick={(event) => { event.preventDefault(); changeView('inicio') }} aria-label="IBStreaming, início" className="inline-flex shrink-0 items-center gap-2.5"><span className="grid size-8 place-items-center rounded-lg bg-[#e6b85c] text-[#16130b]"><Film size={17} /></span><span className="hidden text-[14px] font-bold tracking-[.12em] sm:inline">IB<span className="text-[#e6b85c]">STREAMING</span></span></a>
        <nav aria-label="Navegação principal" className={`${mobileNavOpen ? 'absolute left-0 right-0 top-[68px] flex border-b border-white/[.08] bg-[#0c0f10] px-4 py-3 shadow-xl' : 'hidden'} items-center gap-1 md:static md:flex md:border-0 md:bg-transparent md:p-0 md:shadow-none`}>
          {navItems.map((item) => <button key={item.key} type="button" onClick={() => { changeView(item.key); setMobileNavOpen(false) }} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${view === item.key ? 'bg-white/[.08] text-white' : 'text-white/50 hover:bg-white/[.04] hover:text-white/85'}`}>{item.icon}<span>{item.label}</span></button>)}
        </nav>
        <button type="button" aria-label={mobileNavOpen ? 'Fechar menu' : 'Abrir menu'} onClick={() => setMobileNavOpen((open) => !open)} className="grid size-9 place-items-center rounded-lg text-white/60 hover:bg-white/[.06] md:hidden">{mobileNavOpen ? <X size={19} /> : <Menu size={19} />}</button>
        {view === 'inicio' && <label className="ml-auto hidden w-full max-w-[250px] items-center gap-2 rounded-lg border border-white/[.08] bg-[#111416] px-3 py-2 sm:flex"><Search size={15} className="shrink-0 text-white/35" /><input aria-label="Buscar no catálogo" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar títulos..." className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/35" /></label>}
        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          {view === 'inicio' && <button type="button" aria-label="Buscar no catálogo" onClick={() => document.getElementById('mobile-search')?.focus()} className="grid size-9 place-items-center rounded-lg text-white/60 sm:hidden"><Search size={17} /></button>}
          <button type="button" onClick={() => setProfile(null)} className="flex items-center gap-2 rounded-lg border border-white/[.08] bg-[#111416] py-1.5 pl-1.5 pr-2.5 text-left hover:bg-white/[.07]" aria-label={`Trocar perfil, atual ${profile.name}`}><span className={`grid size-7 place-items-center rounded-md ${profile.kids ? 'bg-[#315d58]' : 'bg-[#553f3d]'}`}><UserRound size={14} /></span><span className="hidden max-w-24 truncate text-xs text-white/80 sm:block">{profile.name}</span><ChevronDown size={13} className="text-white/40" /></button>
          <button type="button" onClick={signOut} aria-label="Sair da conta" title="Sair da conta" className="grid size-9 place-items-center rounded-lg text-white/45 transition hover:bg-white/[.06] hover:text-white"><LogOut size={17} /></button>
        </div>
      </div>
      {view === 'inicio' && <label className="flex items-center gap-2 border-t border-white/[.05] bg-[#0c0f10] px-5 py-2.5 sm:hidden"><Search size={15} className="shrink-0 text-white/35" /><input id="mobile-search" aria-label="Buscar no catálogo" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar títulos..." className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/35" /></label>}
    </header>

    {notice && <div role="status" className={`fixed right-4 top-[82px] z-50 max-w-[min(420px,calc(100vw-2rem))] rounded-xl border px-4 py-3 text-sm shadow-xl ${noticeTone === 'success' ? 'border-[#6da882]/25 bg-[#102017] text-[#b8e0c1]' : 'border-[#bb7459]/25 bg-[#231411] text-[#f1bd9f]'}`}><div className="flex items-start gap-2"><span className="mt-0.5">{noticeTone === 'success' ? <Check size={15} /> : <CircleHelp size={15} />}</span><span>{notice}</span></div></div>}

    {view === 'inicio' && <>
      {!query && !type && <section className="relative isolate min-h-[440px] overflow-hidden sm:min-h-[500px] lg:min-h-[535px]">
        <Image src="/images/ibstreaming-hero.png" alt="" fill priority sizes="100vw" className="absolute inset-0 -z-20 object-cover object-[center_42%]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#080a0c] via-[#080a0c]/85 to-[#080a0c]/10" /><div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#080a0c] via-transparent to-[#080a0c]/15" />
        <div className="mx-auto flex min-h-[440px] max-w-[1600px] items-end px-5 pb-10 pt-20 sm:min-h-[500px] sm:px-8 sm:pb-14 lg:min-h-[535px] lg:px-12 lg:pb-16">
          <div className="max-w-xl"><p className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.22em] text-[#e6b85c]"><Sparkles size={14} />IBStreaming apresenta</p><h1 className="max-w-[540px] text-4xl font-semibold leading-[1.04] tracking-[-.04em] text-white sm:text-5xl lg:text-[62px]">Uma boa história muda tudo.</h1><p className="mt-4 max-w-md text-sm leading-6 text-white/65 sm:text-base">Descubra filmes, séries, animes e documentários feitos para o seu próximo momento inesquecível.</p><div className="mt-7 flex flex-wrap gap-3"><button type="button" onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#e6b85c] px-5 text-sm font-semibold text-[#16130b] transition hover:bg-[#f0ca76]"><Play size={16} fill="currentColor" />Explorar catálogo</button><button type="button" onClick={() => changeView('ao-vivo')} className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/20 bg-black/20 px-4 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/10"><Radio size={15} />TV ao vivo</button></div></div>
        </div>
      </section>}
      <section id="catalogo" className="mx-auto max-w-[1600px] px-5 pb-16 pt-7 sm:px-8 lg:px-12">
        {!query && !type && continueTitles.length > 0 && <div className="mb-10"><SectionHeading eyebrow="Continue de onde parou" title="Retomar reprodução" />{renderCards(continueTitles, true)}</div>}
        {!query && !type && <SectionHeading eyebrow="Feito para você" title="Explore o catálogo" trailing={<span className="text-xs text-white/40">{catalog.length} títulos</span>} />}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar por tipo de título">{[['', 'Todos'], ['filme', 'Filmes'], ['serie', 'Séries'], ['anime', 'Animes'], ['documentario', 'Documentários']].map(([value, label]) => <button key={value} type="button" onClick={() => setType(value)} aria-pressed={type === value} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs transition ${type === value ? 'border-[#e6b85c]/40 bg-[#e6b85c]/10 text-[#f0ce82]' : 'border-white/[.08] text-white/55 hover:border-white/20 hover:text-white/85'}`}>{label}</button>)}</div>
        {catalogError ? <EmptyState title="Não foi possível carregar o catálogo" description="A chamada get_catalog não foi concluída. Verifique a conexão, a sessão e as permissões do banco e tente novamente." /> : catalogLoading && !catalog.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="aspect-[.72] animate-pulse rounded-xl bg-[#15191b]" />)}</div> : renderCards(catalog) ?? <EmptyState title={query || type ? 'Nenhum título encontrado' : 'Seu catálogo está esperando por histórias'} description={query || type ? 'Tente ajustar a busca ou escolher outro filtro.' : 'Os títulos disponíveis para este perfil e região aparecerão aqui.'} />}
      </section>
    </>}

    {view === 'lista' && <section className="mx-auto max-w-[1600px] px-5 pb-20 pt-9 sm:px-8 lg:px-12"><SectionHeading eyebrow="Sua coleção pessoal" title="Minha lista" trailing={<span className="text-xs text-white/40">{savedTitles.length} títulos</span>} />{savedTitles.length ? renderCards(savedTitles, true) : <EmptyState title="Sua lista ainda está vazia" description="Use o ícone de marcador nos títulos para guardar aqui o que quer assistir depois." />}</section>}
    {view === 'ao-vivo' && <TvGuide channels={visibleChannels} schedule={schedule.filter((item) => visibleChannels.some((channel) => channel.id === item.channel_id))} onPlayChannel={(channel) => { if (!channel.stream_url) { showNotice(`${channel.name}: ${channel.access_label ?? 'ainda não há uma fonte de mídia cadastrada.'} Cadastre uma URL HLS autorizada na Administração.`); return } if (isExternalChannelUrl(channel.stream_url)) { window.open(channel.stream_url, '_blank', 'noopener,noreferrer'); return } setPlayerChannel(channel) }} />}
    {view === 'admin' && (isAdmin ? <AdminPanel /> : <section className="mx-auto max-w-3xl px-5 py-24 text-center"><Shield size={28} className="mx-auto text-[#e6b85c]" /><h1 className="mt-4 text-2xl font-semibold text-white">Acesso restrito</h1><p className="mt-2 text-sm text-white/50">Esta área está disponível apenas para contas com role admin.</p></section>)}

    {playerChannel && <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setPlayerChannel(null) }}><section role="dialog" aria-modal="true" aria-labelledby="live-player-title" className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#101315] shadow-2xl"><header className="flex items-center justify-between border-b border-white/[.08] px-5 py-4"><div><p className="text-[10px] font-semibold uppercase tracking-[.17em] text-[#e6b85c]">Transmissão ao vivo</p><h2 id="live-player-title" className="mt-1 text-base font-semibold text-white">{playerChannel.name}</h2></div><button type="button" onClick={() => setPlayerChannel(null)} aria-label="Fechar transmissão" className="grid size-9 place-items-center rounded-full text-white/50 hover:bg-white/[.08] hover:text-white"><X size={19} /></button></header><LiveChannelPlayer channel={playerChannel} onClose={() => setPlayerChannel(null)} /></section></div>}
    {playerTitle && <PlayerDialog key={playerTitle.id} title={playerTitle} stream={streamResult} loading={streamLoading} message={streamResult && streamMessages[streamResult.status]} initialTime={resumeAtSeconds} onClose={() => { clearPlaybackResume(); setPlayerTitle(null); setStreamResult(null) }} onVerifyPin={verifyPin} onSaveProgress={saveProgress} onSavePlaybackTime={savePlaybackTime} onClearPlayback={clearPlaybackResume} />}
    <footer className="border-t border-white/[.06] px-5 py-6 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1600px] flex-col gap-3 text-[10px] text-white/30 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-center gap-2 tracking-[.12em]">IB<span className="text-[#e6b85c]/60">STREAMING</span><span className="tracking-normal">· © 2026</span></span><span>Catálogo e direitos sujeitos à disponibilidade por região.</span></div></footer>
  </main>
}
