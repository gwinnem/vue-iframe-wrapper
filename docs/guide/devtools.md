# Vue Devtools Integration

`<IframeWrapper />` registers a custom Vue Devtools inspector automatically — there's
no separate installation step. Open Vue Devtools, and an **Iframe Wrapper** panel lists
every currently-mounted instance.

## What it shows

Per instance:

| Section   | Fields                                                                                                      |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| Source    | `src` (or `(none — using srcdoc)`), whether `srcdoc` is set, whether it has loaded yet                      |
| Injection | total `load` count, total successful `injected` event count, the asset count from the most recent injection |
| Errors    | total `error` count, the most recent `IframeError.reason`                                                   |

An instance with a non-empty `lastErrorReason` gets a red **error** tag in the
inspector tree, so a broken instance is visible without opening it.

## Why there's no setup step

The registration happens the first time any `IframeWrapper` mounts — it calls
`ensureIframeWrapperDevtools(app)` internally (see `src/devtools/plugin.ts`), guarded
against registering more than once per `app`. This mirrors how Pinia and Vue Router
register their own Devtools panels: always call the registration, and let
`@vue/devtools-api`'s own runtime detection decide whether a real Devtools session is
attached. With no Devtools panel open, this is a no-op — nothing is sent anywhere, and
in particular **nothing about injected `css`/`js` content itself is ever sent** (see
[What the inspector deliberately omits](#what-the-inspector-deliberately-omits) below).

## A note on the dependency and its types

This uses `@vue/devtools-api`, pinned to the **legacy `6.x` line** rather than the
current `8.x` major deliberately: `8.x` re-exports from `@vue/devtools-kit`, a much
larger package meant for the Devtools application itself, not for embedding in a small
component library — bundling it added **~27 KB gzipped** to this library's own output
during development, blowing through the bundle-size budget (see
[Enterprise Readiness](/enterprise-readiness)) by roughly 4-5x. `6.x` is the same
lightweight shim Pinia and Vue Router use for this exact purpose (a few KB).

`6.x`'s own shipped TypeScript types have a known incompatibility with newer Vue
versions (`vue-tsc` fails with cascading circular-reference errors the moment its
`PluginDescriptor.app: App` field is structurally checked against Vue 3.5's types) —
this is a type-level-only mismatch, not a runtime one. `src/devtools/plugin.ts` works
around it with a small local type declaration for just the surface this file uses,
cast once at the import boundary, rather than suppressing the type checker wholesale
or vendoring a patched copy of the dependency.

## What the inspector deliberately omits

- **The actual injected CSS/JS source text.** Only counts and types are shown — the
  same "don't send content verbatim" boundary documented in
  [Telemetry Integration](/guide/telemetry#what-not-to-send).
- **`IframeError.cause`.** Only `reason` (the stable, low-cardinality field) is shown;
  the raw underlying error object isn't serialized into the inspector state.

## Verification note

There is no real Vue Devtools browser session available in this project's automated
test environment, so the actual rendered inspector panel — what it looks like, whether
every field displays as intended — has **not** been visually confirmed end-to-end, the
same category of gap as the Playwright E2E suite's sandbox-enforcement tests in this
environment (see [Enterprise Readiness](/enterprise-readiness)). What **is** verified:

- `tests/devtools-registry.spec.ts` — the instance registry (register/unregister/list/
  subscribe) is pure logic with no Devtools dependency, and is fully unit-tested.
- `tests/devtools-plugin.spec.ts` — mounting (and unmounting) `IframeWrapper` instances
  through a real Vue `createApp()` (not just `@vue/test-utils`' lighter mount) doesn't
  throw and correctly registers/unregisters instances, with `@vue/devtools-api`'s
  runtime safely no-op'ing in the absence of a real Devtools connection.
- `vue-tsc`/ESLint pass over the plugin's local type shim.

The first real visual confirmation of the inspector panel itself should happen in a
normal local dev environment with the Vue Devtools browser extension installed.
