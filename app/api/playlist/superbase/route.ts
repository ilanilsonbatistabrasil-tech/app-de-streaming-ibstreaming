import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const playlistPath = path.join(
    process.cwd(),
    'public',
    'playlists',
    'IBSTREAMING_SUPERBASE_COMPLETA.m3u',
  )

  try {
    const playlist = await readFile(playlistPath)
    const firstLine = playlist.toString('utf8', 0, Math.min(playlist.length, 32)).split(/\r?\n/, 1)[0]

    if (firstLine.trim() !== '#EXTM3U') {
      return new Response('Arquivo M3U inválido: cabeçalho #EXTM3U não encontrado.', {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    const download = new URL(request.url).searchParams.get('download') === '1'
    return new Response(playlist, {
      status: 200,
      headers: {
        'Content-Type': 'audio/x-mpegurl; charset=utf-8',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="IBSTREAMING_SUPERBASE_COMPLETA.m3u"`,
        'Content-Length': String(playlist.byteLength),
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new Response('Playlist IBStreaming não encontrada no servidor.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
