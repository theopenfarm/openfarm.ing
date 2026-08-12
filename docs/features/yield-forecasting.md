# Yield forecasting

> Count what is actually out there

Drones count plants, fruit or ears and turn the counts into a yield estimate
for each part of the field.

| | |
|---|---|
| Category | Detect |
| Slug | `yield-forecasting` |
| Cadence | Once at establishment, then at two or three points through grain fill or fruit set |
| Payload | High resolution RGB, multispectral, RTK |
| Needs a visit first | No |

## The problem

Harvest planning, storage booking and forward selling all run on an estimate,
and the estimate usually comes from a hand count in a few square metres
extrapolated across a hundred hectares. A bad estimate books the wrong number
of trailers and sells grain that is not there.

## How it works

| Step | What happens |
|---|---|
| Fly low | A high resolution pass captures individual plants, ears or fruit at a density the model can count |
| Count | Objects are counted per square metre and the counts are aggregated by zone rather than averaged flat |
| Model | Counts are combined with your variety, row spacing and historical yields to produce an estimate range |
| Update | The forecast is re-run on each later flight, so the range narrows as harvest approaches |

## What you get

- Plant or fruit count per zone
- Yield estimate with a range
- Establishment gap map
- Harvest sequencing suggestion

## What the dashboard measures

- Counted objects per square metre
- Estimate range width
- Gap area as a share of the field
- Estimate against final weighbridge

The last one is the only honest measure of this capability, and it arrives once
a year. Record it every year without exception: it is what makes next season's
range credible.

## Where it matters most

[Winter wheat](/use-cases/arable#winter-wheat-and-barley),
[maize](/use-cases/arable#maize),
[orchards](/use-cases/permanent#orchards),
[berries](/use-cases/permanent#soft-fruit-and-berries),
[cooperatives](/use-cases/operators#cooperatives-and-large-estates).

## Build it

### Two different products under one name

Be clear about which one you are building. They have different economics.

| | Counting | Estimating |
|---|---|---|
| Question | How many plants, ears, fruit are here | How many tonnes will come off |
| Method | Object detection over high resolution frames | A model relating counts to weight |
| Accuracy | Good, and verifiable immediately | Depends on a season of calibration |
| Sells to | Anyone deciding to redrill, replant or book pickers | Anyone selling forward |

Counting is buildable in a season. Estimating needs a calibration set of counts
paired with weighbridge tickets, which is a second season. Ship counting, and
be honest that estimates start wide.

### Flight parameters

| Crop | Target | Altitude |
|---|---|---|
| Cereal establishment | Plants per m² | 10 to 15 m, 0.3 to 0.5 cm/px |
| Cereal ear counting | Ears per m² | 5 to 10 m, or a ground rig |
| Maize establishment | Plants per row metre | 20 to 30 m, 0.7 cm/px |
| Orchard fruit | Fruit per tree | 8 to 15 m, oblique passes both sides of the row |
| Berries | Fruit per plant, per flush | 5 to 10 m under tunnel headroom |

Note the altitudes: ear counting is at the edge of what a multirotor can do
safely over a standing crop, and orchard counting wants oblique views rather
than nadir, because the fruit is on the sides of the canopy. Both push you
toward a smaller aircraft flying transects rather than a survey grid.

### Hardware

| Item | Why | EU source | US source | Indicative |
|---|---|---|---|---|
| High resolution RGB, global shutter | Counting at 0.3 cm/px is unforgiving of motion blur | [Sony ILX-LR1](https://pro.sony/en_GB/products/industrial-cameras/ilx-lr1) | [B&H](https://www.bhphotovideo.com) | €2,500 to €3,200 |
| Compact alternative | 12 MP, tiny, good enough for maize and orchards | [Raspberry Pi GS camera](https://www.raspberrypi.com/products/raspberry-pi-global-shutter-camera/) at [BerryBase](https://www.berrybase.de) | [Adafruit](https://www.adafruit.com) | €55 plus lens |
| Small airframe | Low, slow, close to the canopy | [Holybro X500 V2](https://holybro.com/products/x500-v2-kits) | [GetFPV](https://www.getfpv.com) | €400 to €600 |
| Precision rangefinder | Constant AGL is what keeps the count per m² honest | [LightWare SF000/B](https://lightwarelidar.com) | [RobotShop](https://www.robotshop.com) | €200 to €300 |
| Calibration frames | Quadrats hand counted on the ground, the ground truth for everything | wire and paint | same | negligible |
| Gimbal for oblique work | Orchard and vineyard counting needs a side view | [Gremsy](https://gremsy.com) or a fixed 45 degree mount | [GetFPV](https://www.getfpv.com) | €0 to €900 |

### In-house software

| Stage | What we run | Licence | Replaces |
|---|---|---|---|
| Detection or density | Point-supervised counting (density map regression) rather than boxes | own code, PyTorch BSD | commercial counting services |
| Tiled inference | [SAHI](https://github.com/obss/sahi) over full-resolution frames | MIT | |
| Overlap de-duplication | Project counts to ground coordinates, deduplicate in the overlap | own code | |
| Aggregation | Counts per zone using the zone layer from [fertilisation](/features/precision-fertilisation) | own code | |
| Estimation | Regression from counts and indices to weighbridge tonnes, per crop and variety | scikit-learn, BSD | |
| Range | Quantile regression or a bootstrap over the calibration set. Publish an interval, never a point | own code | |

Density map regression is the right choice for dense objects like wheat ears.
Labelling a box around each of 400 ears in a frame is unaffordable; clicking a
dot on each is not, and the dot is all a density model needs.

### Cost efficiency

- **De-duplicate, or you will double count.** At 70% overlap, every object
  appears in three frames. This bug is easy to ship and hard to notice, because
  the number is merely wrong rather than obviously broken. Validate against
  hand-counted quadrats every single season.
- **Publish a range, always.** A point estimate that is 12% out destroys trust
  in the whole platform. A range that contains the answer builds it. This is a
  product decision that costs nothing.
- **Hand counts are your cheapest asset.** Twenty quadrats per field costs an
  afternoon and calibrates everything. Build the capture form first.
- **Sell the decision, not the number.** Nobody buys "an estimate". They buy
  "book six trailers instead of eight", "redrill these 3.1 ha", "the pickers
  come Thursday".
