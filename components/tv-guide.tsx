'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, CirclePlay, Radio, Tv } from 'lucide-react'

type Channel = { id: string; name: string; kids: boolean; stream_url: string | null; category?: string; catalog_group?: string; access_label?: string }
type Schedule = { channel_id: string; slot: number; program: string }

function isExternalService(url: string | null): boolean {
  if (!url) return false
  try {
    const host = new URL(url).hostname
    return [
      'www.netflix.com', 'www.max.com', 'www.disneyplus.com',
      'www.espn.com.br', 'www.beinsports.com', 'globoplay.globo.com',
      'pluto.tv', 'www.pluto.tv', 'www.samsung.com',
      'www.a12.com', 'a12.com', 'www.redetv.uol.com.br', 'redetv.uol.com.br',
      'www.primevideo.com', 'www.paramountplus.com', 'tv.apple.com',
    ].some((domain) => host === domain || host.endsWith('.' + domain))
  } catch {
    return false
  }
}

const categoryOrder = [
  'Filmes', 'Séries', 'Kids', 'Esportes', 'Notícias',
  'Documentários e Natureza', 'Música', 'Canais brasileiros',
  'Plataformas', 'Variedades',
]

function getChannelCategory(channel: Channel): string {
  const savedCategory = channel.category?.trim()
  if (savedCategory && categoryOrder.includes(savedCategory)) return savedCategory

  const name = channel.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[!]/g, '')
    .trim()
  const id = channel.id.toLowerCase()

  // Primeiro separam-se serviços e géneros específicos. Emissoras generalistas
  // brasileiras só entram em "Canais brasileiros" quando não são canais temáticos.
  if (channel.kids || /kids|infantil|nick jr|baby shark|babyfirst|gloob|bob esponja|turma da monica|desenhos|cartoon/.test(name)) return 'Kids'
  if (/espn|bein|sport|esporte|combate|ufc|mma|fifa|n sports|band sports|sportv|premiere/.test(name)) return 'Esportes'
  if (/telecine|cinema|cine |cine$|movies|filmes|film|netmovies|adrenalina pura/.test(name)) return 'Filmes'
  if (/series|seriados|novelas|novela|sitcom/.test(name)) return 'Séries'
  if (/news|noticias|cnn|jornal|jovem pan|bm&c|globo news|record news|sbt news|euronews|times brasil/.test(name)) return 'Notícias'
  if (/document|nature|natureza|history|historia|discovery|animal|smithsonian|travel|agro|fish tv|viagens|investigacao/.test(name)) return 'Documentários e Natureza'
  if (/music|musica|radio|kpop|stingray|rock|karaoke/.test(name)) return 'Música'

  // Plataformas e aplicativos não são canais lineares brasileiros.
  if (isExternalService(channel.stream_url) && !/tv ao vivo|rede tv|tv aparecida/.test(name)) {
    if (/espn|bein|sport/.test(name)) return 'Esportes'
    return 'Plataformas'
  }

  // Emissoras públicas, abertas e legislativas do Brasil.
  const brazilianBroadcaster =
    /\b(ibstreaming|tv brasil|tv cultura|tv escola|tv aparecida|rede tv|redetv|tv senado|tv camara|tv camara dos deputados|tv justica|tv justiça|canal gov|tv brasil central|tv assembleia|tv ale|tv legislativa|tv universit[aá]ria|tv diario|tv diario|tv gazeta|tv record|record tv|record|sbt|globo|band|canal brasil|futura|tv novo tempo|canal rural|tv evangelizar|tv pai eterno)\b/.test(name) ||
    /^(tv-brasil|tv-cultura|tv-senado|tv-camara|tv-justica|tv-aparecida|redetv|canal-gov)$/.test(id) ||
    channel.catalog_group === 'Canais brasileiros'
  if (brazilianBroadcaster) return 'Canais brasileiros'

  return 'Variedades'
}

