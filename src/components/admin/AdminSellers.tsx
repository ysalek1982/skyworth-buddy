import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Search, Ban, CheckCircle } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vendedores</h2>
          <p className="text-muted-foreground">{sellers.length} vendedores registrados</p>
        </div>
      </div>

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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Tienda</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Puntos</TableHead>
                <TableHead>Ventas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No hay vendedores
                  </TableCell>
                </TableRow>
              ) : (
                filteredSellers.map((seller, index) => (
                  <TableRow key={seller.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{seller.store_name}</TableCell>
                    <TableCell>{seller.store_city}</TableCell>
                    <TableCell>{seller.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{seller.total_points.toLocaleString()}</Badge>
                    </TableCell>
                    <TableCell>{seller.total_sales}</TableCell>
                    <TableCell>
                      <Badge variant={seller.is_active ? 'default' : 'destructive'}>
                        {seller.is_active ? 'Activo' : 'Bloqueado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggleActive(seller)}
                        title={seller.is_active ? 'Bloquear' : 'Activar'}
                      >
                        {seller.is_active ? (
                          <Ban className="h-4 w-4 text-destructive" />
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
