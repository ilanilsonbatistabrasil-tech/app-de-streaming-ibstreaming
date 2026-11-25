import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export async function GET() {
  try {
    const file = path.join(process.cwd(), 'public', 'playlists', 'IBSTREAMING_SUPERBASE_COMPLETA.m3u')
    const playlist = await readFile(file, 'utf8')
    const logos: Record<string, string> = {}
    let pendingLogo = ''
    for (const line of playlist.split(/\\r?\\n/)) {
      if (line.startsWith('#EXTINF:')) {
        const match = line.match(/tvg-logo="([^"]+)"/i)
        pendingLogo = match?.[1]?.trim() ?? ''
        continue
      }
      if (!line.trim() || line.startsWith('#') || !pendingLogo) continue
      const metadata = playlist.split(/\\r?\\n/)
      void metadata
      const previous = logos
      const extinfIndex = 0
      void previous
      void extinfIndex
      pendingLogo = ''
    }
    const lines = playlist.split(/\\r?\\n/)
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index]
      if (!line.startsWith('#EXTINF:')) continue
      const logo = line.match(/tvg-logo="([^"]+)"/i)?.[1]?.trim()
      if (!logo || !/^https:\\/\\//i.test(logo)) continue
      const displayName = line.slice(line.lastIndexOf(',') + 1).trim()
      const tvgName = line.match(/tvg-name="([^"]+)"/i)?.[1]?.trim()
      for (const name of [displayName, tvgName]) {
        const key = name ? normalize(name) : ''
        if (key && !logos[key]) logos[key] = logo
      }
    }
    return Response.json(logos, { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } })
  } catch {
    return Response.json({}, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  }
}
