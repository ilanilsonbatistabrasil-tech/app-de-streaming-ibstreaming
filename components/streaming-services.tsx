'use client'

import { useMemo, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { Plus, Save, ShieldCheck, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TitleCard, type TitleRecord } from './title-card'

const supabase = createClient()
type Service = { id: number; name: string; slug: string; active: boolean; sort_order: number }
type Association = { title_id: number; service_id: number }

export function StreamingServicesCatalog({ catalog, savedIds, progressById, onPlay, onToggleList }: {
  catalog: TitleRecord[]
  savedIds: number[]
  progressById: Map<number, number>
  onPlay: (title: TitleRecord) => void
  onToggleList: (title: TitleRecord) => void
}) {
  const { data: services = [] } = useSWR<Service[]>('streaming-services-active', async () => {
    const { data, error } = await supabase.from('streaming_services').select('id,name,slug,active,sort_order').eq('active', true).order('sort_order')
    if (error) throw error
    return data ?? []
  })
  const { data: links = [] } = useSWR<Association[]>('streaming-title-service-links', async () => {
    const { data, error } = await supabase.from('title_streaming_services').select('title_id,service_id')
    if (error) throw error
    return data ?? []
  })
  const [selected, setSelected] = useState<number | null>(null)
  const catalogIds = useMemo(() => new Set(catalog.map((title) => title.id)), [catalog])
  const visible = (serviceId: number) => links.filter((link) => link.service_id === serviceId && catalogIds.has(link.title_id)).map((link) => catalog.find((title) => title.id === link.title_id)).filter((title): title is TitleRecord => Boolean(title))
  if (!services.length) return null
  const shown = selected === null ? services : services.filter((service) => service.id === selected)
  return <section className="mb-10">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#e6b85c]">Por plataforma</p><h2 className="mt-1.5 text-xl font-semibold tracking-tight text-white">Explore por serviço</h2></div><span className="text-xs text-white/40">{services.length} serviços</span></div>
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
      <button type="button" onClick={() => setSelected(null)} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs ${selected === null ? 'border-[#e6b85c]/40 bg-[#e6b85c]/10 text-[#f0ce82]' : 'border-white/[.08] text-white/55'}`}>Todos</button>
      {services.map((service) => <button key={service.id} type="button" onClick={() => setSelected(service.id)} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs ${selected === service.id ? 'border-[#e6b85c]/40 bg-[#e6b85c]/10 text-[#f0ce82]' : 'border-white/[.08] text-white/55'}`}>{service.name}</button>)}
    </div>
    <div className="space-y-8">
      {shown.map((service) => {
        const titles = visible(service.id)
        if (!titles.length) return null
        return <div key={service.id}><div className="mb-4 flex items-center justify-between"><h3 className="text-base font-semibold text-white">{service.name}</h3><span className="text-[11px] text-white/35">{titles.length} títulos</span></div><div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">{titles.map((title) => <TitleCard key={title.id} title={title} progress={progressById.get(title.id)} saved={savedIds.includes(title.id)} onPlay={onPlay} onToggleList={onToggleList} />)}</div></div>
      })}
    </div>
    {shown.every((service) => visible(service.id).length === 0) && <p className="rounded-xl border border-dashed border-white/10 px-5 py-8 text-center text-xs text-white/40">Ainda não há títulos vinculados a este serviço para o seu perfil e região.</p>}
  </section>
}

