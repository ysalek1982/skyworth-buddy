-- Create storage bucket for seller documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('seller-documents', 'seller-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own seller documents
CREATE POLICY "Sellers can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'seller-documents' 
  AND auth.uid() IS NOT NULL
);

-- Allow public read access
CREATE POLICY "Public can view seller documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'seller-documents');

-- Allow sellers to update their own documents
CREATE POLICY "Sellers can update their documents"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'seller-documents' AND auth.uid() IS NOT NULL);

-- Allow sellers to delete their own documents
CREATE POLICY "Sellers can delete their documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'seller-documents' AND auth.uid() IS NOT NULL);