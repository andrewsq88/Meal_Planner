-- Client roles must not read or write the RSS cache. The fetch-rss-recipes
-- edge function uses the service role, which bypasses these grants.
DROP POLICY IF EXISTS "anon_select_rss_cache" ON rss_cache;
DROP POLICY IF EXISTS "anon_insert_rss_cache" ON rss_cache;
DROP POLICY IF EXISTS "anon_update_rss_cache" ON rss_cache;
DROP POLICY IF EXISTS "anon_delete_rss_cache" ON rss_cache;
REVOKE ALL ON public.rss_cache FROM anon, authenticated;

-- Purchases cannot be created from the browser.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'user_purchases'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "insert_own_purchases" ON public.user_purchases';
    EXECUTE 'REVOKE INSERT, UPDATE, DELETE ON public.user_purchases FROM anon, authenticated';
  END IF;
END $$;

-- Owner policies compare auth.uid() to user_id. Rows with a null owner are
-- invisible and cannot be claimed by a later session.
DELETE FROM public.menu_items WHERE user_id IS NULL;
DELETE FROM public.favorites WHERE user_id IS NULL;

ALTER TABLE public.menu_items ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.favorites ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.menu_items DROP CONSTRAINT IF EXISTS menu_items_unique_slot;
ALTER TABLE public.menu_items
  ADD CONSTRAINT menu_items_unique_slot
  UNIQUE (user_id, week_start, day_of_week, meal_type);
