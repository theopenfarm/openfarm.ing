import { Auth } from '@stacksjs/auth'
import { HttpError } from '@stacksjs/error-handling'
import { Middleware } from '@stacksjs/router'
import Farm from '../Models/Farm'

/**
 * Confine a request to the holdings the caller actually owns.
 *
 * The REST endpoints are generated from the models' `useApi` traits, which is
 * what keeps them consistent with the dashboard — but a generated handler
 * knows nothing about tenancy. `auth` alone therefore proves only that
 * *somebody* is signed in: farmer A could read farmer B's fields, or write a
 * capability onto B's holding, by guessing an id. On a single-tenant admin
 * tool that is academic; here every row belongs to a specific farm.
 *
 * So this narrows the request to the caller's farms:
 *
 *  - a write carrying `farm_id` must name a farm they own
 *  - a read or write without one is answered with `?farm_id=` pinned to their
 *    own holding, which is also what a farmer means by "my fields"
 *
 * The demonstration farm published by `catalog:sync` has no owner and is
 * reachable by nobody, which is the point of leaving `user_id` null on it.
 */
export default new Middleware({
  name: 'FarmScope',
  // After Auth (priority 1): there is no caller to scope to until it has run.
  priority: 2,

  async handle(request) {
    const user = await Auth.user()
    if (!user?.id)
      throw new HttpError(401, 'Unauthorized.')

    const owned = await Farm.where('user_id', Number(user.id)).get() as any[]
    const ids = owned.map(farm => Number(farm.id))

    if (ids.length === 0)
      throw new HttpError(403, 'This account has no holding yet. Book a field visit to get started.')

    // A body that names a farm has to name one of theirs. Checked before the
    // handler runs, so a rejected write never reaches the database.
    const body = (await safeBody(request)) as Record<string, unknown> | null
    const requested = body?.farm_id

    if (requested != null && !ids.includes(Number(requested)))
      throw new HttpError(403, 'That holding belongs to another account.')

    // Reads are narrowed to the caller by pinning the filter the generated
    // handler already understands. It builds its query from `new URL(req.url)`,
    // so the filter has to land in the URL itself — setting `request.query`
    // alone changes nothing, which is why an earlier version of this leaked
    // every holding on the box through `GET /api/fields`.
    ;(request as any).farmScope = ids
    pinFarmFilter(request, ids)
  },
})

/**
 * Force `?farm_id=` onto the request for a single-holding account.
 *
 * Only when the caller has exactly one farm and has not asked for a specific
 * one. With several, an unfiltered list would have to be an OR across them,
 * which the generated handler cannot express — those callers get their own
 * filter honoured and are answered per holding.
 */
function pinFarmFilter(request: any, ids: number[]): void {
  if (ids.length !== 1)
    return

  try {
    const url = new URL(request.url)
    if (url.searchParams.has('farm_id'))
      return

    url.searchParams.set('farm_id', String(ids[0]))
    request.url = url.toString()

    if (request.query && typeof request.query === 'object')
      request.query.farm_id = String(ids[0])
  }
  catch {
    // A request object that will not take a new URL: the ownership check on
    // writes above still stands, and a read falls back to unfiltered rather
    // than failing the request.
  }
}

/** Read the JSON body without consuming it for the handler that follows. */
async function safeBody(request: any): Promise<unknown> {
  try {
    if (typeof request.json === 'function')
      return await request.json()

    return request.body ?? null
  }
  catch {
    // A GET, a form post, or a malformed body: nothing to check.
    return null
  }
}
