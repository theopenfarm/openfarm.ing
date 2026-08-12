# Compute

Three tiers, with different jobs and very different economics.

| Tier | Job | Sizing |
|---|---|---|
| On board | Real-time detection, precision landing, dock logic | Only when a decision must be made in flight |
| Ground station | Flight control, live find map, first-pass triage | A laptop, or a tablet plus a radio |
| Processing | Stitching, model inference, prescription export | One GPU box. This is the one that replaces a licence |

## On board

**Most capabilities do not need it.** A prescription that gets loaded before
the next pass is fine processed on the ground within the hour, and every
on-board computer adds weight, heat, power draw and a failure mode.

Add it when the answer has to exist during the flight:

| Capability | Why on board |
|---|---|
| [Wildlife search](/features/wildlife-rescue) | The find map has to reach the ground crew now, not after landing |
| [Bird deterrence](/features/bird-deterrence) | The flock is leaving |
| [Weed control](/features/targeted-weed-control), spot spraying variant | Real-time nozzle control |
| [Autonomous docks](/features/autonomous-network) | Precision landing and the go/no-go logic |

| Option | Compute | Power | EU source | US source | Indicative |
|---|---|---|---|---|---|
| [Raspberry Pi 5](https://www.raspberrypi.com/products/raspberry-pi-5/) | CPU only | 5 to 12 W | [BerryBase](https://www.berrybase.de) | [The Pi Hut](https://thepihut.com) | €80 to €120 |
| Pi 5 plus [AI Kit](https://www.raspberrypi.com/products/ai-kit/) (Hailo-8L) | 13 TOPS | 8 to 15 W | [BerryBase](https://www.berrybase.de) | [The Pi Hut](https://thepihut.com) | €150 to €200 |
| [Jetson Orin Nano Super](https://developer.nvidia.com/embedded/jetson-orin-nano-super-developer-kit) | ~67 TOPS | 7 to 25 W | [Antratek](https://www.antratek.de), [Reichelt](https://www.reichelt.de) | [Seeed](https://www.seeedstudio.com), [Arrow](https://www.arrow.com) | €250 to €350 |
| [Seeed reComputer J4012](https://www.seeedstudio.com/reComputer-J4012-p-5586.html) (Orin NX 16 GB) | ~100 TOPS | 10 to 25 W | [Antratek](https://www.antratek.de) | [Seeed](https://www.seeedstudio.com) | €800 to €1,000 |
| [Luxonis OAK-D](https://shop.luxonis.com) | Camera plus accelerator in one | 5 W | [Luxonis](https://shop.luxonis.com) | [Luxonis](https://shop.luxonis.com) | €200 to €400 |

Budget the whole chain, not the board: a Jetson at 20 W for 30 minutes is 10 Wh
off the flight battery, which is a couple of minutes of endurance, plus a heat
sink and airflow that a sealed payload bay does not have.

### Making a model fit

| Step | Effect |
|---|---|
| Export to ONNX, then TensorRT or Hailo's compiler | 2 to 5x over naive PyTorch |
| INT8 quantisation with a calibration set | 2 to 4x again, usually under 1% accuracy loss |
| Right-size the input | 640 px inference on a 20 MP frame is a tiling decision, not a resize |
| Frame skip | 5 fps is plenty for a search at 5 m/s |

A quantised small detector runs comfortably at 15 to 30 fps on a Pi with the AI
Kit, which is more than a wildlife search needs.

## Ground station

| Item | Why | Indicative |
|---|---|---|
| Rugged laptop or tablet | Mission control, live map, sunlight readable | €400 to €2,000 |
| Telemetry radio | [RFD868x](https://store.rfdesign.com.au) in the EU | €250 to €350 |
| LTE router | Corrections in, findings out | €150 to €250 |
| Power | Enough for a full morning | €100 |

Software: [QGroundControl](http://qgroundcontrol.com) or Mission Planner will
do everything at the start. Write your own planner when the mission patterns
become capability-specific, which happens around the point you are flying the
same three route templates every week.

## Processing

This is the box that replaces the per-hectare licence, and it is the best value
purchase in the whole platform.

### What the work actually is

| Job | Bound by | Rough scale |
|---|---|---|
| Photogrammetry | CPU cores and RAM, GPU helps | 25 ha at 2.5 cm/px, roughly 600 frames, 30 to 60 min |
| Model inference | GPU | Thousands of frames per hour |
| Model training | GPU and VRAM | Hours to days, occasionally |
| Raster derivatives | CPU and disk | Minutes |

Photogrammetry is memory hungry. 64 GB is a sensible floor for real fields and
128 GB removes a whole class of failures.

### Build or rent

| Option | Cost | Notes |
|---|---|---|
| Own box: Ryzen 9 or Threadripper, 128 GB RAM, RTX 4090 or 5090, 4 TB NVMe | €3,000 to €6,000 once | Pays back against any per-hectare licence within one season |
| Used workstation plus one GPU | €1,200 to €2,500 | Perfectly adequate. Buy RAM, not clock speed |
| Dedicated GPU server, hosted | €150 to €600 per month | [Hetzner](https://www.hetzner.com) has GPU dedicated lines; check current models |
| Cloud GPU on demand | Per hour | Good for training bursts, expensive as a steady state |

The sane pattern: **own the steady state, rent the bursts.** One box handles
daily flights; rent cloud GPU for the week you retrain a model.

### Storage

| Layer | Holds | Sizing |
|---|---|---|
| Hot | This week's flights, raw frames | 2 to 8 TB NVMe |
| Warm | Orthomosaics and index rasters as Cloud Optimized GeoTIFF | 10 to 50 TB spinning disk or object storage |
| Cold | Raw frames older than a season | Cheap archive, or delete after the derived products are verified |

One 25 hectare flight at 2.5 cm/px is roughly 600 frames at 25 MB, so about
15 GB raw, and 1 to 3 GB of derived products. A busy operator flying 40 fields
a week generates several terabytes a season. Decide the raw frame retention
policy on day one, in writing, and put it in the customer contract.

Object storage: an S3-compatible store keeps the code portable.
[SeaweedFS](https://github.com/seaweedfs/seaweedfs) (Apache-2.0) and
[Garage](https://garagehq.deuxfleurs.fr) are the permissive self-hosted
options; MinIO is AGPL-3.0, which matters if you modify it. See
[Platform](/build/software/platform).

## Where this repository sits

The site and the API described in the [guide](/guide/architecture) run as a
tenant on a shared box and want to answer in milliseconds. The processing
pipeline wants a GPU and hours of wall clock. Keep them apart: the only
contract between them is the flight record. See
[Deployment](/guide/deployment#where-the-flight-pipeline-would-run).
