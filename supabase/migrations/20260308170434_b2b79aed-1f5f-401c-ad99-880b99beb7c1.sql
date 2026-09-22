
-- Create site_config table to persist site configuration
CREATE TABLE public.site_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE DEFAULT 'main',
  config_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read site config (needed for public pages)
CREATE POLICY "Anyone can read site config"
  ON public.site_config FOR SELECT
  TO authenticated
  USING (true);

-- Allow anonymous read too for public pages
CREATE POLICY "Anon can read site config"
  ON public.site_config FOR SELECT
  TO anon
  USING (true);

-- Only admins can modify
CREATE POLICY "Admin can insert site config"
  ON public.site_config FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update site config"
  ON public.site_config FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete site config"
  ON public.site_config FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
