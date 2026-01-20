import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Search, Ban, CheckCircle, Trophy, Star, Users, TrendingUp, Eye, FileText, X, Download } from 'lucide-react';

interface Seller {
  id: string;
  user_id: string;
  store_name: string;
  store_city: string;
  phone: string | null;
  total_points: number;
  total_sales: number;
  is_active: boolean;
  blocked_at: string | null;
  blocked_reason: string | null;
  created_at: string;
}

interface SellerSale {
  id: string;
  seller_id: string;
  warranty_tag_url: string | null;
  warranty_policy_url: string | null;
  invoice_photo_url: string | null;
}

const DEPARTMENTS = ['Santa Cruz', 'Cochabamba', 'La Paz'];

export default function AdminSellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [sellerDocs, setSellerDocs] = useState<Record<string, SellerSale[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  
  // Block modal state
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);
  
  // Document viewer modal
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [viewingDocs, setViewingDocs] = useState<SellerSale[]>([]);
  const [activeDocUrl, setActiveDocUrl] = useState<string | null>(null);

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
      
      // Load documents for each seller
      if (data && data.length > 0) {
        const sellerIds = data.map(s => s.id);
        const { data: salesData } = await supabase
          .from('seller_sales')
          .select('id, seller_id, warranty_tag_url, warranty_policy_url, invoice_photo_url')
          .in('seller_id', sellerIds);
        
        if (salesData) {
          const docsMap: Record<string, SellerSale[]> = {};
          salesData.forEach(sale => {
            if (!docsMap[sale.seller_id]) {
              docsMap[sale.seller_id] = [];
            }
            docsMap[sale.seller_id].push(sale);
          });
          setSellerDocs(docsMap);
        }
      }
    } catch (error) {
      console.error('Error loading sellers:', error);
      toast.error('Error al cargar vendedores');
    } finally {
      setLoading(false);
    }
  };

  const openBlockModal = (seller: Seller) => {
    setSelectedSeller(seller);
    setBlockReason(seller.blocked_reason || '');
    setBlockModalOpen(true);
  };

  const handleBlock = async () => {
    if (!selectedSeller) return;
    
    setIsBlocking(true);
    try {
      const { error } = await supabase
        .from('sellers')
        .update({ 
          is_active: false,
          blocked_at: new Date().toISOString(),
          blocked_reason: blockReason || 'Bloqueado por administrador'
        })
        .eq('id', selectedSeller.id);

      if (error) throw error;
      toast.success('Vendedor bloqueado exitosamente');
      setBlockModalOpen(false);
      setBlockReason('');
      loadSellers();
    } catch (error) {
      console.error('Error blocking seller:', error);
      toast.error('Error al bloquear vendedor');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblock = async (seller: Seller) => {
    try {
      const { error } = await supabase
        .from('sellers')
        .update({ 
          is_active: true,
          blocked_at: null,
          blocked_reason: null
        })
        .eq('id', seller.id);

      if (error) throw error;
      toast.success('Vendedor activado');
      loadSellers();
    } catch (error) {
      console.error('Error unblocking seller:', error);
      toast.error('Error al activar vendedor');
    }
  };

  const openDocViewer = (sellerId: string) => {
    const docs = sellerDocs[sellerId] || [];
    setViewingDocs(docs);
    if (docs.length > 0) {
      const firstDoc = docs[0].warranty_tag_url || docs[0].warranty_policy_url || docs[0].invoice_photo_url;
      setActiveDocUrl(firstDoc);
    }
    setDocViewerOpen(true);
  };

  const getDocCount = (sellerId: string) => {
    const docs = sellerDocs[sellerId] || [];
    return docs.reduce((count, doc) => {
      return count + (doc.warranty_tag_url ? 1 : 0) + (doc.warranty_policy_url ? 1 : 0) + (doc.invoice_photo_url ? 1 : 0);
    }, 0);
  };

  const getAllDocUrls = (docs: SellerSale[]) => {
    const urls: { label: string; url: string }[] = [];
    docs.forEach((doc, idx) => {
      if (doc.warranty_tag_url) urls.push({ label: `TAG #${idx + 1}`, url: doc.warranty_tag_url });
      if (doc.warranty_policy_url) urls.push({ label: `Póliza #${idx + 1}`, url: doc.warranty_policy_url });
      if (doc.invoice_photo_url) urls.push({ label: `Factura #${idx + 1}`, url: doc.invoice_photo_url });
    });
    return urls;
  };

  const filteredSellers = sellers.filter(seller => {
    const matchesSearch = seller.store_name.toLowerCase().includes(search.toLowerCase()) ||
      seller.store_city.toLowerCase().includes(search.toLowerCase());
    const matchesDept = departmentFilter === 'all' || seller.store_city === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const totalPoints = sellers.reduce((sum, s) => sum + s.total_points, 0);
  const totalSales = sellers.reduce((sum, s) => sum + s.total_sales, 0);
  const activeSellers = sellers.filter(s => s.is_active).length;

  const getRankBadge = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-amber-500" />;
    if (index === 1) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Trophy className="h-5 w-5 text-orange-600" />;
    return <span className="w-5 text-center text-muted-foreground">{index + 1}</span>;
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
      <div>
        <h2 className="text-2xl font-bold text-foreground">Vendedores</h2>
        <p className="text-muted-foreground">Ranking y gestión de vendedores (ordenado por puntos)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{sellers.length}</p>
                <p className="text-sm text-muted-foreground">Total Vendedores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/20 to-accent/10 border-accent/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-accent/20">
                <CheckCircle className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">{activeSellers}</p>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/20">
                <Star className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500">{totalPoints.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Puntos Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-secondary/20 to-secondary/10 border-secondary/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-secondary/20">
                <TrendingUp className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-secondary-foreground">{totalSales}</p>
                <p className="text-sm text-muted-foreground">Ventas Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="py-4">
          <p className="text-sm text-amber-500 flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span>Los vendedores acumulan <strong>puntos</strong> por cada venta aprobada. El ranking se ordena por puntos (no cupones).</span>
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-foreground font-medium mb-2 block">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por tienda o ciudad..."
                  className="pl-9"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label className="text-foreground font-medium mb-2 block">Departamento</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {DEPARTMENTS.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted border-b border-border">
                <TableHead className="font-bold text-foreground w-16">Rank</TableHead>
                <TableHead className="font-bold text-foreground">Tienda</TableHead>
                <TableHead className="font-bold text-foreground">Departamento</TableHead>
                <TableHead className="font-bold text-foreground">Teléfono</TableHead>
                <TableHead className="font-bold text-foreground text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 text-amber-500" />
                    Puntos
                  </div>
                </TableHead>
                <TableHead className="font-bold text-foreground text-center">Ventas</TableHead>
                <TableHead className="font-bold text-foreground text-center">Docs</TableHead>
                <TableHead className="font-bold text-foreground text-center">Estado</TableHead>
                <TableHead className="font-bold text-foreground text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No hay vendedores
                  </TableCell>
                </TableRow>
              ) : (
                filteredSellers.map((seller, index) => {
                  const docCount = getDocCount(seller.id);
                  return (
                    <TableRow key={seller.id} className={`hover:bg-muted/50 border-b border-border ${!seller.is_active ? 'opacity-60' : ''}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center justify-center">
                          {getRankBadge(index)}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">{seller.store_name}</TableCell>
                      <TableCell className="text-muted-foreground">{seller.store_city}</TableCell>
                      <TableCell className="text-muted-foreground">{seller.phone || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-amber-500 text-white">
                          {seller.total_points.toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-foreground font-medium">{seller.total_sales}</TableCell>
                      <TableCell className="text-center">
                        {docCount > 0 ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDocViewer(seller.id)}
                            className="h-8 gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            <span>{docCount}</span>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={seller.is_active ? 'bg-accent text-accent-foreground' : 'bg-destructive text-destructive-foreground'}>
                          {seller.is_active ? 'Activo' : 'Bloqueado'}
                        </Badge>
                        {!seller.is_active && seller.blocked_reason && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-32 truncate" title={seller.blocked_reason}>
                            {seller.blocked_reason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {seller.is_active ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openBlockModal(seller)}
                            title="Bloquear vendedor"
                            className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUnblock(seller)}
                            title="Activar vendedor"
                            className="h-8 text-accent hover:text-accent hover:bg-accent/10"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Block Modal */}
      <Dialog open={blockModalOpen} onOpenChange={setBlockModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Ban className="h-5 w-5" />
              Bloquear Vendedor
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de bloquear a <strong>{selectedSeller?.store_name}</strong>? 
              No podrá iniciar sesión ni registrar ventas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="blockReason">Motivo del bloqueo *</Label>
              <Textarea
                id="blockReason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Ej: Documentos fraudulentos, comportamiento sospechoso..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBlock}
              disabled={isBlocking || !blockReason.trim()}
            >
              {isBlocking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Ban className="h-4 w-4 mr-2" />}
              Confirmar Bloqueo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal */}
      <Dialog open={docViewerOpen} onOpenChange={setDocViewerOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos del Vendedor
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-4">
            {/* Thumbnails sidebar */}
            <div className="w-32 space-y-2 flex-shrink-0">
              {getAllDocUrls(viewingDocs).map((doc, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveDocUrl(doc.url)}
                  className={`w-full aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                    activeDocUrl === doc.url ? 'border-primary ring-2 ring-primary/50' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <img 
                    src={doc.url} 
                    alt={doc.label}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </button>
              ))}
            </div>
            {/* Main viewer */}
            <div className="flex-1 flex flex-col">
              {activeDocUrl ? (
                <>
                  <div className="flex-1 bg-muted rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]">
                    <img 
                      src={activeDocUrl} 
                      alt="Documento"
                      className="max-w-full max-h-[400px] object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button asChild variant="outline">
                      <a href={activeDocUrl} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </a>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  No hay documentos disponibles
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
