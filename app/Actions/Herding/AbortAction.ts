import { Action } from '@stacksjs/actions'
import { rateLimit } from '@stacksjs/router'
import { farmFor } from '../../Support/dashboard'
import { wantsHtml, seeOther } from '../../Support/formResponse'
import { abortMove } from '../../Support/herding/moves'
import { userFromRequest } from '../../Support/session'

/**
 * `POST /api/herding/{id}/abort`
 *
 * Stop a move, from either side of the launch.
 *
 * Rate limited far more generously than the others, and that is deliberate: a
 * farmer hammering this button is a farmer watching something go wrong, and
 * the one request this API must never refuse is the one that stops an aircraft
 * working their stock.
 */
export default new Action({
  name: 'HerdingAbortAction',
  description: 'Stop a herding move that is authorised or under way',
  method: 'POST',

  async handle(request: RequestInstance) {
    await rateLimit('herding-abort', 240).per('minute')

    const farmer = await userFromRequest(request as unknown as { headers: Headers })
    if (!farmer?.id)
      return wantsHtml(request) ? seeOther('/login') : new Response(null, { status: 401 })

    const farm = await farmFor(Number(farmer.id))
    if (!farm?.id) {
      return wantsHtml(request)
        ? seeOther('/dashboard?e=noholding')
        : Response.json({ success: false, message: 'This account has no holding yet.' }, { status: 403 })
    }

    const result = await abortMove(
      farm.id,
      Number(request.getParam('id') ?? request.get('id')),
      String(request.get('reason') ?? 'Stopped from the dashboard.'),
    )

    if (wantsHtml(request))
      return seeOther(result.ok ? '/dashboard/herding?ok=aborted' : '/dashboard/herding?e=abort')

    if (!result.ok)
      return Response.json({ success: false, message: result.error }, { status: result.status ?? 409 })

    return Response.json({ data: result.move })
  },
})
