# Ingest and photogrammetry

Frames and a flight log go in. Georeferenced, calibrated raster layers come
out. This is the stage that is normally rented per hectare, and the one where
the open source alternatives are strongest.

## Geotagging

| Step | Detail |
|---|---|
| Match | Shutter trigger events in the flight log to frame files, in order, with a count check |
| Interpolate | The exposure falls between GNSS epochs. Interpolate the trajectory to the exposure timestamp |
| Lever arm | Apply the measured offset from the GNSS antenna phase centre to the camera's optical centre |
| Attitude | Record roll, pitch and yaw at exposure, for projecting the frame footprint |
| Write | EXIF GPS tags plus a sidecar with the full pose and its uncertainty |

See [Positioning](/build/positioning#getting-the-position-onto-the-frame). The
lever arm is the step everybody skips and it is systematic, so it does not
average out.

## Radiometric calibration, for multispectral

Run this before anything else touches the pixels.

1. **Dark current and vignetting**, per band, from the camera's calibration
   data.
2. **Panel calibration**: the reflectance panel imaged before and after the
   flight gives the digital-number to reflectance scaling.
3. **Downwelling correction**: the light sensor's per-frame irradiance handles
   cloud passing during the flight.
4. **Band alignment**: separate lenses see slightly different scenes. Register
   the bands with feature matching before computing any index.

The reference implementation everybody learns from is MicaSense's own
[imageprocessing](https://github.com/micasense/imageprocessing) notebooks. Read
them, then write your own, because the discipline has to fit your workflow.

Without this, a "change layer" is largely a record of the weather. See
[disease detection](/features/plant-disease-detection#calibration-is-not-optional).

## Photogrammetry

| Option | Licence | Notes |
|---|---|---|
| [OpenDroneMap](https://opendronemap.org) via NodeODM | AGPL-3.0 | Reconstruction pipeline candidate; review the selected components and integration |
| [COLMAP](https://colmap.github.io) | BSD | Structure from motion, permissive, excellent |
| [OpenMVS](https://github.com/cdcseacave/openMVS) | AGPL-3.0 | Dense reconstruction. Check the licence against your product |
| [OpenMVG](https://github.com/openMVG/openMVG) | MPL-2.0 | Structure from motion with file-level copyleft |
| [MicMac](https://github.com/micmacIGN/micmac) | CeCILL-B | Reconstruction candidate; review its licence and external tools |

A batch boundary does not establish licence compliance. Review the selected
versions, modifications, dependencies, distribution and network interaction.
In particular, OpenMVS remains AGPL-licensed when paired with BSD-licensed
COLMAP. See [the licence table](/build/#licences-to-decide-before-you-write-integration-code)
and the [GNU licence FAQ](https://www.gnu.org/licenses/gpl-faq.html#UnreleasedModsAGPL)
before choosing a reconstruction integration.

### Getting a good reconstruction

| Parameter | Plan and verify |
|---|---|
| Forward and side overlap | Choose for the scene and required views; use [ODM collection guidance](https://docs.opendronemap.org/flying/) as a starting point |
| Altitude consistency | Compute height above the actual surface and check resulting GSD throughout the route |
| Shutter | Calculate motion smear from speed, exposure and GSD; inspect angular motion and vibration too |
| Illumination | Record lighting and shadow changes rather than assuming one sun angle works for every surface |
| Ground control | Design surveyed control and independent checkpoints for the required output accuracy |

See the [worked mapping example](/features/field-mapping#reproducible-planning-example)
for complete geometry, overlap, frame-count and exposure inputs. There is no
universal overlap percentage below which every reconstruction fails, and a
fixed shutter speed does not establish a pixel-blur limit for every camera.

### Runtime

No reconstruction-time benchmark is qualified here. The example's 770 planned
frames and approximately 1.63 cm/px GSD do not imply a fixed runtime. Before
sizing a [processing machine](/build/compute#processing), retain a benchmark
record with:

- Dataset identity or hash, actual image count and dimensions, sensor and scene.
- Exact ODM or alternative version, container digest, reconstruction options,
  output resolution and enabled stages.
- CPU, GPU and driver, RAM, storage, operating system and worker concurrency.
- Cold or warm run conditions, wall time, peak memory, per-stage results and
  output quality against independent checkpoints.

Use the measured record to plan capacity. Queue the workload with bounded
retries and retained stage outputs so a failed reconstruction does not erase
the source flight. Until that orchestration is implemented and qualified, this
is a design requirement rather than an unattended-service claim.

## Raster derivatives

These tools are available under open-source licences. Retain the required
notices and review the licences of the selected versions and dependencies.

| Layer | Tool | Note |
|---|---|---|
| Orthomosaic | ODM output, or per-frame projection | For many capabilities per-frame is enough. See below |
| DSM and DTM | ODM, or PDAL from the point cloud | The DTM is what drainage needs |
| Slope, aspect | `gdaldem` | One command |
| Flow accumulation, depressions | [WhiteboxTools](https://www.whiteboxgeo.com), [pysheds](https://github.com/mdbartos/pysheds), GRASS `r.watershed` | The drainage layer |
| Vegetation indices | rasterio plus numpy | Arithmetic |
| Reprojection | PROJ via pyproj or `gdalwarp` | |
| Web imagery | Cloud Optimized GeoTIFF plus overviews | See [Platform](/build/software/platform) |

### You often do not need a mosaic

A full photogrammetric stitch is expensive and, for several capabilities,
unnecessary. If every frame has an accurate pose, you can project its **corners
onto the ground** and place detections in field coordinates directly, then
deduplicate across overlap.

| Capability | Needs a stitch? |
|---|---|
| Field mapping | Yes. The stitch is the product |
| Disease, fertilisation | Yes, for continuous index maps |
| Weed control | No. Detections in field space are enough |
| Pest | No, on a fixed route |
| Wildlife | No. Points, not pictures |
| Yield counting | No, with careful de-duplication |
| Irrigation | Yes, and use RGB frames to solve the geometry for the thermal ones |

Skipping the mosaic where it is not needed is the single largest processing
cost saving available, and it also removes hours of latency between landing and
a usable result.

## Thermal alignment

Thermal frames over a uniform canopy have almost no features to match, so they
mosaic badly on their own. Fly an RGB camera alongside, solve the geometry from
the RGB frames, and apply that solution to the thermal frames using the fixed
transform between the two. It is the most useful trick in the whole thermal
pipeline.

## Publishing a stitch to the site

The web derivative, not the master:

```bash
gdal_translate -of WEBP -outsize 3000 0 -co QUALITY=82 ortho.tif ortho-web.webp
```

Then attach it to the flight record, with the footprint in the field's
normalised space:

```bash
buddy imagery:attach ./ortho-web.webp --bounds="-0.04,-0.03,1.05,1.02" --resolution 4
```

The footprint comes out of the GeoTIFF rather than being guessed: read the
geotransform, express the image's corners in the field's own bounding box, and
that is your `minX,minY,maxX,maxY`. See
[The field map](/guide/field-map#attaching-an-orthomosaic) for why the equals
sign is required and why the bounds matter.

## Quality gates

Write these as automated checks that fail the flight rather than as things
somebody notices later:

| Check | Fails when |
|---|---|
| Frame count against trigger count | A card wrote fewer frames than the aircraft triggered |
| Pose coverage | Any frame without an interpolated pose |
| RTK fix ratio | Below the project threshold, with per-frame uncertainty and checkpoint evidence retained |
| Checkpoint residual | Above the tolerance for the capability |
| Reconstruction coverage | Holes inside the boundary |
| Calibration present | A multispectral flight with no panel capture |
| Ground resolution | Achieved GSD outside the planned range |

A failed gate prevents publication of a qualified output. Retain the reason
and source data, then decide whether calibration, reprocessing or new
acquisition is needed. This gate list describes the intended qualification
workflow; see the [mapping implementation roadmap](https://github.com/theopenfarm/openfarm.ing/issues/6).
