import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Store, User, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, IdCard, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SellerLayout from "@/components/layout/SellerLayout";

const ciudades = [
  "La Paz",
  "El Alto",
  "Cochabamba",
  "Santa Cruz",
  "Oruro",
  "Potosí",
  "Sucre",
  "Tarija",
  "Trinidad",
  "Cobija",
];

const VendedoresRegistro = () => {
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    password: "",
    storeName: "",
    storeCity: "",
  });

  useEffect(() => {
    if (user && !isSuccess) {
      navigate("/vendedores");
    }
  }, [user, navigate, isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Register with Supabase Auth
    const { error: authError } = await signUp(formData.email, formData.password, {
      nombre: formData.nombre,
      apellido: formData.apellido,
      telefono: formData.telefono,
    });

    if (authError) {
      if (authError.message.includes("User already registered")) {
        toast.error("Este email ya está registrado. Intenta iniciar sesión.");
      } else if (authError.message.includes("Password")) {
        toast.error("La contraseña debe tener al menos 6 caracteres.");
      } else {
        toast.error(authError.message);
      }
      setIsLoading(false);
      return;
    }

    // Get the newly created user
    const { data: { user: newUser } } = await supabase.auth.getUser();
    
    if (newUser) {
      // Create profile
      await supabase.from("profiles").insert({
        user_id: newUser.id,
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
      });

      // Create seller record
      const { error: sellerError } = await supabase.from("sellers").insert({
        user_id: newUser.id,
        store_name: formData.storeName,
        store_city: formData.storeCity,
        phone: formData.telefono,
        is_active: true,
      });

      if (sellerError) {
        console.error("Error creating seller:", sellerError);
        toast.error("Error al crear el perfil de vendedor. Contacta al administrador.");
        setIsLoading(false);
        return;
      }

      // Assign seller role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: newUser.id,
        role: "seller",
      });

      if (roleError) {
        console.error("Error assigning role:", roleError);
      }
    }

    setIsSuccess(true);
    toast.success("¡Registro completado exitosamente!");
    setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <SellerLayout showFooter={false}>
        <div className="flex items-center justify-center px-4 py-12 min-h-[calc(100vh-var(--header-h))]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-card rounded-2xl p-8 shadow-card text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-green mb-6"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            
            <h1 className="text-2xl font-black text-card-foreground uppercase mb-2">
              ¡Registro Exitoso!
            </h1>
            <p className="text-muted-foreground mb-8">
              Tu cuenta de vendedor ha sido creada. Ya puedes iniciar sesión.
            </p>

            <Button
              onClick={() => navigate("/vendedores/login")}
              className="w-full bg-gradient-gold text-primary-foreground font-bold uppercase tracking-wider"
            >
              Iniciar Sesión
            </Button>
          </motion.div>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout showFooter={false}>
      <div className="flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Back Link */}
          <Link
            to="/vendedores"
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
                Registro Vendedor
              </h1>
              <p className="text-muted-foreground text-sm">
                Crea tu cuenta para registrar ventas y ganar puntos
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-card-foreground">
                    Nombre
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="nombre"
                      placeholder="Tu nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="pl-10 bg-background border-input text-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellido" className="text-card-foreground">
                    Apellido
                  </Label>
                  <Input
                    id="apellido"
                    placeholder="Tu apellido"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="bg-background border-input text-foreground"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono" className="text-card-foreground">
                  Teléfono
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="telefono"
                    placeholder="+591 12345678"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="pl-10 bg-background border-input text-foreground"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeName" className="text-card-foreground">
                  Nombre de la Tienda
                </Label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="storeName"
                    placeholder="Ej: Electrónica Central"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="pl-10 bg-background border-input text-foreground"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-card-foreground">Ciudad</Label>
                <Select
                  value={formData.storeCity}
                  onValueChange={(value) => setFormData({ ...formData, storeCity: value })}
                >
                  <SelectTrigger className="bg-background border-input text-foreground">
                    <SelectValue placeholder="Selecciona tu ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {ciudades.map((ciudad) => (
                      <SelectItem key={ciudad} value={ciudad}>
                        {ciudad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                disabled={isLoading || !formData.nombre || !formData.apellido || !formData.telefono || !formData.storeName || !formData.storeCity || !formData.email || !formData.password}
                className="w-full bg-gradient-green text-primary-foreground font-bold uppercase tracking-wider py-6"
              >
                {isLoading ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Link to="/vendedores/login" className="text-primary hover:underline font-medium">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </SellerLayout>
  );
};

export default VendedoresRegistro;
