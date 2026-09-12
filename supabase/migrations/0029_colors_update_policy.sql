-- A tabela colors (0017_cores_produto.sql) nunca teve policy de update — só
-- select/insert/delete, porque até agora só se cadastrava/removia cor, nunca se editava.
-- Com o campo hex (0028_hex_cores.sql) passou a ser preciso editar uma cor já existente,
-- e sem esta policy o update era bloqueado silenciosamente pela RLS (nenhuma linha afetada,
-- sem erro visível no client).

create policy "colors_update_admin" on public.colors for update using (public.is_admin());
