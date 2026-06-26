/*
# Add per-user ownership to menu_items and favorites

## Summary
Migrates the app from single-tenant (shared data) to multi-tenant (each user
owns their own rows). Every menu_item and favorite is now tied to the
auth.users row that created it.

## Changes

### menu_items table
- New column: `user_id uuid NOT NULL DEFAULT auth.uid()` — filled automatically
  from the authenticated session on insert, so existing insert calls that omit
  user_id continue to work without modification.
- All previous open (USING true) policies are replaced with owner-scoped ones.

### favorites table
- Same user_id column and owner-scoped policy treatment as menu_items.

## Security
- RLS stays enabled on both tables.
- All four CRUD policies scoped TO authenticated using auth.uid() = user_id.
- Anon users can no longer read, write, or delete any rows.
- Users can only access their own rows.

## Notes
1. Existing rows (if any) will have user_id = NULL after the ALTER because
   DEFAULT only applies to new inserts. Those orphaned rows will be invisible
   to all users (RLS predicate fails on NULL). This is acceptable; the app was
   single-tenant before so there is no real per-user data to preserve.
2. The DEFAULT auth.uid() means the frontend can continue to call
   .insert({ week_start, day_of_week, ... }) without passing user_id.
*/

-- ───────────────────────────────────────────────────────────────
-- menu_items
-- ───────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'menu_items'
      AND column_name  = 'user_id'
  ) THEN
    ALTER TABLE menu_items
      ADD COLUMN user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop every existing policy on menu_items so we start clean
DROP POLICY IF EXISTS "anon_select_menu_items"  ON menu_items;
DROP POLICY IF EXISTS "anon_insert_menu_items"  ON menu_items;
DROP POLICY IF EXISTS "anon_update_menu_items"  ON menu_items;
DROP POLICY IF EXISTS "anon_delete_menu_items"  ON menu_items;
DROP POLICY IF EXISTS "insert_menu_items"       ON menu_items;
DROP POLICY IF EXISTS "update_menu_items"       ON menu_items;
DROP POLICY IF EXISTS "delete_menu_items"       ON menu_items;
DROP POLICY IF EXISTS "select_own_menu_items"   ON menu_items;
DROP POLICY IF EXISTS "insert_own_menu_items"   ON menu_items;
DROP POLICY IF EXISTS "update_own_menu_items"   ON menu_items;
DROP POLICY IF EXISTS "delete_own_menu_items"   ON menu_items;

CREATE POLICY "select_own_menu_items" ON menu_items FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_menu_items" ON menu_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_menu_items" ON menu_items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_menu_items" ON menu_items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────
-- favorites
-- ───────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'favorites'
      AND column_name  = 'user_id'
  ) THEN
    ALTER TABLE favorites
      ADD COLUMN user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DROP POLICY IF EXISTS "anon_select_favorites"  ON favorites;
DROP POLICY IF EXISTS "anon_insert_favorites"  ON favorites;
DROP POLICY IF EXISTS "anon_update_favorites"  ON favorites;
DROP POLICY IF EXISTS "anon_delete_favorites"  ON favorites;
DROP POLICY IF EXISTS "insert_favorites"       ON favorites;
DROP POLICY IF EXISTS "update_favorites"       ON favorites;
DROP POLICY IF EXISTS "delete_favorites"       ON favorites;
DROP POLICY IF EXISTS "select_own_favorites"   ON favorites;
DROP POLICY IF EXISTS "insert_own_favorites"   ON favorites;
DROP POLICY IF EXISTS "update_own_favorites"   ON favorites;
DROP POLICY IF EXISTS "delete_own_favorites"   ON favorites;

CREATE POLICY "select_own_favorites" ON favorites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_favorites" ON favorites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_favorites" ON favorites FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_favorites" ON favorites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
