# Automated field mapping

**Implementation status:** This page describes the intended workflow and build requirements, not a qualified field service. See [current software and remaining gates](/features/#implementation-status) and the [capability roadmap](https://github.com/theopenfarm/openfarm.ing/issues/6) for normal operation, failure handling and required evidence.

> The base layer everything else sits on

The intended workflow uses overlapping imagery to reconstruct a surface model
and orthophoto. Terrain hidden by vegetation needs additional evidence before
it can support drainage decisions.

| | |
|---|---|
| Category | Detect |
| Slug | `field-mapping` |
| Cadence | Once per field, then refreshed after drainage work or a boundary change |
| Payload | High resolution RGB, RTK, LiDAR on wooded or tall canopy blocks |
| Needs a visit first | Site assessment, permissions and checkpoint planning are required |

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

Compare measured boundaries with the registered record and retain their
uncertainty. A difference is a finding to investigate, not evidence of a
guaranteed financial return or a legal boundary correction.

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

| Parameter | Planning input | Verification |
|---|---|---|
| Overlap | Choose forward and side overlap for scene texture, relief and reconstruction method | [ODM collection guidance](https://docs.opendronemap.org/flying/) gives starting ranges; inspect the actual reconstruction |
| Altitude | Compute GSD using the selected sensor, focal length and height above the imaged surface | Terrain, lens calibration and applicable operating limits constrain the route |
| Speed and exposure | Compute translational smear in pixels | Include angular motion, vibration, lighting and shutter behaviour in image-quality checks |
| Pattern | Select view angles and grids for the required surface coverage | Occlusion and canopy cannot be resolved by a universal single-grid rule |
| Ground control | Plan surveyed control and independent checkpoints for the required accuracy | RTK camera positions do not establish output accuracy by themselves |

A global shutter avoids rolling-shutter readout skew; it does not eliminate
motion blur. Qualify trigger timing, exposure and camera calibration for the
selected aircraft and processing software.

### Reproducible planning example

This is an ideal pinhole-camera calculation, not a flight result or an accuracy
claim. Assume a flat 500 m by 500 m block (25 ha), nadir images at a constant
100 m above the surface, a 23.5 mm by 15.6 mm active sensor recorded at
6000 by 4000 pixels, and a calibrated 24 mm focal length. The wider sensor axis
runs across the flight line. Assume 80% overlap in both directions, no cropped
images, and one grid with enough edge coverage. No particular camera model is
qualified by these assumed dimensions.

```text
footprint across = 100 m * 23.5 mm / 24 mm = 97.9167 m
footprint along = 100 m * 15.6 mm / 24 mm = 65 m
GSD across = 97.9167 m / 6000 px = 1.6319 cm/px
GSD along = 65 m / 4000 px = 1.6250 cm/px
lane spacing = 97.9167 m * (1 - 0.80) = 19.5833 m
trigger spacing = 65 m * (1 - 0.80) = 13 m
lanes = ceil((500 m - 97.9167 m) / 19.5833 m) + 1 = 22
frames per lane = ceil((500 m - 65 m) / 13 m) + 1 = 35
planned frames = 22 * 35 = 770
```

The footprint relation follows similar triangles in the assumed pinhole model;
[PIX4D documents the required GSD inputs](https://support.pix4d.com/hc/en-us/articles/202559809).
Counts round up to cover the rectangle; edge footprints can extend beyond it.
The route still needs permitted aircraft and camera footprints, launch/recovery,
turns, transit and any additional control images. Changing the sensor crop,
terrain height, grid orientation or overlap changes these results. GSD is pixel
spacing on the modelled surface, not positional accuracy or bare-earth detail
under canopy.

At 10 m/s and 1/1000 s exposure, translational smear is 0.01 m, about 0.62
pixels using the along-track GSD above. At 1/250 s it is about 2.46 pixels. An
assumed half-pixel limit would require an exposure no longer than 1/1231 s;
rotation and vibration can require a shorter exposure. The same 10 m/s speed
requires a trigger about every 1.3 s for the assumed 13 m spacing. Verify that
the selected camera, storage and trigger interface sustain that cadence.

### Hardware

| Item | Why | EU source | US source | Indicative |
|---|---|---|---|---|
| Airframe | Size for the complete camera, lens, mount, battery and reserve; survey endurance requires measurement | [Airframe design requirements](/build/airframes#class-b-parts-list) | Obtain a matched-build quote | No qualified configuration priced here |
| Flight controller | ArduPilot or PX4 | [Pixhawk 6X](https://holybro.com/products/pixhawk-6x) | same | €250 to €330 |
| RTK GNSS | Record camera positions with uncertainty and validate them against independent surveyed checkpoints | [ArduSimple simpleRTK2B](https://www.ardusimple.com/product/simplertk2b/) | [SparkFun ZED-F9P](https://www.sparkfun.com/products/16481) | €200 to €300 |
| Mapping camera | The one part not to economise on | [Sony ILX-LR1](https://pro.sony/en_GB/products/industrial-cameras/ilx-lr1), or a used a6000 or a7R II | [B&H](https://www.bhphotovideo.com) | €400 used to €3,000 new |
| Lens, 24 mm fixed | Fixed focus, no zoom, no stabiliser | [Kamera Express](https://www.kameraexpress.de) | [B&H](https://www.bhphotovideo.com) | €200 to €500 |
| Camera trigger | Shutter fired from the flight controller, geotagged from the log | [ArduSimple accessories](https://www.ardusimple.com) | [SparkFun](https://www.sparkfun.com) | €40 |
| Checkpoint targets | Painted or printed ground targets, surveyed once | [Emlid Reach RS3](https://emlid.com/reachrs3/) to survey them | same | €2,500 for the receiver, targets are paint |

Budget alternative for the camera: a [Raspberry Pi Global Shutter
camera](https://www.raspberrypi.com/products/raspberry-pi-global-shutter-camera/)
([BerryBase](https://www.berrybase.de), [The Pi Hut](https://thepihut.com))
plus a C-mount lens. The manufacturer specifies 1.58 MP and a global shutter.
Compute footprint and GSD for the selected lens and sensor mode; resolution
alone does not qualify a drainage model or rule out a detection task. With a
Pi 5, select the matching camera cable and verify capture and trigger timing
before planning aerial acquisition.

### In-house software

| Stage | Candidate components | Comparable commercial tools |
|---|---|---|
| Flight planning | Custom planner or QGroundControl, with the selected driver's supported mission subset | DJI Pilot, Pix4Dcapture |
| Geotagging | Match shutter events in the flight log to frames | Vendor geotagging tools |
| Reconstruction | [OpenDroneMap](https://opendronemap.org) via NodeODM, or [COLMAP](https://colmap.github.io) plus [OpenMVS](https://github.com/cdcseacave/openMVS) | Pix4Dmapper, Agisoft Metashape, DJI Terra |
| Raster work | GDAL, rasterio, PROJ | Select against the required raster output |
| Terrain derivatives | [WhiteboxTools](https://www.whiteboxgeo.com/), [pysheds](https://github.com/mdbartos/pysheds), or GRASS `r.watershed` | ArcGIS Spatial Analyst |
| Boundary extraction | Vectorise the orthophoto edge and compare with the registered parcel | Requires domain validation |
| Serving | Cloud Optimized GeoTIFF plus [TiTiler](https://developmentseed.org/titiler/) | Mapbox tiling |

Check each selected tool and dependency against the [versioned licence references](/build/#licences-to-decide-before-you-write-integration-code).
Tools not listed there need their own review before selection. This candidate
list does not promise equivalent features or qualify a replacement.

The pipeline stages above are integration candidates, not evidence of an
unattended deployed service. The worked example plans 770 frames at about
1.63 cm/px; it does not predict processing time. Benchmark the exact dataset,
software version, options and machine using the [ingest runtime record](/build/software/ingest#runtime).
The hardware prices in this page are unverified budget allowances as of
22 October 2026, excluding tax, shipping and integration. Obtain current quotes
for a compatible build before using them in a budget.

### Licence note worth knowing before you build a product on it

[OpenMVS](https://github.com/cdcseacave/openMVS/blob/develop/COPYRIGHT.md) is
AGPL-licensed. Pairing it with COLMAP does not make the combined selection a
permissive stack. OpenMVG uses MPL-2.0, a file-level copyleft licence, and
provides structure from motion rather than a complete replacement for every
dense reconstruction step.

Review each selected version, dependency and integration boundary before
shipping. An internal batch job is an architectural choice, not a blanket
licensing exemption. See the [shared licence review](/build/#licences-to-decide-before-you-write-integration-code)
and the [GNU licence FAQ](https://www.gnu.org/licenses/gpl-faq.html#UnreleasedModsAGPL)
for the modified-network-service source requirement.

See [Ingest and photogrammetry](/build/software/ingest) for the pipeline in
detail.

### Cost efficiency

- **Compare correction sources.** Check network coverage, datum, latency,
  service terms and field availability before choosing a network service or
  local base. A surveyed base can also be useful for control, repeatability
  and independent checks.
- **Measure processing cost.** Compare licensing, compute, storage, support
  and operator time against the required outputs and throughput. No universal
  hectare count establishes when a processing machine pays for itself.
- **Check existing elevation data.** A published terrain model may answer a
  drainage question if its date, resolution, datum, uncertainty and licence
  meet the project requirements. A new flight is justified by missing evidence.
- **Qualify the camera and shutter.** Check timing, calibration and image
  quality before collecting a large dataset.
