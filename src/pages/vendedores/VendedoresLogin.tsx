import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Store, Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import SellerLayout from "@/components/layout/SellerLayout";

const VendedoresLogin = () => {
  const navigate = useNavigate();
  const { user, signIn, isSeller, rolesLoaded, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Handle redirect after roles are loaded
  useEffect(() => {
    // Only act when authentication is done and roles are loaded
    if (!loading && user && rolesLoaded) {
      if (isSeller) {
        navigate("/ventas/dashboard", { replace: true });
      } else {
        // User is authenticated but not a seller - show error and stop loading
        setRoleError("No tienes rol de vendedor. Por favor regístrate como vendedor primero.");
        setIsLoading(false);
      }
    }
  }, [user, rolesLoaded, isSeller, loading, navigate]);

  // Reset loading state when roles are fully loaded (handles edge cases)
  useEffect(() => {
    if (rolesLoaded && isLoading) {
      // Give a brief moment for navigation to happen before clearing loading
      const timer = setTimeout(() => {
        if (!isSeller) {
          setIsLoading(false);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [rolesLoaded, isLoading, isSeller]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setRoleError(null);

    const { error } = await signIn(formData.email, formData.password);
    
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Credenciales inválidas. Verifica tu email y contraseña.");
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("Por favor confirma tu email antes de iniciar sesión.");
      } else {
        toast.error(error.message);
      }
      setIsLoading(false);
      return;
    }

    // The useEffect will handle the redirect after roles are loaded
    toast.success("¡Verificando permisos...");
  };

  return (
    <SellerLayout showFooter={false}>
      <div className="flex items-center justify-center px-4 py-12 min-h-[calc(100vh-var(--header-h))]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Back Link */}
          <Link
            to="/ventas"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al portal vendedores
          </Link>

          {/* Card */}
          <div className="bg-card rounded-2xl p-8 shadow-card">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-green shadow-glow-green mb-4">
                <Store className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black text-card-foreground uppercase mb-2">
                Login Vendedor
              </h1>
              <p className="text-muted-foreground text-sm">
                Accede a tu panel de vendedor
              </p>
            </div>

            {/* Role Error Alert */}
            {roleError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{roleError}</AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-card-foreground">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 bg-background border-input text-foreground"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-card-foreground">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 bg-background border-input text-foreground"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || (user && !rolesLoaded)}
                className="w-full bg-gradient-green text-primary-foreground font-bold uppercase tracking-wider py-6"
              >
                {isLoading || (user && !rolesLoaded) ? "Verificando..." : "Ingresar"}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <Link to="/ventas/registro" className="text-primary hover:underline font-medium">
                  Regístrate como vendedor
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </SellerLayout>
  );
};

export default VendedoresLogin;
