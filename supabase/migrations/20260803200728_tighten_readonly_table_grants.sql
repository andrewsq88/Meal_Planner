-- Revoke unintended write privileges on read-only / system-managed tables.
-- RLS still denies by default, but these grants should not exist in the first place.

-- meal_suggestions: read-only library content for all users
REVOKE INSERT, UPDATE, DELETE ON public.meal_suggestions FROM anon, authenticated;

-- rss_cache: only the fetch-rss-recipes edge function (service role) writes
REVOKE INSERT, UPDATE, DELETE ON public.rss_cache FROM anon, authenticated;

-- scraped_recipes: only server-side scraping writes
REVOKE INSERT, UPDATE, DELETE ON public.scraped_recipes FROM anon, authenticated;

-- recipe_packs: catalog content, read-only to clients
REVOKE INSERT, UPDATE, DELETE ON public.recipe_packs FROM anon, authenticated;

-- recipe_pack_meals: catalog content, read-only to clients
REVOKE INSERT, UPDATE, DELETE ON public.recipe_pack_meals FROM anon, authenticated;

-- sponsored_recipes: catalog content, read-only to clients
REVOKE INSERT, UPDATE, DELETE ON public.sponsored_recipes FROM anon, authenticated;

-- user_purchases: purchases must be created only by a verified payment flow,
-- not directly by clients. Revoke client write access for now; when Stripe
-- webhooks are wired up, the service role will insert purchase rows.
REVOKE INSERT, UPDATE, DELETE ON public.user_purchases FROM anon, authenticated;
