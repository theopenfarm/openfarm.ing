# Costs

Four complete build tiers, their running costs, and the arithmetic that turns
them into a price per hectare.

Every figure is an indicative 2026 estimate in euro, with US prices broadly
similar in dollars. Check the current vendor price before you quote anything.
See [Suppliers](/build/suppliers) for where to buy each line.

## Tier 0: prove the pipeline

No aircraft. The goal is to produce a prescription file that a real terminal
accepts, from somebody else's imagery.

| Item | Cost |
|---|---|
| Used workstation, 64 GB RAM, one used GPU | €1,200 to €2,500 |
| Storage, 4 TB NVMe plus 8 TB spinning | €400 |
| Rented flights or a public dataset | €0 to €800 |
| Software | €0 |
| **Total** | **€1,600 to €3,700** |

If you cannot get from frames to a file a sprayer loads, no aircraft will help.
This tier is where most of the risk is retired.

## Tier 1: one capability, earning

The [wildlife search](/features/wildlife-rescue) build, which is the cheapest
route to paid work, or the [field mapping](/features/field-mapping) build,
which is the base layer everything else needs.

| Item | Wildlife | Mapping |
|---|---|---|
| Class B airframe, complete | €2,200 | €2,200 |
| Sensor | 640 x 512 radiometric thermal, €2,500 to €6,000 | 24 MP APS-C used plus lens, €500 to €900 |
| RTK receiver | not needed | €250 |
| Corrections | not needed | €0 to €500/yr |
| Green anti-collision light | €60 | not needed |
| LTE link for live finds | €200 | not needed |
| On-board compute | €150 | not needed |
| Cases, spares, charger | €700 | €700 |
| Registration, training, insurance, first year | €700 | €700 |
| Processing box (from Tier 0) | reuse | reuse |
| **Total** | **€6,500 to €10,000** | **€4,350 to €5,250** |

Both assume the Tier 0 processing box already exists.

## Tier 2: full survey operator

Everything the [detect](/features/#detect) capabilities need, plus a spare
aircraft so a failure does not cancel a morning.

| Item | Cost |
|---|---|
| Integrated multispectral aircraft, e.g. Mavic 3M class | €5,000 to €7,000 |
| Self-built class B aircraft, high resolution RGB | €3,000 to €5,000 |
| Radiometric thermal payload, 640 x 512 | €3,000 to €6,000 |
| RTK receivers and antennas, two aircraft | €600 |
| Survey receiver for checkpoints | €0 to €3,000 |
| Batteries, 8 packs | €2,000 to €3,200 |
| Chargers, generator, cases | €1,500 |
| Calibration kit: panel, references, probes | €500 |
| Ground station: rugged tablet, radios, LTE | €1,500 |
| Processing box, new rather than used | €3,000 to €6,000 |
| Storage, 30 TB warm | €800 |
| Vehicle fit-out | €1,000 |
| Registration, A2 certificate, insurance, first year | €1,500 |
| **Total** | **€23,400 to €37,600** |

This covers 15 of the 18 capabilities. The three it does not are
[seeding](/features/drone-seeding),
[pollination](/features/pollination-support) and unattended operation.

## Tier 3: one dock station

Per station, on top of Tier 2.

| Item | Turnkey | DIY |
|---|---|---|
| Dock | €15,000 to €35,000 with aircraft | €2,000 to €6,000 |
| Dedicated aircraft | included | €4,000 to €8,000 |
| Site works: power, mounting, groundwork | €500 to €3,000 | €500 to €3,000 |
| Connectivity, first year | €300 | €300 |
| Specific category authorisation, prepared | €500 to €5,000 in time | €2,000 to €10,000 in time |
| **Total per station** | **€16,300 to €43,300** | **€8,800 to €27,300** |

The authorisation is the line that varies most, and the one people leave out.
See [Regulation](/build/regulation).

## Running costs, per year

For a Tier 2 operator flying roughly 3,000 to 6,000 hectares a season.

| Item | Cost |
|---|---|
| Batteries, replaced on cycle life | €1,000 to €2,500 |
| Propellers and consumables | €300 to €800 |
| Motors, amortised | €400 |
| Insurance | €500 to €1,500 |
| Operator registration | €20 to €50 |
| Recurrent training | €0 to €500 |
| RTK corrections | €0 to €1,000 |
| Connectivity | €300 to €700 |
| Electricity for processing | €200 to €600 |
| Storage growth | €300 to €800 |
| Vehicle and fuel | €3,000 to €8,000 |
| Software licences | **€0** |
| **Total** | **€6,000 to €16,900** |

Now the same operator on rented processing and analytics, at a typical
per-hectare per-year platform rate:

| Hectares under management | Added licence cost |
|---|---|
| 1,000 | €2,000 to €5,000 |
| 5,000 | €10,000 to €25,000 |
| 20,000 | €40,000 to €100,000 |

That line is why this documentation exists. It scales with your success, it
never stops, and the one-off engineering cost that replaces it does not.

## Cost per hectare

The number that decides the business. Take a Tier 2 operator:

| Input | Value |
|---|---|
| Capital, amortised over 3 years | €30,000 / 3 = €10,000/yr |
| Running costs | €10,000/yr |
| Pilot, one full-time equivalent | €45,000 to €65,000/yr |
| **Total annual cost** | **€65,000 to €85,000** |

| Hectares flown per year | Cost per hectare per flight |
|---|---|
| 3,000 | €22 to €28 |
| 8,000 | €8 to €11 |
| 15,000 | €4.30 to €5.70 |
| 30,000 | €2.20 to €2.80 |

Two things fall out of that table immediately.

**Volume is everything, and volume means route density.** A pilot in a van
covers 3 to 6 farms a day if they are clustered and 1 to 2 if they are not. The
same aircraft, the same software, the same pilot: the difference is entirely
travel. Sell clusters. See
[flights as a service](/features/drone-service#travel-is-the-business-model).

**Docks change the shape, not just the scale.** A dock removes the pilot from
the per-flight cost and replaces it with capital and a supervision fraction.
That only pays above a certain flight frequency, which is why
[the network](/features/autonomous-network) is a later capability and why
[daily livestock patrols](/use-cases/livestock#dairy-and-grazing-livestock) are
its best first customer.

## What a customer pays

For context, not as a recommendation. Prices vary widely by market and by what
is included.

| Product | Typical shape |
|---|---|
| Scouting subscription | Per hectare per season, tiered by cadence and capability |
| One-off mapping flight | Per hectare with a site minimum |
| Wildlife search | Per morning, or per hectare with a minimum |
| Prescription export | Included in the subscription, or per field |
| Reporting and the assistant | Per holding per year |

The rule that matters: **price the constraint.** For wildlife searches the
constraint is a two-hour window, so price the morning. For scouting the
constraint is travel, so price the cluster. For reporting there is no flight at
all, so price the holding.

## The three ways this goes wrong financially

1. **Rented software at scale.** Covered above. It is the big one.
2. **Underpriced small fields.** A 3 hectare parcel costs almost as much to
   visit as a 30 hectare one. Have a site minimum, always.
3. **Unlogged batteries.** Battery replacement is the largest consumable and it
   is invisible until a pack swells in April. Log cycles per pack from day one
   and retire at 80% capacity.
