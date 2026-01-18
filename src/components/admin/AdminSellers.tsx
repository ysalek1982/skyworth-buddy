import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Search, Ban, CheckCircle, Trophy, Star, Users, TrendingUp } from 'lucide-react';

interface Seller {
  id: string;
  user_id: string;
  store_name: string;
  store_city: string;
  phone: string | null;
  total_points: number;
  total_sales: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminSellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .order('total_points', { ascending: false });

      if (error) throw error;
      setSellers(data || []);
    } catch (error) {
      console.error('Error loading sellers:', error);
      toast.error('Error al cargar vendedores');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (seller: Seller) => {
    try {
      const { error } = await supabase
        .from('sellers')
        .update({ is_active: !seller.is_active })
        .eq('id', seller.id);

      if (error) throw error;
      toast.success(`Vendedor ${seller.is_active ? 'bloqueado' : 'activado'}`);
      loadSellers();
    } catch (error) {
      console.error('Error toggling seller:', error);
      toast.error('Error al cambiar estado');
    }
  };

  const filteredSellers = sellers.filter(seller =>
    seller.store_name.toLowerCase().includes(search.toLowerCase()) ||
    seller.store_city.toLowerCase().includes(search.toLowerCase())
  );

  const totalPoints = sellers.reduce((sum, s) => sum + s.total_points, 0);
  const totalSales = sellers.reduce((sum, s) => sum + s.total_sales, 0);
  const activeSellers = sellers.filter(s => s.is_active).length;

  const getRankBadge = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-amber-500" />;
    if (index === 1) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Trophy className="h-5 w-5 text-orange-600" />;
    return <span className="w-5 text-center text-muted-foreground">{index + 1}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Vendedores</h2>
        <p className="text-muted-foreground">Ranking y gestión de vendedores (ordenado por puntos)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">{sellers.length}</p>
                <p className="text-sm text-muted-foreground">Total Vendedores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{activeSellers}</p>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/20">
                <Star className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500">{totalPoints.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Puntos Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-500">{totalSales}</p>
                <p className="text-sm text-muted-foreground">Ventas Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="py-4">
          <p className="text-sm text-amber-400 flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span>Los vendedores acumulan <strong>puntos</strong> por cada venta registrada. El ranking se ordena por puntos (no cupones).</span>
          </p>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por tienda o ciudad..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-700 hover:bg-slate-700 border-b border-slate-600">
                <TableHead className="font-bold text-white w-16">Rank</TableHead>
                <TableHead className="font-bold text-white">Tienda</TableHead>
                <TableHead className="font-bold text-white">Ciudad</TableHead>
                <TableHead className="font-bold text-white">Teléfono</TableHead>
                <TableHead className="font-bold text-white text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 text-amber-400" />
                    Puntos
                  </div>
                </TableHead>
                <TableHead className="font-bold text-white text-center">Ventas</TableHead>
                <TableHead className="font-bold text-white text-center">Estado</TableHead>
                <TableHead className="font-bold text-white text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground bg-white">
                    No hay vendedores
                  </TableCell>
                </TableRow>
              ) : (
                filteredSellers.map((seller, index) => (
                  <TableRow key={seller.id} className={`bg-white hover:bg-slate-50 border-b border-slate-200 ${!seller.is_active ? 'opacity-60' : ''}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center justify-center">
                        {getRankBadge(index)}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800">{seller.store_name}</TableCell>
                    <TableCell className="text-slate-600">{seller.store_city}</TableCell>
                    <TableCell className="text-slate-600">{seller.phone || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-amber-500 text-white">
                        {seller.total_points.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-slate-700 font-medium">{seller.total_sales}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={seller.is_active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                        {seller.is_active ? 'Activo' : 'Bloqueado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggleActive(seller)}
                        title={seller.is_active ? 'Bloquear' : 'Activar'}
                        className="h-8 w-8 text-slate-600 hover:text-slate-900"
                      >
                        {seller.is_active ? (
                          <Ban className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
