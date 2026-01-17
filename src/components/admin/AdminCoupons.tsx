import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Ticket, Search, Gift, Users } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  owner_type: 'BUYER' | 'SELLER';
  status: string;
  created_at: string;
  serial_id: string | null;
  buyer_purchase_id: string | null;
  seller_sale_id: string | null;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'all', search: '' });
  const [stats, setStats] = useState({ total: 0, active: 0, used: 0 });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      // ONLY load BUYER coupons - sellers don't get coupons
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('owner_type', 'BUYER')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const allCoupons = data || [];
      setCoupons(allCoupons);

      setStats({
        total: allCoupons.length,
        active: allCoupons.filter(c => c.status === 'ACTIVE').length,
        used: allCoupons.filter(c => c.status === 'USED').length
      });
    } catch (error) {
      console.error('Error loading coupons:', error);
      toast.error('Error al cargar cupones');
    } finally {
      setLoading(false);
    }
  };

  const filteredCoupons = coupons.filter(coupon => {
    if (filter.status !== 'all' && coupon.status !== filter.status) return false;
    if (filter.search && !coupon.code.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

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
        <h2 className="text-2xl font-bold text-foreground">Cupones de Compradores</h2>
        <p className="text-muted-foreground">Cupones generados por compras registradas</p>
      </div>

      {/* Stats - Only buyer coupons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Gift className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-500">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Cupones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Ticket className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-500">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/20">
                <Users className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-500">{stats.used}</p>
                <p className="text-sm text-muted-foreground">Usados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info banner */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="py-4">
          <p className="text-sm text-blue-400 flex items-center gap-2">
            <Gift className="h-4 w-4" />
            <span>Los cupones son generados únicamente para <strong>compradores</strong>. Los vendedores acumulan puntos, no cupones.</span>
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label>Buscar código</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  placeholder="Buscar..."
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={filter.status} onValueChange={(value) => setFilter({ ...filter, status: value })}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="USED">Usado</SelectItem>
                  <SelectItem value="EXPIRED">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-bold">Código</TableHead>
                <TableHead className="font-bold">Estado</TableHead>
                <TableHead className="font-bold">Fecha de Creación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No hay cupones de compradores
                  </TableCell>
                </TableRow>
              ) : (
                filteredCoupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          coupon.status === 'ACTIVE' ? 'default' : 
                          coupon.status === 'USED' ? 'secondary' : 'destructive'
                        }
                        className={
                          coupon.status === 'ACTIVE' ? 'bg-green-500 hover:bg-green-600' :
                          coupon.status === 'USED' ? 'bg-gray-500' : ''
                        }
                      >
                        {coupon.status === 'ACTIVE' ? 'Activo' : 
                         coupon.status === 'USED' ? 'Usado' : coupon.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(coupon.created_at).toLocaleDateString()}</TableCell>
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
