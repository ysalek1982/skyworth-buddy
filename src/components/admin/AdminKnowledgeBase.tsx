import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, BookOpen, Eye, EyeOff } from 'lucide-react';

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const initialForm = {
  title: '',
  content: '',
  category: ''
};

export default function AdminKnowledgeBase() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      toast.error('Error al cargar base de conocimientos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const entryData = {
        title: form.title,
        content: form.content,
        category: form.category || null
      };

      if (editingEntry) {
        const { error } = await supabase
          .from('knowledge_base')
          .update(entryData)
          .eq('id', editingEntry.id);

        if (error) throw error;
        toast.success('Artículo actualizado');
      } else {
        const { error } = await supabase
          .from('knowledge_base')
          .insert(entryData);

        if (error) throw error;
        toast.success('Artículo creado');
      }

      setDialogOpen(false);
      setEditingEntry(null);
      setForm(initialForm);
      loadEntries();
    } catch (error: any) {
      console.error('Error saving entry:', error);
      toast.error(error.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry: KnowledgeEntry) => {
    setEditingEntry(entry);
    setForm({
      title: entry.title,
      content: entry.content,
      category: entry.category || ''
    });
    setDialogOpen(true);
  };

  const handleToggleActive = async (entry: KnowledgeEntry) => {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .update({ is_active: !entry.is_active })
        .eq('id', entry.id);

      if (error) throw error;
      toast.success(`Artículo ${entry.is_active ? 'desactivado' : 'activado'}`);
      loadEntries();
    } catch (error) {
      console.error('Error toggling entry:', error);
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este artículo?')) return;

    try {
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Artículo eliminado');
      loadEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Error al eliminar');
    }
  };

  const handleOpenDialog = () => {
    setEditingEntry(null);
    setForm(initialForm);
    setDialogOpen(true);
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
          <h2 className="text-2xl font-bold text-foreground">Base de Conocimientos</h2>
          <p className="text-muted-foreground">Artículos para el chatbot</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Artículo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? 'Editar Artículo' : 'Nuevo Artículo'}
              </DialogTitle>
              <DialogDescription>
                {editingEntry ? 'Modifica el contenido del artículo' : 'Agrega un nuevo artículo a la base de conocimientos'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Título del artículo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Ej: FAQ, Promoción, Productos"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Contenido *</Label>
                <Textarea
                  id="content"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Contenido del artículo..."
                  rows={8}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-700 hover:bg-slate-700 border-b border-slate-600">
                <TableHead className="font-bold text-white">Título</TableHead>
                <TableHead className="font-bold text-white">Categoría</TableHead>
                <TableHead className="font-bold text-white">Estado</TableHead>
                <TableHead className="font-bold text-white">Actualizado</TableHead>
                <TableHead className="font-bold text-white text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground bg-white">
                    No hay artículos
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id} className="bg-white hover:bg-slate-50 border-b border-slate-200">
                    <TableCell className="font-medium text-slate-800">{entry.title}</TableCell>
                    <TableCell>
                      {entry.category ? (
                        <Badge className="bg-blue-500 text-white">{entry.category}</Badge>
                      ) : <span className="text-slate-400">-</span>}
                    </TableCell>
                    <TableCell>
                      <Badge className={entry.is_active ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}>
                        {entry.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">{new Date(entry.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleToggleActive(entry)} className="text-slate-600 hover:text-slate-900">
                          {entry.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(entry)} className="text-slate-600 hover:text-slate-900">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(entry.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
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
