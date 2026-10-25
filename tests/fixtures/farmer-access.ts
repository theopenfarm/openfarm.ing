import assert from 'node:assert/strict'
import { Auth, authCookieName } from '@stacksjs/auth'
import { database } from '@stacksjs/config'
import { db, makeModelRecords } from '@stacksjs/database'
import { mail } from '@stacksjs/email'
import { log } from '@stacksjs/logging'
import { serverResponse } from '@stacksjs/router'
import { injectGlobalAutoImports } from '@stacksjs/server'
import Farm from '../../app/Models/Farm'
import Field from '../../app/Models/Field'
import Drone from '../../app/Models/Drone'
import FarmCapability from '../../app/Models/FarmCapability'
import Herd from '../../app/Models/Herd'
import HerdMove from '../../app/Models/HerdMove'
import Mission from '../../app/Models/Mission'
import Detection from '../../app/Models/Detection'
import TreatmentMap from '../../app/Models/TreatmentMap'

const privateDatabase = process.env.DB_DATABASE_PATH
assert(privateDatabase, 'Private database path is required')
assert.equal(database.connections?.sqlite.database, privateDatabase, 'Private database admission')
mail.fake()
await injectGlobalAutoImports()

function id(value: unknown): number {
  assert(typeof value === 'number' && Number.isSafeInteger(value) && value > 0)
  return value
}
async function attributes(name: string, overrides: Record<string, unknown>) {
  const rows = await makeModelRecords(name, 1, overrides)
  assert.equal(rows.length, 1)
  return rows[0]!
}
const users: { id: number, token: string }[] = []
for (let index = 0; index < 3; index++) {
  const row = await db.insertInto('users').values({ name: `Private farmer ${index}`, email: `access-owner-${index}@example.test`, password: 'not-a-production-password-1234' }).returningAll().executeTakeFirst()
  assert(row)
  const session = await Auth.loginUsingId(id(row.id))
  assert(session)
  users.push({ id: id(row.id), token: String(session.token) })
}
const holdings = []
for (let index = 0; index < 3; index++) {
  const user = users[index === 1 ? 1 : 0]!
  const farm = await Farm.create({ name: `Private farm ${index}`, slug: `private-farm-${index}`, user_id: user.id })
  assert.equal(Number(farm.user_id), user.id)
  const farmId = id(farm.id)
  const field = await Field.create({ farm_id: farmId, name: `Private field ${index}`, slug: `private-field-${index}`, crop: 'Private crop', hectares: 1, status: 'active' })
  const fieldId = id(field.id)
  const drone = await Drone.create(await attributes('Drone', { farm_id: farmId, callsign: `PRIVATE-${index}`, model: 'Private fixture', payload: 'rgb' }))
  const capability = await FarmCapability.create({ farm_id: farmId, field_id: fieldId, feature_slug: 'field-mapping', status: 'active' })
  const herd = await Herd.create(await attributes('Herd', { farm_id: farmId, field_id: fieldId, name: `Private herd ${index}`, slug: `private-herd-${index}`, species: 'cattle' }))
  const mission = await Mission.create(await attributes('Mission', { farm_id: farmId, field_id: fieldId, drone_id: id(drone.id), purpose: 'field-mapping', status: 'scheduled', flown_at: null }))
  const move = await HerdMove.create(await attributes('HerdMove', { farm_id: farmId, herd_id: id(herd.id), mission_id: id(mission.id), from_field_id: fieldId, to_field_id: fieldId, reason: 'manual', status: 'planned' }))
  const detection = await Detection.create(await attributes('Detection', { mission_id: id(mission.id), field_id: fieldId, kind: 'weed', label: 'Private finding' }))
  const treatment = await TreatmentMap.create(await attributes('TreatmentMap', { mission_id: id(mission.id), field_id: fieldId, product: 'Private declared treatment' }))
  holdings.push({ farm: farmId, fields: fieldId, drones: id(drone.id), 'farm-capabilities': id(capability.id), herds: id(herd.id), missions: id(mission.id), 'herd-moves': id(move.id), detections: id(detection.id), 'treatment-maps': id(treatment.id) })
}
const own = [holdings[0]!, holdings[2]!], foreign = holdings[1]!
const resources = ['fields', 'drones', 'farm-capabilities', 'herds', 'missions', 'herd-moves', 'detections', 'treatment-maps'] as const
let observations = 0
async function request(path: string, user = 0, method = 'GET', body?: unknown): Promise<Response> {
  const headers = new Headers({ Accept: 'application/json' })
  if (user >= 0) headers.set('Cookie', `${authCookieName()}=${users[user]!.token}`)
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  const response = await serverResponse(new Request(`http://localhost${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }))
  assert(response instanceof Response)
  observations++
  return response
}
async function ids(response: Response): Promise<number[]> {
  assert.equal(response.status, 200)
  const body: unknown = await response.json()
  assert(body && typeof body === 'object' && 'data' in body && Array.isArray(body.data))
  return body.data.map(row => { assert(row && typeof row === 'object' && 'id' in row); return id(row.id) }).sort((a, b) => a - b)
}
for (const resource of resources) {
  const base = `/api/${resource}`
  const expected = own.map(row => row[resource]).sort((a, b) => a - b)
  assert.deepEqual(await ids(await request(base)), expected, `${resource}: unfiltered reads stay within both owned holdings`)
  assert.equal((await request(`${base}?farm_id=${foreign.farm}`)).status, 403, `${resource}: hostile existing selector`)
  assert([403, 404].includes((await request(`${base}/${foreign[resource]}`)).status), `${resource}: another holding's row`)
  assert.deepEqual(await ids(await request(base, 1)), [foreign[resource]], `${resource}: single holding isolation`)
  assert.equal((await request(base, 2)).status, 403, `${resource}: no holding`)
  assert.equal((await request(base, -1)).status, 401, `${resource}: guest`)
  const show = await request(`${base}/${own[0]![resource]}`)
  assert.equal(show.status, 200, `${resource}: owned row remains available`)
}
assert.equal((await request(`/api/fields?farm_id=${own[0]!.farm}&farm_id=${foreign.farm}`)).status, 403)
for (const selector of ['not-an-id', '0', '-1', '1.5', '1e0', '9007199254740992', ''])
  assert.equal((await request(`/api/fields?farm_id=${selector}`)).status, 403)
assert.equal((await request(`/api/fields?farm_id=${own[0]!.farm}&farmId=${foreign.farm}`)).status, 403)
assert.deepEqual(await ids(await request(`/api/fields?farm_id=${own[0]!.farm}`)), [own[0]!.fields])
for (let round = 0; round < 4; round++) {
  const [first, second] = await Promise.all([request('/api/fields', 0).then(ids), request('/api/fields', 1).then(ids)])
  assert.deepEqual(first, own.map(row => row.fields).sort((a, b) => a - b))
  assert.deepEqual(second, [foreign.fields])
}
// Adding native read scopes must not enable the generic mutation routes that
// the previous native row-scoping policy withheld. Workflow Actions own writes.
for (const [method, path, body] of [
  ['POST', '/api/fields', { farm_id: own[0]!.farm, name: 'Unrequested field', slug: 'unrequested-field', crop: 'Private crop', hectares: 1, status: 'active' }],
  ['PATCH', `/api/missions/${own[0]!.missions}`, { status: 'completed' }],
  ['DELETE', `/api/herds/${own[0]!.herds}`, undefined],
] as const) {
  const token = users[0]!.token
  const response = await serverResponse(new Request(`http://localhost${path}`, { method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }))
  assert([404, 405].includes(response.status), `${method} ${path}: generic writes remain unavailable`)
}
// A cached holding set must never outlive a parent deletion or reassignment.
await db.updateTable('farms').set({ deleted_at: '2026-01-01 00:00:00' }).where('id', '=', own[0]!.farm).execute()
for (const resource of resources) {
  assert.deepEqual(await ids(await request(`/api/${resource}`)), [own[1]![resource]], `${resource}: deleted holding is invisible`)
  assert([403, 404].includes((await request(`/api/${resource}/${own[0]![resource]}`)).status))
}
await db.updateTable('farms').set({ deleted_at: null, user_id: users[1]!.id }).where('id', '=', own[0]!.farm).execute()
for (const resource of resources) {
  assert.deepEqual(await ids(await request(`/api/${resource}`)), [own[1]![resource]], `${resource}: reassignment revokes old owner`)
  assert.deepEqual(await ids(await request(`/api/${resource}`, 1)), [own[0]![resource], foreign[resource]].sort((a, b) => a - b), `${resource}: reassignment follows current owner`)
}
await db.updateTable('farms').set({ deleted_at: '2026-01-01 00:00:00' }).where('id', '=', own[1]!.farm).execute()
for (const resource of resources)
  assert.equal((await request(`/api/${resource}`)).status, 403, `${resource}: all holdings revoked`)
console.log(JSON.stringify({ oracle: 'native-farmer-read-ownership', resources: resources.length, observations, twoTenants: true, multipleHoldings: true, concurrentIsolation: true, guestDenied: true, noHoldingDenied: true, genericWritesUnavailable: true, parentDeletion: true, parentReassignment: true, allHoldingsRevoked: true }))
await log.flush()
