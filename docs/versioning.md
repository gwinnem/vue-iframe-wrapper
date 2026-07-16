# Versioning & Deprecation Policy

## Semantic Versioning

This package follows [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR** (`x.0.0`) — breaking changes to the public API: prop/event/method removal or
  signature changes, default-value changes that alter existing behavior, minimum Vue/
  Node version bumps.
- **MINOR** (`1.x.0`) — new, backward-compatible functionality: new props/events/methods,
  new optional configuration.
- **PATCH** (`1.0.x`) — backward-compatible bug fixes, security fixes, documentation.

Versions are cut via `release-it` (see `.release-it.json`), which derives the version
bump and `CHANGELOG.md` entry from [Conventional Commits](https://www.conventionalcommits.org/)
in the merged commit history — see
[`CONTRIBUTING.md`](https://github.com/enterprise/vue-iframe-wrapper/blob/main/CONTRIBUTING.md)
for the
commit message format.

## What counts as the public API

Covered by SemVer guarantees:

- `<IframeWrapper />` props, events, and exposed instance methods (see
  [Parameters](/api/parameters))
- `useIframeInjection` and its return shape
- The exported utility functions (`normaliseArray`, `createInjectionId`,
  `getSameOriginDocument`, `inject*IntoDocument`, etc.)
- All exported types in `src/types/iframe.ts`
- The `./style.css` subpath export

**Not** covered (may change in a minor/patch release without notice):

- Internal DOM structure of injected elements beyond what's documented (e.g. don't rely
  on the exact `data-viw-id` attribute format persisting byte-for-byte)
- Anything under `demo/` — it's a reference implementation, not a published artifact
- Internal file/module layout under `src/` beyond the documented public exports in
  `src/index.ts`

## Deprecation process

When a public API needs to be removed or changed incompatibly:

1. **Announce** — the deprecated API is marked with a `@deprecated` TSDoc tag (visible
   in editor tooltips) and called out in the `CHANGELOG.md` entry for the minor release
   that introduces the replacement.
2. **Coexist** — the deprecated API continues to work, unchanged, for at least one full
   minor version cycle. A console warning may be added (behind a check that avoids
   spamming logs in production, e.g. `if (import.meta.env.DEV)`).
3. **Remove** — the deprecated API is removed only in the next **major** version, with
   the removal called out explicitly at the top of that major's changelog/release notes,
   including a migration snippet.

Minimum deprecation window: **one minor release**, but for anything with wide observed
usage, maintainers should prefer holding it longer rather than rushing the removal into
the next major.

## Supported version window

Per [`SECURITY.md`](https://github.com/enterprise/vue-iframe-wrapper/blob/main/SECURITY.md),
only the latest minor of the current major version
receives security patches by default. General bug fixes are typically only applied to
the latest release; if your organization needs backports to an older major, that's a
conversation for a dedicated support agreement rather than the default open-source
support model.

## Pre-1.0 note

This policy describes the intended behavior from `1.0.0` onward. There is no `0.x`
history for this package to reconcile against.
