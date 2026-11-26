-- IB STREAMING: ampliar catálogo com pôsteres e sinopses (Brasil, novembro/2026)
-- Metadados editoriais e capas; não cadastra mídia, links de reprodução ou licenças.
begin;

create table if not exists public.title_catalog_metadata (
  title_id bigint primary key references public.titles(id) on delete cascade,
  synopsis text,
  poster_url text,
  updated_at timestamptz not null default now()
);

alter table public.title_catalog_metadata enable row level security;

grant select, insert, update, delete on public.title_catalog_metadata to authenticated;

drop policy if exists "Authenticated users can read title catalog metadata" on public.title_catalog_metadata;
create policy "Authenticated users can read title catalog metadata"
  on public.title_catalog_metadata for select to authenticated using (true);

drop policy if exists "Admins manage title catalog metadata" on public.title_catalog_metadata;
create policy "Admins manage title catalog metadata"
  on public.title_catalog_metadata for all to authenticated
  using (exists (select 1 from public.accounts a where a.id = auth.uid() and a.role = 'admin'))
  with check (exists (select 1 from public.accounts a where a.id = auth.uid() and a.role = 'admin'));

create temporary table ib_catalog_enrichment (
  title text not null,
  type text not null,
  genre text not null,
  age integer not null,
  year integer not null,
  service_slug text not null,
  synopsis text not null,
  poster_url text
) on commit drop;

insert into ib_catalog_enrichment (title,type,genre,age,year,service_slug,synopsis,poster_url) values
-- Títulos que já estavam no catálogo: agora recebem capa e sinopse.
('Black Doves — 2ª temporada','serie','Ação, mistério, crime',16,2026,'netflix','Após a morte de seu amante, uma espiã infiltrada como esposa de um político busca a verdade e vingança com a ajuda de um amigo assassino.','https://image.tmdb.org/t/p/w500/79W18euAuGY6BnL6sPxRUoZcCIK.jpg'),
('A Idade Dourada — 4ª temporada','serie','Drama histórico',14,2026,'hbo-max','Na Nova York de 1882, Marian Brook chega a uma cidade em transformação, onde famílias tradicionais e novos milionários disputam prestígio e influência.','https://image.tmdb.org/t/p/w500/9o2AsYUGahwHFrler8NGEwFBiBj.jpg'),
('Cidade de Deus: A Luta Não Para — 2ª temporada','serie','Crime, drama',18,2026,'hbo-max','No início dos anos 2000, a saída de um jovem traficante da prisão reacende a disputa na Cidade de Deus. Moradores tentam romper o ciclo de violência e enfrentar os grupos que controlam a comunidade.','https://image.tmdb.org/t/p/w500/bROpzy08O9nSyfDgBUlgUoMp9nw.jpg'),
('O Senhor dos Anéis: Os Anéis de Poder — 3ª temporada','serie','Fantasia, aventura',14,2026,'prime-video','Em uma era de relativa paz, diferentes povos da Terra-média enfrentam o ressurgimento do mal e acontecimentos que moldarão o destino dos reinos.','https://image.tmdb.org/t/p/w500/8FPCnfOftiLTHg5wnJxVdtlF8EN.jpg'),
('Obsessão','filme','Terror, suspense',16,2026,'prime-video','Um romântico incurável encontra um objeto misterioso que promete realizar desejos. Quando seu pedido se concretiza, ele descobre que o presente tem consequências assustadoras.','https://image.tmdb.org/t/p/w500/wUc6IDf5ChjM1UyQye21qFBeJY0.jpg'),
('Percy Jackson e os Olimpianos — 3ª temporada','serie','Fantasia, aventura',10,2026,'disney-plus','Percy parte em uma missão perigosa para devolver o raio-mestre de Zeus e impedir uma guerra entre os deuses, contando com a ajuda de Annabeth e Grover.','https://image.tmdb.org/t/p/w500/i30zp0HtZ7FicUn065xrhnYKN90.jpg'),
('Stick — 2ª temporada','serie','Comédia, esporte',12,2026,'apple-tv-plus','Pryce Cahill, um ex-golfista cuja carreira foi interrompida por uma crise, aposta em treinar um jovem talento e reconstruir a própria vida.','https://image.tmdb.org/t/p/w500/D7cxWHBj769OYsX9jpx9eb2Y9q.jpg'),
('Tudo é Justo — 2ª temporada','serie','Drama, comédia',16,2026,'disney-plus','Um grupo de advogadas deixa um escritório dominado por homens para abrir sua própria firma, enfrentando separações milionárias, segredos e disputas pessoais.','https://image.tmdb.org/t/p/w500/jZIMiQF49Rf645Wvs3ORRy8KlDL.jpg'),
('Blade Runner 2099','serie','Ficção científica, suspense',16,2026,'prime-video','Cinquenta anos após Blade Runner 2049, uma fugitiva assume uma nova identidade e se une a uma replicante em uma investigação que ameaça o equilíbrio de Los Angeles.','https://image.tmdb.org/t/p/w500/8Huo5JEmtKV03VTzq50lYVDbD4N.jpg'),
('Awkwafina — A Cozinheira Improvável','documentario','Documentário, gastronomia',10,2026,'apple-tv-plus','A atriz Awkwafina embarca em uma jornada para aprender a cozinhar e tentar reabrir o restaurante chinês de sua família.','https://image.tmdb.org/t/p/w500/yeRnk4GaOJHaQo2gFlOxgUy3QAU.jpg'),
('Bob Esponja — 18ª temporada','serie','Animação, comédia, família',0,2026,'netflix','Bob Esponja e seus amigos da Fenda do Biquíni vivem novas confusões no fundo do oceano.','https://image.tmdb.org/t/p/w500/yXrtQINkVRyNmfUQFyVG2LuoTqm.jpg'),

