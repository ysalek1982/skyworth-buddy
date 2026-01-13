import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, User, IdCard, Phone, Upload, ArrowLeft, CheckCircle, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const RegistroCliente = () => {
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    ci: "",
    telefono: "",
    email: "",
    password: "",
    departamento: "",
    factura: null as File | null,
  });

  const departamentos = [
    "La Paz",
    "Cochabamba",
    "Santa Cruz",
    "Oruro",
    "Potosí",
    "Chuquisaca",
    "Tarija",
    "Beni",
    "Pando",
  ];

  useEffect(() => {
    if (user && step !== 3) {
      // If user is already logged in, skip to step 2
      setStep(2);
    }
  }, [user, step]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, factura: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let currentUser = user;

    // If not logged in, create account first
    if (!currentUser) {
      const { error: authError } = await signUp(formData.email, formData.password, {
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
      });

      if (authError) {
        if (authError.message.includes("User already registered")) {
          toast.error("Este email ya está registrado. Intenta iniciar sesión.");
        } else {
          toast.error(authError.message);
        }
        setIsLoading(false);
        return;
      }

      // Get the newly created user
      const { data: { user: newUser } } = await supabase.auth.getUser();
      currentUser = newUser;
    }

    if (currentUser) {
      // Check if cliente already exists
      const { data: existingCliente } = await supabase
        .from("clientes")
        .select("id")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (!existingCliente) {
        // Create cliente record
        const { error: clienteError } = await supabase.from("clientes").insert({
          user_id: currentUser.id,
          cedula: formData.ci,
          email: formData.email || currentUser.email,
          telefono: formData.telefono,
          estado: "activo",
        });

        if (clienteError) {
          console.error("Error creating cliente:", clienteError);
          toast.error("Error al crear el perfil de cliente.");
          setIsLoading(false);
          return;
        }

        // Assign cliente role
        await supabase.from("user_roles").insert({
          user_id: currentUser.id,
          role: "cliente",
        });
      }
    }

    setStep(3);
    toast.success("¡Registro completado exitosamente!");
    setIsLoading(false);
  };

  const nextStep = () => {
    if (step === 1 && formData.nombre && formData.apellido && formData.ci && formData.telefono && formData.departamento) {
      if (!user && (!formData.email || !formData.password)) {
        toast.error("Por favor ingresa tu email y contraseña.");
        return;
      }
      setStep(2);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    step >= s
                      ? "bg-gradient-gold text-skyworth-dark"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 rounded transition-all ${
                      step > s ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card rounded-2xl p-8 shadow-card"
          >
            {step === 1 && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-black text-card-foreground uppercase mb-2">
                    Datos Personales
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Ingresa tus datos para participar
                  </p>
                </div>

                <form className="space-y-4">
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
                    <Label htmlFor="ci" className="text-card-foreground">
                      Carnet de Identidad
                    </Label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="ci"
                        placeholder="12345678"
                        value={formData.ci}
                        onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                        className="pl-10 bg-background border-input text-foreground"
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
                    <Label className="text-card-foreground">Departamento</Label>
                    <Select
                      value={formData.departamento}
                      onValueChange={(value) => setFormData({ ...formData, departamento: value })}
                    >
                      <SelectTrigger className="bg-background border-input text-foreground">
                        <SelectValue placeholder="Selecciona tu departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {departamentos.map((dep) => (
                          <SelectItem key={dep} value={dep}>
                            {dep}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {!user && (
                    <>
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
                    </>
                  )}

                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!formData.nombre || !formData.apellido || !formData.ci || !formData.telefono || !formData.departamento || (!user && (!formData.email || !formData.password))}
                    className="w-full bg-gradient-green text-primary-foreground font-bold uppercase tracking-wider py-6"
                  >
                    Continuar
                  </Button>
                </form>
              </>
            )}

            {step === 2 && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-black text-card-foreground uppercase mb-2">
                    Sube tu Factura
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Adjunta la factura de tu compra Skyworth
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
                    <input
                      type="file"
                      id="factura"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="factura" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      {formData.factura ? (
                        <p className="text-foreground font-medium">{formData.factura.name}</p>
                      ) : (
                        <>
                          <p className="text-foreground font-medium mb-1">
                            Arrastra tu factura aquí
                          </p>
                          <p className="text-muted-foreground text-sm">
                            o haz clic para seleccionar (JPG, PNG, PDF)
                          </p>
                        </>
                      )}
                    </label>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 border-border text-foreground"
                    >
                      Atrás
                    </Button>
                    <Button
                      type="submit"
                      disabled={!formData.factura || isLoading}
                      className="flex-1 bg-gradient-green text-primary-foreground font-bold uppercase tracking-wider"
                    >
                      {isLoading ? "Procesando..." : "Registrar"}
                    </Button>
                  </div>
                </form>
              </>
            )}

            {step === 3 && (
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-green mb-6"
                >
                  <CheckCircle className="w-10 h-10 text-secondary-foreground" />
                </motion.div>
                
                <h1 className="text-2xl font-black text-card-foreground uppercase mb-2">
                  ¡Registro Exitoso!
                </h1>
                <p className="text-muted-foreground mb-8">
                  Tu compra ha sido registrada. Recibirás tus tickets por correo electrónico.
                </p>

                <div className="bg-muted rounded-xl p-6 mb-8">
                  <div className="flex items-center justify-center gap-4">
                    <Trophy className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tickets generados</p>
                      <p className="text-3xl font-black text-gradient-gold">2</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => navigate("/")}
                  className="bg-gradient-gold text-primary-foreground font-bold uppercase tracking-wider"
                >
                  Volver al Inicio
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RegistroCliente;
