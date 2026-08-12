# Build guide

How to build each part of this platform without renting it by the hectare.

Everything here follows one rule: **the hardware is a commodity and the
software is not.** Anyone can buy a drone. The thing that normally turns a
drone business into a thin reseller is the per-hectare licence on the software
that turns imagery into a decision, and none of that software has to be rented.

## The three cost lines, in order of size

| Line | Typical commercial route | In-house route |
|---|---|---|
| Processing and analytics | Per hectare per year, forever, rising with your best customers | One GPU box, electricity |
| Aircraft and sensors | €5,000 to €40,000 per rig | The same, or less if you build airframes |
| Compliance and operations | Registration, insurance, training, maintenance | Identical either way. This one you cannot engineer away |

The first line is the one that decides whether the business works at scale, and
it is the one this guide is mostly about.

## Pages

| Page | Covers |
|---|---|
| [Airframes](/build/airframes) | Buy or build, the four aircraft classes, parts lists |
| [Sensors](/build/sensors) | RGB, multispectral, thermal, LiDAR: what to buy at each budget |
| [Positioning](/build/positioning) | RTK, correction services, and why a base station is usually the wrong purchase |
| [Compute](/build/compute) | On-board, ground station, and the processing box |
| [Docks](/build/docks) | Unattended operation, buy versus build |
| [Payloads](/build/payloads) | Hoppers, spray systems, deterrents, gimbals |
| [Software](/build/software/) | The whole in-house stack, in five pages |
| [Costs](/build/costs) | Four complete build tiers with running costs |
| [Suppliers](/build/suppliers) | Where to buy, EU and US |
| [Regulation](/build/regulation) | EU and German rules that change what you can build |

## The build order that works

Do not start with the aircraft. Start with the thing that produces a
deliverable.

1. **Process somebody else's imagery.** Take a public dataset or a single
   flight from a rented drone and run it end to end: stitch, detect, cluster,
   export a prescription. If you cannot produce a file a sprayer terminal
   accepts, no aircraft will help.
2. **Buy one boring aircraft.** An integrated commercial multirotor with a
   calibrated multispectral payload. Fly paid work with it.
3. **Build the second aircraft** for the payload the market does not sell you
   cheaply, usually thermal for
   [wildlife searches](/features/wildlife-rescue) or a high resolution RGB rig
   for [weed control](/features/targeted-weed-control).
4. **Add a dock** once one customer's cadence justifies it.

Every step in that order produces revenue before the next one costs money.

## What "in-house" does and does not mean

It means: no per-hectare software licence, no vendor cloud holding your
customers' field records, no analytics tier you cannot audit, and no model you
cannot retrain on your own fields.

It does not mean: writing a flight controller, a photogrammetry engine or a
deep learning framework. ArduPilot, PX4, OpenDroneMap, COLMAP, GDAL, PyTorch
and ONNX Runtime are mature, free, and better than anything a small team will
write. Using them is the in-house route. The custom work is the layer above:
the calibration discipline, the models trained on your own fields, the
clustering into a prescription your customers' machines can follow, and the
record that ties every figure back to the flight that produced it.

## Licences to decide before you write integration code

This is the one piece of legal homework that will actually bite.

| Component | Licence | Consequence |
|---|---|---|
| ArduPilot | GPL-3.0 | Modifications distributed with the aircraft must be published. Using it unmodified is fine |
| PX4 | BSD-3 | Permissive. Often the right choice for a commercial product |
| OpenDroneMap, WebODM | AGPL-3.0 | Network use of a **modified** version triggers source obligations. Run it unmodified as a batch job, or use the permissive stack |
| COLMAP | BSD | Permissive |
| OpenMVG | MPL-2.0 | File-level copyleft, workable |
| Ultralytics YOLO | AGPL-3.0 or commercial | The most common expensive mistake in this field |
| RF-DETR, MMDetection, torchvision | Apache-2.0 / BSD | Permissive. Start here |
| GDAL, PROJ, rasterio, OpenCV | MIT / BSD | Permissive |
| MinIO | AGPL-3.0 | Consider SeaweedFS (Apache-2.0) or plain S3-compatible hosting |

None of these are reasons to avoid open source. They are reasons to pick the
permissive option **before** the integration exists, because swapping a
detector after eighteen months of labelled data and tuning is not a weekend.

## A note on the prices in these pages

Every hardware table gives an indicative figure and both an EU and a US source.
The figures are 2026 estimates and they move: sensor pricing in particular has
fallen steadily and airframe pricing has not. Check the vendor's current price
before you build a quote on anything here, and treat the tables as a shopping
list rather than a budget.
