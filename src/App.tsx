import { Routes, Route } from "react-router-dom";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/lib/AuthProvider";
import { CartProvider } from "@/lib/CartProvider";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Layout } from "@/components/Layout";
import { RequireAuth } from "@/components/RequireAuth";
import { RequireAdmin } from "@/components/RequireAdmin";
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
import { Login } from "@/pages/Login";
import { Cadastro } from "@/pages/Cadastro";
import { EsqueciSenha } from "@/pages/EsqueciSenha";
import { RedefinirSenha } from "@/pages/RedefinirSenha";
import { Conta } from "@/pages/Conta";
import { Carrinho } from "@/pages/Carrinho";
import { Checkout } from "@/pages/Checkout";
import { AdminProdutos } from "@/pages/admin/AdminProdutos";
import { AdminProdutoForm } from "@/pages/admin/AdminProdutoForm";
import { NotFound } from "@/pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
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
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/esqueci-senha" element={<EsqueciSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route
              path="/conta"
              element={
                <RequireAuth>
                  <Conta />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/produtos"
              element={
                <RequireAdmin>
                  <AdminProdutos />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/produtos/novo"
              element={
                <RequireAdmin>
                  <AdminProdutoForm />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/produtos/:id"
              element={
                <RequireAdmin>
                  <AdminProdutoForm />
                </RequireAdmin>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
