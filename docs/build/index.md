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

The project is developing an owned runtime, sensors, estimator, simulated
controls, authority and mission engine in the shared drone library. ArduPilot
and PX4 are optional driver paths. Current simulation and planning evidence
does not qualify a physical controller; independent flight-controller and RC
authority remain required at the physical boundary, which is receive-only.
See the [flight stack](/build/software/flight-stack) and
[implementation status](/features/#implementation-status).

Other open-source processing, geometry and inference tools can be selected as
building blocks where the roadmap calls for them. Their appearance in this
guide does not mean they are integrated, or that a reconstruction, model or
prescription has been validated on a farm. Calibration, source-linked records,
domain logic and each output's completion evidence remain part of the work.

## Licences to decide before you write integration code

This is the one piece of legal homework that will actually bite.

| Component | Licence | Consequence |
|---|---|---|
| ArduPilot | GPL-3.0 | Modifications distributed with the aircraft must be published. Using it unmodified is fine |
| PX4 | BSD-3 | Permissive. Often the right choice for a commercial product |
| OpenDroneMap, WebODM, OpenMVS | AGPL-3.0 | Review source obligations for modified network services and distribution; batch orchestration is not a blanket exemption |
| COLMAP | BSD | Permissive |
| OpenMVG | MPL-2.0 | File-level copyleft, workable |
| Ultralytics YOLO | AGPL-3.0 or commercial | The most common expensive mistake in this field |
| RF-DETR, MMDetection, torchvision | Apache-2.0 / BSD | Permissive. Start here |
| GDAL, PROJ, rasterio, OpenCV | MIT / BSD | Permissive |
| MinIO, Garage | AGPL-3.0 | Review the chosen integration; SeaweedFS uses Apache-2.0 and hosted services have their own terms |

Choose a licence-compatible integration before implementation. The table is
an orientation, not a determination for a specific combined work. Inspect the
actual version and transitive dependencies, preserve notices, and arrange
corresponding-source delivery where required. The
[GNU licence FAQ](https://www.gnu.org/licenses/gpl-faq.html#UnreleasedModsAGPL)
explains the source offer for users of modified AGPL network services;
[OpenMVS's copyright record](https://github.com/cdcseacave/openMVS/blob/develop/COPYRIGHT.md)
also lists third-party components that need their own review.

## A note on the prices in these pages

Every hardware table gives an indicative figure and both an EU and a US source.
The figures are 2026 estimates and they move: sensor pricing in particular has
fallen steadily and airframe pricing has not. Check the vendor's current price
before you build a quote on anything here, and treat the tables as a shopping
list rather than a budget.
