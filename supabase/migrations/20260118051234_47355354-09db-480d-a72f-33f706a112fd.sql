-- Drop the old version of the function (8 parameters without p_existing_purchase_id)
DROP FUNCTION IF EXISTS public.rpc_register_buyer_serial(text, text, text, text, text, text, date, uuid);

-- Keep only the new version with 9 parameters (includes p_existing_purchase_id)