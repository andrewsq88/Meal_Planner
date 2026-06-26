/*
# Create scraped_recipes cache table

## Overview
Caches structured recipe data scraped from external URLs so the same page
is never fetched twice within the TTL window (24 hours). Both the Python
recipe-scrapers microservice and the npm recipe-data-scraper fallback write
into this table; the edge function checks it before making any outbound call.

## New Tables

### scraped_recipes
| Column       | Type         | Notes                                      |
|-------------|--------------|---------------------------------------------|
| id           | uuid PK      | Auto-generated                              |
| url          | text UNIQUE  | The canonical recipe page URL (cache key)   |
| title        | text         | Recipe title extracted by the scraper       |
| description  | text         | Short description / intro text              |
| ingredients  | text[]       | Full ingredient list as scraped             |
| image_url    | text         | Hero image URL                              |
| total_time   | integer      | Total cook + prep time in minutes (0 = unknown) |
| servings     | text         | Yield / servings string                     |
| scraped_at   | timestamptz  | When the row was last scraped               |

## Security
- RLS enabled; anon + authenticated can read and write (single-tenant app, no auth).
*/

CREATE TABLE IF NOT EXISTS scraped_recipes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url         text NOT NULL UNIQUE,
  title       text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  ingredients text[] NOT NULL DEFAULT '{}',
  image_url   text NOT NULL DEFAULT '',
  total_time  integer NOT NULL DEFAULT 0,
  servings    text NOT NULL DEFAULT '',
  scraped_at  timestamptz DEFAULT now()
);

ALTER TABLE scraped_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_scraped_recipes" ON scraped_recipes;
CREATE POLICY "anon_select_scraped_recipes" ON scraped_recipes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_scraped_recipes" ON scraped_recipes;
CREATE POLICY "anon_insert_scraped_recipes" ON scraped_recipes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_scraped_recipes" ON scraped_recipes;
CREATE POLICY "anon_update_scraped_recipes" ON scraped_recipes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_scraped_recipes" ON scraped_recipes;
CREATE POLICY "anon_delete_scraped_recipes" ON scraped_recipes FOR DELETE
  TO anon, authenticated USING (true);
