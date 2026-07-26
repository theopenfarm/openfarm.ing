CREATE TABLE IF NOT EXISTS "missions" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "purpose" TEXT not null,
  "status" TEXT CHECK ("status" IN ('scheduled', 'flying', 'processing', 'complete', 'weather_cancelled', 'failed')) default 'scheduled',
  "flown_at" TEXT,
  "hectares_covered" INTEGER default 0,
  "duration_minutes" INTEGER default 0,
  "resolution_cm" INTEGER,
  "summary" TEXT,
  "cancellation_reason" TEXT,
  "farm_id" INTEGER REFERENCES "farms"("id"),
  "field_id" INTEGER REFERENCES "fields"("id"),
  "drone_id" INTEGER REFERENCES "drones"("id"),
  "created_at" TEXT not null default CURRENT_TIMESTAMP,
  "updated_at" TEXT,
  "uuid" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "missions_missions_uuid_unique" ON "missions" ("uuid");
