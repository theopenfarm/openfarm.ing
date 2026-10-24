# Dependency patches

## BunPress 0.2.14 docs search

`@stacksjs/bunpress@0.2.14` is pinned for the native documentation build and its
public search-index regressions. The version-specific patch applies the
renderer's deployment path to search results after locale selection and fallback.
Page paths and section anchors stay under `/docs`, including actual source
directories named `docs`. Explicit root deployments remain at the origin root.

The compatibility helper matches this release's renderer normalization and uses
its existing site-URL resolver. The patch targets the exact 0.2.14 distribution
chunk; it must not be reused for another release.

Shared source fix: [BunPress PR 91](https://github.com/stacksjs/bunpress/pull/91).
Application tracking: [Open Farming issue 35](https://github.com/theopenfarm/openfarm.ing/issues/35).

Remove this patch and the version pin only after an engine release includes the
fix and the public regressions, native docs build and browser search checks pass
without the patch. Update the lockfile with Bun and preserve its supported format.
