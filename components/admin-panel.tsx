'use client'

import { useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { BadgeCheck, Clapperboard, LoaderCircle, Save, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { TitleRecord } from './title-card'

type Plan = { id: string; name: string; tier: number }
type Rights = { title_id: number; regions: string[]; starts_on: string; ends_on: string; min_plan: string }
const supabase = createClient()

export function AdminPanel() {
  const { data: titles = [], mutate: refreshTitles } = useSWR<TitleRecord[]>('admin-titles', async () => {
    const { data, error } = await supabase.from('titles').select('id,title,type,genre,age,year').order('id', { ascending: false })
    if (error) throw error
    return data ?? []
  })
  const { data: plans = [] } = useSWR<Plan[]>('admin-plans', async () => {
    const { data, error } = await supabase.from('plans').select('id,name,tier').order('tier')
    if (error) throw error
    return data ?? []
  })
  const { data: rights = [], mutate: refreshRights } = useSWR<Rights[]>('admin-rights', async () => {
    const { data, error } = await supabase.from('title_rights').select('title_id,regions,starts_on,ends_on,min_plan')
    if (error) throw error
    return data ?? []
  })
  const [selected, setSelected] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState('filme')
  const [genre, setGenre] = useState('Drama')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [age, setAge] = useState('12')
  const [region, setRegion] = useState('BR')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState('2030-12-31')
  const [minPlan, setMinPlan] = useState('free')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const selectedTitle = titles.find((item) => item.id === Number(selected))
  const selectedRights = rights.find((item) => item.title_id === Number(selected))

  function chooseTitle(id: string) {
    setSelected(id)
    const next = rights.find((item) => item.title_id === Number(id))
    if (!next) return
    setRegion(next.regions?.join(', ') ?? 'BR')
    setStartDate(next.starts_on)
    setEndDate(next.ends_on)
    setMinPlan(next.min_plan)
  }

  async function saveTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setBusy(true)
    let titleId = Number(selected)
    if (!selected) {
      const { data, error } = await supabase.from('titles').insert({ title: title.trim(), type, genre: genre.trim(), age: Number(age), year: Number(year) }).select('id').single()
      if (error || !data) {
        setNotice('Não foi possível cadastrar o título. Verifique as permissões administrativas e tente novamente.')
        setBusy(false)
        return
      }
      titleId = data.id
    }
    const payload = { title_id: titleId, regions: region.split(',').map((item) => item.trim().toUpperCase()).filter(Boolean), starts_on: startDate, ends_on: endDate, min_plan: minPlan }
    const result = selectedRights
      ? await supabase.from('title_rights').update(payload).eq('title_id', titleId)
      : await supabase.from('title_rights').insert(payload)
    setBusy(false)
    if (result.error) {
      setNotice(selected ? 'Não foi possível atualizar os direitos deste título.' : 'Título cadastrado, mas os direitos não puderam ser salvos. Selecione o título para tentar novamente.')
      await refreshTitles()
      return
    }
    setNotice(selected ? 'Direitos atualizados com sucesso.' : 'Título e direitos cadastrados com sucesso.')
    setTitle('')
    setSelected('')
    await Promise.all([refreshTitles(), refreshRights()])
  }

  return <section className="mx-auto max-w-[1440px] px-5 pb-20 pt-8 sm:px-8 lg:px-12">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-[#e6b85c]"><ShieldCheck size={14} />Área restrita</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Administração</h1><p className="mt-2 text-sm text-white/50">Gerencie títulos e licenças respeitando as políticas RLS.</p></div><span className="flex items-center gap-2 rounded-full border border-[#e6b85c]/20 bg-[#e6b85c]/[.07] px-3 py-2 text-xs text-[#e6b85c]"><BadgeCheck size={14} />Acesso administrativo</span></div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
      <form onSubmit={saveTitle} className="rounded-2xl border border-white/[.08] bg-[#111416] p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#e6b85c]/10 text-[#e6b85c]"><Clapperboard size={19} /></span><div><h2 className="font-semibold text-white">{selected ? 'Editar direitos' : 'Cadastrar título'}</h2><p className="mt-1 text-xs text-white/45">{selected ? 'Atualize a região, período e plano mínimo.' : 'Inclua um título e configure seus direitos.'}</p></div></div>
        <label className="mb-5 flex flex-col gap-2 text-xs text-white/60">Selecionar título para editar direitos<select className="field-dark" value={selected} onChange={(event) => chooseTitle(event.target.value)}><option value="">Novo título</option>{titles.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        {!selected && <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs text-white/60 sm:col-span-2">Nome do título<input className="field-dark" required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nome do filme ou série" /></label>
          <label className="flex flex-col gap-2 text-xs text-white/60">Tipo<select className="field-dark" value={type} onChange={(event) => setType(event.target.value)}><option value="filme">Filme</option><option value="série">Série</option><option value="anime">Anime</option></select></label>
          <label className="flex flex-col gap-2 text-xs text-white/60">Gênero<input className="field-dark" required value={genre} onChange={(event) => setGenre(event.target.value)} /></label>
          <label className="flex flex-col gap-2 text-xs text-white/60">Ano<input className="field-dark" type="number" min="1888" max="2100" required value={year} onChange={(event) => setYear(event.target.value)} /></label>
          <label className="flex flex-col gap-2 text-xs text-white/60">Classificação indicativa<select className="field-dark" value={age} onChange={(event) => setAge(event.target.value)}><option value="0">Livre</option><option value="10">10 anos</option><option value="12">12 anos</option><option value="14">14 anos</option><option value="16">16 anos</option><option value="18">18 anos</option></select></label>
        </div>}
        {selected && selectedTitle && <p className="mb-4 rounded-lg border border-white/[.07] bg-[#0c0f10] px-3 py-2.5 text-xs text-white/55">{selectedTitle.title} · {selectedTitle.year} · {selectedTitle.genre}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs text-white/60 sm:col-span-2">Regiões (códigos separados por vírgula)<input className="field-dark" required value={region} onChange={(event) => setRegion(event.target.value)} placeholder="BR, PT" /></label>
          <label className="flex flex-col gap-2 text-xs text-white/60">Início dos direitos<input className="field-dark" type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label className="flex flex-col gap-2 text-xs text-white/60">Fim dos direitos<input className="field-dark" type="date" required value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
          <label className="flex flex-col gap-2 text-xs text-white/60 sm:col-span-2">Plano mínimo<select className="field-dark" value={minPlan} onChange={(event) => setMinPlan(event.target.value)}>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}{!plans.some((plan) => plan.id === 'free') && <option value="free">Free</option>}</select></label>
        </div>
        {notice && <p role="status" className="mt-4 text-xs leading-5 text-[#e7c981]">{notice}</p>}
        <button disabled={busy} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#e6b85c] text-sm font-semibold text-[#16130b] hover:bg-[#f0ca76] disabled:opacity-55">{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}{busy ? 'Salvando…' : selected ? 'Salvar direitos' : 'Cadastrar título e direitos'}</button>
        <p className="mt-3 text-[11px] leading-5 text-white/35">O schema atual não tem campos de poster ou URL de mídia; eles não serão inventados nem escritos no banco.</p>
      </form>
      <div className="rounded-2xl border border-white/[.08] bg-[#111416] p-5 sm:p-7"><h2 className="font-semibold text-white">Catálogo cadastrado</h2><p className="mt-1 text-xs text-white/45">{titles.length} {titles.length === 1 ? 'título' : 'títulos'}</p><div className="mt-5 flex max-h-[580px] flex-col gap-2 overflow-y-auto">{titles.map((item) => { const itemRights = rights.find((right) => right.title_id === item.id); return <button key={item.id} type="button" onClick={() => chooseTitle(String(item.id))} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition ${selected === String(item.id) ? 'border-[#e6b85c]/30 bg-[#e6b85c]/[.06]' : 'border-white/[.06] bg-[#0c0f10] hover:border-white/15'}`}><span className="min-w-0"><span className="block truncate text-sm font-medium text-white/85">{item.title}</span><span className="mt-1 block truncate text-[11px] text-white/40">{item.year} · {item.genre} · {item.type}</span></span><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] ${itemRights ? 'bg-[#335b4a]/30 text-[#99d3ae]' : 'bg-[#71432d]/30 text-[#e7b18b]'}`}>{itemRights ? 'Com direitos' : 'Sem direitos'}</span></button> })}{!titles.length && <p className="py-12 text-center text-xs text-white/40">Ainda não há títulos.</p>}</div>
      </div>
    </div>
  </section>
}
