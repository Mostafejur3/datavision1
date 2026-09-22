
-- Create invoices table for professional payment tracking
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL DEFAULT ('INV-' || upper(substr(md5(random()::text), 1, 8))),
  admin_id UUID NOT NULL,
  client_id UUID NOT NULL,
  service_title TEXT NOT NULL DEFAULT '',
  package_name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'paypal',
  payment_link TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT DEFAULT '',
  due_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Permissive policies
CREATE POLICY "Admin can do everything with invoices"
  ON public.invoices FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients can view own invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can update own invoice status"
  ON public.invoices FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
