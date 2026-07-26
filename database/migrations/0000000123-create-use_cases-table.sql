CREATE TABLE IF NOT EXISTS "use_cases" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "slug" TEXT not null,
  "name" TEXT not null,
  "segment" TEXT CHECK ("segment" IN ('arable', 'permanent', 'protected', 'livestock', 'operator')) not null,
  "tagline" TEXT not null,
  "summary" TEXT not null,
  "challenge" TEXT not null,
  "approach" TEXT not null,
  "season" TEXT,
  "feature_slugs" TEXT,
  "outcomes" TEXT,
  "scale" TEXT,
  "sort_order" INTEGER default 0,
  "created_at" TEXT not null default CURRENT_TIMESTAMP,
  "updated_at" TEXT,
  "uuid" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "use_cases_use_cases_slug_unique" ON "use_cases" ("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "use_cases_use_cases_uuid_unique" ON "use_cases" ("uuid");
