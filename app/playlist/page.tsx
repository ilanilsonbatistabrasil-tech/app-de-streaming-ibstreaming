import { headers } from 'next/headers'

export default async function PlaylistPage() {
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https'
  const playlistUrl = host ? `${protocol}://${host}/api/playlist/superbase` : '/api/playlist/superbase'

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 bg-[#080a0c] px-6 py-16 text-white">
      <div>
        <p className="text-sm font-medium text-emerald-400">IBStreaming</p>
        <h1 className="mt-2 text-3xl font-bold">Super Base IPTV</h1>
        <p className="mt-3 text-white/70">
          Copie o endereço direto para importar a playlist em um aplicativo IPTV
          ou baixe o arquivo M3U para guardar no seu dispositivo.
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-semibold">Endereço para importar</h2>
        <code className="mt-3 block break-all rounded-lg bg-black/40 p-3 text-sm text-emerald-200">
          {playlistUrl}
        </code>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={playlistUrl}
            className="inline-flex rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-black"
          >
            Abrir playlist
          </a>
          <a
            href={`${playlistUrl}?download=1`}
            className="inline-flex rounded-lg border border-white/20 px-4 py-2 font-semibold text-white"
          >
            Baixar arquivo M3U
          </a>
        </div>
      </section>

      <p className="text-sm text-white/50">
        A lista contém canais ao vivo de fontes externas. A disponibilidade e
        os direitos de transmissão dependem de cada emissora e provedor.
      </p>
    </main>
  )
}
