import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, Ticket, Barcode, TrendingUp, Star, Trophy, UserCheck, Store } from 'lucide-react';

interface DashboardStats {
  totalClients: number;
  totalSellers: number;
  totalCoupons: number;
  activeCoupons: number;
  totalSerials: number;
  buyerRegisteredSerials: number;
  sellerRegisteredSerials: number;
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
        topSellerRes
      ] = await Promise.all([
        supabase.from('client_purchases').select('id', { count: 'exact', head: true }),
        supabase.from('sellers').select('id, total_points', { count: 'exact' }),
        supabase.from('coupons').select('id, status').eq('owner_type', 'BUYER'),
        supabase.from('tv_serials').select('id, buyer_status, seller_status'),
        supabase.from('sellers').select('store_name, total_points').order('total_points', { ascending: false }).limit(1).single()
      ]);

      const coupons = couponsRes.data || [];
      const serials = serialsRes.data || [];
      const sellers = sellersRes.data || [];
      
      const totalSellerPoints = sellers.reduce((sum, s) => sum + (s.total_points || 0), 0);

      setStats({
        totalClients: clientsRes.count || 0,
        totalSellers: sellersRes.count || 0,
        totalCoupons: coupons.length,
        activeCoupons: coupons.filter(c => c.status === 'ACTIVE').length,
        totalSerials: serials.length,
        buyerRegisteredSerials: serials.filter(s => s.buyer_status === 'REGISTERED').length,
        sellerRegisteredSerials: serials.filter(s => s.seller_status === 'REGISTERED').length,
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
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      bgColor: 'from-blue-50 to-blue-100/50',
      borderColor: 'border-blue-200',
      valueColor: 'text-blue-700'
    },
    {
      title: 'Vendedores',
      value: stats.totalSellers,
      description: 'Vendedores activos',
      icon: TrendingUp,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      bgColor: 'from-green-50 to-green-100/50',
      borderColor: 'border-green-200',
      valueColor: 'text-green-700'
    },
    {
      title: 'Cupones',
      value: stats.activeCoupons,
      description: `${stats.totalCoupons} totales`,
      icon: Ticket,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      bgColor: 'from-purple-50 to-purple-100/50',
      borderColor: 'border-purple-200',
      valueColor: 'text-purple-700'
    },
    {
      title: 'Puntos Vendedores',
      value: stats.totalSellerPoints,
      description: 'Puntos acumulados',
      icon: Star,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      bgColor: 'from-amber-50 to-amber-100/50',
      borderColor: 'border-amber-200',
      valueColor: 'text-amber-700'
    },
    {
      title: 'Reg. Compradores',
      value: stats.buyerRegisteredSerials,
      description: `de ${stats.totalSerials} seriales`,
      icon: UserCheck,
      iconColor: 'text-cyan-600',
      iconBg: 'bg-cyan-100',
      bgColor: 'from-cyan-50 to-cyan-100/50',
      borderColor: 'border-cyan-200',
      valueColor: 'text-cyan-700'
    },
    {
      title: 'Reg. Vendedores',
      value: stats.sellerRegisteredSerials,
      description: `de ${stats.totalSerials} seriales`,
      icon: Store,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-100',
      bgColor: 'from-rose-50 to-rose-100/50',
      borderColor: 'border-rose-200',
      valueColor: 'text-rose-700'
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
          <Card key={index} className={`bg-gradient-to-br ${stat.bgColor} ${stat.borderColor} border`}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-3 text-gray-700 font-medium">
                <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} strokeWidth={2} />
                </div>
                <span className="text-sm font-semibold">{stat.title}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${stat.valueColor}`}>
                {stat.value.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Seller Card */}
      {stats.topSeller && (
        <Card className="bg-gradient-to-br from-amber-50 to-orange-100/50 border border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <Trophy className="h-5 w-5 text-amber-600" />
              Top Vendedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-gray-800">{stats.topSeller.name}</p>
                <p className="text-gray-600">Líder del ranking</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-amber-600">{stats.topSeller.points.toLocaleString()}</p>
                <p className="text-sm text-gray-600">puntos</p>
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
