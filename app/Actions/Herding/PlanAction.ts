import { Action } from '@stacksjs/actions'
import { rateLimit } from '@stacksjs/router'
import { farmFor } from '../../Support/dashboard'
import { wantsHtml, seeOther } from '../../Support/formResponse'
import { planMove } from '../../Support/herding/moves'
import { userFromRequest } from '../../Support/session'

/**
 * `POST /api/herding/plan`
 *
 * Propose a move: which mob, and onto which block. Answers with the row in
 * `planned`, carrying the corridor it would take and the welfare envelope it
 * would be flown under.
 *
 * Planning is free and reversible on purpose. Nothing here can start an
 * aircraft, which is what makes it safe for the nightly job to call
 * unattended; the move only becomes flyable when a person authorises it.
 *
 * The holding is re-derived from the signed-in farmer and any farm the request
 * names is ignored. A posted mob that belongs to somebody else is not an error
 * worth explaining in detail, it is simply not their stock.
 */
export default new Action({
  name: 'HerdingPlanAction',
  description: 'Plan a herding move for one of the farmer’s mobs',
  method: 'POST',

  async handle(request: RequestInstance) {
    await rateLimit('herding-plan', 30).per('minute')

    const farmer = await userFromRequest(request as unknown as { headers: Headers })
    if (!farmer?.id)
      return wantsHtml(request) ? seeOther('/login') : new Response(null, { status: 401 })

    const farm = await farmFor(Number(farmer.id))
    if (!farm?.id) {
      return wantsHtml(request)
        ? seeOther('/dashboard?e=noholding')
        : Response.json({ success: false, message: 'This account has no holding yet.' }, { status: 403 })
    }

    const result = await planMove({
      farmId: farm.id,
      herdId: Number(request.get('herd_id')),
      toFieldId: Number(request.get('to_field_id')),
      reason: String(request.get('reason') ?? 'rotation'),
    })

    if (wantsHtml(request))
      return seeOther(result.ok ? '/dashboard/herding?ok=planned' : '/dashboard/herding?e=plan')

    if (!result.ok)
      return Response.json({ success: false, message: result.error }, { status: result.status ?? 422 })

    return Response.json({ data: result.move }, { status: 201 })
  },
})
