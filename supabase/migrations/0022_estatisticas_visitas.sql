-- A tela /admin/visitas buscava todas as linhas cruas de page_views dos últimos 30 dias
-- e agregava no client. Com o volume de visitas crescendo, isso passou a estourar o
-- limite padrão de 1000 linhas por consulta do PostgREST: em ordem crescente de data,
-- as 1000 linhas mais antigas da janela "engoliam" o limite e as visitas mais recentes
-- (de hoje) ficavam de fora do resultado, fazendo o contador de "hoje" aparecer zerado
-- mesmo com visitas reais registradas no banco.
--
-- A correção é agregar direto no banco (group by), que devolve poucas linhas (uma por
-- dia, ou uma por página) em vez de uma por visualização — não tem mais limite de linha
-- para estourar, e o payload trafegado fica muito menor. Como são "language sql" sem
-- security definer, herdam a RLS de page_views (só admin enxerga linhas), então o
-- controle de acesso continua igual ao que já existia.

create or replace function public.estatisticas_visitas_por_dia(p_dias integer default 30)
returns table (
  dia date,
  visualizacoes bigint,
  visitantes bigint
)
language sql
stable
as $$
  select
    (created_at at time zone 'America/Sao_Paulo')::date as dia,
    count(*)::bigint as visualizacoes,
    count(distinct session_id)::bigint as visitantes
  from public.page_views
  where created_at >= now() - (p_dias || ' days')::interval
  group by 1
  order by 1;
$$;

create or replace function public.estatisticas_visitas_por_pagina(p_dias integer default 30)
returns table (
  path text,
  visualizacoes bigint
)
language sql
stable
as $$
  select path, count(*)::bigint as visualizacoes
  from public.page_views
  where created_at >= now() - (p_dias || ' days')::interval
  group by path
  order by visualizacoes desc;
$$;
