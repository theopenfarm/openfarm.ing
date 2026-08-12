# Autonomous drone network

> Docked, charged, and out again at first light

Drones launch from charging stations on their own schedule, cover the fields
and dock again without a driver.

| | |
|---|---|
| Category | Operate |
| Slug | `autonomous-network` |
| Cadence | Daily, weather permitting, with the calendar published a week ahead |
| Payload | Dock weather station, aircraft sensor payload per mission, redundant RTK |
| Needs a visit first | No, but a dock has to be sited and installed |

## The problem

A pilot in a van is the bottleneck. Travel time between blocks decides how many
fields get flown in a day, which means the outlying ones get flown least and
the schedule collapses the moment the weather closes a window.

## How it works

| Step | What happens |
|---|---|
| Station | Weatherproof docks are placed to cover your blocks within a single battery |
| Schedule | Each field has its own cadence; the network plans the day around weather, wind and daylight |
| Fly and dock | Aircraft launch, fly their route, return and charge without anyone attending |
| Escalate | Anything the models are unsure about goes to a human reviewer before it reaches you |

## What you get

- Daily coverage log
- Missed flight report with the reason
- Fleet and battery health
- Escalation queue

## What the dashboard measures

- Flights completed against planned
- Hectares per station per day
- Weather cancelled flights
- Battery cycles and dock uptime

## Where it matters most

[Cooperatives](/use-cases/operators#cooperatives-and-large-estates),
[contractors](/use-cases/operators#agricultural-contractors),
[maize](/use-cases/arable#maize),
[winter wheat](/use-cases/arable#winter-wheat-and-barley), and above all
[dairy and grazing](/use-cases/livestock#dairy-and-grazing-livestock), where
the daily patrol is the product.

## Build it

The regulatory work is larger than the engineering work. Read
[Regulation](/build/regulation) before you cost this.

### What a dock actually has to do

| Function | Why it is hard |
|---|---|
| Open and close | A moving lid outdoors, all year, in wind and ice |
| Precision land | GNSS alone is not enough. Fiducial marker plus a downward camera, or IR beacon |
| Charge | Contact pads or wireless. Contact is cheaper and needs alignment |
| Condition | Heating and drying, or a wet aircraft ices up on the next dawn flight |
| Report weather | The go/no-go decision has to come from the dock, not the forecast |
| Fail safe | A dock that cannot close must not launch. A drone that cannot dock must land safely |
| Connect | LTE, with local autonomy when the link drops |

### Buy or build

| | Turnkey | DIY |
|---|---|---|
| Example | [DJI Dock 3](https://enterprise.dji.com/dock-3) via [Solectric](https://www.solectric.de) or [Advexure](https://advexure.com) | Enclosure, actuator, charger, marker, compute |
| Cost | €15,000 to €40,000 including aircraft | €2,000 to €6,000 plus your aircraft |
| Time to first flight | Weeks | Months |
| Regulatory support | Manufacturer documentation helps the authorisation case | You write the safety case yourself |
| Sensor choice | Their payloads only | Anything you can build |

Buy the first one. The value of the capability is the schedule it keeps, and
proving that with somebody else's dock is far cheaper than discovering your
lid mechanism fails at -5 °C in February. Build docks later, for payloads the
turnkey systems do not carry.

### DIY dock hardware

| Item | EU source | US source | Indicative |
|---|---|---|---|
| IP66 enclosure, 800 mm class | [Rittal](https://www.rittal.com), [Fibox](https://www.fibox.com) via [Reichelt](https://www.reichelt.de) | [DigiKey](https://www.digikey.com) | €300 to €900 |
| Linear actuators for the lid | [Igus](https://www.igus.eu) | [ServoCity](https://www.servocity.com) | €150 to €400 |
| Charging contacts | Spring pins, or a [WiBotic](https://www.wibotic.com) wireless system | same | €50 to €3,000 |
| Precision landing marker | Printed AprilTag plus an IR beacon | same | €50 |
| Dock compute | [Raspberry Pi 5](https://www.raspberrypi.com/products/raspberry-pi-5/) at [BerryBase](https://www.berrybase.de) | [The Pi Hut](https://thepihut.com) | €90 |
| Weather station | [Davis Vantage Pro2](https://www.davisinstruments.com), or an anemometer plus [SHT45](https://eu.mouser.com) | same | €80 to €1,200 |
| Router with failover | [Teltonika RUTX11](https://teltonika-networks.com/products/routers/rutx11) | [SparkFun](https://www.sparkfun.com) | €200 |
| Solar and battery, off grid | [Victron](https://www.victronenergy.com) via [Antratek](https://www.antratek.de) | [RobotShop](https://www.robotshop.com) | €600 to €2,500 |
| Heater and dehumidifier | [Reichelt](https://www.reichelt.de) | [DigiKey](https://www.digikey.com) | €60 to €200 |

### In-house software

| Stage | What we run | Licence | Replaces |
|---|---|---|---|
| Autonomy | ArduPilot or PX4 with a companion computer running MAVSDK | GPL / BSD | vendor-locked flight stacks |
| Precision landing | ArduPilot's precision landing with AprilTag detection | GPL | |
| Dock controller | State machine: closed, opening, ready, launched, returning, charging, fault | own code | |
| Fleet scheduler | Extend `ScheduleCapabilityFlights` with weather gating, battery state and daylight | this repo | |
| Weather gating | Wind at altitude, precipitation, visibility and light, from the dock plus DWD | own code | |
| Escalation queue | Low confidence findings routed to a human before they reach the customer | this repo | |
| Health telemetry | Battery cycles, motor current signatures, dock cycles | own code | |

The scheduler in this repository already does the cadence half of the job. What
a network adds is the constraint solver: which aircraft, from which dock, in
which weather window, with which battery, and what to drop when the day is
short. Model it as a scheduling problem with hard constraints (battery,
daylight, airspace) and soft ones (cadence, priority), not as a queue.

### Fail-safe posture

Write these down before the first unattended flight, because the authorisation
will ask:

- No launch unless the dock reports closed-and-healthy, wind under limit,
  precipitation nil, and the return battery reserve is met at the far end of
  the route.
- Link loss means continue the route and return, never hold.
- A failed dock means divert to the next dock in range, or land at a
  pre-surveyed safe area.
- Any geofence breach is an immediate return to launch.
- Every one of these decisions is logged and shows up in the missed flight
  report with its reason. "Weather cancelled" with a wind figure attached is a
  report a customer trusts.

### Cost efficiency

- **Site the docks by battery, not by field.** One dock that reaches four
  blocks beats four docks. The siting exercise is the highest-value hour in the
  whole deployment.
- **Grid power if you can possibly get it.** Off-grid solar for a dock that
  charges an aircraft several times a day is a large battery bank and a real
  cost. A yard, a pump house or a mast base with power is worth a detour.
- **Start with a daily patrol, not a survey.** Livestock and fence checks
  justify a dock on their own and use a light payload. Add the survey
  capabilities to the same dock afterwards.
- **The escalation queue keeps a human in the loop cheaply.** One reviewer can
  clear a day's ambiguous findings across many farms in an hour, and that is
  what lets you promise autonomy without promising infallibility.
