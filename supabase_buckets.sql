-- Create storage buckets for uploads
-- Run this in Supabase SQL editor

-- Create profile-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create project-thumbnails bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-thumbnails', 'project-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Set bucket policies for profile-images
CREATE POLICY "Public profile images are viewable by everyone." ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload profile images." ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-images');

-- Set bucket policies for project-thumbnails
CREATE POLICY "Public thumbnails are viewable by everyone." ON storage.objects
  FOR SELECT
  USING (bucket_id = 'project-thumbnails');

CREATE POLICY "Users can upload thumbnails." ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-thumbnails');
