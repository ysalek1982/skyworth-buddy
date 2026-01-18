import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface TermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TermsModal({ open, onOpenChange }: TermsModalProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadTerms();
    }
  }, [open]);

  const loadTerms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('landing_settings')
        .select('terms_conditions')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      setContent(data?.terms_conditions || '<p>Términos y condiciones no disponibles.</p>');
    } catch (error) {
      console.error('Error loading terms:', error);
      setContent('<p>Error al cargar los términos y condiciones.</p>');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-foreground">
            Términos y Condiciones
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[70vh] px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div 
              className="terms-html-content prose prose-sm max-w-none dark:prose-invert
                [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-4 [&_h2]:mt-6
                [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mb-3 [&_h3]:mt-5
                [&_h4]:text-base [&_h4]:font-medium [&_h4]:text-foreground [&_h4]:mb-2 [&_h4]:mt-4
                [&_p]:text-muted-foreground [&_p]:mb-3 [&_p]:leading-relaxed
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1
                [&_li]:text-muted-foreground [&_li]:text-sm
                [&_strong]:text-foreground [&_strong]:font-semibold
                [&_em]:italic
                [&_table]:w-full [&_table]:border-collapse [&_table]:mb-4
                [&_th]:bg-muted [&_th]:p-2 [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold [&_th]:border [&_th]:border-border
                [&_td]:p-2 [&_td]:text-sm [&_td]:border [&_td]:border-border [&_td]:text-muted-foreground
              "
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
