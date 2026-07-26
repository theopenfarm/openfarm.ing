CREATE TABLE IF NOT EXISTS "demo_requests" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" TEXT not null,
  "email" TEXT not null,
  "farm_name" TEXT,
  "segment" TEXT,
  "hectares" INTEGER,
  "message" TEXT,
  "status" TEXT CHECK ("status" IN ('new', 'contacted', 'scheduled', 'closed')) default 'new',
  "source" TEXT,
  "created_at" TEXT not null default CURRENT_TIMESTAMP,
  "updated_at" TEXT,
  "uuid" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "demo_requests_demo_requests_uuid_unique" ON "demo_requests" ("uuid");
