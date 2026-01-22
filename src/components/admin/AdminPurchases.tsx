import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Check, X, Eye, Search, Download } from 'lucide-react';
import { ClientDocThumbnails } from './ClientDocThumbnails';

interface Purchase {
  id: string;
  full_name: string;
  dni: string;
  email: string;
  phone: string;
  city: string | null;
  serial_number: string;
  purchase_date: string;
  admin_status: string | null;
  rejection_reason: string | null;
  invoice_url: string | null;
  id_front_url: string | null;
  id_back_url: string | null;
  ai_validation_result: any;
  coupons_generated: number | null;
  created_at: string;
  product?: {
    model_name: string;
    screen_size: number | null;
  } | null;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'APPROVED', label: 'Aprobados' },
  { value: 'REJECTED', label: 'Rechazados' },
];

export default function AdminPurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadPurchases();
  }, [statusFilter]);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('client_purchases')
        .select(`
          *,
          product:products(model_name, screen_size)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        if (statusFilter === 'PENDING') {
          query = query.or('admin_status.eq.PENDING,admin_status.is.null');
        } else {
          query = query.eq('admin_status', statusFilter);
        }
      }

      const { data, error } = await query.limit(200);

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Error loading purchases:', error);
      toast.error('Error al cargar compras');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (purchase: Purchase) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-client-purchase', {
        body: {
          purchase_id: purchase.id,
          action: 'approve'
        }
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'success' in data && (data as any).success === false) {
        throw new Error((data as any).message || 'No se pudo aprobar la compra');
      }

      toast.success('Compra aprobada y notificación enviada');
      loadPurchases();
    } catch (error: any) {
      console.error('Error approving purchase:', error);
      toast.error(error.message || 'Error al aprobar compra');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPurchase || !rejectionReason) return;

    setProcessing(true);
    try {
      // 1. Delete coupons associated with this purchase
      const { error: couponError } = await supabase
        .from('coupons')
        .delete()
        .eq('buyer_purchase_id', selectedPurchase.id);
      
      if (couponError) {
        console.error('Error deleting coupons:', couponError);
      }

      // 2. Reset serial status back to available
      const { error: serialError } = await supabase
        .from('tv_serials')
        .update({ 
          buyer_status: 'NOT_REGISTERED',
          buyer_purchase_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('serial_number', selectedPurchase.serial_number);
      
      if (serialError) {
        console.error('Error resetting serial:', serialError);
      }

      // 3. Update purchase status to rejected
      const { error } = await supabase
        .from('client_purchases')
        .update({ 
          admin_status: 'REJECTED',
          rejection_reason: rejectionReason,
          coupons_generated: 0
        })
        .eq('id', selectedPurchase.id);

      if (error) throw error;

      // 4. Send rejection notification (best effort)
      try {
        await supabase.functions.invoke('process-client-purchase', {
          body: {
            purchase_id: selectedPurchase.id,
            action: 'reject',
            rejection_reason: rejectionReason
          }
        });
      } catch (notifError) {
        console.warn('Could not send rejection notification:', notifError);
      }

      toast.success('Compra rechazada. Serial liberado y cupones eliminados.');
      setRejectOpen(false);
      setRejectionReason('');
      setSelectedPurchase(null);
      loadPurchases();
    } catch (error) {
      console.error('Error rejecting purchase:', error);
      toast.error('Error al rechazar compra');
    } finally {
      setProcessing(false);
    }
  };

  const openDetails = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setDetailsOpen(true);
  };

  const openReject = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setRejectOpen(true);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500 hover:bg-green-600"><Check className="h-3 w-3 mr-1" />Aprobada</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rechazada</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  // Filter by search query
  const filteredPurchases = purchases.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.serial_number.toLowerCase().includes(q) ||
      p.dni.toLowerCase().includes(q)
    );
  });

  // Counts
  const pendingCount = purchases.filter(p => !p.admin_status || p.admin_status === 'PENDING').length;
  const approvedCount = purchases.filter(p => p.admin_status === 'APPROVED').length;
  const rejectedCount = purchases.filter(p => p.admin_status === 'REJECTED').length;

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Clientes</h2>
          <p className="text-muted-foreground">Revisar y aprobar compras de clientes finales</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-500">{approvedCount}</p>
            <p className="text-xs text-muted-foreground">Aprobados</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-red-500">{rejectedCount}</p>
            <p className="text-xs text-muted-foreground">Rechazados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, serial o DNI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Document Preview Modal */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Vista previa del documento</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="space-y-4">
              <img src={previewUrl} alt="Documento" className="w-full rounded-lg" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Abrir en nueva pestaña
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Detalles de Compra</DialogTitle>
          </DialogHeader>
          {selectedPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Nombre</Label>
                  <p className="font-medium">{selectedPurchase.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">DNI</Label>
                  <p className="font-medium">{selectedPurchase.dni}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedPurchase.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Teléfono</Label>
                  <p className="font-medium">{selectedPurchase.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ciudad</Label>
                  <p className="font-medium">{selectedPurchase.city || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Serial</Label>
                  <p className="font-mono font-medium">{selectedPurchase.serial_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Producto</Label>
                  <p className="font-medium">
                    {selectedPurchase.product?.model_name || '-'}
                    {selectedPurchase.product?.screen_size && ` (${selectedPurchase.product.screen_size}")`}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de Compra</Label>
                  <p className="font-medium">{new Date(selectedPurchase.purchase_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <div className="mt-1">{getStatusBadge(selectedPurchase.admin_status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cupones Generados</Label>
                  <p className="font-medium">{selectedPurchase.coupons_generated || 0}</p>
                </div>
              </div>

              {/* Documents with thumbnails */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Documentos</Label>
                <div className="flex flex-wrap gap-4">
                  {selectedPurchase.invoice_url && (
                    <div className="space-y-1">
                      <img 
                        src={selectedPurchase.invoice_url} 
                        alt="Factura" 
                        className="w-32 h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setPreviewUrl(selectedPurchase.invoice_url)}
                      />
                      <p className="text-xs text-center text-muted-foreground">Factura</p>
                    </div>
                  )}
                  {selectedPurchase.id_front_url && (
                    <div className="space-y-1">
                      <img 
                        src={selectedPurchase.id_front_url} 
                        alt="CI Anverso" 
                        className="w-32 h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setPreviewUrl(selectedPurchase.id_front_url)}
                      />
                      <p className="text-xs text-center text-muted-foreground">CI Anverso</p>
                    </div>
                  )}
                  {selectedPurchase.id_back_url && (
                    <div className="space-y-1">
                      <img 
                        src={selectedPurchase.id_back_url} 
                        alt="CI Reverso" 
                        className="w-32 h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setPreviewUrl(selectedPurchase.id_back_url)}
                      />
                      <p className="text-xs text-center text-muted-foreground">CI Reverso</p>
                    </div>
                  )}
                  {!selectedPurchase.invoice_url && !selectedPurchase.id_front_url && !selectedPurchase.id_back_url && (
                    <p className="text-muted-foreground text-sm">Sin documentos</p>
                  )}
                </div>
              </div>

              {selectedPurchase.ai_validation_result && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Validación IA</Label>
                  <pre className="bg-muted p-3 rounded-lg text-sm overflow-auto max-h-32">
                    {JSON.stringify(selectedPurchase.ai_validation_result, null, 2)}
                  </pre>
                </div>
              )}

              {selectedPurchase.rejection_reason && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Motivo de Rechazo</Label>
                  <p className="text-destructive bg-destructive/10 p-3 rounded-lg">{selectedPurchase.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Compra</DialogTitle>
            <DialogDescription>Indica el motivo del rechazo. Se notificará al cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Motivo del rechazo..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing || !rejectionReason}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rechazar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-700 hover:bg-slate-700 border-b border-slate-600">
                <TableHead className="font-bold text-white">Cliente</TableHead>
                <TableHead className="font-bold text-white">Serial / Producto</TableHead>
                <TableHead className="font-bold text-white">Documentos</TableHead>
                <TableHead className="font-bold text-white">Fecha</TableHead>
                <TableHead className="font-bold text-white">Estado</TableHead>
                <TableHead className="font-bold text-white text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground bg-white">
                    No hay compras
                  </TableCell>
                </TableRow>
              ) : (
                filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id} className="bg-white hover:bg-slate-50 border-b border-slate-200">
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-800">{purchase.full_name}</p>
                        <p className="text-sm text-slate-500">{purchase.email}</p>
                        <p className="text-xs text-slate-400">DNI: {purchase.dni}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-slate-700 text-sm">{purchase.serial_number}</p>
                      {purchase.product && (
                        <p className="text-xs text-slate-500">
                          {purchase.product.model_name}
                          {purchase.product.screen_size && ` (${purchase.product.screen_size}")`}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <ClientDocThumbnails
                        invoiceUrl={purchase.invoice_url}
                        idFrontUrl={purchase.id_front_url}
                        idBackUrl={purchase.id_back_url}
                        onPreview={setPreviewUrl}
                      />
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {new Date(purchase.purchase_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(purchase.admin_status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => openDetails(purchase)} 
                          className="text-slate-600 hover:text-slate-900"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(!purchase.admin_status || purchase.admin_status === 'PENDING') && (
                          <>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-green-600 hover:text-green-700 hover:bg-green-50" 
                              onClick={() => handleApprove(purchase)}
                              disabled={processing}
                              title="Aprobar"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50" 
                              onClick={() => openReject(purchase)}
                              title="Rechazar"
                            >
                              <X className="h-4 w-4" />
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
    </div>
  );
}
