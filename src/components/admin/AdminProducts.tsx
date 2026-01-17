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
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Gift, Star } from 'lucide-react';

interface Product {
  id: string;
  model_name: string;
  model_key: string | null;
  description: string | null;
  tier: string;
  ticket_multiplier: number;
  coupon_multiplier: number | null;
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
        coupon_multiplier: ticketMultiplier,
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

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'T1': return 'bg-amber-500 text-white';
      case 'T2': return 'bg-blue-500 text-white';
      case 'T3': return 'bg-slate-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCouponBadgeColor = (count: number) => {
    if (count >= 4) return 'bg-amber-500 text-white';
    if (count >= 3) return 'bg-orange-500 text-white';
    if (count >= 2) return 'bg-blue-500 text-white';
    return 'bg-slate-500 text-white';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Productos</h2>
          <p className="text-muted-foreground">Gestiona los TVs Skyworth y sus cupones</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Modifica los datos del producto' : 'Agrega un nuevo TV Skyworth'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  Información del Producto
                </h4>
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="model_key">Clave Interna</Label>
                    <Input
                      id="model_key"
                      value={form.model_key}
                      onChange={(e) => setForm({ ...form, model_key: e.target.value })}
                      placeholder="Ej: Q7500G_65_75"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Pulgadas / Descripción</Label>
                    <Input
                      id="description"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder='Ej: 65", 75"'
                    />
                  </div>
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
                </div>
              </div>

              <Separator />

              {/* Coupon Configuration - BUYER ONLY */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Gift className="w-4 h-4 text-primary" />
                  Configuración de Cupones (Comprador)
                </h4>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="space-y-2">
                    <Label htmlFor="ticket_multiplier" className="font-medium">
                      Nro de Cupones *
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Cantidad de cupones que recibe el COMPRADOR al registrar este producto
                    </p>
                    <Select 
                      value={form.ticket_multiplier} 
                      onValueChange={(value) => setForm({ ...form, ticket_multiplier: value })}
                    >
                      <SelectTrigger className="w-full max-w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(n => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} cupón{n > 1 ? 'es' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Seller Points */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  Puntos Vendedor
                </h4>
                <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <div className="space-y-2">
                    <Label htmlFor="points_value" className="font-medium">
                      Puntos por venta *
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Puntos que acumula el VENDEDOR al registrar una venta (sin cupones)
                    </p>
                    <Input
                      id="points_value"
                      type="number"
                      value={form.points_value}
                      onChange={(e) => setForm({ ...form, points_value: e.target.value })}
                      className="w-full max-w-[200px]"
                      required
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-bold text-foreground">Modelo</TableHead>
                  <TableHead className="font-bold text-foreground">Pulgadas</TableHead>
                  <TableHead className="font-bold text-foreground text-center">Tier</TableHead>
                  <TableHead className="font-bold text-foreground text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Gift className="w-4 h-4" />
                      Cupones
                    </div>
                  </TableHead>
                  <TableHead className="font-bold text-foreground text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4" />
                      Puntos
                    </div>
                  </TableHead>
                  <TableHead className="font-bold text-foreground text-center">Estado</TableHead>
                  <TableHead className="font-bold text-foreground text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No hay productos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow 
                      key={product.id} 
                      className={`hover:bg-muted/30 ${!product.is_active ? 'opacity-50' : ''}`}
                    >
                      <TableCell className="font-semibold">
                        <div>
                          <span className="text-foreground">{product.model_name}</span>
                          {product.model_key && (
                            <span className="block text-xs text-muted-foreground mt-0.5">{product.model_key}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.description || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getTierColor(product.tier)}>
                          {product.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getCouponBadgeColor(product.ticket_multiplier)}>
                          {product.ticket_multiplier}x
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-amber-600">{product.points_value}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleEdit(product)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {product.is_active && (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => handleDelete(product.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
