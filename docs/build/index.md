# Build guide

How to build each part of this platform without renting it by the hectare.

Everything here follows one rule: **the hardware is a commodity and the
software is not.** Anyone can buy a drone. The thing that normally turns a
drone business into a thin reseller is the per-hectare licence on the software
that turns imagery into a decision, and none of that software has to be rented.

## The three cost lines, in order of size

| Line | Typical commercial route | In-house route |
|---|---|---|
| Processing and analytics | Compare the actual licence, processing and storage contract | Compute, storage, maintenance, support and operator time |
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

Each step should produce a tested deliverable before a larger investment.
Revenue and the date of paid operation depend on qualification and customer demand.

<!-- Retain the search anchor used by earlier published documentation. -->
<span id="what-in-house-does-and-does-not-mean"></span>

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

Select the exact code, container, model weights and dependencies before
choosing an integration. The following are version-labelled reference snapshots,
checked on 22 October 2026. They are not installed-version declarations or a
licence determination for a combined product. Each link pins the reviewed
upstream source rather than following a moving default branch.

| Reference component | Project declaration | Pinned source |
|---|---|---|
| ArduPilot Copter-4.6.3 | GPL-3.0-or-later for reviewed Copter code | [Header granting version 3 or later](https://github.com/ArduPilot/ardupilot/blob/92b0cd788ec29406f26c6f9c31d5ceedbd1cc538/ArduCopter/Copter.h), [COPYING](https://github.com/ArduPilot/ardupilot/blob/92b0cd788ec29406f26c6f9c31d5ceedbd1cc538/COPYING.txt) |
| PX4 v1.16.0 | BSD-3-Clause | [LICENSE](https://github.com/PX4/PX4-Autopilot/blob/6ea3539157ca358c70a515878b77077af7d4611d/LICENSE) |
| OpenDroneMap ODM v3.6.2 | AGPL-3.0-only, explicitly declared for its image | [Dockerfile licence label](https://github.com/OpenDroneMap/ODM/blob/47f41f1f2d09f7c15dff33dd3c15ab29c8a97d45/Dockerfile), [LICENSE](https://github.com/OpenDroneMap/ODM/blob/47f41f1f2d09f7c15dff33dd3c15ab29c8a97d45/LICENSE) |
| WebODM v3.3.1 | Upstream declares legacy `AGPL-3.0` | [package.json](https://github.com/OpenDroneMap/WebODM/blob/51c8f98b35de920d347631bcb99ed06180a6cafd/package.json), [LICENSE.md](https://github.com/OpenDroneMap/WebODM/blob/51c8f98b35de920d347631bcb99ed06180a6cafd/LICENSE.md) |
| NodeODM v3.6.2 | Upstream declares legacy `AGPL-3.0` | [package.json](https://github.com/OpenDroneMap/NodeODM/blob/d45bc41b0c7a51e7f3796035f3bc238e9e01d0a2/package.json), [LICENSE](https://github.com/OpenDroneMap/NodeODM/blob/d45bc41b0c7a51e7f3796035f3bc238e9e01d0a2/LICENSE) |
| OpenMVS v2.4.0 | AGPL-3.0-or-later for reviewed MVS code | [Scene.h grant](https://github.com/cdcseacave/openMVS/blob/58117204c86bbb11a0b25b26a8987676cf11274d/libs/MVS/Scene.h), [LICENSE](https://github.com/cdcseacave/openMVS/blob/58117204c86bbb11a0b25b26a8987676cf11274d/LICENSE), [third-party copyright inventory](https://github.com/cdcseacave/openMVS/blob/58117204c86bbb11a0b25b26a8987676cf11274d/COPYRIGHT.md) |
| COLMAP 3.11.1 | BSD-3-Clause for COLMAP itself | [COPYING.txt](https://github.com/colmap/colmap/blob/682ea9ac4020a143047758739259b3ff04dabe8d/COPYING.txt) |
| OpenMVG v2.1 | MPL-2.0 | [LICENSE](https://github.com/openMVG/openMVG/blob/01193a245ee3c36458e650b1cf4402caad8983ef/LICENSE) |
| Ultralytics v8.4.184 | AGPL v3 family, or separate commercial agreement; upstream metadata is inconsistent about suffix | [LICENSE](https://github.com/ultralytics/ultralytics/blob/f7dd275e5853801674ca78ef51896617bb5362ba/LICENSE), [pyproject.toml](https://github.com/ultralytics/ultralytics/blob/f7dd275e5853801674ca78ef51896617bb5362ba/pyproject.toml) |
| RF-DETR 1.11.2 open-source package and Apache-designated weights | Apache-2.0 | [LICENSE](https://github.com/roboflow/rf-detr/blob/7433d5919d0f7e72cc6cb78663e0a731afd499e0/LICENSE), [README licence split](https://github.com/roboflow/rf-detr/blob/7433d5919d0f7e72cc6cb78663e0a731afd499e0/README.md#license) |
| MMDetection v3.3.0 code | Apache-2.0 | [LICENSE](https://github.com/open-mmlab/mmdetection/blob/44ebd17b145c2372c4b700bfb9cb20dbd28ab64a/LICENSE) |
| torchvision v0.24.0 code | BSD-3-Clause | [LICENSE](https://github.com/pytorch/vision/blob/7a9db90e9aadea3e3e1fec35969601167e9efd4f/LICENSE), [Pretrained models](https://github.com/pytorch/vision/blob/7a9db90e9aadea3e3e1fec35969601167e9efd4f/README.md#pre-trained-model-license) |
| GDAL v3.13.3 general project code | MIT, with separately listed component licences | [LICENSE.TXT](https://github.com/OSGeo/gdal/blob/c8b4c45fca87d3e6fbf80e7a7898b8a661ad0edc/LICENSE.TXT) |
| PROJ 9.7.0 | MIT | [COPYING](https://github.com/OSGeo/PROJ/blob/b24cdfa5ecdcc26bf730a2d5a40fbaaf4e9bcc91/COPYING) |
| rasterio 1.4.3 | BSD-3-Clause | [LICENSE.txt](https://github.com/rasterio/rasterio/blob/7f8bda2e32df5b5eefc6e1ea6b5f04a946567ede/LICENSE.txt) |
| OpenCV 4.14.0 | Apache-2.0 | [LICENSE](https://github.com/opencv/opencv/blob/0654a42e19215ef25b1d367d822f3c630447e7c7/LICENSE) |
| MinIO RELEASE.2025-10-15T17-29-55Z | AGPL-3.0-or-later for reviewed server code | [main.go grant](https://github.com/minio/minio/blob/9e49d5e7a648f00e26f2246f4dc28e6b07f8c84a/main.go), [LICENSE](https://github.com/minio/minio/blob/9e49d5e7a648f00e26f2246f4dc28e6b07f8c84a/LICENSE), [README](https://github.com/minio/minio/blob/9e49d5e7a648f00e26f2246f4dc28e6b07f8c84a/README.md#license) |
| Garage v2.4.1 | Upstream declares legacy `AGPL-3.0` | [Server Cargo.toml](https://github.com/deuxfleurs-org/garage/blob/268334bd2530fa99f8b06c7383b2e9f776691edd/src/garage/Cargo.toml), [LICENSE](https://github.com/deuxfleurs-org/garage/blob/268334bd2530fa99f8b06c7383b2e9f776691edd/LICENSE) |
| SeaweedFS 3.97 | Apache-2.0 for the reviewed open-source tree | [LICENSE](https://github.com/seaweedfs/seaweedfs/blob/76452ab593995ab52b75e681de5b221de1e3f006/LICENSE) |

A legacy `AGPL-3.0` declaration does not settle an `-only` or `-or-later` suffix
for every file. The Ultralytics snapshot also has inconsistent suffix metadata;
resolve the chosen files and any commercial agreement before relying on it.
RF-DETR's Apache classification excludes Plus XL/2XL components under PML 1.0.
Torchvision explicitly notes separate pretrained-model terms, including
noncommercial SWAG weights. A code licence does not establish rights to every
checkpoint or dataset.

The obligations depend on the actual use and delivery:

- **GPL v3:** private execution differs from conveying copies. Providing an
  unmodified firmware binary can still require a compliant corresponding-source
  mechanism, notices and licence. Modified code and covered User Products can
  add conditions; the obligation is not simply to publish changes worldwide.
  See [ArduPilot's GPL text, sections 4 to 6](https://github.com/ArduPilot/ardupilot/blob/92b0cd788ec29406f26c6f9c31d5ceedbd1cc538/COPYING.txt).
- **AGPL v3:** source and conveyance conditions still apply. Section 13 adds a
  source offer to interacting network users of a modified version. A protocol,
  subprocess or batch boundary does not itself establish compliance. See
  [the selected ODM licence](https://github.com/OpenDroneMap/ODM/blob/47f41f1f2d09f7c15dff33dd3c15ab29c8a97d45/LICENSE).
- **MPL-2.0:** distribution retains conditions for covered files and their
  modifications, including source availability when distributing executables.
  A larger work can have separate terms while meeting those file-level duties.
  See [Mozilla's MPL explanation](https://www.mozilla.org/en-US/MPL/2.0/FAQ/).
- **BSD and MIT:** permissive licences still require their copyright, licence
  and disclaimer notices as applicable. BSD-3-Clause also restricts endorsement
  using contributor names. Read the selected project's terms.
- **Apache-2.0:** redistribution includes licence and applicable attribution
  requirements, changed-file notices and relevant NOTICE material. Patent and
  trademark provisions also apply. See [Apache's licence](https://www.apache.org/licenses/LICENSE-2.0).

Inventory the complete selected build, preserve notices and provide
corresponding source where required. The OpenMVS copyright inventory, COLMAP
notice and GDAL licence file explicitly identify separately licensed components.
Hosted services can also have contractual terms. These references support
integration planning; they do not establish compatibility for every proposed
application or aircraft distribution.

## A note on the prices in these pages

Monetary ranges in this guide are unverified planning allowances retained as
of 22 October 2026, not dated supplier quotes or qualified compatible builds.
Check the selected configuration, tax, shipping, spares, support and integration
labour with current suppliers. Model cost from the required workload and
measured performance before turning a parts list into a customer quote.
