import { supabase } from "@/lib/supabaseClient";

const BUCKET_PRODUTOS = "product-images";
const BUCKET_DEPOIMENTOS = "testimonial-images";

export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const extensao = file.name.split(".").pop() ?? "jpg";
  const caminho = `${productId}/${crypto.randomUUID()}.${extensao}`;

  const { error } = await supabase.storage.from(BUCKET_PRODUTOS).upload(caminho, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET_PRODUTOS).getPublicUrl(caminho);
  return data.publicUrl;
}

export async function uploadTestimonialImage(file: File): Promise<string> {
  const extensao = file.name.split(".").pop() ?? "jpg";
  const caminho = `${crypto.randomUUID()}.${extensao}`;

  const { error } = await supabase.storage.from(BUCKET_DEPOIMENTOS).upload(caminho, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET_DEPOIMENTOS).getPublicUrl(caminho);
  return data.publicUrl;
}
