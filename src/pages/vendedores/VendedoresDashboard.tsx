import { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';

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
}

interface SerialValidation {
  status: 'idle' | 'checking' | 'valid' | 'invalid' | 'registered';
  message: string;
  productName?: string;
  points?: number;
}

function DashboardContent() {
  const { user } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [ranking, setRanking] = useState<{ position: number; total: number }>({ position: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [registeringSerial, setRegisteringSerial] = useState(false);
  const [serialValidation, setSerialValidation] = useState<SerialValidation>({ status: 'idle', message: '' });
  
  const [serialForm, setSerialForm] = useState({
    serial_number: '',
    client_name: '',
    client_phone: '',
    invoice_number: ''
  });

  useEffect(() => {
    if (user) {
      loadSellerData();
    }
  }, [user]);

  const loadSellerData = async () => {
    if (!user) return;
    
    try {
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

  // Validate serial in real-time
  const validateSerial = async (serialNumber: string) => {
    if (!serialNumber || serialNumber.length < 3) {
      setSerialValidation({ status: 'idle', message: '' });
      return;
    }

    setSerialValidation({ status: 'checking', message: 'Verificando serial...' });

    try {
      const normalizedSerial = serialNumber.trim().toUpperCase();
      const { data, error } = await supabase
        .from('tv_serials')
        .select(`
          id,
          serial_number,
          status,
          seller_status,
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
          message: 'Serial no encontrado en la base de datos' 
        });
        return;
      }

      if (data.status === 'BLOCKED') {
        setSerialValidation({ 
          status: 'invalid', 
          message: 'Este serial está bloqueado' 
        });
        return;
      }

      if (data.seller_status === 'REGISTERED') {
        setSerialValidation({ 
          status: 'registered', 
          message: 'Este serial ya fue registrado por un vendedor' 
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
        message: 'Error al validar el serial' 
      });
    }
  };

  const handleSerialChange = (value: string) => {
    setSerialForm({ ...serialForm, serial_number: value });
    // Debounce validation
    const timeoutId = setTimeout(() => validateSerial(value), 500);
    return () => clearTimeout(timeoutId);
  };

  const handleRegisterSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller) return;

    if (serialValidation.status !== 'valid') {
      toast.error('Por favor ingresa un serial válido');
      return;
    }

    setRegisteringSerial(true);
    try {
      const { data, error } = await supabase.rpc('rpc_register_seller_serial', {
        p_seller_id: seller.id,
        p_serial_number: serialForm.serial_number,
        p_client_name: serialForm.client_name,
        p_client_phone: serialForm.client_phone || null,
        p_invoice_number: serialForm.invoice_number || null,
        p_sale_date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;

      const result = data as any;
      if (!result.success) {
        throw new Error(result.error || 'Error al registrar');
      }

      toast.success(`¡Venta registrada! +${result.points} puntos`);
      setSerialForm({ serial_number: '', client_name: '', client_phone: '', invoice_number: '' });
      setSerialValidation({ status: 'idle', message: '' });
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
              <Button onClick={() => window.location.href = '/vendedores/registro'}>
                Registrarme como Vendedor
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Registrar Nueva Venta
                </CardTitle>
                <CardDescription>
                  Ingresa el serial del TV vendido para ganar puntos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegisterSerial} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="serial_number">Número de Serial del TV *</Label>
                      <Input
                        id="serial_number"
                        value={serialForm.serial_number}
                        onChange={(e) => handleSerialChange(e.target.value)}
                        placeholder="Ej: SKW123456789"
                        className={getSerialInputClass()}
                        required
                      />
                      {serialValidation.status !== 'idle' && (
                        <div className={`flex items-center gap-2 text-sm ${
                          serialValidation.status === 'valid' ? 'text-green-500' :
                          serialValidation.status === 'checking' ? 'text-blue-500' : 'text-red-500'
                        }`}>
                          {serialValidation.status === 'valid' && <CheckCircle className="h-4 w-4" />}
                          {serialValidation.status === 'checking' && <Loader2 className="h-4 w-4 animate-spin" />}
                          {(serialValidation.status === 'invalid' || serialValidation.status === 'registered') && <AlertCircle className="h-4 w-4" />}
                          <span>{serialValidation.message}</span>
                          {serialValidation.points && (
                            <Badge variant="outline" className="ml-2 text-green-500 border-green-500">
                              +{serialValidation.points} puntos
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client_name">Nombre del Cliente *</Label>
                      <Input
                        id="client_name"
                        value={serialForm.client_name}
                        onChange={(e) => setSerialForm({ ...serialForm, client_name: e.target.value })}
                        placeholder="Nombre completo"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client_phone">Teléfono del Cliente</Label>
                      <Input
                        id="client_phone"
                        value={serialForm.client_phone}
                        onChange={(e) => setSerialForm({ ...serialForm, client_phone: e.target.value })}
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="invoice_number">Número de Factura</Label>
                      <Input
                        id="invoice_number"
                        value={serialForm.invoice_number}
                        onChange={(e) => setSerialForm({ ...serialForm, invoice_number: e.target.value })}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={registeringSerial || serialValidation.status !== 'valid'} 
                    className="w-full md:w-auto"
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
                <CardDescription>Todas tus ventas registradas y puntos ganados</CardDescription>
              </CardHeader>
              <CardContent>
                {sales.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No tienes ventas registradas aún</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Puntos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-mono">{sale.serial_number}</TableCell>
                          <TableCell>{sale.client_name}</TableCell>
                          <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                              +{sale.points_earned}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
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
