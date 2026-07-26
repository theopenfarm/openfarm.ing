import { Action } from '@stacksjs/actions'
import { allFeatures, findUseCase } from '../../Support/catalog'

/**
 * `GET /api/use-cases/{slug}`
 *
 * One operation, with its capabilities resolved in the order it lists them:
 * most load bearing first.
 */
export default new Action({
  name: 'UseCaseShowAction',
  description: 'Show one operation and the capabilities it leans on',
  method: 'GET',

  async handle(request: RequestInstance) {
    const slug = String(request?.getParam?.('slug') ?? request?.get?.('slug') ?? '').replace(/[^a-z0-9-]/gi, '')
    const useCase = await findUseCase(slug)

    if (!useCase)
      return { success: false, message: `No use case with the slug "${slug}"` }

    const features = await allFeatures()

    return {
      data: {
        ...useCase,
        features: useCase.features
          .flatMap((s) => {
            const f = features.find(feature => feature.slug === s)
            // A slug with no matching feature is dropped rather than emitted
            // as a null: the seeder already rejects that state, so if one gets
            // through, a consumer should see a shorter list, not a hole in it.
            return f ? [{ slug: f.slug, name: f.name, category: f.category, tagline: f.tagline, summary: f.summary }] : []
          }),
      },
    }
  },
})