export function StreamingServicesAdmin() {
  const { data: services = [], mutate: refreshServices } = useSWR<Service[]>('admin-streaming-services', async () => {
    const { data, error } = await supabase.from('streaming_services').select('id,name,slug,active,sort_order').order('sort_order')
    if (error) throw error
    return data ?? []
  })
  const { data: titles = [] } = useSWR<Pick<TitleRecord, 'id' | 'title'>[]>('admin-service-titles', async () => {
    const { data, error } = await supabase.from('titles').select('id,title').order('title')
    if (error) throw error
    return data ?? []
  })
  const { data: links = [], mutate: refreshLinks } = useSWR<Association[]>('admin-service-links', async () => {
    const { data, error } = await supabase.from('title_streaming_services').select('title_id,service_id')
    if (error) throw error
    return data ?? []
  })
  const [name, setName] = useState('')
  const [titleId, setTitleId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function addService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const clean = name.trim()
    if (!clean) return
    setBusy(true); setNotice('')
    const slug = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const { error } = await supabase.from('streaming_services').insert({ name: clean, slug, sort_order: (services.length ? services[services.length - 1].sort_order : 0) + 10 })
    setBusy(false)
    if (error) { setNotice('Não foi possível cadastrar. Verifique se o nome/identificador já existe.'); return }
    setName(''); setNotice('Serviço cadastrado.'); await refreshServices()
  }

  async function assignTitle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!titleId || !serviceId) return
    setBusy(true); setNotice('')
    const { error } = await supabase.from('title_streaming_services').upsert({ title_id: Number(titleId), service_id: Number(serviceId) }, { onConflict: 'title_id,service_id', ignoreDuplicates: true })
    setBusy(false)
    if (error) { setNotice('Não foi possível vincular o título ao serviço.'); return }
    setNotice('Título vinculado ao serviço.'); await refreshLinks()
  }

  async function removeLink(link: Association) {
    const { error } = await supabase.from('title_streaming_services').delete().eq('title_id', link.title_id).eq('service_id', link.service_id)
    if (error) { setNotice('Não foi possível remover o vínculo.'); return }
    await refreshLinks()
  }

  async function toggleService(service: Service) {
    const { error } = await supabase.from('streaming_services').update({ active: !service.active }).eq('id', service.id)
    if (error) { setNotice('Não foi possível alterar a situação do serviço.'); return }
    await refreshServices()
  }

  return <section className="mt-8 rounded-2xl border border-white/[.08] bg-[#111416] p-5 sm:p-7">
    <div className="mb-5 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#e6b85c]/10 text-[#e6b85c]"><ShieldCheck size={19} /></span><div><h2 className="font-semibold text-white">Serviços de streaming</h2><p className="mt-1 text-xs text-white/45">Cadastre plataformas e associe títulos já existentes no catálogo.</p></div></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={addService} className="grid content-start gap-3"><label className="text-xs text-white/60">Novo serviço<input className="field-dark mt-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome da plataforma" required maxLength={80} /></label><button disabled={busy} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#e6b85c] px-4 text-xs font-semibold text-[#16130b] disabled:opacity-50"><Plus size={15} />Cadastrar serviço</button><div className="mt-2 flex flex-col gap-2">{services.map((service) => <div key={service.id} className="flex items-center gap-3 rounded-lg border border-white/[.06] bg-[#0c0f10] px-3 py-2.5"><span className="min-w-0 flex-1 truncate text-sm text-white/80">{service.name}</span><span className="text-[10px] text-white/35">{service.active ? 'Ativo' : 'Inativo'}</span><button type="button" onClick={() => toggleService(service)} className="text-[10px] text-[#e6b85c]">{service.active ? 'Desativar' : 'Ativar'}</button></div>)}</div></form>
      <div className="grid content-start gap-4">
        <form onSubmit={assignTitle} className="grid gap-3"><label className="text-xs text-white/60">Título<select className="field-dark mt-2" value={titleId} onChange={(event) => setTitleId(event.target.value)} required><option value="">Selecione um título</option>{titles.map((title) => <option key={title.id} value={title.id}>{title.title}</option>)}</select></label><label className="text-xs text-white/60">Serviço<select className="field-dark mt-2" value={serviceId} onChange={(event) => setServiceId(event.target.value)} required><option value="">Selecione um serviço</option>{services.filter((service) => service.active).map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label><button disabled={busy || !titles.length || !services.length} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#e6b85c] px-4 text-xs font-semibold text-[#16130b] disabled:opacity-50"><Save size={15} />Vincular título</button></form>
        <div className="max-h-64 space-y-2 overflow-y-auto">{links.map((link) => <div key={link.title_id + '-' + link.service_id} className="flex items-center gap-2 rounded-lg border border-white/[.06] bg-[#0c0f10] px-3 py-2 text-xs"><span className="min-w-0 flex-1 truncate text-white/75">{titles.find((title) => title.id === link.title_id)?.title ?? 'Título'}</span><span className="shrink-0 text-white/40">{services.find((service) => service.id === link.service_id)?.name ?? 'Serviço'}</span><button type="button" onClick={() => removeLink(link)} aria-label="Remover vínculo" className="grid size-7 place-items-center rounded text-white/40 hover:text-red-300"><Trash2 size={13} /></button></div>)}</div>
      </div>
    </div>
    {notice && <p role="status" className="mt-4 text-xs text-[#e7c981]">{notice}</p>}
  </section>
}
