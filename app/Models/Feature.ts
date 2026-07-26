import { defineModel } from '@stacksjs/orm'
import { schema } from '@stacksjs/validation'

/**
 * A platform capability, e.g. targeted weed control.
 *
 * Content is authored in `app/Support/content/features.ts` and written here by
 * `database/seeders/CatalogSeeder.ts`, so this table is the queryable copy the
 * API and the marketing pages read. The long-form fields (steps, sensors,
 * outputs) are JSON columns because they are ordered lists rendered as-is,
 * never queried across.
 */
export default defineModel({
  name: 'Feature',
  table: 'features',
  primaryKey: 'id',
  autoIncrement: true,

  traits: {
    useUuid: true,
    useTimestamps: true,
    useSearch: {
      displayable: ['id', 'name', 'category', 'tagline'],
      searchable: ['name', 'tagline', 'summary', 'problem'],
      sortable: ['sort_order', 'name'],
      filterable: ['category'],
    },
    // No `useApi`: the public catalog is served by hand-written actions in
    // app/Actions/Catalog. The generated resource routes address records by
    // numeric id, which would shadow the slug-addressed `/api/features/{slug}`
    // this content is actually published under, and the generated show
    // response cannot resolve the cross-references the site needs.
  },

  attributes: {
    slug: {
      required: true,
      unique: true,
      order: 1,
      fillable: true,
      validation: {
        rule: schema.string().min(2).max(80),
        message: { min: 'A slug needs at least 2 characters' },
      },
      factory: faker => faker.lorem.slug(),
    },

    name: {
      required: true,
      order: 2,
      fillable: true,
      validation: { rule: schema.string().min(2).max(120) },
      factory: faker => faker.lorem.words(3),
    },

    category: {
      required: true,
      order: 3,
      fillable: true,
      validation: {
        rule: schema.enum(['detect', 'act', 'operate']),
        message: { enum: 'Category must be detect, act or operate' },
      },
      factory: () => 'detect',
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

    problem: {
      required: true,
      order: 6,
      fillable: true,
      validation: { rule: schema.string().max(2000) },
      factory: faker => faker.lorem.paragraph(),
    },

    /** Ordered [{ title, text }]. */
    steps: {
      required: false,
      order: 7,
      fillable: true,
      validation: { rule: schema.string().max(4000) },
      factory: () => '[]',
    },

    /** Instruments carried for this job. String array. */
    sensors: {
      required: false,
      order: 8,
      fillable: true,
      validation: { rule: schema.string().max(1000) },
      factory: () => '[]',
    },

    /** What the farmer receives afterwards. String array. */
    outputs: {
      required: false,
      order: 9,
      fillable: true,
      validation: { rule: schema.string().max(1000) },
      factory: () => '[]',
    },

    /** Dashboard measurements this capability produces. String array. */
    readings: {
      required: false,
      order: 10,
      fillable: true,
      validation: { rule: schema.string().max(1000) },
      factory: () => '[]',
    },

    cadence: {
      required: false,
      order: 11,
      fillable: true,
      validation: { rule: schema.string().max(300) },
      factory: faker => faker.lorem.sentence(),
    },

    /** Use case slugs this capability carries most weight for. String array. */
    use_case_slugs: {
      required: false,
      order: 12,
      fillable: true,
      validation: { rule: schema.string().max(1000) },
      factory: () => '[]',
    },

    sort_order: {
      required: false,
      order: 13,
      fillable: true,
      default: 0,
      validation: { rule: schema.number() },
      factory: () => 0,
    },
  },
})
