import { Action } from '@stacksjs/actions'
import { rateLimit } from '@stacksjs/router'
import FarmCapability from '../../Models/FarmCapability'
import { requiresVisit } from '../../Support/capabilities'
import { features } from '../../Support/content/features'
import { seeOther } from '../../Support/formResponse'
import { userFromRequest } from '../../Support/session'
import { farmFor } from '../../Support/dashboard'

/**
 * Switch a capability on, pause it, or change how often it is flown.
 *
 * One endpoint for all eighteen, because from the farm's side they are the
 * same decision: whether this work happens here, how often, and over what. The
 * differences between them (which sensor, what the model looks for) are the
 * flight's business, not the farmer's.
 *
 * Everything is re-derived from the signed-in farmer's own holding. The form
 * posts a slug and a cadence, never a farm id — a request cannot name a
 * holding, so it cannot name somebody else's.
 */
export default new Action({
  name: 'CapabilityUpdateAction',
  description: 'Enable, pause or reschedule a capability for the farmer’s holding',
  method: 'POST',

  async handle(request: RequestInstance) {
    await rateLimit('capability-update', 60).per('minute')

    const farmer = await userFromRequest(request as unknown as { headers: Headers })
    if (!farmer?.id)
      return seeOther('/login')

    const farm = await farmFor(Number(farmer.id))
    if (!farm?.id)
      return seeOther('/dashboard?e=noholding')

    const slug = String(request.get('slug') ?? '').trim()
    if (!features.some(feature => feature.slug === slug))
      return seeOther('/dashboard/capabilities?e=unknown')

    const intent = String(request.get('intent') ?? 'enable')
    const cadence = clampCadence(request.get('cadence_days'))
    const fieldId = parseField(request.get('field_id'))

    const existing = await FarmCapability
      .where('farm_id', Number(farm.id))
      .where('feature_slug', slug)
      .first()

    if (intent === 'disable') {
      if (existing?.id)
        await FarmCapability.where('id', Number(existing.id)).delete()

      return seeOther('/dashboard/capabilities?ok=off')
    }

    // Some capabilities need equipment on site or a licence check before a
    // first flight. Recording the request is honest; scheduling a flight that
    // cannot happen is not.
    const status = intent === 'pause'
      ? 'paused'
      : requiresVisit(slug) ? 'requested' : 'active'

    const payload = {
      farm_id: Number(farm.id),
      field_id: fieldId,
      feature_slug: slug,
      status,
      cadence_days: cadence,
    } as any

    if (existing?.id)
      await FarmCapability.where('id', Number(existing.id)).update(payload)
    else
      await FarmCapability.create(payload)

    return seeOther(`/dashboard/capabilities?ok=${status}`)
  },
})

/**
 * Days between flights, held to something a schedule can honour.
 *
 * Below a week is not a cadence, it is a standing patrol, and the aircraft is
 * shared; beyond a season the capability is off in all but name.
 */
function clampCadence(raw: unknown): number {
  const days = Number(raw)
  if (!Number.isFinite(days))
    return 14

  return Math.min(180, Math.max(3, Math.round(days)))
}

/** A field id, or null for the whole holding. */
function parseField(raw: unknown): number | null {
  const id = Number(raw)
  return Number.isFinite(id) && id > 0 ? id : null
}
