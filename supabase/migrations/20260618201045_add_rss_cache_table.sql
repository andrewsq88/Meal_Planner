/*
# Add RSS Cache Table

## Overview
Adds a `rss_cache` table used by the `fetch-rss-recipes` edge function to store
parsed RSS feed results server-side. Because edge functions are stateless, any data
that must survive across invocations must live in the database. This table acts as a
30-minute cache to prevent hammering external RSS feeds on every user keystroke.

## New Tables

### rss_cache
| Column      | Type        | Notes                                              |
|-------------|-------------|-----------------------------------------------------|
| id          | uuid PK     | Auto-generated                                      |
| feed_url    | text UNIQUE | The source RSS feed URL — one row per feed          |
| items       | jsonb       | Parsed feed items as a JSON array                   |
| fetched_at  | timestamptz | When the feed was last fetched — used for TTL check |

## Security
Single-tenant app (no auth). RLS enabled with anon + authenticated CRUD policies
so the edge function (running with the service-role key) and the anon-key client
can both read/write the cache.
*/

CREATE TABLE IF NOT EXISTS rss_cache (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_url   text UNIQUE NOT NULL,
  items      jsonb NOT NULL DEFAULT '[]',
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rss_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_rss_cache" ON rss_cache;
CREATE POLICY "anon_select_rss_cache" ON rss_cache FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_rss_cache" ON rss_cache;
CREATE POLICY "anon_insert_rss_cache" ON rss_cache FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_rss_cache" ON rss_cache;
CREATE POLICY "anon_update_rss_cache" ON rss_cache FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_rss_cache" ON rss_cache;
CREATE POLICY "anon_delete_rss_cache" ON rss_cache FOR DELETE
  TO anon, authenticated USING (true);
