'use client'

import { useState, type FormEvent } from 'react'
import { CircleUserRound, LockKeyhole, Plus, ShieldCheck, Sparkles, Tv } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Profile = { id: string; name: string; kids: boolean }

export function ProfilePicker({ profiles, onSelect, onCreated }: { profiles: Profile[]; onSelect: (profile: Profile) => void; onCreated: () => void }) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [kids, setKids] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function createProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    const supabase = createClient()
    const { data, error: insertError } = await supabase.from('profiles').insert({ name: name.trim(), kids }).select('id,name,kids').single()
    if (insertError || !data) {
      setError('Não foi possível criar o perfil. Verifique o acesso da conta e tente novamente.')
      setBusy(false)
      return
    }
    if (pin) {
      const { error: pinError } = await supabase.rpc('set_profile_pin', { p_profile: data.id, p_pin: pin })
      if (pinError) setError('O perfil foi criado, mas o PIN não pôde ser salvo. Você pode configurá-lo depois.')
    }
    setBusy(false)
    onCreated()
    onSelect(data)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080a0c] px-5 py-12">
      <div className="w-full max-w-4xl">
        <header className="mb-12 flex flex-col items-center text-center">
          <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-[#e6b85c] text-[#16130b]"><Tv size={22} /></span>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#e6b85c]">IBStreaming</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Quem vai assistir?</h1>
          <p className="mt-2 text-sm text-white/50">Escolha um perfil para entrar no seu universo.</p>
        </header>
        {!creating ? <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {profiles.map((profile, index) => <button key={profile.id} type="button" onClick={() => onSelect(profile)} className="group flex flex-col items-center gap-3 rounded-2xl border border-white/[.07] bg-[#111416] p-5 transition hover:border-[#e6b85c]/45 hover:bg-[#171b1d]">
              <span className={`grid size-20 place-items-center rounded-2xl text-white transition group-hover:scale-[1.04] ${profile.kids ? 'bg-gradient-to-br from-[#57a998] to-[#335f67]' : ['bg-gradient-to-br from-[#a46150] to-[#533b48]', 'bg-gradient-to-br from-[#89754f] to-[#4c4651]', 'bg-gradient-to-br from-[#537e7b] to-[#344756]'][index % 3]}`}>
                {profile.kids ? <Sparkles size={31} /> : <CircleUserRound size={34} />}
              </span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-white/90">{profile.name}{profile.kids && <span className="rounded bg-[#315d58] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[#c4eee2]">Kids</span>}</span>
            </button>)}
            <button type="button" onClick={() => setCreating(true)} className="flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 text-white/55 transition hover:border-[#e6b85c]/50 hover:text-[#e6b85c]"><span className="grid size-14 place-items-center rounded-2xl bg-white/[.06]"><Plus size={24} /></span><span className="text-sm">Adicionar perfil</span></button>
          </div>
          {profiles.length === 0 && <p className="mt-6 text-center text-sm text-white/40">Crie o primeiro perfil da sua conta.</p>}
          <button type="button" onClick={() => setCreating(true)} className="sr-only">Criar perfil</button>
        </> : <div className="mx-auto max-w-md rounded-2xl border border-white/[.08] bg-[#111416] p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white">Novo perfil</h2>
          <p className="mt-1 text-sm text-white/50">Personalize a experiência de quem vai assistir.</p>
          <form onSubmit={createProfile} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm text-white/75">Nome do perfil<input className="field-dark" required maxLength={32} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Marina" /></label>
            <label className="flex items-center gap-3 rounded-xl border border-white/[.08] bg-[#0c0f10] p-3.5 text-sm text-white/75"><input type="checkbox" checked={kids} onChange={(event) => setKids(event.target.checked)} className="size-4 accent-[#e6b85c]" />Perfil infantil <span className="ml-auto text-xs text-white/35">Conteúdo até 10 anos</span></label>
            <label className="flex flex-col gap-2 text-sm text-white/75"><span className="flex items-center gap-2"><LockKeyhole size={15} />PIN parental <span className="text-xs text-white/35">opcional</span></span><input className="field-dark" type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{4,8}" minLength={4} maxLength={8} value={pin} onChange={(event) => setPin(event.target.value)} placeholder="4 a 8 dígitos" /></label>
            <p className="flex items-start gap-2 text-xs leading-5 text-white/40"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#e6b85c]/75" />O PIN é armazenado com hash no Supabase e solicitado antes de títulos protegidos.</p>
            {error && <p role="status" className="text-sm text-[#f1bd9f]">{error}</p>}
            <div className="mt-1 flex gap-3"><button type="button" onClick={() => setCreating(false)} className="h-11 flex-1 rounded-lg border border-white/10 text-sm text-white/65 hover:bg-white/[.04]">Cancelar</button><button disabled={busy} className="h-11 flex-1 rounded-lg bg-[#e6b85c] text-sm font-semibold text-[#16130b] hover:bg-[#f0ca76] disabled:opacity-60">{busy ? 'Criando…' : 'Criar perfil'}</button></div>
          </form>
        </div>}
      </div>
    </main>
  )
}
