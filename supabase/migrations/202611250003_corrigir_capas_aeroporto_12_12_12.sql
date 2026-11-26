-- IB STREAMING: corrigir as capas de Aeroporto e 12 12 12.
-- Atualiza exclusivamente poster_url em title_catalog_metadata.
-- As duas URLs abaixo apontam para pôsteres verticais das respectivas produções.
begin;

with capas(titulo, ano, poster_url) as (
  values
    (
      'Aeroporto: Área Restrita — 8ª temporada',
      2026,
      'https://media.fstatic.com/iGuybbmMvuTw4re2qlUA4_r-xv4=/350x525/smart/filters:format(webp)/media/movies/covers/2026/11/cats_jXD2VjN.png'
    ),
    (
      '12 12 12',
      2026,
      'https://br.web.img3.acsta.net/c_310_420/img/54/19/54196906edeacfb32125a8fee70d1c9e.jpg'
    )
)
update public.title_catalog_metadata m
set poster_url = c.poster_url,
    updated_at = now()
from public.titles t
join capas c
  on lower(trim(t.title)) = lower(trim(c.titulo))
 and t.year = c.ano
where m.title_id = t.id;

commit;
