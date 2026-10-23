---
layout: home
title: Open Farming
description: Current software, intended drone scouting and targeted treatment workflows, hardware build guides and implementation status.
titleTemplate: Autonomous drone scouting for farms
hero:
  name: Open Farming
  text: Find it, map it, treat only that.
  tagline: "Explore drone scouting and targeted treatment plans on a demonstration field, with build guides and implementation status."
  actions:
    - theme: brand
      text: Read the introduction
      link: /guide/introduction
    - theme: alt
      text: Build guide
      link: /build/
    - theme: alt
      text: View on GitHub
      link: https://github.com/theopenfarm/openfarm.ing
features:
  - title: 19 capabilities
    icon: 🛰️
    details: "Detect, act and operate. Every one documented with its sensors, its cadence, the readings it produces and the parts list behind it."
  - title: 16 use cases
    icon: 🌾
    details: "Arable, permanent crops, protected crops, grassland and livestock, and the operators running many holdings at once."
  - title: Built, not bought
    icon: 🔧
    details: "Every build page gives an open-source-first parts list with EU and US suppliers, and the in-house software that replaces the per-hectare licence."
  - title: A public API
    icon: 📡
    details: "The site and the API read one source, so the pages and the payloads cannot drift apart. Unauthenticated, documented, and marked as sample data."
  - title: Honest about the law
    icon: ⚖️
    details: "Aerial application of plant protection products is prohibited by default in the EU. The product shape follows the rules rather than the pitch."
  - title: Deterministic demo data
    icon: 🧭
    details: "The demonstration field is generated from a fixed seed, so the database, the API and the rendered map always agree and no quoted figure can drift."
---

## Current implementation

The site uses a deterministic demonstration field. Farm records, capability
preferences and scheduled Mission records are implemented. Authenticated drone
dispatch, verified flight-data ingestion and detection validated in real fields
remain open.

Read the [capability status and roadmap](/features/#implementation-status) and
[flight-stack boundaries](/build/software/flight-stack) before treating an intended
workflow as an operational capability.

## Where to start

| If you want to | Read |
|---|---|
| Understand what the product is | [Introduction](/guide/introduction) |
| See what it looks like | [The interface](/guide/interface) |
| Run this repository locally | [Quickstart](/guide/quickstart) |
| Know how a capability works | [Capabilities](/features/) |
| Know what it costs to build | [Build guide](/build/) and [Costs](/build/costs) |
| Buy the parts | [Suppliers](/build/suppliers) |
| Fly legally in the EU | [Regulation](/build/regulation) |
| Integrate with the API | [HTTP API](/guide/api) |

Prices in the build pages are indicative for 2026 and carry both an EU and a US
source per line. Check the current figure before you order: sensor and airframe
pricing moves faster than documentation does.
