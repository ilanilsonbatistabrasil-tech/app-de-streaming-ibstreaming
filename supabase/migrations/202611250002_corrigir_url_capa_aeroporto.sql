-- IB STREAMING: corrige o endereço da capa da 8ª temporada de Aeroporto.
-- Usa o endereço canônico da imagem do pôster confirmado na página do Filmow.
-- Atualiza somente poster_url; não altera título, sinopse, plataforma ou classificação.
begin;

update public.title_catalog_metadata m
set poster_url = 'https://media.fstatic.com/iGuybbmMvuTw4re2qlUA4_r-xv4=/350x525/smart/filters:format(webp)/media/movies/covers/2026/11/cats_jXD2VjN.png',
    updated_at = now()
from public.titles t
where t.id = m.title_id
  and lower(trim(t.title)) = lower(trim('Aeroporto: Área Restrita — 8ª temporada'))
  and t.year = 2026;

commit;
