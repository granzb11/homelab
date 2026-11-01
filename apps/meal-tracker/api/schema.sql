-- Applied manually to the local dev database for now (psql meal_tracker_dev < schema.sql).
-- Goose migrations replace this once we reach that milestone.

CREATE TABLE IF NOT EXISTS recipes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  cuisine     text NOT NULL DEFAULT 'other',
  servings    int  NOT NULL DEFAULT 2 CHECK (servings > 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id  uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position   int  NOT NULL,
  qty        numeric(10,3),
  unit       text NOT NULL DEFAULT '',
  name       text NOT NULL
);
