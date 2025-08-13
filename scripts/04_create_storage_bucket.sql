-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);

-- Set up RLS policies for the documents bucket
CREATE POLICY "Anyone can upload documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anyone can view documents" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Anyone can delete documents" ON storage.objects
FOR DELETE USING (bucket_id = 'documents');
