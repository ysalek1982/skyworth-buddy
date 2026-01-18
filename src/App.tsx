import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Vendedores pages (separate context)
const VendedoresHome = lazy(() => import("./pages/vendedores/VendedoresHome"));
const VendedoresLogin = lazy(() => import("./pages/vendedores/VendedoresLogin"));
const VendedoresRegistro = lazy(() => import("./pages/vendedores/VendedoresRegistro"));
const VendedoresDashboard = lazy(() => import("./pages/vendedores/VendedoresDashboard"));
const VendedoresRanking = lazy(() => import("./pages/vendedores/VendedoresRanking"));
const VendedoresResultados = lazy(() => import("./pages/vendedores/VendedoresResultados"));

// Admin
const Admin = lazy(() => import("./pages/Admin"));

// Legacy routes (redirect)
const Login = lazy(() => import("./pages/Login"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-foreground">Cargando...</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public route - ONLY landing page */}
              <Route path="/" element={<Index />} />

              {/* Vendedores routes - separate context */}
              <Route path="/vendedores" element={<VendedoresHome />} />
              <Route path="/vendedores/login" element={<VendedoresLogin />} />
              <Route path="/vendedores/registro" element={<VendedoresRegistro />} />
              <Route path="/vendedores/dashboard" element={<VendedoresDashboard />} />
              <Route path="/vendedores/ranking" element={<VendedoresRanking />} />
              <Route path="/vendedores/resultados" element={<VendedoresResultados />} />

              {/* Legacy login redirect */}
              <Route path="/login" element={<Login />} />

              {/* Protected admin routes */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Admin />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
