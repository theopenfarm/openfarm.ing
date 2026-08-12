# Docks

A dock is what turns a scouting service into
[an autonomous network](/features/autonomous-network). It is also the point
where the regulatory work becomes larger than the engineering work.

Read [Regulation](/build/regulation) before costing anything on this page.

## What a dock has to do

| Function | The hard part |
|---|---|
| Open and close | A moving lid outdoors for years, in wind, ice and dust |
| Precision land | GNSS alone lands within a metre. A dock needs centimetres |
| Charge | Contact pads need alignment; wireless needs money |
| Condition | Dry and warm the aircraft, or the next dawn flight starts iced |
| Report weather | The go decision comes from the dock, not the forecast |
| Fail safe | A dock that cannot close must not launch |
| Connect | LTE, with enough local autonomy to survive a dropped link |

## Buy or build

| | Turnkey | DIY |
|---|---|---|
| Example | [DJI Dock 3](https://enterprise.dji.com/dock-3) | Enclosure, actuator, charger, marker, compute |
| Supplier | [Solectric](https://www.solectric.de) and DJI Enterprise dealers (EU), [Advexure](https://advexure.com) (US) | See the parts list below |
| Cost | €15,000 to €40,000 with aircraft | €2,000 to €6,000 plus your own aircraft |
| Time to first flight | Weeks | Months |
| Environmental testing | Done | Yours |
| Payload choice | Their aircraft, their payloads | Anything you can build |
| Authorisation case | Manufacturer documentation supports it | You write the safety case from scratch |

Buy the first one. The capability's value is the schedule it keeps, and proving
that on somebody else's hardware is far cheaper than discovering your lid
mechanism seizes at -5 °C in February. Build docks afterwards, for payloads the
turnkey systems do not carry, above all
[radiometric thermal](/features/wildlife-rescue) and
[calibrated multispectral](/features/plant-disease-detection).

Other turnkey vendors worth quoting: [Heisha](https://www.heishatech.com)
(airframe-agnostic charging pads and enclosures), and the dock lines from the
major enterprise UAS manufacturers.

## DIY parts list

| Item | Choice | EU source | US source | Indicative |
|---|---|---|---|---|
| Enclosure, IP66, 800 mm class | Steel or GRP cabinet | [Rittal](https://www.rittal.com), [Fibox](https://www.fibox.com) via [Reichelt](https://www.reichelt.de) | [DigiKey](https://www.digikey.com) | €300 to €900 |
| Lid actuators | Linear, IP65, with limit switches | [Igus](https://www.igus.eu) | [ServoCity](https://www.servocity.com) | €150 to €400 |
| Landing pad | Centring funnel or V-rails, plus contacts | fabricate | fabricate | €100 to €300 |
| Charging contacts | Spring-loaded pins, gold plated | [Mouser EU](https://eu.mouser.com) | [DigiKey](https://www.digikey.com) | €50 to €150 |
| Wireless charging | If contact alignment defeats you | [WiBotic](https://www.wibotic.com) | [WiBotic](https://www.wibotic.com) | €2,000 to €4,000 |
| Battery charger | The aircraft's own, mounted and controlled | manufacturer | manufacturer | €200 to €500 |
| Precision landing marker | Printed AprilTag plus an IR beacon | print, [IR-LOCK](https://irlock.com) | [IR-LOCK](https://irlock.com) | €30 to €200 |
| Dock computer | Pi 5, or an industrial fanless PC | [BerryBase](https://www.berrybase.de) | [The Pi Hut](https://thepihut.com) | €90 to €500 |
| Weather station | Wind, rain, temperature, humidity | [Davis Vantage Pro2](https://www.davisinstruments.com), or an anemometer plus [SHT45](https://eu.mouser.com) | [Davis](https://www.davisinstruments.com) | €80 to €1,200 |
| Router, dual SIM failover | [Teltonika RUTX11](https://teltonika-networks.com/products/routers/rutx11) | [Teltonika resellers](https://teltonika-networks.com) | [SparkFun](https://www.sparkfun.com) | €200 to €300 |
| Heater and dehumidifier | Cabinet heater with a hygrostat | [Reichelt](https://www.reichelt.de) | [DigiKey](https://www.digikey.com) | €60 to €200 |
| Solar and battery, off grid | 600 W panel, 200 Ah LiFePO4, MPPT | [Victron](https://www.victronenergy.com) via [Antratek](https://www.antratek.de) | [RobotShop](https://www.robotshop.com) | €900 to €2,500 |
| UPS, on grid | Ride through a brownout mid-cycle | [Reichelt](https://www.reichelt.de) | [DigiKey](https://www.digikey.com) | €150 to €400 |
| Camera, internal and external | See the aircraft, see the site | any IP camera | any | €80 to €300 |

## Precision landing

The one part that must work every time. Layer it:

1. **RTK approach** to about 1 m.
2. **Visual marker** from 15 m down: an AprilTag or ArUco pattern read by a
   downward camera, driving ArduPilot's or PX4's precision landing mode.
3. **IR beacon** as the low-light and wet-lens fallback.
4. **Mechanical centring** for the last few centimetres: a funnel or V-rails
   that pull the aircraft into alignment as it settles.

Mechanical centring is what makes contact charging viable. Do not try to land
on pads with software alone.

## Siting

The single highest-value hour of a deployment.

| Consideration | Rule of thumb |
|---|---|
| Coverage | Every target block within half a battery, one way |
| Power | Grid beats solar by a wide margin. A yard, pump house or mast base is worth a detour |
| Data | Check the LTE signal at the exact spot, not at the gate |
| Airspace | Check the approach paths, not just the dock position |
| Access | You will visit it. Snow, mud, a locked gate |
| Sky view | Clear GNSS horizon, away from buildings and trees |
| Consent | Landowner agreement in writing, including for the flight paths |

One dock covering four blocks beats four docks. Spend the hour on a map with
battery ranges drawn on it before you buy anything.

## In-house software

| Component | What it does |
|---|---|
| Dock state machine | closed, opening, ready, launched, flying, returning, landing, charging, fault. Every transition logged |
| Go/no-go gate | Wind at altitude, precipitation, visibility, light, aircraft battery health, dock health |
| Mission dispatch | Which route, which payload, which battery, in which window |
| Fleet scheduler | Extends `ScheduleCapabilityFlights` with weather, daylight and battery constraints |
| Health telemetry | Dock cycles, lid current draw, charge cycles, internal humidity |
| Remote recovery | A supervisor can abort, recall or ground an aircraft at any time |

The lid actuator current draw is worth logging from day one: a lid that starts
drawing more current is the earliest warning of a mechanism about to fail, and
a failed lid on a wet night is an aircraft you replace.

## The failure modes to design against

| Failure | Response |
|---|---|
| Lid will not open | No launch. Alert. The aircraft stays safe |
| Lid will not close after landing | Alert loudly. Heater on. A human goes out |
| Aircraft cannot dock | Divert to the next dock in range, else land at a pre-surveyed safe area |
| Link lost in flight | Continue the route and return. Never hold |
| Battery below reserve | Return now, drop the rest of the route, report the missed flight with its reason |
| Weather turns mid-flight | Return. Log the wind figure |
| Dock loses power | Do not launch. Report on the backup link |

Every one of those decisions goes into the missed flight report. "Weather
cancelled, gust 12.4 m/s at 06:12" is a report a customer trusts. "Flight did
not happen" is not.
