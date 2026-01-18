import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LandingTheme {
  primary: string;
  accent: string;
  overlayOpacity: number;
}

export interface LandingSections {
  showBenefits: boolean;
  showRequirements: boolean;
  showBot: boolean;
}

export interface LandingSettings {
  id: string;
  campaign_name: string;
  campaign_tagline: string;
  cta_text: string;
  campaign_start_date: string;
  campaign_end_date: string;
  draw_date: string;
  prize_destination: string;
  benefits: string[];
  requirements: string[];
  disclaimer: string | null;
  hero_background_url: string | null;
  hero_banner_url: string | null;
  logo_url: string | null;
  theme: LandingTheme;
  sections: LandingSections;
  is_active: boolean;
  updated_at: string;
  updated_by: string | null;
  created_at: string;
}

// Default settings for fallback
export const DEFAULT_LANDING_SETTINGS: Omit<LandingSettings, 'id' | 'updated_at' | 'updated_by' | 'created_at'> = {
  campaign_name: "EL SUEÑO DEL HINCHA SKYWORTH",
  campaign_tagline: "Gánate 1 viaje a Monterrey para alentar a La Verde en el repechaje",
  cta_text: "REGISTRAR COMPRA",
  campaign_start_date: new Date().toISOString().split('T')[0],
  campaign_end_date: "2026-07-15",
  draw_date: "2026-07-15T23:00:00+00:00",
  prize_destination: "Monterrey",
  benefits: [
    "Pasajes aéreos ida y vuelta",
    "Hospedaje 4 noches",
    "Entradas al partido",
    "Traslados aeropuerto-hotel-estadio"
  ],
  requirements: [
    "Mayor de 18 años",
    "Compra de TV Skyworth participante",
    "Datos deben coincidir con póliza y factura",
    "Documentos obligatorios: Factura, Póliza llenada, TAG de garantía"
  ],
  disclaimer: "Promoción válida hasta agotar stock. Consulta bases y condiciones completas.",
  hero_background_url: null,
  hero_banner_url: null,
  logo_url: null,
  theme: {
    primary: "142 71% 45%",
    accent: "45 93% 47%",
    overlayOpacity: 0.6
  },
  sections: {
    showBenefits: true,
    showRequirements: true,
    showBot: true
  },
  is_active: true
};

export function useLandingSettings() {
  return useQuery({
    queryKey: ["landing-settings"],
    queryFn: async (): Promise<LandingSettings> => {
      const { data, error } = await supabase
        .from("landing_settings")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching landing settings:", error);
        // Return defaults if no settings found
        return {
          ...DEFAULT_LANDING_SETTINGS,
          id: "default",
          updated_at: new Date().toISOString(),
          updated_by: null,
          created_at: new Date().toISOString()
        } as LandingSettings;
      }

      // Parse JSONB fields
      return {
        ...data,
        benefits: Array.isArray(data.benefits) ? data.benefits : JSON.parse(data.benefits as string),
        requirements: Array.isArray(data.requirements) ? data.requirements : JSON.parse(data.requirements as string),
        theme: typeof data.theme === 'object' ? data.theme : JSON.parse(data.theme as string),
        sections: typeof data.sections === 'object' ? data.sections : JSON.parse(data.sections as string)
      } as LandingSettings;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useUpdateLandingSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<LandingSettings> & { id: string }) => {
      const { id, ...updateData } = updates;
      
      // Convert to JSON-compatible types for Supabase
      const dbPayload: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };
      
      if (updateData.campaign_name !== undefined) dbPayload.campaign_name = updateData.campaign_name;
      if (updateData.campaign_tagline !== undefined) dbPayload.campaign_tagline = updateData.campaign_tagline;
      if (updateData.cta_text !== undefined) dbPayload.cta_text = updateData.cta_text;
      if (updateData.campaign_start_date !== undefined) dbPayload.campaign_start_date = updateData.campaign_start_date;
      if (updateData.campaign_end_date !== undefined) dbPayload.campaign_end_date = updateData.campaign_end_date;
      if (updateData.draw_date !== undefined) dbPayload.draw_date = updateData.draw_date;
      if (updateData.prize_destination !== undefined) dbPayload.prize_destination = updateData.prize_destination;
      if (updateData.benefits !== undefined) dbPayload.benefits = JSON.stringify(updateData.benefits);
      if (updateData.requirements !== undefined) dbPayload.requirements = JSON.stringify(updateData.requirements);
      if (updateData.disclaimer !== undefined) dbPayload.disclaimer = updateData.disclaimer;
      if (updateData.hero_background_url !== undefined) dbPayload.hero_background_url = updateData.hero_background_url;
      if (updateData.hero_banner_url !== undefined) dbPayload.hero_banner_url = updateData.hero_banner_url;
      if (updateData.logo_url !== undefined) dbPayload.logo_url = updateData.logo_url;
      if (updateData.theme !== undefined) dbPayload.theme = JSON.stringify(updateData.theme);
      if (updateData.sections !== undefined) dbPayload.sections = JSON.stringify(updateData.sections);

      const { data, error } = await supabase
        .from("landing_settings")
        .update(dbPayload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-settings"] });
      toast.success("Configuración guardada correctamente");
    },
    onError: (error) => {
      console.error("Error updating landing settings:", error);
      toast.error("Error al guardar la configuración");
    }
  });
}

// Helper to calculate days until draw
export function getDaysUntilDraw(drawDate: string): number {
  const now = new Date();
  const draw = new Date(drawDate);
  const diffTime = draw.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Helper to format draw date
export function formatDrawDate(drawDate: string): string {
  const date = new Date(drawDate);
  return date.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
