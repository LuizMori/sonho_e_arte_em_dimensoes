import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { contatoInfo } from "@/data/institucional";

const ATUALIZADO_EM = "25 de agosto de 2026";

const secoes = [
  {
    titulo: "1. Quem somos",
    paragrafos: [
      "A Sonho e Arte em Dimensões é a controladora dos dados pessoais tratados através deste site, nos termos da Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD).",
      `Dúvidas ou solicitações sobre esta política podem ser enviadas para ${contatoInfo.email}.`,
    ],
  },
  {
    titulo: "2. Quais dados coletamos",
    paragrafos: [
      "Coletamos apenas os dados necessários para operar a loja e atender quem entra em contato conosco:",
    ],
    lista: [
      "Cadastro de conta: nome e e-mail.",
      "Compra (checkout): nome, e-mail, telefone e endereço completo de entrega (CEP, rua, número, complemento, bairro, cidade, estado), usados para processar o pedido, calcular o frete e enviar a peça.",
      "Orçamento e contato: nome, e-mail, WhatsApp e o conteúdo da mensagem ou do projeto enviado.",
      "Depoimentos: nome, texto e nota, enviados voluntariamente para publicação no site.",
      "Navegação: um identificador de sessão anônimo e a página visitada, usados só para saber quantas visitas o site recebe — sem cookies de rastreamento de terceiros e sem dado que identifique você pessoalmente.",
    ],
  },
  {
    titulo: "3. Por que tratamos esses dados",
    paragrafos: ["Usamos os dados acima para:"],
    lista: [
      "Criar e gerenciar sua conta;",
      "Processar pedidos, calcular frete e enviar as peças ao endereço informado;",
      "Responder pedidos de orçamento e mensagens de contato;",
      "Publicar depoimentos que você mesmo enviou, após aprovação;",
      "Entender o volume de visitas ao site, de forma agregada.",
    ],
  },
  {
    titulo: "4. Base legal",
    paragrafos: [
      "O tratamento de dados de cadastro, checkout, orçamento e contato tem como base a execução de contrato ou de procedimentos preliminares a um contrato (art. 7º, V, da LGPD) — sem esses dados não conseguimos entregar o pedido ou responder à solicitação.",
      "O envio de depoimentos é tratado com base no seu consentimento (art. 7º, I), dado no momento do envio do formulário, já que o nome e o texto ficam publicamente visíveis no site após aprovação.",
    ],
  },
  {
    titulo: "5. Com quem compartilhamos",
    paragrafos: [
      "Não vendemos nem alugamos seus dados. Compartilhamos apenas com prestadores de serviço estritamente necessários para operar a loja, cada um atuando como operador dos dados que recebe:",
    ],
    lista: [
      "Supabase — hospedagem do banco de dados e autenticação de contas.",
      "Vercel — hospedagem do site.",
      "Mercado Pago — processamento de pagamentos (nenhum dado de cartão passa pelos nossos servidores).",
      "Melhor Envio — cálculo e emissão de frete.",
      "Resend — envio de e-mails transacionais (confirmações e notificações de pedido).",
    ],
  },
  {
    titulo: "6. Por quanto tempo guardamos",
    paragrafos: [
      "Dados de conta e de pedidos são mantidos enquanto sua conta existir ou pelo prazo necessário para cumprir obrigações fiscais e legais. Mensagens de contato e orçamento são mantidas pelo tempo necessário para o atendimento. Você pode solicitar a exclusão a qualquer momento, conforme a seção 8.",
    ],
  },
  {
    titulo: "7. Como protegemos seus dados",
    paragrafos: [
      "O acesso aos dados é restrito por regras no próprio banco de dados: cada cliente só enxerga seus próprios pedidos e informações, e apenas a administração da loja tem acesso ao histórico completo, sempre autenticada. Senhas nunca são armazenadas em texto simples — o cadastro e login são gerenciados pelo Supabase Auth.",
    ],
  },
  {
    titulo: "8. Seus direitos",
    paragrafos: [
      "Como titular dos dados, você pode solicitar a qualquer momento, gratuitamente:",
    ],
    lista: [
      "Confirmação de que tratamos seus dados e acesso a eles;",
      "Correção de dados incompletos, inexatos ou desatualizados;",
      "Exclusão dos seus dados, exceto quando a lei exigir sua conservação (ex: notas fiscais);",
      "Portabilidade dos seus dados a outro fornecedor;",
      "Informação sobre com quem compartilhamos seus dados.",
    ],
    rodape: `Para exercer qualquer um desses direitos, envie um e-mail para ${contatoInfo.email}. Respondemos em até 15 dias.`,
  },
  {
    titulo: "9. Alterações desta política",
    paragrafos: [
      "Podemos atualizar esta política quando necessário. A data da última atualização está sempre indicada no topo desta página.",
    ],
  },
];

export function Privacidade() {
  usePageMeta(
    "Política de Privacidade | Sonho e Arte em Dimensões",
    "Saiba quais dados a Sonho e Arte em Dimensões coleta, como usa, com quem compartilha e como exercer seus direitos, conforme a LGPD."
  );

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container max-w-3xl">
        <Reveal className="mb-14">
          <p className="label-caps text-magenta mb-6">Privacidade</p>
          <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">
            Política de Privacidade
          </h1>
          <p className="label-caps text-navy/50 mt-4">Última atualização: {ATUALIZADO_EM}</p>
        </Reveal>

        <div className="space-y-14">
          {secoes.map((secao, index) => (
            <Reveal key={secao.titulo} delay={Math.min(index, 5) * 40}>
              <h2 className="font-display text-2xl sm:text-3xl text-navy mb-4">{secao.titulo}</h2>
              <div className="space-y-4">
                {secao.paragrafos.map((paragrafo) => (
                  <p key={paragrafo} className="text-navy/80 leading-relaxed">
                    {paragrafo}
                  </p>
                ))}
                {secao.lista && (
                  <ul className="space-y-2 pl-5 list-disc marker:text-magenta">
                    {secao.lista.map((item) => (
                      <li key={item} className="text-navy/80 leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {secao.rodape && <p className="text-navy/80 leading-relaxed">{secao.rodape}</p>}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
