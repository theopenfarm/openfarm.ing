CREATE TABLE IF NOT EXISTS "farms" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" TEXT not null,
  "slug" TEXT not null,
  "region" TEXT,
  "segment" TEXT,
  "hectares" INTEGER,
  "created_at" TEXT not null default CURRENT_TIMESTAMP,
  "updated_at" TEXT,
  "deleted_at" TEXT,
  "uuid" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "farms_farms_slug_unique" ON "farms" ("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "farms_farms_uuid_unique" ON "farms" ("uuid");
