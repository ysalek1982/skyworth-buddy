import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, Ticket, Barcode, ShoppingCart, TrendingUp, Package, Star, Trophy } from 'lucide-react';

interface DashboardStats {
  totalClients: number;
  totalSellers: number;
  totalCoupons: number;
  activeCoupons: number;
  totalSerials: number;
  registeredSerials: number;
  totalPurchases: number;
  pendingPurchases: number;
  totalSales: number;
  totalSellerPoints: number;
  topSeller: { name: string; points: number } | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [
        clientsRes,
        sellersRes,
        couponsRes,
        serialsRes,
        purchasesRes,
        salesRes,
        topSellerRes
      ] = await Promise.all([
        supabase.from('client_purchases').select('id', { count: 'exact', head: true }),
        supabase.from('sellers').select('id, total_points', { count: 'exact' }),
        // Only count BUYER coupons
        supabase.from('coupons').select('id, status').eq('owner_type', 'BUYER'),
        supabase.from('tv_serials').select('id, buyer_status, seller_status'),
        supabase.from('client_purchases').select('id, admin_status'),
        supabase.from('seller_sales').select('id', { count: 'exact', head: true }),
        supabase.from('sellers').select('store_name, total_points').order('total_points', { ascending: false }).limit(1).single()
      ]);

      const coupons = couponsRes.data || [];
      const serials = serialsRes.data || [];
      const purchases = purchasesRes.data || [];
      const sellers = sellersRes.data || [];
      
      // Calculate total seller points
      const totalSellerPoints = sellers.reduce((sum, s) => sum + (s.total_points || 0), 0);

      setStats({
        totalClients: clientsRes.count || 0,
        totalSellers: sellersRes.count || 0,
        totalCoupons: coupons.length,
        activeCoupons: coupons.filter(c => c.status === 'ACTIVE').length,
        totalSerials: serials.length,
        registeredSerials: serials.filter(s => s.buyer_status === 'REGISTERED' || s.seller_status === 'REGISTERED').length,
        totalPurchases: purchases.length,
        // Backward compatible: older rows may have admin_status NULL (treat as PENDING)
        pendingPurchases: purchases.filter(p => !p.admin_status || p.admin_status === 'PENDING').length,
        totalSales: salesRes.count || 0,
        totalSellerPoints,
        topSeller: topSellerRes.data ? { name: topSellerRes.data.store_name, points: topSellerRes.data.total_points } : null
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Compradores',
      value: stats.totalClients,
      description: 'Compras registradas',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'from-blue-500/20 to-blue-600/10',
      borderColor: 'border-blue-500/30'
    },
    {
      title: 'Vendedores',
      value: stats.totalSellers,
      description: 'Vendedores activos',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'from-green-500/20 to-green-600/10',
      borderColor: 'border-green-500/30'
    },
    {
      title: 'Cupones Compradores',
      value: stats.activeCoupons,
      description: `${stats.totalCoupons} totales`,
      icon: Ticket,
      color: 'text-purple-500',
      bgColor: 'from-purple-500/20 to-purple-600/10',
      borderColor: 'border-purple-500/30'
    },
    {
      title: 'Puntos Vendedores',
      value: stats.totalSellerPoints,
      description: 'Puntos totales acumulados',
      icon: Star,
      color: 'text-amber-500',
      bgColor: 'from-amber-500/20 to-amber-600/10',
      borderColor: 'border-amber-500/30'
    },
    {
      title: 'Seriales',
      value: stats.registeredSerials,
      description: `${stats.totalSerials} totales`,
      icon: Barcode,
      color: 'text-cyan-500',
      bgColor: 'from-cyan-500/20 to-cyan-600/10',
      borderColor: 'border-cyan-500/30'
    },
    {
      title: 'Compras Pendientes',
      value: stats.pendingPurchases,
      description: `${stats.totalPurchases} totales`,
      icon: ShoppingCart,
      color: 'text-red-500',
      bgColor: 'from-red-500/20 to-red-600/10',
      borderColor: 'border-red-500/30'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className={`bg-gradient-to-br ${stat.bgColor} ${stat.borderColor}`}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                {stat.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${stat.color}`}>
                {stat.value.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Seller Card */}
      {stats.topSeller && (
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Top Vendedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-foreground">{stats.topSeller.name}</p>
                <p className="text-muted-foreground">Líder del ranking</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-amber-500">{stats.topSeller.points.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">puntos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info about business logic */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="py-4">
          <p className="text-sm text-blue-400">
            <strong>Modelo de negocio:</strong> Los compradores reciben cupones para el sorteo. Los vendedores acumulan puntos por cada venta registrada (sin cupones).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
