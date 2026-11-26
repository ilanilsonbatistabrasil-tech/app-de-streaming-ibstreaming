-- IB STREAMING: corrigir capas ausentes do catálogo (somente poster_url).
-- Não altera títulos, sinopses, plataformas, direitos ou links de reprodução.
begin;

with capas(titulo, poster_url) as (
  values
    ('Vicentina Pede Desculpas', 'https://images.ctfassets.net/4cd45et68cgf/1uIdMmbelcamPBs0JkiD60/d82cd87b283dfb4ee204f0287227bb44/pt_br_vicentina_pede_desculpas_main_festivals_-_journey_4_x_5__v__1080px1350p_rgb_theatricalprepre_1.jpg?w=2000'),
    ('A Imperatriz se Casou Novamente', 'https://lumiere-a.akamaihd.net/v1/images/imperatriz_1cb19df2.png?region=0%2C0%2C378%2C473'),
    ('Pessoas Normais', 'https://cdn.ome.lt/images/tv/89905/poster/pt.webp'),
    ('Campus Drivers', 'https://images.rivr.app/posters/1000/51114.jpg'),
    ('A Arte de Ser Heumann', 'https://dx35vtwkllhj9.cloudfront.net/apple/being-heumann/images/regions/us/onesheet.jpg'),
    ('Yellowjackets — 4ª temporada', 'https://images.justwatch.com/poster/326187641/s718/season-4.jpg')
)
update public.title_catalog_metadata m
set poster_url = c.poster_url,
    updated_at = now()
from public.titles t
join capas c on lower(trim(t.title)) = lower(trim(c.titulo))
where m.title_id = t.id
  and (m.poster_url is null or btrim(m.poster_url) = '');

commit;
