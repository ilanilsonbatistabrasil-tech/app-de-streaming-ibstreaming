'use client'

import { useMemo } from 'react'
import { CalendarDays, CirclePlay, Radio, Tv } from 'lucide-react'

type Channel = { id: string; name: string; kids: boolean }
type Schedule = { channel_id: string; slot: number; program: string }

export function TvGuide({ channels, schedule, onPlayChannel }: { channels: Channel[]; schedule: Schedule[]; onPlayChannel: (channel: Channel) => void }) {
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
        <div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-[#e6b85c]"><Radio size={14} />Ao vivo</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Guia de programação</h1><p className="mt-2 text-sm text-white/50">Seus canais e a programação de hoje, em um só lugar.</p></div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#111416] px-3 py-2 text-xs text-white/55"><CalendarDays size={14} />{new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</div>
      </div>
      {channels.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center"><Tv size={28} className="mx-auto text-white/25" /><p className="mt-4 text-sm text-white/55">Nenhum canal está disponível neste momento.</p></div> : <div className="overflow-hidden rounded-2xl border border-white/[.08] bg-[#101315]">
        <div className="grid grid-cols-[150px_minmax(0,1fr)] border-b border-white/[.08] px-4 py-3 sm:grid-cols-[220px_minmax(0,1fr)] sm:px-6"><span className="text-[10px] font-semibold uppercase tracking-[.15em] text-white/35">Canal</span><div className="flex justify-between text-[10px] font-semibold uppercase tracking-[.12em] text-white/35"><span>Grade do dia</span><span>Horário de Brasília</span></div></div>
        <div className="divide-y divide-white/[.06]">{channels.map((channel) => <div key={channel.id} className="grid grid-cols-[150px_minmax(0,1fr)] px-4 py-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:px-6">
          <button type="button" onClick={() => onPlayChannel(channel)} className="flex items-center gap-3 self-center text-left"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#22282a] text-[#e6b85c]"><Tv size={18} /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-white/85">{channel.name}</span><span className="mt-1 block text-[10px] text-white/40">{channel.kids ? 'Infantil' : 'Entretenimento'}</span></span></button>
          <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">{(byChannel.get(channel.id) ?? []).map((item) => <div key={`${item.channel_id}-${item.slot}`} className={`relative min-w-[145px] flex-1 rounded-xl border px-3 py-3 ${item.slot === currentHour ? 'border-[#e6b85c]/35 bg-[#e6b85c]/[.08]' : 'border-white/[.06] bg-[#15191b]'}`}><span className="text-[10px] font-medium text-white/40">{String(item.slot).padStart(2, '0')}:00</span><p className="mt-1 truncate text-xs font-medium text-white/80">{item.program}</p>{item.slot === currentHour && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#e6b85c]" aria-label="No ar agora" />}</div>)}{!byChannel.get(channel.id)?.length && <p className="self-center px-2 text-xs text-white/35">Programação indisponível.</p>}</div>
        </div>)}</div>
      </div>}
      <p className="mt-4 text-xs leading-5 text-white/35">A grade de programação é disponibilizada pelo serviço. A reprodução ao vivo depende de uma fonte de transmissão vinculada ao canal.</p>
    </section>
  )
}
