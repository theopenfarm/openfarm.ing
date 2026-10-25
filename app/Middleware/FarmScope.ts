import { Auth } from '@stacksjs/auth'
import { HttpError } from '@stacksjs/error-handling'
import { Middleware } from '@stacksjs/router'
import { holdingId, ownedFarmIds } from '../Support/farmer-ownership'

/** Check holding eligibility. Native model ownership confines the actual rows. */
export default new Middleware({
  name: 'FarmScope',
  priority: 2,

  async handle(request) {
    const user = await Auth.user()
    if (!user?.id)
      throw new HttpError(401, 'Unauthorized.')

    const ids = await ownedFarmIds(user)
    if (ids.length === 0)
      throw new HttpError(403, 'This account has no holding yet. Book a field visit to get started.')

    const url = new URL(request.url)
    const selectors = [...url.searchParams.getAll('farm_id'), ...url.searchParams.getAll('farmId')]
    if (selectors.length > 1)
      throw new HttpError(403, 'Choose one owned holding.')
    for (const value of selectors)
      requireOwnedHolding(value, ids)

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      // The native request caches parsed JSON for the Action that follows.
      const body: unknown = await request.json().catch(() => null)
      if (body && typeof body === 'object') {
        if ('farm_id' in body)
          requireOwnedHolding(body.farm_id, ids)
        if ('farmId' in body)
          requireOwnedHolding(body.farmId, ids)
      }
    }
  },
})

function requireOwnedHolding(value: unknown, ids: number[]): void {
  const id = holdingId(value)
  if (id === null || !ids.includes(id))
    throw new HttpError(403, 'Choose an owned holding.')
}
