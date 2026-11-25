export type ImportedBrazilChannel = {
  id: string
  name: string
  kids: boolean
  stream_url: string | null
  catalog_group: string
  access_label: string
}

const brazilNames = \`1001 Noites
+MaisUm
Adesso TV
AgroBrasil TV
AgroCanal
AgroMais
Alpha Channel
Amazon Sat
Araruna TV
Aratu On
Arte 1
Auge TV
AWTV
AXN
Band
Band Sports
BandNews
Bem Mais TV
Bem Melhor
Blitstv
Boas Novas
Box Kids TV
BR8 TV
Cabo Frio TV
Canal 25 Jundiai
Canal 25 Jundiaí
Canal 38
Canal do Boi
Canal do Criador
Canal do Inter
Canal Educacao
Canal Educação
Canal FDR
Canal Futura
Canal Gov
Canal Libras
Canal Metropolitano de Noticias
Canal Ricos
Canal Rural
Canal Saude
Canal Saúde
Canal Sete
Canal START
Canal UOL
Catve2
Catve FM
Catve Master TV
Chroma TV
CINDIE TV
Cinturao Verde
Classique TV
CNN Brasil
COM Brasil
Combate
Comedy Central Brasil
Conecta Mais TV
Conecta+ TV
ConecTV Brasil
Conexão TV
Cultura Fast
Cultura Para
Cultura Pará
Demais TV
Despertar TV
DumDum
Elemental Channel
ElyTV
ESPN
ESPN 3
ESPN 4
EUTV
Fala Litoral
Fish TV
Fonte TV
Fora Tedio TV
Futura
ge Fast
Geekdot
Ghost TV
GloboNews
Globoplay Novelas
Gloob
Gloob Web
GNT
Gospel Cartoon
Gospel Movie TV
History
IMPD TV Worldwide
ISTV
J3NEWS TV
Jovem Pan News
KpopTV Play
Kuriakos Cine
Kuriakos Kids
L!ke
Laboral TV
Lamore Rock Show WebTV
Lider TV
Loading
MBC Brasil TV
MKK Web TV
Music Box Brazil
N Sports
Nickelodeon
NickOnline Bob Esponja
NickOnline HD
Nova Era TV
Novo Tempo
NTV
Nuevo Tiempo
O Dia TV
Petlovers TV
Play TV
Plena TV
Plenitude TV
Primer TV
RBATV
RCTV Brasil
Record
Record News
Record TV Belem
Record TV Brasilia
Record TV Goias
Record TV Itapoan
Record TV Rio
Record TV RS
Record TV SP
RecordTV
RecordTV Interior SP
Rede Brasil
Rede CNT Rio de Janeiro
Rede CNT Salvador
Rede Familia
Rede Globo
Rede Gospel
Rede Impacto Gospel TV
Rede Meio Norte
Rede Metropole
Rede Minas
Rede NGT
Rede Premium TV
Rede RC
Rede Seculo 21
Rede SPTV
Rede TV!
Rede TV! Mais
Rede TV! SP
Rede Vida
RedeTV! Parana
Retro Cartoon
RIT TV
Santa Cecilia TV
SBT Cuiaba
SBT Interior
SBT Kids
SBT Nacional
SBT News
SBT Nova Mutum
SBT Rondonopolis
Series Classic
Sertão TV
SESC TV
Show do Milhao
SIC TV
Slime
Sony Channel
Sony Movies
SOU TV
SporTV 2
SporTV 3
STZ TV
TCM 10 HD
Telecine Action
Telecine Cult
Telecine Fun
Telecine Premium
Telecine Touch
Terra Viva
TikTok Radio Brasil
Times Brasil
Travel Box Brazil
TV 3 Curitiba
TV A Critica
TV A Folha
TV Adorar
TV Aldeia
TV Aliança Catarinense
TV Alternativa
TV Aparecida
TV Arapuan
TV Assembléia Ceará
TV Assembleia Piaui
TV Bahia
TV Birigui
TV Brasil
TV Brasil Oeste
TV Brusque
TV CAJUI WEB
TV Camara
TV Câmara
TV Câmara 2
TV Câmara Salvador
TV Cancao Nova
TV Carioca
TV Cidade de Petrópolis
TV Cidade Verde Cuiaba
TV Clube
TV Cultura
TV Curuça
TV das Artes
TV Destak
TV Diário Macapá
TV Difusao
TV Difusora Leste
TV Digital Biriguí
TV Empire Magazine
TV Encontro das Aguas
TV Evangelizar
TV Fronteira
TV Futuro
TV Gazeta
TV Gazin
TV Gideoes
TV Globo Brasilia
TV Globo Sao Paulo
TV Grande Natal
TV Grao Pará
TV Guará
TV Guarapari
TV Interlagos
TV Justica
TV Liberdade
TV Life America
TV Litoral RN
TV Maanaim
TV Mackenzie
TV Mais Maricá
TV Marajoara
TV Meio
TV Metropole
TV Mon
TV Natal
TV Padre Cicero
TV Pai Eterno
TV Pantanal MS
TV Paraense
TV Paraná Turismo
TV Passo Fundo
TV Petropolis
TV Profissao
TV Ra Tim Bum
TV São Raimundo
TV Senado
TV Series 1 As Panteras
TV Show Fortaleza
TV Sim Cachoeiro
TV Sim São Mateus
TV Sol Comunidade
TV Sul Bahia
TV Sul de Minas
TV Terceiro Anjo
TV Thathi
TV UFG
TV UFOP
TV Universal
TV Viçosa
TV Vila Real
TV Zoom
TV+Pet
TVC-Rio
TVCOM DF
TVCOM Maceió
TVE RS
TVídeoNews
TVitapé
TVLatinaSat
TVMatic Comedy
TVMatic Crafts
TVMatic Facebook
TVMatic Fight
TVMatic Funny
TVMatic TikTok
TVNBN
UMA TV
UNISUL TV
UniTV Porto Alegre
VEJA+ TV
VRT Channel
WooHoo\`.split('\n')

const plutoNames = \`A Caçadora de Relíquias
A Feiticeira
Acumuladores Obsessivos
Adrenalina Pura TV
Assombrações
Avatar: A lenda de Aang
Baby Shark TV
Babyfirst
BET Pluto TV
Beyblade
BM&C News
Bob Esponja Calça Quadrada
Boruto: Naruto Next Generations
Caçadores de Óvnis
CBS News
Charmed: Jovens Bruxas
Clube do Terror
Cocoricó
Comedy Central Pluto TV
Comedy Central South Park
CSI: Miami
Death Note
Detetives Médicos
Diff’rent Strokes Arnold
Estado Paranormal
Euronews Portuguese
FailArmy
FIFA+
Filmelier TV
Filmes Suspense
Homeful
Hunter x Hunter
Inspetor Bugiganga
Inuyasha
JoJo’s Bizarre Adventure
Jornada nas Estrelas A Nova Geração
Jornada nas Estrelas Deep Space Nine
Jornada nas Estrelas Voyager
Jovem Pan NEWS
Kenan & Kel
MacGyver
Mais MasterChef Brasil
MasterChef
MasterChef Brasil Profissionais
Mistérios sem Solução
Moranguinho
MTV Are you the One?
MTV Biggest Pop
MTV Catfish
MTV Com o Ex
MTV Dating
MTV Jovens e Mães
MTV Pluto TV
MTV Reality
MTV Rocks
MTV Rupaul's Drag Race
MTV Shore
Naruto
Naruto Shippuden
NatureTime
NCIS
Nick Jr. Club
Nickelodeon Clássico
Nickelodeon iCarly
Nickelodeon Teen
Nickelodeon Toons
Numbers
O Encantador de Cães
O Homem que veio do Céu
O Reino Infantil
Oggy e as Baratas Tontas
One Piece
Os Arquivos do FBI
Os Padrinhos Mágicos
Os Smurfs
Pegadinhas Just for Laughs
PFL MMA
Pluto TV Aliens
Pluto TV Animais
Pluto TV Anime
Pluto TV Anime Ação
Pluto TV Bang Bang
Pluto TV Canal UOL
Pluto TV Cine Clássicos
Pluto TV Cine Comédia
Pluto TV Cine Comédia Romântica
Pluto TV Cine Crime
Pluto TV Cine Drama
Pluto TV Cine Família
Pluto TV Cine Inspiração
Pluto TV Cine Romance
Pluto TV Cine Sucessos
Pluto TV Cine Terror
Pluto TV Cozinha
Pluto TV Desenhos Clássicos
Pluto TV Esportes
Pluto TV Ficção Científica
Pluto TV Filmes Ação
Pluto TV Filmes Aventura
Pluto TV Filmes de Luta
Pluto TV Filmes Nacionais
Pluto TV História
Pluto TV Investigação
Pluto TV Junior
Pluto TV Karaokê por Stingray
Pluto TV KFOOD
Pluto TV Kids
Pluto TV Kids Club
Pluto TV Minha Obsessão Favorita
Pluto TV Mistérios
Pluto TV MTV Classic
Pluto TV Natureza
Pluto TV Negócio Fechado
Pluto TV Netmovies
Pluto TV Novelas
Pluto TV Paisagens por Stingray
Pluto TV Policial
Pluto TV Record News
Pluto TV Retrô
Pluto TV Séries Ação
Pluto TV Séries Comédia
Pluto TV Séries Criminais
Pluto TV Séries Drama
Pluto TV Séries Novelescas
Pluto TV Séries Sci-Fi
Pluto TV Shows por Stingray
Pluto TV Star Trek
Pluto TV Terror Trash
Pluto TV Turbo
Pluto TV Viagens
Pluto TV Vida Real
Pokémon
Popeye
PORTATV
Pronto-socorro: Histórias De Emergência
RACER Brasil
Realmadrid TV
Red Bull TV BR
Rookie Blue
Runtime
Salon Line
SFT Combat
Smithsonian Channel Pluto TV
Sony One Shark Tank Brasil
South Park: Coleção Cartman
South Park: Coleção Kenny
South Park: Coleção Kyle
South Park: Coleção Stan
Super Onze
Tastemade
Tastemade Casa
Tastemade Viagem
Teletubbies
The Pet Collective
The Walking Dead by AMC
TikTok Radio Brasil
Times Brasil | CNBC
Tokusato
Top Barça
Turma da Mônica
TV Cultura
UFC
World Poker Tour
Yu-Gi-Oh
Z Nation\`.split('\n')

const samsungNames = \`MyTime Movie Network Brazil
Trace Brasil
VEJA+ TV\`.split('\n')

// Apenas endpoints oficiais/institucionais identificáveis no próprio M3U enviado.
const verifiedPublicStreams: Record<string, string> = {
  'Canal Educação': 'https://canaleducacao-stream.ebc.com.br/index.m3u8',
  'Canal Gov': 'https://canalgov-stream.ebc.com.br/index.m3u8',
  'Canal Libras': 'https://canallibras-stream.ebc.com.br/mux_video_ts/index-1.m3u8',
  'Canal UOL': 'https://video24.mais.uol.com.br/live/6146.m3u8',
  'Cultura Fast': 'https://fpa-gateway.tvcultura.com.br:8181/memfs/606caef0-a290-413d-9f1f-8fcdb3a73831.m3u8',
  'TV Brasil': 'https://tvbrasil-stream.ebc.com.br/index.m3u8',
  'TV Câmara': 'https://stream3.camara.gov.br/tv1/manifest.m3u8',
  'TV Câmara 2': 'https://stream3.camara.gov.br/tv2/manifest.m3u8',
  'TV Cultura': 'https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8',
  'TV UFOP': 'https://app.tvufop.com.br/hls/tvufop.m3u8',
  'TVE RS': 'https://streaming.procergs.com.br:8443/tve/stve/playlist.m3u8',
}


function normalizeName(value: string): string {
  return value.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function uniqueNames(values: string[]): string[] {
  const seen = new Set<string>()
  return values.filter((value) => {
    const key = normalizeName(value)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function isKidsChannel(name: string): boolean {
  return /kids|gloob|baby shark|babyfirst|avatar|beyblade|bob esponja|boruto|cocoric|morang|naruto|nickelodeon|nick jr|o reino infantil|oggy|padrinhos|pokemon|popeye|smurfs|super onze|teletubbies|turma da m[oô]nica|yu-gi-oh|desenhos/i.test(name)
}

const uniqueBrazilNames = uniqueNames(brazilNames)

export const importedBrazilChannels: ImportedBrazilChannel[] = [
  ...uniqueBrazilNames.map((name, index) => {
    const stream_url = verifiedPublicStreams[name] ?? null
    return {
      id: 'iptv-br-' + (index + 1),
      name,
      kids: isKidsChannel(name),
      stream_url,
      catalog_group: 'Canais brasileiros',
      access_label: stream_url ? 'Transmissão pública identificada' : 'Acesso oficial ainda não verificado',
    }
  }),
  ...plutoNames.map((name, index) => ({
    id: 'iptv-pluto-br-' + (index + 1),
    name: 'Pluto TV — ' + name,
    kids: isKidsChannel(name),
    stream_url: 'https://pluto.tv/br/watch/live-tv/',
    catalog_group: 'Pluto TV',
    access_label: 'Abrir catálogo oficial da Pluto TV',
  })),
  ...samsungNames.map((name, index) => ({
    id: 'iptv-samsung-br-' + (index + 1),
    name,
    kids: false,
    stream_url: 'https://www.samsung.com/br/tvs/smart-tv/samsung-tv-plus/',
    catalog_group: 'Samsung TV Plus',
    access_label: 'Abrir Samsung TV Plus',
  })),
]
