# Sustainability reporting

> The paperwork writes itself from the flights

Flight data, weather, soil and machine records combine into the input and water
figures your buyers and schemes ask for.

| | |
|---|---|
| Category | Operate |
| Slug | `sustainability-dashboard` |
| Cadence | Continuous, with reporting periods you define |
| Payload | **No flight of its own.** It consumes every other capability's output |
| Needs a visit first | No |

## The problem

Reporting obligations keep growing while the underlying numbers still live in a
spray diary, a fuel receipt and somebody's memory. Assembling a defensible
figure for product use or water per hectare takes days, and the result is hard
to audit because the evidence is scattered.

## How it works

| Step | What happens |
|---|---|
| Collect | Every flight, prescription and as applied record is captured at the moment it happens |
| Reconcile | Planned against applied is reconciled per field, so the numbers reflect what went on, not what was ordered |
| Aggregate | Field figures roll up to block, farm and enterprise level with the flight evidence still attached |
| Export | Reports export in the formats schemes and buyers accept, with the source data one click away |

## What you get

- Input use per hectare and per tonne
- Water applied per irrigated hectare
- Treated area versus total area
- Audit trail per figure

## What the dashboard measures

- Product applied per hectare
- Share of field treated
- Water per irrigated hectare
- Records with complete evidence

That last reading is the honest one. A report where 60% of the figures have
evidence attached should say so, rather than presenting a confident total built
on gaps.

## Where it matters most

[Cooperatives](/use-cases/operators#cooperatives-and-large-estates),
[organic farms](/use-cases/arable#organic-farms),
[contractors](/use-cases/operators#agricultural-contractors),
[winter wheat](/use-cases/arable#winter-wheat-and-barley).

## Build it

There is nothing to fly and nothing to buy. This capability is a data model, a
set of parsers, and a stubborn insistence that every number carries a link back
to the record it came from.

### The architecture that makes it work

Every figure is a **derived value with a provenance chain**, never a stored
total.

```
figure  ──▶ aggregation  ──▶ records  ──▶ source
                                          (flight, prescription, as-applied
                                           log, meter reading, invoice)
```

Store the records. Derive the figures on read. The moment somebody stores a
computed total, it drifts away from the evidence and the audit trail is
decorative. This is the same principle the rest of this codebase runs on: the
site renders `treatedHectares` from the `TreatmentMap` row rather than from a
number typed into copy.

### What has to be parsed

| Input | Format | Effort |
|---|---|---|
| Prescriptions issued | Our own ISOXML and shapefile output | Free, we wrote it |
| As applied logs | ISOXML `TLG`, or vendor APIs | The one real parser. See [Prescriptions](/build/software/prescriptions) |
| Water | Meter readings, pump controller logs, manual entry | Low |
| Fuel and energy | Invoices, or the machine's own CAN data | Manual entry is acceptable and honest |
| Product | The spray diary the farm keeps by law anyway | Import, do not re-key |
| Weather | [DWD open data](https://opendata.dwd.de), free | Low |
| Yield | Weighbridge tickets, combine logs | Low |

### In-house software

| Stage | What we run | Licence | Replaces |
|---|---|---|---|
| Record store | This repository's models, plus a per-farm event log | MIT | farm management software modules |
| Parsers | ISOXML `TLG`, shapefile, CSV imports | GDAL MIT, own code | |
| Unit handling | One canonical unit per quantity, converted at the edges | own code | a whole class of bugs |
| Derivation | Figures computed on read from the record set | own code | |
| Export | CSV, XLSX and PDF with the evidence index attached | open libraries | scheme portals' own tooling |
| Retention | Records kept for the scheme's audit period, immutably | own code | |

### The requirements landscape, stated carefully

The reporting obligations that drive this change frequently and differ by
country, scheme and buyer. As of writing, the ones that matter to a German
arable customer include the Düngeverordnung documentation duties, the plant
protection application records every holding must keep, CAP conditionality
records, and whatever the buyer's own scheme asks for. Larger cooperatives are
increasingly asked for figures that roll into their customers' corporate
sustainability reporting.

**Do not hard-code a scheme's template.** Build the record model and the
derivation engine, then treat each scheme as an export adapter. Templates
change every year or two; the underlying record does not.

### Cost efficiency

- **Zero hardware, zero flights, high margin.** This is the capability that
  makes a scouting subscription stickier, because the reporting only works if
  the flights keep happening.
- **Import, do not re-key.** The farm is already recording plant protection
  applications because the law requires it. Reading that file is worth more
  than any dashboard.
- **The evidence link is the differentiator.** Anyone can total a column.
  Almost nobody can click a figure and land on the flight that produced it.
- **Sell it to the buyer, not just the farm.** A cooperative or a processor
  needing comparable figures across dozens of holdings has a much stronger
  reason to pay than an individual grower does.
