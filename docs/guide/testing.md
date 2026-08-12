# Testing

```bash
./buddy test
```

## What is covered

| File | Covers |
|---|---|
| `tests/unit/catalog.test.ts` | The content modules and the read layer: cross-references resolve, groups are ordered, slugs are unique |
| `tests/unit/capabilities.test.ts` | The catalog-to-holding bridge: statuses, cadence, `nextDue`, `requiresVisit` |
| `tests/unit/fieldmap.test.ts` | The SVG renderer, including the imagery layer and the switch |
| `tests/unit/factories.test.ts` | The model factories the seeder uses |
| `tests/unit/share-cards.test.ts` | Open Graph card generation |
| `tests/unit/app.test.ts` | Application-level smoke checks |
| `tests/dependency-commits.test.ts` | Dependency hygiene |

## What is worth testing here

The tests that earn their place in this codebase are the ones that protect a
published number or a published contract.

**Cross-references.** `features[].useCases` and `useCases[].features` point at
each other by slug. A test that walks both directions catches a rename before
`catalog:sync` refuses it in production.

**Determinism.** The demonstration field is generated from a fixed seed with no
`Date` and no `Math.random`. A test that asserts 98 detections, 62 zones and
4.34 treated hectares is what stops an innocent-looking change to the generator
from quietly rewriting a figure that appears in the marketing copy.

**Renderer invariants.** The field map has a small number of properties that
matter more than its exact output: everything above the boundary is clipped to
it, a zero-area or inverted imagery footprint draws nothing, and
`renderFieldMapSwitch` with no imagery returns exactly `renderFieldMap`. Assert
those rather than the whole SVG string, which changes for cosmetic reasons.

**Tenancy.** Every dashboard read and write re-derives the holding from the
signed-in user. A test that a write naming another farm is ignored is worth
more than any number of view tests.

## Writing a test

```ts
import { describe, expect, it } from 'bun:test'
import { features, featuresByCategory } from '../../app/Support/content/features'

describe('features', () => {
  it('has a unique slug per capability', () => {
    const slugs = features.map(f => f.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('orders each category', () => {
    const act = featuresByCategory('act')
    expect(act.map(f => f.order)).toEqual([...act.map(f => f.order)].sort((a, b) => a - b))
  })
})
```

## Before you push

```bash
bunx --bun pickier .
```

```bash
bun run typecheck:app
```

```bash
./buddy test
```

CI runs all three and gates the deploy on them.
