import { defineModel } from '@stacksjs/orm'
import { schema } from '@stacksjs/validation'
import * as seed from '../Support/factories'

/**
 * A capability, switched on for a holding.
 *
 * The catalog (`app/Support/content/features.ts`) is what the marketing pages
 * sell: eighteen capabilities, each a flight with a particular sensor and a
 * particular thing the model is looking for. This is the other half of that —
 * the record of which of them a given farm has actually turned on, how often
 * it wants them flown, and over what.
 *
 * `field_id` is the scope. Null means the whole holding, which is the normal
 * case: a farmer who wants disease detection wants it everywhere. A row with a
 * field gets one crop watched more closely than the rest — a seed multiplier
 * block, a trial strip — without turning the capability on for land where it
 * would only produce noise.
 *
 * A capability that is merely `requested` has been asked for and not yet
 * scheduled: several of the eighteen need equipment on site (seeding, frost
 * protection) or a licence check before the first flight, and the dashboard
 * should say so rather than promise a flight that will not happen.
 */
export default defineModel({
  name: 'FarmCapability',
  table: 'farm_capabilities',
  primaryKey: 'id',
  autoIncrement: true,

  traits: {
    useUuid: true,
    useTimestamps: true,
    // The farmer's own changes are worth an event: enabling a capability is
    // what puts flights on the schedule.
    observe: true,
    useApi: {
      uri: 'farm-capabilities',
      routes: ['index', 'show', 'store', 'update', 'destroy'],
      // Never public: this is one customer's operating plan.
      middleware: ['auth', 'farm-scope'],
    },
  },

  belongsTo: ['Farm', 'Field'],

  attributes: {
    /*
     * The relation keys are declared so the API can set them.
     *
     * `belongsTo` alone gives the query side of a relation, not a writable
     * column: a POST carrying `farm_id` had it dropped and the row landed
     * unattached. FarmScope has already checked the caller owns the farm by
     * the time a handler reads these.
     */
    farm_id: {
      required: true,
      order: 0,
      fillable: true,
      validation: { rule: schema.number() },
    },

    /** Null means the whole holding, which is the usual case. */
    field_id: {
      required: false,
      order: 0,
      fillable: true,
      validation: { rule: schema.number() },
    },

    /** The catalog slug, e.g. `plant-disease-detection`. */
    feature_slug: {
      required: true,
      order: 1,
      fillable: true,
      validation: { rule: schema.string().min(2).max(80) },
      factory: faker => seed.capability(faker),
    },

    status: {
      required: true,
      order: 2,
      fillable: true,
      default: 'active',
      validation: { rule: schema.enum(['active', 'paused', 'requested']) },
      factory: () => 'active',
    },

    /**
     * How often the farmer wants it flown, in days.
     *
     * Days rather than a cron string because that is how the decision is
     * actually made ("every ten days through the risk window"), and because
     * the scheduler only has to compare it against the last flight.
     */
    cadence_days: {
      required: false,
      order: 3,
      fillable: true,
      default: 14,
      validation: { rule: schema.number().min(1).max(365) },
      factory: faker => faker.number.int({ min: 7, max: 30 }),
    },

    /** Paused capabilities keep their settings; this says why. */
    notes: {
      required: false,
      order: 4,
      fillable: true,
      validation: { rule: schema.string().max(500) },
      factory: () => '',
    },

    /**
     * When the scheduler last put a flight on for this capability.
     *
     * Stored rather than derived from the missions table: a capability can be
     * paused and resumed, and the next due date should follow the schedule,
     * not whatever flight happened to be flown for another reason.
     */
    last_scheduled_at: {
      required: false,
      order: 5,
      fillable: true,
      // A string for the same reason as `missions.flown_at`: the scheduler
      // writes `new Date().toISOString()` here, and `schema.date()` rejects
      // every datetime string, so this job failed on each nightly run.
      validation: { rule: schema.string().max(40) },
      factory: () => null,
    },
  },
})
