import { Database } from 'bun:sqlite'
import { expect, test } from 'bun:test'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { DEMO_FARM, DEMO_FIELD } from '../../app/Support/content/demo-field'

type Row = Record<string, string | number | null>
const tables = ['users', 'farms', 'fields', 'drones', 'missions', 'detections', 'treatment_maps', 'features', 'use_cases'] as const

test('native catalog publication restores stable demo identities and protects customer data', async () => {
  const evidence = process.env.CATALOG_PERSISTENCE_EVIDENCE
  if (evidence) await mkdir(resolve(evidence), { recursive: true, mode: 0o700 })
  const directory = await mkdtemp(join(evidence ? resolve(evidence) : tmpdir(), 'open-farming-catalog-'))
  const databasePath = join(directory, 'fixture.sqlite')
  const env = { ...process.env, APP_ENV: 'test', NODE_ENV: 'test', DB_CONNECTION: 'sqlite', DB_DATABASE_PATH: databasePath }
  const cwd = resolve(import.meta.dir, '../..')
  let sequence = 0
  let complete = false
  let database: Database | undefined
  let db: Database
  function openDatabase(): Database {
    const connection = new Database(databasePath)
    connection.run('PRAGMA foreign_keys = ON')
    return connection
  }

  async function run(label: string, args: string[], expected = 0): Promise<string> {
    const file = join(directory, `${sequence++}-${label}.log`)
    const errors = `${file}.stderr`
    const child = Bun.spawn([process.execPath, '--no-env-file', ...args], {
      cwd, env, stdin: 'ignore', stdout: Bun.file(file), stderr: Bun.file(errors),
      detached: process.platform !== 'win32',
    })
    let expired = false
    const deadline = setTimeout(() => {
      expired = true
      if (process.platform !== 'win32') {
        try { process.kill(-child.pid, 'SIGKILL') }
        catch { child.kill('SIGKILL') }
      }
      else child.kill('SIGKILL')
    }, 60_000)
    try {
      const code = await child.exited
      const output = await readFile(file, 'utf8') + await readFile(errors, 'utf8')
      expect(expired, `${label}: ${output}`).toBe(false)
      expect(code, `${label}: ${output}`).toBe(expected)
      return output
    }
    finally { clearTimeout(deadline) }
  }
  async function publish(label: string, expected = 0): Promise<string> {
    // Do not hold a second SQLite runtime's statements across a writer process.
    const reopen = database !== undefined
    database?.close()
    database = undefined
    try { return await run(label, ['node_modules/@stacksjs/buddy/dist/cli.js', 'catalog:sync'], expected) }
    finally { if (reopen) db = database = openDatabase() }
  }

  function legacyPivots(populated = false): void {
    database?.close()
    database = undefined
    const fixture = openDatabase()
    try {
      for (const table of ['taggable_models', 'categorizable_models']) {
        expect(fixture.query<{ count: number }, []>(`SELECT COUNT(*) AS count FROM ${table}`).get()?.count).toBe(0)
        fixture.run(`DROP TABLE ${table}`)
      }
      fixture.run('CREATE TABLE taggable_models (id INTEGER PRIMARY KEY, tag_id INTEGER NOT NULL, taggable_type TEXT NOT NULL, created_at TEXT, updated_at TEXT)')
      fixture.run('CREATE TABLE categorizable_models (id INTEGER PRIMARY KEY, category_id INTEGER NOT NULL, categorizable_type TEXT NOT NULL, created_at TEXT, updated_at TEXT)')
      if (populated) fixture.run("INSERT INTO taggable_models (id, tag_id, taggable_type) VALUES (1, 1, 'Farm')")
    }
    finally { fixture.close() }
  }
  function inspectPivots() {
    const fixture = openDatabase()
    try {
      return Object.fromEntries(['taggable_models', 'categorizable_models'].map(table => [table, {
        columns: fixture.query<Row, []>(`PRAGMA table_info(${table})`).all(),
        rows: fixture.query<Row, []>(`SELECT * FROM ${table} ORDER BY id`).all(),
      }]))
    }
    finally { fixture.close() }
  }

  try {
    // Admit the actual native config before allowing the first database write.
    await run('database-path', ['--eval', `
const { database } = await import('@stacksjs/config')
if (database.connections.sqlite.database !== process.env.DB_DATABASE_PATH)
  throw new Error('Fixture database path mismatch')
await (await import('@stacksjs/logging')).log.flush()
process.exit(0)
`])
    await run('migrate', ['node_modules/@stacksjs/buddy/dist/cli.js', 'migrate'])
    // Reproduce the legacy shape through the installed CLI, never installed patches.
    legacyPivots()
    await run('migrate-empty-legacy', ['node_modules/@stacksjs/buddy/dist/cli.js', 'migrate'])
    const repaired = inspectPivots()
    for (const [table, column] of [['taggable_models', 'taggable_id'], ['categorizable_models', 'categorizable_id']]) {
      const owner = repaired[table!]!.columns.find(value => value.name === column)
      expect(owner?.notnull).toBe(1)
      expect(owner?.dflt_value).toBeNull()
      expect(repaired[table!]!.rows).toHaveLength(0)
    }
    await publish('first')
    db = database = openDatabase()
    const rows = (table: typeof tables[number]) => db.query<Row, []>(`SELECT * FROM "${table}" ORDER BY id`).all()
    function one(table: typeof tables[number], column: string, value: string | number): Row {
      const row = rows(table).find(row => row[column] === value)
      if (!row) throw new Error(`Missing fixture ${table}.${column}=${value}`)
      return row
    }
    function copy(table: typeof tables[number], source: Row, changes: Row): number {
      const values = { ...source, ...changes }
      delete values.id
      if ('uuid' in values) values.uuid = crypto.randomUUID()
      const columns = Object.keys(values)
      return Number(db.prepare(`INSERT INTO "${table}" (${columns.map(key => `"${key}"`).join(',')}) VALUES (${columns.map(() => '?').join(',')})`).run(...Object.values(values)).lastInsertRowid)
    }
    const farm = one('farms', 'slug', DEMO_FARM.slug)
    const field = one('fields', 'slug', DEMO_FIELD.slug)
    const drone = one('drones', 'callsign', 'OF-K12')
    const mission = one('missions', 'farm_id', farm.id!)
    const identities = { farm: farm.id, field: field.id, drone: drone.id }
    expect(rows('detections')).toHaveLength(98)
    expect(rows('treatment_maps')).toHaveLength(1)

    // Raw SQL seeds only this admitted disposable fixture, avoiding user mail hooks.
    const userId = Number(db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run('Fixture farmer', 'fixture@example.invalid', 'not-an-account-password').lastInsertRowid)
    const customerFarm = copy('farms', farm, { slug: 'customer-holding', user_id: userId })
    const customerField = copy('fields', field, { slug: 'customer-field', farm_id: customerFarm })
    const customerDrone = copy('drones', drone, { callsign: 'CUSTOMER-01', farm_id: customerFarm })
    const customerMission = copy('missions', mission, { farm_id: customerFarm, field_id: customerField, drone_id: customerDrone })
    copy('detections', rows('detections')[0]!, { mission_id: customerMission, field_id: customerField })
    copy('treatment_maps', rows('treatment_maps')[0]!, { mission_id: customerMission, field_id: customerField })
    const customerRows = () => ({
      user: one('users', 'id', userId), farm: one('farms', 'id', customerFarm),
      field: one('fields', 'id', customerField), drone: one('drones', 'id', customerDrone),
      mission: one('missions', 'id', customerMission),
      detections: rows('detections').filter(row => row.mission_id === customerMission),
      treatment: rows('treatment_maps').filter(row => row.mission_id === customerMission),
    })
    const customerBefore = customerRows()
    db.prepare('UPDATE missions SET orthomosaic_url = ?, orthomosaic_bounds = ?, orthomosaic_resolution_cm = ? WHERE id = ?').run('/fixtures/published-stitch.webp', '[12.9,48.7,13,48.8]', 2.5, mission.id!)
    const assertPublished = () => {
      expect({ farm: one('farms', 'slug', DEMO_FARM.slug).id, field: one('fields', 'slug', DEMO_FIELD.slug).id, drone: one('drones', 'callsign', 'OF-K12').id }).toEqual(identities)
      expect(one('farms', 'slug', DEMO_FARM.slug).deleted_at).toBeNull()
      expect(one('fields', 'slug', DEMO_FIELD.slug).deleted_at).toBeNull()
      const current = one('missions', 'farm_id', farm.id!)
      expect([current.orthomosaic_url, current.orthomosaic_bounds, current.orthomosaic_resolution_cm]).toEqual(['/fixtures/published-stitch.webp', '[12.9,48.7,13,48.8]', 2.5])
      expect(rows('missions').filter(row => row.farm_id === farm.id)).toHaveLength(1)
      expect(rows('detections').filter(row => row.field_id === field.id)).toHaveLength(98)
      expect(rows('treatment_maps').filter(row => row.field_id === field.id)).toHaveLength(1)
      expect(customerRows()).toEqual(customerBefore)
    }
    await publish('repeat')
    assertPublished()
    db.prepare('UPDATE farms SET deleted_at = ? WHERE id = ?').run('2026-01-01 00:00:00', farm.id!)
    db.prepare('UPDATE fields SET deleted_at = ? WHERE id = ?').run('2026-01-01 00:00:00', field.id!)
    await publish('restore')
    assertPublished()

    const snapshot = () => Object.fromEntries(tables.map(table => [table, rows(table)]))
    for (const conflict of [
      { table: 'farms', column: 'user_id', id: farm.id!, value: userId, previous: null },
      { table: 'fields', column: 'farm_id', id: field.id!, value: customerFarm, previous: farm.id! },
      { table: 'drones', column: 'farm_id', id: drone.id!, value: customerFarm, previous: farm.id! },
    ]) {
      const update = `UPDATE "${conflict.table}" SET "${conflict.column}" = ? WHERE id = ?`
      db.prepare(update).run(conflict.value, conflict.id)
      const before = snapshot()
      const output = await publish(`refuse-${conflict.table}`, 1)
      expect(output).toContain('refusing to overwrite')
      expect(snapshot()).toEqual(before)
      db.prepare(update).run(conflict.previous, conflict.id)
    }
    legacyPivots(true)
    const ambiguous = inspectPivots()
    const refusal = await run('migrate-populated-legacy', ['node_modules/@stacksjs/buddy/dist/cli.js', 'migrate'], 1)
    expect(refusal).toContain('Cannot infer taggable_models.taggable_id')
    expect(inspectPivots()).toEqual(ambiguous)
    complete = true
  }
  catch (error) { throw new Error(`Catalog persistence fixture retained at ${directory}`, { cause: error }) }
  finally {
    database?.close()
    if (complete && !evidence) await rm(directory, { recursive: true })
    else console.log(`CATALOG_PERSISTENCE_RETAINED ${directory}`)
  }
}, 180_000)
