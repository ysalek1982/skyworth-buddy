import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Upload, Loader2, Lock, Unlock, Barcode, AlertCircle } from 'lucide-react';

interface Serial {
  id: string;
  serial_number: string;
  product_id: string | null;
  status: 'AVAILABLE' | 'BLOCKED';
  buyer_status: 'NOT_REGISTERED' | 'REGISTERED';
  seller_status: 'NOT_REGISTERED' | 'REGISTERED';
  created_at: string;
}

interface Product {
  id: string;
  model_name: string;
  tier: string;
}

export default function AdminSerials() {
  const [serials, setSerials] = useState<Serial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [form, setForm] = useState({ serial_number: '', product_id: '' });
  const [filter, setFilter] = useState({ status: 'all', product: 'all' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [serialsRes, productsRes] = await Promise.all([
        supabase.from('tv_serials').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('products').select('id, model_name, tier').eq('is_active', true)
      ]);

      if (serialsRes.error) throw serialsRes.error;
      if (productsRes.error) throw productsRes.error;

      setSerials(serialsRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase.from('tv_serials').insert({
        serial_number: form.serial_number,
        product_id: form.product_id || null
      });

      if (error) throw error;

      toast.success('Serial creado');
      setDialogOpen(false);
      setForm({ serial_number: '', product_id: '' });
      loadData();
    } catch (error: any) {
      console.error('Error creating serial:', error);
      toast.error(error.message || 'Error al crear serial');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      setCsvPreview(lines.slice(0, 10));
      setCsvDialogOpen(true);
    };
    reader.readAsText(file);
  };

  const handleCsvUpload = async () => {
    if (!fileInputRef.current?.files?.[0] || !selectedProduct) {
      toast.error('Selecciona un producto');
      return;
    }

    setSaving(true);
    try {
      const file = fileInputRef.current.files[0];
      const text = await file.text();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);

      const serialsToInsert = lines.map(serial_number => ({
        serial_number,
        product_id: selectedProduct
      }));

      const { error } = await supabase.from('tv_serials').insert(serialsToInsert);

      if (error) throw error;

      toast.success(`${lines.length} seriales importados`);
      setCsvDialogOpen(false);
      setCsvPreview([]);
      setSelectedProduct('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadData();
    } catch (error: any) {
      console.error('Error uploading CSV:', error);
      toast.error(error.message || 'Error al importar seriales');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (serial: Serial) => {
    try {
      const newStatus = serial.status === 'AVAILABLE' ? 'BLOCKED' : 'AVAILABLE';
      const { error } = await supabase
        .from('tv_serials')
        .update({ status: newStatus })
        .eq('id', serial.id);

      if (error) throw error;
      toast.success(`Serial ${newStatus === 'BLOCKED' ? 'bloqueado' : 'desbloqueado'}`);
      loadData();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Error al cambiar estado');
    }
  };

  const filteredSerials = serials.filter(serial => {
    if (filter.status !== 'all' && serial.status !== filter.status) return false;
    if (filter.product !== 'all' && serial.product_id !== filter.product) return false;
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Seriales TV</h2>
          <p className="text-muted-foreground">Gestiona los números de serie</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".csv,.txt"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Serial
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Serial</DialogTitle>
                <DialogDescription>Agrega un número de serie manualmente</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="serial_number">Número de Serie *</Label>
                  <Input
                    id="serial_number"
                    value={form.serial_number}
                    onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                    placeholder="Ej: SKW123456789"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_id">Producto</Label>
                  <Select value={form.product_id} onValueChange={(value) => setForm({ ...form, product_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.model_name} ({product.tier})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* CSV Preview Dialog */}
      <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar Seriales</DialogTitle>
            <DialogDescription>Vista previa de los primeros 10 seriales</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Producto para asignar</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.model_name} ({product.tier})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted rounded-lg p-4 max-h-48 overflow-auto">
              {csvPreview.map((serial, i) => (
                <div key={i} className="font-mono text-sm py-1">{serial}</div>
              ))}
              {csvPreview.length >= 10 && (
                <div className="text-muted-foreground text-sm">...y más</div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCsvDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCsvUpload} disabled={saving || !selectedProduct}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Importar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={filter.status} onValueChange={(value) => setFilter({ ...filter, status: value })}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="AVAILABLE">Disponible</SelectItem>
                  <SelectItem value="BLOCKED">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Producto</Label>
              <Select value={filter.product} onValueChange={(value) => setFilter({ ...filter, product: value })}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.model_name}
                    </SelectItem>
                  ))}
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
                <TableHead>Serial</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Comprador</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSerials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay seriales registrados
                  </TableCell>
                </TableRow>
              ) : (
                filteredSerials.map((serial) => (
                  <TableRow key={serial.id}>
                    <TableCell className="font-mono">{serial.serial_number}</TableCell>
                    <TableCell>
                      {products.find(p => p.id === serial.product_id)?.model_name || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={serial.status === 'AVAILABLE' ? 'default' : 'destructive'}>
                        {serial.status === 'AVAILABLE' ? 'Disponible' : 'Bloqueado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={serial.buyer_status === 'REGISTERED' ? 'default' : 'outline'}>
                        {serial.buyer_status === 'REGISTERED' ? 'Registrado' : 'No registrado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={serial.seller_status === 'REGISTERED' ? 'default' : 'outline'}>
                        {serial.seller_status === 'REGISTERED' ? 'Registrado' : 'No registrado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggleStatus(serial)}
                        title={serial.status === 'AVAILABLE' ? 'Bloquear' : 'Desbloquear'}
                      >
                        {serial.status === 'AVAILABLE' ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Unlock className="h-4 w-4" />
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
