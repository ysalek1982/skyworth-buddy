import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, isAdmin, isSeller, rolesLoaded, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const redirectPath = searchParams.get("redirect");

  // Handle redirect after roles are loaded
  useEffect(() => {
    if (user && rolesLoaded && !loading) {
      if (redirectPath) {
        navigate(`/${redirectPath}`, { replace: true });
      } else if (isAdmin) {
        navigate("/admin", { replace: true });
      } else if (isSeller) {
        navigate("/vendedores/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, rolesLoaded, isAdmin, isSeller, loading, navigate, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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

    toast.success("¡Bienvenido!");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        {/* Card */}
        <div className="bg-card rounded-2xl p-8 shadow-card border border-border">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-orange shadow-glow-orange mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-card-foreground uppercase mb-2">
              Iniciar Sesión
            </h1>
            <p className="text-muted-foreground text-sm">
              Accede a tu cuenta
            </p>
          </div>

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
              className="w-full bg-gradient-orange text-primary-foreground font-bold uppercase tracking-wider py-6"
            >
              {isLoading || (user && !rolesLoaded) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Ingresar"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              ¿Eres vendedor?{" "}
              <Link to="/vendedores/login" className="text-primary hover:underline font-medium">
                Ingresa aquí
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              ¿No tienes cuenta de vendedor?{" "}
              <Link to="/vendedores/registro" className="text-primary hover:underline font-medium">
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
