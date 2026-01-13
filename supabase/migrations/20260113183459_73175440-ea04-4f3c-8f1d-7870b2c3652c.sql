-- =====================================================
-- SKYWORTH GOAL GETTER 2026 - Complete Schema Migration
-- =====================================================

-- 1. Create ENUM types
DO $$ BEGIN
  CREATE TYPE public.buyer_status AS ENUM ('NOT_REGISTERED', 'REGISTERED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.seller_status AS ENUM ('NOT_REGISTERED', 'REGISTERED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.serial_status AS ENUM ('AVAILABLE', 'BLOCKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.coupon_status AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.owner_type AS ENUM ('BUYER', 'SELLER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  description TEXT,
  screen_size INTEGER,
  tier TEXT NOT NULL DEFAULT 'T1' CHECK (tier IN ('T1', 'T2', 'T3')),
  ticket_multiplier INTEGER NOT NULL DEFAULT 1,
  coupon_multiplier INTEGER DEFAULT 1,
  seller_coupon_multiplier INTEGER DEFAULT 1,
  points_value INTEGER NOT NULL DEFAULT 10,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TV Serials table
CREATE TABLE IF NOT EXISTS public.tv_serials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number TEXT NOT NULL UNIQUE,
  product_id UUID REFERENCES public.products(id),
  status public.serial_status NOT NULL DEFAULT 'AVAILABLE',
  buyer_status public.buyer_status NOT NULL DEFAULT 'NOT_REGISTERED',
  seller_status public.seller_status NOT NULL DEFAULT 'NOT_REGISTERED',
  buyer_purchase_id UUID,
  seller_sale_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Sellers table
CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  store_city TEXT NOT NULL,
  phone TEXT,
  total_points INTEGER NOT NULL DEFAULT 0,
  total_sales INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 5. Seller Sales table
CREATE TABLE IF NOT EXISTS public.seller_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  serial_number TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id),
  invoice_number TEXT,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Client Purchases table
CREATE TABLE IF NOT EXISTS public.client_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  serial_number TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id),
  full_name TEXT NOT NULL,
  dni TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT,
  purchase_date DATE NOT NULL,
  invoice_url TEXT,
  id_front_url TEXT,
  id_back_url TEXT,
  admin_status TEXT DEFAULT 'PENDING' CHECK (admin_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  ai_validation_result JSONB,
  rejection_reason TEXT,
  coupons_generated INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  owner_type public.owner_type NOT NULL,
  buyer_purchase_id UUID REFERENCES public.client_purchases(id),
  seller_sale_id UUID REFERENCES public.seller_sales(id),
  serial_id UUID REFERENCES public.tv_serials(id),
  status public.coupon_status NOT NULL DEFAULT 'ACTIVE',
  draw_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Campaign settings
CREATE TABLE IF NOT EXISTS public.campaign (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Skyworth Mundial 2026',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT '2026-07-15',
  draw_date TIMESTAMPTZ DEFAULT '2026-07-15 18:00:00-05',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Secure Settings
CREATE TABLE IF NOT EXISTS public.secure_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Notification Templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp')),
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Knowledge Base (without vector for now)
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Draws table
CREATE TABLE IF NOT EXISTS public.draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  executed_at TIMESTAMPTZ,
  preselected_count INTEGER DEFAULT 20,
  finalists_count INTEGER DEFAULT 5,
  results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tv_serials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secure_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage serials" ON public.tv_serials FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can read serials" ON public.tv_serials FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Sellers can view own data" ON public.sellers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Sellers can update own data" ON public.sellers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can register as seller" ON public.sellers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all sellers" ON public.sellers FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sellers view own sales" ON public.seller_sales FOR SELECT USING (EXISTS (SELECT 1 FROM public.sellers WHERE sellers.id = seller_sales.seller_id AND sellers.user_id = auth.uid()));
CREATE POLICY "Sellers insert own sales" ON public.seller_sales FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.sellers WHERE sellers.id = seller_sales.seller_id AND sellers.user_id = auth.uid()));
CREATE POLICY "Admins manage all sales" ON public.seller_sales FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own purchases" ON public.client_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Auth can register purchases" ON public.client_purchases FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage all purchases" ON public.client_purchases FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own coupons" ON public.coupons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.client_purchases cp WHERE cp.id = coupons.buyer_purchase_id AND cp.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.seller_sales ss JOIN public.sellers s ON s.id = ss.seller_id WHERE ss.id = coupons.seller_sale_id AND s.user_id = auth.uid())
);
CREATE POLICY "Admins manage all coupons" ON public.coupons FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone read campaign" ON public.campaign FOR SELECT USING (true);
CREATE POLICY "Admins manage campaign" ON public.campaign FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage secure settings" ON public.secure_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage notification templates" ON public.notification_templates FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone read active kb" ON public.knowledge_base FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage kb" ON public.knowledge_base FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage draws" ON public.draws FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tv_serials_updated_at BEFORE UPDATE ON public.tv_serials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON public.sellers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_purchases_updated_at BEFORE UPDATE ON public.client_purchases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_secure_settings_updated_at BEFORE UPDATE ON public.secure_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON public.notification_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON public.knowledge_base FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- RPC FUNCTIONS
-- =====================================================
CREATE OR REPLACE FUNCTION public.rpc_register_buyer_serial(
  p_serial_number TEXT, p_full_name TEXT, p_dni TEXT, p_email TEXT, p_phone TEXT, p_city TEXT, p_purchase_date DATE, p_user_id UUID DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_serial RECORD; v_product RECORD; v_purchase_id UUID; v_coupon_count INTEGER; v_coupons TEXT[] := ARRAY[]::TEXT[]; v_coupon_code TEXT;
BEGIN
  SELECT * INTO v_serial FROM tv_serials WHERE serial_number = UPPER(p_serial_number);
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Serial no existe'); END IF;
  IF v_serial.status = 'BLOCKED' THEN RETURN jsonb_build_object('success', false, 'error', 'Serial BLOQUEADO'); END IF;
  IF v_serial.buyer_status = 'REGISTERED' THEN RETURN jsonb_build_object('success', false, 'error', 'Serial ya registrado por comprador'); END IF;
  
  SELECT * INTO v_product FROM products WHERE id = v_serial.product_id;
  v_coupon_count := COALESCE(v_product.coupon_multiplier, v_product.ticket_multiplier, 1);
  
  INSERT INTO client_purchases (user_id, serial_number, product_id, full_name, dni, email, phone, city, purchase_date, admin_status)
  VALUES (p_user_id, UPPER(p_serial_number), v_serial.product_id, p_full_name, p_dni, p_email, p_phone, p_city, p_purchase_date, 'APPROVED')
  RETURNING id INTO v_purchase_id;
  
  UPDATE tv_serials SET buyer_status = 'REGISTERED', buyer_purchase_id = v_purchase_id, updated_at = now() WHERE id = v_serial.id;
  
  FOR i IN 1..v_coupon_count LOOP
    v_coupon_code := 'SKY-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));
    INSERT INTO coupons (code, owner_type, buyer_purchase_id, serial_id, status) VALUES (v_coupon_code, 'BUYER', v_purchase_id, v_serial.id, 'ACTIVE');
    v_coupons := array_append(v_coupons, v_coupon_code);
  END LOOP;
  
  UPDATE client_purchases SET coupons_generated = v_coupon_count WHERE id = v_purchase_id;
  RETURN jsonb_build_object('success', true, 'purchase_id', v_purchase_id, 'coupons', to_jsonb(v_coupons), 'coupon_count', v_coupon_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_register_seller_serial(
  p_seller_id UUID, p_serial_number TEXT, p_invoice_number TEXT DEFAULT NULL, p_client_name TEXT DEFAULT 'Cliente', p_client_phone TEXT DEFAULT NULL, p_sale_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_serial RECORD; v_product RECORD; v_sale_id UUID; v_points INTEGER; v_coupon_count INTEGER; v_coupons TEXT[] := ARRAY[]::TEXT[]; v_coupon_code TEXT;
BEGIN
  SELECT * INTO v_serial FROM tv_serials WHERE serial_number = UPPER(p_serial_number);
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Serial no existe'); END IF;
  IF v_serial.status = 'BLOCKED' THEN RETURN jsonb_build_object('success', false, 'error', 'Serial BLOQUEADO'); END IF;
  IF v_serial.seller_status = 'REGISTERED' THEN RETURN jsonb_build_object('success', false, 'error', 'Serial ya registrado por vendedor'); END IF;
  
  SELECT * INTO v_product FROM products WHERE id = v_serial.product_id;
  v_points := COALESCE(v_product.points_value, 10);
  v_coupon_count := COALESCE(v_product.seller_coupon_multiplier, 1);
  
  INSERT INTO seller_sales (seller_id, serial_number, product_id, invoice_number, client_name, client_phone, sale_date, points_earned)
  VALUES (p_seller_id, UPPER(p_serial_number), v_serial.product_id, p_invoice_number, p_client_name, p_client_phone, p_sale_date, v_points)
  RETURNING id INTO v_sale_id;
  
  UPDATE tv_serials SET seller_status = 'REGISTERED', seller_sale_id = v_sale_id, updated_at = now() WHERE id = v_serial.id;
  UPDATE sellers SET total_points = total_points + v_points, total_sales = total_sales + 1, updated_at = now() WHERE id = p_seller_id;
  
  FOR i IN 1..v_coupon_count LOOP
    v_coupon_code := 'SKY-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));
    INSERT INTO coupons (code, owner_type, seller_sale_id, serial_id, status) VALUES (v_coupon_code, 'SELLER', v_sale_id, v_serial.id, 'ACTIVE');
    v_coupons := array_append(v_coupons, v_coupon_code);
  END LOOP;
  
  RETURN jsonb_build_object('success', true, 'sale_id', v_sale_id, 'points', v_points, 'coupons', to_jsonb(v_coupons));
END;
$$;

-- =====================================================
-- SAMPLE DATA
-- =====================================================
INSERT INTO public.campaign (name, start_date, end_date, draw_date, is_active)
SELECT 'Skyworth Mundial 2026', '2025-01-01', '2026-07-15', '2026-07-15 18:00:00-05', true
WHERE NOT EXISTS (SELECT 1 FROM public.campaign LIMIT 1);

INSERT INTO public.products (model_name, screen_size, tier, ticket_multiplier, coupon_multiplier, points_value, is_active)
VALUES 
  ('Skyworth 32" LED', 32, 'T3', 1, 1, 10, true),
  ('Skyworth 43" 4K UHD', 43, 'T2', 2, 2, 20, true),
  ('Skyworth 55" QLED', 55, 'T1', 3, 3, 30, true),
  ('Skyworth 65" OLED', 65, 'T1', 5, 5, 50, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.secure_settings (key, value, is_enabled) VALUES 
  ('GEMINI_API_KEY', '', false), ('BOT_ENABLED', 'false', false),
  ('WHATSAPP_TOKEN', '', false), ('WHATSAPP_PHONE_ID', '', false), ('WHATSAPP_ENABLED', 'false', false),
  ('SMTP_HOST', '', false), ('SMTP_PORT', '587', false), ('SMTP_USER', '', false), ('SMTP_PASS', '', false), ('SMTP_FROM', '', false), ('EMAIL_ENABLED', 'false', false)
ON CONFLICT (key) DO NOTHING;

-- Add 'seller' to app_role if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'seller' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'seller';
  END IF;
END $$;