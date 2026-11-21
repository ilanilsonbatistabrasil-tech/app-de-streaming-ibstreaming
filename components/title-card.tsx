'use client'

import { Bookmark, Check, CirclePlay, LockKeyhole } from 'lucide-react'

export type TitleRecord = {
  id: number
  title: string
  type: string
  genre: string
  age: number
  year: number
}

export function TitleCard({
  title,
  progress,
  saved,
  onPlay,
  onToggleList,
}: {
  title: TitleRecord
  progress?: number
  saved?: boolean
  onPlay: (title: TitleRecord) => void
  onToggleList: (title: TitleRecord) => void
}) {
  const style = `poster-surface poster-fallback-${Math.abs(title.id) % 5}`

  return (
    <article className="group min-w-0">
      <div className={`relative aspect-[.72] overflow-hidden rounded-xl border border-white/[.08] transition duration-300 group-hover:-translate-y-1 group-hover:border-white/20 ${style}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-black/10 opacity-80 transition group-hover:opacity-100" />
        <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/35 px-2 py-1 text-[10px] font-medium capitalize text-white/85 backdrop-blur">{title.type}</div>
        <button type="button" onClick={() => onToggleList(title)} aria-label={saved ? `Remover ${title.title} da minha lista` : `Adicionar ${title.title} à minha lista`} className="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur transition hover:bg-[#e6b85c] hover:text-black">{saved ? <Check size={15} /> : <Bookmark size={15} />}</button>
        <div className="absolute inset-x-3 bottom-3 flex translate-y-2 flex-col gap-2 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <button type="button" onClick={() => onPlay(title)} className="flex h-9 items-center justify-center gap-2 rounded-lg bg-white text-xs font-semibold text-black hover:bg-[#e6b85c]"><CirclePlay size={15} />Assistir</button>
        </div>
        {typeof progress === 'number' && progress > 0 && <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20"><span className="block h-full bg-[#e6b85c]" style={{ width: `${Math.min(progress, 100)}%` }} /></div>}
      </div>
      <button type="button" onClick={() => onPlay(title)} className="mt-3 block w-full truncate text-left text-sm font-semibold text-white/90 hover:text-[#e6b85c]">{title.title}</button>
      <p className="mt-1 truncate text-xs text-white/45">{title.year} <span className="mx-1 text-white/20">·</span> {title.genre} <span className="mx-1 text-white/20">·</span> {title.age === 0 ? 'Livre' : `${title.age}+`}</p>
    </article>
  )
}
