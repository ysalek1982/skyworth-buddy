-- Create a secure RPC function for seller registration
-- This function runs with SECURITY DEFINER to bypass RLS and assign the seller role
CREATE OR REPLACE FUNCTION public.rpc_register_seller(
  p_user_id uuid,
  p_store_name text,
  p_store_city text,
  p_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_seller_id UUID;
BEGIN
  -- Verify the user exists in auth
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuario no encontrado');
  END IF;
  
  -- Check if user is already a seller
  IF EXISTS (SELECT 1 FROM sellers WHERE user_id = p_user_id) THEN
    -- User already has seller record, just ensure role exists
    INSERT INTO user_roles (user_id, role)
    VALUES (p_user_id, 'seller')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    SELECT id INTO v_seller_id FROM sellers WHERE user_id = p_user_id;
    
    RETURN jsonb_build_object(
      'success', true, 
      'seller_id', v_seller_id,
      'message', 'Vendedor ya registrado'
    );
  END IF;
  
  -- Create seller record
  INSERT INTO sellers (user_id, store_name, store_city, phone, is_active, total_points, total_sales)
  VALUES (p_user_id, p_store_name, p_store_city, p_phone, true, 0, 0)
  RETURNING id INTO v_seller_id;
  
  -- Assign seller role (bypasses RLS with SECURITY DEFINER)
  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, 'seller')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN jsonb_build_object(
    'success', true, 
    'seller_id', v_seller_id,
    'message', '¡Registro de vendedor exitoso!'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', 'Error interno: ' || SQLERRM);
END;
$function$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.rpc_register_seller TO authenticated;