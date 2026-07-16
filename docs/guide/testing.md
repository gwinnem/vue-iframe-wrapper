# Testing

The library is tested in three layers, each catching things the others can't:

| Layer            | Tool                            | What it proves                                                                                                   | What it can't                                                                            |
| ---------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Unit / component | Vitest + Vue Test Utils + jsdom | Component/composable logic, props/events wiring, DOM mutations                                                   | Real browser behavior (`sandbox` enforcement, real cross-origin, real navigation timing) |
| Mutation         | Stryker                         | Whether the unit suite would actually catch a regression, not just execute the code                              | Anything outside `src/utils` + `src/composables` (see scope note below)                  |
| End-to-end       | Playwright                      | Real-browser `sandbox` enforcement, genuine cross-origin behavior, real `load`/reload timing, visual regressions | Slower, more moving parts (browser binaries, two local web servers)                      |

## Unit & component tests (Vitest)

```bash
npm run test          # single run
npm run test:watch    # watch mode
npm run test:ui       # Vitest UI
npm run coverage      # single run with coverage report
```

### Coverage gates

CI enforces the following minimums (see `vitest.config.ts`):

| Metric     | Threshold |
| ---------- | --------- |
| Statements | 90%       |
| Branches   | 90%       |
| Functions  | 90%       |
| Lines      | 90%       |

### Testing your own usage

Because `getSameOriginDocument`, `injectCssIntoDocument`, etc. are plain functions that
accept a `Document`, they can be exercised directly against a jsdom-created document
without mounting a component:

```ts
import { injectCssIntoDocument } from 'vue-iframe-wrapper'

it('injects a style tag', () => {
  const doc = document.implementation.createHTMLDocument('test')
  const result = injectCssIntoDocument(doc, 'body { color: red; }')
  expect(result.element.tagName).toBe('STYLE')
})
```

For component-level tests, mount `IframeWrapper` with `@vue/test-utils` and trigger the
native `load` event to exercise auto-injection:

```ts
import { mount } from '@vue/test-utils'
import { IframeWrapper } from 'vue-iframe-wrapper'

it('emits injected after load', async () => {
  const wrapper = mount(IframeWrapper, {
    props: { srcdoc: '<p>hi</p>', css: 'body{}' },
    attachTo: document.body,
  })
  await wrapper.get('iframe').trigger('load')
  expect(wrapper.emitted('injected')).toBeTruthy()
  wrapper.unmount()
})
```

Mounting with `attachTo: document.body` matters here — jsdom only populates
`contentDocument` reliably for iframes that are attached to the live DOM.

## Mutation testing (Stryker)

Coverage answers "did this line execute during the test run?" — it says nothing about
whether the assertions around that line would actually catch a bug. Mutation testing
answers that instead: Stryker rewrites the source in small ways (flips a `&&` to `||`,
swaps a default value, deletes a conditional) and reruns the suite against each
mutant. A mutant that **survives** (tests still pass despite the change) means the
suite wouldn't have caught that class of regression either.

```bash
npm run mutation   # runs Stryker, writes an HTML report to reports/mutation/index.html
```

### Scope

Mutation is scoped to `src/utils/**/*.ts` and `src/composables/**/*.ts` only — **not**
`src/components/IframeWrapper.vue` or `src/types/iframe.ts`. Two different reasons:

- **`.vue` files**: Stryker's JS/TS mutator does not reliably parse Single-File
  Components (template + script + style in one file); mutating the compiled output
  instead would produce mutants with no traceable line back to the source a developer
  edits. The component's logic is still covered by the _unit_ test suite and by
  Playwright E2E below — it's just not mutation-scored directly.
- **`src/types/iframe.ts`**: type-only declarations have no runtime behavior to mutate.

### Thresholds

```json
{ "high": 80, "low": 60, "break": 60 }
```

A CI run fails if the score drops below 60. As of the last local run: **~86%** on
`src/utils/iframe-injection.ts` and **~82%** on `src/composables/useIframeInjection.ts`.

### What mutation testing already found here

Running Stryker against this codebase surfaced two real, fixed issues — not just
survived mutants left as-is:

1. **Dead code**: `insertOrReplace`'s `if (existing && !replaceExisting) { /* comment,
no-op */ }` branch had no effect regardless of its condition — every mutation of
   that condition survived because the branch body was empty. Removed in favor of a
   comment on the fallthrough path it was describing.
2. **Under-specified assertions**: several `inject*IntoDocument` tests checked the DOM
   side effect (`element.tagName`, `.contains()`) but not the returned
   `IframeInjectionResult`'s `id`/`type`/`placement` fields, and didn't test the
   default value of `replaceExisting`/`nonce` explicitly. Both were strengthened.

The remaining survivors are documented as accepted rather than silently ignored:
string-literal mutants on human-readable error _messages_ (asserting exact wording adds
little value and makes copy changes needlessly break tests — `error.reason` is what's
asserted instead), and one defensive `resolveParent` guard against a missing
`<head>`/`<body>`, which no realistic `Document` triggers.

## End-to-end tests (Playwright)

```bash
npm run test:e2e          # headless run across chromium, firefox, webkit
npm run test:e2e:ui       # Playwright's interactive UI mode
npm run test:e2e:report   # open the last HTML report
```

The suite runs against a purpose-built harness (`tests-e2e/harness/`) — a minimal Vue
app, distinct from `demo/`, that mounts `<IframeWrapper>` with every prop driven by URL
query parameters (see `tests-e2e/utils/harness-url.ts`) and surfaces every emitted event
as a `data-testid` element, so tests assert on plain DOM state rather than component
internals or console output.

### What's covered

| File                   | Scenario                                                                                                               | Why it needs a real browser                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `injection.spec.ts`    | CSS/JS injection actually takes visible effect inside the iframe document                                              | jsdom can create the elements but doesn't apply real CSS cascade/computed styles |
| `sandbox.spec.ts`      | The `sandbox` attribute's tokens (`allow-popups`, `allow-forms`, etc.) genuinely permit/block behavior                 | jsdom does not implement `sandbox` enforcement at all                            |
| `reload.spec.ts`       | `reloadKey`/`reload()` against real navigation and `load` timing                                                       | jsdom's `load` event on an iframe is largely synthetic                           |
| `cross-origin.spec.ts` | A genuinely cross-origin `src` (different port ⇒ different origin) produces a `cross-origin` error rather than a crash | jsdom cannot model two real origins at all                                       |
| `visual.spec.ts`       | One screenshot-comparison test, previewing [Phase 5](/enterprise-readiness)                                            | Not attempted in jsdom at all                                                    |

Cross-origin tests need a second HTTP server on a different port, which Playwright
starts automatically (see `playwright.config.ts`'s `webServer` array — one Vite dev
server for the harness, one `python3 -m http.server` for the cross-origin fixture).

### Visual regression

`visual.spec.ts` runs four scenarios (unstyled, dark theme, light theme, JS-mutated
content) under a dedicated `visual` Playwright project pinned to one browser/viewport —
see [Visual Regression](/guide/visual-regression) for the full baseline-generation
workflow and, more importantly, the review process for when a screenshot diff shows up
on a PR.

### A note on running this locally

Playwright needs real browser binaries (`npx playwright install --with-deps`), fetched
from `cdn.playwright.dev`. If your machine or CI runner restricts outbound network
access to an allowlist, that domain needs to be reachable for installation to succeed —
this is separate from and in addition to your npm registry access.
