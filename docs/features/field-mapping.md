# Automated field mapping

> The base layer everything else sits on

One flight produces a high resolution 3D model of the field: elevation,
drainage lines, headlands and problem ground.

| | |
|---|---|
| Category | Detect |
| Slug | `field-mapping` |
| Cadence | Once per field, then refreshed after drainage work or a boundary change |
| Payload | High resolution RGB, RTK, LiDAR on wooded or tall canopy blocks |
| Needs a visit first | No |

## The problem

Most farms are still working from a field boundary drawn once and a memory of
where the wet spot is. Without an elevation model there is no way to see why
one corner floods, where the water actually runs, or how much of a field is not
worth cropping at all.

## How it works

| Step | What happens |
|---|---|
| Survey | The drone flies an overlapping photogrammetry grid over the whole block |
| Reconstruct | Images are matched into a point cloud, then a surface model and an orthophoto |
| Derive | Slope, aspect, flow accumulation and depressions are calculated from the surface |
| Publish | Layers are written to your field record so every later flight is measured against the same base |

## What you get

- Orthophoto
- Digital surface and terrain models
- Drainage and flow layer
- Corrected field boundary with area

## What the dashboard measures

- Mapped area
- Elevation range across the block
- Depression area and volume
- Boundary area against the registered area

That last one pays for the flight on its own more often than people expect. A
registered area and a measured area disagreeing by three percent is common, and
it has been quietly driving every per-hectare figure on the farm.

## Where it matters most

