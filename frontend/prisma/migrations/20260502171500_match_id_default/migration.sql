-- Ensure UUID generation is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add a DB-level default for Match.id so inserts can omit id safely
ALTER TABLE "Match"
ALTER COLUMN "id" SET DEFAULT lower(replace(gen_random_uuid()::text, '-'::text, ''::text));
