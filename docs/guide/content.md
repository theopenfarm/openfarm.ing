# Content model

All authored content lives in `app/Support/content/`. Three modules, each with
a documented shape, published into the database by `buddy catalog:sync`.

## features.ts

The capability catalog. 18 entries, each one a `FeatureContent`.

```ts
export interface FeatureContent {
  slug: string
  name: string
  category: 'detect' | 'act' | 'operate'
  /** One line, sentence case, used under the name in menus and cards. */
  tagline: string
  /** Under 25 words. Card body and meta description. */
  summary: string
  /** What it costs a farm today. Two or three sentences, concrete. */
  problem: string
  /** How the system does it. Three or four steps. */
  steps: { title: string, text: string }[]
  /** Instruments the flight actually carries for this job. */
  sensors: string[]
  /** What lands in the farmer's hands afterwards. */
  outputs: string[]
  /** How often this job is normally flown. */
  cadence: string
  /** Dashboard readings this capability produces. Measurements, not promises. */
  readings: string[]
  /** Use case slugs where this capability does the most work. */
  useCases: string[]
  /** Sort order inside its category. */
  order: number
}
```

Two fields deserve emphasis because they are what keeps the copy honest.

`readings` are **measurements, not promises**. "Treated area as a share of
field area" is a reading. "Save 70% on herbicide" is not, and does not belong
in this file. Every reading here is something the dashboard can actually
compute from a flight record.

`sensors` are the instruments the flight **actually carries**. Two capabilities
declare that they carry none:
[Sustainability reporting](/features/sustainability-dashboard) and
[Field decision assistant](/features/field-assistant) both say "no flight of
its own", because they consume other capabilities' output. Do not invent a
payload for a capability that does not fly.

Helpers: `featureBySlug(slug)`, `featuresByCategory(category)`, and the
`featureCategories` record that supplies each group's label and blurb.

## use-cases.ts

16 entries, each a `UseCaseContent`. A use case is deliberately **not** a
feature list. It answers three questions a grower asks before anything else:
what goes wrong on this crop, what the flight calendar looks like across a
season, and which capabilities carry the weight.

```ts
export interface UseCaseContent {
  slug: string
  name: string
  segment: 'arable' | 'permanent' | 'protected' | 'livestock' | 'operator'
  tagline: string
  summary: string
  /** What actually goes wrong on this crop or operation. */
  challenge: string
  /** How the platform is normally set up for it. */
  approach: string
  /** The flight calendar across a season. */
  season: { window: string, focus: string }[]
  /** Feature slugs, most load bearing first. */
  features: string[]
  /** What the operation gets out of it, stated as measurements. */
  outcomes: string[]
  /** Typical field or block size this is set up for. */
  scale: string
  order: number
}
```

`features` is ordered: most load bearing first. `UseCaseShowAction` resolves
them in exactly that order, so the ordering is visible to every consumer.

### The cross-reference rule

`features[].useCases` and `useCases[].features` both hold slugs of the other
file's entries. `catalog:sync` validates that **every** cross-reference
resolves before it writes anything. A rename in one file that is not mirrored
in the other fails the sync rather than silently producing a dead link.

`UseCaseShowAction` also drops an unresolvable slug rather than emitting a
null, so if one ever got through, a consumer would see a shorter list and not
a hole in it.

## demo-field.ts

The demonstration field: one farm, one field, one weed-mapping flight, its
detections, and the prescription that came out of it.

It is **generated rather than hand-listed**, because the interesting property
is the spatial structure. Weed pressure on a cereal field is not scattered
evenly. This module reproduces the three sources explicitly:

| Source | Count | Shape |
|---|---|---|
| Headland band | 34 detections | A ring inside the boundary, heaviest on the two short ends where the sprayer turns |
| Tramline corridors | 36 detections | Four narrow lanes at x = 0.24, 0.42, 0.61, 0.79, running the length of the field |
| Established patches | 28 detections | Two elliptical clusters, the kind that come back in the same place |

Generation is deterministic: a fixed-seed mulberry32 PRNG, no `Date`, no
`Math.random`. Seed `20260726`. The same field comes out on every machine, so
the seeded database, the API and the rendered SVG always agree, and a reseed
never silently changes a figure quoted in the copy.

### The published figures

| Figure | Value |
|---|---|
| Field | Lindenbach Nord, winter wheat, 24.6 ha |
| Farm | Hofgut Lindenbach, Niederbayern, 268 ha |
| Detections | 98 |
| Species | Blackgrass 38, Chickweed 25, Cleavers 23, Charlock 12 |
| Severity | 50 low, 36 medium, 12 high |
| Treatment zones | 62 |
| Treated area | 4.34 ha, 17.6% of the field |
| Prescribed rates | 110, 140 and 180 l/ha by zone weight |

### How the prescription is derived

`demoZones()` is deliberately the same logic the product describes on the
feature page:

1. Detections are binned onto a 16 by 22 grid.
2. A cell whose total weed area reaches 150 m² is switched on. Below that,
   opening the nozzle is not justified.
3. Each live cell gets a rate by weight: over 1,400 m² takes the full 180 l/ha,
   over 600 m² takes 140, the rest take 110.

The grid is coarse on purpose. It is what a boom's section control can actually
resolve, so a prescription finer than that would be a map no machine could
follow. See [Prescriptions](/build/software/prescriptions) for the production
version of this step.

The boundary (`DEMO_BOUNDARY`) is a nine-point ring rather than a rectangle,
because a real block has a kink where it follows a track and a corner taken out
by a copse.

## Making a content edit

1. Edit the module in `app/Support/content/`.
2. Run `./buddy catalog:sync`.
3. If you added a feature or a use case, add the cross-references on **both**
   sides, or the sync will refuse.
4. If you added a capability, add a page under `docs/features/` too. The
   dashboard lists every marketed capability whether or not a farm has switched
   it on, so an undocumented one becomes visible immediately.

A deploy runs `catalog:sync` automatically, so content edits ship with the
code and need no separate step.
