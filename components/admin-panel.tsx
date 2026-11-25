'use client'

import { useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { BadgeCheck, CalendarClock, Clapperboard, LoaderCircle, Radio, Save, ShieldCheck, Tv, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { TitleRecord } from './title-card'

type Plan = { id: string; name: string; tier: number }
type Rights = { title_id: number; regions: string[]; starts_on: string; ends_on: string; min_plan: string }
type Channel = { id: string; name: string; kids: boolean; stream_url: string | null; category?: string }
type ChannelSchedule = { channel_id: string; slot: number; program: string }
const supabase = createClient()

const channelCategories = ['Filmes', 'Séries', 'Kids', 'Esportes', 'Notícias', 'Documentários e Natureza', 'Música', 'Canais brasileiros', 'Plataformas', 'Variedades']

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
  const { data: channels = [], mutate: refreshChannels } = useSWR<Channel[]>('admin-channels', async () => {
    const categorized = await supabase.from('canais').select('id,name:nome,kids:crianças,stream_url,category:categoria').order('nome')
    if (categorized.error && /categoria/i.test(categorized.error.message)) {
      const legacy = await supabase.from('canais').select('id,name:nome,kids:crianças,stream_url').order('nome')
      if (legacy.error) throw legacy.error
      return (legacy.data ?? []) as Channel[]
    }
    if (categorized.error) throw categorized.error
    return (categorized.data ?? []) as Channel[]
  })
  const { data: channelSchedule = [], mutate: refreshChannelSchedule } = useSWR<ChannelSchedule[]>('admin-channel-schedule', async () => {
    const { data, error } = await supabase.from('channel_schedule').select('channel_id,slot,program').order('slot')
    if (error) throw error
    return data ?? []
  })
  const [channelId, setChannelId] = useState('')
  const [channelName, setChannelName] = useState('')
  const [channelKids, setChannelKids] = useState(false)
  const [channelStreamUrl, setChannelStreamUrl] = useState('')
  const [channelCategory, setChannelCategory] = useState('Variedades')
  const [channelBusy, setChannelBusy] = useState(false)
  const [channelNotice, setChannelNotice] = useState('')
  const [scheduleChannelId, setScheduleChannelId] = useState('')
  const [scheduleSlot, setScheduleSlot] = useState('12')
  const [scheduleProgram, setScheduleProgram] = useState('')
  const [editingScheduleSlot, setEditingScheduleSlot] = useState<string | null>(null)
  const [scheduleBusy, setScheduleBusy] = useState(false)
  const [scheduleNotice, setScheduleNotice] = useState('')

  const selectedTitle = titles.find((item) => item.id === Number(selected))
  const selectedRights = rights.find((item) => item.title_id === Number(selected))

  function chooseTitle(id: string) {
    setSelected(id)
    const item = titles.find((entry) => entry.id === Number(id))
    if (item) {
      setTitle(item.title)
      setType(item.type)
      setGenre(item.genre)
      setYear(String(item.year))
      setAge(String(item.age))
    } else {
      setTitle('')
    }
    const next = rights.find((entry) => entry.title_id === Number(id))
    setRegion(next?.regions?.join(', ') ?? 'BR')
    setStartDate(next?.starts_on ?? new Date().toISOString().slice(0, 10))
    setEndDate(next?.ends_on ?? '2030-12-31')
    setMinPlan(next?.min_plan ?? 'free')
  }

  function chooseChannel(id: string) {
    setChannelId(id)
    const item = channels.find((channel) => channel.id === id)
    setChannelName(item?.name ?? '')
    setChannelKids(item?.kids ?? false)
    setChannelStreamUrl(item?.stream_url ?? '')
    setChannelCategory(item?.category ?? (item?.kids ? 'Kids' : 'Variedades'))
  }

  async function saveChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setChannelBusy(true)
    setChannelNotice('')
    const kidsFlag = channelKids || channelCategory === 'Kids'
    const payload = { nome: channelName.trim(), crianças: kidsFlag, stream_url: channelStreamUrl.trim() || null, categoria: channelCategory }
    const legacyPayload = { nome: channelName.trim(), crianças: kidsFlag, stream_url: channelStreamUrl.trim() || null }
    let result = channelId
      ? await supabase.from('canais').update(payload).eq('id', channelId)
      : await supabase.from('canais').insert({ id: crypto.randomUUID(), ...payload })
    let categoryPending = false
    if (result.error && /categoria/i.test(result.error.message)) {
      categoryPending = true
      result = channelId
        ? await supabase.from('canais').update(legacyPayload).eq('id', channelId)
        : await supabase.from('canais').insert({ id: crypto.randomUUID(), ...legacyPayload })
    }
    setChannelBusy(false)
    if (result.error) {
      setChannelNotice('Não foi possível salvar o canal. Confira as permissões administrativas.')
      return
    }
    setChannelNotice(categoryPending
      ? 'Canal salvo. Para gravar a categoria no banco, aplique a migration de categorias do catálogo.'
      : channelId ? 'Canal atualizado.' : 'Canal cadastrado.')
    setChannelId('')
    setChannelName('')
    setChannelKids(false)
    setChannelStreamUrl('')
    setChannelCategory('Variedades')
    await refreshChannels()
  }

  function chooseSchedule(channelIdValue: string, slot: number, program: string) {
    setScheduleChannelId(channelIdValue)
    setScheduleSlot(String(slot))
    setScheduleProgram(program)
    setEditingScheduleSlot(String(slot))
  }

  async function saveSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!scheduleChannelId) {
      setScheduleNotice('Selecione um canal.')
      return
    }
    setScheduleBusy(true)
    setScheduleNotice('')
    const slot = Number(scheduleSlot)
    const payload = { channel_id: scheduleChannelId, slot, program: scheduleProgram.trim() }
    const result = editingScheduleSlot !== null
      ? await supabase.from('channel_schedule').update(payload).eq('channel_id', scheduleChannelId).eq('slot', Number(editingScheduleSlot))
      : await supabase.from('channel_schedule').insert(payload)
    setScheduleBusy(false)
    if (result.error) {
      setScheduleNotice('Não foi possível salvar a programação. Confira se esse horário já está cadastrado para o canal.')
      return
    }
    setScheduleNotice(editingScheduleSlot !== null ? 'Programação atualizada.' : 'Programação cadastrada.')
    setEditingScheduleSlot(null)
    setScheduleProgram('')
    await refreshChannelSchedule()
  }

  async function removeSchedule(channelIdValue: string, slot: number) {
    const confirmed = window.confirm('Excluir este horário da programação?')
    if (!confirmed) return
    const { error } = await supabase.from('channel_schedule').delete().eq('channel_id', channelIdValue).eq('slot', slot)
    if (error) {
      setScheduleNotice('Não foi possível excluir este horário.')
      return
    }
    if (editingScheduleSlot === String(slot) && scheduleChannelId === channelIdValue) {
      setEditingScheduleSlot(null)
      setScheduleProgram('')
    }
    setScheduleNotice('Horário removido.')
    await refreshChannelSchedule()
  }

  async function saveTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setBusy(true)
    let titleId = Number(selected)
    const titlePayload = { title: title.trim(), type, genre: genre.trim(), age: Number(age), year: Number(year) }
    if (selected) {
      const { error } = await supabase.from('titles').update(titlePayload).eq('id', titleId)
      if (error) {
        setNotice('Não foi possível atualizar os dados deste título. Verifique os campos e as permissões administrativas.')
        setBusy(false)
        return
      }
    } else {
      const { data, error } = await supabase.from('titles').insert(titlePayload).select('id').single()
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
    setNotice(selected ? 'Título e direitos atualizados com sucesso.' : 'Título e direitos cadastrados com sucesso.')
    setTitle('')
    setSelected('')
    await Promise.all([refreshTitles(), refreshRights()])
  }

  return <section className="mx-auto max-w-[1440px] px-5 pb-20 pt-8 sm:px-8 lg:px-12">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-[#e6b85c]"><ShieldCheck size={14} />Área restrita</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Administração</h1><p className="mt-2 text-sm text-white/50">Gerencie títulos e licenças respeitando as políticas RLS.</p></div><span className="flex items-center gap-2 rounded-full border border-[#e6b85c]/20 bg-[#e6b85c]/[.07] px-3 py-2 text-xs text-[#e6b85c]"><BadgeCheck size={14} />Acesso administrativo</span></div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
      <form onSubmit={saveTitle} className="rounded-2xl border border-white/[.08] bg-[#111416] p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#e6b85c]/10 text-[#e6b85c]"><Clapperboard size={19} /></span><div><h2 className="font-semibold text-white">{selected ? 'Editar título e direitos' : 'Cadastrar título'}</h2><p className="mt-1 text-xs text-white/45">{selected ? 'Atualize os dados do catálogo e as condições de acesso.' : 'Inclua um título e configure seus direitos.'}</p></div></div>
        <label className="mb-5 flex flex-col gap-2 text-xs text-white/60">Selecionar título para editar direitos<select className="field-dark" value={selected} onChange={(event) => chooseTitle(event.target.value)}><option value="">Novo título</option>{titles.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs text-white/60 sm:col-span-2">Nome do título<input className="field-dark" required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nome do filme, série ou documentário" /></label>
          <label className="flex flex-col gap-2 text-xs text-white/60">Tipo<select className="field-dark" value={type} onChange={(event) => setType(event.target.value)}><option value="filme">Filme</option><option value="serie">Série</option><option value="anime">Anime</option><option value="documentario">Documentário</option></select></label>
          <label className="flex flex-col gap-2 text-xs text-white/60">Gênero<input className="field-dark" required value={genre} onChange={(event) => setGenre(event.target.value)} /></label>
          <label className="flex flex-col gap-2 text-xs text-white/60">Ano<input className="field-dark" type="number" min="1888" max="2100" required value={year} onChange={(event) => setYear(event.target.value)} /></label>
          <label className="flex flex-col gap-2 text-xs text-white/60">Classificação indicativa<select className="field-dark" value={age} onChange={(event) => setAge(event.target.value)}><option value="0">Livre</option><option value="10">10 anos</option><option value="12">12 anos</option><option value="14">14 anos</option><option value="16">16 anos</option><option value="18">18 anos</option></select></label>
        </div>
        {selected && selectedTitle && <p className="mb-4 rounded-lg border border-white/[.07] bg-[#0c0f10] px-3 py-2.5 text-xs text-white/55">Editando: {selectedTitle.title}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs text-white/60 sm:col-span-2">Regiões (códigos separados por vírgula)<input className="field-dark" required value={region} onChange={(event) => setRegion(event.target.value)} placeholder="BR, PT" /></label>
          <label className="flex flex-col gap-2 text-xs text-white/60">Início dos direitos<input className="field-dark" type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label className="flex flex-col gap-2 text-xs text-white/60">Fim dos direitos<input className="field-dark" type="date" required value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
          <label className="flex flex-col gap-2 text-xs text-white/60 sm:col-span-2">Plano mínimo<select className="field-dark" value={minPlan} onChange={(event) => setMinPlan(event.target.value)}>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}{!plans.some((plan) => plan.id === 'free') && <option value="free">Free</option>}</select></label>
        </div>
        {notice && <p role="status" className="mt-4 text-xs leading-5 text-[#e7c981]">{notice}</p>}
        <button disabled={busy} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#e6b85c] text-sm font-semibold text-[#16130b] hover:bg-[#f0ca76] disabled:opacity-55">{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}{busy ? 'Salvando…' : selected ? 'Salvar título e direitos' : 'Cadastrar título e direitos'}</button>
        <p className="mt-3 text-[11px] leading-5 text-white/35">O schema atual não tem campos de poster ou URL de mídia; eles não serão inventados nem escritos no banco.</p>
      </form>
      <div className="rounded-2xl border border-white/[.08] bg-[#111416] p-5 sm:p-7"><h2 className="font-semibold text-white">Catálogo cadastrado</h2><p className="mt-1 text-xs text-white/45">{titles.length} {titles.length === 1 ? 'título' : 'títulos'}</p><div className="mt-5 flex max-h-[580px] flex-col gap-2 overflow-y-auto">{titles.map((item) => { const itemRights = rights.find((right) => right.title_id === item.id); return <button key={item.id} type="button" onClick={() => chooseTitle(String(item.id))} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition ${selected === String(item.id) ? 'border-[#e6b85c]/30 bg-[#e6b85c]/[.06]' : 'border-white/[.06] bg-[#0c0f10] hover:border-white/15'}`}><span className="min-w-0"><span className="block truncate text-sm font-medium text-white/85">{item.title}</span><span className="mt-1 block truncate text-[11px] text-white/40">{item.year} · {item.genre} · {item.type === 'serie' ? 'Série' : item.type === 'documentario' ? 'Documentário' : item.type === 'anime' ? 'Anime' : 'Filme'}</span></span><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] ${itemRights ? 'bg-[#335b4a]/30 text-[#99d3ae]' : 'bg-[#71432d]/30 text-[#e7b18b]'}`}>{itemRights ? 'Com direitos' : 'Sem direitos'}</span></button> })}{!titles.length && <p className="py-12 text-center text-xs text-white/40">Ainda não há títulos.</p>}</div>
      </div>
    </div>

    <section className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/[.08] bg-[#111416] p-5 sm:p-7">
        <div className="mb-5 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#e6b85c]/10 text-[#e6b85c]"><Radio size={19} /></span><div><h2 className="font-semibold text-white">Canais de TV</h2><p className="mt-1 text-xs text-white/45">Cadastre e edite canais usando os campos existentes.</p></div></div>
        <form onSubmit={saveChannel} className="grid gap-4">
          <label className="flex flex-col gap-2 text-xs text-white/60">Canal para editar<select className="field-dark" value={channelId} onChange={(event) => chooseChannel(event.target.value)}><option value="">Novo canal</option>{channels.map((channel) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}</select></label>
          <label className="flex flex-col gap-2 text-xs text-white/60">Nome do canal<input className="field-dark" required maxLength={120} value={channelName} onChange={(event) => setChannelName(event.target.value)} placeholder="Nome do canal" /></label>
          <label className="flex flex-col gap-2 text-xs text-white/60">URL da transmissão ao vivo<input className="field-dark" type="url" value={channelStreamUrl} onChange={(event) => setChannelStreamUrl(event.target.value)} placeholder="https://servidor.com/video.mp4 ou link de vídeo compatível" /></label>
          <label className="flex flex-col gap-2 text-xs text-white/60">Categoria<select className="field-dark" value={channelCategory} onChange={(event) => setChannelCategory(event.target.value)}>{channelCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
          <p className="-mt-2 text-[10px] leading-4 text-white/35">Use uma URL de transmissão autorizada e compatível com o navegador. HLS (.m3u8) é reproduzido no player interno quando o servidor permite acesso e CORS.</p>
          <label className="flex items-center gap-2 text-xs text-white/65"><input type="checkbox" checked={channelKids} onChange={(event) => setChannelKids(event.target.checked)} /> Canal adequado ao perfil infantil</label>
          {channelNotice && <p role="status" className="text-xs text-[#e7c981]">{channelNotice}</p>}
          <button disabled={channelBusy} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#e6b85c] text-sm font-semibold text-[#16130b] disabled:opacity-55">{channelBusy ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}{channelBusy ? 'Salvando…' : channelId ? 'Salvar canal' : 'Cadastrar canal'}</button>
        </form>
        <div className="mt-6 flex flex-col gap-2">{channels.map((channel) => <button type="button" key={channel.id} onClick={() => chooseChannel(channel.id)} className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left ${channelId === channel.id ? 'border-[#e6b85c]/30 bg-[#e6b85c]/[.06]' : 'border-white/[.06] bg-[#0c0f10]'}`}><Tv size={17} className="text-[#e6b85c]" /><span className="min-w-0 flex-1 truncate text-sm text-white/85">{channel.name}</span><span className="text-[10px] text-white/40">{channel.category ?? (channel.kids ? 'Kids' : 'Categoria pendente')}</span></button>)}{!channels.length && <p className="text-xs text-white/35">Nenhum canal cadastrado.</p>}</div>
      </div>

      <div className="rounded-2xl border border-white/[.08] bg-[#111416] p-5 sm:p-7">
        <div className="mb-5 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#e6b85c]/10 text-[#e6b85c]"><CalendarClock size={19} /></span><div><h2 className="font-semibold text-white">Programação dos canais</h2><p className="mt-1 text-xs text-white/45">Cadastre e edite os horários existentes (0 a 23).</p></div></div>
        <form onSubmit={saveSchedule} className="grid gap-4">
          <label className="flex flex-col gap-2 text-xs text-white/60">Canal<select className="field-dark" required value={scheduleChannelId} onChange={(event) => { setScheduleChannelId(event.target.value); setEditingScheduleSlot(null) }}><option value="">Selecione um canal</option>{channels.map((channel) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}</select></label>
          <label className="flex flex-col gap-2 text-xs text-white/60">Horário<select className="field-dark" value={scheduleSlot} onChange={(event) => { setScheduleSlot(event.target.value); setEditingScheduleSlot(null) }}>{Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{String(hour).padStart(2, '0')}:00</option>)}</select></label>
          <label className="flex flex-col gap-2 text-xs text-white/60">Programa<input className="field-dark" required maxLength={160} value={scheduleProgram} onChange={(event) => setScheduleProgram(event.target.value)} placeholder="Nome do programa" /></label>
          {scheduleNotice && <p role="status" className="text-xs text-[#e7c981]">{scheduleNotice}</p>}
          <button disabled={scheduleBusy || !channels.length} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#e6b85c] text-sm font-semibold text-[#16130b] disabled:opacity-55">{scheduleBusy ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}{scheduleBusy ? 'Salvando…' : editingScheduleSlot !== null ? 'Salvar horário' : 'Cadastrar horário'}</button>
          {editingScheduleSlot !== null && <button type="button" onClick={() => { setEditingScheduleSlot(null); setScheduleProgram('') }} className="text-xs text-white/50 hover:text-white">Cancelar edição</button>}
        </form>
        <div className="mt-6 flex max-h-[420px] flex-col gap-2 overflow-y-auto">{channelSchedule.map((item) => <div key={item.channel_id + '-' + item.slot} className="flex items-center gap-2 rounded-xl border border-white/[.06] bg-[#0c0f10] px-3 py-3"><span className="w-12 shrink-0 text-xs text-[#e6b85c]">{String(item.slot).padStart(2, '0')}:00</span><span className="min-w-0 flex-1"><span className="block truncate text-xs text-white/85">{item.program}</span><span className="block truncate text-[10px] text-white/35">{channels.find((channel) => channel.id === item.channel_id)?.name ?? 'Canal'}</span></span><button type="button" title="Editar horário" onClick={() => chooseSchedule(item.channel_id, item.slot, item.program)} className="grid size-8 place-items-center rounded-lg text-white/50 hover:bg-white/[.07] hover:text-white"><Pencil size={14} /></button><button type="button" title="Excluir horário" onClick={() => removeSchedule(item.channel_id, item.slot)} className="grid size-8 place-items-center rounded-lg text-white/50 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={14} /></button></div>)}{!channelSchedule.length && <p className="text-xs text-white/35">Nenhum horário cadastrado.</p>}</div>
      </div>
    </section>
  </section>
}
