import { z } from "zod";

export const TAMANHO_MAXIMO_ARQUIVO = 3 * 1024 * 1024; // 3MB

export const orcamentoSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome completo"),
  email: z.string().trim().email("Informe um e-mail válido"),
  whatsapp: z.string().trim().min(8, "Informe um número de celular ou WhatsApp válido"),
  tipoProjeto: z.string().min(1, "Selecione o tipo de projeto"),
  quantidade: z.string().trim().min(1, "Informe a quantidade desejada"),
  possuiArquivo: z.enum(["sim", "nao"], { required_error: "Selecione uma opção" }),
  arquivo: z
    .instanceof(FileList)
    .optional()
    .refine((files) => !files || files.length === 0 || files[0].size <= TAMANHO_MAXIMO_ARQUIVO, {
      message: "O arquivo deve ter no máximo 3MB",
    }),
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

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido"),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe seu nome completo"),
    email: z.string().trim().email("Informe um e-mail válido"),
    senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmarSenha: z.string().min(6, "Confirme sua senha"),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmarSenha: z.string().min(6, "Confirme sua senha"),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
