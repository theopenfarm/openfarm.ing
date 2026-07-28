CREATE TABLE IF NOT EXISTS "farm_capabilities" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "feature_slug" TEXT not null,
  "status" TEXT CHECK ("status" IN ('active', 'paused', 'requested')) not null default 'active',
  "cadence_days" INTEGER default 14,
  "notes" TEXT,
  "last_scheduled_at" TEXT,
  "farm_id" INTEGER REFERENCES "farms"("id"),
  "field_id" INTEGER REFERENCES "fields"("id"),
  "created_at" TEXT not null default CURRENT_TIMESTAMP,
  "updated_at" TEXT,
  "uuid" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "farm_capabilities_farm_capabilities_uuid_unique" ON "farm_capabilities" ("uuid");
