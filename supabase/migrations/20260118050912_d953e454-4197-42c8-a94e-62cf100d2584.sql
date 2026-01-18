-- Drop and recreate the RPC function to handle existing purchases
CREATE OR REPLACE FUNCTION public.rpc_register_buyer_serial(
  p_serial_number TEXT,
  p_full_name TEXT,
  p_dni TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_city TEXT DEFAULT '',
  p_purchase_date DATE DEFAULT CURRENT_DATE,
  p_user_id UUID DEFAULT NULL,
  p_existing_purchase_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_serial RECORD; 
  v_product RECORD; 
  v_purchase_id UUID; 
  v_coupon_count INTEGER; 
  v_coupons TEXT[] := ARRAY[]::TEXT[]; 
  v_coupon_code TEXT;
  v_year TEXT;
BEGIN
  -- Find the serial
  SELECT * INTO v_serial FROM tv_serials WHERE serial_number = UPPER(TRIM(p_serial_number));
  IF NOT FOUND THEN 
    RETURN jsonb_build_object('success', false, 'error', 'Serial no encontrado. Verifica el número de serie.'); 
  END IF;
  
  -- Check if blocked
  IF v_serial.status = 'BLOCKED' THEN 
    RETURN jsonb_build_object('success', false, 'error', 'Este serial está bloqueado y no puede participar.'); 
  END IF;
  
  -- Check if already registered by another buyer (but allow if same purchase is being approved)
  IF v_serial.buyer_status = 'REGISTERED' AND v_serial.buyer_purchase_id IS DISTINCT FROM p_existing_purchase_id THEN 
    RETURN jsonb_build_object('success', false, 'error', 'Este serial ya fue registrado por otro comprador.'); 
  END IF;
  
  -- Get product info for coupon count
  SELECT * INTO v_product FROM products WHERE id = v_serial.product_id;
  v_coupon_count := COALESCE(v_product.coupon_multiplier, v_product.ticket_multiplier, 1);
  
  -- If existing purchase ID is provided, use it (approval flow)
  IF p_existing_purchase_id IS NOT NULL THEN
    v_purchase_id := p_existing_purchase_id;
    
    -- Update existing purchase to APPROVED
    UPDATE client_purchases 
    SET admin_status = 'APPROVED', 
        coupons_generated = v_coupon_count,
        product_id = v_serial.product_id,
        updated_at = now()
    WHERE id = p_existing_purchase_id;
  ELSE
    -- Create new purchase record (direct registration flow)
    INSERT INTO client_purchases (
      user_id, serial_number, product_id, full_name, dni, email, phone, city, purchase_date, admin_status, coupons_generated
    )
    VALUES (
      p_user_id, UPPER(TRIM(p_serial_number)), v_serial.product_id, p_full_name, p_dni, p_email, p_phone, p_city, p_purchase_date, 'APPROVED', v_coupon_count
    )
    RETURNING id INTO v_purchase_id;
  END IF;
  
  -- Update serial status
  UPDATE tv_serials 
  SET buyer_status = 'REGISTERED', buyer_purchase_id = v_purchase_id, updated_at = now() 
  WHERE id = v_serial.id;
  
  -- Generate football-themed coupon codes: BOL-YEAR-XXXXXX
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  FOR i IN 1..v_coupon_count LOOP
    -- Generate unique code with format BOL-2026-XXXXXX
    v_coupon_code := 'BOL-' || v_year || '-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 6));
    
    INSERT INTO coupons (code, owner_type, buyer_purchase_id, serial_id, status) 
    VALUES (v_coupon_code, 'BUYER', v_purchase_id, v_serial.id, 'ACTIVE');
    
    v_coupons := array_append(v_coupons, v_coupon_code);
  END LOOP;
  
  -- Return success with all data
  RETURN jsonb_build_object(
    'success', true, 
    'purchase_id', v_purchase_id, 
    'coupons', to_jsonb(v_coupons), 
    'coupon_count', v_coupon_count,
    'product_name', v_product.model_name,
    'message', '¡Registro exitoso! Cupones generados: ' || v_coupon_count
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', 'Error interno: ' || SQLERRM);
END;
$$;