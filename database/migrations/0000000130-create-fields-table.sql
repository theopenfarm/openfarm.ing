CREATE TABLE IF NOT EXISTS "fields" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" TEXT not null,
  "slug" TEXT not null,
  "crop" TEXT not null,
  "hectares" INTEGER not null,
  "status" TEXT CHECK ("status" IN ('active', 'fallow', 'archived')) default 'active',
  "latitude" INTEGER,
  "longitude" INTEGER,
  "boundary" TEXT,
  "farm_id" INTEGER REFERENCES "farms"("id"),
  "created_at" TEXT not null default CURRENT_TIMESTAMP,
  "updated_at" TEXT,
  "deleted_at" TEXT,
  "uuid" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "fields_fields_slug_unique" ON "fields" ("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "fields_fields_uuid_unique" ON "fields" ("uuid");
