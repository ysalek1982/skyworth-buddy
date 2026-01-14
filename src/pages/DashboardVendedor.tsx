import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
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
  Ticket, 
  TrendingUp, 
  Plus,
  Loader2,
  MapPin,
  Phone
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

interface Coupon {
  id: string;
  code: string;
  status: string;
  created_at: string;
}

function DashboardContent() {
  const { user } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [ranking, setRanking] = useState<{ position: number; total: number }>({ position: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [registeringSerial, setRegisteringSerial] = useState(false);
  
  // Form state for registering serial
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
      // Get seller profile
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (sellerError) throw sellerError;
      setSeller(sellerData);

      // Get sales
      const { data: salesData, error: salesError } = await supabase
        .from('seller_sales')
        .select('*')
        .eq('seller_id', sellerData.id)
        .order('created_at', { ascending: false });

      if (!salesError && salesData) {
        setSales(salesData);
      }

      // Get coupons
      const { data: couponsData, error: couponsError } = await supabase
        .from('coupons')
        .select('*')
        .eq('owner_type', 'SELLER')
        .in('seller_sale_id', salesData?.map(s => s.id) || []);

      if (!couponsError && couponsData) {
        setCoupons(couponsData);
      }

      // Calculate ranking
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

  const handleRegisterSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller) return;

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

      toast.success('Serial registrado exitosamente');
      setSerialForm({ serial_number: '', client_name: '', client_phone: '', invoice_number: '' });
      loadSellerData();
    } catch (error: any) {
      console.error('Error registering serial:', error);
      toast.error(error.message || 'Error al registrar el serial');
    } finally {
      setRegisteringSerial(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No eres vendedor</CardTitle>
            <CardDescription>
              Debes registrarte como vendedor para acceder al dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/registro-vendedor'}>
              Registrarme como Vendedor
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            ¡Hola!
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Ranking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-500">
                  #{ranking.position}
                </p>
                <p className="text-sm text-muted-foreground">de {ranking.total} vendedores</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Puntos Totales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-500">
                  {seller.total_points.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">puntos acumulados</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  Ventas Totales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-500">
                  {seller.total_sales}
                </p>
                <p className="text-sm text-muted-foreground">TVs vendidos</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-purple-500" />
                  Cupones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-500">
                  {coupons.filter(c => c.status === 'ACTIVE').length}
                </p>
                <p className="text-sm text-muted-foreground">cupones activos</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="register" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="register">Registrar Venta</TabsTrigger>
            <TabsTrigger value="sales">Mis Ventas</TabsTrigger>
            <TabsTrigger value="coupons">Mis Cupones</TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Registrar Nueva Venta
                </CardTitle>
                <CardDescription>
                  Ingresa el serial del TV vendido para ganar puntos y cupones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegisterSerial} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="serial_number">Número de Serial *</Label>
                      <Input
                        id="serial_number"
                        value={serialForm.serial_number}
                        onChange={(e) => setSerialForm({ ...serialForm, serial_number: e.target.value })}
                        placeholder="Ej: SKW123456789"
                        required
                      />
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
                    <div className="space-y-2">
                      <Label htmlFor="invoice_number">Número de Factura</Label>
                      <Input
                        id="invoice_number"
                        value={serialForm.invoice_number}
                        onChange={(e) => setSerialForm({ ...serialForm, invoice_number: e.target.value })}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={registeringSerial} className="w-full md:w-auto">
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
                  Todas tus ventas registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sales.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No tienes ventas registradas aún
                  </p>
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
                            <Badge variant="secondary">+{sale.points_earned}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coupons">
            <Card>
              <CardHeader>
                <CardTitle>Mis Cupones</CardTitle>
                <CardDescription>
                  Cupones generados por tus ventas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {coupons.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No tienes cupones aún. ¡Registra ventas para obtenerlos!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coupons.map((coupon) => (
                      <Card key={coupon.id} className="bg-gradient-to-br from-primary/10 to-primary/5">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <Ticket className="h-8 w-8 mx-auto mb-2 text-primary" />
                            <p className="font-mono text-lg font-bold">{coupon.code}</p>
                            <Badge 
                              variant={coupon.status === 'ACTIVE' ? 'default' : 'secondary'}
                              className="mt-2"
                            >
                              {coupon.status === 'ACTIVE' ? 'Activo' : coupon.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

export default function DashboardVendedor() {
  return (
    <ProtectedRoute requiredRole="seller">
      <DashboardContent />
    </ProtectedRoute>
  );
}
