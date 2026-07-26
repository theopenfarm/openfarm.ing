import { Action } from '@stacksjs/actions'
import { allUseCases, useCaseSegments } from '../../Support/catalog'

/**
 * `GET /api/use-cases`
 *
 * Every operation the platform is set up for, grouped by segment.
 */
export default new Action({
  name: 'UseCaseIndexAction',
  description: 'List every operation the platform is set up for',
  method: 'GET',

  async handle(request: RequestInstance) {
    const segment = String(request?.get?.('segment') || '').trim()
    const useCases = await allUseCases()

    const filtered = segment
      ? useCases.filter(u => u.segment === segment)
      : useCases

    return {
      segments: Object.entries(useCaseSegments).map(([key, meta]) => ({ key, ...meta })),
      count: filtered.length,
      data: filtered,
    }
  },
})
