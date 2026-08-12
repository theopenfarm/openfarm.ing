# Prescriptions

Turning detections into a file a machine can load, and reading the machine's
own log back afterwards. This is the step that makes the platform worth paying
for: everything before it is a picture.

## From detections to zones

The demonstration field's `demoZones()` is deliberately the same logic the
product describes, so the site's map is honest about it. The production version
adds a buffer and a merge.

| Step | Detail |
|---|---|
| 1. Bin | Detections onto a grid whose cell the machine can actually resolve |
| 2. Threshold | Switch a cell on when the target area inside it justifies opening the nozzle |
| 3. Rate | Assign a rate band by weight of evidence |
| 4. Buffer | Grow live cells by the machine's positioning error plus the nozzle spread |
| 5. Merge | Union adjacent cells, simplify the geometry, drop slivers |
| 6. Cap | Enforce total product limits and the machine's min and max rate |

### The resolution limit is the machine, not the model

| Machine | Effective cell |
|---|---|
| 24 m boom, 8 sections | 3 m across the boom, and as long as the response time allows |
| 36 m boom, individual nozzle control | 0.5 m |
| Twin disc spreader | 24 to 36 m. The spread pattern is that wide |
| Spot spray rig | 0.1 to 0.5 m |

A prescription finer than the machine can follow is a map no machine can
follow. The demonstration field uses a 16 by 22 grid over 24.6 ha, about 700 m²
per cell, which is a section-control prescription.

Always record the cell size, the threshold and the buffer with the
prescription. Those three numbers are the agronomic argument, and a customer
who disagrees with the treated area is really disagreeing with one of them.

### The buffer is where the argument lives

Too small and you miss the plants at the edge of a patch. Too large and the
saving disappears. Make it a per-farm, per-machine setting with a sensible
default, and show its effect on treated area before the file is exported.

## Export formats

| Format | Reads it | Notes |
|---|---|---|
| ESRI Shapefile | Nearly every terminal | The pragmatic default. Ugly, universal |
| ISOXML (ISO 11783-10) | ISOBUS task controllers | The standard answer, more work to produce |
| GeoJSON | Your own software, web maps | Not a terminal format |
| Vendor formats | Specific brands | Only when a customer's terminal demands it |

Ship **shapefile first**. It is a `ogr2ogr` call away and it gets a customer
treating a mapped area this season. Add ISOXML when a customer's task
controller needs it.

### Shapefile, done properly

```bash
ogr2ogr -f "ESRI Shapefile" prescription.shp zones.geojson \
  -t_srs EPSG:25832 -lco ENCODING=UTF-8
```

| Trap | Fix |
|---|---|
| Field names truncated to 10 characters | Name them `RATE`, `PRODUCT`, `ZONE` from the start |
| Attribute types | The rate must be numeric, not text. Terminals silently ignore text |
| Projection | Ship a `.prj`. Use the customer's national grid, ETRS89 / UTM zone 32N (EPSG:25832) for most of Germany |
| All five files | `.shp`, `.shx`, `.dbf`, `.prj`, `.cpg`. A missing `.prj` puts the field in the sea |
| Geometry validity | No self-intersections, no zero-area slivers |

### ISOXML

ISO 11783-10 task data: a `TASKDATA.XML` describing a task, its treatment zones
(`TZN`) or a grid, the product, and the rates, on a USB stick in a
`TASKDATA` directory.

| Resource | Note |
|---|---|
| [Open-Agriculture](https://github.com/Open-Agriculture) | Open source ISOBUS tooling, including [AgIsoStack++](https://github.com/Open-Agriculture/AgIsoStack-plus-plus) (MIT) |
| [ADAPT](https://github.com/ADAPT/ADAPT) | AgGateway's data model and plugins, permissively licensed, .NET |
| The standard itself | Purchasable from ISO. AEF membership is about certification, not about writing a file |

You do **not** need AEF membership or ISOBUS certification to write a task data
file a terminal will read. You do need patience: real terminals are fussy about
element ordering, identifiers and the directory layout, and the only reliable
test is a real terminal.

Test against the machines your customers actually own. Build a compatibility
matrix and keep it: it is genuinely valuable operational knowledge.

## Reading the machine's log back

The other half, and the one almost nobody does. It turns "here is a plan" into
"here is what happened".

| Source | Format | Route |
|---|---|---|
| ISOBUS task controller | ISOXML `TLG` binary logs plus the XML header | Parse directly. The open path |
| John Deere | Operations Center | Their developer API, with the customer's consent |
| CLAAS, Trimble, Kverneland, Müller | Vendor telematics | APIs, or an ISOXML export |
| Nothing | | Manual entry, honestly labelled |

An ISOXML `TLG` reader is a couple of days of work and it unlocks three things
at once:

- [Precision fertilisation's](/features/precision-fertilisation) applied versus
  planned reconciliation
- [Soil compaction's](/features/soil-compaction) traffic layer
- [Sustainability reporting's](/features/sustainability-dashboard) entire
  evidence base

It is the highest-leverage parser in the platform.

## Reconciliation

```
planned(zone)  vs  applied(zone)
```

Rasterise the as-applied log using the machine's recorded working width and
position, then compare against the prescription raster. Report:

| Figure | Meaning |
|---|---|
| Area treated as planned | The prescription was followed |
| Area treated outside the plan | Overlap, headland turns, or the operator overrode it |
| Area planned but untreated | Missed, or the machine could not reach it |
| Total product planned against applied | The number the farm's accounts care about |

Overrides are not failures and should not be reported as such. An operator who
opened the boom over an area the map missed has told you something about the
model, and that feedback belongs in the training set.

## Legal constraints to encode

| Constraint | Where |
|---|---|
| Nitrogen limits and documentation duties (Düngeverordnung, tighter in nitrate-designated areas) | A hard cap on the total, not a warning |
| Buffer zones to water bodies and to neighbouring land | Subtract from the treatable area before optimising |
| Product-specific application limits and conditions | Per product, per crop, per season |
| Drift reduction requirements | Affects the equipment and the buffer, both recorded |

Encode these as **hard constraints on the geometry**, applied before the file
is written. A prescription that a farm cannot legally apply is worse than no
prescription, because somebody has to notice.

## What the record has to keep

For every prescription, store: the source flight, the detections it was built
from, the model version that produced them, the cell size, the threshold, the
buffer, the rate bands, the constraint set applied, the exported file, and the
as-applied log when it comes back.

That chain is what makes the treated-area figure defensible, and it is exactly
the shape this repository's `Mission`, `Detection` and `TreatmentMap` models
already describe. See [Architecture](/guide/architecture#the-domain-model).
