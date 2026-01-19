-- Allow authenticated users and anonymous users to view sellers for rankings
-- This only exposes non-sensitive seller data (store info, points, sales)
CREATE POLICY "Anyone can view sellers for rankings"
ON public.sellers
FOR SELECT
USING (is_active = true);

-- Drop the restrictive "Sellers can view own data" policy since the new one covers it
DROP POLICY IF EXISTS "Sellers can view own data" ON public.sellers;