-- Fix seller registration RPC to NOT create coupons - sellers only get points
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
AS $function$
DECLARE
  v_serial RECORD;
  v_product RECORD;
  v_sale_id UUID;
  v_points INTEGER;
BEGIN
  -- Find the serial
  SELECT * INTO v_serial FROM tv_serials WHERE serial_number = UPPER(p_serial_number);
  IF NOT FOUND THEN 
    RETURN jsonb_build_object('success', false, 'error', 'Serial no existe'); 
  END IF;
  
  -- Check if blocked
  IF v_serial.status = 'BLOCKED' THEN 
    RETURN jsonb_build_object('success', false, 'error', 'Serial BLOQUEADO'); 
  END IF;
  
  -- Check if already registered by seller
  IF v_serial.seller_status = 'REGISTERED' THEN 
    RETURN jsonb_build_object('success', false, 'error', 'Serial ya registrado por vendedor'); 
  END IF;
  
  -- Get product info for points
  SELECT * INTO v_product FROM products WHERE id = v_serial.product_id;
  v_points := COALESCE(v_product.points_value, 10);
  
  -- Create seller sale record
  INSERT INTO seller_sales (seller_id, serial_number, product_id, invoice_number, client_name, client_phone, sale_date, points_earned)
  VALUES (p_seller_id, UPPER(p_serial_number), v_serial.product_id, p_invoice_number, p_client_name, p_client_phone, p_sale_date, v_points)
  RETURNING id INTO v_sale_id;
  
  -- Update serial status
  UPDATE tv_serials 
  SET seller_status = 'REGISTERED', seller_sale_id = v_sale_id, updated_at = now() 
  WHERE id = v_serial.id;
  
  -- Update seller points and sales count
  UPDATE sellers 
  SET total_points = total_points + v_points, total_sales = total_sales + 1, updated_at = now() 
  WHERE id = p_seller_id;
  
  -- IMPORTANT: No coupons are created for sellers - they only get points
  -- Return success with points info only
  RETURN jsonb_build_object(
    'success', true, 
    'sale_id', v_sale_id, 
    'points', v_points,
    'message', 'Venta registrada. Puntos acumulados: ' || v_points
  );
END;
$function$;