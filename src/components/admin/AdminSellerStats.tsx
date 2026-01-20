import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Loader2, TrendingUp, Users, Star, Trophy, Calendar, 
  Download, RefreshCw, BarChart3, Target, Award
} from 'lucide-react';

const DEPARTMENTS = ['Santa Cruz', 'Cochabamba', 'La Paz'];
const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'custom', label: 'Rango personalizado' },
  { value: 'all', label: 'Todo el tiempo' },
];

interface Stats {
  total_sales: number;
  approved_sales: number;
  pending_sales: number;
  rejected_sales: number;
  total_points: number;
  approval_rate: number;
  top_by_department: Array<{
    department: string;
    seller_id: string;
    store_name: string;
    total_points: number;
  }>;
}

interface RankingSeller {
  id: string;
  store_name: string;
  store_city: string;
  total_points: number;
  total_sales: number;
  user_id: string;
}

export default function AdminSellerStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [rankingByDept, setRankingByDept] = useState<Record<string, RankingSeller[]>>({});
  const [period, setPeriod] = useState('all');
  const [department, setDepartment] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadStats();
    loadRankingByDepartment();
  }, [period, department, startDate, endDate]);

  const getDateRange = (): { start: string | null; end: string | null } => {
    const today = new Date();
    let start: Date | null = null;
    let end: Date | null = new Date();

    switch (period) {
      case 'today':
        start = new Date(today.setHours(0, 0, 0, 0));
        break;
      case 'week':
        start = new Date(today);
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start = new Date(today);
        start.setMonth(start.getMonth() - 1);
        break;
      case 'custom':
        return {
          start: startDate || null,
          end: endDate || null
        };
      default:
        return { start: null, end: null };
    }

    return {
      start: start ? start.toISOString().split('T')[0] : null,
      end: end.toISOString().split('T')[0]
    };
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      
      const { data, error } = await supabase.rpc('get_seller_stats', {
        p_start_date: start,
        p_end_date: end,
        p_department: department === 'all' ? null : department
      });

      if (error) throw error;
      setStats(data as unknown as Stats);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const loadRankingByDepartment = async () => {
    try {
      const rankings: Record<string, RankingSeller[]> = {};
      
      for (const dept of DEPARTMENTS) {
        const { data, error } = await supabase.rpc('get_seller_ranking_by_department', {
          p_department: dept,
          p_limit: 10
        });
        
        if (!error && data) {
          rankings[dept] = data as unknown as RankingSeller[];
        }
      }
      
      setRankingByDept(rankings);
    } catch (error) {
      console.error('Error loading rankings:', error);
    }
  };

  const exportCSV = () => {
    if (!stats) return;
    
    let csv = 'Métrica,Valor\n';
    csv += `Total Ventas Registradas,${stats.total_sales}\n`;
    csv += `Ventas Aprobadas,${stats.approved_sales}\n`;
    csv += `Ventas Pendientes,${stats.pending_sales}\n`;
    csv += `Ventas Rechazadas,${stats.rejected_sales}\n`;
    csv += `Tasa de Aprobación,${stats.approval_rate}%\n`;
    csv += `Total Puntos Generados,${stats.total_points}\n`;
    csv += '\nTop por Departamento\n';
    csv += 'Departamento,Tienda,Puntos\n';
    stats.top_by_department?.forEach(t => {
      csv += `${t.department},${t.store_name},${t.total_points}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estadisticas-vendedores-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading && !stats) {
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
          <h2 className="text-2xl font-bold text-foreground">Estadísticas de Vendedores</h2>
          <p className="text-muted-foreground">Métricas y rankings por departamento</p>
        </div>
        <Button onClick={exportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-48 bg-slate-800 border-slate-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {period === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label>Desde</Label>
                  <Input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hasta</Label>
                  <Input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-48 bg-slate-800 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {DEPARTMENTS.map(dep => (
                    <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" onClick={loadStats} className="border-slate-600">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-500">{stats.total_sales}</p>
                  <p className="text-xs text-muted-foreground">Total Ventas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-500">{stats.approved_sales}</p>
                  <p className="text-xs text-muted-foreground">Aprobadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold text-amber-500">{stats.pending_sales}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-500">{stats.rejected_sales}</p>
                  <p className="text-xs text-muted-foreground">Rechazadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-purple-500">{stats.total_points.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Puntos Totales</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border-cyan-500/30">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-cyan-500" />
                <div>
                  <p className="text-2xl font-bold text-cyan-500">{stats.approval_rate}%</p>
                  <p className="text-xs text-muted-foreground">Tasa Aprobación</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top by Department */}
      {stats?.top_by_department && stats.top_by_department.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Top Vendedor por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.top_by_department.map((top) => (
                <Card key={top.department} className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/30">
                  <CardContent className="py-4">
                    <Badge variant="outline" className="mb-2">{top.department}</Badge>
                    <p className="font-bold text-lg">{top.store_name}</p>
                    <p className="text-2xl font-black text-amber-500">{top.total_points} pts</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rankings by Department */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {DEPARTMENTS.map((dept) => (
          <Card key={dept}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className={`h-5 w-5 ${dept === 'Santa Cruz' ? 'text-green-500' : dept === 'Cochabamba' ? 'text-blue-500' : 'text-red-500'}`} />
                Ranking {dept}
              </CardTitle>
              <CardDescription>Top 10 vendedores</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Tienda</TableHead>
                    <TableHead className="text-right">Puntos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankingByDept[dept]?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        Sin vendedores
                      </TableCell>
                    </TableRow>
                  ) : (
                    rankingByDept[dept]?.map((seller, index) => (
                      <TableRow key={seller.id}>
                        <TableCell className="font-bold">
                          {index + 1 <= 3 ? (
                            <span className={`${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-600'}`}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                            </span>
                          ) : (
                            index + 1
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{seller.store_name}</p>
                          <p className="text-xs text-muted-foreground">{seller.total_sales} ventas</p>
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {seller.total_points}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