[Winter wheat](/use-cases/arable#winter-wheat-and-barley),
[sugar beet](/use-cases/arable#sugar-beet),
[grassland and silage](/use-cases/livestock#grassland-and-silage),
[cooperatives](/use-cases/operators#cooperatives-and-large-estates),
[reforestation](/use-cases/operators#reforestation-and-land-restoration).

## Build it

This is the capability to build first. The payload is one ordinary camera, the
entire pipeline is open source, and every other capability is measured against
the base layer it produces.

### Flight parameters that actually matter

| Parameter | Value | Why |
|---|---|---|
| Forward overlap | 75 to 80% | Below 70% the reconstruction starts failing over uniform canopy |
| Side overlap | 65 to 70% | |
| Altitude | 80 to 120 m AGL | 2 to 3 cm/px with a 24 MP APS-C sensor and a 24 mm lens |
| Speed | Such that motion blur stays under half a pixel | At 1/1000 s and 10 m/s that is fine; at 1/250 s it is not |
| Pattern | Double grid on tall or wooded blocks | Single grid is enough for bare or short canopy |
| Ground control | RTK on the aircraft, plus 3 to 5 checkpoints | Checkpoints are how you find out the RTK was lying |

Fly with the shutter as fast as light allows, and prefer a global shutter or a
mechanical shutter. A rolling shutter on a moving aircraft skews every frame,
and photogrammetry software has to model that skew rather than measure ground.

### Hardware

| Item | Why | EU source | US source | Indicative |
|---|---|---|---|---|
| Airframe, 5 to 7 kg class | Carries a real camera for 30 minutes | [Holybro X500 V2 kit](https://holybro.com/products/x500-v2-kits) via [Drone Parts Center](https://www.drone-parts-center.com) | [GetFPV](https://www.getfpv.com), [RobotShop](https://www.robotshop.com) | €400 to €600 |
| Flight controller | ArduPilot or PX4 | [Pixhawk 6X](https://holybro.com/products/pixhawk-6x) | same | €250 to €330 |
| RTK GNSS | Centimetre camera positions, which removes most ground control | [ArduSimple simpleRTK2B](https://www.ardusimple.com/product/simplertk2b/) | [SparkFun ZED-F9P](https://www.sparkfun.com/products/16481) | €200 to €300 |
| Mapping camera | The one part not to economise on | [Sony ILX-LR1](https://pro.sony/en_GB/products/industrial-cameras/ilx-lr1), or a used a6000 or a7R II | [B&H](https://www.bhphotovideo.com) | €400 used to €3,000 new |
| Lens, 24 mm fixed | Fixed focus, no zoom, no stabiliser | [Kamera Express](https://www.kameraexpress.de) | [B&H](https://www.bhphotovideo.com) | €200 to €500 |
| Camera trigger | Shutter fired from the flight controller, geotagged from the log | [ArduSimple accessories](https://www.ardusimple.com) | [SparkFun](https://www.sparkfun.com) | €40 |
| Checkpoint targets | Painted or printed ground targets, surveyed once | [Emlid Reach RS3](https://emlid.com/reachrs3/) to survey them | same | €2,500 for the receiver, targets are paint |

Budget alternative for the camera: a [Raspberry Pi Global Shutter
camera](https://www.raspberrypi.com/products/raspberry-pi-global-shutter-camera/)
([BerryBase](https://www.berrybase.de), [The Pi Hut](https://thepihut.com),
about €55) plus a C-mount lens. It is 1.6 MP, so you fly lower and longer for
the same ground resolution, and the reconstruction is noisier. It is genuinely
usable for drainage mapping and genuinely not usable for anything that needs
plant-level detail.

### In-house software

| Stage | What we run | Licence | Replaces |
|---|---|---|---|
| Flight planning | Custom planner emitting MAVLink missions, or QGroundControl | BSD / GPL | DJI Pilot, Pix4Dcapture |
| Geotagging | Match shutter events in the flight log to frames | own code | vendor tools |
| Reconstruction | [OpenDroneMap](https://opendronemap.org) via NodeODM, or [COLMAP](https://colmap.github.io) plus [OpenMVS](https://github.com/cdcseacave/openMVS) | AGPL / BSD | Pix4Dmapper, Agisoft Metashape, DJI Terra |
| Raster work | GDAL, rasterio, PROJ | MIT / BSD | |
| Terrain derivatives | [WhiteboxTools](https://www.whiteboxgeo.com/), [pysheds](https://github.com/mdbartos/pysheds), or GRASS `r.watershed` | MIT / GPL | ArcGIS Spatial Analyst |
| Boundary extraction | Vectorise the orthophoto edge, snap to the registered parcel | own code | |
| Serving | Cloud Optimized GeoTIFF plus [TiTiler](https://developmentseed.org/titiler/) | MIT | Mapbox tiling |

The whole chain runs unattended. One 25 hectare block at 2.5 cm/px is roughly
600 frames, about 40 minutes on a mid-range GPU box with ODM.

### Licence note worth knowing before you build a product on it

OpenDroneMap and WebODM are AGPL-3.0. If a customer interacts with them over a
network, the AGPL's network clause applies to your modified version. Two clean
ways out: run ODM as a **batch job** whose outputs you serve, and keep it
unmodified, or build on the permissive stack instead, COLMAP (BSD) plus OpenMVS
(AGPL, so check that too) or OpenMVG (MPL-2.0). Get this decided before it
becomes 40,000 lines of integration.

See [Ingest and photogrammetry](/build/software/ingest) for the pipeline in
detail.

### Cost efficiency

- **Do not buy an RTK base.** Use a network correction service. Several German
  states publish SAPOS corrections free of charge, and
  [Centipede RTK](https://centipede.fr) and [RTK2go](https://rtk2go.com) cover
  much of Europe for nothing. A base station is for sites with no mobile data.
- **Do not pay per hectare for stitching.** This is the single largest
  recurring cost in commercial drone mapping and it is a solved open source
  problem. One GPU box pays for itself in the first few thousand hectares.
- **Free elevation data first.** Several German states publish a 1 m DEM as
  open data. If a customer only needs drainage lines on flat arable land, the
  state DEM may answer the question without a flight. Sell them the flight when
  they need centimetres, not when they need metres.
- **Spend on the camera and the shutter.** Everything downstream inherits their
  quality, and nothing downstream can recover it.
