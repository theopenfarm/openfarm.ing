# The in-house software stack

This is the part that decides whether the business works. Hardware is a
commodity with a known price. Processing and analytics are normally rented per
hectare per year, which means your best customers are also your biggest cost
line, forever.

None of it has to be rented.

## The pipeline, end to end

```
flight plan ──▶ aircraft ──▶ raw frames + flight log
                                   │
                          ┌────────┴────────┐
                          ▼                 ▼
                    geotagging        radiometric
                    (RTK + trigger)   calibration
                          └────────┬────────┘
                                   ▼
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
             photogrammetry                  per-frame
             (ortho, DSM, DTM)               inference
                    │                             │
                    ▼                             ▼
              raster layers ──────────▶ detections in field space
                    │                             │
                    └──────────────┬──────────────┘
                                   ▼
                          clustering + zoning
                                   ▼
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
             prescription export            flight record
             (ISOXML, shapefile)            (this repository)
                                                  ▼
                                        site, API, dashboard
```

## The five pages

| Page | Covers |
|---|---|
| [Flight stack](/build/software/flight-stack) | ArduPilot and PX4, mission planning, telemetry, the pilot app |
| [Ingest and photogrammetry](/build/software/ingest) | Geotagging, calibration, stitching, raster derivatives |
| [Perception models](/build/software/perception) | Labelling, training, deployment, and the licence trap |
| [Prescriptions](/build/software/prescriptions) | Clustering, ISOXML, shapefiles, and reading as-applied logs back |
| [Platform](/build/software/platform) | Storage, the record model, serving, and how this repository fits |

## What to build and what to adopt

| Layer | Adopt | Build |
|---|---|---|
| Flight control | ArduPilot or PX4 | Mission templates per capability |
| Ground control | QGroundControl at first | A pilot app, when the routes become capability-specific |
| Geotagging | RTKLIB for PPK | Trigger matching, lever arm, interpolation |
| Photogrammetry | ODM or COLMAP plus OpenMVS | Orchestration, quality gates, retries |
| Raster | GDAL, rasterio, PROJ | Nothing. It is all there |
| Terrain | WhiteboxTools, pysheds, GRASS | Nothing |
| Models | PyTorch, an Apache-2.0 detector, ONNX Runtime, TensorRT | Datasets, training loops, evaluation on your own fields |
| Labelling | CVAT or Label Studio | The ground truth capture form in the field |
| Calibration | Vendor models as reference | The per-flight discipline and its enforcement |
| Clustering | scikit-image, scikit-learn | The whole thing. This is product logic |
| Export | GDAL/OGR for geometry | ISOXML writing and per-terminal quirks |
| Record and serving | This repository, GDAL, TiTiler | The domain model |

The pattern: **adopt the mathematics, build the judgement.** Nobody needs to
write a bundle adjuster. Everybody needs to decide what area threshold switches
a nozzle on, and that decision is the product.

## The rules that keep the stack honest

These come from the same place the rest of this codebase comes from, and they
are worth stating as engineering rules rather than as taste.

**Every figure is derived, never stored.** Store the records; compute the
totals on read. A stored total drifts away from its evidence and the audit
trail becomes decorative.

**Every output carries its provenance.** A detection knows its flight. A
prescription knows its detections. A report knows its prescriptions. The
[field report](/guide/api#get-apifield-report) shape in this repository is the
example: `treatedHectares` comes from a `TreatmentMap` row, not from copy.

**Determinism where it is possible.** The demonstration field is generated from
a fixed seed with no `Date` and no `Math.random`, so the database, the API and
the rendered map always agree. Apply the same discipline to processing: the
same frames and the same model version must produce the same detections, which
means pinning model versions into the flight record.

**Sample data announces itself.** `/api/field-report` carries `sample: true` in
the payload rather than in a footnote. Anything modelled, estimated or
interpolated should say so in the data, not in the documentation.

**Fail one panel, not the page.** Every read in this repository is wrapped so a
missing table returns a fallback. The processing pipeline deserves the same:
one failed band, one unmatched frame, one missing log should degrade an output,
not lose a flight.

## Total software cost

| Item | Rented | In house |
|---|---|---|
| Photogrammetry and analytics | Per hectare per year | €0 |
| Model licences | Per seat or per hectare | €0, with an Apache-2.0 detector |
| Flight control and planning | Bundled with the aircraft | €0 |
| Compute | Included in the licence | €3,000 to €6,000 once, or €150 to €600 per month |
| Engineering time | None | The real cost. Several months for a first end-to-end pipeline |

The trade is honest: you exchange a permanent per-hectare cost for a one-off
engineering cost and an ongoing maintenance obligation. It is the right trade
above a few thousand hectares a year and the wrong one below a few hundred.
