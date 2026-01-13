import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Ticket, Search } from 'lucide-react';

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
  const [filter, setFilter] = useState({ owner_type: 'all', status: 'all', search: '' });
  const [stats, setStats] = useState({ total: 0, active: 0, used: 0, buyers: 0, sellers: 0 });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const allCoupons = data || [];
      setCoupons(allCoupons);

      setStats({
        total: allCoupons.length,
        active: allCoupons.filter(c => c.status === 'ACTIVE').length,
        used: allCoupons.filter(c => c.status === 'USED').length,
        buyers: allCoupons.filter(c => c.owner_type === 'BUYER').length,
        sellers: allCoupons.filter(c => c.owner_type === 'SELLER').length
      });
    } catch (error) {
      console.error('Error loading coupons:', error);
      toast.error('Error al cargar cupones');
    } finally {
      setLoading(false);
    }
  };

  const filteredCoupons = coupons.filter(coupon => {
    if (filter.owner_type !== 'all' && coupon.owner_type !== filter.owner_type) return false;
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
        <h2 className="text-2xl font-bold text-foreground">Cupones</h2>
        <p className="text-muted-foreground">Cupones generados por compras y ventas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-500">{stats.used}</p>
              <p className="text-sm text-muted-foreground">Usados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-500">{stats.buyers}</p>
              <p className="text-sm text-muted-foreground">Compradores</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-500">{stats.sellers}</p>
              <p className="text-sm text-muted-foreground">Vendedores</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
              <Label>Tipo</Label>
              <Select value={filter.owner_type} onValueChange={(value) => setFilter({ ...filter, owner_type: value })}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="BUYER">Comprador</SelectItem>
                  <SelectItem value="SELLER">Vendedor</SelectItem>
                </SelectContent>
              </Select>
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
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No hay cupones
                  </TableCell>
                </TableRow>
              ) : (
                filteredCoupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                    <TableCell>
                      <Badge variant={coupon.owner_type === 'BUYER' ? 'default' : 'secondary'}>
                        {coupon.owner_type === 'BUYER' ? 'Comprador' : 'Vendedor'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          coupon.status === 'ACTIVE' ? 'default' : 
                          coupon.status === 'USED' ? 'secondary' : 'destructive'
                        }
                      >
                        {coupon.status}
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
