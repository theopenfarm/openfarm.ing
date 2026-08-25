import { Action } from '@stacksjs/actions'
import { farmFor } from '../../Support/dashboard'
import { movesFor } from '../../Support/herding/moves'
import { userFromRequest } from '../../Support/session'

/**
 * `GET /api/herding`
 *
 * Every move on the caller's holding, newest first, each with the envelope it
 * was authorised under and what actually happened against it.
 *
 * The welfare record is the product here as much as the move is. A farmer, and
 * in principle a regulator, has to be able to read back how hard a drone
 * pushed their animals and under what agreement, so the envelope and the
 * outcome are served together rather than the outcome alone.
 */
export default new Action({
  name: 'HerdingIndexAction',
  description: 'The herding move log for the farmer’s holding',
  method: 'GET',

  async handle(request: RequestInstance) {
    const farmer = await userFromRequest(request as unknown as { headers: Headers })
    if (!farmer?.id)
      return new Response(null, { status: 401 })

    const farm = await farmFor(Number(farmer.id))
    if (!farm?.id)
      return Response.json({ success: false, message: 'This account has no holding yet.' }, { status: 403 })

    const moves = await movesFor(farm.id)

    return { data: moves, count: moves.length }
  },
})
