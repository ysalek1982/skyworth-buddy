import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Loader2, CheckCircle, XCircle, Clock, Eye, Filter, 
  Image as ImageIcon, Search, RefreshCw, FileText 
} from 'lucide-react';

const DEPARTMENTS = ['Santa Cruz', 'Cochabamba', 'La Paz'];
const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'APPROVED', label: 'Aprobados' },
  { value: 'REJECTED', label: 'Rechazados' },
];

interface SellerSale {
  id: string;
  seller_id: string;
  serial_number: string;
  product_id: string | null;
  invoice_number: string | null;
  client_name: string;
  client_phone: string | null;
  sale_date: string;
  points_earned: number;
  status: string;
  rejection_reason: string | null;
  warranty_tag_url: string | null;
  warranty_policy_url: string | null;
  invoice_photo_url: string | null;
  created_at: string;
  seller?: {
    store_name: string;
    store_city: string;
  };
  product?: {
    model_name: string;
  };
}

export default function AdminSellerSales() {
  const { user } = useAuth();
  const [sales, setSales] = useState<SellerSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  // Modal states
  const [selectedSale, setSelectedSale] = useState<SellerSale | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadSales();
  }, [statusFilter, departmentFilter]);

  const loadSales = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('seller_sales')
        .select(`
          *,
          seller:sellers(store_name, store_city),
          product:products(model_name)
        `)
        .order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Filter by department if needed
      let filtered = data || [];
      if (departmentFilter !== 'all') {
        filtered = filtered.filter(s => s.seller?.store_city === departmentFilter);
      }
      
      setSales(filtered);
    } catch (error) {
      console.error('Error loading sales:', error);
      toast.error('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sale: SellerSale) => {
    if (!user) return;
    setProcessing(sale.id);
    
    try {
      const { data, error } = await supabase.rpc('rpc_approve_seller_sale', {
        p_sale_id: sale.id,
        p_reviewer_id: user.id
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.error || 'Error al aprobar');
      }

      toast.success(result.message || 'Venta aprobada');
      loadSales();
      
      // TODO: Send notification to seller (email if enabled)
      
    } catch (error: any) {
      console.error('Error approving sale:', error);
      toast.error(error.message || 'Error al aprobar la venta');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!user || !selectedSale) return;
    setProcessing(selectedSale.id);
    
    try {
      const { data, error } = await supabase.rpc('rpc_reject_seller_sale', {
        p_sale_id: selectedSale.id,
        p_reviewer_id: user.id,
        p_reason: rejectReason || null
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.error || 'Error al rechazar');
      }

      toast.success(result.message || 'Venta rechazada');
      setRejectOpen(false);
      setRejectReason('');
      setSelectedSale(null);
      loadSales();
      
    } catch (error: any) {
      console.error('Error rejecting sale:', error);
      toast.error(error.message || 'Error al rechazar la venta');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Aprobado</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>;
      default:
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
    }
  };

  const filteredSales = sales.filter(s => 
    s.serial_number.toLowerCase().includes(search.toLowerCase()) ||
    s.client_name.toLowerCase().includes(search.toLowerCase()) ||
    s.seller?.store_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const pendingCount = sales.filter(s => s.status === 'PENDING').length;
  const approvedCount = sales.filter(s => s.status === 'APPROVED').length;
  const rejectedCount = sales.filter(s => s.status === 'REJECTED').length;

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
        <h2 className="text-2xl font-bold text-foreground">Revisión de Ventas Vendedores</h2>
        <p className="text-muted-foreground">Aprueba o rechaza las ventas registradas por vendedores</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-500">{approvedCount}</p>
                <p className="text-sm text-muted-foreground">Aprobados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-500">{rejectedCount}</p>
                <p className="text-sm text-muted-foreground">Rechazados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por serial, cliente o tienda..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-800 border-slate-600"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-600">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-600">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los departamentos</SelectItem>
                {DEPARTMENTS.map(dep => (
                  <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadSales} className="border-slate-600">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-700 hover:bg-slate-700">
                <TableHead className="font-bold text-white">Fecha</TableHead>
                <TableHead className="font-bold text-white">Tienda</TableHead>
                <TableHead className="font-bold text-white">Serial</TableHead>
                <TableHead className="font-bold text-white">Cliente</TableHead>
                <TableHead className="font-bold text-white">Puntos</TableHead>
                <TableHead className="font-bold text-white">Docs</TableHead>
                <TableHead className="font-bold text-white">Estado</TableHead>
                <TableHead className="font-bold text-white text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No hay ventas para mostrar
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id} className="bg-white hover:bg-slate-50">
                    <TableCell className="text-slate-900">
                      {new Date(sale.sale_date).toLocaleDateString('es-BO')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">{sale.seller?.store_name}</p>
                        <p className="text-xs text-slate-500">{sale.seller?.store_city}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-slate-900">{sale.serial_number}</TableCell>
                    <TableCell className="text-slate-900">{sale.client_name}</TableCell>
                    <TableCell className="font-bold text-primary">{sale.points_earned}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {sale.warranty_tag_url && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => setImagePreview(sale.warranty_tag_url)}
                          >
                            <ImageIcon className="h-4 w-4 text-cyan-600" />
                          </Button>
                        )}
                        {sale.warranty_policy_url && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => setImagePreview(sale.warranty_policy_url)}
                          >
                            <FileText className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {sale.invoice_photo_url && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => setImagePreview(sale.invoice_photo_url)}
                          >
                            <FileText className="h-4 w-4 text-amber-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(sale.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => { setSelectedSale(sale); setDetailsOpen(true); }}
                        >
                          <Eye className="h-4 w-4 text-slate-600" />
                        </Button>
                        {sale.status === 'PENDING' && (
                          <>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              disabled={processing === sale.id}
                              onClick={() => handleApprove(sale)}
                            >
                              {processing === sale.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              disabled={processing === sale.id}
                              onClick={() => { setSelectedSale(sale); setRejectOpen(true); }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
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

      {/* Image Preview Modal */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Documento</DialogTitle>
          </DialogHeader>
          {imagePreview && (
            <img src={imagePreview} alt="Document preview" className="w-full rounded-lg" />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImagePreview(null)}>Cerrar</Button>
            {imagePreview && (
              <Button asChild>
                <a href={imagePreview} target="_blank" rel="noopener noreferrer">Abrir en nueva pestaña</a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de Venta</DialogTitle>
            <DialogDescription>Serial: {selectedSale?.serial_number}</DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tienda</Label>
                  <p className="font-medium">{selectedSale.seller?.store_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Departamento</Label>
                  <p className="font-medium">{selectedSale.seller?.store_city}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cliente</Label>
                  <p className="font-medium">{selectedSale.client_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Teléfono</Label>
                  <p className="font-medium">{selectedSale.client_phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Venta</Label>
                  <p className="font-medium">{new Date(selectedSale.sale_date).toLocaleDateString('es-BO')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Puntos</Label>
                  <p className="font-bold text-primary">{selectedSale.points_earned}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <div className="mt-1">{getStatusBadge(selectedSale.status)}</div>
                </div>
                {selectedSale.rejection_reason && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Motivo de Rechazo</Label>
                    <p className="font-medium text-red-400">{selectedSale.rejection_reason}</p>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div>
                <Label className="text-muted-foreground mb-2 block">Documentos Adjuntos</Label>
                <div className="grid grid-cols-3 gap-4">
                  {selectedSale.warranty_tag_url && (
                    <div 
                      className="aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-primary"
                      onClick={() => setImagePreview(selectedSale.warranty_tag_url)}
                    >
                      <img src={selectedSale.warranty_tag_url} alt="TAG Póliza" className="w-full h-full object-cover" />
                      <p className="text-xs text-center mt-1">TAG Póliza</p>
                    </div>
                  )}
                  {selectedSale.warranty_policy_url && (
                    <div 
                      className="aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-primary"
                      onClick={() => setImagePreview(selectedSale.warranty_policy_url)}
                    >
                      <img src={selectedSale.warranty_policy_url} alt="Póliza" className="w-full h-full object-cover" />
                      <p className="text-xs text-center mt-1">Póliza</p>
                    </div>
                  )}
                  {selectedSale.invoice_photo_url && (
                    <div 
                      className="aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-primary"
                      onClick={() => setImagePreview(selectedSale.invoice_photo_url)}
                    >
                      <img src={selectedSale.invoice_photo_url} alt="Factura" className="w-full h-full object-cover" />
                      <p className="text-xs text-center mt-1">Factura</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Venta</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de rechazar esta venta? El serial será liberado para nuevo registro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo del rechazo (opcional)</Label>
              <Textarea 
                placeholder="Ej: Documentos ilegibles, fecha no coincide..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancelar</Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={processing === selectedSale?.id}
            >
              {processing === selectedSale?.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Rechazar Venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
