-- A holding belongs to the account that signed up for it, which is what
-- scopes the dashboard.
--
-- Hand-written because `buddy generate:migrations` only diffs a model's
-- `attributes`: adding `belongsTo: ['User']` changes the schema (it adds the
-- foreign key) but produces no migration, so the column would never exist.
-- The demonstration farm keeps a null owner on purpose, which is what keeps
-- it off every farmer's dashboard.
ALTER TABLE "farms" ADD COLUMN "user_id" INTEGER;
CREATE INDEX IF NOT EXISTS "farms_user_id_index" ON "farms" ("user_id");
