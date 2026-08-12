# Architecture

The repository is a Stacks application. It serves three surfaces from one
codebase: the marketing site, the farmer console, and the public API. All three
read the same data through one layer, which is the single most important
property of the design.

## The path a fact takes

```
app/Support/content/*.ts        authored content, the source of truth
        │
        │  buddy catalog:sync   truncates and rewrites
        ▼
database (features, use_cases, farms, fields, missions,
          detections, treatment_maps)
        │
        │  app/Support/catalog.ts   the one read layer
        ▼
   ┌────────────────┬────────────────────┐
   │ resources/views│ app/Actions/Catalog│
   │  (the site)    │   (the API)        │
   └────────────────┴────────────────────┘
```

Nothing renders a figure it typed itself. If `/features` and `/api/features`
ever disagree, that is a bug rather than a stale copy.

## What lives where

| Path | What lives there |
|---|---|
| `app/Support/content/` | Authored content: 18 capabilities, 16 use cases, and the demonstration field's generator |
| `app/Support/catalog.ts` | The shared read layer. Every page and every endpoint goes through it |
| `app/Support/capabilities.ts` | The bridge from the marketed catalog to what one holding has switched on |
| `app/Support/dashboard.ts` | The farmer's own holdings, scoped by `farms.user_id` |
| `app/Support/fieldmap.ts` | Renders a field to SVG, server side, from the flight record |
| `app/Models/` | Nine models: `Feature`, `UseCase`, the operational domain (`Farm`, `Field`, `Drone`, `Mission`, `Detection`, `TreatmentMap`, `FarmCapability`) and `DemoRequest` |
| `app/Actions/Catalog/` | The public read API |
| `app/Actions/Dashboard/` | The console's four writes |
| `app/Actions/Leads/` | The field-visit booking endpoint |
| `app/Commands/` | `catalog:sync`, `imagery:attach`, `demo:account`, `og:images` |
| `app/Jobs/ScheduleCapabilityFlights.ts` | Turns a standing cadence into flights that are due |
| `app/Middleware/FarmScope.ts` | Confines every generated REST call to the caller's own holdings |
| `resources/views/` | The site. `features/[slug].stx` and `use-cases/[slug].stx` render every detail page |
| `public/site.css` | Design tokens, and the CSS that utilities cannot express |
| `config/cloud.ts` | Deploy configuration: a tenant on the shared Stacks box |

## The domain model

Nine models, of which seven describe the operation.

```
Farm ──┬── Field ──┬── Mission ──┬── Detection
       │           │             └── TreatmentMap
       │           │
       ├── Drone ──┘
       └── FarmCapability
```

| Model | Holds | Notes |
|---|---|---|
| `Farm` | The holding: name, region, hectares, segment, `user_id` | The demonstration farm's `user_id` is null on purpose, so it appears on no dashboard |
| `Field` | The parcel: crop, hectares, boundary ring, latitude and longitude | `boundary` is a normalised 0..1 ring, not a projected polygon |
| `Drone` | The aircraft in the fleet | Which drone flies is decided at dispatch, not at planning |
| `Mission` | One flight: `purpose` (a feature slug), `status`, `flown_at`, `resolution_cm`, `duration_minutes`, and the orthomosaic fields | `status` is one of `scheduled`, `flying`, `processing`, `complete`, `weather_cancelled`, `failed` |
| `Detection` | One finding: `kind`, `label`, `x`, `y`, `area_m2`, `severity`, `confidence`, `status` | `kind` is one of `weed`, `disease`, `pest`, `nutrient`, `moisture`, `compaction`, `wildlife`, `gap`, `livestock` |
| `TreatmentMap` | The prescription: zone geometry and `treated_hectares` | The thing a sprayer actually loads |
| `FarmCapability` | A standing instruction: feature slug, `status`, `cadence_days`, optional `field_id` | `status` is `active`, `paused` or `requested` |

`Mission.purpose` carries a **feature slug**. That is what connects the
capability catalog on the marketing site to the flights that actually happened
over a field, with no join table in between.

### Denormalised keys are deliberate

`Mission.farm_id` and `Detection.field_id` are both derivable by joining. They
are stored anyway so a holding's flights and a field's findings are each one
query. The seeder fills a declared key that comes out empty from the parent it
points at.

## Multi-tenancy

Two separate mechanisms, because there are two separate surfaces.

**The console** never accepts a farm id from the request. Every dashboard read
re-derives the holding from the signed-in user through `farmFor(userId)`, and
every dashboard write does the same and ignores any farm the request names.
A request cannot name a holding, therefore it cannot name somebody else's.

**The generated REST endpoints**, which come from the models' `useApi` traits,
know nothing about tenancy on their own. `app/Middleware/FarmScope.ts` narrows
them: a write carrying `farm_id` must name a farm the caller owns, and a read
without one is answered with `?farm_id=` pinned to their own holding. An
account with no holding gets a 403 rather than an empty list, because an empty
list reads as "you have nothing" rather than "you have not started yet".

The demonstration farm is unowned, which is what keeps the worked example out
of somebody's real numbers.

## Scheduling

`app/Scheduler.ts` runs `ScheduleCapabilityFlights` daily at 05:30
Europe/Berlin. It converts each active `FarmCapability` into planned
`Mission` rows for the fields whose cadence has come round.

Three things it deliberately does not do:

- It does not schedule `requested` capabilities. Those need equipment on site
  or a licence check first, so a planned flight would be a promise the schedule
  cannot keep. See [Capabilities that need a visit](/guide/dashboard#capabilities-that-need-a-visit).
- It does not double-book. A field with an existing scheduled flight for the
  same capability is skipped, so a retry does not fill the calendar.
- It does not decide the aircraft.

Daily rather than hourly because cadences are measured in days.

## Failure posture

Every dashboard query is guarded individually with a `safely()` wrapper that
falls back rather than throwing. A dashboard that 500s because one panel's
table has not been migrated is worse than a dashboard with one empty panel.
The same reasoning applies in `catalog.ts`: an unseeded instance serves an
empty catalog rather than an error page.
