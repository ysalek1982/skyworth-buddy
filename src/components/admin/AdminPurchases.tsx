import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Check, X, Eye, FileText, User, ExternalLink } from 'lucide-react';

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
}

export default function AdminPurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState('PENDING');
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadPurchases();
  }, [filter]);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('client_purchases')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('admin_status', filter);
      }

      const { data, error } = await query.limit(100);

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
      // Call the RPC to register the buyer serial
      const { data, error } = await supabase.rpc('rpc_register_buyer_serial', {
        p_serial_number: purchase.serial_number,
        p_full_name: purchase.full_name,
        p_dni: purchase.dni,
        p_email: purchase.email,
        p_phone: purchase.phone,
        p_city: purchase.city || '',
        p_purchase_date: purchase.purchase_date,
        p_user_id: null
      });

      if (error) throw error;

      // Update the purchase status
      await supabase
        .from('client_purchases')
        .update({ admin_status: 'APPROVED' })
        .eq('id', purchase.id);

      toast.success('Compra aprobada y cupones generados');
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
        return <Badge className="bg-green-500">Aprobada</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rechazada</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
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
          <h2 className="text-2xl font-bold text-foreground">Compras</h2>
          <p className="text-muted-foreground">Revisar y aprobar compras de clientes</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="PENDING">Pendientes</SelectItem>
            <SelectItem value="APPROVED">Aprobadas</SelectItem>
            <SelectItem value="REJECTED">Rechazadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
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
                  <Label className="text-muted-foreground">Fecha de Compra</Label>
                  <p className="font-medium">{new Date(selectedPurchase.purchase_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <div className="mt-1">{getStatusBadge(selectedPurchase.admin_status)}</div>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Documentos</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedPurchase.invoice_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedPurchase.invoice_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        Factura
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </a>
                    </Button>
                  )}
                  {selectedPurchase.id_front_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedPurchase.id_front_url} target="_blank" rel="noopener noreferrer">
                        <User className="h-4 w-4 mr-2" />
                        CI Anverso
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </a>
                    </Button>
                  )}
                  {selectedPurchase.id_back_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedPurchase.id_back_url} target="_blank" rel="noopener noreferrer">
                        <User className="h-4 w-4 mr-2" />
                        CI Reverso
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {selectedPurchase.ai_validation_result && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Validación IA</Label>
                  <pre className="bg-muted p-3 rounded-lg text-sm overflow-auto">
                    {JSON.stringify(selectedPurchase.ai_validation_result, null, 2)}
                  </pre>
                </div>
              )}

              {selectedPurchase.rejection_reason && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Motivo de Rechazo</Label>
                  <p className="text-destructive">{selectedPurchase.rejection_reason}</p>
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
            <DialogDescription>Indica el motivo del rechazo</DialogDescription>
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
                <TableHead className="font-bold text-white">Serial</TableHead>
                <TableHead className="font-bold text-white">Fecha</TableHead>
                <TableHead className="font-bold text-white">Estado</TableHead>
                <TableHead className="font-bold text-white text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground bg-white">
                    No hay compras
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((purchase) => (
                  <TableRow key={purchase.id} className="bg-white hover:bg-slate-50 border-b border-slate-200">
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-800">{purchase.full_name}</p>
                        <p className="text-sm text-slate-500">{purchase.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-slate-700">{purchase.serial_number}</TableCell>
                    <TableCell className="text-slate-600">{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(purchase.admin_status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openDetails(purchase)} className="text-slate-600 hover:text-slate-900">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {purchase.admin_status === 'PENDING' && (
                          <>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-green-600 hover:text-green-700 hover:bg-green-50" 
                              onClick={() => handleApprove(purchase)}
                              disabled={processing}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50" 
                              onClick={() => openReject(purchase)}
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
