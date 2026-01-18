-- Create landing_settings table for CMS
CREATE TABLE public.landing_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name TEXT NOT NULL DEFAULT 'EL SUEÑO DEL HINCHA SKYWORTH',
  campaign_tagline TEXT NOT NULL DEFAULT 'Gánate 1 viaje a Monterrey para alentar a La Verde en el repechaje',
  cta_text TEXT NOT NULL DEFAULT 'REGISTRAR COMPRA',
  campaign_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  campaign_end_date DATE NOT NULL DEFAULT '2026-07-15',
  draw_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '2026-07-15 23:00:00+00',
  prize_destination TEXT NOT NULL DEFAULT 'Monterrey',
  benefits JSONB NOT NULL DEFAULT '["Pasajes aéreos ida y vuelta", "Hospedaje 4 noches", "Entradas al partido", "Traslados aeropuerto-hotel-estadio"]'::jsonb,
  requirements JSONB NOT NULL DEFAULT '["Mayor de 18 años", "Compra de TV Skyworth participante", "Datos deben coincidir con póliza y factura", "Documentos obligatorios: Factura, Póliza llenada, TAG de garantía"]'::jsonb,
  disclaimer TEXT DEFAULT 'Promoción válida hasta agotar stock. Consulta bases y condiciones completas.',
  hero_background_url TEXT,
  hero_banner_url TEXT,
  logo_url TEXT,
  theme JSONB NOT NULL DEFAULT '{"primary": "142 71% 45%", "accent": "45 93% 47%", "overlayOpacity": 0.6}'::jsonb,
  sections JSONB NOT NULL DEFAULT '{"showBenefits": true, "showRequirements": true, "showBot": true}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage landing settings
CREATE POLICY "Admins manage landing settings"
ON public.landing_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can read active landing settings
CREATE POLICY "Anyone read active landing settings"
ON public.landing_settings
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_landing_settings_updated_at
BEFORE UPDATE ON public.landing_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.landing_settings (id) VALUES (gen_random_uuid());