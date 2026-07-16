# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`vue-iframe-wrapper` is a small, strictly-typed Vue 3 library (`<IframeWrapper>` component +
`useIframeInjection` composable) for controlled CSS/JS injection into **same-origin** iframes
(`srcdoc`, `about:blank`, same-origin `src`). It does not attempt to bypass the same-origin
policy — cross-origin access fails soft with a typed `IframeError` instead of a thrown
`SecurityError`. See `docs/security.md` for the full threat model before changing anything in
`src/utils/iframe-injection.ts` or the `sandbox` default.

## Commands

```bash
npm run dev           # component playground (src/)
npm run demo          # standalone demo app (demo/)
npm run test          # vitest, single run
npm run test:watch    # vitest watch mode
npm test -- <pattern> # run a subset, e.g. npm test -- iframe-injection
npm run coverage      # vitest with coverage gate (90% statements/branches/functions/lines)
npm run mutation      # Stryker, scoped to src/utils + src/composables only
npm run test:e2e      # Playwright across chromium/firefox/webkit (needs `npx playwright install`)
npm run test:e2e:ui   # Playwright interactive UI mode
npm run lint          # eslint --max-warnings 0
npm run format        # prettier --write
npm run typecheck     # vue-tsc --noEmit
npm run build         # library build -> dist/
npm run docs:dev      # VitePress docs dev server
npm run verify        # lint + typecheck + coverage + build + docs:build — what CI gates PRs on
npm run verify:full   # verify + license:check + size + test:e2e + mutation — run before a release
```

Run a single Playwright spec with `npx playwright test tests-e2e/injection.spec.ts`.

## Architecture

Everything funnels through one dependency chain, and each layer has a distinct job:

```
IframeWrapper.vue  →  useIframeInjection.ts  →  iframe-injection.ts (pure functions)
  (props/events)        (reactive wrapper,         (DOM operations against a plain
                         fail-soft error routing)    Document — no Vue dependency)
```

- **`src/utils/iframe-injection.ts`** — pure functions operating on a `Document` argument, no
  Vue import. `getSameOriginDocument` is the one chokepoint every accessor/injector goes
  through; it's what turns a cross-origin `SecurityError` into a typed `IframeError`. Because
  these are plain functions, they're tested directly against a jsdom-created document without
  mounting anything (see `docs/guide/testing.md`).
- **`src/composables/useIframeInjection.ts`** — wraps the utils in a **fail-soft** batch runner
  (`runBatch`): one bad asset in `injectCss(['a', 'b', 'c'])` reports its error via `onError`
  and continues with the rest rather than throwing and abandoning the batch. Never throw from
  the injector functions and expect a caller `try/catch` — the whole design is
  error-via-callback, not error-via-exception.
- **`src/components/IframeWrapper.vue`** — thin: owns the `<iframe>` ref, auto-injects
  configured `css`/`cssUrls`/`js`/`jsUrls` on `load` (gated by `autoInject`/`injectOnLoad`), and
  re-exposes the composable's imperative methods via `defineExpose` so a parent can call
  `iframeRef.value.injectCss(...)` directly.
- **`src/types/iframe.ts`** — the entire public contract (props, emits, `IframeError`,
  injection types) lives in one module, importable independently of the Vue component.

**Identity/replacement model**: every injected element gets a `data-viw-id` attribute — either
caller-supplied (`InjectionOptions.id`) or auto-generated (`createInjectionId`). Re-injecting
with the same id replaces the existing element by default (`replaceExisting: true`); this is how
CSS/JS "hot-swap" without accumulating duplicate `<style>`/`<script>` tags across reloads.

## Testing layers — what belongs where

Three layers, each catching what the others structurally can't (full rationale in
`docs/guide/testing.md`):

| Layer | Catches | Add a case here when... |
| --- | --- | --- |
| `tests/` (Vitest + jsdom) | component/composable logic, props/events wiring, DOM mutations | the behavior is pure logic or DOM structure, no real browser needed |
| Mutation (Stryker, `src/utils` + `src/composables` only) | whether assertions would actually catch a regression, not just execute the line | you add logic to those two directories — a surviving mutant means strengthen the assertion |
| `tests-e2e/` (Playwright) | `sandbox` enforcement, genuine cross-origin, real `load`/reload timing, visual regressions | jsdom can't model it at all (sandbox tokens, two real origins, real navigation) |

Two non-obvious mechanics:

- Component tests that need `contentDocument` populated **must** mount with
  `attachTo: document.body` — jsdom does not reliably populate it for detached iframes.
- Mutation testing intentionally excludes `.vue` files (Stryker's mutator can't reliably parse
  SFCs) and `src/types/iframe.ts` (no runtime behavior to mutate).

E2E runs against a dedicated harness (`tests-e2e/harness/`) — every prop is driven by URL query
params (`tests-e2e/utils/harness-url.ts`) and every emitted event surfaces as a `data-testid`, so
tests assert on DOM state, not component internals. This harness is deliberately separate from
`demo/`, which exercises the published package API instead.

## Coding standards (from `CONTRIBUTING.md`)

- Strict TypeScript — `@typescript-eslint/no-explicit-any` is an error. If reaching for `any`,
  find the narrower type instead.
- No default exports from new modules other than the existing component/library entry points.
- **Public API changes need, in order: a type (`src/types/iframe.ts`), a test, a docs update.**
  Docs updates for prop/event/method changes must touch **both** `PARAMETERS.md` and
  `docs/api/parameters.md` — they are intentionally mirrored and kept in sync manually.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`,
  `BREAKING CHANGE:` in the body) — `release-it` generates `CHANGELOG.md` from these.
