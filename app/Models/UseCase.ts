import { defineModel } from '@stacksjs/orm'
import { schema } from '@stacksjs/validation'

/**
 * One kind of farming operation, seen end to end: what goes wrong on it, the
 * flight calendar across a season, and which capabilities carry the weight.
 *
 * Authored in `app/Support/content/use-cases.ts`; seeded from there.
 */
export default defineModel({
  name: 'UseCase',
  table: 'use_cases',
  primaryKey: 'id',
  autoIncrement: true,

  traits: {
    useUuid: true,
    useTimestamps: true,
    useSearch: {
      displayable: ['id', 'name', 'segment', 'tagline'],
      searchable: ['name', 'tagline', 'summary', 'challenge'],
      sortable: ['sort_order', 'name'],
      filterable: ['segment'],
    },
    useApi: {
      uri: 'use-cases',
      routes: ['index', 'show'],
    },
  },

  attributes: {
    slug: {
      required: true,
      unique: true,
      order: 1,
      fillable: true,
      validation: { rule: schema.string().min(2).max(80) },
      factory: faker => faker.lorem.slug(),
    },

    name: {
      required: true,
      order: 2,
      fillable: true,
      validation: { rule: schema.string().min(2).max(120) },
      factory: faker => faker.lorem.words(2),
    },

    segment: {
      required: true,
      order: 3,
      fillable: true,
      validation: {
        rule: schema.enum(['arable', 'permanent', 'protected', 'livestock', 'operator']),
        message: { enum: 'Segment must be arable, permanent, protected, livestock or operator' },
      },
      factory: () => 'arable',
    },

    tagline: {
      required: true,
      order: 4,
      fillable: true,
      validation: { rule: schema.string().max(160) },
      factory: faker => faker.lorem.sentence(),
    },

    summary: {
      required: true,
      order: 5,
      fillable: true,
      validation: { rule: schema.string().max(400) },
      factory: faker => faker.lorem.sentence(),
    },

    challenge: {
      required: true,
      order: 6,
      fillable: true,
      validation: { rule: schema.string().max(2000) },
      factory: faker => faker.lorem.paragraph(),
    },

    approach: {
      required: true,
      order: 7,
      fillable: true,
      validation: { rule: schema.string().max(2000) },
      factory: faker => faker.lorem.paragraph(),
    },

    /** Ordered [{ window, focus }] across a season. */
    season: {
      required: false,
      order: 8,
      fillable: true,
      validation: { rule: schema.string().max(4000) },
      factory: () => '[]',
    },

    /** Feature slugs, most load bearing first. String array. */
    feature_slugs: {
      required: false,
      order: 9,
      fillable: true,
      validation: { rule: schema.string().max(1000) },
      factory: () => '[]',
    },

    /** What the operation gets, stated as measurements. String array. */
    outcomes: {
      required: false,
      order: 10,
      fillable: true,
      validation: { rule: schema.string().max(2000) },
      factory: () => '[]',
    },

    scale: {
      required: false,
      order: 11,
      fillable: true,
      validation: { rule: schema.string().max(300) },
      factory: faker => faker.lorem.sentence(),
    },

    sort_order: {
      required: false,
      order: 12,
      fillable: true,
      default: 0,
      validation: { rule: schema.number() },
      factory: () => 0,
    },
  },
})
