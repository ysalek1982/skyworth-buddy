-- ============================================
-- COMPREHENSIVE MIGRATION: System Refactoring
-- ============================================

-- 1. Create ENUM for serial campaign type
DO $$ BEGIN
  CREATE TYPE public.serial_campaign_type AS ENUM ('CURRENT', 'LEGACY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create ENUM for seller sale status (review workflow)
DO $$ BEGIN
  CREATE TYPE public.seller_sale_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Add new columns to tv_serials for legacy tracking
ALTER TABLE public.tv_serials 
ADD COLUMN IF NOT EXISTS campaign_type text DEFAULT 'CURRENT' CHECK (campaign_type IN ('CURRENT', 'LEGACY')),
ADD COLUMN IF NOT EXISTS legacy_registered_at timestamp with time zone;

-- 4. Add blocking and audit columns to sellers
ALTER TABLE public.sellers
ADD COLUMN IF NOT EXISTS blocked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS blocked_reason text;

-- 5. Add review workflow columns to seller_sales
ALTER TABLE public.seller_sales
ADD COLUMN IF NOT EXISTS status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reviewed_by uuid,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 6. Add city/department column to client_purchases for tombola display
-- (city already exists, but we need to ensure it's used properly)

-- 7. Create index for filtering by campaign_type
CREATE INDEX IF NOT EXISTS idx_tv_serials_campaign_type ON public.tv_serials(campaign_type);

-- 8. Create index for filtering seller_sales by status
CREATE INDEX IF NOT EXISTS idx_seller_sales_status ON public.seller_sales(status);

-- 9. Create index for filtering sellers by store_city (department)
CREATE INDEX IF NOT EXISTS idx_sellers_store_city ON public.sellers(store_city);

-- ============================================
-- UPDATE RPC: rpc_register_seller_serial
-- Now checks campaign_type and creates sales as PENDING
-- Points only assigned on approval, not on registration
-- ============================================
CREATE OR REPLACE FUNCTION public.rpc_register_seller_serial(
  p_seller_id uuid, 
  p_serial_number text, 
  p_invoice_number text DEFAULT NULL::text, 
  p_client_name text DEFAULT 'Cliente'::text, 
  p_client_phone text DEFAULT NULL::text, 
  p_sale_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_serial RECORD;
  v_product RECORD;
  v_sale_id UUID;
  v_points INTEGER;
BEGIN
  -- Find the serial
  SELECT * INTO v_serial FROM tv_serials WHERE serial_number = UPPER(p_serial_number);
  IF NOT FOUND THEN 
    RETURN jsonb_build_object('success', false, 'error', 'Serial no encontrado. Verifica que el número de serie esté correctamente ingresado.'); 
  END IF;
  
  -- Check if blocked
  IF v_serial.status = 'BLOCKED' THEN 
    RETURN jsonb_build_object('success', false, 'error', 'Este serial está BLOQUEADO y no puede participar en la promoción.'); 
  END IF;
  
  -- NEW: Check if LEGACY - sellers cannot register LEGACY serials
  IF v_serial.campaign_type = 'LEGACY' THEN 
    RETURN jsonb_build_object('success', false, 'error', 'Este serial pertenece a campañas anteriores y solo puede ser registrado por participantes finales (compradores).'); 
  END IF;
  
  -- Check if already registered by seller
  IF v_serial.seller_status = 'REGISTERED' THEN 
    RETURN jsonb_build_object('success', false, 'error', 'Este serial ya fue registrado por otro vendedor.'); 
  END IF;
  
  -- Get product info for points (will be assigned on approval)
  SELECT * INTO v_product FROM products WHERE id = v_serial.product_id;
  v_points := COALESCE(v_product.points_value, 10);
  
  -- Create seller sale record with PENDING status
  -- NOTE: Points are NOT added to seller yet - only on approval
  INSERT INTO seller_sales (
    seller_id, serial_number, product_id, invoice_number, 
    client_name, client_phone, sale_date, points_earned, status
  )
  VALUES (
    p_seller_id, UPPER(p_serial_number), v_serial.product_id, 
    p_invoice_number, p_client_name, p_client_phone, p_sale_date, 
    v_points, 'PENDING'
  )
  RETURNING id INTO v_sale_id;
  
  -- Update serial status
  UPDATE tv_serials 
  SET seller_status = 'REGISTERED', seller_sale_id = v_sale_id, updated_at = now() 
  WHERE id = v_serial.id;
  
  -- DO NOT update seller points here - will be done on approval
  
  RETURN jsonb_build_object(
    'success', true, 
    'sale_id', v_sale_id, 
    'points', v_points,
    'status', 'PENDING',
    'message', 'Venta registrada. Pendiente de aprobación. Puntos potenciales: ' || v_points
  );
END;
$$;

-- ============================================
-- NEW RPC: Approve seller sale
-- Assigns points to seller on approval
-- ============================================
CREATE OR REPLACE FUNCTION public.rpc_approve_seller_sale(
  p_sale_id uuid,
  p_reviewer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sale RECORD;
BEGIN
  -- Get the sale record
  SELECT * INTO v_sale FROM seller_sales WHERE id = p_sale_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Venta no encontrada');
  END IF;
  
  IF v_sale.status = 'APPROVED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta venta ya fue aprobada');
  END IF;
  
  -- Update sale status to APPROVED
  UPDATE seller_sales 
  SET status = 'APPROVED', 
      reviewed_at = now(), 
      reviewed_by = p_reviewer_id
  WHERE id = p_sale_id;
  
  -- NOW add points to seller (only on approval)
  UPDATE sellers 
  SET total_points = total_points + v_sale.points_earned, 
      total_sales = total_sales + 1, 
      updated_at = now() 
  WHERE id = v_sale.seller_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'points_added', v_sale.points_earned,
    'message', 'Venta aprobada. Puntos asignados: ' || v_sale.points_earned
  );
END;
$$;

-- ============================================
-- NEW RPC: Reject seller sale
-- ============================================
CREATE OR REPLACE FUNCTION public.rpc_reject_seller_sale(
  p_sale_id uuid,
  p_reviewer_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sale RECORD;
BEGIN
  -- Get the sale record
  SELECT * INTO v_sale FROM seller_sales WHERE id = p_sale_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Venta no encontrada');
  END IF;
  
  IF v_sale.status = 'REJECTED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta venta ya fue rechazada');
  END IF;
  
  -- If was previously APPROVED, subtract points
  IF v_sale.status = 'APPROVED' THEN
    UPDATE sellers 
    SET total_points = total_points - v_sale.points_earned, 
        total_sales = total_sales - 1, 
        updated_at = now() 
    WHERE id = v_sale.seller_id;
  END IF;
  
  -- Update sale status to REJECTED
  UPDATE seller_sales 
  SET status = 'REJECTED', 
      reviewed_at = now(), 
      reviewed_by = p_reviewer_id,
      rejection_reason = p_reason
  WHERE id = p_sale_id;
  
  -- Release the serial for re-registration
  UPDATE tv_serials 
  SET seller_status = 'NOT_REGISTERED', seller_sale_id = NULL, updated_at = now() 
  WHERE serial_number = v_sale.serial_number;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Venta rechazada. Serial liberado para nuevo registro.'
  );
END;
$$;

-- ============================================
-- NEW RPC: Get seller stats with filters
-- ============================================
CREATE OR REPLACE FUNCTION public.get_seller_stats(
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_department text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_sales INTEGER;
  v_approved_sales INTEGER;
  v_pending_sales INTEGER;
  v_rejected_sales INTEGER;
  v_total_points INTEGER;
  v_approval_rate NUMERIC;
  v_top_by_dept jsonb;
BEGIN
  -- Base query with filters
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE ss.status = 'APPROVED'),
    COUNT(*) FILTER (WHERE ss.status = 'PENDING'),
    COUNT(*) FILTER (WHERE ss.status = 'REJECTED'),
    COALESCE(SUM(ss.points_earned) FILTER (WHERE ss.status = 'APPROVED'), 0)
  INTO v_total_sales, v_approved_sales, v_pending_sales, v_rejected_sales, v_total_points
  FROM seller_sales ss
  JOIN sellers s ON s.id = ss.seller_id
  WHERE 
    (p_start_date IS NULL OR ss.sale_date >= p_start_date)
    AND (p_end_date IS NULL OR ss.sale_date <= p_end_date)
    AND (p_department IS NULL OR s.store_city = p_department);
  
  -- Calculate approval rate
  IF v_total_sales > 0 THEN
    v_approval_rate := ROUND((v_approved_sales::NUMERIC / v_total_sales::NUMERIC) * 100, 1);
  ELSE
    v_approval_rate := 0;
  END IF;
  
  -- Get top seller by each department
  SELECT jsonb_agg(dept_top) INTO v_top_by_dept
  FROM (
    SELECT jsonb_build_object(
      'department', store_city,
      'seller_id', id,
      'store_name', store_name,
      'total_points', total_points
    ) as dept_top
    FROM (
      SELECT DISTINCT ON (store_city) 
        id, store_city, store_name, total_points
      FROM sellers
      WHERE is_active = true AND store_city IN ('Santa Cruz', 'Cochabamba', 'La Paz')
      ORDER BY store_city, total_points DESC
    ) ranked
  ) dept_tops;
  
  RETURN jsonb_build_object(
    'total_sales', v_total_sales,
    'approved_sales', v_approved_sales,
    'pending_sales', v_pending_sales,
    'rejected_sales', v_rejected_sales,
    'total_points', v_total_points,
    'approval_rate', v_approval_rate,
    'top_by_department', COALESCE(v_top_by_dept, '[]'::jsonb)
  );
END;
$$;

-- ============================================
-- NEW RPC: Get ranking by department
-- ============================================
CREATE OR REPLACE FUNCTION public.get_seller_ranking_by_department(
  p_department text,
  p_limit integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(seller_data) INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'id', s.id,
      'store_name', s.store_name,
      'store_city', s.store_city,
      'total_points', s.total_points,
      'total_sales', s.total_sales,
      'user_id', s.user_id
    ) as seller_data
    FROM sellers s
    WHERE s.is_active = true 
      AND s.store_city = p_department
    ORDER BY s.total_points DESC, s.total_sales DESC, s.updated_at DESC
    LIMIT p_limit
  ) ranked;
  
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;