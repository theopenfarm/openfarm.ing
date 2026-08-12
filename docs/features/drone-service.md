# Flights as a service

> Book the flights, not the aircraft

You book a scouting schedule and get analysis and recommendations. We own the
drones, the pilots and the paperwork.

| | |
|---|---|
| Category | Operate |
| Slug | `drone-service` |
| Cadence | Set once per crop and adjusted as the season moves |
| Payload | Whatever the booked capability requires |
| Needs a visit first | No. The visit is the first step of the service |

## The problem

Buying a drone means buying a training course, an operator registration, an
insurance policy, a maintenance schedule and the risk that the model is
obsolete in three seasons. Most farms want the map, not the aircraft, and the
aircraft sits in a shed between the six weeks a year it earns anything.

## How it works

| Step | What happens |
|---|---|
| Scope | We walk your blocks, agree which capabilities matter and set the flight calendar around your crop |
| Fly | Our pilots fly the schedule. Registration, insurance, airspace clearance and maintenance are ours |
| Report | Each flight produces a report with problem areas, recommendations and the maps your machines can load |
| Review | We sit down at the end of the season with what the data showed and what to change next year |

## What you get

- Flight calendar
- Report per flight
- Machine ready prescriptions
- End of season review

## What the dashboard measures

- Flights completed against scheduled
- Hectares covered
- Recommendations acted on
- Time from flight to report

## Where it matters most

Every use case. Most obviously
[winter wheat](/use-cases/arable#winter-wheat-and-barley),
[maize](/use-cases/arable#maize),
[vineyards](/use-cases/permanent#vineyards),
[orchards](/use-cases/permanent#orchards),
[contractors](/use-cases/operators#agricultural-contractors) and
[cooperatives](/use-cases/operators#cooperatives-and-large-estates).

## Build it

This is not a technical capability, it is the business. What follows is what it
actually costs to run one, because the hardware pages will otherwise flatter
you.

### The costs that are not the drone

| Item | Indicative, EU | Notes |
|---|---|---|
| Operator registration | €20 to €50 per year | Via the national aviation authority. In Germany, the LBA |
| Remote pilot competence | Free to €300 | Open category A1/A3 online, A2 certificate at a recognised entity |
| Specific category authorisation | €500 to €5,000 in preparation time | Needed for BVLOS, docks, over-25 kg, or automated launch |
| Liability insurance | €300 to €1,500 per year | Mandatory in Germany for UAS. Cover scales with mass and operation |
| Maintenance and spares | 10 to 20% of airframe cost per year | Props, motors, batteries, arms |
| Battery replacement | Every 150 to 300 cycles | The real consumable |
| Vehicle and travel | Substantial | See below |
| Processing compute | €150 to €600 per month | One GPU box or its cloud equivalent |
| Software | Near zero, if built in house | This is the whole argument. See [Build](/build/) |

### Travel is the business model

A pilot in a van covers 3 to 6 farms a day if they are clustered and 1 to 2 if
they are not. Everything about the unit economics follows from that number:
route density beats aircraft capability, a customer 40 minutes away is worth
less than one 10 minutes away, and it is why
[the autonomous network](/features/autonomous-network) exists.

Sell **clusters**. Sign the Maschinenring, the cooperative or the three
neighbours together, and the day rate divides across all of them.

### Pricing shapes that work

| Shape | Fits |
|---|---|
| Per hectare per flight | Simple, easy to compare, punishes small awkward fields |
| Seasonal subscription per hectare | Predictable for both sides. The one to aim for |
| Per morning | Wildlife searches, where the constraint is a two-hour window |
| Per site visit plus per hectare | Seeding and anything needing equipment on site |
| Per report | Reporting and the field assistant, where no flight happened |

Publish which capabilities are included at each tier and keep the dashboard's
capability list as the contract. The console already shows all 18 whether or
not the farm has switched them on, so the upgrade path is visible without a
sales call.

### The service software you have to build

| Piece | Why | Where it lives |
|---|---|---|
| Capability subscriptions with a cadence | The standing instruction | `FarmCapability` in this repo |
| Scheduler | Turns cadence into planned flights | `app/Jobs/ScheduleCapabilityFlights.ts` |
| Weather gating | Cancels and reschedules rather than failing | Extend the scheduler |
| Route planning across customers | The travel problem, as an optimisation | To build |
| Pilot app | Checklists, logs, the flight record | To build |
| Report generation | One document per flight, generated not written | Extend the catalog layer |
| Customer console | What the farm sees | `/dashboard` in this repo |

The first, second and last already exist in this repository. See
[The farmer console](/guide/dashboard).

### Cost efficiency

- **Own the software, rent nothing per hectare.** Commercial processing and
  analytics platforms charge per hectare per year, which turns your best
  customers into your biggest cost line. Every hectare processed on your own
  box costs the electricity.
- **Buy one boring aircraft first.** An integrated commercial multirotor with a
  calibrated multispectral payload gets you flying paid work in weeks. Build
  custom airframes when a specific capability needs something the market does
  not sell.
- **Insurance and registration before the first paid flight.** Not negotiable,
  and cheap relative to the exposure.
- **Charge for the season, deliver the flights.** A subscription smooths the
  six weeks of intensity into twelve months of revenue and is what makes the
  fleet financeable.
