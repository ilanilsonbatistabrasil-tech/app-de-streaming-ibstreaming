'use client'

import { useState } from 'react'
import { Check, CirclePlay, LockKeyhole, Play, ShieldCheck, Tv, X } from 'lucide-react'
import type { TitleRecord } from './title-card'

const reasonLabels: Record<string, string> = {
  indisponivel: 'Este título não está disponível para a sua região ou neste período.',
  plano: 'Este título faz parte de um plano diferente do seu.',
  infantil: 'Este conteúdo não está disponível para o perfil infantil selecionado.',
  pin: 'Este título exige a confirmação do PIN parental deste perfil.',
}

export function PlayerDialog({ title, initiallyAuthorized, onClose, onVerifyPin, onMarkWatched }: { title: TitleRecord; initiallyAuthorized: boolean; onClose: () => void; onVerifyPin: (pin: string) => Promise<string>; onMarkWatched: () => Promise<void> }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [authorized, setAuthorized] = useState(initiallyAuthorized)

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setChecking(true)
    const reason = await onVerifyPin(pin)
    setChecking(false)
    if (reason === 'ok') {
      setAuthorized(true)
      setError('')
    } else {
      setError(reason === 'pin' ? 'O PIN informado não confere. Tente novamente.' : reasonLabels[reason] ?? 'Não foi possível validar o PIN. Tente novamente.')
      setPin('')
    }
  }

  return <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="player-title" className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#101315] shadow-2xl">
      <header className="flex items-center justify-between border-b border-white/[.08] px-5 py-4 sm:px-6"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.17em] text-[#e6b85c]">IBStreaming Player</p><h2 id="player-title" className="mt-1 truncate text-base font-semibold text-white">{title.title}</h2></div><button type="button" onClick={onClose} aria-label="Fechar player" className="grid size-9 shrink-0 place-items-center rounded-full text-white/50 hover:bg-white/[.08] hover:text-white"><X size={19} /></button></header>
      <div className="relative grid aspect-video place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_35%,#252b2c_0%,#111516_46%,#080a0c_100%)] p-6 text-center">
        {authorized ? <div className="max-w-md"><span className="mx-auto grid size-14 place-items-center rounded-full border border-[#e6b85c]/20 bg-[#e6b85c]/10 text-[#e6b85c]"><CirclePlay size={26} /></span><p className="mt-5 text-sm font-semibold text-white">Acesso liberado</p><p className="mt-2 text-xs leading-5 text-white/50">O cadastro deste título não inclui uma URL de vídeo. A reprodução ficará disponível quando uma fonte licenciada for vinculada ao catálogo.</p><button type="button" onClick={onMarkWatched} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/75 hover:bg-white/[.06]"><Check size={14} />Marcar como assistido</button></div> : <div className="max-w-md"><span className="mx-auto grid size-14 place-items-center rounded-full border border-white/10 bg-white/[.05] text-white/75"><Play size={22} fill="currentColor" /></span><p className="mt-5 text-sm font-semibold text-white">Verificando acesso</p><p className="mt-2 text-xs leading-5 text-white/50">A autorização deste título é consultada antes de iniciar a reprodução.</p><div className="mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[.12em] text-[#e6b85c]"><ShieldCheck size={13} />Direitos verificados pelo Supabase</div></div>}
      </div>
      {!authorized && title.age >= 16 && <form onSubmit={verify} className="flex flex-wrap items-end gap-3 border-t border-white/[.08] px-5 py-4 sm:px-6"><label className="min-w-[190px] flex-1 text-xs text-white/60"><span className="mb-2 flex items-center gap-1.5"><LockKeyhole size={13} />PIN parental (se solicitado)</span><input className="field-dark" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={pin} onChange={(event) => setPin(event.target.value)} placeholder="Digite o PIN" /></label><button disabled={checking || !pin} className="h-[44px] rounded-lg bg-[#e6b85c] px-4 text-xs font-semibold text-[#16130b] disabled:opacity-50">{checking ? 'Verificando…' : 'Confirmar PIN'}</button>{error && <p role="alert" className="w-full text-xs text-[#f0a891]">{error}</p>}</form>}
      {!authorized && title.age < 16 && <div className="flex items-center gap-2 border-t border-white/[.08] px-5 py-4 text-xs text-white/45 sm:px-6"><Tv size={14} />Classificação indicativa: {title.age === 0 ? 'Livre' : `${title.age}+`} · Acesso conferido antes da reprodução.</div>}
    </section>
  </div>
}
