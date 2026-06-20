/*
# Family Weekly Menu — Initial Schema

## Overview
Creates three tables for the family menu planner:
  - `menu_items`: Stores planned meals for each day/week/meal-type combination.
  - `favorites`: Stores meals the user has starred as favorites.
  - `meal_suggestions`: Pre-seeded meal library used for the suggestions search feature.

## Tables

### menu_items
| Column       | Type      | Notes                                      |
|-------------|-----------|---------------------------------------------|
| id           | uuid PK   | Auto-generated                              |
| week_start   | date      | Monday of the target week                   |
| day_of_week  | smallint  | 0=Mon … 6=Sun                               |
| meal_type    | text      | 'breakfast' | 'lunch' | 'dinner'           |
| name         | text      | Meal name (required)                        |
| description  | text      | Short description                           |
| ingredients  | text[]    | Array of ingredient strings                 |
| created_at   | timestamptz|                                            |
| updated_at   | timestamptz|                                            |
Unique constraint on (week_start, day_of_week, meal_type).

### favorites
| Column      | Type      | Notes                                       |
|------------|-----------|----------------------------------------------|
| id          | uuid PK   |                                              |
| name        | text      | Meal name                                    |
| meal_type   | text      | 'breakfast' | 'lunch' | 'dinner'            |
| description | text      |                                              |
| ingredients | text[]    |                                              |
| created_at  | timestamptz|                                             |

### meal_suggestions
| Column      | Type      | Notes                                       |
|------------|-----------|----------------------------------------------|
| id          | uuid PK   |                                              |
| name        | text      | Meal name                                    |
| meal_type   | text      | 'breakfast' | 'lunch' | 'dinner'            |
| description | text      |                                              |
| ingredients | text[]    |                                              |
| tags        | text[]    | Keyword tags for search                      |
| created_at  | timestamptz|                                             |

## Security
All tables use RLS with anon + authenticated policies (single-tenant, no auth).
*/

-- ─── menu_items ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start  date NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  meal_type   text NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner')),
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  ingredients text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  CONSTRAINT menu_items_unique_slot UNIQUE (week_start, day_of_week, meal_type)
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_menu_items" ON menu_items;
CREATE POLICY "anon_select_menu_items" ON menu_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_menu_items" ON menu_items;
CREATE POLICY "anon_insert_menu_items" ON menu_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_menu_items" ON menu_items;
CREATE POLICY "anon_update_menu_items" ON menu_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_menu_items" ON menu_items;
CREATE POLICY "anon_delete_menu_items" ON menu_items FOR DELETE
  TO anon, authenticated USING (true);

-- ─── favorites ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  meal_type   text NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner')),
  description text NOT NULL DEFAULT '',
  ingredients text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_favorites" ON favorites;
CREATE POLICY "anon_select_favorites" ON favorites FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_favorites" ON favorites;
CREATE POLICY "anon_insert_favorites" ON favorites FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_favorites" ON favorites;
CREATE POLICY "anon_update_favorites" ON favorites FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_favorites" ON favorites;
CREATE POLICY "anon_delete_favorites" ON favorites FOR DELETE
  TO anon, authenticated USING (true);

-- ─── meal_suggestions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_suggestions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  meal_type   text NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner')),
  description text NOT NULL DEFAULT '',
  ingredients text[] NOT NULL DEFAULT '{}',
  tags        text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE meal_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_meal_suggestions" ON meal_suggestions;
CREATE POLICY "anon_select_meal_suggestions" ON meal_suggestions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_meal_suggestions" ON meal_suggestions;
CREATE POLICY "anon_insert_meal_suggestions" ON meal_suggestions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_meal_suggestions" ON meal_suggestions;
CREATE POLICY "anon_update_meal_suggestions" ON meal_suggestions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_meal_suggestions" ON meal_suggestions;
CREATE POLICY "anon_delete_meal_suggestions" ON meal_suggestions FOR DELETE
  TO anon, authenticated USING (true);

