CREATE TABLE IF NOT EXISTS "detections" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "kind" TEXT CHECK ("kind" IN ('weed', 'disease', 'pest', 'nutrient', 'moisture', 'compaction', 'wildlife', 'gap', 'livestock')) not null,
  "label" TEXT not null,
  "confidence" INTEGER default 0,
  "severity" TEXT CHECK ("severity" IN ('low', 'medium', 'high')) default 'low',
  "area_m2" INTEGER default 0,
  "x" INTEGER,
  "y" INTEGER,
  "latitude" INTEGER,
  "longitude" INTEGER,
  "status" TEXT CHECK ("status" IN ('open', 'review', 'confirmed', 'treated', 'dismissed')) default 'open',
  "mission_id" INTEGER REFERENCES "missions"("id"),
  "field_id" INTEGER REFERENCES "fields"("id"),
  "created_at" TEXT not null default CURRENT_TIMESTAMP,
  "updated_at" TEXT,
  "uuid" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "detections_detections_uuid_unique" ON "detections" ("uuid");
