-- Cor visual (hex) opcional por cor da paleta. Sem isso, a única forma de saber qual cor
-- uma letra da Charm Mania está usando é o nome em texto — o pedido foi poder ver a cor de
-- verdade na conta da letra, não só ler o nome. Nullable: cores já cadastradas continuam
-- funcionando normalmente (mostram só o nome) até o admin preencher o hex.

alter table public.colors add column hex text;
