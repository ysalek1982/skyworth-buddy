import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Campaign {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  draw_date: string | null;
  is_active: boolean;
}

export function useCampaign() {
  return useQuery({
    queryKey: ['campaign'],
    queryFn: async (): Promise<Campaign | null> => {
      const { data, error } = await supabase
        .from('campaign')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching campaign:', error);
        return null;
      }

      return data;
    },
    staleTime: 1000 * 60 * 10,
  });
}
