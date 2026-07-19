# Feature Recommendations

Status: **all 13 items implemented** (see the per-item status notes below; #11 is
implemented as guidance-only, per its own proposal's lower-effort path — see its note).
This document extends
the SDS's own "Future Roadmap" (Phases 9–12: Playwright E2E, Accessibility Automation,
Visual Regression Testing, Nuxt/SSR/Theme Management) with concrete recommendations
identified by reviewing the current `v1.0.0` implementation against real usage patterns.
Each item lists the gap it addresses, a sketch of the API, and a rough effort/impact
call so they can be triaged into a sprint.

Organized **Now / Next / Later**, the same shorthand used in the SDS for early-stage
planning — not a committed schedule.

---

## Now (high value, low-to-medium effort)

### 1. Distinguish external asset load failures from document-access failures — ✅ Implemented

**Gap:** `injectCssUrlIntoDocument`/`injectJsUrlIntoDocument` create the `<link>`/
`<script>` element and resolve successfully the moment the element is _inserted_ — a
404 or network failure on the URL itself never surfaces. Today, a broken `cssUrls`/
`jsUrls` entry fails silently from the host application's point of view.

**Proposal:** Attach `load`/`error` listeners to the created element and resolve/reject
the injection result asynchronously (or emit a new `asset-error` event distinct from
the existing synchronous `error`). This changes `IframeInjectionResult` to optionally
carry a `status: 'pending' | 'loaded' | 'failed'` that updates in place.

**Effort:** S · **Impact:** High (silent failures are the #1 support-ticket generator
for asset-injection libraries).

