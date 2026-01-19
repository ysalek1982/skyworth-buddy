-- Create a security definer function to get public campaign stats
-- This bypasses RLS but only returns aggregate counts, not sensitive data
CREATE OR REPLACE FUNCTION public.get_campaign_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participants INTEGER;
  v_coupons INTEGER;
  v_sales INTEGER;
BEGIN
  -- Count total client purchases (participants)
  SELECT COUNT(*) INTO v_participants FROM client_purchases;
  
  -- Count total coupons
  SELECT COUNT(*) INTO v_coupons FROM coupons;
  
  -- Count total seller sales
  SELECT COUNT(*) INTO v_sales FROM seller_sales;
  
  RETURN jsonb_build_object(
    'totalParticipants', v_participants,
    'totalCoupons', v_coupons,
    'totalSales', v_sales
  );
END;
$$;