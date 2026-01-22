import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Store, LogOut, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading, isAdmin } = useAuth();

  // Only anchor links for single-page landing
  const navLinks = [
    { href: "#inicio", label: "Inicio" },
    { href: "#registrar-compra", label: "Registrar Compra" },
  ];

  const handleNavClick = (href: string) => {
    setIsMenuOpen(false);
    const anchor = href;
    if (location.pathname === "/") {
      const element = document.querySelector(anchor);
      element?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        const element = document.querySelector(anchor);
        element?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("¡Hasta pronto!");
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a2818]/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Text Only (no icon per requirement) */}
          <Link to="/" className="flex items-center gap-2">
            <div>
              <span className="font-bold text-white text-lg tracking-wide block leading-none">SKYWORTH</span>
              <span className="text-[#FF6A00] text-[10px] font-semibold uppercase tracking-wider">El Sueño del Hincha</span>
            </div>
          </Link>

          {/* Desktop Nav - Center */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="text-sm font-medium transition-colors text-white/80 hover:text-[#FF6A00]"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Actions - Right */}
          <div className="flex items-center gap-2">
            {!loading && (
              <>
                {user ? (
                  <div className="hidden sm:flex items-center gap-2">
                    {isAdmin && (
                      <Link to="/admin">
                        <Button variant="outline" size="sm" className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin
                        </Button>
                      </Link>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10">
                      <User className="w-4 h-4 text-white/70" />
                      <span className="text-sm text-white">{user.email?.split("@")[0]}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      className="text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Link to="/vendedores/login" className="hidden sm:block">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-[#FF6A00] text-[#FF6A00] hover:bg-[#FF6A00] hover:text-white rounded-full px-5"
                    >
                      <Store className="w-4 h-4 mr-2" />
                      Soy Vendedor
                    </Button>
                  </Link>
                )}
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-white"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 bg-[#0a2818]/95 backdrop-blur-lg"
          >
            <nav className="p-4 space-y-2">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="block w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-2 border-t border-white/10 mt-2">
                {user ? (
                  <div className="space-y-2">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-amber-500"
                      >
                        <Shield className="w-4 h-4" />
                        Panel Admin
                      </Link>
                    )}
                    <div className="flex items-center gap-2 px-4 py-2 text-sm text-white">
                      <User className="w-4 h-4" />
                      {user.email}
                    </div>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/vendedores/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#FF6A00]"
                  >
                    <Store className="w-4 h-4" />
                    Soy Vendedor
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
