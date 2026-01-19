-- Add missing columns for seller sales documentation
ALTER TABLE public.seller_sales
ADD COLUMN IF NOT EXISTS warranty_tag_url TEXT,
ADD COLUMN IF NOT EXISTS warranty_policy_url TEXT,
ADD COLUMN IF NOT EXISTS invoice_photo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.seller_sales.warranty_tag_url IS 'Foto del TAG de póliza de garantía';
COMMENT ON COLUMN public.seller_sales.warranty_policy_url IS 'Foto de la Póliza de Garantía';
COMMENT ON COLUMN public.seller_sales.invoice_photo_url IS 'Foto de la nota de venta o factura';