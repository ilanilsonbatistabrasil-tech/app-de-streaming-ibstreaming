-- IB STREAMING: catálogo inicial por plataforma (Brasil, novembro/2026)
-- Insere metadados de títulos e associa às plataformas.
-- Não cadastra vídeos, URLs de reprodução ou licenças de exibição.
-- Execute no Supabase SQL Editor após revisar a disponibilidade de cada título.

begin;

create temporary table ib_catalog_seed (
  title text not null,
  type text not null,
  genre text not null,
  age integer not null,
  year integer not null,
  service_slug text not null
) on commit drop;

insert into ib_catalog_seed (title, type, genre, age, year, service_slug) values
  ('Black Doves — 2ª temporada', 'serie', 'Suspense, espionagem', 16, 2026, 'netflix'),
  ('Os 12 Signos de Valentina', 'serie', 'Comédia, romance', 12, 2026, 'netflix'),
  ('Vicentina Pede Desculpas', 'filme', 'Drama, comédia', 12, 2026, 'netflix'),
  ('Campus Drivers', 'serie', 'Comédia, romance', 16, 2026, 'prime-video'),
  ('O Senhor dos Anéis: Os Anéis de Poder — 3ª temporada', 'serie', 'Fantasia, aventura', 14, 2026, 'prime-video'),
  ('Obsessão', 'filme', 'Terror, suspense', 16, 2026, 'prime-video'),
  ('A Idade Dourada — 4ª temporada', 'serie', 'Drama histórico', 14, 2026, 'hbo-max'),
  ('Cidade de Deus: A Luta Não Para — 2ª temporada', 'serie', 'Drama, crime', 18, 2026, 'hbo-max'),
  ('Aeroporto: Área Restrita — 8ª temporada', 'serie', 'Documentário, reality', 10, 2026, 'hbo-max'),
  ('Percy Jackson e os Olimpianos — 3ª temporada', 'serie', 'Fantasia, aventura', 10, 2026, 'disney-plus'),
  ('Tudo é Justo — 2ª temporada', 'serie', 'Drama', 16, 2026, 'disney-plus'),
  ('A Imperatriz se Casou Novamente', 'serie', 'Drama, romance', 12, 2026, 'disney-plus'),
  ('Stick — 2ª temporada', 'serie', 'Comédia, esporte', 12, 2026, 'apple-tv-plus'),
  ('12 12 12', 'filme', 'Suspense, ação', 16, 2026, 'apple-tv-plus'),
  ('A Arte de Ser Heumann', 'filme', 'Drama, biografia', 10, 2026, 'apple-tv-plus'),
  ('Yellowjackets — 4ª temporada', 'serie', 'Suspense, drama', 18, 2026, 'paramount-plus'),
  ('It Gets Worse', 'filme', 'Comédia, drama', 16, 2026, 'paramount-plus'),
  ('Pessoas Normais', 'serie', 'Drama, romance', 16, 2026, 'paramount-plus');

-- Preserva títulos existentes: só insere combinações ainda ausentes.
insert into public.titles (title, type, genre, age, year)
select s.title, s.type, s.genre, s.age, s.year
from ib_catalog_seed s
where not exists (
  select 1 from public.titles t
  where lower(t.title) = lower(s.title) and t.year = s.year
);

-- Libera a exibição do registro no catálogo do app para a região BR.
-- Isso NÃO concede direitos autorais nem adiciona vídeo/reprodução.
insert into public.title_rights (title_id, regions, starts_on, ends_on, min_plan)
select t.id, array['BR']::text[], current_date, date '2099-12-31', 'free'
from ib_catalog_seed s
join public.titles t
  on lower(t.title) = lower(s.title) and t.year = s.year
where not exists (
  select 1 from public.title_rights r where r.title_id = t.id
);

-- Associa cada registro à plataforma correspondente, sem duplicar vínculos.
insert into public.title_streaming_services (title_id, service_id)
select t.id, ss.id
from ib_catalog_seed s
join public.titles t
  on lower(t.title) = lower(s.title) and t.year = s.year
join public.streaming_services ss on ss.slug = s.service_slug
on conflict (title_id, service_id) do nothing;

commit;