-- ─── Seed meal_suggestions ────────────────────────────────────────────────────
INSERT INTO meal_suggestions (name, meal_type, description, ingredients, tags) VALUES
  -- Breakfast
  ('Classic Pancakes','breakfast','Fluffy golden pancakes with maple syrup',ARRAY['2 cups flour','2 eggs','1½ cups milk','2 tbsp butter','2 tsp baking powder','1 tsp vanilla','maple syrup'],ARRAY['quick','sweet','classic','kids']),
  ('Avocado Toast','breakfast','Creamy avocado on toasted sourdough with a poached egg',ARRAY['2 slices sourdough','1 ripe avocado','2 eggs','½ lemon, juiced','red pepper flakes','sea salt'],ARRAY['healthy','quick','trendy','vegetarian']),
  ('Greek Yogurt Parfait','breakfast','Layered yogurt with granola and fresh berries',ARRAY['1 cup Greek yogurt','½ cup granola','1 cup mixed berries','2 tbsp honey','½ tsp vanilla'],ARRAY['quick','healthy','no-cook','vegetarian','kids']),
  ('Scrambled Eggs & Toast','breakfast','Creamy soft scrambled eggs on buttered toast',ARRAY['4 eggs','2 tbsp butter','2 slices bread','salt','black pepper','chives'],ARRAY['quick','classic','kids','easy']),
  ('French Toast','breakfast','Golden custard-soaked bread with cinnamon sugar',ARRAY['4 thick slices brioche','3 eggs','½ cup milk','1 tsp cinnamon','1 tsp vanilla','2 tbsp butter','maple syrup','powdered sugar'],ARRAY['sweet','classic','weekend','kids']),
  ('Berry Smoothie Bowl','breakfast','Vibrant frozen berry blend topped with crunchy granola',ARRAY['1 cup frozen mixed berries','1 banana','½ cup almond milk','½ cup granola','2 tbsp chia seeds','sliced fresh fruit'],ARRAY['healthy','no-cook','vegan','quick','summer']),
  ('Overnight Oats','breakfast','Creamy oats soaked overnight with banana and honey',ARRAY['1 cup rolled oats','1 cup milk','1 banana','2 tbsp honey','1 tsp cinnamon','blueberries'],ARRAY['healthy','prep-ahead','easy','vegetarian']),
  ('Veggie Omelette','breakfast','Fluffy omelette filled with seasonal vegetables and cheese',ARRAY['3 eggs','¼ cup bell pepper','¼ cup mushrooms','¼ cup spinach','2 tbsp cheddar','1 tbsp butter','salt','pepper'],ARRAY['healthy','protein','vegetarian','quick']),
  -- Lunch
  ('Grilled Chicken Caesar Salad','lunch','Crisp romaine with grilled chicken and classic Caesar dressing',ARRAY['2 chicken breasts','1 romaine head','½ cup parmesan','1 cup croutons','3 tbsp Caesar dressing','lemon juice','black pepper'],ARRAY['healthy','protein','classic','salad']),
  ('Tomato Soup & Grilled Cheese','lunch','Creamy tomato bisque with golden gooey grilled cheese',ARRAY['4 large tomatoes','1 onion','2 garlic cloves','vegetable broth','4 slices bread','6 slices cheddar','butter','fresh basil'],ARRAY['classic','comfort','kids','vegetarian','soup']),
  ('Turkey BLT Wrap','lunch','Hearty turkey wrap with crispy bacon and fresh veggies',ARRAY['large flour tortilla','150g sliced turkey','3 strips bacon','lettuce','2 tomato slices','2 tbsp mayo','avocado'],ARRAY['quick','sandwich','protein']),
  ('Pasta Primavera','lunch','Light pasta tossed with seasonal vegetables and olive oil',ARRAY['300g penne','1 zucchini','1 bell pepper','1 cup cherry tomatoes','3 garlic cloves','4 tbsp olive oil','parmesan','fresh basil'],ARRAY['vegetarian','pasta','italian','quick']),
  ('Lentil Soup','lunch','Warming hearty lentil soup with cumin and lemon',ARRAY['2 cups red lentils','2 carrots','3 celery stalks','1 onion','4 garlic cloves','2 tsp cumin','1 lemon','vegetable broth','olive oil'],ARRAY['healthy','vegan','soup','comfort','meal-prep']),
  ('Caprese Sandwich','lunch','Fresh mozzarella, tomato and basil on ciabatta',ARRAY['ciabatta roll','125g fresh mozzarella','2 tomatoes','fresh basil leaves','3 tbsp pesto','2 tbsp balsamic glaze','olive oil'],ARRAY['vegetarian','italian','quick','no-cook']),
  ('Quinoa Buddha Bowl','lunch','Nourishing bowl with roasted vegetables and tahini dressing',ARRAY['1 cup quinoa','1 cup roasted chickpeas','1 sweet potato','1 cup kale','½ avocado','3 tbsp tahini','lemon juice','sesame seeds'],ARRAY['healthy','vegan','vegetarian','meal-prep','gluten-free']),
  ('Fish Tacos','lunch','Crispy battered fish in corn tortillas with slaw',ARRAY['400g white fish','8 corn tortillas','2 cups red cabbage slaw','2 limes','½ cup sour cream','jalapeño','cilantro','1 avocado'],ARRAY['fish','mexican','summer','quick']),
  -- Dinner
  ('Spaghetti Bolognese','dinner','Rich slow-cooked beef ragu over al dente spaghetti',ARRAY['400g spaghetti','500g ground beef','1 can crushed tomatoes','1 onion','3 garlic cloves','2 carrots','2 celery stalks','red wine','parmesan','fresh basil'],ARRAY['classic','italian','pasta','comfort','family']),
  ('Roast Chicken with Vegetables','dinner','Golden whole roast chicken with potatoes and root vegetables',ARRAY['whole chicken (1.8kg)','600g baby potatoes','3 carrots','1 head garlic','4 rosemary sprigs','2 lemons','4 tbsp olive oil','salt','pepper'],ARRAY['classic','sunday-roast','family','comfort']),
  ('Honey Garlic Salmon','dinner','Pan-seared salmon fillet with honey garlic glaze and asparagus',ARRAY['4 salmon fillets','500g asparagus','3 garlic cloves','3 tbsp honey','2 tbsp soy sauce','1 lemon','2 tbsp butter','fresh dill'],ARRAY['fish','healthy','quick','gluten-free']),
  ('Beef Tacos','dinner','Juicy seasoned ground beef in crispy shells with all the fixings',ARRAY['500g ground beef','8 taco shells','1 cup shredded cheddar','shredded lettuce','2 tomatoes','sour cream','guacamole','taco seasoning','salsa'],ARRAY['mexican','family','kids','quick']),
  ('Vegetable Stir Fry','dinner','Colorful wok-tossed vegetables with ginger soy sauce over rice',ARRAY['2 cups jasmine rice','2 cups broccoli','2 bell peppers','2 carrots','1 cup snap peas','4 tbsp soy sauce','2 tbsp sesame oil','fresh ginger','3 garlic cloves','sesame seeds'],ARRAY['vegan','vegetarian','asian','quick','healthy']),
  ('Mushroom Risotto','dinner','Creamy arborio rice with wild mushrooms and parmesan',ARRAY['1½ cups arborio rice','400g mixed mushrooms','1 onion','3 garlic cloves','½ cup white wine','1L warm vegetable broth','100g parmesan','3 tbsp butter','fresh thyme'],ARRAY['vegetarian','italian','comfort','weekend']),
  ('Chicken Tikka Masala','dinner','Tender chicken in a rich, fragrant tomato cream sauce',ARRAY['600g chicken thighs','1 can tomatoes','200ml cream','1 onion','4 garlic cloves','fresh ginger','2 tbsp garam masala','1 tsp cumin','1 tsp turmeric','cilantro','basmati rice'],ARRAY['indian','spicy','comfort','family']),
  ('Baked Ziti','dinner','Oven-baked pasta with ricotta, mozzarella and tomato sauce',ARRAY['400g ziti pasta','250g ricotta','200g mozzarella','500ml tomato sauce','100g parmesan','2 garlic cloves','fresh basil','1 tsp oregano'],ARRAY['italian','pasta','comfort','kids','family','baked']),
  ('Lamb Chops with Mint Sauce','dinner','Pan-seared lamb chops with fresh mint sauce and roasted potatoes',ARRAY['8 lamb chops','600g potatoes','fresh mint','2 garlic cloves','lemon','olive oil','rosemary','red wine jelly'],ARRAY['classic','weekend','special-occasion']),
  ('Shrimp Pasta','dinner','Garlic butter shrimp tossed with linguine and cherry tomatoes',ARRAY['400g linguine','500g shrimp','1 cup cherry tomatoes','4 garlic cloves','½ cup white wine','4 tbsp butter','parsley','red pepper flakes','lemon'],ARRAY['seafood','italian','pasta','quick','date-night'])
ON CONFLICT DO NOTHING;
