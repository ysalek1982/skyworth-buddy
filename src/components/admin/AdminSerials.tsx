import { useState, useEffect, useRef } from 'react';
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
import { Plus, Upload, Loader2, Lock, Unlock, Pencil, Download, FileSpreadsheet, AlertTriangle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

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
  description: string | null;
  tier: string;
}

interface ParsedSerial {
  serial_number: string;
  product_name?: string;
  product_id?: string;
  valid: boolean;
  error?: string;
}

export default function AdminSerials() {
  const [serials, setSerials] = useState<Serial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingSerial, setEditingSerial] = useState<Serial | null>(null);
  const [parsedSerials, setParsedSerials] = useState<ParsedSerial[]>([]);
  const [form, setForm] = useState({ serial_number: '', product_id: '' });
  const [filter, setFilter] = useState({ status: 'all', product: 'all' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [serialsRes, productsRes] = await Promise.all([
        supabase.from('tv_serials').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('products').select('id, model_name, description, tier').eq('is_active', true)
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
        serial_number: form.serial_number.trim().toUpperCase(),
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

  const handleEdit = (serial: Serial) => {
    setEditingSerial(serial);
    setForm({
      serial_number: serial.serial_number,
      product_id: serial.product_id || ''
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSerial) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('tv_serials')
        .update({
          serial_number: form.serial_number.trim().toUpperCase(),
          product_id: form.product_id || null
        })
        .eq('id', editingSerial.id);

      if (error) throw error;

      toast.success('Serial actualizado');
      setEditDialogOpen(false);
      setEditingSerial(null);
      setForm({ serial_number: '', product_id: '' });
      loadData();
    } catch (error: any) {
      console.error('Error updating serial:', error);
      toast.error(error.message || 'Error al actualizar serial');
    } finally {
      setSaving(false);
    }
  };

  const downloadTemplate = () => {
    // Create template with product options
    const templateData = [
      { 'SERIAL': 'SKW123456789', 'MODELO': 'Q7500G' },
      { 'SERIAL': 'SKW987654321', 'MODELO': 'E5500H - E5500G' },
      { 'SERIAL': '', 'MODELO': '' },
    ];

    // Add products list as reference
    const productsRef = products.map(p => ({
      'MODELOS DISPONIBLES': p.model_name,
      'DESCRIPCION': p.description || ''
    }));

    const wb = XLSX.utils.book_new();
    
    // Main sheet for serials
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [{ wch: 25 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Seriales');

    // Reference sheet for products
    const wsProducts = XLSX.utils.json_to_sheet(productsRef);
    wsProducts['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Productos Referencia');

    XLSX.writeFile(wb, 'plantilla_seriales_skyworth.xlsx');
    toast.success('Plantilla descargada');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

      // Parse and validate serials
      const parsed: ParsedSerial[] = jsonData.map((row) => {
        const serialNumber = String(row['SERIAL'] || row['serial'] || row['Serial'] || row['serial_number'] || '').trim().toUpperCase();
        const productName = String(row['MODELO'] || row['modelo'] || row['Modelo'] || row['product'] || row['PRODUCTO'] || '').trim();

        if (!serialNumber) {
          return { serial_number: '', valid: false, error: 'Serial vacío' };
        }

        // Find matching product
        const matchedProduct = products.find(p => 
          p.model_name.toLowerCase().includes(productName.toLowerCase()) ||
          productName.toLowerCase().includes(p.model_name.toLowerCase())
        );

        return {
          serial_number: serialNumber,
          product_name: productName,
          product_id: matchedProduct?.id,
          valid: !!matchedProduct,
          error: matchedProduct ? undefined : `Producto "${productName}" no encontrado`
        };
      }).filter(s => s.serial_number);

      setParsedSerials(parsed);
      setImportDialogOpen(true);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Error al leer el archivo');
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBulkImport = async () => {
    const validSerials = parsedSerials.filter(s => s.valid && s.product_id);
    
    if (validSerials.length === 0) {
      toast.error('No hay seriales válidos para importar');
      return;
    }

    setSaving(true);
    try {
      const serialsToInsert = validSerials.map(s => ({
        serial_number: s.serial_number,
        product_id: s.product_id
      }));

      const { error } = await supabase.from('tv_serials').insert(serialsToInsert);

      if (error) throw error;

      toast.success(`${validSerials.length} seriales importados exitosamente`);
      setImportDialogOpen(false);
      setParsedSerials([]);
      loadData();
    } catch (error: any) {
      console.error('Error importing serials:', error);
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

  const validCount = parsedSerials.filter(s => s.valid).length;
  const invalidCount = parsedSerials.filter(s => !s.valid).length;

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
            accept=".xlsx,.xls,.csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button variant="outline" onClick={downloadTemplate} className="border-green-500/50 text-green-400 hover:bg-green-500/10">
            <Download className="h-4 w-4 mr-2" />
            Descargar Plantilla
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Importar Excel
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
                  <Label htmlFor="product_id">Producto *</Label>
                  <Select value={form.product_id} onValueChange={(value) => setForm({ ...form, product_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.model_name} {product.description && `(${product.description})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving || !form.product_id}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Serial Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Serial</DialogTitle>
            <DialogDescription>Modifica los datos del serial</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_serial_number">Número de Serie *</Label>
              <Input
                id="edit_serial_number"
                value={form.serial_number}
                onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                placeholder="Ej: SKW123456789"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_product_id">Producto *</Label>
              <Select value={form.product_id} onValueChange={(value) => setForm({ ...form, product_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.model_name} {product.description && `(${product.description})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editingSerial && (
              <div className="p-3 bg-slate-100 rounded-lg text-sm text-slate-600">
                <p><strong>Estado:</strong> {editingSerial.status === 'AVAILABLE' ? 'Disponible' : 'Bloqueado'}</p>
                <p><strong>Comprador:</strong> {editingSerial.buyer_status === 'REGISTERED' ? 'Registrado' : 'No registrado'}</p>
                <p><strong>Vendedor:</strong> {editingSerial.seller_status === 'REGISTERED' ? 'Registrado' : 'No registrado'}</p>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || !form.product_id}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Preview Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-500" />
              Importar Seriales desde Excel
            </DialogTitle>
            <DialogDescription>
              Revisa los seriales antes de importar
            </DialogDescription>
          </DialogHeader>
          
          {/* Summary */}
          <div className="flex gap-4 py-4">
            <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">{validCount} válidos</span>
            </div>
            {invalidCount > 0 && (
              <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 px-4 py-2 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">{invalidCount} con errores</span>
              </div>
            )}
          </div>

          {/* Preview Table */}
          <div className="flex-1 overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead className="font-bold">Estado</TableHead>
                  <TableHead className="font-bold">Serial</TableHead>
                  <TableHead className="font-bold">Modelo (archivo)</TableHead>
                  <TableHead className="font-bold">Producto Asignado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedSerials.slice(0, 50).map((serial, i) => (
                  <TableRow key={i} className={serial.valid ? 'bg-white' : 'bg-amber-50'}>
                    <TableCell>
                      {serial.valid ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{serial.serial_number}</TableCell>
                    <TableCell className="text-sm">{serial.product_name || '-'}</TableCell>
                    <TableCell>
                      {serial.valid ? (
                        <Badge className="bg-green-500 text-white">
                          {products.find(p => p.id === serial.product_id)?.model_name}
                        </Badge>
                      ) : (
                        <span className="text-amber-600 text-sm">{serial.error}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {parsedSerials.length > 50 && (
              <div className="p-3 text-center text-sm text-slate-500 bg-slate-50">
                ...y {parsedSerials.length - 50} más
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleBulkImport} 
              disabled={saving || validCount === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Importar {validCount} Seriales
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
            <div className="flex items-end">
              <Badge variant="outline" className="h-10 px-4">
                {filteredSerials.length} seriales
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-700 hover:bg-slate-700 border-b border-slate-600">
                <TableHead className="font-bold text-white">Serial</TableHead>
                <TableHead className="font-bold text-white">Producto</TableHead>
                <TableHead className="font-bold text-white">Estado</TableHead>
                <TableHead className="font-bold text-white">Comprador</TableHead>
                <TableHead className="font-bold text-white">Vendedor</TableHead>
                <TableHead className="font-bold text-white text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSerials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground bg-white">
                    No hay seriales registrados
                  </TableCell>
                </TableRow>
              ) : (
                filteredSerials.map((serial) => (
                  <TableRow key={serial.id} className="bg-white hover:bg-slate-50 border-b border-slate-200">
                    <TableCell className="font-mono text-slate-800">{serial.serial_number}</TableCell>
                    <TableCell className="text-slate-700">
                      {products.find(p => p.id === serial.product_id)?.model_name || <span className="text-slate-400">-</span>}
                    </TableCell>
                    <TableCell>
                      <Badge className={serial.status === 'AVAILABLE' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                        {serial.status === 'AVAILABLE' ? 'Disponible' : 'Bloqueado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={serial.buyer_status === 'REGISTERED' ? 'bg-blue-500 text-white' : 'bg-slate-300 text-slate-600'}>
                        {serial.buyer_status === 'REGISTERED' ? 'Registrado' : 'No registrado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={serial.seller_status === 'REGISTERED' ? 'bg-blue-500 text-white' : 'bg-slate-300 text-slate-600'}>
                        {serial.seller_status === 'REGISTERED' ? 'Registrado' : 'No registrado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(serial)}
                          title="Editar serial"
                          className="text-slate-600 hover:text-slate-900"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleToggleStatus(serial)}
                          title={serial.status === 'AVAILABLE' ? 'Bloquear' : 'Desbloquear'}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          {serial.status === 'AVAILABLE' ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Unlock className="h-4 w-4" />
                          )}
                        </Button>
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
