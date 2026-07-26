import { Action } from '@stacksjs/actions'
import { allUseCases, findFeature } from '../../Support/catalog'

/**
 * `GET /api/features/{slug}`
 *
 * One capability, with its related use cases resolved to full records so a
 * consumer does not have to make sixteen follow-up calls to render a page.
 */
export default new Action({
  name: 'FeatureShowAction',
  description: 'Show one capability and the operations it carries weight for',
  method: 'GET',

  async handle(request: RequestInstance) {
    const slug = String(request?.getParam?.('slug') ?? request?.get?.('slug') ?? '').replace(/[^a-z0-9-]/gi, '')
    const feature = await findFeature(slug)

    if (!feature)
      return { success: false, message: `No capability with the slug "${slug}"` }

    const useCases = await allUseCases()

    return {
      data: {
        ...feature,
        useCases: useCases
          .filter(u => feature.useCases.includes(u.slug))
          .map(u => ({ slug: u.slug, name: u.name, tagline: u.tagline, summary: u.summary })),
      },
    }
  },
})
