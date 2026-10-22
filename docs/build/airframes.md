# Airframes

These four working classes organise the build requirements for the 19 planned
capabilities. The mass and payload bands below are planning categories, not
certified aircraft specifications or proof that one aircraft can carry every
payload.

| Class | Mass | Payload | Covers |
|---|---|---|---|
| **A. Light survey** | 2 to 4 kg | 0.5 kg | Wildlife searches, bird deterrence, small block scouting |
| **B. Workhorse survey** | 5 to 8 kg | 1.5 to 3 kg | Field mapping, weed control, disease, fertilisation, irrigation, yield, pest, livestock |
| **C. Heavy lift** | 25 kg+ | 10 to 40 kg | Seeding, and spraying where an exemption applies |
| **D. Indoor** | under 1 kg | 0.1 kg | Pollination, glasshouse scouting |

Choose an aircraft only after weighing the complete payload, mount, power
conversion and flight battery. A class label does not establish payload
compatibility, endurance or operational approval.

## Buy or build

| | Buy integrated | Build |
|---|---|---|
| Preparation | Manufacturer setup and operator qualification | Assembly, integration, testing and operator qualification |
| Cost | Obtain a quote for the complete aircraft and payload | Quote a matched build, including tools, spares and integration time |
| Sensor choice | Check the supported payload and trigger interfaces | Verify mechanical, electrical, timing and software interfaces |
| Repairability | Check part availability and repair terms | Record each selected component and its replacement procedure |
| Regulatory paperwork | Check the exact model, marking and intended operation | Establish the requirements for the assembled aircraft and operation |
| Support | Dealer or manufacturer, subject to contract | Your team and component suppliers |

Compare integrated and custom aircraft against the same payload and mission.
Neither route guarantees a date for paid work or permission to operate. For
public-sector procurement, check the buyer's current eligibility requirements
for the complete system; assembling open hardware does not establish compliance.

## Class B parts list

A 5 to 7 kg quadcopter carrying a 2 kg payload for 30 to 40 minutes is a
proposed design target. The parts below are component categories, not a
compatible, tested bill of materials. Select the airframe, propulsion,
propellers, battery voltage and payload together, then measure endurance with
the complete aircraft. The price ranges do not establish that target.

