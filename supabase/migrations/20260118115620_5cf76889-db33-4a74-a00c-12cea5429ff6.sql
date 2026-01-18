-- Drop the restrictive authenticated-only policy
DROP POLICY IF EXISTS "Authenticated can read serials" ON public.tv_serials;

-- Create a new policy that allows anyone to read serials for validation
-- This is needed because the registration form is public and needs to validate serials
CREATE POLICY "Anyone can read serials for validation"
ON public.tv_serials
FOR SELECT
USING (true);