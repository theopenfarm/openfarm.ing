CREATE TABLE IF NOT EXISTS "drones" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "callsign" TEXT not null,
  "model" TEXT not null,
  "payload" TEXT CHECK ("payload" IN ('rgb', 'multispectral', 'thermal', 'lidar', 'hopper')) not null,
  "status" TEXT CHECK ("status" IN ('docked', 'in_flight', 'charging', 'maintenance', 'offline')) default 'docked',
  "station" TEXT,
  "battery_percent" INTEGER default 100,
  "flight_hours" INTEGER default 0,
  "farm_id" INTEGER REFERENCES "farms"("id"),
  "created_at" TEXT not null default CURRENT_TIMESTAMP,
  "updated_at" TEXT,
  "uuid" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "drones_drones_callsign_unique" ON "drones" ("callsign");
CREATE UNIQUE INDEX IF NOT EXISTS "drones_drones_uuid_unique" ON "drones" ("uuid");