The Holybro X500 V2 is a separate, smaller development platform. Its
[manufacturer specification](https://holybro.com/products/px4-development-kit-x500-v2)
lists about 18 minutes of hover with no additional payload, tested with a
5000 mAh battery, and recommends a 4S 3000 to 5000 mAh battery. The listed
1500 g payload figure excludes the battery and is specified at 70% throttle;
it is not a 1500 g sensor allowance with an installed flight battery. Do not
combine the stock X500 powertrain with the 6S battery example below or infer
Class B endurance from it.

For a Pi 5 development build, start with the shared library's
[Pi hardware guide](https://github.com/stacksjs/drone/blob/main/docs/hardware.md)
and [camera bring-up](https://github.com/stacksjs/drone/blob/main/docs/raspberry-pi.md).
A Pi AI Camera person detector is not a calibrated multispectral sensor or a
qualified mapping payload.

| Part | Choice | EU source | US source | Indicative |
|---|---|---|---|---|
| Frame kit | Select a documented frame and propulsion combination for the declared all-up mass; no Class B kit is qualified here | [Drone Parts Center](https://www.drone-parts-center.com), [Unmanned Tech](https://www.unmannedtechshop.co.uk) | [GetFPV](https://www.getfpv.com), [RobotShop](https://www.robotshop.com) | Obtain a matched-build quote |
| Flight controller | [Pixhawk 6X](https://holybro.com/products/pixhawk-6x) or [Cube Orange+](https://www.cubepilot.com) | [Drone Parts Center](https://www.drone-parts-center.com) | [GetFPV](https://www.getfpv.com) | €250 to €400 |
| Motors and ESCs | [T-Motor MN series](https://store.tmotor.com) or [Hobbywing X-series](https://www.hobbywing.com) | [Globe Flight](https://www.globe-flight.de) | [GetFPV](https://www.getfpv.com) | €400 to €900 set |
| Propellers | Carbon, plus a full spare set | same | same | €80 to €200 |
| Battery, 6S 16000 mAh | [Tattu](https://genstattu.com) | [Globe Flight](https://www.globe-flight.de) | [GetFPV](https://www.getfpv.com) | €250 to €400 each |
| Charger | Match battery chemistry, cell count, charge rate and available input power | [Globe Flight](https://www.globe-flight.de) | [GetFPV](https://www.getfpv.com) | €200 to €500 |
| GNSS RTK | [ArduSimple simpleRTK2B](https://www.ardusimple.com/product/simplertk2b/) or [Here4](https://www.cubepilot.com) | [ArduSimple](https://www.ardusimple.com) | [SparkFun](https://www.sparkfun.com/products/16481) | €200 to €300 |
| Telemetry | Select a locally permitted RFD868x or RFD900x configuration | [RFDesign resellers](https://store.rfdesign.com.au) | [RFDesign](https://store.rfdesign.com.au) | €250 to €350 pair |
| RC link | ExpressLRS 868/915 as regionally permitted | [Globe Flight](https://www.globe-flight.de) | [GetFPV](https://www.getfpv.com) | €60 to €150 |
| Rangefinder | [LightWare SF000/B](https://lightwarelidar.com) or [Benewake TFmini-S](https://en.benewake.com) | [Antratek](https://www.antratek.de) | [RobotShop](https://www.robotshop.com) | €40 to €300 |
| Companion computer | [Raspberry Pi 5](https://www.raspberrypi.com/products/raspberry-pi-5/) or [Jetson Orin Nano](https://developer.nvidia.com/embedded/jetson-orin-nano-super-developer-kit) | [BerryBase](https://www.berrybase.de), [Antratek](https://www.antratek.de) | [The Pi Hut](https://thepihut.com), [Seeed](https://www.seeedstudio.com) | €90 to €300 |
| Payload mount | Vibration-isolated plate, printed or machined | any | any | €30 to €150 |
| Anti-collision light | Select for the jurisdiction and operation | [Globe Flight](https://www.globe-flight.de) | [GetFPV](https://www.getfpv.com) | €30 to €80 |
| Case | Hard case, foam cut to fit | [Peli](https://www.peli.com) via [Conrad](https://www.conrad.de) | [B&H](https://www.bhphotovideo.com) | €150 to €400 |

The euro ranges in this table are unverified budgeting allowances, retained
as planning assumptions on 22 October 2026. They are not current supplier
quotes, and exclude tax, shipping, tools, spares and integration labour. They
do not establish a total build price. Obtain a complete matched-build quote,
including the [sensor](/build/sensors), battery, power conversion and
[positioning](/build/positioning) service.

## The frequency mistake, which is easy and expensive

A product name or an EU/US shop listing does not establish permission to use
a radio. Check the exact frequency, firmware region, antenna, effective radiated
power and duty cycle against the rules at the operating location before ordering.
The same check applies to telemetry, RC and video. The supplier links above are
sourcing leads, not a declaration of regional compliance. See
[Regulation](/build/regulation) for the operational planning context.

## Endurance, honestly

No class-wide endurance or hectare figure is qualified here. Measure the
complete aircraft with the selected battery, payload, reserve policy and
mission profile. Record all-up mass, battery condition, temperature, wind,
altitude, speed, takeoff/landing energy and the termination condition. Read a
manufacturer's figure with its stated test conditions; do not assume every
advertised result is an unloaded hover test.

Estimate coverage from camera footprint, overlap and usable route distance.
The [worked mapping example](/features/field-mapping#reproducible-planning-example)
gives the geometry and image count for one declared case. It does not measure
flight endurance. Deduct transit, turns, terrain following and reserve from any
measured flight-time budget before deciding how much field fits in one sortie.

## Fixed wing and VTOL

A conventional fixed-wing aircraft needs forward airspeed and cannot hover.
A hybrid VTOL can take off vertically, hover in its multicopter mode and
transition to wing-borne flight. The [PX4 VTOL guide](https://docs.px4.io/main/en/frames_vtol/)
describes those modes and their configuration requirements. Launch, recovery,
transition space and low-altitude suitability depend on the chosen aircraft
and mission.

For large contiguous [mapping blocks](/features/field-mapping), compare the
measured performance of the candidate aircraft over the same route, resolution,
overlap, payload, wind and reserve. There is no supported 300-hectare purchase
threshold. [Cooperatives](/use-cases/operators#cooperatives-and-large-estates)
and [restoration sites](/use-cases/operators#reforestation-and-land-restoration)
may benefit from that comparison, but area alone does not choose an aircraft.
These aircraft descriptions do not establish VTOL support in our owned runtime;
see the [flight stack](/build/software/flight-stack).

## Maintenance, which decides your real cost per hectare

| Item | What the maintenance plan must define |
|---|---|
| Propellers | Preflight inspection, damage limits and replacement instructions for the selected propeller |
| Motors | Bearing, fastener and temperature checks specified for the installed motor and operating conditions |
| Batteries | Logged cycles, measured capacity, cell balance, damage limits and the manufacturer's retirement criteria |
| Airframe | Arm, joint and payload-mount checks, including checks after a strike or hard landing |
| Sensor calibration | The selected sensor's panel captures, calibration procedure and recalibration triggers |

A universal flight count, hour interval or remaining-capacity percentage is not
a substitute for component instructions and condition checks. Keep a per-airframe
log of hours, battery cycles, inspections, findings and part changes. Use those
records and actual invoices to calculate cost per hectare.
