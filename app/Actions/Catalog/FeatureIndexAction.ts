import { Action } from '@stacksjs/actions'
import { allFeatures, featureCategories } from '../../Support/catalog'

/**
 * `GET /api/features`
 *
 * The capability catalog, grouped the same way the site groups it. Public and
 * unauthenticated on purpose: it is the same content the marketing pages
 * render, so there is nothing here worth gating, and publishing it means the
 * site and the API cannot drift.
 */
export default new Action({
  name: 'FeatureIndexAction',
  description: 'List every capability in the catalog',
  method: 'GET',

  async handle(request: RequestInstance) {
    const category = String(request?.get?.('category') || '').trim()
    const features = await allFeatures()

    const filtered = category
      ? features.filter(f => f.category === category)
      : features

    return {
      categories: Object.entries(featureCategories).map(([key, meta]) => ({ key, ...meta })),
      count: filtered.length,
      data: filtered,
    }
  },
})
