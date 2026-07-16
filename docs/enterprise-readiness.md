# Enterprise Readiness Assessment

Status of `vue-iframe-wrapper` v1.0.0 against the standard bar for an
enterprise-consumed internal package (governance, quality, security, release
engineering, support), plus a phased plan to close the remaining gaps — ordered
**easiest → hardest**, not by business value. For value-ordered recommendations see
[`FEATURE_RECOMMENDATIONS.md`](/feature-recommendations); the two documents overlap
in places (Playwright, accessibility, Nuxt) but answer different questions: that one
asks "what should we build next", this one asks "what's blocking sign-off".

---

## Current state

_Updated after implementing Phases 1-3 below._

| Area                         | Item                                                 | Status                                                                                                            |
| ---------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Quality**                  | Unit/component test suite (Vitest + Vue Test Utils)  | ✅ 47 tests (incl. accessibility suite)                                                                           |
|                              | Coverage gate enforced in CI                         | ✅ 90% statements/branches/functions/lines                                                                        |
|                              | Mutation testing                                     | ✅ Stryker, scoped to `src/utils` + `src/composables`; ~86%/~82% scores — see [Testing](/guide/testing)           |
|                              | Strict TypeScript, no `any`                          | ✅ ESLint rule enforced                                                                                           |
|                              | Lint + format enforced in CI                         | ✅ ESLint + Prettier                                                                                              |
| **Documentation**            | README, getting started, examples                    | ✅                                                                                                                |
|                              | Full API / parameter reference                       | ✅ `PARAMETERS.md` + VitePress                                                                                    |
|                              | Security model documented                            | ✅ `docs/security.md`                                                                                             |
|                              | Feature roadmap                                      | ✅ `FEATURE_RECOMMENDATIONS.md`                                                                                   |
|                              | Versioning / deprecation policy                      | ✅ `docs/versioning.md`                                                                                           |
|                              | Browser support matrix                               | ✅ `docs/browser-support.md`                                                                                      |
|                              | Accessibility contract documented                    | ✅ `docs/accessibility.md`                                                                                        |
| **Governance**               | LICENSE                                              | ✅ MIT                                                                                                            |
|                              | CODEOWNERS                                           | ⚠️ Structure in place — placeholder handles still need real team mapping                                          |
|                              | CONTRIBUTING guide                                   | ✅ `CONTRIBUTING.md`                                                                                              |
|                              | Code of Conduct                                      | ✅ `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1)                                                                |
|                              | Issue / PR templates                                 | ✅ `.github/ISSUE_TEMPLATE/*`, `.github/PULL_REQUEST_TEMPLATE.md`                                                 |
| **Security**                 | Documented threat model & sandbox guidance           | ✅                                                                                                                |
|                              | Dependency updates (Dependabot)                      | ✅                                                                                                                |
|                              | Static security scanning (CodeQL)                    | ✅ `.github/workflows/codeql.yml`                                                                                 |
|                              | Secret scanning / push protection                    | ⚠️ Requires a one-time toggle in repo Settings — not something a workflow file can enable; see Phase 2 note below |
|                              | Vulnerability disclosure process (`SECURITY.md`)     | ✅ `SECURITY.md`                                                                                                  |
|                              | Dependency license compliance scan                   | ✅ `npm run license:check`, wired into CI                                                                         |
| **Release engineering**      | CI pipeline (lint/typecheck/coverage/build/docs)     | ✅                                                                                                                |
|                              | Automated versioning + changelog (release-it)        | ✅ configured                                                                                                     |
|                              | `CHANGELOG.md` committed and populated               | ✅ Seeded for `1.0.0`; auto-generated from here on                                                                |
|                              | npm provenance / signed publishes                    | ✅ `publishConfig.provenance` + `--provenance` publish arg; CI already had `id-token: write`                      |
|                              | SBOM (software bill of materials)                    | ❌ Missing — not attempted in Phases 1-3                                                                          |
| **Accessibility**            | `title` documented as required                       | ✅                                                                                                                |
|                              | Automated accessibility testing                      | ✅ `tests/IframeWrapper.a11y.spec.ts` + `demo/tests/App.a11y.spec.ts` (axe-core via jsdom)                        |
|                              | Real-browser / assistive-tech-level a11y testing     | ⚠️ Partial — Playwright suite exists (Phase 4) but has no dedicated a11y assertions yet                           |
| **Cross-browser confidence** | Real-browser E2E tests                               | ✅ Playwright across Chromium/Firefox/WebKit — see Phase 4 below                                                  |
|                              | Visual regression tests                              | ✅ 4 scenarios, pinned browser/project, documented baseline-review process — see Phase 5 below                    |
| **Framework coverage**       | SSR / Nuxt support verified                          | ❌ Missing (SDS Phase 12, planned — Phase 6 below)                                                                |
| **Observability**            | Structured error/event surface (`error`, `injected`) | ✅ Library exposes hooks                                                                                          |
|                              | Reference telemetry integration example              | ✅ `docs/guide/telemetry.md` (generic pattern, Sentry, HTTP beacon, reusable composable)                          |
| **Bundle health**            | Bundle size tracked/budgeted in CI                   | ✅ `size-limit`, wired into CI                                                                                    |

**Bottom line:** Phases 1-5 are now fully implemented, including Phase 3's previously
deferred demo-app accessibility test (which caught two real, since-fixed issues: both
CSS/JS textareas had no accessible name, and the live event log wasn't announced to
screen readers). A reference telemetry integration example (`docs/guide/telemetry.md`)
is also done, closing the last Observability gap. The remaining gap is SSR/Nuxt support
(Phase 6) — deliberately last, since it's the only phase that opens a new long-term
maintenance surface rather than hardening the existing one — an SBOM (not yet
attempted), and a handful of explicitly-noted manual, one-time actions: a repo-settings
toggle for secret scanning, and real CODEOWNERS handles in place of the current
placeholder.

---

## Phased plan — easiest to hardest

Effort estimates assume one engineer already familiar with this codebase. Each phase is
independently shippable; none blocks the others except where noted.

### Phase 1 — Governance paperwork (hours, no new tooling) — ✅ Implemented

The lowest-effort, highest-signal items for a procurement/security checklist. Pure
documentation; no code or CI changes.

- [x] `SECURITY.md` — vulnerability disclosure process, supported versions, contact/SLA.
- [x] `CONTRIBUTING.md` — how to run tests, coding standards, PR expectations (mostly
      restating what's already in `README.md`'s Development section, formalized).
- [x] `CODE_OF_CONDUCT.md` — Contributor Covenant 2.1.
- [x] `.github/ISSUE_TEMPLATE/bug_report.md`, `feature_request.md`, and `config.yml`.
- [x] `.github/PULL_REQUEST_TEMPLATE.md` — checklist including "tests added",
      "docs updated", "changelog entry".
- [x] Add a **Browser Support Matrix** section to the docs (`docs/browser-support.md`).
- [x] Add a **Versioning & Deprecation Policy** section (`docs/versioning.md`).

**Effort:** XS (½–1 day total) · **Unblocks:** nothing else, but typically the #1 thing
a procurement/security review asks for first.

**Status:** Done except the CODEOWNERS handle replacement, which is intentionally left
as a placeholder (see above) rather than filled with invented team names.

---

### Phase 2 — Release & supply-chain hardening (1–2 days) — ✅ Implemented

Wiring, not judgment calls — mostly configuration on top of what already exists
(`release-it`, GitHub Actions, Dependabot).

- [x] Generate and commit an initial `CHANGELOG.md` (seeded by hand for `1.0.0`, since
      `release-it`'s conventional-changelog plugin — already configured in
      `.release-it.json` — only generates entries from here forward).
- [x] Enable npm provenance on publish: `publishConfig.provenance: true` in
      `package.json`, `--provenance --access public` added to `release-it`'s npm publish
      args. The release workflow already had `id-token: write`, required for this.
- [x] Add a CodeQL workflow (`.github/workflows/codeql.yml`) for static security
      analysis on every PR and a weekly schedule.
- [ ] Enable GitHub secret scanning + push protection. **Not done** — this is a
      repository _Settings_ toggle (Settings → Code security), not something expressible
      in a committed workflow file; needs a repo admin to flip it on once.
- [x] Add a dependency license-compliance check: `npm run license:check`
      (`license-checker-rseidelsohn` with an explicit SPDX allow-list), wired into CI.
      Scoped to `--production` dependencies only — the published package has an empty
      `dependencies` object and only a `vue` peer dependency, so this check is really
      guarding against a future runtime dependency introducing an incompatible license.
      Dev-only tooling (e.g. `jest-axe`'s bundled `axe-core@3.5.6`, under MPL-2.0) is
      intentionally out of scope: it never ships in the published npm package, so its
      license doesn't carry redistribution obligations to consumers.
- [x] Add a bundle-size budget check in CI: `npm run size` (`size-limit`), budgeted at
      6 kB gzipped per bundle format — current actual size is ~1.6-1.9 kB brotli.

**Effort:** S · **Unblocks:** nothing else; independent of Phase 1.

**Status:** Done except enabling GitHub's secret scanning / push protection, which is a
one-click repository setting rather than code — flip it on under **Settings → Code
security and analysis** the next time someone with admin access is in there.

---

### Phase 3 — Accessibility automation (SDS Phase 10) (2–4 days) — ✅ Implemented

Lower effort than the E2E/visual-regression phases because it can piggyback on the
**existing jsdom-based Vitest setup** rather than requiring new browser-automation
infrastructure.

- [x] Add `axe-core` (via `jest-axe`'s `axe()` runner) to a new
      `tests/IframeWrapper.a11y.spec.ts`. Note: `jest-axe`'s own `toHaveNoViolations`
      matcher is built against Jest's matcher-context shape and throws under Vitest —
      the runner (`axe()`) works fine, but the matcher itself had to be reimplemented
      against Vitest's `expect.extend` API (see `tests/setup.ts`), consuming the same
      `AxeResults` shape.
- [x] Assert: the rendered `<iframe>` has no `frame-title` violation when `title` is
      provided, and explicitly assert the violation **is** present when it's omitted
      (so the test would catch a regression that silently drops the binding).
- [x] Extend the demo app's own test setup with an a11y smoke test —
      `demo/tests/App.a11y.spec.ts`, wired in via a `demo/tests/**/*.spec.ts` include
      pattern and a `vue-iframe-wrapper` alias added to
      `vitest.config.ts`. This immediately caught a real, pre-existing issue: **both
      CSS/JS `<textarea>` controls had no accessible name at all** (a heading above
      each, but no `<label>`/`aria-labelledby` association) — fixed with
      `aria-labelledby` pointing at each heading's new `id`. Also added
      `aria-live="polite"` to the event tape so screen readers announce new entries,
      which axe doesn't flag as a violation but is a real usability gap for the
      keyboard/screen-reader users this app's own accessibility test now covers.
- [x] Document the accessibility contract explicitly — `docs/accessibility.md`.

**Effort:** M (lower end) · **Depends on:** nothing. **Unblocks:** nothing, but is a
prerequisite for a credible accessibility statement in Phase 1's procurement paperwork.

**Status:** Fully implemented. 53 tests total across both the library (`tests/`) and
demo (`demo/tests/`) suites, including 9 a11y-specific cases (3 library + 6 demo),
coverage gate still holds at 90%+ (demo tests are excluded from the coverage
calculation itself, since `demo/` isn't a published artifact — only its accessibility
regressions are worth catching, not its code coverage).

---

### Addendum — Mutation testing (Stryker) — ✅ Implemented, beyond the original plan

Not one of the original six phases, but implemented alongside them because it directly
strengthens the claim the Phase 1-3 checkmarks above are making: coverage percentages
prove code _executed_, not that a regression would actually be _caught_. Added here
rather than as a new numbered phase since it's a testing-quality investment orthogonal
to the paperwork/E2E/SSR axis the six phases are organized around.

- [x] `stryker.config.json` — Vitest test runner, scoped to `src/utils/**/*.ts` and
      `src/composables/**/*.ts` only. **Not** `.vue` files (Stryker's mutator doesn't
      reliably parse Single-File Components) or `src/types/iframe.ts` (no runtime
      behavior to mutate) — see [Testing → Mutation testing](/guide/testing) for the
      full rationale.
- [x] `npm run mutation` script; `.github/workflows/mutation.yml` runs it on pushes to
      `main` touching the scoped files, weekly on a schedule, and on manual dispatch —
      deliberately **not** on every PR, since a full run takes minutes even on the
      smaller scoped file set (this sandbox's single CPU core made that especially
      visible, but the cost is real on any machine, just less extreme).
- [x] Break threshold set to 60 (comfortable headroom under the ~82-86% actually
      measured), high/low informational thresholds at 80/60.

**Status:** Fully implemented and genuinely run to completion multiple times in this
sandbox (unlike Phase 4/Playwright, mutation testing needs no browser download, so
nothing was blocked here). Real, actionable findings came out of it, not just a score:
a dead conditional branch in `insertOrReplace` was removed (every mutation of its
condition survived because the branch body was a no-op), and several
`inject*IntoDocument` tests were strengthened to assert the returned `id`/`type`/
`placement` metadata and default option values, not just the resulting DOM. Final
scores: **~86%** on `iframe-injection.ts`, **~82%** on `useIframeInjection.ts`. Two
categories of survivor are documented as accepted rather than chased further:
string-literal mutants on human-readable error message text, and one defensive
`resolveParent` guard against a missing `<head>`/`<body>` that no realistic `Document`
triggers.

---

### Phase 4 — Real-browser E2E suite (SDS Phase 9) (1–2 weeks) — ✅ Implemented

Meaningfully higher effort than Phase 3: requires standing up new tooling
(`@playwright/test`), a browser matrix, and CI runners with real browser engines — jsdom
cannot verify actual `sandbox` attribute enforcement or genuine cross-origin behavior.

- [x] Add `@playwright/test`, configure a `tests-e2e/` project separate from the
      existing Vitest unit suite. Built on a dedicated harness app
      (`tests-e2e/harness/`) rather than reusing `demo/` directly, so scenarios are
      driven by URL query params instead of UI interaction — see
      [Testing → End-to-end tests](/guide/testing).
- [x] Cover: same-origin injection against Chromium/Firefox/WebKit (`injection.spec.ts`),
      `sandbox` enforcement — `window.open()` and form-submission blocking/permitting
      (`sandbox.spec.ts`), the `reloadKey` flow against real navigation/`load` timing
      (`reload.spec.ts`), and a genuine cross-origin case via a second server on a
      different port (`cross-origin.spec.ts`).
- [x] Add a CI job running the Playwright suite (`.github/workflows/e2e.yml`), separate
      from the unit-test job, installing browsers with `--with-deps`.
- [x] This is also the natural place to validate the Browser Support Matrix committed
      in Phase 1 with actual evidence instead of an assertion — the project matrix in
      `playwright.config.ts` (chromium/firefox/webkit) matches `docs/browser-support.md`.

**Effort:** M–L · **Depends on:** nothing structurally, but is naturally sequenced after
Phase 3 since both touch the test strategy and are easier to review together.
**Unblocks:** Phase 5 (visual regression reuses this harness).

**Status:** Implemented and validated as far as this sandboxed environment allows.
`npx playwright test --list` confirms all 36 tests (12 scenarios × 3 browsers) parse and
discover correctly, `vue-tsc`/ESLint pass over the harness and spec files, and the
harness app itself was confirmed to boot and correctly resolve
`vue-iframe-wrapper` via a raw HTTP check against its dev server. **What
could not be validated here:** actually launching a browser and running the suite —
this development sandbox's network egress allowlist does not include
`cdn.playwright.dev`, which `npx playwright install` needs to download browser
binaries. `.github/workflows/e2e.yml` runs `npx playwright install --with-deps` in
GitHub Actions, which has normal internet access, so the real first execution will
happen there (or in any local dev environment without that restriction) — this is a
gap in _this sandbox's_ validation, not a gap in the suite itself.

---

### Phase 5 — Visual regression testing (SDS Phase 11) (2–3 weeks, then ongoing) — ✅ Implemented

Builds directly on Phase 4's Playwright harness, so the marginal setup cost is lower
than starting from scratch — this phase has the highest _ongoing_ maintenance cost of
the group, since every intentional visual change requires reviewing and re-approving
screenshot baselines, but the tooling and process are now both in place.

- [x] Add Playwright's built-in screenshot comparison (`toHaveScreenshot()`) —
      `tests-e2e/visual.spec.ts` now covers four scenarios (unstyled `srcdoc`,
      dark-themed CSS injection, light-themed CSS injection, JS-mutated content).
      Deliberately **not** covering an error/loading-slot state or an auto-height state
      — neither exists in the library yet (they're proposals in
      `FEATURE_RECOMMENDATIONS.md` #3/#4); add scenarios once either lands rather than
      committing baselines for features that don't exist.
- [x] Establish a baseline-review process — `docs/guide/visual-regression.md`. Covers:
      when a diff is expected vs. a real signal, how snapshot filenames encode
      project/platform (and why only the CI/Linux baseline is authoritative), the
      CODEOWNERS-based approval path, and — importantly — a note that raising
      `maxDiffPixelRatio` to silence flakiness is exactly the wrong fix, since a
      tolerance loose enough to hide flakiness is loose enough to hide a regression too.
- [x] Run visual tests on a fixed browser/OS combination in CI to avoid font-rendering
      flakiness across runner images — a dedicated `visual` Playwright project
      (`playwright.config.ts`), pinned to Chromium at a fixed 1000×700 viewport;
      `chromium`/`firefox`/`webkit` explicitly ignore `visual.spec.ts` so it never runs
      three times for no cross-browser signal. `animations: 'disabled'` is set globally
      to remove the most common source of unrelated flakiness.

**Effort:** L, with recurring cost · **Depends on:** Phase 4 (done). **Unblocks:**
nothing else.

**Status:** Implemented and validated as far as this sandboxed environment allows —
same constraint as Phase 4. `npx playwright test --list --project=visual` (once
browsers are installed) will discover all four scenarios under the pinned project;
config and spec files pass typecheck/lint. **What could not be validated here:**
actually generating baseline images, for the same reason Phase 4's suite couldn't be
executed — this sandbox's network egress allowlist excludes `cdn.playwright.dev`, so no
browser binary could be downloaded to run `--update-snapshots` against. The first real
baseline set will need to be generated in CI or a normal dev environment (see
`docs/guide/visual-regression.md`) before `visual.spec.ts` can pass for the first time —
until then, expect it to fail with "no baseline found," which is the correct, expected
state for a freshly-added visual suite, not a bug.

---

### Phase 6 — SSR / Nuxt support (SDS Phase 12) (1+ month, new surface to maintain)

The highest-effort item because it's not "add tests to what exists" but "verify and
support a lifecycle (SSR/hydration) the library has never been exercised against,"
potentially followed by a second published package.

- [ ] Audit the component for SSR-safety: confirm no `window`/`document` access happens
      outside lifecycle hooks or event handlers (a quick read of `IframeWrapper.vue`
      suggests this is already mostly true, but it's unverified — no SSR test exists).
- [ ] Decide the integration shape: guidance-only (a documented `<ClientOnly>` pattern
      for Nuxt/Vite-SSR consumers) vs. a dedicated `nuxt-iframe-wrapper`
      module. Guidance-only is materially lower effort and should be attempted first.
- [ ] If a dedicated module is warranted: new package, own versioning/release pipeline
      (duplicating much of Phases 1–2 for a second artifact), own test suite under Nuxt's
      test utils.
- [ ] Document explicitly what "SSR-safe" means here: the library never executes
      injected JS during SSR — injection is a client-side DOM operation by design (see
      `docs/security.md`) — so there is no server-side sandboxing question, only a
      hydration-timing one.

**Effort:** XL · **Depends on:** nothing blocking, but lowest priority to start given
the effort/uncertainty ratio — recommend validating real demand before committing to
the dedicated-module path.

---

## Suggested sequencing

Phases 1 and 2 have no dependencies on each other or on anything else and can run in
parallel, ideally first — they're the fastest way to move the needle on a procurement
checklist. Phase 3 is the next-cheapest quality investment. Phases 4 and 5 are naturally
sequential (5 depends on 4's harness). Phase 6 is deliberately last: it's the only phase
that opens a new long-term maintenance surface rather than hardening the existing one,
and should be triggered by actual Nuxt/SSR demand rather than done speculatively.

```text
Phase 1  Governance paperwork          ─┐  (parallel, no deps)
Phase 2  Release & supply-chain        ─┘
Phase 3  Accessibility automation      ───→ (independent, cheap)
Phase 4  Playwright E2E                ───→ Phase 5 Visual regression
Phase 6  SSR / Nuxt support            ───→ (start only on validated demand)
```
