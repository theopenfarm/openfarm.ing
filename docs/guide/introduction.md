# Introduction

Open Farming is autonomous drone scouting and targeted treatment for farms. A
drone flies a fixed route over a field, models locate what is actually wrong,
and the findings become a prescription the machine you already own can load.

The claim the product makes is narrow and testable: **most of a field does not
need most of what gets applied to it**. On the demonstration field, a 24.6
hectare block of winter wheat, 98 weed detections cluster into 62 treatment
zones, and the prescription switches the boom on over 4.34 hectares. The other
20.26 hectares are clean ground that would otherwise have been sprayed because
nobody knew which parts carried weeds.

## The shape of the product

Three things happen, in order, and the platform is organised around them.

| Stage | What it means | Capabilities |
|---|---|---|
| **Detect** | Sensing flights that find the problem while it is still small | [7 capabilities](/features/#detect) |
| **Act** | Treatment that follows the map, so only the affected ground is touched | [6 capabilities](/features/#act) |
| **Operate** | The service, the fleet and the reporting that keep it running | [5 capabilities](/features/#operate) |

A capability is a job the platform does. A [use case](/use-cases/) is the same
platform seen from the seat of one kind of operation: a wheat grower, a
vineyard, a dairy, a contractor. Use cases exist because the question a grower
asks is never "which capabilities do you have", it is "what does a season on my
crop look like".

## What the drone does and does not do

This matters more than any feature list, because it is where most drone
agriculture marketing stops being true.

In Germany and most of the EU, aerial application of plant protection products
is **prohibited by default**. In German law that is Pflanzenschutzgesetz §18,
with narrow exemptions, the most prominent being steep vineyard terrain where
ground machinery cannot work safely. There is no general permission to spray
arable land from a drone, whatever an aircraft's brochure implies.

So the honest product shape is:

> The drone finds it, and the machine that is already allowed to treat it does
> the treating.

The drone's output for a treatment job is a **prescription map**, in the format
your sprayer or spreader terminal expects. The section control on the boom you
already own is what opens and closes the nozzles. Where an exemption applies,
the same maps drive drone application directly. See
[Regulation](/build/regulation) for what that means in practice, and
[Prescriptions](/build/software/prescriptions) for how the file is written.

Two capabilities have a different legal footing worth knowing about up front:

- [Wildlife detection before mowing](/features/wildlife-rescue) is a search
  flight, not an application, and in Germany the duty to take reasonable
  precautions before mowing sits with whoever runs the mower. It is the single
  most defensible first flight most operations will make.
- [Drone seeding](/features/drone-seeding) broadcasts seed, not plant
  protection products, so §18 does not reach it. Aviation rules still do.

## The design principle behind the code

Every number on the marketing site is rendered from data, not typed into copy.

- `app/Support/content/features.ts` and `use-cases.ts` are the source of truth
  for capability and use case content.
- `app/Support/content/demo-field.ts` generates the demonstration field from a
  fixed-seed PRNG, with no `Date` and no `Math.random`, so it is identical on
  every machine.
- `buddy catalog:sync` publishes both into the database.
- Pages and the public API read that database through one shared layer,
  `app/Support/catalog.ts`.

The consequence is that `/features` and `/api/features` cannot disagree, and
the treated-hectare figure in the copy cannot drift away from the map that
draws it. If they ever diverge, that is a bug, not a stale copy.

It is **modelled** data rather than a customer's field, and the site says so
wherever it appears. `/api/field-report` carries `sample: true` in the payload
for the same reason.

## What this documentation covers

| Section | Contents |
|---|---|
| [Guide](/guide/quickstart) | Running, extending and deploying this repository |
| [Capabilities](/features/) | All 18, each with its sensors, cadence, readings, parts list and in-house software |
| [Use cases](/use-cases/) | All 16, grouped by segment, with the season each one is flown to |
| [Build](/build/) | Airframes, sensors, positioning, compute, docks, payloads, the software stack, costs, suppliers and regulation |

The build section exists because the interesting part of this business is not
the aircraft. Anyone can buy an aircraft. The interesting part is that the
software which turns imagery into a prescription is normally rented by the
hectare, and it does not have to be. Every build page names the open-source
component that replaces the licence, and is honest about what the replacement
costs you in engineering time.
