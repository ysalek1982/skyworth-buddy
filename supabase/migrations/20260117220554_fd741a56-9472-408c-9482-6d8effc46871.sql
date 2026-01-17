-- Add model_key column for unique internal identification
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS model_key TEXT;

-- Add unique constraint on model_key
CREATE UNIQUE INDEX IF NOT EXISTS products_model_key_unique ON public.products(model_key) WHERE model_key IS NOT NULL;

-- Deactivate existing products instead of deleting (preserving FK references)
UPDATE public.products SET is_active = false WHERE model_key IS NULL;

-- Insert the 9 official products with correct ticket multipliers (using T1-T3 for tier constraint)
INSERT INTO public.products (model_name, model_key, description, tier, ticket_multiplier, coupon_multiplier, seller_coupon_multiplier, points_value, is_active) VALUES
-- 4 Tickets products (Premium - T1)
('Q7500G', 'Q7500G_65_75', '65", 75"', 'T1', 4, 4, 4, 40, true),
('Q7700G', 'Q7700G_86', '86"', 'T1', 4, 4, 4, 40, true),
('Q7800G', 'Q7800G_100', '100"', 'T1', 4, 4, 4, 40, true),

-- 3 Tickets products (Mid - T2)
('Q6600H', 'Q6600H_55_75', '55", 60", 65", 75"', 'T2', 3, 3, 3, 30, true),
('G6600H - G6600G', 'G6600_55_75', '55", 60", 65", 75"', 'T2', 3, 3, 3, 30, true),

-- 2 Tickets products (Standard - T3)
('G6600H - G6600G', 'G6600_50', '50"', 'T3', 2, 2, 2, 20, true),
('E6600H', 'E6600H_32_43', '32", 43"', 'T3', 2, 2, 2, 20, true),
('E5500H - E5500G', 'E5500_40', '40"', 'T3', 2, 2, 2, 20, true),

-- 1 Ticket product (Entry - T3)
('E5500H - E5500G', 'E5500_32_43', '32", 43"', 'T3', 1, 1, 1, 10, true)
ON CONFLICT DO NOTHING;