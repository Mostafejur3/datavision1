
-- Drop all existing restrictive SELECT policies on reviews
DROP POLICY IF EXISTS "Users can view own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admin can view all reviews" ON public.reviews;

-- Recreate them as PERMISSIVE (default) so they use OR logic
CREATE POLICY "Users can view own reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view approved reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (status = 'approved');

CREATE POLICY "Admin can view all reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
