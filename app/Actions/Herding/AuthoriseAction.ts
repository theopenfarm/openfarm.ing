import { Action } from '@stacksjs/actions'
import { rateLimit } from '@stacksjs/router'
import { farmFor } from '../../Support/dashboard'
import { wantsHtml, seeOther } from '../../Support/formResponse'
import { authoriseMove } from '../../Support/herding/moves'
import { userFromRequest } from '../../Support/session'

/**
 * `POST /api/herding/{id}/authorise`
 *
 * The human act, and the only way into `flying`.
 *
 * It freezes the welfare envelope onto the row and opens a window. Both matter
 * for the same reason: a farmer is agreeing to a drone working their animals
 * under particular limits, at a particular time of day. A later settings change
 * must not rewrite the limits, and an aircraft must not use the agreement at
 * dusk. See `app/Support/herding/state.ts` for the transition table.
 */
export default new Action({
  name: 'HerdingAuthoriseAction',
  description: 'Authorise one planned herding move',
  method: 'POST',

  async handle(request: RequestInstance) {
    await rateLimit('herding-authorise', 30).per('minute')

    const farmer = await userFromRequest(request as unknown as { headers: Headers })
    if (!farmer?.id)
      return wantsHtml(request) ? seeOther('/login') : new Response(null, { status: 401 })

    const farm = await farmFor(Number(farmer.id))
    if (!farm?.id) {
      return wantsHtml(request)
        ? seeOther('/dashboard?e=noholding')
        : Response.json({ success: false, message: 'This account has no holding yet.' }, { status: 403 })
    }

    const result = await authoriseMove(
      farm.id,
      Number(request.getParam('id') ?? request.get('id')),
      Number(farmer.id),
    )

    if (wantsHtml(request))
      return seeOther(result.ok ? '/dashboard/herding?ok=authorised' : '/dashboard/herding?e=authorise')

    if (!result.ok)
      return Response.json({ success: false, message: result.error }, { status: result.status ?? 409 })

    return Response.json({ data: result.move })
  },
})
