import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { AdminPanel } from '@/components/admin-panel'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: account } = await supabase.from('accounts').select('role').eq('id', user.id).maybeSingle()
  if (account?.role !== 'admin') {
    return <main className="grid min-h-screen place-items-center bg-[#080a0c] px-5 text-center"><div><ShieldAlert size={30} className="mx-auto text-[#e6b85c]" /><h1 className="mt-4 text-2xl font-semibold text-white">Acesso restrito</h1><p className="mt-2 text-sm text-white/50">Esta área está disponível apenas para contas com role admin.</p><Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/75 hover:bg-white/[.06]"><ArrowLeft size={15} />Voltar ao catálogo</Link></div></main>
  }

  return <main className="min-h-screen bg-[#080a0c] text-white"><div className="mx-auto max-w-[1440px] px-5 pt-7 sm:px-8 lg:px-12"><Link href="/" className="inline-flex items-center gap-2 text-xs text-white/55 hover:text-white"><ArrowLeft size={14} />Voltar ao IBStreaming</Link></div><AdminPanel /></main>
}
