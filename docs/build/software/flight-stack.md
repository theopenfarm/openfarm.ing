# Flight stack

Everything from a planned route to a landed aircraft with a matching log.

## ArduPilot or PX4

Both are mature, both fly agricultural multirotors every day, and the choice is
mostly a licence decision.

| | [ArduPilot](https://ardupilot.org) | [PX4](https://px4.io) |
|---|---|---|
| Licence | GPL-3.0 | BSD-3 |
| Consequence | Modifications shipped with the aircraft must be published. Unmodified use is fine | Permissive, including modifications you keep |
| Agricultural features | Sprayer support, mission tooling, precision landing, very mature | Modern architecture, strong companion computer integration |
| Community | Large, agricultural and survey heavy | Large, industry and research heavy |

Pick PX4 if you expect to modify the flight code and keep it. Pick ArduPilot if
you will run it unmodified, which most builds should. Do not fork either one to
add a feature you can implement on the companion computer.

## The layers

| Layer | What runs | Where |
|---|---|---|
| Flight control | ArduPilot or PX4 | Pixhawk or Cube |
| Companion | MAVSDK or pymavlink over MAVLink 2 | Pi or Jetson |
| Ground control | QGroundControl, Mission Planner, or your own | Laptop or tablet |
| Link | MAVLink over 868 MHz telemetry, plus LTE for the record | |

[MAVSDK](https://mavsdk.mavlink.io) (BSD) is the sane companion API: mission
upload, telemetry subscription, offboard control, camera actions. Use it rather
than parsing MAVLink by hand.

## Mission planning per capability

The generic survey grid is only right for
[field mapping](/features/field-mapping). Each capability wants a different
pattern, and turning those into templates is the first real piece of in-house
flight software.

| Capability | Pattern | Notes |
|---|---|---|
| Field mapping | Double grid, 75/65 overlap, terrain following | The base layer |
| Weed control | Single grid, low altitude, 60/40 overlap | 6 to 12 ha per battery |
| Disease, fertilisation | Single grid, 70/60, fixed heading and time of day | Repeatability beats coverage |
| Pest | The **same waypoints every flight** | Comparability is the product |
| Irrigation | Grid at solar noon, RGB alongside thermal for alignment | |
| Wildlife | Search lanes, 20% side overlap, before sunrise | Coverage proof matters more than image quality |
| Yield | Transects at very low altitude, or obliques both sides of a row | |
| Livestock | Fence line perimeter plus block sweep | |
| Seeding | Terrain-following swaths from the calibrated spread pattern | |

Terrain following is not optional on rolling ground. A constant barometric
altitude over a 20 m slope changes ground resolution by a fifth across the
field, which quietly breaks every per-square-metre count.

## The pilot app

Whatever the ground station, an operator needs five things per flight, and they
belong in your software rather than in a notebook:

1. **Preflight checklist**, recorded and timestamped.
2. **Airspace and consent check**, with the result stored.
3. **The mission**, from the capability's template.
4. **The log**, uploaded on landing, matched to the `Mission` row.
5. **The exceptions**: aborted flights, weather calls, incidents.

That record is what the flight report and the
[coverage proof](/features/wildlife-rescue) are built from, and it is what an
authority or an insurer asks for after an incident.

## Weather gating

| Input | Source | Use |
|---|---|---|
| Forecast | [DWD open data](https://opendata.dwd.de), ICON-D2 | Planning the day |
| Nowcast | DWD radar | The next two hours |
| On site | The [dock's](/build/docks) own station, or a handheld anemometer | The go decision |
| Wind at altitude | Model output, and the aircraft's own estimate | Higher than at head height, always |

Gate on wind gust rather than mean, and record the figure with the decision. A
missed flight report that says "weather cancelled, gust 12.4 m/s at 06:12" is a
report a customer trusts.

## Data offload

| Step | Why |
|---|---|
| Card in, checksum, copy twice | A card that fails after the flight has lost the field |
| Match the flight log to the frames | Trigger events to file names |
| Verify frame count against trigger count | The cheapest possible integrity check, and it catches a surprising number of problems |
| Only then wipe the card | |

Automate this. A script that ingests a card, verifies it, files it by farm,
field and date, and creates the `Mission` row is an afternoon of work that
prevents an entire category of lost mornings.

## What not to build

- **A flight controller.** ArduPilot and PX4 are a decade ahead of anything a
  small team will write, and they fly.
- **A MAVLink implementation.** MAVSDK exists.
- **Your own RTK correction protocol.** NTRIP is standard, universally
  supported, and free at the client end.
- **A ground control station, at first.** QGroundControl covers everything
  until your routes become capability-specific templates, which is exactly the
  point where a small custom planner earns its place.
