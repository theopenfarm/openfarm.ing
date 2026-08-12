# Airframes

Four aircraft classes cover all 18 capabilities. Most farms and most operators
need two of them.

| Class | Mass | Payload | Covers |
|---|---|---|---|
| **A. Light survey** | 2 to 4 kg | 0.5 kg | Wildlife searches, bird deterrence, small block scouting |
| **B. Workhorse survey** | 5 to 8 kg | 1.5 to 3 kg | Field mapping, weed control, disease, fertilisation, irrigation, yield, pest, livestock |
| **C. Heavy lift** | 25 kg+ | 10 to 40 kg | Seeding, and spraying where an exemption applies |
| **D. Indoor** | under 1 kg | 0.1 kg | Pollination, glasshouse scouting |

Class B is the one to build or buy first. It carries every survey payload in
the catalog.

## Buy or build

| | Buy integrated | Build |
|---|---|---|
| Time to paid work | 2 to 4 weeks | 2 to 4 months |
| Cost, class B with multispectral | €4,500 to €12,000 | €3,000 to €6,000 |
| Sensor choice | Their payloads | Anything |
| Repairability | Their parts, their lead times | Any supplier |
| Regulatory paperwork | Class marking and manufacturer documentation already exist | Yours to produce |
| Support when it fails in April | A dealer | You |

The honest recommendation: **buy the first one, build the second.** A DJI
Mavic 3 Multispectral or Matrice-class aircraft gets you flying paid work
almost immediately and comes with a class marking that simplifies the Open
category case. Build when a payload you need is not sold on a turnkey aircraft,
which in practice means radiometric thermal at a sane price, high resolution
global-shutter RGB, or anything that has to sit on a dock you designed.

There is also a strategic argument for building: procurement rules in several
markets have been tightening around Chinese-manufactured aircraft for public
sector work. If you expect to fly for municipalities, forestry authorities or
publicly funded restoration, an aircraft you assembled from open hardware is
easier to defend.

## Class B parts list

A 5 to 7 kg quadcopter with 30 to 40 minutes endurance and a 2 kg payload.

