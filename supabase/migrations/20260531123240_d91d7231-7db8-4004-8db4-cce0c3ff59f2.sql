
-- Profiles: restrict to owner or admin (hide phone PII from public/other users)
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view own profile or admins all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- user_roles: revoke any direct write grants and add explicit admin-only write policies
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- dog_reports: restrict to authenticated users (protect GPS coords)
DROP POLICY IF EXISTS "Anyone can view reports" ON public.dog_reports;
CREATE POLICY "Authenticated users can view reports"
  ON public.dog_reports FOR SELECT
  TO authenticated
  USING (true);

-- Storage: make treatment-photos private, fix volunteer-only upload, add owner-scoped delete/update
UPDATE storage.buckets SET public = false WHERE id = 'treatment-photos';

DROP POLICY IF EXISTS "Treatment photos are public" ON storage.objects;
CREATE POLICY "Volunteers and admins can view treatment photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'treatment-photos'
    AND (public.has_role(auth.uid(), 'volunteer') OR public.has_role(auth.uid(), 'admin'))
  );

DROP POLICY IF EXISTS "Volunteers can upload treatment photos" ON storage.objects;
CREATE POLICY "Volunteers can upload treatment photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'treatment-photos'
    AND (public.has_role(auth.uid(), 'volunteer') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Volunteers can update own treatment photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'treatment-photos'
    AND owner = auth.uid()
    AND (public.has_role(auth.uid(), 'volunteer') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Volunteers can delete own treatment photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'treatment-photos'
    AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  );

-- dog-photos: add owner-scoped update + delete
CREATE POLICY "Users can update own dog photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'dog-photos' AND owner = auth.uid());

CREATE POLICY "Users can delete own dog photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'dog-photos'
    AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  );

-- avatars: add owner-scoped delete
CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND ((auth.uid())::text = (storage.foldername(name))[1])
  );
