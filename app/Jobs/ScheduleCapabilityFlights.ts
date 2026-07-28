import { Job } from '@stacksjs/queue'
import { Every } from '@stacksjs/types'
import { log } from '@stacksjs/logging'
import FarmCapability from '../Models/FarmCapability'
import Field from '../Models/Field'
import Mission from '../Models/Mission'

/**
 * Turn each active capability into flights that are actually due.
 *
 * A capability is a standing instruction — "watch this crop for disease every
 * ten days" — and this is what converts it into work. It runs daily, looks at
 * what each holding has switched on, and puts a planned flight on the schedule
 * for anything whose cadence has come round.
 *
 * Three things it deliberately does not do:
 *
 *  - It does not schedule `requested` capabilities. Those need equipment on
 *    site or a licence check first; a planned flight would be a promise the
 *    schedule cannot keep.
 *  - It does not double-book. A field that already has a scheduled flight for
 *    the same capability is skipped, so a job that runs twice (a retry, a
 *    manual invocation) does not fill the calendar with duplicates.
 *  - It does not decide the aircraft. Which drone flies is an operations
 *    decision made when the flight is dispatched, not when it is planned.
 */
export default new Job({
  name: 'ScheduleCapabilityFlights',
  description: 'Plan the flights that each holding’s active capabilities are due',
  queue: 'default',
  tries: 3,
  backoff: 30,
  rate: Every.Day,

  async handle() {
    const active = await FarmCapability.where('status', 'active').get() as any[]
    if (active.length === 0)
      return

    const planned = await Mission.where('status', 'scheduled').get() as any[]
    const alreadyPlanned = new Set(
      planned.map(flight => `${flight.field_id}:${flight.purpose}`),
    )

    let created = 0

    for (const capability of active) {
      const farmId = Number(capability.farm_id)
      if (!farmId)
        continue

      if (!isDue(capability))
        continue

      // A capability with no field named applies to the whole holding, which
      // is the normal case; one with a field watches that parcel only.
      const fields = capability.field_id
        ? await Field.where('id', Number(capability.field_id)).get() as any[]
        : await Field.where('farm_id', farmId).where('status', 'active').get() as any[]

      for (const field of fields) {
        const key = `${field.id}:${capability.feature_slug}`
        if (alreadyPlanned.has(key))
          continue

        await Mission.create({
          farm_id: farmId,
          field_id: Number(field.id),
          purpose: String(capability.feature_slug),
          status: 'scheduled',
          hectares_covered: Number(field.hectares ?? 0),
          summary: `Planned from the ${capability.feature_slug} schedule (every ${capability.cadence_days} days).`,
        } as any)

        alreadyPlanned.add(key)
        created++
      }

      await FarmCapability
        .where('id', Number(capability.id))
        .update({ last_scheduled_at: new Date().toISOString() } as any)
    }

    if (created > 0)
      log.info(`[capabilities] planned ${created} flight(s) from ${active.length} active capability record(s)`)
  },
})

/**
 * Has this capability's cadence come round?
 *
 * Measured from the last time the schedule produced a flight, not from the
 * last flight of any kind: a capability that was paused over winter should
 * resume on its own cadence rather than counting from whatever was flown for
 * another reason in March.
 */
function isDue(capability: { cadence_days?: unknown, last_scheduled_at?: unknown }): boolean {
  const last = capability.last_scheduled_at
  if (!last)
    return true

  const previous = new Date(String(last))
  if (Number.isNaN(previous.getTime()))
    return true

  const days = Number(capability.cadence_days ?? 14)
  const due = new Date(previous)
  due.setDate(due.getDate() + (Number.isFinite(days) ? days : 14))

  return due.getTime() <= Date.now()
}
