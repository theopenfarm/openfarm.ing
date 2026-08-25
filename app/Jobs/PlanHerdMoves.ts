import { Job } from '@stacksjs/queue'
import { Every } from '@stacksjs/types'
import { log } from '@stacksjs/logging'
import FarmCapability from '../Models/FarmCapability'
import Field from '../Models/Field'
import Herd from '../Models/Herd'
import HerdMove from '../Models/HerdMove'
import { expireStaleMoves, planMove } from '../Support/herding/moves'

/**
 * Propose the rotation moves each grazing holding is due, overnight.
 *
 * The counterpart to `ScheduleCapabilityFlights`, and shaped the same way: a
 * capability is a standing instruction, and this is what turns it into work.
 * The difference is what the work does. A scouting flight looks at a field; a
 * herding move drives somebody's animals across one.
 *
 * So this job is deliberately the least powerful thing in the feature. Four
 * limits, and every one of them is there because of what could otherwise
 * happen while nobody is watching:
 *
 *  - **It only ever writes `planned`.** It cannot authorise, and no code path
 *    from here reaches `flying`. A drone cannot be put over livestock by a
 *    cron entry; a person has to say yes, in the morning, looking at the
 *    corridor. That is the whole shape of the capability.
 *  - **It skips `requested` capabilities.** Herding needs a licence check and
 *    a route survey before a first flight, so a proposal would be a promise
 *    the schedule cannot keep.
 *  - **One live proposal per mob.** `planMove` refuses a second, so a job that
 *    runs twice does not fill somebody's morning with duplicates.
 *  - **It proposes nothing it cannot route.** A mob with no destination block
 *    free, or none recorded on a block at all, is skipped rather than guessed
 *    at.
 *
 * It also lapses yesterday's unanswered authorisations on the way past, so a
 * farmer never opens the console to a move still described as authorised from
 * a window that closed overnight.
 */
export default new Job({
  name: 'PlanHerdMoves',
  description: 'Propose the herding moves each holding’s rotation is due',
  queue: 'default',
  tries: 3,
  backoff: 30,
  rate: Every.Day,

  async handle() {
    const active = await FarmCapability
      .where('feature_slug', 'automated-herding')
      .where('status', 'active')
      .get() as any[]

    if (active.length === 0)
      return

    let planned = 0
    let expired = 0

    for (const capability of active) {
      const farmId = Number(capability.farm_id)
      if (!farmId)
        continue

      expired += await expireStaleMoves(farmId)

      const herds = await Herd
        .where('farm_id', farmId)
        .where('status', 'grazing')
        .get() as any[]

      if (herds.length === 0)
        continue

      const fields = await Field
        .where('farm_id', farmId)
        .where('status', 'active')
        .get() as any[]

      /*
       * A block is available if no other mob is standing on it. Rotational
       * grazing is the whole point of the move, and putting a second mob onto
       * occupied ground is the one outcome a rotation must not produce.
       */
      const occupied = new Set(herds.map(herd => Number(herd.field_id)))

      for (const herd of herds) {
        if (!(await isDue(herd, capability)))
          continue

        const destination = fields.find(field =>
          Number(field.id) !== Number(herd.field_id) && !occupied.has(Number(field.id)))

        if (!destination)
          continue

        const result = await planMove({
          farmId,
          herdId: Number(herd.id),
          toFieldId: Number(destination.id),
          reason: 'rotation',
        })

        if (!result.ok)
          continue

        // Claim the block so two mobs in the same run cannot be sent to it.
        occupied.add(Number(destination.id))
        planned++
      }

      await FarmCapability
        .where('id', Number(capability.id))
        .update({ last_scheduled_at: new Date().toISOString() } as any)
    }

    if (planned > 0 || expired > 0)
      log.info(`[herding] proposed ${planned} move(s), lapsed ${expired} unanswered authorisation(s)`)
  },
})

/**
 * Has this mob been on its block long enough to move?
 *
 * Measured from the last move that actually completed, not from the last one
 * proposed: a proposal a farmer declined should not count as having moved
 * them, and a mob whose move was aborted is still standing where it was.
 */
async function isDue(herd: { id?: unknown }, capability: { cadence_days?: unknown }): Promise<boolean> {
  const days = Number(capability.cadence_days ?? 14)
  const cadence = Number.isFinite(days) && days > 0 ? days : 14

  const completed = await HerdMove
    .where('herd_id', Number(herd.id))
    .where('status', 'complete')
    .orderByDesc('id')
    .first() as any

  if (!completed?.completed_at)
    return true

  const last = new Date(String(completed.completed_at))
  if (Number.isNaN(last.getTime()))
    return true

  const due = new Date(last)
  due.setDate(due.getDate() + cadence)

  return due.getTime() <= Date.now()
}