-- Novos títulos adicionados ao catálogo de novembro/2026.
('O Natal Perfeito de um Cachorro','filme','Comédia, drama, família',10,2026,'netflix','Quando uma emergência médica separa a família Goss, o cãozinho Winstead faz de tudo para reunir seus humanos antes da véspera de Natal.','https://image.tmdb.org/t/p/w500/2YhgEEGYOQfl3CzoRcYys8b6JxH.jpg'),
('Minha Melhor Amiga','filme','Comédia',12,2026,'netflix','Júlia e Clara, melhores amigas na faixa dos 50 anos, decidem sair da rotina e viajar pela Europa para surpreender as filhas, mas a jornada reserva imprevistos.','https://image.tmdb.org/t/p/w500/wGfTFVeguXDXYrwPQ8QMFsaSK2M.jpg'),
('Bass ex Machina','serie','Animação, ficção científica, faroeste',14,2026,'netflix','Em uma versão steampunk do Velho Oeste, dominada por máquinas e forças sobrenaturais, um pai precisa proteger sua família.','https://image.tmdb.org/t/p/w500/y9c1AwrldWRsY9edSf21cOgbI0h.jpg'),
('Um Ano de Vida, Compre um Homem','filme','Romance, drama',16,2026,'netflix','Após receber um diagnóstico que muda seus planos, Yui conhece Sena, um anfitrião endividado. A relação inesperada transforma a maneira como ambos enxergam a vida.','https://image.tmdb.org/t/p/w500/fNYUEhXilEBouvcPnnVxkJgTxlF.jpg'),
('Mike Tyson: Return of the Mike','documentario','Comédia, documentário',16,2026,'netflix','O ex-campeão dos pesos pesados retorna aos palcos em um especial solo de comédia, compartilhando histórias marcantes de sua vida.','https://image.tmdb.org/t/p/w500/uaeL5BLgmGhIZXfViBsLSnvYB4i.jpg'),
('Tesouros do Coração','filme','Romance, drama',10,2023,'prime-video','Uma mergulhadora devolve um anel encontrado no mar ao seu dono, um militar da Marinha, e passa a descobrir o que realmente importa em sua vida.','https://image.tmdb.org/t/p/w500/abFxxzAXq7pGhYYoe5DdruXEzGa.jpg'),
('Um Corpo no Sótão','filme','Suspense, drama',16,2023,'prime-video','Uma mulher encontra o amante morto no sótão de sua casa e passa a suspeitar que o marido sabe mais do que revela.','https://image.tmdb.org/t/p/w500/xl4Sf5zwkvE4vvPVJgQcXFmXHqi.jpg'),
('Os Segredos do Universo por Aristóteles e Dante','filme','Drama, romance',12,2023,'disney-plus','Em 1987, dois adolescentes desenvolvem uma amizade profunda enquanto enfrentam questões de identidade, família e pertencimento.','https://image.tmdb.org/t/p/w500/dqcBfSI8fh06qY07VYDRSDjx7pC.jpg'),
('O Hóspede Oculto','filme','Crime, drama, mistério',16,2026,'hbo-max','Uma investigação criminal cheia de reviravoltas coloca em dúvida a versão dos envolvidos e a identidade de quem realmente conhece a verdade.','https://image.tmdb.org/t/p/w500/7yFL3n0SFHby9ntBEj8roU2dcRC.jpg'),
('O Clube do Pé Esquerdo','filme','Comédia',12,2026,'netflix','Cansado da rotina, um homem de meia-idade começa aulas de dança e acaba provocando uma sequência de confusões em casa.','https://image.tmdb.org/t/p/w500/hhCVXNeTXXxMdh30GKaU4bSLdt1.jpg'),
('Alta Gama: O Caso dos Relógios','documentario','Documentário, crime',12,2026,'netflix','Um documentário sobre um conhecido caso policial chileno acompanha a ascensão e a queda de um império de contrabando de joias.','https://image.tmdb.org/t/p/w500/AjTISUPCrq5HnOEfySxtoUn4d3i.jpg');

-- Insere apenas os novos registros, sem duplicar o catálogo existente.
insert into public.titles (title,type,genre,age,year)
select s.title,s.type,s.genre,s.age,s.year
from ib_catalog_enrichment s
where not exists (
  select 1 from public.titles t
  where lower(t.title)=lower(s.title) and t.year=s.year
);

-- Mantém os títulos visíveis para a região BR, sem representar licença de reprodução.
insert into public.title_rights (title_id,regions,starts_on,ends_on,min_plan)
select t.id,array['BR']::text[],case when s.title = 'Bob Esponja — 18ª temporada' then date '2026-11-27' else current_date end,date '2099-12-31','free'
from ib_catalog_enrichment s
join public.titles t on lower(t.title)=lower(s.title) and t.year=s.year
where not exists (select 1 from public.title_rights r where r.title_id=t.id);

insert into public.title_streaming_services (title_id,service_id)
select t.id,ss.id
from ib_catalog_enrichment s
join public.titles t on lower(t.title)=lower(s.title) and t.year=s.year
join public.streaming_services ss on ss.slug=s.service_slug
on conflict (title_id,service_id) do nothing;

insert into public.title_catalog_metadata (title_id,synopsis,poster_url,updated_at)
select t.id,s.synopsis,s.poster_url,now()
from ib_catalog_enrichment s
join public.titles t on lower(t.title)=lower(s.title) and t.year=s.year
on conflict (title_id) do update
set synopsis=excluded.synopsis,poster_url=excluded.poster_url,updated_at=now();

commit;
