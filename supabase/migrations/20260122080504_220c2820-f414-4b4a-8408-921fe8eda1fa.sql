-- Secure RPCs to attach document URLs after registration (bypasses RLS but enforces ownership checks)

CREATE OR REPLACE FUNCTION public.rpc_attach_buyer_documents(
  p_purchase_id uuid,
  p_invoice_url text,
  p_id_front_url text,
  p_id_back_url text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  UPDATE public.client_purchases cp
  SET
    invoice_url = p_invoice_url,
    id_front_url = p_id_front_url,
    id_back_url = p_id_back_url,
    updated_at = now()
  WHERE cp.id = p_purchase_id
    AND cp.user_id = v_uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_allowed_or_not_found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_attach_buyer_documents(uuid, text, text, text) TO authenticated;


CREATE OR REPLACE FUNCTION public.rpc_attach_seller_documents(
  p_sale_id uuid,
  p_warranty_tag_url text,
  p_warranty_policy_url text,
  p_invoice_photo_url text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  UPDATE public.seller_sales ss
  SET
    warranty_tag_url = p_warranty_tag_url,
    warranty_policy_url = p_warranty_policy_url,
    invoice_photo_url = p_invoice_photo_url
  WHERE ss.id = p_sale_id
    AND EXISTS (
      SELECT 1
      FROM public.sellers s
      WHERE s.id = ss.seller_id
        AND s.user_id = v_uid
    );

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_allowed_or_not_found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_attach_seller_documents(uuid, text, text, text) TO authenticated;
