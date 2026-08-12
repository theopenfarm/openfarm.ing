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
| [OpenDroneMap](https://opendronemap.org) via NodeODM | AGPL-3.0 | The complete pipeline: ortho, DSM, DTM, point cloud, multispectral support. Run it unmodified as a batch job |
| [COLMAP](https://colmap.github.io) | BSD | Structure from motion, permissive, excellent |
| [OpenMVS](https://github.com/cdcseacave/openMVS) | AGPL-3.0 | Dense reconstruction. Check the licence against your product |
| [OpenMVG](https://github.com/openMVG/openMVG) | MPL-2.0 | Permissive alternative for SfM |
| [MicMac](https://github.com/micmacIGN/micmac) | CeCILL-B | French national survey institute, permissive-ish, capable |

The AGPL question matters. Running unmodified ODM as an internal batch job that
produces files you then serve is the ordinary, uncontroversial path. Modifying
ODM and exposing it to customers over a network is where the network clause
bites. Decide this before the integration exists. See
[the licence table](/build/#licences-to-decide-before-you-write-integration-code).

### Getting a good reconstruction

| Parameter | Value | Consequence of getting it wrong |
|---|---|---|
| Forward overlap | 75 to 80% | Below 70%, reconstruction fails over uniform canopy |
| Side overlap | 65 to 70% | Stripes and holes |
| Altitude consistency | Terrain following | Varying ground resolution across the field |
| Shutter | 1/1000 s or faster | Motion blur that no processing recovers |
| Sun angle | Consistent, avoid low sun | Long shadows dominate the model |
| Ground control | RTK plus 3 to 5 independent checkpoints | You never find out the base coordinate was wrong |

### Runtime

Roughly 600 frames from 25 ha at 2.5 cm/px is 30 to 60 minutes on a
[mid-range GPU box](/build/compute#processing). Plan the pipeline as a queue
with retries, not as a synchronous request: a stitch that fails at minute 40
must not lose the flight.

## Raster derivatives

All of it is GDAL and numpy, and none of it needs a licence.

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
| RTK fix ratio | Less than 95% of frames on a fixed solution |
| Checkpoint residual | Above the tolerance for the capability |
| Reconstruction coverage | Holes inside the boundary |
| Calibration present | A multispectral flight with no panel capture |
| Ground resolution | Achieved GSD outside the planned range |

A flight that fails a gate is reflown. That is far cheaper than a prescription
built on a bad map, and the customer never sees it.
