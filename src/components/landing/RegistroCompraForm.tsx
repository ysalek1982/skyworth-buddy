import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Trophy, User, IdCard, Phone, Upload, CheckCircle, Mail, Tv, ArrowLeft, Loader2, AlertCircle, XCircle, Gift } from "lucide-react";
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

interface SerialValidation {
  isValid: boolean;
  isChecking: boolean;
  error: string | null;
  productName: string | null;
  ticketCount: number | null;
}

const RegistroCompraForm = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCoupons, setGeneratedCoupons] = useState<string[]>([]);
  const [serialValidation, setSerialValidation] = useState<SerialValidation>({
    isValid: false,
    isChecking: false,
    error: null,
    productName: null,
    ticketCount: null,
  });
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

  // Normalize serial: trim, uppercase, remove duplicate spaces
  const normalizeSerial = (serial: string): string => {
    return serial.trim().replace(/\s+/g, ' ').toUpperCase();
  };

  // Validate serial against database
  const validateSerial = useCallback(async (serialNumber: string) => {
    const normalized = normalizeSerial(serialNumber);
    
    if (!normalized) {
      setSerialValidation({
        isValid: false,
        isChecking: false,
        error: null,
        productName: null,
        ticketCount: null,
      });
      return;
    }

    setSerialValidation(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      // Query tv_serials table for the serial
      const { data: serialData, error: serialError } = await supabase
        .from("tv_serials")
        .select(`
          id,
          serial_number,
          status,
          buyer_status,
          product_id,
          products (
            id,
            model_name,
            description,
            ticket_multiplier
          )
        `)
        .eq("serial_number", normalized)
        .maybeSingle();

      if (serialError) {
        throw serialError;
      }

      if (!serialData) {
        setSerialValidation({
          isValid: false,
          isChecking: false,
          error: "Serial no encontrado. Verifica el Número de Serial del TV.",
          productName: null,
          ticketCount: null,
        });
        return;
      }

      // Check if serial is blocked
      if (serialData.status === "BLOCKED") {
        setSerialValidation({
          isValid: false,
          isChecking: false,
          error: "Este serial está bloqueado y no puede participar.",
          productName: null,
          ticketCount: null,
        });
        return;
      }

      // Check if already registered by a buyer
      if (serialData.buyer_status === "REGISTERED") {
        setSerialValidation({
          isValid: false,
          isChecking: false,
          error: "Este serial ya fue registrado por otro comprador.",
          productName: null,
          ticketCount: null,
        });
        return;
      }

      // Serial is valid and available
      const product = serialData.products as { model_name: string; description: string; ticket_multiplier: number } | null;
      
      setSerialValidation({
        isValid: true,
        isChecking: false,
        error: null,
        productName: product ? `${product.model_name} - ${product.description}` : "Producto Skyworth",
        ticketCount: product?.ticket_multiplier || 1,
      });

    } catch (error: any) {
      console.error("Error validating serial:", error);
      setSerialValidation({
        isValid: false,
        isChecking: false,
        error: "Error al validar el serial. Intenta nuevamente.",
        productName: null,
        ticketCount: null,
      });
    }
  }, []);

  // Handle serial input blur
  const handleSerialBlur = () => {
    if (formData.serialNumber.trim()) {
      validateSerial(formData.serialNumber);
    }
  };

  // Handle serial input change
  const handleSerialChange = (value: string) => {
    setFormData({ ...formData, serialNumber: value });
    // Reset validation when typing
    if (serialValidation.isValid || serialValidation.error) {
      setSerialValidation({
        isValid: false,
        isChecking: false,
        error: null,
        productName: null,
        ticketCount: null,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, factura: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate serial before submit
    if (!serialValidation.isValid) {
      await validateSerial(formData.serialNumber);
      if (!serialValidation.isValid) {
        toast.error("Por favor verifica el número de serial antes de continuar.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const normalizedSerial = normalizeSerial(formData.serialNumber);
      
      const { data, error } = await supabase.rpc('rpc_register_buyer_serial', {
        p_serial_number: normalizedSerial,
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
    setSerialValidation({
      isValid: false,
      isChecking: false,
      error: null,
      productName: null,
      ticketCount: null,
    });
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

  // Get serial input class based on validation state
  const getSerialInputClass = () => {
    if (serialValidation.isChecking) return "serial-checking";
    if (serialValidation.isValid) return "serial-valid";
    if (serialValidation.error) return "serial-invalid";
    return "";
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
                  ? "bg-gradient-orange text-white"
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

      {/* Form Card - Dark Glass */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="form-dark-panel"
      >
        {step === 1 && (
          <>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black text-white uppercase mb-2">
                Datos Personales
              </h3>
              <p className="text-muted-foreground text-sm">
                Ingresa tus datos para participar
              </p>
            </div>

            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-white">Nombre *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="nombre"
                      placeholder="Tu nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="pl-10 bg-muted/50 border-border text-white placeholder:text-muted-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellido" className="text-white">Apellido *</Label>
                  <Input
                    id="apellido"
                    placeholder="Tu apellido"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="bg-muted/50 border-border text-white placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ci" className="text-white">Carnet de Identidad *</Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="ci"
                    placeholder="12345678"
                    value={formData.ci}
                    onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                    className="pl-10 bg-muted/50 border-border text-white placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono" className="text-white">Teléfono *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="telefono"
                    placeholder="+591 12345678"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="pl-10 bg-muted/50 border-border text-white placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Departamento *</Label>
                <Select
                  value={formData.departamento}
                  onValueChange={(value) => setFormData({ ...formData, departamento: value })}
                >
                  <SelectTrigger className="bg-muted/50 border-border text-white">
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
                <Label htmlFor="email" className="text-white">Correo electrónico *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 bg-muted/50 border-border text-white placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={nextStep}
                disabled={!formData.nombre || !formData.apellido || !formData.ci || !formData.telefono || !formData.departamento || !formData.email}
                className="w-full bg-gradient-orange text-white font-bold uppercase tracking-wider py-6 hover:opacity-90"
              >
                Continuar
              </Button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black text-white uppercase mb-2">
                Datos de Compra
              </h3>
              <p className="text-muted-foreground text-sm">
                Ingresa el serial de tu TV y adjunta la factura
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Serial Number Field - Main Focus */}
              <div className="space-y-2">
                <Label htmlFor="serialNumber" className="text-white text-lg font-bold">
                  Número de Serial del TV *
                </Label>
                <div className="relative">
                  <Tv className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                  <Input
                    id="serialNumber"
                    placeholder="Ej: SKW123456789"
                    value={formData.serialNumber}
                    onChange={(e) => handleSerialChange(e.target.value)}
                    onBlur={handleSerialBlur}
                    className={`pl-10 pr-12 bg-muted/50 border-2 border-border text-white placeholder:text-muted-foreground text-lg py-6 ${getSerialInputClass()}`}
                    required
                  />
                  {/* Validation indicator */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {serialValidation.isChecking && (
                      <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    )}
                    {serialValidation.isValid && (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                    {serialValidation.error && (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                </div>

                {/* Validation Status Messages */}
                {serialValidation.isChecking && (
                  <p className="text-blue-400 text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validando serial…
                  </p>
                )}

                {serialValidation.error && (
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {serialValidation.error}
                  </p>
                )}

                {serialValidation.isValid && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-3">
                    <p className="text-green-400 text-sm flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4" />
                      Serial válido y disponible
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                      <div>
                  <span className="text-muted-foreground text-xs uppercase">Modelo:</span>
                        <p className="text-white font-medium">{serialValidation.productName}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs uppercase">Cupones a generar:</span>
                        <p className="text-2xl font-black text-gradient-orange">{serialValidation.ticketCount}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Invoice Upload */}
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer bg-muted/20">
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
                    <p className="text-white font-medium">{formData.factura.name}</p>
                  ) : (
                    <>
                      <p className="text-white font-medium mb-1">Arrastra tu factura aquí</p>
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
                  className="flex-1 border-border text-white hover:bg-muted/50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Atrás
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.serialNumber || !formData.factura || isLoading || !serialValidation.isValid}
                  className="flex-1 bg-gradient-orange text-white font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    "Registrar"
                  )}
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
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-orange mb-6 shadow-glow-orange"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            
            <h3 className="text-2xl font-black text-white uppercase mb-2">
              ¡Registro Exitoso!
            </h3>
            <p className="text-muted-foreground mb-8">
              Tu compra ha sido registrada. Recibirás tus cupones por correo electrónico.
            </p>

            <div className="bg-muted/30 rounded-xl p-6 mb-8 border border-border">
              <div className="flex items-center justify-center gap-4">
                <Gift className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Cupones generados</p>
                  <p className="text-4xl font-black text-gradient-orange">{generatedCoupons.length}</p>
                </div>
              </div>
              {generatedCoupons.length > 0 && (
                <div className="mt-6 space-y-2">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Tus cupones:</p>
                  {generatedCoupons.map((coupon, idx) => (
                    <div key={idx} className="bg-muted/50 rounded-lg p-3 font-mono text-center text-white border border-border">
                      {coupon}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={resetForm}
              className="bg-gradient-orange text-white font-bold uppercase tracking-wider hover:opacity-90"
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
