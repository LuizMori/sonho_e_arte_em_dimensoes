import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

interface NotifyRestockPayload {
  productId: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido" });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados");
    res.status(500).json({ error: "Serviço não configurado" });
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "É necessário estar autenticado" });
    return;
  }

  const payload = req.body as NotifyRestockPayload;
  const productId = payload?.productId;
  if (!productId) {
    res.status(400).json({ error: "Informe o produto" });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    res.status(401).json({ error: "Sessão inválida, faça login novamente" });
    return;
  }

  const { data: perfil } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (perfil?.role !== "admin") {
    res.status(403).json({ error: "Apenas administradores podem disparar este aviso" });
    return;
  }

  try {
    const { data: produto } = await supabase
      .from("products")
      .select("nome, slug")
      .eq("id", productId)
      .maybeSingle();

    if (!produto) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }

    const { data: pendentes } = await supabase
      .from("stock_notifications")
      .select("id, email")
      .eq("product_id", productId)
      .eq("notificado", false);

    if (!pendentes || pendentes.length === 0) {
      res.status(200).json({ ok: true, notificados: 0 });
      return;
    }

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const linkProduto = `https://www.sonhoearte3d.com.br/portfolio/${produto.slug}`;

      await Promise.all(
        pendentes.map((linha) =>
          resend.emails
            .send({
              from: "Sonho e Arte em Dimensões <pedidos@sonhoearte3d.com.br>",
              to: linha.email,
              subject: `${produto.nome} está de volta ao estoque!`,
              text: `Boas notícias! O produto "${produto.nome}", que você pediu para ser avisado, já está disponível de novo.\n\nVeja e compre por aqui: ${linkProduto}\n\nSonho e Arte em Dimensões`,
            })
            .catch((err) => {
              console.error(`Erro ao enviar aviso de estoque para ${linha.email}:`, err);
            })
        )
      );
    }

    const { error: updateError } = await supabase
      .from("stock_notifications")
      .update({ notificado: true })
      .in(
        "id",
        pendentes.map((linha) => linha.id)
      );

    if (updateError) throw updateError;

    res.status(200).json({ ok: true, notificados: pendentes.length });
  } catch (err) {
    console.error("Erro ao processar aviso de reposição de estoque:", err);
    res.status(500).json({ ok: false, error: "Não foi possível enviar os avisos" });
  }
}
