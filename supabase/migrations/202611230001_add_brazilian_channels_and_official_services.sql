-- IBStreaming: canais brasileiros e atalhos para plataformas oficiais.
-- Esta migration apenas cadastra URLs públicas oficiais; não extrai nem replica streams protegidos.
-- Serviços de assinatura abrem o site oficial e exigem login/assinatura do usuário.

insert into public.channels (id, name, kids, stream_url)
select gen_random_uuid(), source.name, source.kids, source.stream_url
from (values
  ('TV Aparecida', false, 'https://www.a12.com/tv/tv-ao-vivo/'),
  ('RedeTV! Ao Vivo', false, 'https://www.redetv.uol.com.br/aovivo'),
  ('Netflix', false, 'https://www.netflix.com/br/'),
  ('Max (HBO)', false, 'https://www.max.com/br/pt'),
  ('Disney+', false, 'https://www.disneyplus.com/pt-br'),
  ('ESPN Brasil', false, 'https://www.espn.com.br/'),
  ('beIN SPORTS', false, 'https://www.beinsports.com/'),
  ('Globoplay', false, 'https://globoplay.globo.com/'),
  ('Prime Video', false, 'https://www.primevideo.com/'),
  ('Paramount+', false, 'https://www.paramountplus.com/br/'),
  ('Apple TV', false, 'https://tv.apple.com/br')
) as source(name, kids, stream_url)
where not exists (
  select 1
  from public.channels existing
  where lower(trim(existing.name)) = lower(trim(source.name))
);
