CREATE TABLE IF NOT EXISTS "treatment_maps" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "product" TEXT not null,
  "zones" TEXT,
  "treated_hectares" INTEGER default 0,
  "field_hectares" INTEGER default 0,
  "rate_per_hectare" INTEGER default 0,
  "format" TEXT CHECK ("format" IN ('isoxml', 'shapefile', 'geojson', 'csv')) default 'isoxml',
  "status" TEXT CHECK ("status" IN ('draft', 'ready', 'applied', 'superseded')) default 'ready',
  "notes" TEXT,
  "mission_id" INTEGER REFERENCES "missions"("id"),
  "field_id" INTEGER REFERENCES "fields"("id"),
  "created_at" TEXT not null default CURRENT_TIMESTAMP,
  "updated_at" TEXT,
  "uuid" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "treatment_maps_treatment_maps_uuid_unique" ON "treatment_maps" ("uuid");
