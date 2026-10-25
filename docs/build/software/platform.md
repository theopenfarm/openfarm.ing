# Platform

Where the records live, how they are served, and how this repository fits into
the wider system.

## The two halves

| Half | Wants | Runs |
|---|---|---|
| Web: site, API, dashboard | Milliseconds, high availability, tiny footprint | This repository, as a tenant on a shared box |
| Processing: stitch, infer, export | A GPU and hours of wall clock | One processing box, on demand |

The only contract between them is the **flight record**. A processing run
finishes by writing missions, detections and treatment maps, and by calling
`buddy imagery:attach` for the stitch. Nothing in the site knows how any of it
was produced, which is what lets the pipeline be rewritten without touching a
page. See [Deployment](/guide/deployment#where-the-flight-pipeline-would-run).

## The record model

This repository already carries it. See
[Architecture](/guide/architecture#the-domain-model) for the full table.

```
Farm ──┬── Field ──┬── Mission ──┬── Detection
       │           │             └── TreatmentMap
       ├── Drone ──┘
       └── FarmCapability
```

`Mission.purpose` holds a **feature slug**, which is what connects the
capability catalog on the marketing site to the flights that happened over a
field, with no join table in between.

Extending it for a full processing pipeline means adding, not restructuring:

| Addition | Holds |
|---|---|
| `Flight artefacts` | Raw frame manifest, orthomosaic, DSM, index rasters, with checksums |
| `Processing runs` | Pipeline version, model versions, parameters, timings, quality gate results |
| `Calibration records` | Panel captures, DLS series, checkpoint residuals per flight |
| `As-applied logs` | The machine's own record, parsed and rasterised |
| `Ground truth` | Scout confirmations, hand counts, penetrometer readings |

Note what is **not** in that list: no stored totals. Every figure is derived
from the records on read. A stored total drifts away from its evidence and the
audit trail becomes decorative.

## Storage

| Layer | Choice | Licence |
|---|---|---|
| Relational | SQLite for a single tenant, PostgreSQL with PostGIS at scale | Public domain / PostgreSQL licence |
| Object | [SeaweedFS](https://github.com/seaweedfs/seaweedfs), [Garage](https://github.com/deuxfleurs-org/garage), or a hosted S3-compatible bucket | Apache-2.0 for SeaweedFS; AGPL-3.0 for Garage; hosted service terms vary |
| Raster | Cloud Optimized GeoTIFF, with overviews and internal tiling | |
| Vector | GeoJSON in the record, shapefile and ISOXML as exports | |

MinIO and Garage use AGPL-3.0. Review the selected version and integration.
S3 compatibility does not make licences, supported operations or access-control
behavior interchangeable. Qualify the chosen provider against the actual client.

**Cloud Optimized GeoTIFF is the format decision that pays off repeatedly.** A
COG supports HTTP range reads, so the
[change detection step](/build/software/perception#change-detection-needs-no-model-at-all)
becomes a windowed read of two files rather than a pipeline over two full
rasters, and a web map can serve tiles from the same object with no separate
tile store.

```bash
gdal_translate ortho.tif ortho_cog.tif -of COG -co COMPRESS=DEFLATE -co OVERVIEWS=AUTO
```

## Serving imagery

| Component | Choice | Licence |
|---|---|---|
| Tiles from COGs | [TiTiler](https://developmentseed.org/titiler/) or [rio-tiler](https://cogeotiff.github.io/rio-tiler/) | MIT |
| Map client | [MapLibre GL JS](https://maplibre.org) | BSD-3 |
| Base map | OpenStreetMap tiles, or your own orthophoto | ODbL, attribution required |
| The site's own field map | `app/Support/fieldmap.ts`, server-rendered SVG, no client bundle | This repository |

The marketing site deliberately does not use any of the first three. It renders
SVG from normalised coordinates because the record already carries them, which
needs no projection, no tile server and no JavaScript. See
[The field map](/guide/field-map). A customer console showing many fields over
a base map is where TiTiler and MapLibre earn their place.

## Retention

Decide this on day one, write it into the customer contract, and enforce it in
code.

| Data | Suggested |
|---|---|
| Raw frames | One season, then delete once derived products are verified |
| Orthomosaics and index rasters | Keep. They are the field's history and the whole change-detection product |
| Detections, prescriptions, as-applied | Keep for the scheme's audit period, at minimum |
| Model artefacts | Keep every version that ever produced a customer-facing detection |
| Personal data in imagery | Minimise. Aerial imagery over a farmyard or a neighbour's garden is a real GDPR question |

Raw frames are the bulk: roughly 15 GB per 25 hectare flight at 2.5 cm/px, and
several terabytes a season for a busy operator. Deleting them is the single
largest storage saving available, and it is safe once the derived products have
passed their [quality gates](/build/software/ingest#quality-gates).

## Multi-tenancy

Get this right before the second customer, not after.

This repository's approach, worth copying: the console **never accepts a farm
id from the request**. Every read re-derives the holding from the signed-in
user, and every write does the same and ignores any farm the request names. The
generated REST reads use native model ownership to resolve the caller's
current holdings. [`FarmScope`](/guide/architecture#multi-tenancy) checks
holding eligibility and selectors; the model scope confines both lists and
individual rows. Generic mutations on the eight farm resources are withheld;
domain Actions own those workflows.

The processing pipeline needs the same discipline: object storage keys and
processing jobs scoped by farm, and no path that takes a farm id from anywhere
except the authenticated principal.

## Queues and scheduling

| Job | Trigger |
|---|---|
| Ingest a card | A card is mounted, or an upload completes |
| Process a flight | Ingest finished and passed its gates |
| Export a prescription | Processing finished, and the capability calls for one |
| Plan tomorrow's flights | Daily, before dawn |
| Retrain a model | Manually, on a schedule you control |

This repository schedules `ScheduleCapabilityFlights` daily at 05:30
Europe/Berlin: early enough that the plan exists before anyone looks at it, and
daily rather than hourly because cadences are measured in days. See
[Architecture](/guide/architecture#scheduling).

Processing jobs want a real queue with retries and visibility timeouts, because
a stitch that fails at minute 40 must be retried without losing the flight.

## What the customer sees

| Surface | Built from |
|---|---|
| Marketing pages | The catalog, through `app/Support/catalog.ts` |
| Public API | The same layer. See [HTTP API](/guide/api) |
| Farmer console | `app/Support/dashboard.ts` and `capabilities.ts` |
| Reports and prescriptions | The flight record |

One read layer, three surfaces. If `/features` and `/api/features` ever
disagree, that is a bug rather than a stale copy, and the same rule should hold
for every figure the processing pipeline produces.
