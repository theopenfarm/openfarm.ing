# Flight stack

The owned stack is being built from planning through mission execution and
recording. Its current simulated behavior is not a qualified physical flight
controller. The [capability status and roadmap](/features/#implementation-status)
separates implemented software from the remaining field and hardware work.

## Owned runtime and optional drivers

The [shared drone library](https://github.com/stacksjs/drone) contains owned
runtime, sensor, estimator, simulated multirotor controls, authority/failsafe,
mission, camera/payload and diagnostics/replay paths. Agriculture planning and
synthetic collection build on those primitives. They provide bounded software
evidence, not proof of flight stability, agronomic accuracy or safe operation
around people, animals or infrastructure.

[ArduPilot](https://ardupilot.org) and [PX4](https://px4.io) are optional driver
backends alongside the owned simulated backend. The library has MAVLink
command acknowledgement, mission and parameter paths for these drivers; their
presence does not qualify a physical vehicle or authorize actuation. The
current physical boundary is receive-only telemetry. Keep an independent
flight controller and independent RC pilot authority for any eventual hardware
work. A Pi companion and this app do not replace that authority.

| Layer | Current software boundary | Remaining operation gate |
|---|---|---|
| Planning | Explicit metric routes and bounded planner outputs | Authoritative field coordinates, operator review and actual vehicle integration |
| Owned runtime | Sensor, estimator, controls, authority and missions in simulation | Separate real-time, SITL/HIL and hardware qualification |
| Optional drivers | ArduPilot/PX4 protocol paths; physical telemetry receive-only | Independently qualified hardware and deliberate command-authority integration |
| Camera and payload | Adapters and simulated capture/expiry/failure behavior | Actual payload, timing, calibration and storage qualification |
| App | Farm/field records, capability preferences and scheduled Mission records | Authenticated planning adapter, dispatch, actual execution and verified record ingestion |

## Planning before collection

The first shared integration is a
[planning preview](https://github.com/stacksjs/drone/issues/37), with required
explicit configuration and declared farm/field identities. Normalized app
boundaries, centroid and hectares do not establish a metric coordinate
transform. A planner must not infer one or silently use a demonstration field.
CLI declarations do not establish authenticated ownership.

A plan is not collection. A
[synthetic collection preview](https://github.com/stacksjs/drone/issues/38)
is a separate integration, retaining simulation flags and source evidence.
Neither preview can mark an operational Mission completed or a treatment
applied. A scheduled app row does not dispatch an aircraft.

Collection is also not reconstruction: capturing overlapping images does not
produce an orthophoto or a surface model. NDVI samples do not diagnose disease.
A treatment-zone demonstration does not establish a detector, machine-ready
prescription, actual application or measured crop response.

## Capability-specific routes

The [19 capability roadmaps](/features/#implementation-status) define intended
routes, payloads and outputs. Survey grids, repeated scouting lanes, fence
patrols, livestock moves and calibrated seeding swaths need different inputs
and failure behavior. Those domain implementations and their evidence must be
qualified separately; a marketing purpose slug is not a supported planner
operation.

Terrain, camera geometry, energy limits and exclusions must be explicit in a
route's configuration. Do not use a small synthetic survey as field-scale
coverage or positioning proof. Unknown geometry or unavailable payload data
must remain an unavailable output, not a plausible default.

## Operator and failure records

Physical integration needs a reviewed operator workflow before dispatch:

1. Record the preflight inspection, airspace/site permissions and pilot authority.
2. Bind the reviewed route, payload configuration and actual vehicle to the job.
3. Record weather, energy and link decisions with their actual sources.
4. Retain the actual flight log, trigger events and received files, including gaps.
5. Record aborts, stale data, rejected commands and incomplete coverage explicitly.

The app's existing schedule and cancellation states are records, not proof that
an aircraft launched, landed or physically stopped. A simulated abort, return
or docking result is likewise not a hardware result. Do not promote simulation
outputs into customer observations or completed operational records.

## Data offload and qualification

For eventual real collection, retain original files with hashes, match frames
to actual trigger events and flight logs, and reconcile missing or uncertain
captures before publishing a dataset. Keep planning, synthetic collection and
actual observations distinct. Successful file copying alone does not prove
calibration, reconstruction accuracy or agronomic correctness.

The owned implementation remains the project direction. Reuse the shared
library rather than duplicating estimators, controllers or protocol stacks in
the app. Optional external firmware supports separate integration paths;
physical control remains behind independent flight-controller/RC authority and
explicit qualification gates.
