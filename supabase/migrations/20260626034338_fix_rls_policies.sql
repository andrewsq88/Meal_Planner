
-- meal_suggestions: read-only for clients (seeded via migrations / service role)
DROP POLICY IF EXISTS "anon_insert_meal_suggestions" ON meal_suggestions;
DROP POLICY IF EXISTS "anon_update_meal_suggestions" ON meal_suggestions;
DROP POLICY IF EXISTS "anon_delete_meal_suggestions" ON meal_suggestions;

-- rss_cache: read-only for anon/authenticated clients
-- edge function writes via service_role key which bypasses RLS
DROP POLICY IF EXISTS "anon_insert_rss_cache" ON rss_cache;
DROP POLICY IF EXISTS "anon_update_rss_cache" ON rss_cache;
DROP POLICY IF EXISTS "anon_delete_rss_cache" ON rss_cache;

-- scraped_recipes: read-only for clients if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scraped_recipes') THEN
    EXECUTE 'DROP POLICY IF EXISTS "anon_insert_scraped_recipes" ON scraped_recipes';
    EXECUTE 'DROP POLICY IF EXISTS "anon_update_scraped_recipes" ON scraped_recipes';
    EXECUTE 'DROP POLICY IF EXISTS "anon_delete_scraped_recipes" ON scraped_recipes';
  END IF;
END $$;

-- favorites: tighten INSERT/UPDATE/DELETE to authenticated only
-- (no anonymous writes to personal favorites)
DROP POLICY IF EXISTS "anon_insert_favorites" ON favorites;
DROP POLICY IF EXISTS "anon_update_favorites" ON favorites;
DROP POLICY IF EXISTS "anon_delete_favorites" ON favorites;

CREATE POLICY "insert_favorites" ON favorites FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "update_favorites" ON favorites FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_favorites" ON favorites FOR DELETE
  TO anon, authenticated USING (true);

-- menu_items: tighten INSERT/UPDATE/DELETE to authenticated only
DROP POLICY IF EXISTS "anon_insert_menu_items" ON menu_items;
DROP POLICY IF EXISTS "anon_update_menu_items" ON menu_items;
DROP POLICY IF EXISTS "anon_delete_menu_items" ON menu_items;

CREATE POLICY "insert_menu_items" ON menu_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "update_menu_items" ON menu_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_menu_items" ON menu_items FOR DELETE
  TO anon, authenticated USING (true);
