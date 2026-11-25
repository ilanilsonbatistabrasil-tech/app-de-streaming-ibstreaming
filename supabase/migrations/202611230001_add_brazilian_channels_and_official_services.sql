-- IBStreaming: canais brasileiros e atalhos para plataformas oficiais.
-- Compatível com o schema confirmado no Supabase: public.canais(id text, nome text, crianças boolean, stream_url text).
-- Não remove nem altera registros existentes. Não replica streams protegidos.
-- Plataformas pagas abrem seus sites oficiais e exigem assinatura/login próprios.

insert into public.canais (id, nome, "crianças", stream_url)
select source.id, source.nome, source.kids, source.stream_url
from (values
  ('official-tv-aparecida', 'TV Aparecida', false, 'https://www.a12.com/tv/tv-ao-vivo/'),
  ('official-redetv', 'RedeTV! Ao Vivo', false, 'https://www.redetv.uol.com.br/aovivo'),
  ('official-netflix', 'Netflix', false, 'https://www.netflix.com/br/'),
  ('official-max', 'Max (HBO)', false, 'https://www.max.com/br/pt'),
  ('official-disney-plus', 'Disney+', false, 'https://www.disneyplus.com/pt-br'),
  ('official-espn', 'ESPN Brasil', false, 'https://www.espn.com.br/'),
  ('official-bein', 'beIN SPORTS', false, 'https://www.beinsports.com/'),
  ('official-globoplay', 'Globoplay', false, 'https://globoplay.globo.com/'),
  ('official-prime-video', 'Prime Video', false, 'https://www.primevideo.com/'),
  ('official-paramount-plus', 'Paramount+', false, 'https://www.paramountplus.com/br/'),
  ('official-apple-tv', 'Apple TV', false, 'https://tv.apple.com/br'),
  ('official-pluto-tv', 'Pluto TV (canais gratuitos)', false, 'https://pluto.tv/br/watch/live-tv/'),
  ('official-samsung-tv-plus', 'Samsung TV Plus', false, 'https://www.samsung.com/br/tvs/smart-tv/samsung-tv-plus/')
) as source(id, nome, kids, stream_url)
where not exists (
  select 1
  from public.canais existing
  where lower(trim(existing.nome)) = lower(trim(source.nome))
);
