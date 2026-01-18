-- Add setting for automatic seller winner feature
INSERT INTO secure_settings (key, value, is_enabled)
VALUES ('SELLER_AUTO_WINNER_ENABLED', null, false)
ON CONFLICT (key) DO NOTHING;

-- Create table to store seller winners
CREATE TABLE IF NOT EXISTS public.seller_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.campaign(id) ON DELETE CASCADE,
  total_sales INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  won_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seller_winners ENABLE ROW LEVEL SECURITY;

-- Policies for seller_winners
CREATE POLICY "Admins can manage seller winners" 
ON public.seller_winners 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view seller winners" 
ON public.seller_winners 
FOR SELECT 
TO authenticated 
USING (true);