'use client'

import { useState, type FormEvent } from 'react'
import Image from 'next/image'
import { ArrowRight, Eye, EyeOff, Film, LockKeyhole, Mail, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function AuthScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setBusy(true)

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
          data: { name: name.trim() },
        },
      })
      setBusy(false)
      if (error) {
        const lower = error.message.toLowerCase()
        setMessage(lower.includes('password') ? 'Escolha uma senha mais forte, com pelo menos 8 caracteres.' : 'Não foi possível concluir o cadastro. Confira os dados e tente novamente.')
        return
      }
      if (!data.session) {
        setMessage('Cadastro recebido. Confira seu e-mail para confirmar a conta e entrar.')
        return
      }
      onAuthenticated()
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) {
      const lower = error.message.toLowerCase()
      setMessage(lower.includes('confirm') ? 'Confirme seu e-mail pelo link enviado antes de entrar.' : 'E-mail ou senha inválidos. Confira seus dados e tente novamente.')
      return
    }
    onAuthenticated()
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#080a0c]">
      <div className="absolute inset-0 lg:hidden">
        <Image src="/images/ibstreaming-hero.png" alt="" fill priority className="object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080a0c] via-[#080a0c]/75 to-[#080a0c]/40" />
      </div>
      <section className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col lg:min-h-screen lg:flex-row">
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[calc(100%-480px)] overflow-hidden lg:block">
          <Image src="/images/ibstreaming-hero.png" alt="" fill priority className="object-cover object-[center_42%] opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080a0c]/20 via-[#080a0c]/45 to-[#080a0c]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080a0c] via-[#080a0c]/15 to-[#080a0c]/25" />
        </div>
        <div className="relative flex flex-1 flex-col justify-between px-6 py-7 sm:px-10 lg:px-16 lg:py-10">
          <a href="#inicio" aria-label="IBStreaming, início" className="inline-flex w-fit items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#e6b85c] text-[#16130b]"><Film size={20} strokeWidth={2.2} /></span>
            <span className="text-[19px] font-semibold tracking-[.13em] text-white">IB<span className="text-[#e6b85c]">STREAMING</span></span>
          </a>
          <div className="mt-20 max-w-[560px] pb-10 lg:mt-0 lg:pb-14">
            <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-[#e6b85c]"><Sparkles size={15} /> Histórias que ficam com você</div>
            <h1 className="max-w-[520px] text-4xl font-medium leading-[1.08] tracking-[-.04em] text-white sm:text-5xl lg:text-[64px]">Seu próximo mundo começa aqui.</h1>
            <p className="mt-5 max-w-[410px] text-base leading-7 text-white/65">Filmes, séries e animes escolhidos para transformar qualquer momento em uma boa história.</p>
            <div className="mt-8 flex items-center gap-3 text-sm text-white/65"><span className="flex -space-x-2"><span className="size-7 rounded-full border-2 border-[#141719] bg-[#b66d52]" /><span className="size-7 rounded-full border-2 border-[#141719] bg-[#d2ab6a]" /><span className="size-7 rounded-full border-2 border-[#141719] bg-[#547d77]" /></span><span>Um universo de entretenimento, em um só lugar.</span></div>
          </div>
          <p className="hidden text-xs text-white/35 lg:block">© 2026 IBStreaming. Seu entretenimento, do seu jeito.</p>
        </div>
        <div className="relative flex w-full items-center justify-center px-5 pb-8 sm:px-10 lg:w-[480px] lg:shrink-0 lg:bg-[#0f1214] lg:px-12">
          <div className="absolute inset-y-0 left-0 hidden w-px bg-white/[.07] lg:block" />
          <div className="w-full max-w-[385px] rounded-2xl border border-white/[.08] bg-[#0e1113]/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <div className="mb-7">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[.17em] text-[#e6b85c]">Bem-vindo à sua sessão</p>
              <h2 className="text-2xl font-semibold tracking-tight text-white">{mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}</h2>
              <p className="mt-2 text-sm text-white/55">{mode === 'login' ? 'Continue de onde a sua história parou.' : 'É rápido. Em instantes você estará assistindo.'}</p>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-4">
              {mode === 'signup' && <label className="flex flex-col gap-2 text-sm text-white/75">Seu nome<input className="field-dark" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Como podemos chamar você?" /></label>}
              <label className="flex flex-col gap-2 text-sm text-white/75">E-mail<span className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" /><input className="field-dark pl-10" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" /></span></label>
              <label className="flex flex-col gap-2 text-sm text-white/75">Senha<span className="relative"><LockKeyhole size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" /><input className="field-dark pl-10 pr-11" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Pelo menos 8 caracteres" /><button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
              {message && <p role="status" className="rounded-lg border border-[#e6b85c]/25 bg-[#e6b85c]/[.08] px-3 py-2.5 text-sm leading-5 text-[#efd69c]">{message}</p>}
              <button disabled={busy} className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#e6b85c] px-4 text-sm font-semibold text-[#16130b] transition hover:bg-[#f0ca76] disabled:cursor-wait disabled:opacity-60">{busy ? 'Só um instante…' : mode === 'login' ? 'Entrar na IBStreaming' : 'Criar minha conta'}{!busy && <ArrowRight size={16} />}</button>
            </form>
            <div className="my-6 flex items-center gap-3 text-xs text-white/30"><span className="h-px flex-1 bg-white/10" />ACESSO SEGURO<span className="h-px flex-1 bg-white/10" /></div>
            <p className="text-center text-sm text-white/55">{mode === 'login' ? 'Ainda não tem uma conta?' : 'Já tem uma conta?'}{' '}<button className="font-semibold text-[#e6b85c] hover:text-[#f0ca76]" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage('') }}>{mode === 'login' ? 'Cadastre-se' : 'Fazer login'}</button></p>
          </div>
          <p className="absolute bottom-4 text-center text-[11px] text-white/30 lg:hidden">© 2026 IBStreaming</p>
        </div>
      </section>
    </main>
  )
}
