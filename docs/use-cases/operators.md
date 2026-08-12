# Operators

Contractors, cooperatives and restoration projects running many holdings at
once.

## Agricultural contractors

> A service you can resell by the hectare

Add scouting, wildlife searches and prescription maps to the work you already
do, without buying a fleet.

**The challenge.** A contractor already owns the machines, the operators and
the customer relationships. What they do not own is a reason for the customer
to pay for anything beyond the pass itself. Meanwhile the mowing they do on
contract carries the wildlife obligation, and the spraying they do is applied
flat because the customer has no map. Both are liabilities that could be
services.

**The approach.** Contractors run the flights as part of the job: a wildlife
search flown before the mower goes in, a weed map before the sprayer, and a
prescription that loads straight into the machine already on the yard. The
reports carry the contractor's name and become the record the customer keeps.

| Window | Focus |
|---|---|
| Spring | Wildlife searches ahead of every first cut on the books |
| Herbicide season | Weed maps and prescriptions ahead of each spraying job |
| Fertiliser season | Variable rate prescriptions for the spreading work |
| Harvest | Yield estimates that set the trailer and haulage plan per customer |
| Winter | Season reviews per customer and next year's flight calendar |

**Capabilities:** [service](/features/drone-service),
[wildlife](/features/wildlife-rescue),
[weed control](/features/targeted-weed-control),
[fertilisation](/features/precision-fertilisation),
[network](/features/autonomous-network),
[reporting](/features/sustainability-dashboard).

**Outcomes.** Search and treatment records held per customer and per field.
Prescriptions delivered in the format the customer's terminal expects. Hectares
flown tracked against hectares worked. A billable service attached to passes
that were previously flat rate.

**Scale.** Portfolios of 500 to 5,000 hectares across many holdings.

**Why contractors are the best channel.** They already solve the travel problem
that makes [flights as a service](/features/drone-service#travel-is-the-business-model)
hard: the van is going to the field anyway. A contractor with 40 customers is
40 farms reached with one relationship, one invoice run and one training
programme.

---

## Cooperatives and large estates

> One picture across every member holding

Fleet coverage across scattered blocks, comparable numbers between holdings,
and reporting that rolls up cleanly.

**The challenge.** A cooperative or a large estate has the same problem
repeated dozens of times, plus one of its own: nothing is comparable. Each
holding records differently, applies differently and reports differently, so an
aggregate figure is either unavailable or not defensible. The blocks are
scattered, which makes a pilot in a van an expensive way to cover them.

**The approach.** Docked aircraft placed to cover clusters of blocks, flying a
schedule instead of a route driven by travel time. Every holding is measured
the same way, so member comparison and benchmarking are meaningful. Reporting
rolls up from field to holding to enterprise with the source flight still
attached to each figure.

| Window | Focus |
|---|---|
| Planning | Base mapping across every member block and a shared field register |
| Growing season | Scheduled coverage from docks, with a published weekly calendar |
| Treatment windows | Prescriptions distributed to each holding's machines |
| Pre harvest | Yield estimates aggregated for the marketing and logistics plan |
| Year end | Input, water and treated area reporting rolled up with evidence |

**Capabilities:** [network](/features/autonomous-network),
[service](/features/drone-service),
[reporting](/features/sustainability-dashboard),
[assistant](/features/field-assistant),
[fertilisation](/features/precision-fertilisation),
[yield](/features/yield-forecasting).

**Outcomes.** Every holding measured the same way, so comparison means
something. Coverage set by schedule rather than by driving distance. Aggregate
reporting with the source flight attached to each figure. Marketing and
logistics planned from estimates that update weekly.

**Scale.** 2,000 to 40,000 hectares across scattered member blocks.

**Build note.** Comparability is a data model problem before it is a flying
problem. One field register, one set of units, one derivation for every figure,
across every member. See
[sustainability reporting](/features/sustainability-dashboard#the-architecture-that-makes-it-work).

---

## Reforestation and land restoration

> Plant the slope nobody can walk

Terrain mapping, seed pod broadcast onto ground machines cannot reach, and
establishment counts that prove it worked.

**The challenge.** Restoration work happens on exactly the ground that is
hardest to work: steep slopes, burnt or storm damaged stands, wet ground and
sites with no access track. Hand planting is slow and dangerous there. And once
seed is in, the follow-up question, whether anything actually established, is
usually answered by a walk over a small sample and a hopeful extrapolation.

**The approach.** A terrain survey first, so the planting plan follows slope,
aspect and drainage rather than a shape on a map. Seed pods are broadcast at a
controlled rate over the areas machines cannot reach. Establishment flights at
fixed intervals count what came up, and the gaps become the next broadcast's
target area.

| Window | Focus |
|---|---|
| Survey | Terrain model, slope and aspect analysis, and the planting plan |
| Broadcast | Seed pod application at the planned rate, with an as-applied coverage map |
| Six weeks | First establishment count and the gap map |
| End of season | Survival count and the target area for the follow-up broadcast |
| Following years | Annual canopy development tracking against the restoration plan |

**Capabilities:** [seeding](/features/drone-seeding),
[field mapping](/features/field-mapping),
[yield](/features/yield-forecasting),
[reporting](/features/sustainability-dashboard).

**Outcomes.** Planting planned against measured slope, aspect and drainage.
As-applied coverage recorded for every broadcast. Establishment and survival
counted at fixed intervals. Follow-up broadcasts targeted at mapped gaps.

**Scale.** Sites of 1 to 500 hectares, including terrain with no vehicle
access.

**Build note.** Restoration sites are usually far from mobile coverage and
often in terrain with poor GNSS geometry. Plan for offline operation: local
correction source or accepting standard GNSS accuracy, on-board logging with no
live link, and processing after the fact. Also expect protected area rules,
which frequently restrict flying over habitat during breeding seasons, exactly
when restoration work happens.

## The funding conversation

Restoration is usually funded by a scheme, a compensation obligation or a
public programme rather than by a farm's own margin. That changes what the
customer needs: **evidence** that the specified area was treated at the
specified rate and that establishment reached the specified threshold. The
as-applied coverage map and the counted establishment flight are the product.
The flying is how you produce them.