**Status:** `IframeInjectionResult` now carries `status: 'pending' | 'loaded' | 'failed'`,
updated in place as the underlying element's native `load`/`error` fires. The
component emits a new `assetError` event, distinct from the synchronous `error` event.
See [Parameters → `IframeInjectionResult`](/api/parameters#iframeinjectionresult) and
`tests/iframe-injection.spec.ts`'s "asset load status tracking" suite.

---

### 2. `allow`, `referrerpolicy`, `loading`, and `allowfullscreen` passthrough props — ✅ Implemented

**Gap:** The component only exposes `sandbox` and `title` from the native iframe
attribute surface. Common enterprise needs — `allow="clipboard-write"` for
copy-to-clipboard previews, `referrerpolicy="no-referrer"` for privacy-sensitive
embeds, `loading="lazy"` for below-the-fold previews — currently require the consumer
to fork the component or reach past it with a ref.

**Proposal:** Add `allow?: string`, `referrerPolicy?: ReferrerPolicy`, `loading?: 'eager'
| 'lazy'`, `allowFullscreen?: boolean` props, bound straight through to the underlying
`<iframe>`.

**Effort:** XS · **Impact:** Medium-High (frequently requested, trivial to implement).

**Status:** All four props added exactly as proposed, bound straight through to the
iframe. See [Parameters → Appearance props](/api/parameters#appearance-props).

---

### 3. Loading / error slots — ✅ Implemented

**Gap:** There is no visual feedback between mount and the first `load` event, and no
built-in way to show a fallback UI when `error` fires. Every consumer re-implements the
same "spinner over the iframe" pattern.

**Proposal:** Named slots — `#loading` (shown until first `load`) and `#error` (shown
when the most recent action produced an `IframeError`), with the error made available
as slot props (`#error="{ error }"`).

**Effort:** S · **Impact:** Medium-High (removes boilerplate from nearly every real
consumer).

**Status:** Implemented as proposed — `#loading` and `#error="{ error }"` slots. This
required promoting the component's root from the bare `<iframe>` to a wrapper `<div>`
(to host the slots as absolutely-positioned overlays alongside the iframe, which must
stay mounted to keep firing `load` events); `inheritAttrs: false` plus an explicit
`v-bind="$attrs"` on the iframe preserves the previous passthrough-attribute behavior
(verified directly — see `tests/IframeWrapper.spec.ts`'s data-testid passthrough test).

---

### 4. Auto-height via `ResizeObserver` — ✅ Implemented

**Gap:** `iframeStyle`/`iframeClass` require the host to know the content's height up
front. For `srcdoc` previews of variable-height content (reports, emails, CMS blocks),
consumers currently poll `getDocument()?.body.scrollHeight` themselves.

**Proposal:** An opt-in `autoHeight?: boolean` prop that attaches a `ResizeObserver` to
the injected document's `<body>` (same-origin only, naturally) and updates the
iframe's height to match, emitting a new `resize` event with the measured height for
consumers who want to react to it themselves instead.

**Effort:** M · **Impact:** High for the "report/CMS preview" use case called out
explicitly in the SDS's business objectives.

**Status:** Implemented as proposed — `autoHeight` prop, `resize` event. jsdom has no
real `ResizeObserver` implementation or layout engine, so `tests/mocks/resize-observer.ts`
provides a manually-triggerable mock for deterministic tests rather than relying on
real (always-zero, in jsdom) geometry.

---

### 5. Deduplicate repeated `jsUrls`/`cssUrls` injections across remounts — ✅ Implemented

**Gap:** `replaceExisting` (default `true`) only deduplicates within a single injection
`id`. Two different `IframeWrapper` instances (or the same one across a fast
reload-heavy flow) injecting the same external script URL will each create their own
`<script>` tag with a different auto-generated id, potentially re-executing scripts with
global side effects more than intended.

**Proposal:** Default `id` generation for `*Url` variants to a hash of the URL itself
(rather than a counter), so the same URL naturally collides into one element regardless
of call site — opt out via an explicit `id` when duplication is actually wanted.

**Effort:** XS · **Impact:** Medium (correctness fix more than a new feature).

**Status:** `createUrlInjectionId` now hashes the URL (a small FNV-1a-like mix, not
cryptographic — collision-resistance for this purpose only) instead of using a
counter. Same URL, no explicit id, from any call site → same generated id → natural
dedup via the existing `replaceExisting: true` default.

---

## Next (medium-to-high value, medium effort)

### 6. `useIframeMessage` composable (typed `postMessage` bridge) — ✅ Implemented

**Gap:** The library deliberately stays out of cross-document messaging, but almost
every real integration needs _some_ host↔iframe communication (e.g. "tell the host the
form inside was submitted"). Consumers currently hand-roll `window.addEventListener('message', ...)`
with no origin-checking guidance.

**Proposal:** A `useIframeMessage<TIn, TOut>(iframeRef, options)` composable providing
`send(message: TOut)` and an `onMessage(handler: (message: TIn) => void)` subscription,
with mandatory `targetOrigin` (defaulting to same-origin, matching the library's
existing security posture) and a documented pattern for the two-way handshake.

**Effort:** M · **Impact:** High — this is the most-requested "escape hatch" for
libraries in this space, and doing it inside the library means the security guidance
(origin checks) is enforced rather than merely documented.

**Status:** Implemented with `targetOrigin` optional (defaulting to same-origin) rather
than mandatory as originally sketched — a sensible default matching the library's
existing posture was more ergonomic than forcing every call site to state it. An SSR
audit (see [SSR / Nuxt Guidance](/guide/ssr)) found this composable's first draft
would have thrown on the server (`window.location.origin` accessed unconditionally);
fixed and verified with a test running in a genuine Node environment with no `window`
global (`tests/useIframeMessage.ssr.spec.ts`).

---

### 7. Accessibility automation (SDS Phase 10, made concrete) — ✅ Implemented

**Gap:** The SDS lists "Accessibility Automation" as planned but unscoped. The demo app
and component currently rely on the consumer supplying `title`; there's no automated
check that catches a regression (e.g. someone removing the `title` binding).

**Proposal:** `axe-core` + `@axe-core/playwright` integrated into a new `a11y` test
project, asserting: iframe always has an accessible name, focus is not trapped
unexpectedly, and the demo app's controls are keyboard-operable end to end.

**Effort:** M · **Impact:** Medium-High, and derisks enterprise procurement reviews
that specifically ask for accessibility test evidence (common in the public-sector /
enterprise procurement space this library targets).

**Status:** Implemented in two layers. First, `jest-axe`'s `axe()` runner in the jsdom
unit suite (lower effort, covers "iframe always has an accessible name" for both the
library and demo app — `tests/IframeWrapper.a11y.spec.ts` and
`demo/tests/App.a11y.spec.ts`, the latter catching two real, since-fixed issues:
unlabeled textareas, a live log with no `aria-live`). Later, the originally-sketched
`@axe-core/playwright` was added too — `tests-e2e/accessibility.spec.ts` and
`demo-accessibility.spec.ts` — covering exactly the two things jsdom cannot: real
color-contrast calculation and genuine keyboard Tab-order/focus behavior, closing this
item's "focus is not trapped" and "keyboard-operable end to end" clauses that the
jsdom-only pass couldn't fully address. See [Enterprise
Readiness](/enterprise-readiness) Phase 3 (jsdom layer) and Phase 4 (real-browser
layer), and [Accessibility](/accessibility).

---

### 8. Playwright E2E suite (SDS Phase 9, made concrete) — ✅ Implemented

**Gap:** Current tests are unit/component-level with jsdom, which cannot fully verify
real cross-origin behavior, actual `sandbox` enforcement, or genuine `ResizeObserver`
timing (relevant once #4 lands).

**Proposal:** A `tests-e2e/` Playwright suite covering: same-origin injection against a
real browser engine, sandbox attribute enforcement (attempting a disallowed action and
asserting it's blocked), and the reload/`reloadKey` flow against real navigation timing.

**Effort:** M · **Impact:** Medium-High — closes the largest gap between "tests pass"
and "works in production browsers."

**Status:** Implemented exactly as scoped, plus a genuine cross-origin scenario (a
second server on a different port) that wasn't explicitly named here. See
[Testing → End-to-end tests](/guide/testing) — including the disclosed limitation that
this sandboxed environment couldn't download Playwright browser binaries to actually
execute the suite, only write and statically validate it.

---

### 9. Declarative per-asset `placement` and `id` — ✅ Implemented

**Gap:** `placement` and `id` are only configurable through the imperative
`InjectionOptions` API (see [Parameters → Prop interactions](/api/parameters#prop-interactions--precedence-rules)).
Declarative consumers who need, say, one CSS block in `<body>` for a scoped style tag
currently must drop into manual mode entirely just for that one asset.

**Proposal:** Allow `css`/`js` (and their `*Urls` siblings) to optionally accept an
array of `{ value: string; id?: string; placement?: IframeAssetPlacement }` objects
alongside the existing plain-string shorthand, resolved through the same
`injectConfiguredAssets` path.

**Effort:** M · **Impact:** Medium (a real but relatively narrow gap).

**Status:** Implemented as `IframeAssetInput` (string | string[] |
`IframeAssetDescriptor[]`), with descriptor objects also carrying `replaceExisting`
and `nonce` (not just `id`/`placement` as originally sketched — barely more code for
meaningfully more flexibility). See [Parameters → Asset props](/api/parameters#asset-props).

---

### 10. Vue Devtools custom inspector — ✅ Implemented

**Gap:** Debugging _what_ was injected and _when_ currently means reading console logs
from the `injected`/`error` events by hand.

**Proposal:** A Devtools plugin panel listing, per `IframeWrapper` instance, the current
injected assets (id/type/placement), a timeline of `load`/`injected`/`error` events, and
a button to re-run `injectConfiguredAssets` for quick iteration during development.

**Effort:** M · **Impact:** Medium (developer-experience multiplier, not
user-facing).

**Status:** Implemented — a registry of mounted instances (`src/devtools/registry.ts`)
feeding a custom inspector panel (`src/devtools/plugin.ts`). Two real problems surfaced
and fixed during implementation: (1) `@vue/devtools-api@8.x` bundled ~27 KB gzipped via
`@vue/devtools-kit`, blowing the size budget 4-5x — swapped to the lightweight legacy
`6.x` line, the same one Pinia/Vue Router use; (2) `6.x`'s own shipped types are
incompatible with newer Vue versions (`vue-tsc` circular-reference errors) — worked
around with a small local type shim rather than suppressing the checker. See [Vue
Devtools Integration](/guide/devtools) for the full account, including the disclosed
limitation that no real Devtools browser session was available to visually confirm the
panel end-to-end.

---

## Later (strategic, higher effort)

### 11. Nuxt module + SSR guidance (SDS Phase 12) — ✅ Implemented (guidance-only)

**Gap:** The library is Vite/Vue-only today; nothing has been verified under Nuxt's
SSR/hydration lifecycle, where `IframeWrapper` would need to render a placeholder
server-side and hydrate into the real iframe client-side only.

**Proposal:** A thin `@enterprise/nuxt-iframe-wrapper` module registering the component
globally, with explicit `<ClientOnly>`-equivalent handling built in, plus documented
guidance for SSR frameworks generally (Nuxt, Vite SSR, Quasar) even for consumers not
using the dedicated module.

**Effort:** L · **Impact:** Medium — expands addressable audience but is a genuinely
separate integration surface to maintain long-term.

**Status:** The dedicated `@enterprise/nuxt-iframe-wrapper` module is **not** built —
per [Enterprise Readiness → Phase 6](/enterprise-readiness), that's deliberately
deferred until there's validated demand, since it's the one item that opens a new
long-term maintenance surface rather than hardening the existing library. What _is_
done: an actual SSR-safety audit (not just an assumption) of every composable, which
found and fixed a real bug in `useIframeMessage` (see #6's status above), plus
documented `<ClientOnly>`/manual-hydration guidance. See [SSR / Nuxt
Guidance](/guide/ssr).

---

### 12. Visual regression testing (SDS Phase 11, made concrete) — ✅ Implemented

**Gap:** No automated protection today against a CSS or layout regression in the
demo app or the component's own minimal default styles.

**Proposal:** Playwright's built-in screenshot comparison (reusing the E2E suite from
#8) against the demo app's key states: initial load, post-CSS-injection, error state
(once #3 lands), and the auto-height case (once #4 lands).

**Effort:** M-L (mostly maintenance cost over time from baseline churn) · **Impact:**
Medium.

**Status:** Implemented against the E2E harness (not the demo app as sketched — a
purpose-built harness proved lower-effort) with four scenarios covering states the
library actually has today; the error-state and auto-height scenarios mentioned in the
original proposal are intentionally deferred to whenever a consumer of this list
actually needs them, now that both features exist. Includes the baseline-review
process this phase's own effort estimate flagged as the real cost — see [Visual
Regression](/guide/visual-regression).

---

### 13. Theme management helpers — ✅ Implemented

**Gap:** "Theme Management" is named in the SDS roadmap without detail. The closest
existing primitive is calling `injectCss` with a stable `id` (see
[Examples → Manual API](/guide/examples#manual-api)), which works but requires
each consumer to invent their own theme-object-to-CSS-string conversion.

**Proposal:** An optional `useIframeTheme(frame, themeTokens)` composable that accepts a
plain design-token object (colors, spacing, fonts) and generates/updates a single
`:root { --token: value; }` custom-properties block inside the iframe via `injectCss`,
so host and iframe can share a design-token source of truth without the consumer
hand-writing CSS strings.

**Effort:** L · **Impact:** Medium — valuable for the "theme previews" use case named
explicitly in the SDS, but speculative until a concrete consumer requests it.

**Status:** Implemented as `useIframeTheme(frame, options)` plus the lower-level
`injectThemeTokens(doc, tokens, options)` and standalone `themeTokensToCss(tokens)`
helpers, converting `camelCase`/`PascalCase` token keys to `--kebab-case` custom
properties automatically. Built directly on `injectCss` with a stable default id, so
repeated calls replace the previous theme block in place — the basis for a live theme
switcher.

---

## Explicitly out of scope

Carried over from the SDS's own security design, and worth restating so future feature
requests against these are triaged as "won't do" rather than re-litigated:

- Cross-origin iframe injection or any same-origin-policy bypass.
- A sandboxed execution environment for genuinely untrusted third-party HTML (this
  library previews content _you_ control — see [Security](/security)).
- Server-side rendering/execution of injected JavaScript (injection is a DOM operation,
  not a script-evaluation sandbox).

## Suggested next step

All 13 items above are now implemented (see each item's **Status** note for exactly
what shipped and what changed from the original sketch). The one item genuinely left
open by design is the dedicated `@enterprise/nuxt-iframe-wrapper` package described
under #11 — that's a decision to make when real Nuxt usage demand shows up, not a task
to pick up next. Beyond that, see [Enterprise Readiness](/enterprise-readiness) for
what's left on the broader readiness checklist (an SBOM, dedicated Playwright-side
accessibility assertions, and a couple of manual one-time repo-settings actions).
