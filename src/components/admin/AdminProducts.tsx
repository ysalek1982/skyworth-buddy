import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Ticket } from 'lucide-react';

interface Product {
  id: string;
  model_name: string;
  model_key: string | null;
  description: string | null;
  tier: string;
  ticket_multiplier: number;
  coupon_multiplier: number | null;
  seller_coupon_multiplier: number | null;
  points_value: number;
  is_active: boolean;
  image_url: string | null;
}

const initialFormState = {
  model_name: '',
  model_key: '',
  description: '',
  tier: 'T1',
  ticket_multiplier: '1',
  seller_coupon_multiplier: '1',
  points_value: '10',
  image_url: ''
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('tier', { ascending: true })
        .order('ticket_multiplier', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const ticketMultiplier = parseInt(form.ticket_multiplier);
      const productData = {
        model_name: form.model_name,
        model_key: form.model_key || null,
        description: form.description || null,
        tier: form.tier,
        ticket_multiplier: ticketMultiplier,
        coupon_multiplier: ticketMultiplier, // Sync coupon_multiplier with ticket_multiplier
        seller_coupon_multiplier: parseInt(form.seller_coupon_multiplier),
        points_value: parseInt(form.points_value),
        image_url: form.image_url || null
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Producto actualizado');
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        toast.success('Producto creado');
      }

      setDialogOpen(false);
      setEditingProduct(null);
      setForm(initialFormState);
      loadProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Error al guardar producto');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      model_name: product.model_name,
      model_key: product.model_key || '',
      description: product.description || '',
      tier: product.tier,
      ticket_multiplier: product.ticket_multiplier.toString(),
      seller_coupon_multiplier: (product.seller_coupon_multiplier || 1).toString(),
      points_value: product.points_value.toString(),
      image_url: product.image_url || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de desactivar este producto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Producto desactivado');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al desactivar producto');
    }
  };

  const handleOpenDialog = () => {
    setEditingProduct(null);
    setForm(initialFormState);
    setDialogOpen(true);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Productos</h2>
          <p className="text-muted-foreground">Gestiona los TVs Skyworth y sus tickets</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Modifica los datos del producto' : 'Agrega un nuevo TV Skyworth'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model_name">Modelo *</Label>
                <Input
                  id="model_name"
                  value={form.model_name}
                  onChange={(e) => setForm({ ...form, model_name: e.target.value })}
                  placeholder="Ej: Q7500G"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model_key">Clave Única (interno)</Label>
                <Input
                  id="model_key"
                  value={form.model_key}
                  onChange={(e) => setForm({ ...form, model_key: e.target.value })}
                  placeholder="Ej: Q7500G_65_75"
                />
                <p className="text-xs text-muted-foreground">Identificador único para diferenciar variantes</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Pulgadas / Descripción</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder='Ej: 65", 75"'
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tier">Tier</Label>
                  <Select value={form.tier} onValueChange={(value) => setForm({ ...form, tier: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T1">T1 (Premium)</SelectItem>
                      <SelectItem value="T2">T2 (Mid)</SelectItem>
                      <SelectItem value="T3">T3 (Standard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points_value">Puntos Vendedor</Label>
                  <Input
                    id="points_value"
                    type="number"
                    value={form.points_value}
                    onChange={(e) => setForm({ ...form, points_value: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Ticket Multiplier - Main field */}
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <Ticket className="w-5 h-5" />
                  <span>Configuración de Tickets</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticket_multiplier" className="text-foreground font-medium">
                      Nro de Tickets (Comprador) *
                    </Label>
                    <Select 
                      value={form.ticket_multiplier} 
                      onValueChange={(value) => setForm({ ...form, ticket_multiplier: value })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(n => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} ticket{n > 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller_coupon_multiplier" className="text-foreground font-medium">
                      Nro de Tickets (Vendedor)
                    </Label>
                    <Select 
                      value={form.seller_coupon_multiplier} 
                      onValueChange={(value) => setForm({ ...form, seller_coupon_multiplier: value })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(n => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} ticket{n > 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modelo</TableHead>
                <TableHead>Pulgadas</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Ticket className="w-4 h-4" />
                    Nro Tickets
                  </div>
                </TableHead>
                <TableHead>Puntos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay productos registrados
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id} className={!product.is_active ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">
                      {product.model_name}
                      {product.model_key && (
                        <span className="block text-xs text-muted-foreground">{product.model_key}</span>
                      )}
                    </TableCell>
                    <TableCell>{product.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.tier}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Badge className="bg-primary text-primary-foreground">
                          {product.ticket_multiplier}x
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          / {product.seller_coupon_multiplier || 1}x
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{product.points_value}</TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {product.is_active && (
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
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