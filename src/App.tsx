import { Routes, Route } from "react-router-dom";
import { ToastProvider } from "@/components/ui/Toast";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Layout } from "@/components/Layout";
import { Home } from "@/pages/Home";
import { Sobre } from "@/pages/Sobre";
import { Portfolio } from "@/pages/Portfolio";
import { ProjectDetail } from "@/pages/ProjectDetail";
import { Servicos } from "@/pages/Servicos";
import { ComoFunciona } from "@/pages/ComoFunciona";
import { Orcamento } from "@/pages/Orcamento";
import { Blog } from "@/pages/Blog";
import { BlogPost } from "@/pages/BlogPost";
import { Contato } from "@/pages/Contato";
import { NotFound } from "@/pages/NotFound";

function App() {
  return (
    <ToastProvider>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:slug" element={<ProjectDetail />} />
          <Route path="/servicos" element={<Servicos />} />
          <Route path="/como-funciona" element={<ComoFunciona />} />
          <Route path="/orcamento" element={<Orcamento />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </ToastProvider>
  );
}

export default App;
