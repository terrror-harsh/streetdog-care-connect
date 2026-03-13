-- Create roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'volunteer', 'user');

-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_roles table FIRST (before has_role function)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks (after table exists)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Auto-create profile and assign default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create dog_reports table
CREATE TABLE public.dog_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('injury', 'disease', 'hunger', 'emergency')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'under_treatment', 'rescued', 'completed')),
  assigned_volunteer_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dog_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reports" ON public.dog_reports FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reports" ON public.dog_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Reporter or volunteer can update" ON public.dog_reports FOR UPDATE USING (
  auth.uid() = reporter_id OR auth.uid() = assigned_volunteer_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'volunteer')
);
CREATE POLICY "Admins can delete reports" ON public.dog_reports FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_dog_reports_updated_at BEFORE UPDATE ON public.dog_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create rescue_cases table
CREATE TABLE public.rescue_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.dog_reports(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'accepted' CHECK (status IN ('accepted', 'in_progress', 'under_treatment', 'completed')),
  notes TEXT,
  treatment_photos TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rescue_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view rescue cases" ON public.rescue_cases FOR SELECT USING (true);
CREATE POLICY "Volunteers can create rescue cases" ON public.rescue_cases FOR INSERT WITH CHECK (auth.uid() = volunteer_id);
CREATE POLICY "Volunteer or admin can update" ON public.rescue_cases FOR UPDATE USING (
  auth.uid() = volunteer_id OR public.has_role(auth.uid(), 'admin')
);
CREATE TRIGGER update_rescue_cases_updated_at BEFORE UPDATE ON public.rescue_cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('dog-photos', 'dog-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('treatment-photos', 'treatment-photos', true);

-- Storage policies
CREATE POLICY "Dog photos are public" ON storage.objects FOR SELECT USING (bucket_id = 'dog-photos');
CREATE POLICY "Auth users can upload dog photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'dog-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Avatars are public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Treatment photos are public" ON storage.objects FOR SELECT USING (bucket_id = 'treatment-photos');
CREATE POLICY "Volunteers can upload treatment photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'treatment-photos' AND auth.role() = 'authenticated');