# Positioning

A detection is only useful if somebody can drive to it. This page is about
getting a centimetre-class position onto every frame without buying equipment
you do not need.

## What accuracy each capability actually needs

| Capability | Needed | Why |
|---|---|---|
| Wildlife search | 2 to 3 m | Somebody walks to a warm blob. Standard GNSS is fine |
| Bird deterrence | 2 to 3 m | |
| Livestock patrol | 2 to 3 m | |
| Disease, pest, fertilisation | 0.3 to 1 m | Zones are tens of metres across |
| Field mapping | 2 to 5 cm | Every later flight is registered against this base |
| Weed control | 2 to 5 cm | A prescription cell is metres across and the sprayer has its own error |
| Yield counting | 2 to 5 cm | Overlap de-duplication depends on knowing where each frame was |
| Seeding | 10 to 30 cm | The spread pattern is wider than the error |

Only half the catalog needs RTK. Do not put a €300 receiver and a correction
subscription on a wildlife aircraft.

## The three ways to get RTK

### 1. A network correction service. Start here

Somebody else's base stations, delivered over the internet as NTRIP.

| Service | Coverage | Cost |
|---|---|---|
| SAPOS | Germany, run by the state survey authorities | Varies by federal state. Several states publish it free of charge; check your Landesamt für Vermessung |
| [Centipede RTK](https://centipede.fr) | France and neighbouring countries, community run | Free |
| [RTK2go](https://rtk2go.com) | Worldwide, community casters of varying quality | Free |
| Commercial networks | Wide, guaranteed | €300 to €1,500 per year |
| [Onocoy](https://www.onocoy.com) | Growing, incentivised community network | Low |

For most of Germany and much of western Europe there is a free or cheap
correction stream within the 10 to 30 km baseline that RTK wants. This is
almost always the right answer.

### 2. Your own base station

Worth it when the site has no mobile data, when you fly the same site
constantly, or when you need a local reference for survey checkpoints.

| Item | EU source | US source | Indicative |
|---|---|---|---|
| [Emlid Reach RS3](https://emlid.com/reachrs3/) survey receiver | [Emlid](https://emlid.com) | [Emlid](https://emlid.com) | €2,500 to €3,300 |
| [ArduSimple simpleRTK2B](https://www.ardusimple.com/product/simplertk2b/) as a fixed base | [ArduSimple](https://www.ardusimple.com) | [SparkFun](https://www.sparkfun.com/products/16481) | €200 to €400 |
| Survey antenna and ground plane | [ArduSimple](https://www.ardusimple.com) | [SparkFun](https://www.sparkfun.com) | €100 to €300 |
| Radio link, 868 MHz in the EU | [RFDesign](https://store.rfdesign.com.au) | [RFDesign](https://store.rfdesign.com.au) | €250 pair |

A DIY base is a few hundred euro and works. The commercial receiver buys you a
known antenna phase centre, a tripod that survives a season, and a support
number in April.

### 3. Post-processed kinematic

Log raw observations on the aircraft, download a reference station's
observations afterwards, and solve on the ground with
[RTKLIB](https://www.rtklib.com) (BSD). No live link needed at all.

This is the right answer for
[restoration sites](/use-cases/operators#reforestation-and-land-restoration)
and anywhere with no coverage. It costs nothing but processing time, and German
SAPOS and many European networks publish RINEX observation files for exactly
this.

## Receivers

| Choice | Notes | EU source | US source | Indicative |
|---|---|---|---|---|
| [ArduSimple simpleRTK2B](https://www.ardusimple.com/product/simplertk2b/) | u-blox ZED-F9P, the standard | [ArduSimple](https://www.ardusimple.com) | [SparkFun](https://www.sparkfun.com/products/16481) | €200 to €300 |
| [SparkFun GPS-RTK-SD](https://www.sparkfun.com/products/16481) | Same chip, logs raw for PPK | [Mouser EU](https://eu.mouser.com) | [SparkFun](https://www.sparkfun.com) | €250 |
| [CubePilot Here4](https://www.cubepilot.com) | Integrates cleanly with a Cube flight controller | [Drone Parts Center](https://www.drone-parts-center.com) | [GetFPV](https://www.getfpv.com) | €250 to €350 |
| [Emlid Reach M2](https://emlid.com/reach/) | Rover with easy PPK workflow | [Emlid](https://emlid.com) | [Emlid](https://emlid.com) | €700 to €900 |

The antenna matters as much as the receiver. A multi-band antenna with a proper
ground plane, mounted away from the flight controller and the video
transmitter, is the difference between a fix and a float solution.

## Getting the position onto the frame

This is where accuracy is usually lost, not in the receiver.

| Step | What to do |
|---|---|
| Hardware trigger | Fire the shutter from the flight controller and log the event, or read the camera's hot shoe feedback |
| Interpolate | The exposure happens between GNSS epochs. Interpolate the trajectory to the exposure timestamp |
| Lever arm | Measure the offset from the antenna phase centre to the camera's optical centre and apply it. It is typically 10 to 25 cm, which is five times your RTK error |
| Orientation | The IMU's attitude at exposure, for projecting frame corners onto the ground |
| Verify | Ground checkpoints. Not the same points used to fix the solution |

Skipping the lever arm is the classic error. A 20 cm offset is an order of
magnitude larger than the 2 cm the receiver reports, and it is systematic, so
it does not average out.

## Checkpoints

Survey three to five permanent, identifiable points per site with a survey
receiver, once. Every subsequent flight can be checked against them in seconds,
and it is the only way to find out that the RTK was lying: an incorrectly
entered base coordinate produces a beautifully precise map in the wrong place,
and nothing in the reconstruction will tell you.

## In-house software

| Stage | What we run | Licence |
|---|---|---|
| NTRIP client | On the ground station or the companion computer | own code, or `str2str` from RTKLIB |
| PPK solving | [RTKLIB](https://www.rtklib.com) or [rtklib-explorer](https://github.com/rtklibexplorer/RTKLIB) | BSD |
| Geotagging | Trigger log plus trajectory, with lever arm and interpolation | own code |
| Coordinate transforms | PROJ, via pyproj or GDAL | MIT |
| Checkpoint reporting | Residuals per flight, stored with the mission | own code |

Storing the checkpoint residual on every `Mission` row costs nothing and turns
"is the map any good" into a number you can show a customer.
