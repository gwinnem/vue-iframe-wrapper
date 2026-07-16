# Feature Recommendations

Status: **proposal** — none of the items below are implemented. This document extends
the SDS's own "Future Roadmap" (Phases 9–12: Playwright E2E, Accessibility Automation,
Visual Regression Testing, Nuxt/SSR/Theme Management) with concrete recommendations
identified by reviewing the current `v1.0.0` implementation against real usage patterns.
Each item lists the gap it addresses, a sketch of the API, and a rough effort/impact
call so they can be triaged into a sprint.

Organized **Now / Next / Later**, the same shorthand used in the SDS for early-stage
planning — not a committed schedule.

---

## Now (high value, low-to-medium effort)

### 1. Distinguish external asset load failures from document-access failures

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

---

### 2. `allow`, `referrerpolicy`, `loading`, and `allowfullscreen` passthrough props

**Gap:** The component only exposes `sandbox` and `title` from the native iframe
attribute surface. Common enterprise needs — `allow="clipboard-write"` for
copy-to-clipboard previews, `referrerpolicy="no-referrer"` for privacy-sensitive
embeds, `loading="lazy"` for below-the-fold previews — currently require the consumer
to fork the component or reach past it with a ref.

**Proposal:** Add `allow?: string`, `referrerPolicy?: ReferrerPolicy`, `loading?: 'eager'
| 'lazy'`, `allowFullscreen?: boolean` props, bound straight through to the underlying
`<iframe>`.

**Effort:** XS · **Impact:** Medium-High (frequently requested, trivial to implement).

---

### 3. Loading / error slots

**Gap:** There is no visual feedback between mount and the first `load` event, and no
built-in way to show a fallback UI when `error` fires. Every consumer re-implements the
same "spinner over the iframe" pattern.

**Proposal:** Named slots — `#loading` (shown until first `load`) and `#error` (shown
when the most recent action produced an `IframeError`), with the error made available
as slot props (`#error="{ error }"`).

**Effort:** S · **Impact:** Medium-High (removes boilerplate from nearly every real
consumer).

---

### 4. Auto-height via `ResizeObserver`

**Gap:** `iframeStyle`/`iframeClass` require the host to know the content's height up
front. For `srcdoc` previews of variable-height content (reports, emails, CMS blocks),
consumers currently poll `getDocument()?.body.scrollHeight` themselves.

**Proposal:** An opt-in `autoHeight?: boolean` prop that attaches a `ResizeObserver` to
the injected document's `<body>` (same-origin only, naturally) and updates the
iframe's height to match, emitting a new `resize` event with the measured height for
consumers who want to react to it themselves instead.

**Effort:** M · **Impact:** High for the "report/CMS preview" use case called out
explicitly in the SDS's business objectives.

---

### 5. Deduplicate repeated `jsUrls`/`cssUrls` injections across remounts

**Gap:** `replaceExisting` (default `true`) only deduplicates within a single injection
`id`. Two different `IframeWrapper` instances (or the same one across a fast
reload-heavy flow) injecting the same external script URL will each create their own
`<script>` tag with a different auto-generated id, potentially re-executing scripts with
global side effects more than intended.

**Proposal:** Default `id` generation for `*Url` variants to a hash of the URL itself
(rather than a counter), so the same URL naturally collides into one element regardless
of call site — opt out via an explicit `id` when duplication is actually wanted.

**Effort:** XS · **Impact:** Medium (correctness fix more than a new feature).

---

## Next (medium-to-high value, medium effort)

### 6. `useIframeMessage` composable (typed `postMessage` bridge)

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

---

### 7. Accessibility automation (SDS Phase 10, made concrete)

**Gap:** The SDS lists "Accessibility Automation" as planned but unscoped. The demo app
and component currently rely on the consumer supplying `title`; there's no automated
check that catches a regression (e.g. someone removing the `title` binding).

**Proposal:** `axe-core` + `@axe-core/playwright` integrated into a new `a11y` test
project, asserting: iframe always has an accessible name, focus is not trapped
unexpectedly, and the demo app's controls are keyboard-operable end to end.

**Effort:** M · **Impact:** Medium-High, and derisks enterprise procurement reviews
that specifically ask for accessibility test evidence (common in the public-sector /
enterprise procurement space this library targets).

---

### 8. Playwright E2E suite (SDS Phase 9, made concrete)

**Gap:** Current tests are unit/component-level with jsdom, which cannot fully verify
real cross-origin behavior, actual `sandbox` enforcement, or genuine `ResizeObserver`
timing (relevant once #4 lands).

**Proposal:** A `tests-e2e/` Playwright suite covering: same-origin injection against a
real browser engine, sandbox attribute enforcement (attempting a disallowed action and
asserting it's blocked), and the reload/`reloadKey` flow against real navigation timing.

**Effort:** M · **Impact:** Medium-High — closes the largest gap between "tests pass"
and "works in production browsers."

---

### 9. Declarative per-asset `placement` and `id`

**Gap:** `placement` and `id` are only configurable through the imperative
`InjectionOptions` API (see [Parameters → Prop interactions](/api/parameters#prop-interactions--precedence-rules)).
Declarative consumers who need, say, one CSS block in `<body>` for a scoped style tag
currently must drop into manual mode entirely just for that one asset.

**Proposal:** Allow `css`/`js` (and their `*Urls` siblings) to optionally accept an
array of `{ value: string; id?: string; placement?: IframeAssetPlacement }` objects
alongside the existing plain-string shorthand, resolved through the same
`injectConfiguredAssets` path.

**Effort:** M · **Impact:** Medium (a real but relatively narrow gap).

---

### 10. Vue Devtools custom inspector

**Gap:** Debugging _what_ was injected and _when_ currently means reading console logs
from the `injected`/`error` events by hand.

**Proposal:** A Devtools plugin panel listing, per `IframeWrapper` instance, the current
injected assets (id/type/placement), a timeline of `load`/`injected`/`error` events, and
a button to re-run `injectConfiguredAssets` for quick iteration during development.

**Effort:** M · **Impact:** Medium (developer-experience multiplier, not
user-facing).

---

## Later (strategic, higher effort)

### 11. Nuxt module + SSR guidance (SDS Phase 12)

**Gap:** The library is Vite/Vue-only today; nothing has been verified under Nuxt's
SSR/hydration lifecycle, where `IframeWrapper` would need to render a placeholder
server-side and hydrate into the real iframe client-side only.

**Proposal:** A thin `@enterprise/nuxt-iframe-wrapper` module registering the component
globally, with explicit `<ClientOnly>`-equivalent handling built in, plus documented
guidance for SSR frameworks generally (Nuxt, Vite SSR, Quasar) even for consumers not
using the dedicated module.

**Effort:** L · **Impact:** Medium — expands addressable audience but is a genuinely
separate integration surface to maintain long-term.

---

### 12. Visual regression testing (SDS Phase 11, made concrete)

**Gap:** No automated protection today against a CSS or layout regression in the
demo app or the component's own minimal default styles.

**Proposal:** Playwright's built-in screenshot comparison (reusing the E2E suite from
#8) against the demo app's key states: initial load, post-CSS-injection, error state
(once #3 lands), and the auto-height case (once #4 lands).

**Effort:** M-L (mostly maintenance cost over time from baseline churn) · **Impact:**
Medium.

---

### 13. Theme management helpers

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

Items **1, 2, and 5** are small, low-risk, and address real correctness/ergonomics gaps
— a reasonable first follow-up PR. **6** (`useIframeMessage`) is the single highest-leverage
addition if the goal is broader adoption, since it's the most common reason teams
currently reach past this library entirely.
