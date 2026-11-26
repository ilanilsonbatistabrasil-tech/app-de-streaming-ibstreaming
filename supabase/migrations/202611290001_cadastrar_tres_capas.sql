-- IB STREAMING: cadastrar capas dos três títulos que ainda estavam sem pôster.
-- Atualiza somente poster_url; preserva sinopses, títulos, serviços e demais dados.
-- Fontes: arte promocional Amazon/Prime Video enviada pelo usuário; poster de Aeroporto
-- publicado no Filmow; poster de Os 12 Signos publicado pelo Séries da TV.
begin;

with capas(titulo, poster_url) as (
  values
    (
      'Os 12 Signos de Valentina',
      'https://www.seriesdatv.pt/wp-content/uploads/2026/10/Os-12-Signos-de-Valentina-poster-netflix-pt.jpg.webp'
    ),
    (
      'Aeroporto: Área Restrita — 8ª temporada',
      'https://media.fstatic.com/iGuybbmMvuTw4re2qlUA4_r-xv4%3D/350x525/smart/filters%3Aformat%28webp%29/media/movies/covers/2026/11/cats_jXD2VjN.png'
    ),
    (
      'It Gets Worse',
      'https://m.media-amazon.com/images/S/pv-target-images/fa41b45f4b5df0dec653cddb20f683cc9b9e31b6f61b5bff90c9662c249bf44f._UR2000%2C3000_CLs%7C2000%2C3000%7C/G/bundle/BottomRightCardGradient2x3.png%2C/G/01/digital/video/merch/subs/benefit-id/a-f/cbsaacf/logos/channels-logo-white-stacked.png%7C0%2C0%2C2000%2C3000%2B0%2C0%2C2000%2C3000%2B1426%2C2798%2C487%2C115_kv4600e6e6b6650a7b1b1d469e8b864fb4_.jpg'
    )
),
titulos_encontrados as (
  select t.id as title_id, c.poster_url
  from public.titles t
  join capas c on lower(trim(t.title)) = lower(trim(c.titulo))
)
insert into public.title_catalog_metadata (title_id, poster_url, updated_at)
select title_id, poster_url, now()
from titulos_encontrados
on conflict (title_id) do update
set poster_url = excluded.poster_url,
    updated_at = now();

commit;
