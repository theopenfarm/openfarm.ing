import { Database } from 'bun:sqlite'
import process from 'node:process'

/**
 * Direct SQLite access for the read paths that do not run inside the ORM's
 * process: stx `<script server>` blocks and the seeder.
 *
 * The marketing pages are server rendered per request and only ever read, so
 * going straight through Bun's driver keeps them independent of model boot
 * order and auto-import availability inside a template. Anything that writes
 * (the demo request endpoint) goes through the ORM, where the validation
 * rules live.
 */
export function dbPath(): string {
  const configured = process.env.DB_DATABASE_PATH || 'database/stacks.sqlite'
  return configured.startsWith('/') ? configured : `${process.cwd()}/${configured}`
}

/** Open a read-only handle. Callers close it. */
export function openDb(readonly = true): Database {
  return new Database(dbPath(), { readonly, create: false })
}

/**
 * Run `read` against the database, returning `fallback` if the database is
 * missing, unmigrated or unseeded.
 *
 * A marketing page must render on a machine where nobody has run `buddy
 * migrate` yet, so every read path here is written to degrade to the content
 * modules rather than throw a 500 at a visitor.
 */
export function safeRead<T>(read: (db: Database) => T, fallback: T): T {
  let db: Database | undefined
  try {
    db = openDb()
    return read(db)
  }
  catch {
    return fallback
  }
  finally {
    db?.close()
  }
}
