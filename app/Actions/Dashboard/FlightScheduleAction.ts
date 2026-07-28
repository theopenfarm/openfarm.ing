import { Action } from '@stacksjs/actions'
import { rateLimit } from '@stacksjs/router'
import Field from '../../Models/Field'
import Mission from '../../Models/Mission'
import { features } from '../../Support/content/features'
import { farmFor } from '../../Support/dashboard'
import { seeOther } from '../../Support/formResponse'
import { userFromRequest } from '../../Support/session'

/**
 * Put one flight on the schedule, outside the cadence.
 *
 * The capability schedule covers the routine; this is the exception a farmer
 * actually needs — a block that looked wrong from the cab, a follow-up after
 * treatment, a check before a contractor arrives. The flight is created in
 * `scheduled`, exactly as the nightly job would create it, so operations sees
 * one queue rather than two.
 *
 * The field is re-read from the caller's own holding before anything is
 * written: a posted id that belongs to another farm is not an error to report
 * back in detail, it is simply not their field.
 */
export default new Action({
  name: 'FlightScheduleAction',
  description: 'Schedule one flight over one of the farmer’s fields',
  method: 'POST',

  async handle(request: RequestInstance) {
    await rateLimit('flight-schedule', 30).per('minute')

    const farmer = await userFromRequest(request as unknown as { headers: Headers })
    if (!farmer?.id)
      return seeOther('/login')

    const farm = await farmFor(Number(farmer.id))
    if (!farm?.id)
      return seeOther('/dashboard?e=noholding')

    const purpose = String(request.get('purpose') ?? '').trim()
    if (!features.some(feature => feature.slug === purpose))
      return seeOther('/dashboard/flights?e=unknown')

    const fieldId = Number(request.get('field_id'))
    const field = Number.isFinite(fieldId)
      ? await Field.where('id', fieldId).where('farm_id', farm.id).first()
      : null

    if (!field?.id)
      return seeOther('/dashboard/flights?e=field')

    // A field that already has this flight waiting does not need a second one.
    const waiting = await Mission
      .where('field_id', Number(field.id))
      .where('purpose', purpose)
      .where('status', 'scheduled')
      .first()

    if (waiting?.id)
      return seeOther('/dashboard/flights?ok=already')

    await Mission.create({
      farm_id: farm.id,
      field_id: Number(field.id),
      purpose,
      status: 'scheduled',
      hectares_covered: Number((field as any).hectares ?? 0),
      summary: 'Requested from the dashboard.',
    } as any)

    return seeOther('/dashboard/flights?ok=scheduled')
  },
})
