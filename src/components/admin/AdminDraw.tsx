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
import { Loader2, Trophy, Play, Download, Sparkles, History, Ticket } from 'lucide-react';
import DrawTombola from './DrawTombola';

interface Draw {
  id: string;
  name: string;
  preselected_count: number | null;
  finalists_count: number | null;
  executed_at: string | null;
  results: any;
  created_at: string;
}

interface Winner {
  code: string;
  full_name: string;
  dni: string;
  city: string;
  email: string;
  phone: string;
}

export default function AdminDraw() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [tombolaActive, setTombolaActive] = useState(false);
  const [form, setForm] = useState({
    name: '',
    preselected_count: '20',
    finalists_count: '5'
  });
  const [activeCouponsCount, setActiveCouponsCount] = useState(0);

  useEffect(() => {
    loadDraws();
    loadCouponsCount();
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

  const loadCouponsCount = async () => {
    const { count } = await supabase
      .from('coupons')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ACTIVE')
      .eq('owner_type', 'BUYER');
    
    setActiveCouponsCount(count || 0);
  };

  const handleStartDraw = () => {
    if (!form.name) {
      toast.error('Ingresa un nombre para el sorteo');
      return;
    }
    setSetupDialogOpen(false);
    setTombolaActive(true);
  };

  const handleDrawComplete = async (winners: Winner[]) => {
    setSaving(true);
    try {
      const results = {
        total_coupons: activeCouponsCount,
        finalists: winners.map(w => ({
          code: w.code,
          full_name: w.full_name,
          dni: w.dni,
          city: w.city,
          email: w.email,
          phone: w.phone,
          owner_type: 'BUYER'
        })),
        preselected: winners.map(w => ({ code: w.code, owner_type: 'BUYER' }))
      };

      // Create draw record
      const { error: drawError } = await supabase
        .from('draws')
        .insert({
          name: form.name,
          preselected_count: parseInt(form.preselected_count),
          finalists_count: parseInt(form.finalists_count),
          executed_at: new Date().toISOString(),
          results
        });

      if (drawError) throw drawError;

      // Mark winner coupons as used
      for (const winner of winners) {
        await supabase
          .from('coupons')
          .update({ status: 'USED' })
          .eq('code', winner.code);
      }

      toast.success('¡Sorteo guardado exitosamente!');
      setTombolaActive(false);
      setForm({ name: '', preselected_count: '20', finalists_count: '5' });
      loadDraws();
      loadCouponsCount();
    } catch (error: any) {
      console.error('Error saving draw:', error);
      toast.error(error.message || 'Error al guardar sorteo');
    } finally {
      setSaving(false);
    }
  };

  const exportResults = (draw: Draw) => {
    if (!draw.results) return;

    const results = draw.results;
    let csv = 'Posición,Código,Nombre,CI,Ciudad,Email,Teléfono\n';

    results.finalists?.forEach((f: any, index: number) => {
      csv += `${index + 1},${f.code},${f.full_name || ''},${f.dni || ''},${f.city || ''},${f.email || ''},${f.phone || ''}\n`;
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

  // Show Tombola if active
  if (tombolaActive) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" />
              {form.name}
            </h2>
            <p className="text-muted-foreground">Sorteo en progreso...</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setTombolaActive(false)}
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            Cancelar Sorteo
          </Button>
        </div>
        
        <DrawTombola 
          onComplete={handleDrawComplete}
          finalistsCount={parseInt(form.finalists_count)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sorteo</h2>
          <p className="text-muted-foreground">Ejecutar sorteo interactivo sobre cupones activos</p>
        </div>
        <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg">
              <Trophy className="h-4 w-4 mr-2" />
              Nuevo Sorteo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Configurar Sorteo
              </DialogTitle>
              <DialogDescription>
                Configura los parámetros del sorteo interactivo
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Stats */}
              <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-cyan-500/30">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-cyan-500/20">
                      <Ticket className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-cyan-400">{activeCouponsCount}</p>
                      <p className="text-sm text-muted-foreground">Cupones Activos Disponibles</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Sorteo *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Sorteo Final Mundial 2026"
                  className="bg-slate-800 border-slate-600"
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
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="finalists">Ganadores a Elegir</Label>
                  <Input
                    id="finalists"
                    type="number"
                    value={form.finalists_count}
                    onChange={(e) => setForm({ ...form, finalists_count: e.target.value })}
                    min="1"
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
              </div>

              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="py-3">
                  <p className="text-sm text-amber-400">
                    💡 La tómbola interactiva te permitirá seleccionar {form.finalists_count} ganador(es) de forma animada y dramática.
                  </p>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSetupDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleStartDraw} 
                disabled={!form.name || activeCouponsCount === 0}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Tómbola
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Banner */}
      <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-500/20">
              <Sparkles className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">Tómbola Interactiva</p>
              <p className="text-sm text-muted-foreground">
                Ejecuta sorteos con una animación estilo "slot machine" para seleccionar ganadores de forma dramática y transparente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Previous Draws */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Sorteos
        </h3>
        
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-700 hover:bg-slate-700 border-b border-slate-600">
                  <TableHead className="font-bold text-white">Nombre</TableHead>
                  <TableHead className="font-bold text-white">Preseleccionados</TableHead>
                  <TableHead className="font-bold text-white">Finalistas</TableHead>
                  <TableHead className="font-bold text-white">Fecha</TableHead>
                  <TableHead className="font-bold text-white text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {draws.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground bg-white">
                      No hay sorteos realizados
                    </TableCell>
                  </TableRow>
                ) : (
                  draws.map((draw) => (
                    <TableRow key={draw.id} className="bg-white hover:bg-slate-50 border-b border-slate-200">
                      <TableCell className="font-medium text-slate-800">{draw.name}</TableCell>
                      <TableCell className="text-slate-700">{draw.preselected_count}</TableCell>
                      <TableCell className="text-slate-700">{draw.finalists_count}</TableCell>
                      <TableCell className="text-slate-600">
                        {draw.executed_at ? new Date(draw.executed_at).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {draw.results && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => exportResults(draw)} 
                            className="border-slate-300 text-slate-700 hover:bg-slate-100"
                          >
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
      </div>

      {/* Latest Draw Results */}
      {draws[0]?.results && (
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Últimos Resultados: {draws[0].name}
            </CardTitle>
            <CardDescription>
              {draws[0].results.total_coupons} cupones participaron
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3 text-amber-500 flex items-center gap-2">
                  🏆 Ganadores
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {draws[0].results.finalists?.map((f: any, i: number) => (
                    <Card key={i} className="bg-slate-800/50 border-amber-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-amber-500 text-white">#{i + 1}</Badge>
                          <span className="font-mono text-cyan-400 text-sm">{f.code}</span>
                        </div>
                        <p className="text-white font-medium">{f.full_name || 'Participante'}</p>
                        {f.city && <p className="text-slate-400 text-sm">{f.city}</p>}
                        {f.dni && <p className="text-slate-500 text-xs">CI: {f.dni}</p>}
                      </CardContent>
                    </Card>
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
