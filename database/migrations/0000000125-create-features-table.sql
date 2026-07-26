CREATE TABLE IF NOT EXISTS "features" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "slug" TEXT not null,
  "name" TEXT not null,
  "category" TEXT CHECK ("category" IN ('detect', 'act', 'operate')) not null,
  "tagline" TEXT not null,
  "summary" TEXT not null,
  "problem" TEXT not null,
  "steps" TEXT,
  "sensors" TEXT,
  "outputs" TEXT,
  "readings" TEXT,
  "cadence" TEXT,
  "use_case_slugs" TEXT,
  "sort_order" INTEGER default 0,
  "created_at" TEXT not null default CURRENT_TIMESTAMP,
  "updated_at" TEXT,
  "uuid" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "features_features_slug_unique" ON "features" ("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "features_features_uuid_unique" ON "features" ("uuid");
