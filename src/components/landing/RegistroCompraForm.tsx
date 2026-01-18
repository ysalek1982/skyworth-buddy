import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Trophy, User, IdCard, Phone, Upload, CheckCircle, Mail, Tv, ArrowLeft, 
  Loader2, AlertCircle, XCircle, Gift, Calendar, MapPin, FileText, Shield, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  couponCount: number | null;
  serialId: string | null;
}

interface FormData {
  // Step 1 - Personal Data
  nombreCompleto: string;
  ci: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  ciudad: string;
  // Step 2 - Purchase Data
  serialNumber: string;
  fechaCompra: string;
  // Step 3 - Documents
  factura: File | null;
  poliza: File | null;
  tagPoliza: File | null;
  aceptaTerminos: boolean;
}

const RegistroCompraForm = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serialValidation, setSerialValidation] = useState<SerialValidation>({
    isValid: false,
    isChecking: false,
    error: null,
    productName: null,
    couponCount: null,
    serialId: null,
  });
  const [formData, setFormData] = useState<FormData>({
    nombreCompleto: "",
    ci: "",
    email: "",
    telefono: "",
    fechaNacimiento: "",
    ciudad: "",
    serialNumber: "",
    fechaCompra: "",
    factura: null,
    poliza: null,
    tagPoliza: null,
    aceptaTerminos: false,
  });
  const [ageError, setAgeError] = useState<string | null>(null);

  // Calculate age from date of birth
  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Validate age when date changes
  const handleDateChange = (value: string) => {
    setFormData({ ...formData, fechaNacimiento: value });
    if (value) {
      const age = calculateAge(value);
      if (age < 18) {
        setAgeError("Debes ser mayor de 18 años para participar.");
      } else {
        setAgeError(null);
      }
    } else {
      setAgeError(null);
    }
  };

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
        couponCount: null,
        serialId: null,
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
            coupon_multiplier,
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
          couponCount: null,
          serialId: null,
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
          couponCount: null,
          serialId: null,
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
          couponCount: null,
          serialId: null,
        });
        return;
      }

      // Serial is valid and available
      const product = serialData.products as { model_name: string; description: string; coupon_multiplier: number | null; ticket_multiplier: number } | null;
      
      setSerialValidation({
        isValid: true,
        isChecking: false,
        error: null,
        productName: product ? `${product.model_name}${product.description ? ` - ${product.description}` : ''}` : "Producto Skyworth",
        couponCount: product?.coupon_multiplier || product?.ticket_multiplier || 1,
        serialId: serialData.id,
      });

    } catch (error: any) {
      console.error("Error validating serial:", error);
      setSerialValidation({
        isValid: false,
        isChecking: false,
        error: "Error al validar el serial. Intenta nuevamente.",
        productName: null,
        couponCount: null,
        serialId: null,
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
        couponCount: null,
        serialId: null,
      });
    }
  };

  const handleFileChange = (field: 'factura' | 'poliza' | 'tagPoliza') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, [field]: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validations
    if (!serialValidation.isValid) {
      toast.error("Por favor verifica el número de serial.");
      return;
    }

    if (!formData.factura || !formData.poliza || !formData.tagPoliza) {
      toast.error("Debes subir los 3 documentos requeridos.");
      return;
    }

    if (!formData.aceptaTerminos) {
      toast.error("Debes aceptar que los datos coinciden con los documentos.");
      return;
    }

    setIsLoading(true);

    try {
      const normalizedSerial = normalizeSerial(formData.serialNumber);
      
      // Upload documents to storage (if bucket exists) - best effort
      let invoiceUrl: string | null = null;
      let polizaUrl: string | null = null;
      let tagUrl: string | null = null;

      // Try to upload files - continue even if storage fails
      try {
        const timestamp = Date.now();
        
        if (formData.factura) {
          const { data: uploadData } = await supabase.storage
            .from('purchase-documents')
            .upload(`invoices/${timestamp}_${formData.factura.name}`, formData.factura);
          if (uploadData) {
            const { data: urlData } = supabase.storage.from('purchase-documents').getPublicUrl(uploadData.path);
            invoiceUrl = urlData.publicUrl;
          }
        }

        if (formData.poliza) {
          const { data: uploadData } = await supabase.storage
            .from('purchase-documents')
            .upload(`polizas/${timestamp}_${formData.poliza.name}`, formData.poliza);
          if (uploadData) {
            const { data: urlData } = supabase.storage.from('purchase-documents').getPublicUrl(uploadData.path);
            polizaUrl = urlData.publicUrl;
          }
        }

        if (formData.tagPoliza) {
          const { data: uploadData } = await supabase.storage
            .from('purchase-documents')
            .upload(`tags/${timestamp}_${formData.tagPoliza.name}`, formData.tagPoliza);
          if (uploadData) {
            const { data: urlData } = supabase.storage.from('purchase-documents').getPublicUrl(uploadData.path);
            tagUrl = urlData.publicUrl;
          }
        }
      } catch (storageError) {
        console.warn("Storage upload failed (continuing):", storageError);
      }

      // Create purchase record with PENDING status (no coupons yet)
      const { data: purchaseData, error: purchaseError } = await supabase
        .from("client_purchases")
        .insert({
          serial_number: normalizedSerial,
          full_name: formData.nombreCompleto,
          dni: formData.ci,
          email: formData.email,
          phone: formData.telefono,
          city: formData.ciudad,
          purchase_date: formData.fechaCompra,
          admin_status: "PENDING",
          invoice_url: invoiceUrl,
          id_front_url: polizaUrl, // Using existing field for poliza
          id_back_url: tagUrl, // Using existing field for tag
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Reserve the serial (mark as REGISTERED but status stays for admin approval)
      await supabase
        .from("tv_serials")
        .update({ 
          buyer_status: "REGISTERED",
          buyer_purchase_id: purchaseData.id,
          updated_at: new Date().toISOString()
        })
        .eq("serial_number", normalizedSerial);

      setIsSuccess(true);
      setStep(4); // Success step
      toast.success("¡Registro enviado exitosamente!");

    } catch (error: any) {
      console.error("Error registering purchase:", error);
      toast.error(error.message || "Error al registrar la compra. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const isStep1Valid = () => {
    return formData.nombreCompleto && 
           formData.ci && 
           formData.email && 
           formData.telefono && 
           formData.fechaNacimiento && 
           formData.ciudad && 
           !ageError;
  };

  const isStep2Valid = () => {
    return formData.serialNumber && 
           formData.fechaCompra && 
           serialValidation.isValid;
  };

  const isStep3Valid = () => {
    return formData.factura && 
           formData.poliza && 
           formData.tagPoliza && 
           formData.aceptaTerminos;
  };

  const nextStep = () => {
    if (step === 1) {
      if (!isStep1Valid()) {
        if (ageError) {
          toast.error(ageError);
        } else {
          toast.error("Por favor completa todos los campos requeridos.");
        }
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!isStep2Valid()) {
        if (!serialValidation.isValid && formData.serialNumber) {
          validateSerial(formData.serialNumber);
        }
        toast.error("Por favor verifica el serial y la fecha de compra.");
        return;
      }
      setStep(3);
    }
  };

  const prevStep = () => {
    if (step > 1 && step < 4) {
      setStep(step - 1);
    }
  };

  const resetForm = () => {
    setStep(1);
    setIsSuccess(false);
    setAgeError(null);
    setSerialValidation({
      isValid: false,
      isChecking: false,
      error: null,
      productName: null,
      couponCount: null,
      serialId: null,
    });
    setFormData({
      nombreCompleto: "",
      ci: "",
      email: "",
      telefono: "",
      fechaNacimiento: "",
      ciudad: "",
      serialNumber: "",
      fechaCompra: "",
      factura: null,
      poliza: null,
      tagPoliza: null,
      aceptaTerminos: false,
    });
  };

  // Get serial input class based on validation state
  const getSerialInputClass = () => {
    if (serialValidation.isChecking) return "serial-checking";
    if (serialValidation.isValid) return "serial-valid";
    if (serialValidation.error) return "serial-invalid";
    return "";
  };

  const stepLabels = ["Datos Personales", "Datos de Compra", "Documentos"];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  step >= s || isSuccess
                    ? "bg-gradient-orange text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s || isSuccess ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              <span className={`text-xs mt-1 hidden sm:block ${step >= s ? 'text-white' : 'text-muted-foreground'}`}>
                {stepLabels[s - 1]}
              </span>
            </div>
            {s < 3 && (
              <div
                className={`w-8 sm:w-12 h-1 mx-2 rounded transition-all ${
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
        {/* STEP 1: Personal Data */}
        {step === 1 && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-orange mb-4">
                <User className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase mb-2">
                Paso 1: Datos Personales
              </h3>
              <p className="text-muted-foreground text-sm">
                Ingresa tus datos para participar
              </p>
            </div>

            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombreCompleto" className="text-white">Nombre Completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="nombreCompleto"
                    placeholder="Tu nombre completo"
                    value={formData.nombreCompleto}
                    onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                    className="pl-10 bg-muted/50 border-border text-white placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ci" className="text-white">Número de Cédula de Identidad *</Label>
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
                <Label htmlFor="email" className="text-white">Email *</Label>
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

              <div className="space-y-2">
                <Label htmlFor="telefono" className="text-white">Número de WhatsApp *</Label>
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
                <Label htmlFor="fechaNacimiento" className="text-white">Fecha de Nacimiento *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fechaNacimiento"
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="pl-10 bg-muted/50 border-border text-white placeholder:text-muted-foreground"
                    required
                  />
                </div>
                {ageError && (
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {ageError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-white">Ciudad *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                  <Select
                    value={formData.ciudad}
                    onValueChange={(value) => setFormData({ ...formData, ciudad: value })}
                  >
                    <SelectTrigger className="pl-10 bg-muted/50 border-border text-white">
                      <SelectValue placeholder="Selecciona tu ciudad" />
                    </SelectTrigger>
                    <SelectContent>
                      {departamentos.map((dep) => (
                        <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="button"
                onClick={nextStep}
                disabled={!isStep1Valid()}
                className="w-full bg-gradient-orange text-white font-bold uppercase tracking-wider py-6 hover:opacity-90"
              >
                Continuar al Paso 2
              </Button>
            </form>
          </>
        )}

        {/* STEP 2: Purchase Data */}
        {step === 2 && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-orange mb-4">
                <Tv className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase mb-2">
                Paso 2: Datos de Compra
              </h3>
              <p className="text-muted-foreground text-sm">
                Ingresa el serial de tu TV Skyworth
              </p>
            </div>

            <form className="space-y-6">
              {/* Serial Number Field */}
              <div className="space-y-2">
                <Label htmlFor="serialNumber" className="text-white text-lg font-bold">
                  Número de Serie *
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
                        <p className="text-2xl font-black text-gradient-orange">{serialValidation.couponCount}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Purchase Date */}
              <div className="space-y-2">
                <Label htmlFor="fechaCompra" className="text-white">Fecha de Compra *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fechaCompra"
                    type="date"
                    value={formData.fechaCompra}
                    onChange={(e) => setFormData({ ...formData, fechaCompra: e.target.value })}
                    className="pl-10 bg-muted/50 border-border text-white"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Debe coincidir con la fecha de tu factura o nota de venta.
                </p>
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
                  type="button"
                  onClick={nextStep}
                  disabled={!isStep2Valid()}
                  className="flex-1 bg-gradient-orange text-white font-bold uppercase tracking-wider hover:opacity-90"
                >
                  Continuar al Paso 3
                </Button>
              </div>
            </form>
          </>
        )}

        {/* STEP 3: Documents */}
        {step === 3 && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-orange mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase mb-2">
                Paso 3: Respaldo de Documentos
              </h3>
              <p className="text-muted-foreground text-sm">
                Sube los documentos requeridos para validar tu compra
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Invoice Upload */}
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Foto de Factura o Nota de Venta *
                </Label>
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${formData.factura ? 'border-green-500/50 bg-green-500/10' : 'border-border hover:border-primary bg-muted/20'}`}>
                  <input
                    type="file"
                    id="factura"
                    accept="image/*,.pdf"
                    onChange={handleFileChange('factura')}
                    className="hidden"
                  />
                  <label htmlFor="factura" className="cursor-pointer block">
                    {formData.factura ? (
                      <div className="flex items-center justify-center gap-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">{formData.factura.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-white font-medium text-sm">Clic para seleccionar</p>
                        <p className="text-muted-foreground text-xs">(JPG, PNG, PDF)</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Warranty Upload */}
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Foto de Póliza de Garantía debidamente llenada *
                </Label>
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${formData.poliza ? 'border-green-500/50 bg-green-500/10' : 'border-border hover:border-primary bg-muted/20'}`}>
                  <input
                    type="file"
                    id="poliza"
                    accept="image/*,.pdf"
                    onChange={handleFileChange('poliza')}
                    className="hidden"
                  />
                  <label htmlFor="poliza" className="cursor-pointer block">
                    {formData.poliza ? (
                      <div className="flex items-center justify-center gap-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">{formData.poliza.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-white font-medium text-sm">Clic para seleccionar</p>
                        <p className="text-muted-foreground text-xs">(JPG, PNG, PDF)</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Tag Upload */}
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Foto de TAG de Póliza de Garantía *
                </Label>
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${formData.tagPoliza ? 'border-green-500/50 bg-green-500/10' : 'border-border hover:border-primary bg-muted/20'}`}>
                  <input
                    type="file"
                    id="tagPoliza"
                    accept="image/*,.pdf"
                    onChange={handleFileChange('tagPoliza')}
                    className="hidden"
                  />
                  <label htmlFor="tagPoliza" className="cursor-pointer block">
                    {formData.tagPoliza ? (
                      <div className="flex items-center justify-center gap-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">{formData.tagPoliza.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-white font-medium text-sm">Clic para seleccionar</p>
                        <p className="text-muted-foreground text-xs">(JPG, PNG, PDF)</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="aceptaTerminos"
                    checked={formData.aceptaTerminos}
                    onCheckedChange={(checked) => setFormData({ ...formData, aceptaTerminos: checked as boolean })}
                    className="mt-1"
                  />
                  <label htmlFor="aceptaTerminos" className="text-sm text-yellow-200 cursor-pointer">
                    <span className="font-bold">Declaro que:</span> Los datos de compra coinciden con la fecha del documento emitido por el vendedor y con los datos de la póliza de garantía.
                  </label>
                </div>
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
                  disabled={!isStep3Valid() || isLoading}
                  className="flex-1 bg-gradient-orange text-white font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Registro"
                  )}
                </Button>
              </div>
            </form>
          </>
        )}

        {/* SUCCESS STEP */}
        {step === 4 && isSuccess && (
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
              ¡Registro Enviado!
            </h3>
            <p className="text-muted-foreground mb-6">
              Tu registro ha sido recibido y está en proceso de validación.
            </p>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8">
              <Gift className="w-10 h-10 text-blue-400 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">¿Qué sigue?</p>
              <p className="text-sm text-muted-foreground">
                Una vez que validemos tu compra, recibirás tus <span className="text-primary font-bold">CUPONES</span> por Email y/o WhatsApp.
              </p>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 mb-8 border border-border">
              <div className="flex items-center justify-center gap-4">
                <Trophy className="w-8 h-8 text-primary" />
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">Cupones potenciales</p>
                  <p className="text-3xl font-black text-gradient-orange">{serialValidation.couponCount || 1}</p>
                </div>
              </div>
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
