import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Store, Trophy, UserPlus, LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SellerLayout from "@/components/layout/SellerLayout";
import { useAuth } from "@/hooks/useAuth";

const VendedoresHome = () => {
  const { user, isSeller, rolesLoaded } = useAuth();

  return (
    <SellerLayout>
      <div className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-green shadow-glow-green mb-6">
              <Store className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase mb-4">
              <span className="text-foreground">PORTAL </span>
              <span className="text-gradient-gold">VENDEDORES</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Registra tus ventas de TVs Skyworth, acumula puntos y gana increíbles premios en la campaña Mundial 2026.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto"
          >
            {rolesLoaded && user && isSeller ? (
              // Logged in seller
              <Link to="/ventas/dashboard" className="col-span-2">
                <div className="bg-card rounded-2xl p-8 shadow-card hover:shadow-lg transition-shadow text-center group">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-green flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-card-foreground mb-2">Ir a Mi Dashboard</h3>
                  <p className="text-muted-foreground mb-4">
                    Registra ventas, ve tus puntos y cupones
                  </p>
                  <Button className="bg-gradient-green text-white">
                    Acceder <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Link>
            ) : (
              // Not logged in
              <>
                <Link to="/ventas/login">
                  <div className="bg-card rounded-2xl p-8 shadow-card hover:shadow-lg transition-shadow text-center group h-full">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-gold flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <LogIn className="w-8 h-8 text-skyworth-dark" />
                    </div>
                    <h3 className="text-xl font-bold text-card-foreground mb-2">Iniciar Sesión</h3>
                    <p className="text-muted-foreground mb-4">
                      Ya tengo una cuenta de vendedor
                    </p>
                    <Button variant="outline" className="border-primary text-primary">
                      Ingresar <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </Link>

                <Link to="/ventas/registro">
                  <div className="bg-card rounded-2xl p-8 shadow-card hover:shadow-lg transition-shadow text-center group h-full">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-green flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UserPlus className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-card-foreground mb-2">Registrarme</h3>
                    <p className="text-muted-foreground mb-4">
                      Crear mi cuenta de vendedor
                    </p>
                    <Button className="bg-gradient-green text-white">
                      Registrarme <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </Link>
              </>
            )}
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 text-center"
          >
            <h2 className="text-2xl font-bold text-foreground mb-8">¿Por qué participar?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="font-bold text-foreground mb-2">Gana Premios</h3>
                <p className="text-muted-foreground text-sm">Acumula puntos y canjea por increíbles premios</p>
              </div>
              <div className="p-6">
                <div className="text-4xl mb-4">🎫</div>
                <h3 className="font-bold text-foreground mb-2">Cupones Exclusivos</h3>
                <p className="text-muted-foreground text-sm">Obtén cupones para el sorteo del Mundial 2026</p>
              </div>
              <div className="p-6">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="font-bold text-foreground mb-2">Ranking Nacional</h3>
                <p className="text-muted-foreground text-sm">Compite con otros vendedores de Bolivia</p>
              </div>
            </div>
          </motion.div>

          {/* Back to public */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 text-center"
          >
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              ← Volver a la página principal
            </Link>
          </motion.div>
        </div>
      </div>
    </SellerLayout>
  );
};

export default VendedoresHome;
