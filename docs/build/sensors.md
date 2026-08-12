# Sensors

The payload is what a flight is. This page covers the four sensor families the
catalog uses, at three budgets each.

| Family | Capabilities that need it |
|---|---|
| [RGB](#rgb) | Field mapping, weed control, yield, pest, compaction, bird deterrence |
| [Multispectral](#multispectral) | Disease, fertilisation, pest, compaction, yield |
| [Thermal](#thermal) | Irrigation, wildlife, frost, livestock |
| [LiDAR](#lidar) | Field mapping under canopy, canopy height |

## RGB

The workhorse. Resolution and shutter type matter more than anything else.

| Budget | Choice | EU source | US source | Indicative |
|---|---|---|---|---|
| Entry | [Raspberry Pi Global Shutter Camera](https://www.raspberrypi.com/products/raspberry-pi-global-shutter-camera/) plus C-mount lens | [BerryBase](https://www.berrybase.de), [Tinytronics](https://www.tinytronics.nl) | [Adafruit](https://www.adafruit.com), [The Pi Hut](https://thepihut.com) | €55 plus €40 lens |
| Entry+ | [Arducam](https://www.arducam.com) 64 MP or IMX477 modules | [Eckstein](https://eckstein-shop.de) | [Arducam](https://www.arducam.com) | €40 to €120 |
| Mid | Used Sony a6000 or a6400, 24 MP APS-C, mechanical shutter | [Kamera Express](https://www.kameraexpress.de), [MPB](https://www.mpb.com) | [B&H used](https://www.bhphotovideo.com), [KEH](https://www.keh.com) | €300 to €700 |
| Pro | [Sony ILX-LR1](https://pro.sony/en_GB/products/industrial-cameras/ilx-lr1), 61 MP, built for aerial | Sony industrial dealers | [B&H](https://www.bhphotovideo.com) | €2,500 to €3,200 |

### What actually matters

| Property | Why |
|---|---|
| Global or mechanical shutter | A rolling shutter skews every frame on a moving aircraft. Photogrammetry has to model the skew instead of measuring ground |
| Fixed focus, fixed focal length | Zoom and autofocus break the camera model the reconstruction depends on. Tape the focus ring |
| Fast shutter | Motion blur under half a pixel. At 10 m/s and 1 cm/px that means 1/1000 s or faster |
| Hardware trigger with a log event | Geotagging from RTK needs the exposure timestamp, not the file timestamp |
| Lens quality | An excellent sensor behind a poor lens is a poor camera. Vignetting and distortion are correctable, softness is not |

### Ground resolution

```
GSD (cm/px) = altitude (m) x sensor pixel pitch (µm) / focal length (mm) / 10
```

| Sensor | Lens | Altitude for 1 cm/px | Altitude for 2.5 cm/px |
|---|---|---|---|
| 24 MP APS-C (3.9 µm) | 24 mm | 62 m | 154 m |
| 61 MP full frame (3.76 µm) | 35 mm | 93 m | 233 m |
| Pi GS (3.45 µm) | 8 mm | 23 m | 58 m |
| Pi GS | 16 mm | 46 m | 116 m |

This table is why the cheap sensor is not free. Coverage is swath times speed,
and swath is pixels across times ground resolution. At 1 cm/px the Pi camera's
swath is 14.6 m against the 24 MP camera's 60 m, so it covers roughly a quarter
of the ground per battery and flies a third of the altitude to do it.

## Multispectral

Five bands, calibrated, with a downwelling light sensor. See
[disease detection](/features/plant-disease-detection#what-multispectral-has-to-mean)
for the band table and why calibration is not optional.

| Budget | Choice | EU source | US source | Indicative |
|---|---|---|---|---|
| DIY | Two or three [MAPIR Survey3W](https://www.mapir.camera/collections/survey3) bodies (OCN, NIR, RGB) plus an [AS7265x](https://www.sparkfun.com/products/15050) light sensor | [MAPIR](https://www.mapir.camera), [Mouser EU](https://eu.mouser.com) | [MAPIR](https://www.mapir.camera), [SparkFun](https://www.sparkfun.com) | €1,000 to €2,000 |
| Integrated aircraft | [DJI Mavic 3 Multispectral](https://ag.dji.com/mavic-3-m) | [Solectric](https://www.solectric.de) and DJI Enterprise dealers | [Advexure](https://advexure.com) | €4,500 to €7,000 complete |
| Pro payload | [MicaSense RedEdge-P](https://ageagle.com/drone-sensors/rededge-p-high-res-multispectral-camera/) | AgEagle EU dealers | [AgEagle](https://ageagle.com) | €9,000 to €18,000 |
| Pro alternative | [Sentera 6X](https://sentera.com) | [Sentera](https://sentera.com) | [Sentera](https://sentera.com) | €8,000 to €15,000 |
| Thermal plus multispectral | [MicaSense Altum-PT](https://ageagle.com/drone-sensors/) | AgEagle EU dealers | [AgEagle](https://ageagle.com) | €15,000 to €25,000 |

The DIY route works and is genuinely used in research, but budget for the band
registration work: separate bodies mean separate lenses, separate viewpoints
and a per-frame alignment step that the integrated cameras do in hardware. It
is a week of engineering plus permanent calibration discipline to save several
thousand euro. Worth it once, as a way of understanding the pipeline. Rarely
worth it as the production payload.

### The calibration kit, which nobody budgets for

| Item | Purpose | Source | Cost |
|---|---|---|---|
| Reflectance panel | The reference every frame is scaled against | [MAPIR](https://www.mapir.camera/products/mapir-camera-reflectance-calibration-ground-target-package) | €150 to €400 |
| Downwelling light sensor | Illumination per band per frame | Bundled on pro cameras, [AS7265x](https://www.sparkfun.com/products/15050) for DIY | €0 to €70 |
| Panel handling | Keep it clean, keep it flat, never touch the surface | | |

An uncalibrated multispectral flight is a picture. A calibrated one is a
measurement. The whole
[change detection](/features/plant-disease-detection#how-it-works) argument
depends on which one you have.

## Thermal

Radiometric, always. A palette JPEG has thrown the measurement away.

| Budget | Choice | EU source | US source | Indicative |
|---|---|---|---|---|
| Entry | [FLIR Lepton 3.5](https://groupgets.com/products/flir-lepton-3-5), 160 x 120 radiometric | [Mouser EU](https://eu.mouser.com) | [GroupGets](https://groupgets.com), [SparkFun](https://www.sparkfun.com) | €200 to €400 |
| Mid | [InfiRay / Xinfrared](https://www.infiray.com) 256 or 384 modules | [Antratek](https://www.antratek.de) and module distributors | [GroupGets](https://groupgets.com) | €500 to €1,200 |
| Mid+ | [FLIR Boson+](https://www.flir.com/products/boson-plus/) 640 x 512 | [Mouser EU](https://eu.mouser.com) | [FLIR](https://www.flir.com), [GroupGets](https://groupgets.com) | €2,500 to €5,000 |
| Pro dual | [FLIR Hadron 640R](https://www.flir.com/products/hadron-640r/), thermal plus RGB in one module | [Mouser EU](https://eu.mouser.com) | [FLIR](https://www.flir.com) | €3,000 to €6,000 |
| Turnkey payload | [Workswell WIRIS](https://www.drone-thermal-camera.com) | [Workswell](https://www.drone-thermal-camera.com) | resellers | €6,000 to €14,000 |
| Integrated aircraft | [DJI Mavic 3 Thermal](https://enterprise.dji.com/mavic-3-enterprise) | [Solectric](https://www.solectric.de) | [Advexure](https://advexure.com) | €4,000 to €6,500 |

### Resolution buys hectares

Thermal cores share a 12 µm pixel pitch, so with a lens matched to the array,
doubling the pixels across doubles both the usable altitude and the swath. Area
per battery is swath times speed, so it roughly doubles too.

| Sensor | Lens | Altitude for 5 cm/px | Swath |
|---|---|---|---|
| 160 x 120 | 5.7 mm | ~24 m | 8 m |
| 320 x 256 | 9 mm | ~38 m | 16 m |
| 640 x 512 | 13 mm | ~55 m | 32 m |

That table is the whole argument for the 640 sensor on a
[wildlife search](/features/wildlife-rescue), where the operating window is two
hours long.

### Export control

Thermal cores above certain resolution and frame rate thresholds are export
controlled in both the US and the EU. Buying a 640 x 512 core is routine but
involves paperwork and end-use statements. Buying from an EU distributor into
the EU removes most of it.

## LiDAR

Only two capabilities genuinely need it: canopy height for
[weed control](/features/targeted-weed-control) discrimination, and
[field mapping](/features/field-mapping) where a canopy hides the ground.
Photogrammetry cannot see under trees; LiDAR can.

| Budget | Choice | EU source | US source | Indicative |
|---|---|---|---|---|
| Height hold only | [Benewake TFmini-S](https://en.benewake.com) or [TF-Luna](https://en.benewake.com) | [Antratek](https://www.antratek.de), [Eckstein](https://eckstein-shop.de) | [RobotShop](https://www.robotshop.com) | €25 to €50 |
| Precision AGL | [LightWare SF000/B](https://lightwarelidar.com) | [Antratek](https://www.antratek.de) | [RobotShop](https://www.robotshop.com) | €200 to €300 |
| Mapping | [Livox Mid-360](https://www.livoxtech.com/mid-360) | [Drone Parts Center](https://www.drone-parts-center.com) | [RobotShop](https://www.robotshop.com) | €700 to €900 |
| Survey grade | [Livox Avia](https://www.livoxtech.com/avia) with an IMU and post-processed trajectory | [Livox distributors](https://www.livoxtech.com) | [Livox distributors](https://www.livoxtech.com) | €1,500 to €4,000 |

A cheap LiDAR gives you points. **Survey-grade LiDAR is an IMU problem, not a
laser problem**: without a tightly coupled inertial and GNSS trajectory, the
point cloud is precise and inaccurate. Budget for the IMU and the
post-processing, or buy the height-hold sensor and use photogrammetry for the
map.

## Choosing for each capability

| Capability | Minimum useful | Recommended |
|---|---|---|
| Field mapping | Pi GS camera | 24 MP APS-C, mechanical shutter |
| Weed control | 24 MP APS-C at 15 m | 61 MP at 40 m, plus canopy LiDAR |
| Disease | DIY three-band | Calibrated five band with DLS |
| Fertilisation | Same as disease | Same as disease |
| Irrigation | 320 x 256 radiometric | 640 x 512 radiometric plus RGB for alignment |
| Wildlife | 320 x 256 radiometric | 640 x 512 radiometric |
| Frost | 320 x 256 plus an air probe | 640 x 512 plus a logger network |
| Yield | 24 MP APS-C | 61 MP, global shutter |
| Pest | Shares the disease and weed payload | |
| Compaction | No sensor of its own | |
| Livestock | 320 thermal plus any RGB | 640 thermal plus a zoom RGB block |
| Bird deterrence | Fixed block cameras | Fixed cameras plus a small fast aircraft |
