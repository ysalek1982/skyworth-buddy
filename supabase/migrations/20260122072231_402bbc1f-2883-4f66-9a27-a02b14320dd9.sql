-- Create storage bucket for client purchase documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('purchase-documents', 'purchase-documents', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for purchase-documents bucket
-- Allow anyone to upload files (authenticated or not - form submission)
CREATE POLICY "Anyone can upload purchase docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'purchase-documents');

-- Allow anyone to view purchase docs (for admin review)
CREATE POLICY "Anyone can view purchase docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'purchase-documents');

-- Allow admins to delete purchase docs
CREATE POLICY "Admins can delete purchase docs"
ON storage.objects FOR DELETE
USING (bucket_id = 'purchase-documents' AND public.has_role(auth.uid(), 'admin'));

-- RLS policies for seller-documents bucket (already exists, just add missing policies)
-- Allow authenticated sellers to upload to their folder
CREATE POLICY "Sellers can upload their docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'seller-documents' 
  AND auth.uid() IS NOT NULL
);

-- Allow anyone to view seller docs (for admin review)
CREATE POLICY "Anyone can view seller docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'seller-documents');

-- Allow admins to delete seller docs
CREATE POLICY "Admins can delete seller docs"
ON storage.objects FOR DELETE
USING (bucket_id = 'seller-documents' AND public.has_role(auth.uid(), 'admin'));