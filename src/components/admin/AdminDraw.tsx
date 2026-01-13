import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Trophy, Play, Download, Sparkles } from 'lucide-react';

interface Draw {
  id: string;
  name: string;
  preselected_count: number | null;
  finalists_count: number | null;
  executed_at: string | null;
  results: any;
  created_at: string;
}

export default function AdminDraw() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    preselected_count: '20',
    finalists_count: '5'
  });

  useEffect(() => {
    loadDraws();
  }, []);

  const loadDraws = async () => {
    try {
      const { data, error } = await supabase
        .from('draws')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDraws(data || []);
    } catch (error) {
      console.error('Error loading draws:', error);
      toast.error('Error al cargar sorteos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setExecuting(true);

    try {
      // Get active coupons
      const { data: coupons, error: couponsError } = await supabase
        .from('coupons')
        .select('id, code, owner_type')
        .eq('status', 'ACTIVE');

      if (couponsError) throw couponsError;

      if (!coupons || coupons.length === 0) {
        toast.error('No hay cupones activos para el sorteo');
        return;
      }

      const preselectedCount = parseInt(form.preselected_count);
      const finalistsCount = parseInt(form.finalists_count);

      // Shuffle and select
      const shuffled = [...coupons].sort(() => Math.random() - 0.5);
      const preselected = shuffled.slice(0, Math.min(preselectedCount, shuffled.length));
      const finalists = preselected.slice(0, Math.min(finalistsCount, preselected.length));

      const results = {
        total_coupons: coupons.length,
        preselected: preselected.map(c => ({ code: c.code, owner_type: c.owner_type })),
        finalists: finalists.map(c => ({ code: c.code, owner_type: c.owner_type }))
      };

      // Create draw record
      const { error: drawError } = await supabase
        .from('draws')
        .insert({
          name: form.name,
          preselected_count: preselectedCount,
          finalists_count: finalistsCount,
          executed_at: new Date().toISOString(),
          results
        });

      if (drawError) throw drawError;

      // Mark finalist coupons as used
      for (const finalist of finalists) {
        await supabase
          .from('coupons')
          .update({ status: 'USED' })
          .eq('code', finalist.code);
      }

      toast.success('¡Sorteo ejecutado exitosamente!');
      setDialogOpen(false);
      setForm({ name: '', preselected_count: '20', finalists_count: '5' });
      loadDraws();
    } catch (error: any) {
      console.error('Error executing draw:', error);
      toast.error(error.message || 'Error al ejecutar sorteo');
    } finally {
      setExecuting(false);
    }
  };

  const exportResults = (draw: Draw) => {
    if (!draw.results) return;

    const results = draw.results;
    let csv = 'Tipo,Código,Categoría\n';

    results.finalists?.forEach((f: any) => {
      csv += `Finalista,${f.code},${f.owner_type}\n`;
    });

    results.preselected?.forEach((p: any) => {
      if (!results.finalists?.find((f: any) => f.code === p.code)) {
        csv += `Preseleccionado,${p.code},${p.owner_type}\n`;
      }
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sorteo-${draw.name}-${new Date(draw.executed_at!).toISOString().split('T')[0]}.csv`;
    a.click();
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
          <h2 className="text-2xl font-bold text-foreground">Sorteo</h2>
          <p className="text-muted-foreground">Ejecutar sorteo sobre cupones activos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Trophy className="h-4 w-4 mr-2" />
              Nuevo Sorteo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ejecutar Nuevo Sorteo</DialogTitle>
              <DialogDescription>
                Configura los parámetros del sorteo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateDraw} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Sorteo *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Sorteo Junio 2026"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preselected">Preseleccionados</Label>
                  <Input
                    id="preselected"
                    type="number"
                    value={form.preselected_count}
                    onChange={(e) => setForm({ ...form, preselected_count: e.target.value })}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="finalists">Finalistas</Label>
                  <Input
                    id="finalists"
                    type="number"
                    value={form.finalists_count}
                    onChange={(e) => setForm({ ...form, finalists_count: e.target.value })}
                    min="1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={executing}>
                  {executing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ejecutando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Ejecutar Sorteo
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Draws List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Preseleccionados</TableHead>
                <TableHead>Finalistas</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {draws.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hay sorteos realizados
                  </TableCell>
                </TableRow>
              ) : (
                draws.map((draw) => (
                  <TableRow key={draw.id}>
                    <TableCell className="font-medium">{draw.name}</TableCell>
                    <TableCell>{draw.preselected_count}</TableCell>
                    <TableCell>{draw.finalists_count}</TableCell>
                    <TableCell>
                      {draw.executed_at ? new Date(draw.executed_at).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {draw.results && (
                        <Button size="sm" variant="outline" onClick={() => exportResults(draw)}>
                          <Download className="h-4 w-4 mr-2" />
                          Exportar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Latest Draw Results */}
      {draws[0]?.results && (
        <Card className="border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Últimos Resultados: {draws[0].name}
            </CardTitle>
            <CardDescription>
              {draws[0].results.total_coupons} cupones participaron
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-amber-500">🏆 Finalistas</h4>
                <div className="flex flex-wrap gap-2">
                  {draws[0].results.finalists?.map((f: any, i: number) => (
                    <Badge key={i} className="bg-amber-500">
                      {f.code}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-muted-foreground">Preseleccionados</h4>
                <div className="flex flex-wrap gap-2">
                  {draws[0].results.preselected?.slice(draws[0].finalists_count || 5).map((p: any, i: number) => (
                    <Badge key={i} variant="outline">
                      {p.code}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
