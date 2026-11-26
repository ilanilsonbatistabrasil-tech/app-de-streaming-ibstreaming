-- IB STREAMING: adiciona o pôster oficial/editorial de 12 12 12 (2026).
-- Altera somente poster_url; preserva sinopse e os demais dados do catálogo.
begin;

insert into public.title_catalog_metadata (title_id, poster_url, updated_at)
select t.id,
       'https://br.web.img3.acsta.net/c_310_420/img/54/19/54196906edeacfb32125a8fee70d1c9e.jpg',
       now()
from public.titles t
where lower(trim(t.title)) = lower(trim('12 12 12'))
  and t.year = 2026
on conflict (title_id) do update
set poster_url = excluded.poster_url,
    updated_at = now();

commit;
