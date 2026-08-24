import { z } from "zod";

export const orcamentoSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome completo"),
  email: z.string().trim().email("Informe um e-mail válido"),
  whatsapp: z.string().trim().min(8, "Informe um número de WhatsApp válido"),
  tipoProjeto: z.string().min(1, "Selecione o tipo de projeto"),
  quantidade: z.string().trim().min(1, "Informe a quantidade desejada"),
  material: z.string().trim().min(1, "Informe o material desejado, se souber"),
  cor: z.string().trim().min(1, "Informe a cor desejada, se souber"),
  tamanho: z.string().trim().min(1, "Informe o tamanho aproximado"),
  possuiArquivo: z.enum(["sim", "nao"], { required_error: "Selecione uma opção" }),
  arquivo: z.instanceof(FileList).optional(),
  observacoes: z.string().trim().optional(),
});

export type OrcamentoFormData = z.infer<typeof orcamentoSchema>;

export const contatoSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome completo"),
  email: z.string().trim().email("Informe um e-mail válido"),
  whatsapp: z.string().trim().min(8, "Informe um número de WhatsApp válido"),
  assunto: z.string().trim().min(2, "Informe o assunto da mensagem"),
  mensagem: z.string().trim().min(10, "Escreva uma mensagem com pelo menos 10 caracteres"),
});

export type ContatoFormData = z.infer<typeof contatoSchema>;