export function TvGuide({ channels, schedule, onPlayChannel }: { channels: Channel[]; schedule: Schedule[]; onPlayChannel: (channel: Channel) => void }) {
  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('Todos')
  const groups = useMemo(() => {
    const present = new Set(channels.map(getChannelCategory))
    return ['Todos', ...categoryOrder.filter((category) => present.has(category))]
  }, [channels])
  const filteredChannels = useMemo(() => channels.filter((channel) => {
    const group = getChannelCategory(channel)
    const matchesGroup = selectedGroup === 'Todos' || group === selectedGroup
    const matchesSearch = channel.name.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR'))
    return matchesGroup && matchesSearch
  }), [channels, search, selectedGroup])
  const byChannel = useMemo(() => {
    const map = new Map<string, Schedule[]>()
    schedule.forEach((item) => map.set(item.channel_id, [...(map.get(item.channel_id) ?? []), item]))
    map.forEach((items) => items.sort((a, b) => a.slot - b.slot))
    return map
  }, [schedule])
  const currentHour = new Date().getHours()

  return (
    <section className="mx-auto max-w-[1440px] px-5 pb-20 pt-8 sm:px-8 lg:px-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-[#e6b85c]"><Radio size={14} />Ao vivo</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Guia de programação</h1><p className="mt-2 text-sm text-white/50">Canais brasileiros e acesso às plataformas oficiais.</p></div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#111416] px-3 py-2 text-xs text-white/55"><CalendarDays size={14} />{new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</div>
      </div>
      <div className="mb-5 space-y-3">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar canal, emissora ou plataforma..." aria-label="Buscar canais" className="w-full rounded-xl border border-white/10 bg-[#111416] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#e6b85c]/60" />
        <div className="flex flex-wrap gap-2">{groups.map((group) => <button key={group} type="button" onClick={() => setSelectedGroup(group)} className={`rounded-full border px-3 py-1.5 text-xs transition ${selectedGroup === group ? 'border-[#e6b85c]/50 bg-[#e6b85c]/10 text-[#e6b85c]' : 'border-white/10 text-white/55 hover:border-white/25 hover:text-white'}`}>{group}</button>)}</div>
        <p className="text-xs text-white/40">Exibindo {filteredChannels.length} de {channels.length} itens no catálogo.</p>
      </div>
      {filteredChannels.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center"><Tv size={28} className="mx-auto text-white/25" /><p className="mt-4 text-sm text-white/55">{search || selectedGroup !== 'Todos' ? 'Nenhum item corresponde aos filtros selecionados.' : 'Nenhum canal está disponível neste momento.'}</p></div> : <div className="overflow-hidden rounded-2xl border border-white/[.08] bg-[#101315]">
        <div className="grid grid-cols-[150px_minmax(0,1fr)] border-b border-white/[.08] px-4 py-3 sm:grid-cols-[220px_minmax(0,1fr)] sm:px-6"><span className="text-[10px] font-semibold uppercase tracking-[.15em] text-white/35">Canal</span><div className="flex justify-between text-[10px] font-semibold uppercase tracking-[.12em] text-white/35"><span>Grade do dia</span><span>Horário de Brasília</span></div></div>
        <div className="divide-y divide-white/[.06]">{filteredChannels.map((channel) => <div key={channel.id} className="grid grid-cols-[150px_minmax(0,1fr)] px-4 py-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:px-6">
          <button type="button" onClick={() => onPlayChannel(channel)} className="flex items-center gap-3 self-center text-left"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#22282a] text-[#e6b85c]"><Tv size={18} /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-white/85">{channel.name}</span><span className="mt-1 block text-[10px] text-white/40">{channel.access_label ?? (isExternalService(channel.stream_url) ? 'Abrir plataforma' : channel.stream_url ? 'Assistir ao vivo' : channel.kids ? 'Infantil' : 'Canal sem link validado')}</span></span></button>
          <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">{(byChannel.get(channel.id) ?? []).map((item) => <div key={`${item.channel_id}-${item.slot}`} className={`relative min-w-[145px] flex-1 rounded-xl border px-3 py-3 ${item.slot === currentHour ? 'border-[#e6b85c]/35 bg-[#e6b85c]/[.08]' : 'border-white/[.06] bg-[#15191b]'}`}><span className="text-[10px] font-medium text-white/40">{String(item.slot).padStart(2, '0')}:00</span><p className="mt-1 truncate text-xs font-medium text-white/80">{item.program}</p>{item.slot === currentHour && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#e6b85c]" aria-label="No ar agora" />}</div>)}{!byChannel.get(channel.id)?.length && <p className="self-center px-2 text-xs text-white/35">Programação indisponível.</p>}</div>
        </div>)}</div>
      </div>}
      <p className="mt-4 text-xs leading-5 text-white/35">A grade de programação é disponibilizada pelo serviço. Selecione um canal para assistir ou abrir o serviço oficial. Plataformas pagas exigem assinatura própria.</p>
    </section>
  )
}
