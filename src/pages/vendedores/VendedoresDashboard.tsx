import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import SellerLayout from '@/components/layout/SellerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Package, 
  TrendingUp, 
  Plus,
  Loader2,
  MapPin,
  Phone,
  Star,
  CheckCircle,
  AlertCircle,
  Upload,
  Calendar,
  Camera,
  FileText,
  X,
  HelpCircle
} from 'lucide-react';
import { normalizeSerial, validateSerialFormat, SERIAL_EXAMPLE } from '@/lib/serialUtils';
import SerialInputHelp from '@/components/ui/SerialInputHelp';

interface Seller {
  id: string;
  store_name: string;
  store_city: string;
  phone: string | null;
  total_points: number;
  total_sales: number;
  is_active: boolean;
}

interface Sale {
  id: string;
  serial_number: string;
  client_name: string;
  client_phone: string | null;
  sale_date: string;
  points_earned: number;
  created_at: string;
  status?: string | null;
  rejection_reason?: string | null;
}

interface SerialValidation {
  status: 'idle' | 'checking' | 'valid' | 'invalid' | 'registered';
  message: string;
  productName?: string;
  points?: number;
}

interface FileUpload {
  file: File | null;
  preview: string | null;
  uploading: boolean;
}

function DashboardContent() {
  const { user } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [ranking, setRanking] = useState<{ position: number; total: number }>({ position: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [registeringSerial, setRegisteringSerial] = useState(false);
  const [serialValidation, setSerialValidation] = useState<SerialValidation>({ status: 'idle', message: '' });
  const [campaignInfo, setCampaignInfo] = useState<{ name: string; drawDate: string } | null>(null);
  
  // Modal for rejection reason
  const [rejectionModal, setRejectionModal] = useState<{ open: boolean; sale: Sale | null }>({ open: false, sale: null });
  
  // File upload refs
  const warrantyTagRef = useRef<HTMLInputElement>(null);
  const warrantyPolicyRef = useRef<HTMLInputElement>(null);
  const invoicePhotoRef = useRef<HTMLInputElement>(null);
  
  // File upload states
  const [warrantyTagFile, setWarrantyTagFile] = useState<FileUpload>({ file: null, preview: null, uploading: false });
  const [warrantyPolicyFile, setWarrantyPolicyFile] = useState<FileUpload>({ file: null, preview: null, uploading: false });
  const [invoicePhotoFile, setInvoicePhotoFile] = useState<FileUpload>({ file: null, preview: null, uploading: false });
  
  const [serialForm, setSerialForm] = useState({
    serial_number: '',
    client_name: '',
    client_phone: '',
    invoice_number: '',
    sale_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user) {
      loadSellerData();
    }
  }, [user]);

  const loadSellerData = async () => {
    if (!user) return;
    
    try {
      // Fetch campaign info from landing_settings
      const { data: landingData } = await supabase
        .from('landing_settings')
        .select('campaign_name, draw_date')
        .eq('is_active', true)
        .maybeSingle();

      if (landingData) {
        setCampaignInfo({
          name: landingData.campaign_name,
          drawDate: landingData.draw_date
        });
      }

      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (sellerError) throw sellerError;
      setSeller(sellerData);

      const { data: salesData, error: salesError } = await supabase
        .from('seller_sales')
        .select('*')
        .eq('seller_id', sellerData.id)
        .order('created_at', { ascending: false });

      if (!salesError && salesData) {
        setSales(salesData);
      }

      // Get ranking position based on POINTS only
      const { data: allSellers, error: rankError } = await supabase
        .from('sellers')
        .select('id, total_points')
        .eq('is_active', true)
        .order('total_points', { ascending: false });

      if (!rankError && allSellers) {
        const position = allSellers.findIndex(s => s.id === sellerData.id) + 1;
        setRanking({ position, total: allSellers.length });
      }

    } catch (error) {
      console.error('Error loading seller data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Validate serial in real-time with normalization
  const validateSerial = async (serialNumber: string) => {
    // Normalize the serial before validation
    const normalizedSerial = normalizeSerial(serialNumber);
    
    // Only validate if there's something to validate
    if (!normalizedSerial) {
      setSerialValidation({ status: 'idle', message: '' });
      return;
    }

    // Check format first (only alphanumeric, no length check)
    const formatCheck = validateSerialFormat(normalizedSerial);
    if (formatCheck.error) {
      setSerialValidation({ status: 'invalid', message: formatCheck.error });
      return;
    }

    setSerialValidation({ status: 'checking', message: 'Verificando serial...' });

    try {
      const { data, error } = await supabase
        .from('tv_serials')
        .select(`
          id,
          serial_number,
          status,
          seller_status,
          campaign_type,
          product_id,
          products (
            model_name,
            points_value,
            tier
          )
        `)
        .eq('serial_number', normalizedSerial)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setSerialValidation({ 
          status: 'invalid', 
          message: 'Serial no encontrado en la base de datos. Verifica que lo hayas ingresado correctamente.' 
        });
        return;
      }

      if (data.status === 'BLOCKED') {
        setSerialValidation({ 
          status: 'invalid', 
          message: 'Este serial está bloqueado y no puede participar en la promoción.' 
        });
        return;
      }

      // Check if LEGACY - sellers cannot register LEGACY serials
      if (data.campaign_type === 'LEGACY') {
        setSerialValidation({ 
          status: 'invalid', 
          message: 'Este serial pertenece a campañas anteriores y solo puede ser registrado por participantes finales (compradores).' 
        });
        return;
      }

      if (data.seller_status === 'REGISTERED') {
        setSerialValidation({ 
          status: 'registered', 
          message: 'Este serial ya fue registrado por otro vendedor.' 
        });
        return;
      }

      const product = data.products as any;
      setSerialValidation({ 
        status: 'valid', 
        message: `¡Serial válido! Producto: ${product?.model_name || 'Desconocido'}`,
        productName: product?.model_name,
        points: product?.points_value || 10
      });
    } catch (error) {
      console.error('Error validating serial:', error);
      setSerialValidation({ 
        status: 'invalid', 
        message: 'Error al validar el serial. Intenta nuevamente.' 
      });
    }
  };

  const handleSerialChange = (value: string) => {
    // Auto-normalize: remove dashes, spaces, uppercase
    const normalized = normalizeSerial(value);
    setSerialForm({ ...serialForm, serial_number: normalized });
    // Debounce validation
    const timeoutId = setTimeout(() => validateSerial(normalized), 500);
    return () => clearTimeout(timeoutId);
  };

  // Handle file selection
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<FileUpload>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo no debe superar 5MB');
        return;
      }
      const preview = URL.createObjectURL(file);
      setFile({ file, preview, uploading: false });
    }
  };

  // Upload file to storage
  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${seller?.id}/${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('seller-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('seller-documents')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  // Clear file
  const clearFile = (setFile: React.Dispatch<React.SetStateAction<FileUpload>>) => {
    setFile({ file: null, preview: null, uploading: false });
  };

  const handleRegisterSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller) return;

    if (serialValidation.status !== 'valid') {
      toast.error('Por favor ingresa un serial válido');
      return;
    }

    // Validate required files
    if (!warrantyTagFile.file) {
      toast.error('Debes subir la foto del TAG de póliza de garantía');
      return;
    }
    if (!warrantyPolicyFile.file) {
      toast.error('Debes subir la foto de la Póliza de Garantía');
      return;
    }
    if (!invoicePhotoFile.file) {
      toast.error('Debes subir la foto de la factura o nota de venta');
      return;
    }

    setRegisteringSerial(true);
    try {
      // Upload files
      const [warrantyTagUrl, warrantyPolicyUrl, invoicePhotoUrl] = await Promise.all([
        uploadFile(warrantyTagFile.file, 'warranty-tags'),
        uploadFile(warrantyPolicyFile.file, 'warranty-policies'),
        uploadFile(invoicePhotoFile.file, 'invoices')
      ]);

      if (!warrantyTagUrl || !warrantyPolicyUrl || !invoicePhotoUrl) {
        throw new Error('Error al subir los documentos');
      }

      const { data, error } = await supabase.rpc('rpc_register_seller_serial', {
        p_seller_id: seller.id,
        p_serial_number: serialForm.serial_number,
        p_client_name: serialForm.client_name,
        p_client_phone: serialForm.client_phone || null,
        p_invoice_number: serialForm.invoice_number || null,
        p_sale_date: serialForm.sale_date
      });

      if (error) throw error;

      const result = data as any;
      if (!result.success) {
        throw new Error(result.error || 'Error al registrar');
      }

      // Attach document URLs using secure RPC (bypasses RLS)
      if (result.sale_id) {
        const { error: attachError } = await supabase.rpc('rpc_attach_seller_documents', {
          p_sale_id: result.sale_id,
          p_warranty_tag_url: warrantyTagUrl,
          p_warranty_policy_url: warrantyPolicyUrl,
          p_invoice_photo_url: invoicePhotoUrl,
        });
        if (attachError) {
          console.warn('Error attaching seller documents:', attachError);
        }
      }

      toast.success(`¡Venta registrada! Queda pendiente de aprobación para sumar puntos.`);
      setSerialForm({ 
        serial_number: '', 
        client_name: '', 
        client_phone: '', 
        invoice_number: '',
        sale_date: new Date().toISOString().split('T')[0]
      });
      setSerialValidation({ status: 'idle', message: '' });
      clearFile(setWarrantyTagFile);
      clearFile(setWarrantyPolicyFile);
      clearFile(setInvoicePhotoFile);
      loadSellerData();
    } catch (error: any) {
      console.error('Error registering serial:', error);
      toast.error(error.message || 'Error al registrar el serial');
    } finally {
      setRegisteringSerial(false);
    }
  };

  const getSerialInputClass = () => {
    switch (serialValidation.status) {
      case 'valid': return 'serial-valid';
      case 'invalid': 
      case 'registered': return 'serial-invalid';
      case 'checking': return 'serial-checking';
      default: return '';
    }
  };

  if (loading) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SellerLayout>
    );
  }

  if (!seller) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center py-20">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>No eres vendedor</CardTitle>
              <CardDescription>
                Debes registrarte como vendedor para acceder al dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/ventas/registro">Registrarme como Vendedor</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            ¡Hola, {seller.store_name}!
          </h1>
          <div className="flex flex-wrap gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {seller.store_city}
            </span>
            {seller.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {seller.phone}
              </span>
            )}
          </div>
        </motion.div>

        {/* Stats Cards - ONLY POINTS, NO COUPONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Ranking Nacional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-500">#{ranking.position}</p>
                <p className="text-sm text-muted-foreground">de {ranking.total} vendedores</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-green-500" />
                  Puntos Totales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-500">{seller.total_points.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">puntos acumulados</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  Ventas Totales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-500">{seller.total_sales}</p>
                <p className="text-sm text-muted-foreground">TVs vendidos</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs Section - NO COUPONS TAB */}
        <Tabs defaultValue="register" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-flex">
            <TabsTrigger value="register">Registrar Venta</TabsTrigger>
            <TabsTrigger value="sales">Mis Ventas</TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <Card className="bg-slate-800/90 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Plus className="h-5 w-5" />
                  Registrar Nueva Venta
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Ingresa el serial del TV vendido para ganar puntos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegisterSerial} className="space-y-6">
                  {/* Serial Number - First and most important field */}
                  <div className="space-y-2">
                    <Label htmlFor="serial_number" className="text-base font-semibold text-white">
                      N° Serie del TV *
                    </Label>
                    <Input
                      id="serial_number"
                      value={serialForm.serial_number}
                      onChange={(e) => handleSerialChange(e.target.value)}
                      placeholder="Ingresa el número de serie"
                      className={`bg-slate-900 border-slate-600 text-white placeholder:text-slate-400 font-mono tracking-wider text-lg ${getSerialInputClass()}`}
                      required
                    />
                    
                    {/* Help text for serial - high contrast */}
                    <SerialInputHelp variant="dark" />
                    
                    {/* Validation message */}
                    {serialValidation.status !== 'idle' && (
                      <div className={`flex items-center gap-2 text-sm mt-2 ${
                        serialValidation.status === 'valid' ? 'text-green-400' :
                        serialValidation.status === 'checking' ? 'text-blue-400' : 'text-red-400'
                      }`}>
                        {serialValidation.status === 'valid' && <CheckCircle className="h-4 w-4" />}
                        {serialValidation.status === 'checking' && <Loader2 className="h-4 w-4 animate-spin" />}
                        {(serialValidation.status === 'invalid' || serialValidation.status === 'registered') && <AlertCircle className="h-4 w-4" />}
                        <span>{serialValidation.message}</span>
                        {serialValidation.points && (
                          <Badge variant="outline" className="ml-2 text-green-400 border-green-500 bg-green-500/10">
                            +{serialValidation.points} puntos
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sale Date with Range Validation */}
                  <div className="space-y-2">
                    <Label htmlFor="sale_date" className="text-base font-semibold text-white flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha de Venta *
                    </Label>
                    <Input
                      id="sale_date"
                      type="date"
                      value={serialForm.sale_date}
                      onChange={(e) => setSerialForm({ ...serialForm, sale_date: e.target.value })}
                      className="bg-slate-900 border-slate-600 text-white"
                      required
                      min="2026-01-22"
                      max="2026-03-07"
                    />
                    <p className="text-xs text-slate-400">
                      Válido: 22 de enero - 7 de marzo de 2026.
                    </p>
                  </div>

                  {/* Document Uploads Section */}
                  <div className="border-t border-slate-600 pt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                      <Camera className="h-5 w-5" />
                      Documentos Requeridos
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Los documentos deben coincidir con el número de serie y fecha de venta
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Warranty Tag Photo */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-200">TAG de Póliza de Garantía *</Label>
                        <input
                          ref={warrantyTagRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileSelect(e, setWarrantyTagFile)}
                        />
                        {warrantyTagFile.preview ? (
                          <div className="relative">
                            <img 
                              src={warrantyTagFile.preview} 
                              alt="TAG Preview" 
                              className="w-full h-32 object-cover rounded-lg border border-border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() => clearFile(setWarrantyTagFile)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-32 flex flex-col items-center justify-center gap-2 border-dashed border-slate-600 bg-slate-900/50 hover:bg-slate-800"
                            onClick={() => warrantyTagRef.current?.click()}
                          >
                            <Upload className="h-8 w-8 text-slate-400" />
                            <span className="text-xs text-slate-400">Subir foto del TAG</span>
                          </Button>
                        )}
                      </div>

                      {/* Warranty Policy Photo */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-200">Póliza de Garantía *</Label>
                        <input
                          ref={warrantyPolicyRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileSelect(e, setWarrantyPolicyFile)}
                        />
                        {warrantyPolicyFile.preview ? (
                          <div className="relative">
                            <img 
                              src={warrantyPolicyFile.preview} 
                              alt="Policy Preview" 
                              className="w-full h-32 object-cover rounded-lg border border-slate-600"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() => clearFile(setWarrantyPolicyFile)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-32 flex flex-col items-center justify-center gap-2 border-dashed border-slate-600 bg-slate-900/50 hover:bg-slate-800"
                            onClick={() => warrantyPolicyRef.current?.click()}
                          >
                            <FileText className="h-8 w-8 text-slate-400" />
                            <span className="text-xs text-slate-400">Subir póliza</span>
                          </Button>
                        )}
                      </div>

                      {/* Invoice Photo */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-200">Factura / Nota de Venta *</Label>
                        <input
                          ref={invoicePhotoRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileSelect(e, setInvoicePhotoFile)}
                        />
                        {invoicePhotoFile.preview ? (
                          <div className="relative">
                            <img 
                              src={invoicePhotoFile.preview} 
                              alt="Invoice Preview" 
                              className="w-full h-32 object-cover rounded-lg border border-slate-600"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() => clearFile(setInvoicePhotoFile)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-32 flex flex-col items-center justify-center gap-2 border-dashed border-slate-600 bg-slate-900/50 hover:bg-slate-800"
                            onClick={() => invoicePhotoRef.current?.click()}
                          >
                            <Upload className="h-8 w-8 text-slate-400" />
                            <span className="text-xs text-slate-400">Subir factura</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={registeringSerial || serialValidation.status !== 'valid'} 
                    className="w-full md:w-auto bg-primary hover:bg-primary/90"
                  >
                    {registeringSerial ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Registrar Venta
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Ventas</CardTitle>
                <CardDescription>
                  Tus ventas registradas (los puntos solo se suman cuando el administrador aprueba la venta)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sales.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No tienes ventas registradas aún</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((sale) => {
                        const status = (sale.status ?? 'PENDING').toString().toUpperCase();
                        
                        return (
                          <TableRow key={sale.id}>
                            <TableCell className="font-mono">{sale.serial_number}</TableCell>
                            <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              {status === 'APPROVED' && (
                                <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30">
                                  +{sale.points_earned} pts
                                </Badge>
                              )}
                              {status === 'REJECTED' && (
                                <Badge 
                                  variant="destructive" 
                                  className="cursor-pointer hover:opacity-80"
                                  onClick={() => setRejectionModal({ open: true, sale })}
                                >
                                  Rechazada ⓘ
                                </Badge>
                              )}
                              {status === 'PENDING' && (
                                <Badge variant="secondary">Pendiente</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rejection Reason Modal */}
          {rejectionModal.open && rejectionModal.sale && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full"
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Venta Rechazada</h3>
                      <p className="text-sm text-muted-foreground">Serial: {rejectionModal.sale.serial_number}</p>
                    </div>
                  </div>
                  
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-foreground mb-1">Motivo del rechazo:</p>
                    <p className="text-sm text-muted-foreground">
                      {rejectionModal.sale.rejection_reason || 'No se especificó motivo'}
                    </p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    El serial ha sido liberado. Puedes volver a registrarlo con la documentación correcta.
                  </p>
                  
                  <Button 
                    className="w-full"
                    onClick={() => setRejectionModal({ open: false, sale: null })}
                  >
                    Entendido
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </Tabs>
      </div>
    </SellerLayout>
  );
}

export default function VendedoresDashboard() {
  return (
    <ProtectedRoute requiredRole="seller">
      <DashboardContent />
    </ProtectedRoute>
  );
}
