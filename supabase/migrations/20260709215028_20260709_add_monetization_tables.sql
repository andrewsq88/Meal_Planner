/*
# Add Monetization Tables

Adds four tables to support the app's monetization features.

## New Tables

### sponsored_recipes
Stores featured/sponsored recipe cards shown in the Meal Suggestions panel.
Managed by the app owner (inserted via admin/seed). Frontend only reads active rows.
- id: uuid primary key
- name: display name of the sponsored recipe
- description: short description
- meal_type: breakfast | lunch | dinner
- sponsor_name: advertiser display name (e.g. "HelloFresh")
- sponsor_url: outbound click-through URL for the sponsor
- image_url: optional thumbnail
- display_order: integer for controlling card injection order
- is_active: soft-delete / publish toggle

### recipe_packs
Stores purchasable recipe collection packs shown in the new "Packs" tab.
- id: uuid primary key
- name: pack display name (e.g. "30 Quick Weeknight Dinners")
- description: short marketing copy
- price_cents: price in cents (e.g. 499 = $4.99)
- meal_count: displayed count (auto-maintained or manually set)
- thumbnail_url: optional cover image
- tag_color: accent color key (amber | green | blue | rose)
- is_active: publish toggle

### recipe_pack_meals
Individual meals belonging to a recipe pack. Public read.
- id: uuid primary key
- pack_id: foreign key → recipe_packs
- name, meal_type, description, ingredients[], tags[]

### user_purchases
Records which authenticated users have unlocked which packs.
- id: uuid primary key
- user_id: foreign key → auth.users, defaults to auth.uid()
- pack_id: foreign key → recipe_packs
- purchased_at: timestamp
- UNIQUE(user_id, pack_id) prevents double purchases

## Security

- sponsored_recipes: SELECT only for anon + authenticated (public read, no user writes)
- recipe_packs: SELECT only for anon + authenticated
- recipe_pack_meals: SELECT only for anon + authenticated (scoped through active pack)
- user_purchases: SELECT + INSERT for authenticated users scoped to their own rows

## Notes
1. No INSERT/UPDATE/DELETE policies are added to sponsored_recipes, recipe_packs, or
   recipe_pack_meals — these are managed by the app owner via the Supabase dashboard.
2. user_purchases.user_id defaults to auth.uid() so frontend inserts can omit it.
3. All migrations are idempotent (IF NOT EXISTS + DROP POLICY IF EXISTS).
*/

-- ─── sponsored_recipes ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sponsored_recipes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  description  text        NOT NULL DEFAULT '',
  meal_type    text        NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  sponsor_name text        NOT NULL,
  sponsor_url  text        NOT NULL,
  image_url    text,
  display_order int        NOT NULL DEFAULT 0,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE sponsored_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_sponsored_recipes" ON sponsored_recipes;
CREATE POLICY "public_select_sponsored_recipes" ON sponsored_recipes
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- ─── recipe_packs ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipe_packs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  description   text        NOT NULL DEFAULT '',
  price_cents   int         NOT NULL DEFAULT 0,
  meal_count    int         NOT NULL DEFAULT 0,
  thumbnail_url text,
  tag_color     text        NOT NULL DEFAULT 'amber',
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE recipe_packs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_recipe_packs" ON recipe_packs;
CREATE POLICY "public_select_recipe_packs" ON recipe_packs
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- ─── recipe_pack_meals ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipe_pack_meals (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id     uuid        NOT NULL REFERENCES recipe_packs(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  meal_type   text        NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  description text        NOT NULL DEFAULT '',
  ingredients text[]      NOT NULL DEFAULT '{}',
  tags        text[]      NOT NULL DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE recipe_pack_meals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_recipe_pack_meals" ON recipe_pack_meals;
CREATE POLICY "public_select_recipe_pack_meals" ON recipe_pack_meals
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipe_packs
      WHERE recipe_packs.id = recipe_pack_meals.pack_id
        AND recipe_packs.is_active = true
    )
  );

-- ─── user_purchases ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_purchases (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id      uuid        NOT NULL REFERENCES recipe_packs(id) ON DELETE CASCADE,
  purchased_at timestamptz DEFAULT now(),
  UNIQUE (user_id, pack_id)
);

ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_purchases" ON user_purchases;
CREATE POLICY "select_own_purchases" ON user_purchases
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_purchases" ON user_purchases;
CREATE POLICY "insert_own_purchases" ON user_purchases
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
