import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, User, IdCard, Phone, Upload, CheckCircle, Mail, Tv, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

const RegistroCompraForm = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCoupons, setGeneratedCoupons] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    ci: "",
    telefono: "",
    email: "",
    departamento: "",
    serialNumber: "",
    factura: null as File | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, factura: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('rpc_register_buyer_serial', {
        p_serial_number: formData.serialNumber,
        p_full_name: `${formData.nombre} ${formData.apellido}`,
        p_dni: formData.ci,
        p_email: formData.email,
        p_phone: formData.telefono,
        p_city: formData.departamento,
        p_purchase_date: new Date().toISOString().split('T')[0],
        p_user_id: null
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; coupons?: string[] };

      if (!result.success) {
        toast.error(result.error || 'Error al registrar el serial');
        setIsLoading(false);
        return;
      }

      if (result.coupons) {
        setGeneratedCoupons(result.coupons);
      }

      setStep(3);
      toast.success("¡Registro completado exitosamente!");
    } catch (error: any) {
      console.error("Error registering purchase:", error);
      toast.error(error.message || "Error al registrar la compra");
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && formData.nombre && formData.apellido && formData.ci && formData.telefono && formData.departamento && formData.email) {
      setStep(2);
    } else {
      toast.error("Por favor completa todos los campos requeridos.");
    }
  };

  const prevStep = () => {
    if (step > 1 && step < 3) {
      setStep(step - 1);
    }
  };

  const resetForm = () => {
    setStep(1);
    setGeneratedCoupons([]);
    setFormData({
      nombre: "",
      apellido: "",
      ci: "",
      telefono: "",
      email: "",
      departamento: "",
      serialNumber: "",
      factura: null,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
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
                className={`w-12 sm:w-16 h-1 mx-2 rounded transition-all ${
                  step > s ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-card rounded-2xl p-6 sm:p-8 shadow-card"
      >
        {step === 1 && (
          <>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black text-card-foreground uppercase mb-2">
                Datos Personales
              </h3>
              <p className="text-muted-foreground text-sm">
                Ingresa tus datos para participar
              </p>
            </div>

            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-card-foreground">Nombre</Label>
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
                  <Label htmlFor="apellido" className="text-card-foreground">Apellido</Label>
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
                <Label htmlFor="ci" className="text-card-foreground">Carnet de Identidad</Label>
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
                <Label htmlFor="telefono" className="text-card-foreground">Teléfono</Label>
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
                      <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-card-foreground">Correo electrónico</Label>
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

              <Button
                type="button"
                onClick={nextStep}
                disabled={!formData.nombre || !formData.apellido || !formData.ci || !formData.telefono || !formData.departamento || !formData.email}
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
              <h3 className="text-2xl font-black text-card-foreground uppercase mb-2">
                Datos de Compra
              </h3>
              <p className="text-muted-foreground text-sm">
                Ingresa el serial de tu TV y adjunta la factura
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="serialNumber" className="text-card-foreground">
                  Número de Serial del TV *
                </Label>
                <div className="relative">
                  <Tv className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="serialNumber"
                    placeholder="Ej: SKW123456789"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="pl-10 bg-background border-input text-foreground"
                    required
                  />
                </div>
              </div>

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
                      <p className="text-foreground font-medium mb-1">Arrastra tu factura aquí</p>
                      <p className="text-muted-foreground text-sm">o haz clic para seleccionar (JPG, PNG, PDF)</p>
                    </>
                  )}
                </label>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1 border-border text-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Atrás
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.serialNumber || !formData.factura || isLoading}
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
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            
            <h3 className="text-2xl font-black text-card-foreground uppercase mb-2">
              ¡Registro Exitoso!
            </h3>
            <p className="text-muted-foreground mb-8">
              Tu compra ha sido registrada. Recibirás tus tickets por correo electrónico.
            </p>

            <div className="bg-muted rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center gap-4">
                <Trophy className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Cupones generados</p>
                  <p className="text-3xl font-black text-gradient-gold">{generatedCoupons.length}</p>
                </div>
              </div>
              {generatedCoupons.length > 0 && (
                <div className="mt-4 space-y-2">
                  {generatedCoupons.map((coupon, idx) => (
                    <div key={idx} className="bg-background rounded-lg p-3 font-mono text-center text-foreground">
                      {coupon}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={resetForm}
              className="bg-gradient-gold text-primary-foreground font-bold uppercase tracking-wider"
            >
              Registrar otra compra
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default RegistroCompraForm;
