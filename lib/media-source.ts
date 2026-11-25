export type MediaSourceKind = 'hls' | 'dash' | 'native'

export function getMediaSourceKind(source: string): MediaSourceKind {
  try {
    const url = new URL(source)
    const path = url.pathname.toLowerCase()
    if (path.endsWith('.m3u8') || url.searchParams.get('format')?.toLowerCase() === 'hls') return 'hls'
    if (path.endsWith('.mpd') || url.searchParams.get('format')?.toLowerCase() === 'dash') return 'dash'
    return 'native'
  } catch {
    return 'native'
  }
}

/**
 * Converte somente páginas públicas de provedores conhecidos em seus embeds oficiais.
 * Páginas de serviços com DRM/assinatura não são convertidas em streams internos.
 */
export function getVideoEmbedUrl(source: string | null): string | null {
  if (!source) return null

  try {
    const url = new URL(source)
    if (url.protocol !== 'https:') return null
    const host = url.hostname.toLowerCase()

    if (host === 'youtu.be' || host === 'www.youtu.be' || host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      let videoId = ''
      if (host === 'youtu.be' || host === 'www.youtu.be') {
        videoId = url.pathname.split('/').filter(Boolean)[0] ?? ''
      } else if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v') ?? ''
      } else {
        const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/)
        videoId = match?.[1] ?? ''
      }
      if (/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
        return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`
      }
      return null
    }

    if (host === 'player.vimeo.com' && /^\/video\/\d+/.test(url.pathname)) return url.href
    if (host === 'vimeo.com' || host === 'www.vimeo.com') {
      const match = url.pathname.match(/^\/(\d+)/)
      if (match?.[1]) return `https://player.vimeo.com/video/${match[1]}`
      return null
    }

    if (host === 'dai.ly' || host === 'www.dai.ly') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id && /^[A-Za-z0-9]+$/.test(id) ? `https://www.dailymotion.com/embed/video/${id}` : null
    }
    if (host === 'dailymotion.com' || host === 'www.dailymotion.com') {
      const match = url.pathname.match(/^\/video\/([A-Za-z0-9]+)/)
      if (match?.[1]) return `https://www.dailymotion.com/embed/video/${match[1]}`
      if (url.pathname.startsWith('/embed/video/')) return url.href
    }

    return null
  } catch {
    return null
  }
}
