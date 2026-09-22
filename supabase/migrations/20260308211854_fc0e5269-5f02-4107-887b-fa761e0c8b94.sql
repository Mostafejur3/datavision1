
-- Allow moderators to view all orders
CREATE POLICY "Moderator can view all orders" ON public.orders FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to view all messages
CREATE POLICY "Moderator can view all messages" ON public.messages FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to view all profiles
CREATE POLICY "Moderator can view all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to view all reviews
CREATE POLICY "Moderator can view all reviews" ON public.reviews FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to view all invoices
CREATE POLICY "Moderator can view all invoices" ON public.invoices FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to send messages
CREATE POLICY "Moderator can send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to update messages (mark read)
CREATE POLICY "Moderator can update messages" ON public.messages FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to update orders
CREATE POLICY "Moderator can update orders" ON public.orders FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to update reviews
CREATE POLICY "Moderator can update reviews" ON public.reviews FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'moderator'::app_role));