| Part | Choice | EU source | US source | Indicative |
|---|---|---|---|---|
| Frame kit | [Holybro X500 V2](https://holybro.com/products/x500-v2-kits) or [Tarot X4](https://www.tarotrc.com) | [Drone Parts Center](https://www.drone-parts-center.com), [Unmanned Tech](https://www.unmannedtechshop.co.uk) | [GetFPV](https://www.getfpv.com), [RobotShop](https://www.robotshop.com) | €300 to €600 |
| Flight controller | [Pixhawk 6X](https://holybro.com/products/pixhawk-6x) or [Cube Orange+](https://www.cubepilot.com) | [Drone Parts Center](https://www.drone-parts-center.com) | [GetFPV](https://www.getfpv.com) | €250 to €400 |
| Motors and ESCs | [T-Motor MN series](https://store.tmotor.com) or [Hobbywing X-series](https://www.hobbywing.com) | [Globe Flight](https://www.globe-flight.de) | [GetFPV](https://www.getfpv.com) | €400 to €900 set |
| Propellers | Carbon, plus a full spare set | same | same | €80 to €200 |
| Battery, 6S 16000 mAh | [Tattu](https://genstattu.com) | [Globe Flight](https://www.globe-flight.de) | [GetFPV](https://www.getfpv.com) | €250 to €400 each |
| Charger | Dual channel, 1000 W+ | [Globe Flight](https://www.globe-flight.de) | [GetFPV](https://www.getfpv.com) | €200 to €500 |
| GNSS RTK | [ArduSimple simpleRTK2B](https://www.ardusimple.com/product/simplertk2b/) or [Here4](https://www.cubepilot.com) | [ArduSimple](https://www.ardusimple.com) | [SparkFun](https://www.sparkfun.com/products/16481) | €200 to €300 |
| Telemetry | **RFD868x in the EU**, RFD900x in the US | [RFDesign resellers](https://store.rfdesign.com.au) | [RFDesign](https://store.rfdesign.com.au) | €250 to €350 pair |
| RC link | ExpressLRS 868/915 as regionally permitted | [Globe Flight](https://www.globe-flight.de) | [GetFPV](https://www.getfpv.com) | €60 to €150 |
| Rangefinder | [LightWare SF000/B](https://lightwarelidar.com) or [Benewake TFmini-S](https://en.benewake.com) | [Antratek](https://www.antratek.de) | [RobotShop](https://www.robotshop.com) | €40 to €300 |
| Companion computer | [Raspberry Pi 5](https://www.raspberrypi.com/products/raspberry-pi-5/) or [Jetson Orin Nano](https://developer.nvidia.com/embedded/jetson-orin-nano-super-developer-kit) | [BerryBase](https://www.berrybase.de), [Antratek](https://www.antratek.de) | [The Pi Hut](https://thepihut.com), [Seeed](https://www.seeedstudio.com) | €90 to €300 |
| Payload mount | Vibration-isolated plate, printed or machined | any | any | €30 to €150 |
| Anti-collision light | Green flashing, required for night flight | [Globe Flight](https://www.globe-flight.de) | [GetFPV](https://www.getfpv.com) | €30 to €80 |
| Case | Hard case, foam cut to fit | [Peli](https://www.peli.com) via [Conrad](https://www.conrad.de) | [B&H](https://www.bhphotovideo.com) | €150 to €400 |

Roughly **€2,200 to €4,500** before the sensor. Add the
[sensor](/build/sensors) and the [positioning](/build/positioning) service.

## The frequency mistake, which is easy and expensive

Radio hardware sold as standard on drone parts sites is frequently US-band.

- **Telemetry:** 900 MHz modules (RFD900x) are **not legal in the EU**. Buy the
  868 MHz variant (RFD868x).
- **RC link:** 915 MHz ExpressLRS is US; the EU uses 868 MHz, with duty cycle
  limits.
- **Video:** the 5.8 GHz allocations differ by country and several channels
  used in FPV are not permitted for general use.

Check the band, then check the power limit, before ordering. This is the single
most common compliance failure on a self-built aircraft.

## Endurance, honestly

| Aircraft | Realistic flight time | Realistic coverage |
|---|---|---|
| Class A, 3 kg, light payload | 25 to 35 min | 15 to 40 ha at survey altitude |
| Class B, 6 kg, 1.5 kg payload | 25 to 35 min | 30 to 80 ha at 100 m, 6 to 12 ha at 1 cm/px |
| Class B with a big camera and wind | 18 to 25 min | Subtract a third |
| Class C loaded | 8 to 15 min | Sortie-limited, not area-limited |

Manufacturer figures are hover time at 20 °C with no payload and no wind. Plan
against two thirds of the advertised number, and hold 20% battery reserve or
you will eventually pay for an aircraft with a shortcut.

## Fixed wing and VTOL

For [field mapping](/features/field-mapping) over very large areas, a fixed
wing or VTOL covers several times the hectares per battery. It also cannot
hover, cannot fly at 15 m for weed detection, and needs more space to launch
and recover.

Worth it above roughly 300 hectares of contiguous mapping per outing, which in
practice means [cooperatives](/use-cases/operators#cooperatives-and-large-estates)
and [restoration sites](/use-cases/operators#reforestation-and-land-restoration).
Below that, a multirotor is more flexible and far cheaper to own.

## Maintenance, which decides your real cost per hectare

| Item | Interval | Cost |
|---|---|---|
| Propellers | Inspect every flight, replace every 50 to 100 flights or on any strike | €80 to €200 per set |
| Motors | Bearing check every 100 hours | €400 to €900 per set |
| Batteries | Log every cycle. Retire at 80% capacity, typically 150 to 300 cycles | €250 to €400 each |
| Airframe | Arm and mount inspection monthly | |
| Sensor calibration | Reflectance panel every flight, full calibration annually | |

Keep a per-airframe log with total hours, cycles per battery and every part
change. It is what turns "the drone cost €4,000" into a defensible cost per
hectare, and it is what an insurer or an authority will ask for.
