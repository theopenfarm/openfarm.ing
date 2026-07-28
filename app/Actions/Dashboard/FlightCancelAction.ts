import { Action } from '@stacksjs/actions'
import { rateLimit } from '@stacksjs/router'
import Mission from '../../Models/Mission'
import { farmFor } from '../../Support/dashboard'
import { seeOther } from '../../Support/formResponse'
import { userFromRequest } from '../../Support/session'

/**
 * Call off a flight that has not happened yet.
 *
 * Cancelled rather than deleted: the plan said this field would be flown, and
 * a record that it was called off is worth more than a gap. `weather_cancelled`
 * is the model's existing vocabulary for a flight that was scheduled and did
 * not happen, which is exactly this — the reason differs, the state does not.
 *
 * Only a scheduled flight can be cancelled. One that has already flown is
 * history, and history is not editable from a dashboard.
 */
export default new Action({
  name: 'FlightCancelAction',
  description: 'Cancel one of the farmer’s scheduled flights',
  method: 'POST',

  async handle(request: RequestInstance) {
    await rateLimit('flight-cancel', 30).per('minute')

    const farmer = await userFromRequest(request as unknown as { headers: Headers })
    if (!farmer?.id)
      return seeOther('/login')

    const farm = await farmFor(Number(farmer.id))
    if (!farm?.id)
      return seeOther('/dashboard?e=noholding')

    const flightId = Number(request.get('flight_id'))
    if (!Number.isFinite(flightId))
      return seeOther('/dashboard/flights?e=unknown')

    // Scoped by farm in the same query, so a flight belonging to someone else
    // simply is not found.
    const flight = await Mission
      .where('id', flightId)
      .where('farm_id', farm.id)
      .where('status', 'scheduled')
      .first()

    if (!flight?.id)
      return seeOther('/dashboard/flights?e=notfound')

    await Mission.where('id', Number(flight.id)).update({
      status: 'weather_cancelled',
      cancellation_reason: 'Called off from the dashboard.',
    } as any)

    return seeOther('/dashboard/flights?ok=cancelled')
  },
})
