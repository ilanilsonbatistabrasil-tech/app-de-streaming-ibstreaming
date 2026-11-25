-- IBStreaming: categorias persistidas para separar corretamente canais e plataformas.
-- Seguro para execução repetida. Não apaga registros, não altera outras tabelas e não muda RLS.
-- Aplicar somente depois de revisar o schema do projeto Supabase.

alter table public.canais
  add column if not exists categoria text not null default 'Variedades';

update public.canais
set categoria = case
  when coalesce("crianças", false)
    or lower(nome) ~ '(kids|infantil|nick jr|baby shark|babyfirst|gloob|bob esponja|turma da monica|desenhos|cartoon)'
    then 'Kids'
  when lower(nome) ~ '(espn|bein|sport|esporte|combate|ufc|mma|fifa|n sports|band sports|sportv|premiere)'
    then 'Esportes'
  when lower(nome) ~ '(telecine|cinema|cine |cine$|movies|filmes|film|netmovies|adrenalina pura)'
    then 'Filmes'
  when lower(nome) ~ '(series|seriados|novelas|novela|sitcom)'
    then 'Séries'
  when lower(nome) ~ '(news|noticias|cnn|jornal|jovem pan|bm&c|globo news|record news|sbt news|euronews|times brasil)'
    then 'Notícias'
  when lower(nome) ~ '(document|nature|natureza|history|historia|discovery|animal|smithsonian|travel|agro|fish tv|viagens|investigacao)'
    then 'Documentários e Natureza'
  when lower(nome) ~ '(music|musica|radio|kpop|stingray|rock|karaoke)'
    then 'Música'
  when lower(coalesce(stream_url, '')) ~ '(netflix|\.max\.com|disneyplus|pluto\.tv|samsung\.com|primevideo|paramountplus|tv\.apple\.com|globoplay)'
    then 'Plataformas'
  when lower(nome) ~ '(tv brasil|tv cultura|tv escola|tv aparecida|rede tv|redetv|tv senado|tv camara|tv justiça|tv justica|canal gov|tv brasil central|tv assembleia|tv legislativa|tv universitaria|tv diario|tv gazeta|tv record|record tv|sbt|globo|band|canal brasil|futura|tv novo tempo|canal rural|tv evangelizar|tv pai eterno)'
    then 'Canais brasileiros'
  else coalesce(nullif(trim(categoria), ''), 'Variedades')
end;

comment on column public.canais.categoria is
  'Categoria editorial do canal no IBStreaming; editável no painel administrativo.';

create index if not exists canais_categoria_nome_idx
  on public.canais (categoria, nome);
